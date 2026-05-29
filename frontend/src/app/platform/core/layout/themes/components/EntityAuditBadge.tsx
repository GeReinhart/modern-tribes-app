import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useUserDisplayInfo } from '@/app/platform/functions/people/users/useUserDisplayInfo.ts';
import { UserDisplayInfo } from '@/app/platform/functions/people/users/user-display.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface EntityAuditBadgeProps {
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(info: UserDisplayInfo): string {
  if (info.first_name && info.last_name) {
    return `${info.first_name[0]}${info.last_name[0]}`.toUpperCase();
  }
  return info.login.substring(0, 2).toUpperCase();
}

function getDisplayName(info: UserDisplayInfo): string {
  if (info.first_name && info.last_name) {
    return `${info.first_name} ${info.last_name}`;
  }
  return info.login;
}

interface AvatarProps {
  userId: string;
  buildTooltip: (name: string) => string;
  size: number;
  gradientId: string;
}

const UserAvatar: React.FC<AvatarProps> = ({
  userId,
  buildTooltip,
  size,
  gradientId,
}) => {
  const { info, loading } = useUserDisplayInfo(userId);
  const { theme } = useTheme();

  if (loading) {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="18" fill={theme.colors.ghost} opacity="0.4" />
      </svg>
    );
  }

  if (!info) return null;

  const initials = getInitials(info);
  const tooltipText = buildTooltip(getDisplayName(info));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      style={{ flexShrink: 0, cursor: 'default' }}
      role="img"
      aria-label={tooltipText}
    >
      <title>{tooltipText}</title>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.colors.secondary} stopOpacity="0.7" />
          <stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill={`url(#${gradientId})`} />
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

export const EntityAuditBadge: React.FC<EntityAuditBadgeProps> = ({
  createdBy,
  updatedBy,
  createdAt,
  updatedAt,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const showUpdater = Boolean(updatedBy && updatedBy !== createdBy);
  const createdDateStr = formatDate(createdAt);
  const updatedDateStr = formatDate(updatedAt);

  const buildCreatorTooltip = (name: string): string => {
    const lines = [
      name,
      `${t('common.createdBy')} ${createdDateStr}`,
    ];
    if (updatedBy === createdBy) {
      lines.push(`${t('common.updatedBy')} ${updatedDateStr}`);
    }
    return lines.join('\n');
  };

  const buildUpdaterTooltip = (name: string): string =>
    `${name}\n${t('common.updatedBy')} ${updatedDateStr}`;

  if (!createdBy) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: `1px solid ${theme.colors.border}`,
      }}
    >
      <UserAvatar
        userId={createdBy}
        buildTooltip={buildCreatorTooltip}
        size={20}
        gradientId={`audit-creator-${createdBy}`}
      />
      {showUpdater && updatedBy && (
        <UserAvatar
          userId={updatedBy}
          buildTooltip={buildUpdaterTooltip}
          size={20}
          gradientId={`audit-updater-${updatedBy}`}
        />
      )}
    </div>
  );
};
