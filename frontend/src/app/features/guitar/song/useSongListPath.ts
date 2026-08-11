import { useProjectFeatures } from '@/app/features/glue/features/useProjectFeatures.ts';

// The bare project path (`/app/tribes/:tribeId/projects/:projectId`) resolves to the project's
// own default tab, which is not necessarily the Songs tab -- point at the actual guitar_song
// feature-instance tab instead. Falls back to the bare project path if none is found yet (still
// loading, or the project genuinely has no guitar_song instance).
export const useSongListPath = (tribeId: string | null, projectId: string | null): string => {
  const { features } = useProjectFeatures(projectId);
  const basePath = `/app/tribes/${tribeId}/projects/${projectId}`;
  const songsFeatureId = features.find((f) => f.feature_type === 'guitar_song')?.id;
  return songsFeatureId ? `${basePath}/${songsFeatureId}` : basePath;
};
