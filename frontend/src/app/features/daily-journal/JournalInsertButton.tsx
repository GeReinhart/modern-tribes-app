import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onInsert: () => void;
}

const JournalInsertButton: React.FC<Props> = ({ onInsert }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ flex: 1, height: '1px', background: hovered ? theme.colors.primary + '66' : theme.colors.border, transition: 'background 0.15s' }} />
      <button
        type="button"
        onClick={onInsert}
        title={t('journal.addBlock')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '50%',
          border: `1.5px solid ${hovered ? theme.colors.primary : theme.colors.border}`,
          background: hovered ? theme.colors.primary : theme.colors.surface,
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
          opacity: hovered ? 1 : 0.5,
        }}
      >
        <ThemedSvgIcon name="plus" color={hovered ? '#fff' : theme.colors.text} size={12} />
      </button>
      <div style={{ flex: 1, height: '1px', background: hovered ? theme.colors.primary + '66' : theme.colors.border, transition: 'background 0.15s' }} />
    </div>
  );
};

export default JournalInsertButton;
