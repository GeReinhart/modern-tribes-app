interface FeatureInstanceLocation {
  tribe_url_param_id: string | null;
  project_url_param_id: string | null;
  feature_instance_id: string;
}

export function buildFeatureInstancePath(
  location: FeatureInstanceLocation,
  queryParams: Record<string, string> = {},
): string {
  if (!location.tribe_url_param_id || !location.project_url_param_id) return '/app/tribes';
  const path = `/app/tribes/${location.tribe_url_param_id}/projects/${location.project_url_param_id}/${location.feature_instance_id}`;
  const query = new URLSearchParams(queryParams).toString();
  return query ? `${path}?${query}` : path;
}
