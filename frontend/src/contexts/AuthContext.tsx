import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getAPIBaseUrl } from '@/config/env';
import { tokenManager } from '@/utils/tokenManager';
import { authService } from '@/services/auth.service';
import i18n from '@/i18n/index';

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
    const [token, setToken] = useState<string | null>(tokenManager.getAccessToken());
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = useRef(false);

    const fetchUser = useCallback(async (accessToken: string) => {
        try {
            const response = await fetch(`${getAPIBaseUrl()}/auth/me`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                if (userData.language) {
                    i18n.changeLanguage(userData.language);
                    localStorage.setItem('user_language', userData.language);
                }
            } else {
                tokenManager.clearAll();
                setToken(null);
            }
        } catch {
            tokenManager.clearAll();
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
        } catch {
            tokenManager.clearAll();
            setToken(null);
            setUser(null);
            return null;
        }
    }, []);

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
            doRefresh().then((newToken) => {
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

    const login = useCallback(async (accessToken: string, refreshToken: string) => {
        tokenManager.setAccessToken(accessToken);
        tokenManager.setRefreshToken(refreshToken);
        setToken(accessToken);
        await fetchUser(accessToken);
    }, [fetchUser]);

    const logout = async () => {
        const currentToken = tokenManager.getAccessToken();
        if (currentToken) {
            try {
                await fetch(`${getAPIBaseUrl()}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${currentToken}` },
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

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
