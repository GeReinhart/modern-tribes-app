import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ProjectEntry } from '@/app/features/tribes-projects/projects/projects.query.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectCardProps {
  project: ProjectEntry;
  onClick?: (project: ProjectEntry) => void;
}

const getPositionVariant = (
  position: string,
): 'primary' | 'accent' | 'ghost' => {
  if (position === 'manager') return 'accent';
  if (position === 'member') return 'primary';
  return 'ghost';
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedCard variant="primary" bordered>
      <div
        onClick={() => onClick?.(project)}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <ThemedText variant="primary" size="medium" as="h3">
          {project.project_name}
        </ThemedText>

        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          {project.direct_position && (
            <ThemedBadge variant={getPositionVariant(project.direct_position)}>
              {t(`positions.${project.direct_position}`)}
            </ThemedBadge>
          )}
          {project.represented_persons.map((p, i) => (
            <ThemedBadge key={i} variant={getPositionVariant(p.position)}>
              {t(`positions.${p.position}`)} {t('tribes.as')} {p.first_name}{' '}
              {p.last_name}
            </ThemedBadge>
          ))}
        </div>
      </div>
    </ThemedCard>
  );
};
