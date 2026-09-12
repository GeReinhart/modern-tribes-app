import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import DocumentContentEditor from '@/app/platform/functions/documents/editor/DocumentContentEditor.tsx';
import { highlightHtml } from '@/app/platform/functions/search/highlight.utils.ts';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JournalLabelPicker from './JournalLabelPicker.tsx';
import { journalService } from './service.ts';
import type { JournalBlock, JournalLabel } from './types.ts';

interface Props {
  block: JournalBlock;
  labels: JournalLabel[];
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  searchQuery?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (contentHtml: string) => Promise<boolean>;
  onDelete: () => Promise<void>;
  onToggleLabel: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onUpdateLabel: (labelId: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
  onReorderLabel: (orderedIds: string[]) => Promise<void>;
}

const JournalBlockCard: React.FC<Props> = ({
  block, labels, canEdit, isFirst, isLast, searchQuery,
  onMoveUp, onMoveDown, onSave, onDelete, onToggleLabel, onCreateLabel,
  onUpdateLabel, onDeleteLabel, onReorderLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);

  const blockLabels = labels.filter(l => block.label_ids.includes(l.id));

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
            <JournalLabelPicker
              labels={labels}
              activeLabelIds={block.label_ids}
              onToggle={onToggleLabel}
              onCreateLabel={onCreateLabel}
              onUpdateLabel={onUpdateLabel}
              onDeleteLabel={onDeleteLabel}
              onReorderLabel={onReorderLabel}
            />
            <button type="button" onClick={() => setEditing(true)} title={t('journal.editBlock')}
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
            <DocumentContentEditor
              content={block.content_html ?? ''}
              onSave={onSave}
              fetchRevisions={() => journalService.listBlockDocumentRevisions(block.id)}
              onDone={() => setEditing(false)}
              minHeight={160}
              compact
            />
          ) : (
            <>
              <div
                className="prose max-w-none"
                style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, cursor: canEdit ? 'pointer' : 'default' }}
                dangerouslySetInnerHTML={{ __html: searchQuery ? highlightHtml(block.content_html ?? '', searchQuery) : (block.content_html ?? '') }}
                onClick={canEdit ? () => setEditing(true) : undefined}
              />
              {searchQuery && (
                <style>{`mark { background-color: ${theme.colors.primary}30; color: ${theme.colors.primary}; border-radius: 2px; padding: 0 2px; }`}</style>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalBlockCard;
