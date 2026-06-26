import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import TaskContentPopup from '@/app/features/tasks/TaskContentPopup.tsx';
import type { TaskLabelInfo } from '@/app/features/tasks/types.ts';
import MyTasksCardContent from './MyTasksCardContent.tsx';
import { fibColor, urgencyColor } from '@/app/features/tasks/types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { PersonOption } from '@/app/features/tasks/types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { MyTask } from './types.ts';

interface Props {
  task: MyTask;
  persons: PersonOption[];
  onMarkDone: () => Promise<void>;
}

function buildSourcePath(task: MyTask): string {
  if (!task.tribe_url_param_id || !task.project_url_param_id) return `/app/tribes`;
  return `/app/tribes/${task.tribe_url_param_id}/projects/${task.project_url_param_id}/${task.feature_instance_id}?taskId=${task.id}`;
}

const MyTasksCard: React.FC<Props> = ({ task, persons, onMarkDone }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);

  const borderColor = task.size ? fibColor(task.size) : theme.colors.border;
  const uc = urgencyColor(task.due_date, task.size);
  const overdue =
    new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString());
  const labels: TaskLabelInfo[] = task.labels.map((l) => ({
    ...l,
    feature_instance_id: task.feature_instance_id,
  }));
  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  const statusLabel =
    task.source === 'todo' ? t('dashboard.tasks.todoStatus') : task.column_name;

  return (
    <>
      <div
        style={{
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${theme.colors.border}`,
          borderLeft: `3px solid ${borderColor}`,
          marginBottom: 'var(--space-sm)',
          backgroundColor: theme.colors.surface,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xs)',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 'var(--font-lg)',
                fontWeight: 500,
                color: theme.colors.text,
                lineHeight: 1.4,
              }}
            >
              {task.title}
            </span>
            <button
              onClick={() => setConfirmDone(true)}
              title={t('dashboard.tasks.markDone')}
              style={{
                background: 'none',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7,
                flexShrink: 0,
              }}
            >
              <ThemedSvgIcon name="check" color={theme.colors.text} size={16} />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? t('features.kanban.hideContent') : t('features.kanban.showContent')}
              style={{
                background: 'none',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.75,
                flexShrink: 0,
              }}
            >
              <ThemedSvgIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.text} size={16} />
            </button>
            <button
              onClick={() => navigate(buildSourcePath(task))}
              title={t('dashboard.tasks.openSource')}
              style={{
                background: 'none',
                border: `1px solid ${theme.colors.primary}44`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.85,
                flexShrink: 0,
              }}
            >
              <ThemedSvgIcon name="external-link" color={theme.colors.primary} size={16} />
            </button>
          </div>
          <div
            style={{
              fontSize: 'var(--font-xxs)',
              color: theme.colors.secondary,
              lineHeight: 1.3,
            }}
          >
            {task.tribe_name && <span>{task.tribe_name} › </span>}
            <span>{task.project_name}</span>
            <span style={{ opacity: 0.7 }}>
              {' '}
              · {task.feature_instance_name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <span
              style={{
                fontSize: 'var(--font-xxs)',
                fontWeight: 600,
                padding: 'var(--space-xs)',
                borderRadius: 'var(--radius-md)',
                background: theme.colors.secondary + '22',
                color: theme.colors.secondary,
                flexShrink: 0,
              }}
            >
              {statusLabel}
            </span>
            <div style={{ flex: 1 }} />
            {task.size && (
              <span
                style={{
                  fontSize: 'var(--font-xxs)',
                  fontWeight: 700,
                  padding: 'var(--space-xs)',
                  borderRadius: 'var(--radius-md)',
                  background: fibColor(task.size),
                  color: theme.colors.surface,
                  flexShrink: 0,
                }}
              >
                {task.size}
              </span>
            )}
            <span
              style={{
                fontSize: 'var(--font-xxs)',
                fontWeight: 600,
                padding: 'var(--space-xs)',
                borderRadius: 'var(--radius-md)',
                background: overdue ? uc : uc + '28',
                color: overdue ? '#fff' : uc,
                flexShrink: 0,
              }}
            >
              {task.due_date}
            </span>
            {task.assigned_person_name && persons.length > 1 && (
              <span
                style={{
                  fontSize: 'var(--font-xs)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  borderRadius: 'var(--radius-lg)',
                  background: theme.colors.primary + '22',
                  color: theme.colors.primary,
                  fontWeight: 600,
                  border: `1px solid ${theme.colors.primary}44`,
                  whiteSpace: 'nowrap',
                }}
              >
                {getInitials(task.assigned_person_name)}
              </span>
            )}
          </div>
        </div>
        {expanded && (
          <MyTasksCardContent
            documentContentHtml={task.document_content_html}
            labels={labels}
            onOpenPopup={() => setPopupOpen(true)}
          />
        )}
      </div>

      <ThemedConfirmDialog
        isOpen={confirmDone}
        onClose={() => setConfirmDone(false)}
        onConfirm={() => {
          onMarkDone();
          setConfirmDone(false);
        }}
        title={t('dashboard.tasks.markDone')}
        message={t('dashboard.tasks.markDoneConfirm', { title: task.title })}
        confirmText={t('dashboard.tasks.markDone')}
        cancelText={t('common.cancel')}
      />

      {popupOpen && (
        <TaskContentPopup
          title={task.title}
          documentContentHtml={task.document_content_html}
          labels={labels}
          size={task.size}
          dueDate={task.due_date}
          assignedPersonName={task.assigned_person_name}
          canEdit={false}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
};

export default MyTasksCard;
