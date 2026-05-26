import { useTheme } from '@/contexts/ThemeContext';

import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbTab {
  key: string;
  label: string;
  path: string;
  isActive: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    fontSize: 'var(--font-sm)',
    color: theme.colors.text,
  };

  const itemStyle: React.CSSProperties = {
    color: theme.colors.text,
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: 'default',
  };

  const clickableItemStyle: React.CSSProperties = {
    ...itemStyle,
    cursor: 'pointer',
  };

  const activeItemStyle: React.CSSProperties = {
    ...itemStyle,
    color: theme.colors.text,
    fontWeight: 500,
  };

  const separatorStyle: React.CSSProperties = {
    color: theme.colors.text,
    userSelect: 'none',
  };

  const handleClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <nav style={containerStyle} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = !isLast && item.path;

        return (
          <React.Fragment key={index}>
            <span
              style={
                isLast
                  ? activeItemStyle
                  : isClickable
                    ? clickableItemStyle
                    : itemStyle
              }
              onClick={() => handleClick(item.path)}
              onMouseEnter={(e) => {
                if (isClickable) {
                  e.currentTarget.style.color = theme.colors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (isClickable) {
                  e.currentTarget.style.color = theme.colors.text;
                }
              }}
            >
              {item.label}
            </span>
            {!isLast && <span style={separatorStyle}>/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
