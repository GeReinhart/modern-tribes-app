import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { TaskLabelInfo } from '@/app/features/tasks/types.ts';

interface Props {
  documentContentHtml: string | null;
  labels: TaskLabelInfo[];
  onOpenPopup: () => void;
}

const MyTasksCardContent: React.FC<Props> = ({ documentContentHtml, labels, onOpenPopup }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${theme.colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', marginBottom: '4px' }}>
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
          <ThemedSvgIcon name="external-link" color={theme.colors.primary} size={12} />
          {t('features.tasks.openInPopup')}
        </button>
      </div>
      {labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingTop: '8px' }}>
          {labels.map((label) => (
            <span
              key={label.id}
              style={{
                padding: '2px 8px',
                borderRadius: '10px',
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
      <div style={{ paddingTop: '8px' }}>
        {documentContentHtml ? (
          <div
            className="prose max-w-none"
            style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}
            dangerouslySetInnerHTML={{ __html: documentContentHtml }}
          />
        ) : (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>
            {t('features.kanban.noDocument')}
          </span>
        )}
      </div>
    </div>
  );
};

export default MyTasksCardContent;
