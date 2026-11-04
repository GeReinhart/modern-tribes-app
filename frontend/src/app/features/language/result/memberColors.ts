// Distinct line colors for the members of the competition chart (cycled when there are more members).
const MEMBER_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#ca8a04', '#db2777'];

export const memberColor = (index: number): string => MEMBER_COLORS[index % MEMBER_COLORS.length];
