// Captures *why* a session was forcibly ended (session expired, refresh token rejected,
// user deleted server-side...) so the login page can show it instead of silently bouncing
// the user back with no explanation. Backed by sessionStorage so it survives the redirect
// navigation to /auth/login, and is cleared once read so it never resurfaces later.
const KEY = 'session_end_reason';

export interface SessionEnd {
  reason: string;
  // Raw diagnostics: what failed, with which HTTP status and when.
  technical: string | null;
}

export function buildTechnicalDetail(request: string, status: number | undefined, code: string | null): string {
  const parts = [request, status ? `HTTP ${status}` : null, code, new Date().toISOString()];
  return parts.filter(Boolean).join(' · ');
}

export function setSessionEndReason(reason: string, keepExisting = false, technical: string | null = null): void {
  try {
    if (keepExisting && sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, JSON.stringify({ reason, technical }));
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — the reason just won't show.
  }
}

export function consumeSessionEndReason(): SessionEnd | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as SessionEnd) : null;
  } catch {
    return null;
  }
}
