type Refresher = () => Promise<string | null>;

let _refresher: Refresher | null = null;
let _refreshPromise: Promise<string | null> | null = null;

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() / 1000 > (payload.exp ?? 0);
    } catch {
        return true;
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
        token ? localStorage.setItem('access_token', token) : localStorage.removeItem('access_token');
    },
    getRefreshToken: (): string | null => localStorage.getItem('refresh_token'),
    setRefreshToken: (token: string | null): void => {
        token ? localStorage.setItem('refresh_token', token) : localStorage.removeItem('refresh_token');
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
