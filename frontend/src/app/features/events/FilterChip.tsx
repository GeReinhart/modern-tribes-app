import React from 'react';

interface Props {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
  activeTextColor?: string;
}

// A toggleable pill used for label/person/project filters on the planning
// views. Extracted once the same markup started repeating across filter
// groups in EventsTab and DashboardPlanningTab.
const FilterChip: React.FC<Props> = ({ label, color, active, onClick, activeTextColor = 'white' }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '3px 10px', borderRadius: '12px', border: `2px solid ${color}`,
      backgroundColor: active ? color : 'transparent', color: active ? activeTextColor : color,
      fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer',
    }}
  >
    {label}
  </button>
);

export default FilterChip;
