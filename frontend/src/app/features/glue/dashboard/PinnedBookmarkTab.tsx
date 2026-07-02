import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { getFeatureComponent } from '@/app/features/glue/registry.ts';
import { projectFeaturesService } from '@/app/features/tribes-projects/projects/project-features.service.ts';
import { useUserProjectsByTribe } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ProjectFeaturePathParams } from './pinnedTabs.types.ts';

interface PinnedBookmarkTabProps {
  pagePath: string;
  pathParams: ProjectFeaturePathParams;
  pinnedTabId: string;
  onUnpin: (pinnedTabId: string) => Promise<void>;
}

export const PinnedBookmarkTab: React.FC<PinnedBookmarkTabProps> = ({
  pagePath,
  pathParams,
  pinnedTabId,
  onUnpin,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useCurrentUserProfile();
  const { tribeId, projectId, featureInstanceId } = pathParams;

  const [featureType, setFeatureType] = useState<string | null>(null);
  const [featureError, setFeatureError] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(true);

  const { projects: tribeProjects, loading: positionLoading } = useUserProjectsByTribe(
    tribeId,
    user?.id ?? '',
    { enabled: !!user?.id },
  );

  useEffect(() => {
    setFeatureLoading(true);
    setFeatureError(false);
    projectFeaturesService
      .listByProject(projectId, 'active')
      .then((features) => {
        const match = features.find((f) => f.id === featureInstanceId);
        if (match) {
          setFeatureType(match.feature_type);
        } else {
          setFeatureError(true);
        }
      })
      .catch(() => setFeatureError(true))
      .finally(() => setFeatureLoading(false));
  }, [projectId, featureInstanceId]);

  const { canEdit, isManager } = useMemo(() => {
    const rows = tribeProjects.filter((r) => r.project_url_param_id === projectId);
    const positions = rows.map((r) => r.effective_position).filter(Boolean);
    return {
      isManager: positions.some((p) => p === 'manager'),
      canEdit: positions.some((p) => p === 'manager' || p === 'member'),
    };
  }, [tribeProjects, projectId]);

  const FeatureComponent = featureType ? getFeatureComponent(featureType) : null;

  if (featureLoading || positionLoading) {
    return (
      <ThemedSection themeId="main_1">
        <ThemedLoadingSpinner size="sm" />
      </ThemedSection>
    );
  }

  if (featureError || !FeatureComponent) {
    return (
      <ThemedSection themeId="main_1">
        <ThemedText variant="secondary" size="small">
          {t('dashboard.pinnedTab.unavailable')}
        </ThemedText>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <ThemedButton variant="ghost" onClick={() => navigate(pagePath)}>
            {t('bookmarks.open')}
          </ThemedButton>
          <ThemedButton variant="ghost" onClick={() => onUnpin(pinnedTabId)}>
            {t('dashboard.pinnedTab.unpin')}
          </ThemedButton>
        </div>
      </ThemedSection>
    );
  }

  return (
    <FeatureComponent
      featureInstanceId={featureInstanceId}
      canEdit={canEdit}
      isManager={isManager}
    />
  );
};
