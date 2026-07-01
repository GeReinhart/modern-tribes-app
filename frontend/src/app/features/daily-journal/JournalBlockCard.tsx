import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JournalLabelPicker from './JournalLabelPicker.tsx';
import type { JournalBlock, JournalLabel } from './types.ts';

interface Props {
  block: JournalBlock;
  labels: JournalLabel[];
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (contentHtml: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onToggleLabel: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
}

const JournalBlockCard: React.FC<Props> = ({
  block, labels, canEdit, isFirst, isLast,
  onMoveUp, onMoveDown, onSave, onDelete, onToggleLabel, onCreateLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content_html ?? '');

  const blockLabels = labels.filter(l => block.label_ids.includes(l.id));

  const handleSave = async () => {
    await onSave(editContent);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditContent(block.content_html ?? '');
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', gap: '0', border: `1px solid ${theme.colors.border}`, borderRadius: '8px', backgroundColor: theme.colors.surface, position: 'relative' }}>

      {/* Left strip: label dots */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 6px', borderRight: `1px solid ${theme.colors.border}`, minWidth: '20px', background: theme.colors.surface, borderRadius: '8px 0 0 8px' }}>
        {blockLabels.map(l => (
          <span key={l.id} title={l.name} style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Action bar */}
        {canEdit && !editing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px 2px', justifyContent: 'flex-end' }}>
            <JournalLabelPicker labels={labels} activeLabelIds={block.label_ids} onToggle={onToggleLabel} onCreateLabel={onCreateLabel} />
            <button type="button" onClick={() => { setEditContent(block.content_html ?? ''); setEditing(true); }} title={t('journal.editBlock')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}>
              <ThemedSvgIcon name="pencil" color={theme.colors.text} size={13} />
            </button>
            <button type="button" onClick={onDelete} title={t('journal.deleteBlock')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}>
              <ThemedSvgIcon name="archive" color={theme.colors.danger} size={13} />
            </button>
            {!isFirst && (
              <button type="button" onClick={onMoveUp} title={t('journal.moveUp')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}>
                <ThemedSvgIcon name="chevron-up" color={theme.colors.text} size={13} />
              </button>
            )}
            {!isLast && (
              <button type="button" onClick={onMoveDown} title={t('journal.moveDown')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}>
                <ThemedSvgIcon name="chevron-down" color={theme.colors.text} size={13} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: canEdit && !editing ? '2px 12px 12px' : '10px 12px 12px' }}>
          {editing ? (
            <>
              <EditorJoditComponent content={editContent} onChange={setEditContent} minHeight={160} compact />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={handleSave}
                  style={{ padding: '6px 16px', borderRadius: '6px', background: theme.colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                  {t('journal.save')}
                </button>
                <button type="button" onClick={handleCancel}
                  style={{ padding: '6px 16px', borderRadius: '6px', background: 'none', color: theme.colors.secondary, border: `1px solid ${theme.colors.border}`, cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                  {t('journal.cancel')}
                </button>
              </div>
            </>
          ) : (
            <div
              className="prose max-w-none"
              style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, cursor: canEdit ? 'pointer' : 'default' }}
              dangerouslySetInnerHTML={{ __html: block.content_html ?? '' }}
              onClick={canEdit ? () => { setEditContent(block.content_html ?? ''); setEditing(true); } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalBlockCard;
