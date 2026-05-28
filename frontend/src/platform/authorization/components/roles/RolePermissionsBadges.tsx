import { ThemedBadge } from '@/platform/layout/themes/components/ThemedBadge.tsx';

import React from 'react';

import { Permission } from '../../permission.types';

interface RolePermissionsBadgesProps {
  permissions: Permission[];
  maxDisplay?: number;
}

export const RolePermissionsBadges: React.FC<RolePermissionsBadgesProps> = ({
  permissions,
  maxDisplay,
}) => {
  if (!permissions || permissions.length === 0) {
    return (
      <ThemedBadge variant="secondary">No permissions assigned</ThemedBadge>
    );
  }

  const display = maxDisplay ? permissions.slice(0, maxDisplay) : permissions;
  const remainingCount = permissions.length - display.length;

  return (
    <div className="flex flex-wrap gap-1">
      {display.map((p) => (
        <ThemedBadge key={p.id} variant="primary">
          {p.name}
        </ThemedBadge>
      ))}
      {remainingCount > 0 && (
        <ThemedBadge variant="secondary">+{remainingCount} more</ThemedBadge>
      )}
    </div>
  );
};
