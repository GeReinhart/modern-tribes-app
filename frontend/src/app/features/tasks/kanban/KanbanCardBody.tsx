import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { KanbanCard, KanbanLabel } from './types.ts';

interface Props {
  card: KanbanCard;
  boardLabels: KanbanLabel[];
  onOpenPopup?: () => void;
}

const KanbanCardBody: React.FC<Props> = ({ card, boardLabels, onOpenPopup }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      style={{
        padding: '10px 14px 12px',
        borderTop: `1px solid ${theme.colors.border}`,
      }}
    >
      {card.label_ids.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '10px',
          }}
        >
          {boardLabels
            .filter((l) => card.label_ids.includes(l.id))
            .map((label) => (
              <span
                key={label.id}
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  border: `1px solid ${label.color}`,
                  background: label.color,
                  color: theme.colors.surface,
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {label.name}
              </span>
            ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '6px',
        }}
      >
        {onOpenPopup && (
          <button
            onClick={onOpenPopup}
            title={t('features.tasks.openInPopup')}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.primary}`,
              borderRadius: '6px',
              cursor: 'pointer',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: theme.colors.primary,
              fontSize: 'var(--font-xs)',
              fontWeight: 600,
            }}
          >
            <ThemedSvgIcon
              name="external-link"
              color={theme.colors.primary}
              size={12}
            />
            {t('features.tasks.openInPopup')}
          </button>
        )}
      </div>
      {card.document_content_html ? (
        <div
          className="prose max-w-none"
          style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}
          dangerouslySetInnerHTML={{ __html: card.document_content_html }}
        />
      ) : (
        <div
          style={{
            fontSize: 'var(--font-sm)',
            color: theme.colors.secondary,
            fontStyle: 'italic',
          }}
        >
          {t('features.kanban.noDocument')}
        </div>
      )}
    </div>
  );
};

export default KanbanCardBody;
