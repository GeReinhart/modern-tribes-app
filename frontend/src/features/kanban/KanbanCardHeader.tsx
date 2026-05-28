import { ThemedSvgIcon } from '@/platform/themes/icons/ThemedSvgIcon';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { KanbanCard } from './types';

interface Props {
  card: KanbanCard;
  canEdit: boolean;
  expanded: boolean;
  onOpenModal: () => void;
  onRequestArchive: () => void;
  onRestore: () => void;
  onToggleExpand: () => void;
}

const KanbanCardHeader: React.FC<Props> = ({
  card,
  canEdit,
  expanded,
  onOpenModal,
  onRequestArchive,
  onRestore,
  onToggleExpand,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isArchived = card.status === 'archived';

  const btnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '1px 2px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  } as const;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-xs)',
      }}
    >
      <span
        onClick={onOpenModal}
        style={{
          flex: 1,
          fontSize: 'var(--font-lg)',
          color: isArchived ? theme.colors.secondary : theme.colors.text,
          cursor: 'pointer',
          textDecoration: isArchived ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}
      >
        {card.title}
      </span>

      {!isArchived && (
        <>
          {canEdit && (
            <button
              onClick={onOpenModal}
              title={t('common.edit')}
              style={{ ...btnStyle, opacity: 0.7 }}
            >
              <ThemedSvgIcon name="pencil" color={theme.colors.text} size={12} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={onRequestArchive}
              title={t('common.archive')}
              style={{ ...btnStyle, opacity: 0.7 }}
            >
              <ThemedSvgIcon
                name="archive"
                color={theme.colors.danger}
                size={12}
              />
            </button>
          )}
        </>
      )}

      {isArchived && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
            flexShrink: 0,
          }}
          title={t('features.kanban.archived')}
        >
          <ThemedSvgIcon
            name="archive"
            color={theme.colors.secondary}
            size={12}
          />
        </span>
      )}
      {isArchived && canEdit && (
        <button
          onClick={onRestore}
          title={t('features.kanban.restore')}
          style={{
            ...btnStyle,
            border: `1px solid ${theme.colors.success}`,
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-xs)',
          }}
        >
          <ThemedSvgIcon
            name="refresh"
            color={theme.colors.success}
            size={12}
          />
        </button>
      )}

      <button
        onClick={onToggleExpand}
        title={
          expanded
            ? t('features.kanban.hideContent')
            : t('features.kanban.showContent')
        }
        style={{ ...btnStyle, opacity: 0.75 }}
      >
        <ThemedSvgIcon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          color={theme.colors.text}
          size={13}
        />
      </button>
    </div>
  );
};

export default KanbanCardHeader;
