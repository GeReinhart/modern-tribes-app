// A UUID, or a purely numeric id, identifies one specific record rather than a page *type* --
// replacing those segments lets every instance of the same standalone page (e.g. every song's
// presentation view) share one remembered toolbar layout, the same way a tab type does.
const ID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^\d+$/i;

// Fallback "tab type key" for a standalone page (no TabActionsProvider ancestor), so the
// "configure toolbar" action and its persisted layout are available there too, keyed by the
// page's route shape rather than by tab type.
export function derivePageKey(pathname: string): string {
  const shape = pathname
    .split('/')
    .map((segment) => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
  return `page:${shape}`;
}
