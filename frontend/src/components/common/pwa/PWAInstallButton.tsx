import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';

export const PWAInstallButton: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { isStandalone, isIOS, canPrompt, install } = usePWAInstall();
    const [showIOSHint, setShowIOSHint] = useState(false);

    if (isStandalone) return null;
    if (!canPrompt && !isIOS) return null;

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 1000,
        backgroundColor: theme.colors.surface,
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        padding: 'var(--space-md)',
        minWidth: '220px',
        fontSize: 'var(--font-sm)',
        color: theme.colors.text,
        lineHeight: 1.5,
    };

    return (
        <div style={{ position: 'relative' }}>
            <ThemedButton
                variant="ghost"
                mobileIcon="download"
                onClick={canPrompt ? install : () => setShowIOSHint(prev => !prev)}
            >
                {t('common.installApp')}
            </ThemedButton>

            {isIOS && showIOSHint && (
                <div style={tooltipStyle}>
                    {t('common.installAppIOSHint')}
                </div>
            )}
        </div>
    );
};
