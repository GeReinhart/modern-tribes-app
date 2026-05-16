import React from 'react';

const STATUS_COLORS: Record<string, string> = {
    active: '#22c55e',
    pending: '#f59e0b',
    archived: '#6b7280',
};

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const color = STATUS_COLORS[status] ?? '#6b7280';
    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: `${color}20`,
            color,
            fontSize: '11px',
            fontWeight: 600,
            border: `1px solid ${color}50`,
            whiteSpace: 'nowrap',
        }}>
            {status}
        </span>
    );
};
