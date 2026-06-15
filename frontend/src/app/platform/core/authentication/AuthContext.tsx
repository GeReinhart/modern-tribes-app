import { getAPIBaseUrl } from '@/app/platform/core/env.ts';
import i18n from '@/app/platform/core/i18n';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { authService } from './authentication-service.ts';
import { tokenManager } from './tokenManager.ts';
import { useProactiveTokenRefresh } from './useProactiveTokenRefresh.ts';

interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  language: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    tokenManager.getAccessToken(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchUser = useCallback(
    async (accessToken: string, allowRefresh = true) => {
      try {
        const response = await fetch(`${getAPIBaseUrl()}/platform/core/authentication/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (userData.language) {
            i18n.changeLanguage(userData.language);
            localStorage.setItem('user_language', userData.language);
          }
          return;
        }
        if (
          (response.status === 401 || response.status === 403) &&
          allowRefresh
        ) {
          const newToken = await tokenManager.tryRefresh();
          if (newToken) {
            await fetchUser(newToken, false);
            return;
          }
        }
        // Token definitively rejected and refresh unavailable — clear session.
        tokenManager.clearAll();
        setToken(null);
      } catch {
        // Network error or CORS failure — token may still be valid.
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Called by tokenManager when api.service.ts encounters a 401.
  const doRefresh = useCallback(async (): Promise<string | null> => {
    const storedRefresh = tokenManager.getRefreshToken();
    if (!storedRefresh) return null;
    try {
      const data = await authService.refreshToken(storedRefresh);
      tokenManager.setAccessToken(data.access_token);
      tokenManager.setRefreshToken(data.refresh_token);
      setToken(data.access_token);
      return data.access_token;
    } catch (err) {
      // Only clear the session on a definitive auth rejection (401/403).
      // Network errors and 5xx are transient — keep tokens so the next attempt can retry.
      const status = (err as Error & { status?: number }).status;
      if (status === 401 || status === 403) {
        tokenManager.clearAll();
        setToken(null);
        setUser(null);
      }
      return null;
    }
  }, []);

  useProactiveTokenRefresh(token);

  useEffect(() => {
    tokenManager.setRefresher(doRefresh);
  }, [doRefresh]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      fetchUser(accessToken);
      return;
    }

    // Access token absent or expired — try to restore session via refresh token.
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      tokenManager.tryRefresh().then((newToken) => {
        if (newToken) {
          fetchUser(newToken);
        } else {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, [fetchUser, doRefresh]);

  const login = useCallback(
    async (accessToken: string, refreshToken: string) => {
      tokenManager.setAccessToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);
      setToken(accessToken);
      await fetchUser(accessToken);
    },
    [fetchUser],
  );

  const logout = async () => {
    const currentToken = tokenManager.getAccessToken();
    if (currentToken) {
      try {
        await fetch(`${getAPIBaseUrl()}/platform/core/authentication/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // best-effort
      }
    }
    tokenManager.clearAll();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
