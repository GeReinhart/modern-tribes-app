import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef, useState } from 'react';

import { formatUnitSuffix } from './formatQuantity.ts';
import { GroceriesListItemDetail } from './types.ts';

interface Props {
  item: GroceriesListItemDetail;
  canEdit: boolean;
  autoFocus: boolean;
  onFocused: () => void;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const GroceriesListColumnRow: React.FC<Props> = ({
  item, canEdit, autoFocus, onFocused, onUpdateQuantity, onRemove,
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const step = item.is_divisible ? 0.01 : 1;

  useEffect(() => {
    if (!autoFocus) return;
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    onFocused();
  }, [autoFocus, onFocused]);

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  const commitQuantity = () => {
    const parsed = Number(quantity);
    if (!Number.isNaN(parsed) && parsed !== item.quantity) onUpdateQuantity(item.id, parsed);
  };

  const applyStep = (delta: number) => {
    const current = Number(quantity);
    const next = Math.max(0, (Number.isNaN(current) ? item.quantity : current) + delta);
    setQuantity(String(next));
    onUpdateQuantity(item.id, next);
  };

  const unitSuffix = formatUnitSuffix(item.unit);

  const stepButtonStyle = {
    border: `1px solid ${theme.colors.border}`, background: 'transparent', cursor: 'pointer',
    color: theme.colors.text, borderRadius: '6px', height: '24px', fontSize: 'var(--font-xs)',
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '6px',
        border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface,
      }}
    >
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', color: theme.colors.text, fontSize: 'var(--font-sm)' }}>
        {item.icon && <ThemedSvgIcon name={item.icon as IconName} color={theme.colors.text} size={14} />}
        {item.name}
        {unitSuffix && (
          <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>{unitSuffix}</span>
        )}
      </span>
      {!item.is_divisible ? (
        <>
          {canEdit && (
            <button type="button" onClick={() => applyStep(-5)} style={{ ...stepButtonStyle, width: '28px' }}>
              −5
            </button>
          )}
          {canEdit && (
            <button type="button" onClick={() => applyStep(-1)} style={{ ...stepButtonStyle, width: '24px' }}>
              −1
            </button>
          )}
          <span style={{ minWidth: '24px', textAlign: 'center', color: theme.colors.text, fontSize: 'var(--font-sm)' }}>
            {item.quantity}
          </span>
          {canEdit && (
            <button type="button" onClick={() => applyStep(1)} style={{ ...stepButtonStyle, width: '24px' }}>
              +1
            </button>
          )}
          {canEdit && (
            <button type="button" onClick={() => applyStep(5)} style={{ ...stepButtonStyle, width: '28px' }}>
              +5
            </button>
          )}
        </>
      ) : (
        <>
          {canEdit && (
            <button type="button" onClick={() => applyStep(-1)} style={{ ...stepButtonStyle, width: '24px' }}>
              −1
            </button>
          )}
          <div style={{ width: '56px' }}>
            <input
              ref={inputRef}
              type="number"
              min="0"
              step={step}
              value={quantity}
              disabled={!canEdit}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={commitQuantity}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '6px',
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: 'var(--font-sm)',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {canEdit && (
            <button type="button" onClick={() => applyStep(1)} style={{ ...stepButtonStyle, width: '24px' }}>
              +1
            </button>
          )}
        </>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.danger, display: 'flex' }}
        >
          <ThemedSvgIcon name="x" color="currentColor" size={16} />
        </button>
      )}
    </div>
  );
};

export default GroceriesListColumnRow;
