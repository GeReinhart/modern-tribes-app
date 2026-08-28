import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';

import FieldLabel from './FieldLabel.tsx';

interface Props {
  label: string;
  defaultExpanded: boolean;
  children: React.ReactNode;
}

// Optional form sections (description, participants) start collapsed when they have no
// value yet, so an empty meal form doesn't waste space on fields nobody filled in.
const CollapsibleField: React.FC<Props> = ({ label, defaultExpanded, children }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <ThemedSvgIcon name={expanded ? 'chevron-down' : 'chevron-up'} color={theme.colors.primary} size={14} />
        <FieldLabel>{label}</FieldLabel>
      </button>
      {expanded && <div style={{ marginTop: '4px' }}>{children}</div>}
    </div>
  );
};

export default CollapsibleField;
