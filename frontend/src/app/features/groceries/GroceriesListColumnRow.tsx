import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatQuantityUnit } from './formatQuantity.ts';
import GroceriesListItemQuantityControls from './GroceriesListItemQuantityControls.tsx';
import { GroceriesListItemDetail } from './types.ts';

interface Props {
  item: GroceriesListItemDetail;
  canEdit: boolean;
  autoFocus: boolean;
  onFocused: () => void;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onUpdateComment: (id: string, comment: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onManage?: () => void;
}

const GroceriesListColumnRow: React.FC<Props> = ({
  item, canEdit, autoFocus, onFocused, onUpdateQuantity, onUpdateComment, onRemove, onManage,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(autoFocus);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [comment, setComment] = useState(item.comment ?? '');
  const step = item.is_divisible ? 0.1 : 1;

  useEffect(() => {
    setComment(item.comment ?? '');
  }, [item.comment]);

  const commitComment = () => {
    if (comment !== (item.comment ?? '')) onUpdateComment(item.id, comment);
  };

  useEffect(() => {
    if (autoFocus) setPanelOpen(true);
  }, [autoFocus]);

  useEffect(() => {
    if (!autoFocus || !panelOpen) return;
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    onFocused();
  }, [autoFocus, panelOpen, onFocused]);

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  const commitQuantity = () => {
    const parsed = Number(quantity);
    if (Number.isNaN(parsed)) return;
    const rounded = item.is_divisible ? Math.round(parsed * 10) / 10 : parsed;
    setQuantity(String(rounded));
    if (rounded !== item.quantity) onUpdateQuantity(item.id, rounded);
  };

  const applyStep = (delta: number) => {
    const current = Number(quantity);
    const raw = Math.max(0, (Number.isNaN(current) ? item.quantity : current) + delta);
    const next = Math.round(raw * 100) / 100;
    setQuantity(String(next));
    onUpdateQuantity(item.id, next);
  };

  const previewQuantity = Number(quantity);
  const quantityLabel = formatQuantityUnit(
    Number.isNaN(previewQuantity) ? item.quantity : previewQuantity,
    item.unit,
    item.is_divisible,
  );

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 8px', borderRadius: '6px',
        border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', flex: 1, border: 'none', background: 'transparent',
            cursor: 'pointer', padding: 0, textAlign: 'left', color: theme.colors.text, fontSize: 'var(--font-sm)',
          }}
        >
          <ThemedSvgIcon name={panelOpen ? 'chevron-down' : 'chevron-up'} color={theme.colors.secondary} size={12} />
          {item.icon && <ThemedSvgIcon name={item.icon as IconName} color={theme.colors.text} size={14} />}
          <span>{item.name}</span>
          <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>— {quantityLabel}</span>
        </button>
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

      {!panelOpen && item.comment && (
        <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginLeft: '20px' }}>
          {item.comment}
        </div>
      )}

      {panelOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GroceriesListItemQuantityControls
              quantity={quantity}
              itemQuantity={item.quantity}
              isDivisible={item.is_divisible}
              canEdit={canEdit}
              step={step}
              inputRef={inputRef}
              onChange={setQuantity}
              onCommit={commitQuantity}
              onApplyStep={applyStep}
            />
            {canEdit && onManage && (
              <button
                type="button"
                onClick={onManage}
                title={t('features.groceries.manageItem')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.secondary, display: 'flex' }}
              >
                <ThemedSvgIcon name="settings" color="currentColor" size={16} />
              </button>
            )}
          </div>
          <input
            type="text"
            value={comment}
            disabled={!canEdit}
            onChange={(e) => setComment(e.target.value)}
            onBlur={commitComment}
            placeholder={t('features.groceries.itemCommentPlaceholder')}
            style={{
              padding: '6px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              fontSize: 'var(--font-xs)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GroceriesListColumnRow;
