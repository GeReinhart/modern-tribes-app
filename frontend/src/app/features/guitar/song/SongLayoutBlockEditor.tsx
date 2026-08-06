import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { blockTypeLabel } from './layoutBlockOptions.ts';
import { CUSTOM_BLOCK_TYPE, DraftBlock, ROW_WIDTH_EIGHTHS } from './layoutDraft.ts';

const MIN_ZOOM_PERCENT = 30;
const MAX_ZOOM_PERCENT = 200;

interface SongLayoutBlockEditorProps {
  block: DraftBlock;
  isFirst: boolean;
  isLast: boolean;
  onChange: (block: DraftBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const SongLayoutBlockEditor: React.FC<SongLayoutBlockEditorProps> = ({
  block, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isCustom = block.block_type === CUSTOM_BLOCK_TYPE;

  const reorderControls = (
    <div style={{ display: 'flex', gap: '2px' }}>
      <ThemedIconButton action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: onMoveUp, disabled: isFirst }} />
      <ThemedIconButton action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: onMoveDown, disabled: isLast }} />
      {isCustom && (
        <ThemedIconButton action={{ icon: 'trash', label: t('guitarSong.layout.removeBlock'), onClick: onRemove, variant: 'danger' }} />
      )}
    </div>
  );

  const label = isCustom ? (block.custom_title || t('guitarSong.layout.customBlockPlaceholder')) : blockTypeLabel(t, block.block_type);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 8px' }}>
      <span style={{ fontSize: '12px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isCustom && (
          <div style={{ width: '76px', flexShrink: 0 }}>
            <ThemedInput
              aria-label={t('guitarSong.layout.customBlockWidth')}
              title={t('guitarSong.layout.customBlockWidth')}
              type="number"
              min={1}
              max={ROW_WIDTH_EIGHTHS}
              value={block.width_eighths}
              onChange={(e) => onChange({ ...block, width_eighths: Number(e.target.value) })}
            />
          </div>
        )}
        <div style={{ width: '76px', flexShrink: 0 }}>
          <ThemedInput
            aria-label={t('guitarSong.layout.blockZoom')}
            title={t('guitarSong.layout.blockZoom')}
            type="number"
            min={MIN_ZOOM_PERCENT}
            max={MAX_ZOOM_PERCENT}
            value={block.zoom_percent}
            onChange={(e) => onChange({ ...block, zoom_percent: Number(e.target.value) })}
          />
        </div>
        <div style={{ backgroundColor: block.show_card ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
          <ThemedIconButton
            action={{
              icon: 'credit-card', label: t('guitarSong.layout.blockShowCard'),
              onClick: () => onChange({ ...block, show_card: !block.show_card }),
            }}
          />
        </div>
        {reorderControls}
      </div>
    </div>
  );
};
