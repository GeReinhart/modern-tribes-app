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
}

const JournalBlockCard: React.FC<Props> = ({
  block, labels, canEdit, isFirst, isLast,
  onMoveUp, onMoveDown, onSave, onDelete, onToggleLabel,
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
    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
      }}
    >
      {/* Header row: labels + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px 4px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
          {blockLabels.map(l => (
            <span
              key={l.id}
              style={{
                padding: '1px 8px', borderRadius: '10px',
                background: l.color, color: '#fff',
                fontSize: '11px', fontWeight: 600,
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
        {canEdit && !editing && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
            <JournalLabelPicker labels={labels} activeLabelIds={block.label_ids} onToggle={onToggleLabel} />
            <button type="button" onClick={() => { setEditContent(block.content_html ?? ''); setEditing(true); }} title={t('journal.editBlock')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.7 }}>
              <ThemedSvgIcon name="pencil" color={theme.colors.text} size={13} />
            </button>
            <button type="button" onClick={onDelete} title={t('journal.deleteBlock')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.7 }}>
              <ThemedSvgIcon name="archive" color={theme.colors.danger} size={13} />
            </button>
            {!isFirst && (
              <button type="button" onClick={onMoveUp} title={t('journal.moveUp')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.7 }}>
                <ThemedSvgIcon name="chevron-up" color={theme.colors.text} size={13} />
              </button>
            )}
            {!isLast && (
              <button type="button" onClick={onMoveDown} title={t('journal.moveDown')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.7 }}>
                <ThemedSvgIcon name="chevron-down" color={theme.colors.text} size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '4px 12px 12px' }}>
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
  );
};

export default JournalBlockCard;
