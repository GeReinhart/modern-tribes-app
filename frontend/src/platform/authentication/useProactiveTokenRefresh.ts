import { useEffect, useRef } from 'react';

import { tokenManager } from './tokenManager';

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const MIN_SCHEDULE_DELAY_MS = 30_000;

/**
 * Keeps the access token alive indefinitely by:
 * 1. Scheduling a silent refresh shortly before each token expires.
 * 2. Refreshing immediately when the tab becomes visible after a long absence.
 *
 * The timer re-arms itself via the `token` prop: every time AuthContext
 * calls setToken() (on login or after a refresh), this effect re-runs and
 * schedules the next refresh window.
 */
export function useProactiveTokenRefresh(token: string | null): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!token) return;

    const expiresInMs = tokenManager.getTokenExpiresInMs();
    if (expiresInMs === null) return;

    const delayMs = Math.max(
      MIN_SCHEDULE_DELAY_MS,
      expiresInMs - REFRESH_BEFORE_EXPIRY_MS,
    );

    timerRef.current = setTimeout(() => {
      tokenManager.tryRefresh();
      // doRefresh() → setToken() in AuthContext → this effect re-fires → next timer set
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!tokenManager.getRefreshToken()) return;
      const expiresInMs = tokenManager.getTokenExpiresInMs();
      if (expiresInMs === null || expiresInMs < REFRESH_BEFORE_EXPIRY_MS) {
        tokenManager.tryRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
}
