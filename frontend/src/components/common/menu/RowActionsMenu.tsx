import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { MenuAction } from '@/types/menu.types';

interface RowActionsMenuProps {
    actions: MenuAction[];
}

export function RowActionsMenu({ actions }: RowActionsMenuProps): React.ReactElement {
    const { theme } = useTheme();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                close();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, close]);

    const handleAction = (action: MenuAction) => {
        close();
        action.onClick();
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen(prev => !prev)}
                aria-label="Row actions"
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: theme.colors.text,
                }}
            >
                <ThemedSvgIcon name="more-vertical" color={theme.colors.text} size={16} />
            </button>
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        zIndex: 50,
                        background: theme.colors.surface,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        padding: '4px 0',
                    }}
                >
                    {actions.map(action => (
                        <button
                            key={action.label}
                            disabled={action.disabled}
                            onClick={() => handleAction(action)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px 12px',
                                background: 'none',
                                border: 'none',
                                cursor: action.disabled ? 'not-allowed' : 'pointer',
                                color: action.variant === 'danger' ? '#ef4444' : theme.colors.text,
                                opacity: action.disabled ? 0.5 : 1,
                                fontSize: '14px',
                                textAlign: 'left',
                            }}
                        >
                            <ThemedSvgIcon
                                name={action.icon}
                                color={action.variant === 'danger' ? '#ef4444' : theme.colors.text}
                                size={14}
                            />
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
