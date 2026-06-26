import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { PersonOption } from './types.ts';

interface Props {
  persons: PersonOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const PersonSelector: React.FC<Props> = ({ persons, selectedIds, onChange, disabled = false }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (persons.length === 0) return null;

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(pid => pid !== id)
        : [...selectedIds, id],
    );
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '6px',
  };

  return (
    <div>
      <div style={sectionLabel}>{t('features.events.participants')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {persons.map(p => {
          const active = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              disabled={disabled}
              style={{
                padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                border: `1.5px solid ${theme.colors.primary}`,
                cursor: disabled ? 'default' : 'pointer',
                backgroundColor: active ? theme.colors.primary : 'transparent',
                color: active ? theme.colors.surface : theme.colors.primary,
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PersonSelector;
