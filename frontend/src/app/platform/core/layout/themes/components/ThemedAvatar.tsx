import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { CSSProperties } from 'react';

interface ThemedAvatarProps {
  photoUrl?: string | null;
  initials: string;
  size: number;
  title?: string;
  // 'gradient': white initials on the theme gradient. 'soft': initials in `color` on a tint of it.
  variant?: 'gradient' | 'soft';
  color?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

const photoStyle = (size: number, clickable: boolean): CSSProperties => ({
  width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
  cursor: clickable ? 'pointer' : 'default',
});

// A person's round avatar: their photo when they have one, their initials otherwise.
export const ThemedAvatar: React.FC<ThemedAvatarProps> = ({
  photoUrl, initials, size, title, variant = 'gradient', color, onClick, ariaLabel,
}) => {
  const { theme } = useTheme();
  const accent = color ?? theme.colors.primary;
  const label = ariaLabel ?? title ?? initials;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={label}
        title={title}
        onClick={onClick}
        style={photoStyle(size, Boolean(onClick))}
      />
    );
  }

  const style: CSSProperties = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * (variant === 'soft' ? 0.4 : 0.38), fontWeight: 800,
    cursor: onClick ? 'pointer' : 'default',
    ...(variant === 'soft'
      ? { background: accent + '22', border: `1.5px solid ${accent}`, color: accent }
      : { background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`, color: 'white' }),
  };

  return (
    <span role={onClick ? 'button' : 'img'} aria-label={label} title={title} onClick={onClick} style={style}>
      {initials}
    </span>
  );
};
