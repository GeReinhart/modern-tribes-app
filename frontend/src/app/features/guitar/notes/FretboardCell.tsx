import React from 'react';

export type CellStatus = 'active' | 'match' | 'none';

interface Props {
  note: string;
  status: CellStatus;
  noteVisible: boolean;
  theme: { colors: Record<string, string> };
  size?: number;
}

function cellStyle(status: CellStatus, theme: Props['theme'], size: number): React.CSSProperties {
  const base: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  };
  if (status === 'active' || status === 'match') {
    return { ...base, backgroundColor: theme.colors.primary, border: `2px solid ${theme.colors.primary}` };
  }
  return { ...base, backgroundColor: theme.colors.surface, border: `1px solid #bbb` };
}

function textStyle(status: CellStatus, theme: Props['theme']): React.CSSProperties {
  if (status === 'active' || status === 'match') return { fontSize: '10px', fontWeight: 700, color: theme.colors.surface, lineHeight: 1 };
  return { fontSize: '9px', fontWeight: 400, color: '#888', lineHeight: 1 };
}

const FretboardCell: React.FC<Props> = ({ note, status, noteVisible, theme, size = 30 }) => (
  <div style={cellStyle(status, theme, size)}>
    {noteVisible && (
      <span style={textStyle(status, theme)}>{note}</span>
    )}
  </div>
);

export default FretboardCell;
