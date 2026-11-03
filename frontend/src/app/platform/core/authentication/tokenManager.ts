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

const REFRESH_LOCK = 'auth-token-refresh';
// An access token with at least this much life left was just refreshed by another tab.
const FRESH_TOKEN_MIN_MS = 60 * 1000;

function readFreshAccessTokenSince(previous: string | null): string | null {
  const current = localStorage.getItem('access_token');
  if (!current || current === previous) return null;
  const expiresInMs = tokenManager.getTokenExpiresInMs();
  return expiresInMs !== null && expiresInMs > FRESH_TOKEN_MIN_MS ? current : null;
}

// Only one tab at a time may use the single-use refresh token. A tab that waited for the lock
// first checks whether the tab ahead of it already stored a new token, and reuses it.
async function refreshAcrossTabs(): Promise<string | null> {
  const tokenBeforeWaiting = localStorage.getItem('access_token');
  const run = async () =>
    readFreshAccessTokenSince(tokenBeforeWaiting) ?? (await _refresher!());
  if (!navigator.locks) return run();
  return navigator.locks.request(REFRESH_LOCK, run);
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
  // Returns milliseconds until the stored access token expires (negative if already past).
  // Reads the raw token without the expiry-eviction side-effect of getAccessToken().
  getTokenExpiresInMs: (): number | null => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payload = decodeJwtPayload(token.split('.')[1]);
      if (!payload.exp) return null;
      return payload.exp * 1000 - Date.now();
    } catch {
      return null;
    }
  },
  setRefresher: (fn: Refresher): void => {
    _refresher = fn;
  },
  requestPersistentStorage: (): void => {
    navigator.storage?.persist?.().catch(() => undefined);
  },
  // Deduplicates concurrent refresh calls in this tab, and serializes them across tabs.
  tryRefresh: (): Promise<string | null> => {
    if (!_refresher) return Promise.resolve(null);
    if (_refreshPromise) return _refreshPromise;
    _refreshPromise = refreshAcrossTabs().finally(() => {
      _refreshPromise = null;
    });
    return _refreshPromise;
  },
};
