import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { useTheme } from '@/contexts/ThemeContext';

const version = import.meta.env.VITE_APP_VERSION;

export const PWAInstallButton: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { isStandalone, isIOS, canPrompt, install } = usePWAInstall();
    const [showHint, setShowHint] = useState(false);

    if (isStandalone) return null;

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
        minWidth: '240px',
        fontSize: 'var(--font-sm)',
        color: theme.colors.text,
        lineHeight: 1.5,
    };

    const handleClick = () => {
        if (canPrompt) {
            void install();
        } else {
            setShowHint(prev => !prev);
        }
    };

    const hintText = isIOS
        ? t('common.installAppIOSHint')
        : t('common.installAppGenericHint');

    return (
        <div style={{ position: 'relative' }}>
            <ThemedButton
                variant="ghost"
                mobileIcon="download"
                onClick={handleClick}
            >
                {t('common.installApp')} {version && `v${version}`}
            </ThemedButton>

            {!canPrompt && showHint && (
                <div style={tooltipStyle}>
                    {hintText}
                </div>
            )}
        </div>
    );
};
