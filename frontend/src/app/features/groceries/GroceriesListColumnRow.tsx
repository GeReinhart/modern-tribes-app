import { ThemedQuantityStepper } from '@/app/platform/core/layout/themes/components/ThemedQuantityStepper.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatQuantityUnit } from './formatQuantity.ts';
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
  const [previewQuantity, setPreviewQuantity] = useState(item.quantity);
  const [comment, setComment] = useState(item.comment ?? '');

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
    setPreviewQuantity(item.quantity);
  }, [item.quantity]);

  const quantityLabel = formatQuantityUnit(previewQuantity, item.unit, item.is_divisible);

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
        <div
          style={{
            fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginLeft: '20px', whiteSpace: 'pre-line',
          }}
        >
          {item.comment}
        </div>
      )}

      {panelOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemedQuantityStepper
              value={item.quantity}
              isDivisible={item.is_divisible}
              canEdit={canEdit}
              onChange={(value) => onUpdateQuantity(item.id, value)}
              inputRef={inputRef}
              onPreview={(text) => {
                const parsed = Number(text);
                if (!Number.isNaN(parsed)) setPreviewQuantity(parsed);
              }}
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
          <textarea
            value={comment}
            disabled={!canEdit}
            onChange={(e) => setComment(e.target.value)}
            onBlur={commitComment}
            placeholder={t('features.groceries.itemCommentPlaceholder')}
            rows={comment.split('\n').length}
            style={{
              padding: '6px 8px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              fontSize: 'var(--font-xs)',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GroceriesListColumnRow;
