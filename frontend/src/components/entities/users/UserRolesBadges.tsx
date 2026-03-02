import React from 'react';
import { Role } from '@/types/role.types';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge.tsx';

interface UserRolesBadgesProps {
    roles: Role[];
    maxDisplay?: number;
}

export const UserRolesBadges: React.FC<UserRolesBadgesProps> = ({ roles, maxDisplay }) => {
    if (!roles || roles.length === 0) {
        return <ThemedBadge variant="secondary">No roles assigned</ThemedBadge>;
    }

    const displayRoles = maxDisplay ? roles.slice(0, maxDisplay) : roles;
    const remainingCount = roles.length - displayRoles.length;

    return (
        <div className="flex flex-wrap gap-1">
            {displayRoles.map((role) => (
                <ThemedBadge key={role.id} variant="primary">{role.name}</ThemedBadge>
            ))}
            {remainingCount > 0 && (
                <ThemedBadge variant="secondary">+{remainingCount} more</ThemedBadge>
            )}
        </div>
    );
};
