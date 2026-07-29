import React from 'react';

import FilterChip from './FilterChip.tsx';

export interface FilterChipGroup {
  id: string;
  label: string;
  color: string;
  active: boolean;
  onToggle: () => void;
  activeTextColor?: string;
}

interface Props {
  groups: FilterChipGroup[];
}

// Row of label/person/project filter chips shown above the day/week view.
const CalendarFilterBar: React.FC<Props> = ({ groups }) => {
  if (groups.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
      {groups.map(g => (
        <FilterChip
          key={g.id} label={g.label} color={g.color}
          active={g.active} onClick={g.onToggle}
          activeTextColor={g.activeTextColor}
        />
      ))}
    </div>
  );
};

export default CalendarFilterBar;
