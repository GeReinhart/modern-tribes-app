import { ThemedSvgIcon } from '@/platform/core/layout/themes/icons/ThemedSvgIcon';
import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const compactBtn: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: 'var(--font-xs)',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.15s',
};

interface AddColumnFormProps {
  onAdd: (name: string) => Promise<unknown>;
}

const AddColumnForm: React.FC<AddColumnFormProps> = ({ onAdd }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    await onAdd(trimmed);
    setName('');
    setSubmitting(false);
  };

  if (!show)
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          padding: '10px 14px',
          border: `2px dashed ${theme.colors.border}`,
          borderRadius: '10px',
          background: 'none',
          cursor: 'pointer',
          color: theme.colors.secondary,
          fontSize: 'var(--font-sm)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <ThemedSvgIcon name="plus" color={theme.colors.secondary} size={14} />
        {t('features.kanban.addColumn')}
      </button>
    );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '10px',
        backgroundColor: theme.colors.surface,
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('features.kanban.addColumnPlaceholder')}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShow(false);
            setName('');
          }
        }}
        style={{
          padding: '7px 10px',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '6px',
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          fontSize: 'var(--font-sm)',
        }}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          style={{
            ...compactBtn,
            background:
              !name.trim() || submitting
                ? theme.colors.border
                : theme.colors.primary,
            color:
              !name.trim() || submitting
                ? theme.colors.secondary
                : theme.colors.surface,
          }}
        >
          {t('features.kanban.addColumn')}
        </button>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            setName('');
          }}
          style={{
            ...compactBtn,
            background: theme.colors.surface,
            color: theme.colors.secondary,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
};

export default AddColumnForm;
