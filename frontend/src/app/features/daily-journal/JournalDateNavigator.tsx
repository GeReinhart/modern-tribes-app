import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  selectedDate: string;
  days: string[];
  onSelect: (date: string) => void;
}

function formatDayHeader(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const JournalDateNavigator: React.FC<Props> = ({ selectedDate, days, onSelect }) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const sortedDays = [...days].sort();
  const idx = sortedDays.indexOf(selectedDate);
  const prevDay = idx > 0 ? sortedDays[idx - 1] : null;
  const nextDay = idx < sortedDays.length - 1 ? sortedDays[idx + 1] : null;

  const iconBtnStyle = (enabled: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 0.8 : 0.25,
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <button type="button" disabled={!prevDay} onClick={() => prevDay && onSelect(prevDay)} style={iconBtnStyle(!!prevDay)}>
        <ThemedSvgIcon name="arrow-left" color={theme.colors.text} size={18} />
      </button>
      <h2 style={{
        flex: 1, textAlign: 'center', margin: 0,
        fontSize: 'var(--font-md)', fontWeight: 700,
        color: theme.colors.text, textTransform: 'capitalize',
      }}>
        {formatDayHeader(selectedDate, i18n.language)}
      </h2>
      <button type="button" disabled={!nextDay} onClick={() => nextDay && onSelect(nextDay)} style={iconBtnStyle(!!nextDay)}>
        <ThemedSvgIcon name="arrow-right" color={theme.colors.text} size={18} />
      </button>
    </div>
  );
};

export default JournalDateNavigator;
