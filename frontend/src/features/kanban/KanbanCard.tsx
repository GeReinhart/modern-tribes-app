import {
  IconName,
  ThemedSvgIcon,
} from '@/platform/core/layout/themes/icons/ThemedSvgIcon';
import { ThemedConfirmDialog } from '@/platform/core/layout/themes/components/ThemedConfirmDialog';
import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import KanbanCardBadges from './KanbanCardBadges';
import KanbanCardBody from './KanbanCardBody';
import KanbanCardHeader from './KanbanCardHeader';
import KanbanCardModal from './KanbanCardModal';
import {
  KanbanCard as Card,
  CardUpdate,
  KanbanLabel,
  LabelCreate,
  PersonOption,
  ReorderDirection,
  fibColor,
} from './types';

interface Props {
  card: Card;
  canEdit: boolean;
  isFirstCol: boolean;
  isLastCol: boolean;
  isFirstInCol: boolean;
  isLastInCol: boolean;
  accentColor: string;
  boardLabels: KanbanLabel[];
  persons: PersonOption[];
  onUpdate: (cardId: string, data: CardUpdate) => Promise<void>;
  onArchive: (cardId: string) => Promise<void>;
  onRestore: (cardId: string) => Promise<void>;
  onMove: (cardId: string, direction: 'prev' | 'next') => Promise<void>;
  onReorder: (cardId: string, direction: ReorderDirection) => Promise<void>;
  onToggleLabel: (
    cardId: string,
    labelId: string,
    currentLabelIds: string[],
  ) => Promise<void>;
  onCreateLabel: (data: LabelCreate) => Promise<KanbanLabel | null>;
}

interface MoveButtonProps {
  disabled: boolean;
  onClick: () => void;
  icon: IconName;
  color: string;
  title?: string;
}

const MoveButton: React.FC<MoveButtonProps> = ({
  disabled,
  onClick,
  icon,
  color,
  title,
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    title={title}
    style={{
      background: 'none',
      border: 'none',
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.2 : 1,
      padding: '0 2px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <ThemedSvgIcon name={icon} color={color} size={14} />
  </button>
);

const KanbanCard: React.FC<Props> = ({
  card,
  canEdit,
  isFirstCol,
  isLastCol,
  isFirstInCol,
  isLastInCol,
  accentColor,
  boardLabels,
  persons,
  onUpdate,
  onArchive,
  onRestore,
  onMove,
  onReorder,
  onToggleLabel,
  onCreateLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isArchived = card.status === 'archived';
  const borderColor = card.size ? fibColor(card.size) : accentColor;
  const showMoveControls = canEdit && !isArchived;

  return (
    <>
      <div style={{ marginBottom: '4px' }}>
        {showMoveControls && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingRight: '18px',
              gap: 2,
            }}
          >
            <MoveButton
              disabled={isFirstInCol}
              onClick={() => onReorder(card.id, 'top')}
              icon="chevrons-up"
              color={theme.colors.text}
              title={t('features.kanban.moveToTop')}
            />
            <MoveButton
              disabled={isFirstInCol}
              onClick={() => onReorder(card.id, 'up')}
              icon="arrow-up"
              color={theme.colors.text}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {showMoveControls && (
            <MoveButton
              disabled={isFirstCol}
              onClick={() => onMove(card.id, 'prev')}
              icon="arrow-left"
              color={theme.colors.primary}
            />
          )}
          <div
            style={{
              flex: 1,
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `3px solid ${borderColor}`,
              backgroundColor: isArchived
                ? `${theme.colors.surface}88`
                : theme.colors.surface,
              boxShadow: 'var(--shadow-sm)',
              opacity: isArchived ? 0.65 : 1,
            }}
          >
            <div
              style={{
                padding: 'var(--space-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
              }}
            >
              <KanbanCardHeader
                card={card}
                canEdit={canEdit}
                expanded={expanded}
                onOpenModal={() => setModalOpen(true)}
                onRequestArchive={() => setConfirmArchive(true)}
                onRestore={() => onRestore(card.id)}
                onToggleExpand={() => setExpanded((v) => !v)}
              />
              <KanbanCardBadges
                card={card}
                boardLabels={boardLabels}
                persons={persons}
                accentColor={accentColor}
                expanded={expanded}
              />
            </div>
            {expanded && (
              <KanbanCardBody card={card} boardLabels={boardLabels} />
            )}
          </div>
          {showMoveControls && (
            <MoveButton
              disabled={isLastCol}
              onClick={() => onMove(card.id, 'next')}
              icon="arrow-right"
              color={theme.colors.primary}
            />
          )}
        </div>

        {showMoveControls && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              paddingLeft: '18px',
              gap: 2,
            }}
          >
            <MoveButton
              disabled={isLastInCol}
              onClick={() => onReorder(card.id, 'down')}
              icon="arrow-down"
              color={theme.colors.text}
            />
            <MoveButton
              disabled={isLastInCol}
              onClick={() => onReorder(card.id, 'bottom')}
              icon="chevrons-down"
              color={theme.colors.text}
              title={t('features.kanban.moveToBottom')}
            />
          </div>
        )}
      </div>

      {modalOpen && (
        <KanbanCardModal
          card={card}
          boardLabels={boardLabels}
          persons={persons}
          canEdit={canEdit && !isArchived}
          onClose={() => setModalOpen(false)}
          onUpdate={onUpdate}
          onToggleLabel={onToggleLabel}
          onCreateLabel={onCreateLabel}
        />
      )}

      <ThemedConfirmDialog
        isOpen={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => {
          onArchive(card.id);
          setConfirmArchive(false);
        }}
        title={t('features.kanban.archiveCardTitle')}
        message={t('features.kanban.archiveCardMessage', { title: card.title })}
        confirmText={t('common.archive')}
        cancelText={t('common.cancel')}
      />
    </>
  );
};

export default KanbanCard;
