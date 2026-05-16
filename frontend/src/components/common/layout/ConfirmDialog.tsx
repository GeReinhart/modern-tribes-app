import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedButton } from '@/components/common/form/ThemedButton';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: 'primary' | 'danger' | 'secondary';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel,
    confirmVariant = 'danger',
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: theme.colors.surface,
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '12px',
                    padding: 'var(--space-xl)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                    maxWidth: '420px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: theme.colors.text }}>
                    {title}
                </span>
                <span style={{ fontSize: 'var(--font-md)', color: theme.colors.secondary, lineHeight: 1.5 }}>
                    {message}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                    <ThemedButton variant="ghost" onClick={onCancel}>
                        {t('common.cancel')}
                    </ThemedButton>
                    <ThemedButton variant={confirmVariant} onClick={onConfirm}>
                        {confirmLabel ?? t('common.confirm')}
                    </ThemedButton>
                </div>
            </div>
        </div>
    );
};
