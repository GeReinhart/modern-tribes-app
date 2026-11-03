// Captures *why* a session was forcibly ended (session expired, refresh token rejected,
// user deleted server-side...) so the login page can show it instead of silently bouncing
// the user back with no explanation. Backed by sessionStorage so it survives the redirect
// navigation to /auth/login, and is cleared once read so it never resurfaces later.
const KEY = 'session_end_reason';

export function setSessionEndReason(reason: string, keepExisting = false): void {
  try {
    if (keepExisting && sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, reason);
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — the reason just won't show.
  }
}

export function consumeSessionEndReason(): string | null {
  try {
    const reason = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return reason;
  } catch {
    return null;
  }
}
