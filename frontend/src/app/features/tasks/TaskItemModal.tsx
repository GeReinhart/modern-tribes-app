import { EntityAuditUserBadge } from '@/app/platform/functions/people/users/EntityAuditUserBadge.tsx';
import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { highlightHtml } from './highlightHtml.ts';
import TaskItemModalMeta from './TaskItemModalMeta.tsx';
import type { TaskItemModalProps, TaskLabelInfo, TaskPatch } from './types.ts';

interface Props extends TaskItemModalProps {
  highlightToken?: string;
}

const TaskItemModal: React.FC<Props> = ({
  value, labels, persons, canEdit, canCreateLabel,
  onClose, onUpdate, onToggleLabel, onCreateLabel, highlightToken,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [title, setTitle] = useState(value.title);
  const [assigneeId, setAssigneeId] = useState(value.assigned_person_id ?? '');
  const [size, setSize] = useState<number | null>(value.size);
  const [dueDate, setDueDate] = useState(value.due_date ?? '');
  const [notes, setNotes] = useState(value.document_content_html ?? '');
  const [forceOnDashboard, setForceOnDashboard] = useState(value.force_on_dashboard ?? false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localLabelIds, setLocalLabelIds] = useState<string[]>(value.label_ids);
  const [allLabels, setAllLabels] = useState<TaskLabelInfo[]>(labels);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px', backgroundColor: theme.colors.surface,
    color: theme.colors.text, fontSize: 'var(--font-sm)', boxSizing: 'border-box',
  };

  const handleSave = async () => {
    setSaving(true);
    const patch: TaskPatch = {};
    if (title.trim() && title.trim() !== value.title) patch.title = title.trim();
    if (size !== value.size) { if (size === null) patch.clear_size = true; else patch.size = size; }
    if (notes !== (value.document_content_html ?? '')) patch.document_content_html = notes;
    if (assigneeId !== (value.assigned_person_id ?? '')) {
      if (!assigneeId) patch.clear_assignee = true; else patch.assigned_person_id = assigneeId;
    }
    if (dueDate !== (value.due_date ?? '')) {
      if (!dueDate) patch.clear_due_date = true; else patch.due_date = dueDate;
    }
    if (forceOnDashboard !== (value.force_on_dashboard ?? false)) patch.force_on_dashboard = forceOnDashboard;
    if (Object.keys(patch).length > 0) await onUpdate(value.id, patch);
    setSaving(false);
    onClose();
  };

  const handleToggle = (labelId: string) => {
    setLocalLabelIds((prev) => prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]);
    onToggleLabel(value.id, labelId, localLabelIds);
  };

  const handleLabelCreated = (label: TaskLabelInfo) => {
    setAllLabels((prev) => [...prev, label]);
    setLocalLabelIds((prev) => [...prev, label.id]);
    onToggleLabel(value.id, label.id, localLabelIds);
  };

  const notesHtml = highlightToken ? highlightHtml(notes, highlightToken) : notes;

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '8px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: theme.colors.surface, borderRadius: '14px', border: `1px solid ${theme.colors.border}`, width: '98vw', maxWidth: '98vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px 14px', borderBottom: `1px solid ${theme.colors.border}` }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditing}
            style={{ ...inputStyle, flex: 1, fontSize: 'var(--font-md)', fontWeight: 600, border: isEditing ? `1px solid ${theme.colors.border}` : 'none', background: isEditing ? theme.colors.surface : 'transparent', padding: isEditing ? '6px 10px' : '6px 0' }}
            placeholder={t('features.kanban.addCardPlaceholder')}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ThemedSvgIcon name="x" color={theme.colors.secondary} size={20} />
          </button>
        </div>
        {highlightToken && (
          <div style={{ padding: '6px 20px', backgroundColor: `${theme.colors.primary}15`, borderBottom: `1px solid ${theme.colors.border}`, fontSize: 'var(--font-xs)', color: theme.colors.primary }}>
            {t('search.highlightBanner', { token: highlightToken })}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <TaskItemModalMeta
            allLabels={allLabels}
            localLabelIds={localLabelIds}
            canEdit={isEditing}
            canCreateLabel={canCreateLabel && isEditing}
            featureInstanceId={value.feature_instance_id}
            persons={persons}
            assigneeId={assigneeId}
            onAssigneeChange={setAssigneeId}
            size={size}
            onSizeChange={setSize}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            onToggle={handleToggle}
            onCreateLabel={onCreateLabel}
            onLabelCreated={handleLabelCreated}
          />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', color: theme.colors.secondary }}>
              {t('features.kanban.notes')}
            </div>
            {isEditing ? (
              <EditorJoditComponent content={notes} onChange={setNotes} minHeight={320} compact />
            ) : notesHtml ? (
              <div className="prose max-w-none" style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: notesHtml }} />
            ) : (
              <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>{t('features.kanban.noDocument')}</div>
            )}
          </div>
          {value.created_by && value.created_at && value.updated_at && (
            <EntityAuditUserBadge createdBy={value.created_by} updatedBy={value.updated_by ?? null} createdAt={value.created_at} updatedAt={value.updated_at} />
          )}
          {isEditing && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={forceOnDashboard}
                onChange={(e) => setForceOnDashboard(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: theme.colors.primary, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, fontWeight: 600 }}>
                {t('common.forceOnDashboard')}
              </span>
            </label>
          )}
          {!isEditing && forceOnDashboard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)', color: theme.colors.primary, fontWeight: 600 }}>
              <span>📌</span>
              <span>{t('common.forceOnDashboard')}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '14px 20px', borderTop: `1px solid ${theme.colors.border}`, gap: '8px' }}>
          {isEditing ? (
            <>
              <ThemedButton variant="ghost" onClick={() => setIsEditing(false)} disabled={saving} leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}>
                {t('common.cancel')}
              </ThemedButton>
              <ThemedButton variant="primary" onClick={handleSave} disabled={saving || !title.trim()} leftIcon={<ThemedSvgIcon name="save" color="currentColor" size={16} />}>
                {saving ? t('common.saving') : t('common.save')}
              </ThemedButton>
            </>
          ) : (
            <>
              <ThemedButton variant="ghost" onClick={onClose} leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}>
                {t('common.close')}
              </ThemedButton>
              {canEdit && (
                <ThemedButton variant="primary" onClick={() => setIsEditing(true)}>
                  {t('common.edit')}
                </ThemedButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItemModal;
