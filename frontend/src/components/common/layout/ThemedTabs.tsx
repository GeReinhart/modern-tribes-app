import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Tab {
    key: string;
    label: string;
}

interface ThemedTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export const ThemedTabs: React.FC<ThemedTabsProps> = ({ tabs, activeTab, onTabChange }) => {
    const { theme } = useTheme();

    return (
        <div style={{ display: 'flex', gap: '2px', borderBottom: `2px solid ${theme.colors.primary}30`, marginBottom: '0' }}>
            {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        style={{
                            padding: '10px 24px',
                            border: 'none',
                            borderBottom: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                            marginBottom: '-2px',
                            background: isActive ? `${theme.colors.primary}15` : 'transparent',
                            color: isActive ? theme.colors.primary : theme.colors.text,
                            fontWeight: isActive ? 600 : 400,
                            cursor: 'pointer',
                            borderRadius: '6px 6px 0 0',
                            fontSize: '14px',
                            transition: 'all 0.15s',
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
