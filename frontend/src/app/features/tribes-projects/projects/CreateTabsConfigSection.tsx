import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DraftTabConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
  is_default: boolean;
}

interface Props {
  tabs: DraftTabConfig[];
  onChange: (tabs: DraftTabConfig[]) => void;
}

function move(
  tabs: DraftTabConfig[],
  index: number,
  dir: -1 | 1,
): DraftTabConfig[] {
  const next = index + dir;
  if (next < 0 || next >= tabs.length) return tabs;
  const updated = [...tabs];
  [updated[index], updated[next]] = [updated[next], updated[index]];
  return updated.map((t, i) => ({ ...t, order: i }));
}

function toggleVisible(tabs: DraftTabConfig[], key: string): DraftTabConfig[] {
  const updated = tabs.map((t) =>
    t.key === key ? { ...t, visible: !t.visible } : t,
  );
  const hasDefault = updated.some((t) => t.is_default && t.visible);
  if (!hasDefault) {
    const first = updated.find((t) => t.visible);
    return updated.map((t) => ({
      ...t,
      is_default: first ? t.key === first.key : t.is_default,
    }));
  }
  return updated;
}

function setDefault(tabs: DraftTabConfig[], key: string): DraftTabConfig[] {
  return tabs.map((t) => ({ ...t, is_default: t.key === key }));
}

const TabRow: React.FC<{
  tab: DraftTabConfig;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onSetDefault: () => void;
}> = ({
  tab,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onSetDefault,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        gap: '8px',
        alignItems: 'center',
        padding: '6px 8px',
        borderRadius: '6px',
        backgroundColor: tab.visible
          ? 'transparent'
          : `${theme.colors.border}40`,
      }}
    >
      <span
        style={{
          color: tab.visible ? theme.colors.text : theme.colors.secondary,
          fontWeight: tab.is_default ? 600 : 400,
        }}
      >
        {tab.label}
      </span>

      <div style={{ display: 'flex', justifyContent: 'center', width: '72px' }}>
        <input
          type="checkbox"
          checked={tab.visible}
          onChange={onToggleVisible}
          aria-label={t('tabConfig.toggleVisibility')}
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
            accentColor: theme.colors.primary,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', width: '64px' }}>
        <input
          type="radio"
          checked={tab.is_default}
          disabled={!tab.visible}
          onChange={onSetDefault}
          aria-label={t('tabConfig.setDefault')}
          style={{
            width: '16px',
            height: '16px',
            cursor: tab.visible ? 'pointer' : 'not-allowed',
            accentColor: theme.colors.primary,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '2px',
          width: '56px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            padding: '2px 4px',
            border: 'none',
            background: 'transparent',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            color: index === 0 ? theme.colors.secondary : theme.colors.text,
            borderRadius: '4px',
          }}
          aria-label={t('tabConfig.moveUp')}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          style={{
            padding: '2px 4px',
            border: 'none',
            background: 'transparent',
            cursor: index === total - 1 ? 'not-allowed' : 'pointer',
            color:
              index === total - 1 ? theme.colors.secondary : theme.colors.text,
            borderRadius: '4px',
          }}
          aria-label={t('tabConfig.moveDown')}
        >
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
};

const TabHeader: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        gap: '8px',
        alignItems: 'center',
        paddingBottom: '6px',
        borderBottom: `1px solid ${theme.colors.border}`,
        color: theme.colors.secondary,
        fontSize: 'var(--font-sm)',
        fontWeight: 600,
      }}
    >
      <span>{t('tabConfig.tab')}</span>
      <span style={{ textAlign: 'center', width: '72px' }}>
        {t('tabConfig.visible')}
      </span>
      <span style={{ textAlign: 'center', width: '64px' }}>
        {t('tabConfig.default')}
      </span>
      <span style={{ width: '56px' }} />
    </div>
  );
};

export const CreateTabsConfigSection: React.FC<Props> = ({
  tabs,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ marginTop: '16px' }}>
      <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
        {t('projects.tabsConfig')}
      </ThemedText>
      <TabHeader />
      {tabs.map((tab, index) => (
        <TabRow
          key={tab.key}
          tab={tab}
          index={index}
          total={tabs.length}
          onMoveUp={() => onChange(move(tabs, index, -1))}
          onMoveDown={() => onChange(move(tabs, index, 1))}
          onToggleVisible={() => onChange(toggleVisible(tabs, tab.key))}
          onSetDefault={() => onChange(setDefault(tabs, tab.key))}
        />
      ))}
    </div>
  );
};
