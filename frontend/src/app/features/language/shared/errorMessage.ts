export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Error';
}

export function isNotFoundError(e: unknown): boolean {
  return e instanceof Error && (e as Error & { status?: number }).status === 404;
}
