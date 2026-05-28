import { useTheme } from '@/contexts/ThemeContext';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { KanbanCard, KanbanLabel } from './types';

interface Props {
  card: KanbanCard;
  boardLabels: KanbanLabel[];
}

const KanbanCardBody: React.FC<Props> = ({ card, boardLabels }) => {
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
