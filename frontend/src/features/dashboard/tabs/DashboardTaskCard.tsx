import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon.tsx';
import TaskItemModal from '@/components/tasks/TaskItemModal.tsx';
import type { TaskLabelInfo, TaskPatch } from '@/components/tasks/types.ts';
import type { PersonOption } from '@/types/features.ts';
import { fibColor, urgencyColor } from '@/types/features.ts';
import type { DashboardTask } from '../types.ts';

interface Props {
    task: DashboardTask;
    persons: PersonOption[];
    canEdit: boolean;
    onUpdate: (patch: TaskPatch) => Promise<void>;
    onToggleLabel: (labelId: string) => Promise<void>;
    onCreateLabel: (data: { feature_instance_id: string; name: string; color: string }) => Promise<TaskLabelInfo | null>;
}

function buildSourcePath(task: DashboardTask): string {
    if (!task.tribe_id) return `/app/tribes`;
    return `/app/tribes/${task.tribe_id}/projects/${task.project_id}/${task.feature_instance_id}`;
}

const DashboardTaskCard: React.FC<Props> = ({
    task, persons, canEdit, onUpdate, onToggleLabel, onCreateLabel,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    const borderColor = task.size ? fibColor(task.size) : theme.colors.border;
    const uc = urgencyColor(task.due_date, task.size);
    const overdue = new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString());
    const labels: TaskLabelInfo[] = task.labels.map(l => ({ ...l, feature_instance_id: task.feature_instance_id }));
    const getInitials = (name: string) =>
        name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

    const handleUpdate = (_id: string, patch: TaskPatch) => onUpdate(patch);
    const handleToggleLabel = (_id: string, labelId: string, _currentLabelIds: string[]) => onToggleLabel(labelId);

    return (
        <>
            <div style={{ borderRadius: '8px', border: `1px solid ${theme.colors.border}`, borderLeft: `3px solid ${borderColor}`, marginBottom: '8px', backgroundColor: theme.colors.surface, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span onClick={() => setModalOpen(true)} style={{ flex: 1, fontSize: 'var(--font-lg)', color: theme.colors.text, cursor: 'pointer', lineHeight: 1.4 }}>
                            {task.title}
                        </span>
                        {canEdit && (
                            <button onClick={() => setModalOpen(true)} title={t('common.edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center', opacity: 0.7, flexShrink: 0 }}>
                                <ThemedSvgIcon name="pencil" color={theme.colors.text} size={12} />
                            </button>
                        )}
                        <button onClick={() => navigate(buildSourcePath(task))} title={t('dashboard.tasks.openSource')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center', opacity: 0.7, flexShrink: 0 }}>
                            <ThemedSvgIcon name="external-link" color={theme.colors.primary} size={12} />
                        </button>
                    </div>
                    <div style={{ fontSize: '10px', color: theme.colors.secondary, lineHeight: 1.3 }}>
                        {task.tribe_name && <span>{task.tribe_name} › </span>}
                        <span>{task.project_name}</span>
                        <span style={{ opacity: 0.7 }}> · {task.feature_instance_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <div style={{ flex: 1 }} />

                        {task.size && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', background: fibColor(task.size), color: theme.colors.surface, flexShrink: 0 }}>
                                {task.size}
                            </span>
                        )}
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '8px', background: overdue ? uc : uc + '28', color: overdue ? '#fff' : uc, flexShrink: 0 }}>
                            {task.due_date}
                        </span>
                        {task.assigned_person_name && persons.length > 1 && (
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '10px', background: theme.colors.primary + '22', color: theme.colors.primary, fontWeight: 600, border: `1px solid ${theme.colors.primary}44`, whiteSpace: 'nowrap' }}>
                                {getInitials(task.assigned_person_name)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {modalOpen && (
                <TaskItemModal
                    value={{ id: task.id, feature_instance_id: task.feature_instance_id, title: task.title, size: task.size, due_date: task.due_date, assigned_person_id: task.assigned_person_id, document_content_html: task.document_content_html, label_ids: task.label_ids }}
                    labels={labels}
                    persons={persons}
                    canEdit={canEdit}
                    canCreateLabel={canEdit}
                    onClose={() => setModalOpen(false)}
                    onUpdate={handleUpdate}
                    onToggleLabel={handleToggleLabel}
                    onCreateLabel={onCreateLabel}
                />
            )}
        </>
    );
};

export default DashboardTaskCard;
