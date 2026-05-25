type Refresher = () => Promise<string | null>;

let _refresher: Refresher | null = null;
let _refreshPromise: Promise<string | null> | null = null;

function decodeJwtPayload(segment: string): { exp?: number } {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  return JSON.parse(atob(padded));
}

// Tokens are only proactively discarded when well past their expiry.
// This buffer deliberately over-tolerates client/server clock skew.
// The server's 401 is the authoritative signal for true expiry.
const CLOCK_SKEW_BUFFER_SECONDS = 5 * 60;

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token.split('.')[1]);
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp + CLOCK_SKEW_BUFFER_SECONDS;
  } catch {
    // Malformed token: don't assume expired; let the server reject it via 401.
    return false;
  }
}

export const tokenManager = {
  getAccessToken: (): string | null => {
    const token = localStorage.getItem('access_token');
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('access_token');
      return null;
    }
    return token;
  },
  setAccessToken: (token: string | null): void => {
    if (token) {
      try {
        localStorage.setItem('access_token', token);
      } catch (e) {
        console.error('[Auth] setAccessToken: localStorage write failed', e);
      }
    } else {
      localStorage.removeItem('access_token');
    }
  },
  getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
  setRefreshToken: (token: string | null): void => {
    if (token) {
      localStorage.setItem('refresh_token', token);
    } else {
      localStorage.removeItem('refresh_token');
    }
  },
  clearAll: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  setRefresher: (fn: Refresher): void => {
    _refresher = fn;
  },
  // Deduplicates concurrent refresh calls — all callers await the same promise.
  tryRefresh: (): Promise<string | null> => {
    if (!_refresher) return Promise.resolve(null);
    if (_refreshPromise) return _refreshPromise;
    _refreshPromise = _refresher().finally(() => {
      _refreshPromise = null;
    });
    return _refreshPromise;
  },
};
