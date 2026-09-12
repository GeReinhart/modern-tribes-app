import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';
import { ToolbarActionPlacement } from '@/app/platform/core/layout/toolbarConfig.types.ts';
import { ThemedModal, ThemedModalBody } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

const PLACEMENTS: ToolbarActionPlacement[] = ['direct', 'menu'];

interface ToolbarConfigRowProps {
  action: MenuAction;
  placement: ToolbarActionPlacement;
  onChange: (placement: ToolbarActionPlacement) => void;
}

const ToolbarConfigRow: React.FC<ToolbarConfigRowProps> = ({ action, placement, onChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <ThemedSvgIcon name={action.icon} color={theme.colors.text} size={16} />
        <span style={{ fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {action.label}
        </span>
      </div>
      <div style={{ display: 'flex', border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
        {PLACEMENTS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              padding: '4px 10px',
              fontSize: 'var(--font-xs)',
              border: 'none',
              cursor: 'pointer',
              background: placement === option ? theme.colors.primary : 'transparent',
              color: placement === option ? '#fff' : theme.colors.text,
            }}
          >
            {option === 'direct' ? t('layout.toolbarConfigureDirect') : t('layout.toolbarConfigureInMenu')}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ToolbarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: MenuAction[];
  placementOf: (actionId: string) => ToolbarActionPlacement;
  onSetPlacement: (actionId: string, placement: ToolbarActionPlacement) => void;
}

export const ToolbarConfigModal: React.FC<ToolbarConfigModalProps> = ({
  isOpen, onClose, actions, placementOf, onSetPlacement,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('layout.toolbarConfigure')} size="sm">
      <ThemedModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {actions.map((action) => (
            <ToolbarConfigRow
              key={action.id}
              action={action}
              placement={placementOf(action.id)}
              onChange={(placement) => onSetPlacement(action.id, placement)}
            />
          ))}
        </div>
      </ThemedModalBody>
    </ThemedModal>
  );
};
