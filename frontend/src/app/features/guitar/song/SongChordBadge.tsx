import { ChordDiagram, ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SongChordBadgeProps {
  chord: GuitarChord;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  fontSizePx?: number;
  comment?: string | null;
  isFirst?: boolean;
  isLast?: boolean;
  onRemove?: () => Promise<void>;
  onCommentSave?: (comment: string | null) => Promise<void>;
  onMoveUp?: () => Promise<void>;
  onMoveDown?: () => Promise<void>;
}

export const SongChordBadge: React.FC<SongChordBadgeProps> = ({
  chord, diagramStyle, diagramSize, fontSizePx = 18, comment, isFirst, isLast,
  onRemove, onCommentSave, onMoveUp, onMoveDown,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [commentDraft, setCommentDraft] = useState(comment ?? '');
  useEffect(() => setCommentDraft(comment ?? ''), [comment]);

  const handleConfirmRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
      setConfirmOpen(false);
      setOpen(false);
    } finally {
      setRemoving(false);
    }
  };

  const handleCommentBlur = () => {
    if (onCommentSave && commentDraft !== (comment ?? '')) onCommentSave(commentDraft || null);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {onMoveUp && (
          <ThemedIconButton
            action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: onMoveUp, disabled: isFirst }}
          />
        )}
        {onMoveDown && (
          <ThemedIconButton
            action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: onMoveDown, disabled: isLast }}
          />
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            fontSize: `${fontSizePx}px`,
            fontWeight: 700,
            color: theme.colors.primary,
          }}
        >
          {chord.name}
        </button>
      </div>
      <ThemedModal isOpen={open} onClose={() => setOpen(false)} title={chord.name} size="sm">
        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <ChordDiagram
              frets={chord.frets}
              rootNote={chord.root_note}
              diagramStyle={diagramStyle}
              diagramSize={diagramSize}
            />
            {onCommentSave ? (
              <ThemedInput
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onBlur={handleCommentBlur}
                placeholder={t('guitarSong.detail.commentPlaceholder')}
                style={{ width: '100%' }}
              />
            ) : (
              comment && (
                <div style={{ color: theme.colors.text, fontSize: '13px', opacity: 0.85, fontStyle: 'italic', textAlign: 'center' }}>
                  {comment}
                </div>
              )
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <ThemedButton variant="ghost" fullWidth={false} onClick={() => setOpen(false)}>
                {t('common.close')}
              </ThemedButton>
              {onRemove && (
                <ThemedButton variant="danger" fullWidth={false} onClick={() => setConfirmOpen(true)}>
                  {t('guitarSong.detail.removeChord')}
                </ThemedButton>
              )}
            </div>
          </div>
        </ModalBody>
      </ThemedModal>
      {onRemove && (
        <ThemedConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmRemove}
          title={t('guitarSong.detail.removeChord')}
          message={t('guitarSong.detail.removeChordConfirm', { name: chord.name })}
          variant="danger"
          isLoading={removing}
        />
      )}
    </>
  );
};
