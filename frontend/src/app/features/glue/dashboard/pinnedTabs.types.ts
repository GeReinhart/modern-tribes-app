export interface PinnedTab {
  id: string;
  bookmark_id: string;
  page_path: string;
  page_title: string;
  display_order: number;
}

export interface PinnedTabsResponse {
  pinned_tabs: PinnedTab[];
}

export interface PinnedTabCreate {
  bookmark_id: string;
}

export const PINNED_TAB_KEY_PREFIX = 'pinned:';

export function makePinnedTabKey(bookmarkId: string): string {
  return `${PINNED_TAB_KEY_PREFIX}${bookmarkId}`;
}

export function parsePinnedTabKey(key: string): string | null {
  if (!key.startsWith(PINNED_TAB_KEY_PREFIX)) return null;
  return key.slice(PINNED_TAB_KEY_PREFIX.length);
}

const PROJECT_FEATURE_PATH_RE =
  /^\/app\/tribes\/([^/]+)\/projects\/([^/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export interface ProjectFeaturePathParams {
  tribeId: string;
  projectId: string;
  featureInstanceId: string;
}

export function parseProjectFeaturePath(path: string): ProjectFeaturePathParams | null {
  const match = PROJECT_FEATURE_PATH_RE.exec(path);
  if (!match) return null;
  return { tribeId: match[1], projectId: match[2], featureInstanceId: match[3] };
}

export function isProjectFeaturePath(path: string): boolean {
  return PROJECT_FEATURE_PATH_RE.test(path);
}
