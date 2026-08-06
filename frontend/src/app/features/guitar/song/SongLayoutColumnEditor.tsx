import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedMultiSelect } from '@/app/platform/core/layout/themes/components/ThemedMultiSelect.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongLayoutBlockEditor } from './SongLayoutBlockEditor.tsx';
import { ALL_ALIGNS, alignIcon, alignLabel, availableBlockOptions } from './layoutBlockOptions.ts';
import { CUSTOM_BLOCK_TYPE, DraftBlock, DraftColumn, emptyDraftBlock, ROW_WIDTH_EIGHTHS } from './layoutDraft.ts';
import { LayoutAlign, LayoutBlockType } from './types.ts';

interface SongLayoutColumnEditorProps {
  column: DraftColumn;
  usedElsewhere: Set<string>;
  canRemove: boolean;
  onChange: (column: DraftColumn) => void;
  onRemove: () => void;
}

export const SongLayoutColumnEditor: React.FC<SongLayoutColumnEditorProps> = ({
  column, usedElsewhere, canRemove, onChange, onRemove,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const paddingFields: Array<[keyof DraftColumn, string, 'arrow-up' | 'arrow-right' | 'arrow-down' | 'arrow-left']> = [
    ['padding_top_mm', t('guitarSong.layout.paddingTop'), 'arrow-up'],
    ['padding_right_mm', t('guitarSong.layout.paddingRight'), 'arrow-right'],
    ['padding_bottom_mm', t('guitarSong.layout.paddingBottom'), 'arrow-down'],
    ['padding_left_mm', t('guitarSong.layout.paddingLeft'), 'arrow-left'],
  ];

  const fixedBlocks = column.blocks.filter((b) => b.block_type !== CUSTOM_BLOCK_TYPE);
  const customBlocks = column.blocks.filter((b) => b.block_type === CUSTOM_BLOCK_TYPE);

  const handleFixedTypesChange = (values: string[]) => {
    const nextFixed = values.map(
      (value) => fixedBlocks.find((b) => b.block_type === value) ?? emptyDraftBlock(value as LayoutBlockType),
    );
    onChange({ ...column, blocks: [...nextFixed, ...customBlocks] });
  };

  const addCustomBlock = () => onChange({ ...column, blocks: [...column.blocks, emptyDraftBlock(CUSTOM_BLOCK_TYPE)] });

  const updateBlock = (key: string, updated: DraftBlock) =>
    onChange({ ...column, blocks: column.blocks.map((b) => (b.key === key ? updated : b)) });

  const removeBlock = (key: string) => onChange({ ...column, blocks: column.blocks.filter((b) => b.key !== key) });

  const moveBlock = (index: number, direction: -1 | 1) => {
    const reordered = [...column.blocks];
    const target = index + direction;
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange({ ...column, blocks: reordered });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', border: '1px dashed #ccc', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: '190px', flexShrink: 0 }}>
          <ThemedMultiSelect
            label={t('guitarSong.layout.block')}
            options={availableBlockOptions(t, usedElsewhere, fixedBlocks.map((b) => b.block_type))}
            value={fixedBlocks.map((b) => b.block_type)}
            onChange={handleFixedTypesChange}
          />
        </div>
        <div style={{ width: '56px', flexShrink: 0 }}>
          <ThemedInput
            label={t('guitarSong.layout.width')}
            type="number"
            min={1}
            max={ROW_WIDTH_EIGHTHS}
            value={column.width_eighths}
            onChange={(e) => onChange({ ...column, width_eighths: Number(e.target.value) })}
          />
        </div>
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {ALL_ALIGNS.map((align: LayoutAlign) => (
            <div
              key={align}
              style={{
                backgroundColor: column.align === align ? `${theme.colors.primary}25` : 'transparent',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <ThemedIconButton
                action={{ icon: alignIcon(align), label: alignLabel(t, align), onClick: () => onChange({ ...column, align }) }}
              />
            </div>
          ))}
        </div>
        {paddingFields.map(([field, label, icon]) => (
          <div key={field} style={{ width: '76px', flexShrink: 0 }}>
            <ThemedInput
              type="number"
              min={0}
              max={100}
              value={column[field] as number}
              onChange={(e) => onChange({ ...column, [field]: Number(e.target.value) })}
              title={label}
              aria-label={label}
              leftIcon={<ThemedSvgIcon name={icon} color={theme.colors.secondary} size={14} />}
              style={{ MozAppearance: 'textfield' }}
              className="no-number-spinner"
            />
          </div>
        ))}
        <ThemedButton variant="ghost" fullWidth={false} onClick={addCustomBlock}>
          {t('guitarSong.layout.addCustomBlock')}
        </ThemedButton>
        <div style={{ flexShrink: 0 }}>
          <ThemedIconButton
            action={{
              icon: 'trash', label: t('guitarSong.layout.removeColumn'), onClick: onRemove, variant: 'danger',
              disabled: !canRemove,
            }}
          />
        </div>
      </div>
      {column.blocks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {column.blocks.map((block, index) => (
            <SongLayoutBlockEditor
              key={block.key}
              block={block}
              isFirst={index === 0}
              isLast={index === column.blocks.length - 1}
              onChange={(updated) => updateBlock(block.key, updated)}
              onRemove={() => removeBlock(block.key)}
              onMoveUp={() => moveBlock(index, -1)}
              onMoveDown={() => moveBlock(index, 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
