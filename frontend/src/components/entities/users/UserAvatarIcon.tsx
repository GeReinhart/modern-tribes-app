import { useTheme } from '@/platform/themes/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile.ts';

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
        <circle
          cx="18"
          cy="18"
          r="18"
          fill={theme.colors.ghost}
          opacity="0.4"
        />
      </svg>
    );
  }

  if (!user) return null;

  const initials = person
    ? `${person.first_name[0]}${person.last_name[0]}`
    : user.login.substring(0, 2).toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      onClick={() => navigate('/app/profile')}
      style={{ cursor: 'pointer', flexShrink: 0 }}
      role="button"
      aria-label="Profile"
    >
      <defs>
        <linearGradient
          id="user-avatar-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={theme.colors.primary} />
          <stop offset="100%" stopColor={theme.colors.secondary} />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="url(#user-avatar-grad)" />
      <text
        x="18"
        y="18"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.38}
        fontWeight="bold"
      >
        {initials}
      </text>
    </svg>
  );
};
