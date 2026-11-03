// The API's `detail` is either a plain string or, for authentication failures, an object with a
// stable machine-readable `code` and a human `message` (e.g. refresh_token_reused).
export interface ApiDetail {
  code: string | null;
  message: string;
}

export function parseApiDetail(detail: unknown): ApiDetail | null {
  if (typeof detail === 'string') return { code: null, message: detail };
  if (detail && typeof detail === 'object') {
    const { code, message } = detail as { code?: unknown; message?: unknown };
    if (typeof message === 'string') {
      return { code: typeof code === 'string' ? code : null, message };
    }
  }
  return null;
}

export function formatApiDetail(detail: unknown): string | null {
  const parsed = parseApiDetail(detail);
  if (!parsed) return null;
  return parsed.code ? `${parsed.message} (${parsed.code})` : parsed.message;
}
