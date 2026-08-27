import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserProjectsByTribe } from '@/app/features/tribes-projects/projects/useProjects.ts';
import type { UserPersonPositionTribe } from '@/app/features/tribes-projects/tribes/tribes.query.types.ts';

import { useInstanceOptions } from './useAllFeatureInstances.ts';

type Theme = ReturnType<typeof useTheme>['theme'];

function linkButtonStyle(theme: Theme): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    padding: 0,
    color: theme.colors.primary,
    cursor: 'pointer',
    fontSize: 'var(--font-sm)',
    textDecoration: 'underline',
  };
}

interface QuickAddTypeSectionProps {
  title: string;
  userId: string;
  tribes: UserPersonPositionTribe[];
  featureTypes: string[];
  currentInstanceId: string | null;
  currentLabel: string | null;
  onSet: (instanceId: string | null) => Promise<void>;
}

export const QuickAddTypeSection: React.FC<QuickAddTypeSectionProps> = ({
  title,
  userId,
  tribes,
  featureTypes,
  currentInstanceId,
  currentLabel,
  onSet,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editing, setEditing] = useState(!currentInstanceId);
  const [tribeId, setTribeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const { projects } = useUserProjectsByTribe(tribeId, userId);
  const instances = useInstanceOptions(projectId, featureTypes);

  const tribeOptions: SelectOption[] = tribes.map((tr) => ({ value: tr.tribe_id, label: tr.tribe_name }));
  const projectOptions: SelectOption[] = projects.map((p) => ({ value: p.project_id, label: p.project_name }));
  const instanceOptions: SelectOption[] = instances.map((i) => ({ value: i.id, label: i.name ?? '' }));

  const handlePickInstance = async (instanceId: string) => {
    if (!instanceId) return;
    await onSet(instanceId);
    setEditing(false);
  };

  const handleClear = async () => {
    await onSet(null);
    setTribeId('');
    setProjectId('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: theme.colors.text }}>{title}</span>

      {!editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}>
            {currentLabel ?? t('dashboard.quickAddDefaults.none')}
          </span>
          <button type="button" onClick={() => setEditing(true)} style={linkButtonStyle(theme)}>
            {t('dashboard.quickAddDefaults.change')}
          </button>
          {currentInstanceId && (
            <button type="button" onClick={handleClear} style={linkButtonStyle(theme)}>
              {t('dashboard.quickAddDefaults.clear')}
            </button>
          )}
        </div>
      )}

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <ThemedSelect
            placeholder={t('dashboard.quickAddDefaults.selectTribe')}
            options={tribeOptions}
            value={tribeId}
            onChange={(v) => { setTribeId(v); setProjectId(''); }}
            allowEmpty={false}
          />
          <ThemedSelect
            placeholder={t('dashboard.quickAddDefaults.selectProject')}
            options={projectOptions}
            value={projectId}
            onChange={setProjectId}
            disabled={!tribeId}
            allowEmpty={false}
          />
          <ThemedSelect
            placeholder={t('dashboard.quickAddDefaults.selectInstance')}
            options={instanceOptions}
            value=""
            onChange={handlePickInstance}
            disabled={!projectId}
            allowEmpty={false}
          />
        </div>
      )}
    </div>
  );
};
