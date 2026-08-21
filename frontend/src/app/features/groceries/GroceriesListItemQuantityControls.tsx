import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Props {
  quantity: string;
  itemQuantity: number;
  isDivisible: boolean;
  canEdit: boolean;
  step: number;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
  onCommit: () => void;
  onApplyStep: (delta: number) => void;
}

const GroceriesListItemQuantityControls: React.FC<Props> = ({
  quantity, itemQuantity, isDivisible, canEdit, step, inputRef, onChange, onCommit, onApplyStep,
}) => {
  const { theme } = useTheme();

  const stepButtonStyle = {
    border: `1px solid ${theme.colors.border}`, background: 'transparent', cursor: 'pointer',
    color: theme.colors.text, borderRadius: '6px', height: '24px', fontSize: 'var(--font-xs)',
  };

  if (!isDivisible) {
    return (
      <>
        {canEdit && (
          <button type="button" onClick={() => onApplyStep(-5)} style={{ ...stepButtonStyle, width: '28px' }}>
            −5
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={() => onApplyStep(-1)} style={{ ...stepButtonStyle, width: '24px' }}>
            −1
          </button>
        )}
        <span style={{ minWidth: '24px', textAlign: 'center', color: theme.colors.text, fontSize: 'var(--font-sm)' }}>
          {itemQuantity}
        </span>
        {canEdit && (
          <button type="button" onClick={() => onApplyStep(1)} style={{ ...stepButtonStyle, width: '24px' }}>
            +1
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={() => onApplyStep(5)} style={{ ...stepButtonStyle, width: '28px' }}>
            +5
          </button>
        )}
      </>
    );
  }

  return (
    <>
      {canEdit && (
        <button type="button" onClick={() => onApplyStep(-1)} style={{ ...stepButtonStyle, width: '24px' }}>
          −1
        </button>
      )}
      <div style={{ width: '76px' }}>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step={step}
          value={quantity}
          disabled={!canEdit}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
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
        <button type="button" onClick={() => onApplyStep(1)} style={{ ...stepButtonStyle, width: '24px' }}>
          +1
        </button>
      )}
    </>
  );
};

export default GroceriesListItemQuantityControls;
