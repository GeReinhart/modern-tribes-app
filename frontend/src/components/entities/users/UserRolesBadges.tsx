import { ThemedBadge } from '@/platform/themes/components/ThemedBadge.tsx';
import { Role } from '@/platform/authorization/role.types';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface UserRolesBadgesProps {
  roles: Role[];
  maxDisplay?: number;
}

export const UserRolesBadges: React.FC<UserRolesBadgesProps> = ({
  roles,
  maxDisplay,
}) => {
  const { t } = useTranslation();

  if (!roles || roles.length === 0) {
    return <ThemedBadge variant="secondary">{t('roles.noRoles')}</ThemedBadge>;
  }

  const displayRoles = maxDisplay ? roles.slice(0, maxDisplay) : roles;
  const remainingCount = roles.length - displayRoles.length;

  return (
    <div className="flex flex-wrap gap-1">
      {displayRoles.map((role) => (
        <ThemedBadge key={role.id} variant="primary">
          {t(`roles.${role.name}`, { defaultValue: role.name })}
        </ThemedBadge>
      ))}
      {remainingCount > 0 && (
        <ThemedBadge variant="secondary">+{remainingCount}</ThemedBadge>
      )}
    </div>
  );
};
