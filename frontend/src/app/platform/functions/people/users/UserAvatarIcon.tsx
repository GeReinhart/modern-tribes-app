import { ThemedAvatar } from '@/app/platform/core/layout/themes/components/ThemedAvatar.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { personInitials } from '@/app/platform/functions/people/personInitials.ts';
import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UserAvatarIconProps {
  size?: number;
}

export const UserAvatarIcon: React.FC<UserAvatarIconProps> = ({
  size = 32,
}) => {
  const { user, person, isLoading } = useCurrentUserProfile();
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="18" fill={theme.colors.ghost} opacity="0.4" />
      </svg>
    );
  }

  if (!user) return null;

  const initials = person
    ? personInitials(`${person.first_name} ${person.last_name}`)
    : user.login.substring(0, 2).toUpperCase();

  return (
    <ThemedAvatar
      photoUrl={person?.photo_url}
      initials={initials}
      size={size}
      ariaLabel="Profile"
      onClick={() => navigate('/app/profile')}
    />
  );
};
