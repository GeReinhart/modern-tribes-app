import { ThemedBadge } from '@/platform/themes/components/ThemedBadge';
import { ThemedCard } from '@/platform/themes/components/ThemedCard';
import { ThemedText } from '@/platform/themes/components/ThemedText';
import { ProjectEntry } from '@/types/queries/projects.query.types';

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
