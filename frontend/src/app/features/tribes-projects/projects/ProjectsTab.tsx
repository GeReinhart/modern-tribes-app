import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import {
  ArchivedProjectEntry,
  ProjectEntry,
} from '@/app/features/tribes-projects/projects/projects.query.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface ProjectsTabProps {
  tribeId: string;
  pageThemeCode: string | null;
  activeProjects: ProjectEntry[];
  archivedProjects: ArchivedProjectEntry[];
  reorderingProjects: boolean;
  onProjectMove: (index: number, dir: 'up' | 'down') => void;
  onUnarchive: (projectId: string) => Promise<void>;
}

const ActiveProjectRow: React.FC<{
  project: ProjectEntry;
  index: number;
  total: number;
  reorderingProjects: boolean;
  tribeId: string;
  onMove: (index: number, dir: 'up' | 'down') => void;
}> = ({ project, index, total, reorderingProjects, tribeId, onMove }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: reorderingProjects ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={() => {
        if (!reorderingProjects) {
          navigate(`/app/tribes/${tribeId}/projects/${project.project_url_param_id}`);
        }
      }}
      onMouseEnter={(e) => {
        if (reorderingProjects) return;
        e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
        e.currentTarget.style.borderColor = theme.colors.primary;
      }}
      onMouseLeave={(e) => {
        if (reorderingProjects) return;
        e.currentTarget.style.backgroundColor = theme.colors.surface;
        e.currentTarget.style.borderColor = theme.colors.border;
      }}
    >
      <ThemedText variant="primary" size="small">
        {project.project_name}
      </ThemedText>
      {reorderingProjects && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: index === 0 ? 'default' : 'pointer',
              color: index === 0 ? theme.colors.border : theme.colors.secondary,
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              opacity: index === 0 ? 0.4 : 1,
            }}
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMove(index, 'up'); }}
            title={t('projects.moveUp')}
          >
            <ChevronUp size={16} />
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: index === total - 1 ? 'default' : 'pointer',
              color: index === total - 1 ? theme.colors.border : theme.colors.secondary,
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              opacity: index === total - 1 ? 0.4 : 1,
            }}
            disabled={index === total - 1}
            onClick={(e) => { e.stopPropagation(); onMove(index, 'down'); }}
            title={t('projects.moveDown')}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const ArchivedProjectRow: React.FC<{
  project: ArchivedProjectEntry;
  onUnarchive: (projectId: string) => Promise<void>;
}> = ({ project, onUnarchive }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: theme.colors.surface,
        border: `1px dashed ${theme.colors.border}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: 0.75,
      }}
    >
      <ThemedText variant="secondary" size="small">
        {project.project_name}
      </ThemedText>
      <button
        style={{
          background: 'none',
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: '6px',
          cursor: 'pointer',
          color: theme.colors.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '13px',
          flexShrink: 0,
        }}
        onClick={() => onUnarchive(project.project_id)}
        title={t('projects.reactivate')}
      >
        <RotateCcw size={14} />
        {t('projects.reactivate')}
      </button>
    </div>
  );
};

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  tribeId,
  pageThemeCode,
  activeProjects,
  archivedProjects,
  reorderingProjects,
  onProjectMove,
  onUnarchive,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedSection themeId={pageThemeCode ?? 'main_1'}>
      {activeProjects.length === 0 ? (
        <ThemedText variant="secondary" size="small">
          {t('projects.noProjects')}
        </ThemedText>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeProjects.map((project, index) => (
            <ActiveProjectRow
              key={project.project_id}
              project={project}
              index={index}
              total={activeProjects.length}
              reorderingProjects={reorderingProjects}
              tribeId={tribeId}
              onMove={onProjectMove}
            />
          ))}
        </div>
      )}

      {reorderingProjects && (
        <div style={{ marginTop: '24px' }}>
          <ThemedText variant="secondary" size="small" as="h4">
            {t('projects.archivedProjects')}
          </ThemedText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {archivedProjects.length === 0 ? (
              <ThemedText variant="secondary" size="small">
                {t('projects.noArchivedProjects')}
              </ThemedText>
            ) : (
              archivedProjects.map((project) => (
                <ArchivedProjectRow
                  key={project.project_id}
                  project={project}
                  onUnarchive={onUnarchive}
                />
              ))
            )}
          </div>
        </div>
      )}
    </ThemedSection>
  );
};
