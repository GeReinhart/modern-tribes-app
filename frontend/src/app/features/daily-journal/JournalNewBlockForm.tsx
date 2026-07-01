import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onSave: (contentHtml: string) => Promise<void>;
  onCancel: () => void;
}

const JournalNewBlockForm: React.FC<Props> = ({ onSave, onCancel }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(content);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      border: `1.5px dashed ${theme.colors.primary}`,
      borderRadius: '8px',
      padding: '10px 12px',
      backgroundColor: theme.colors.surface,
    }}>
      <EditorJoditComponent content={content} onChange={setContent} minHeight={160} compact />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          style={{
            padding: '6px 16px', borderRadius: '6px',
            background: theme.colors.primary, color: '#fff',
            border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 'var(--font-sm)',
            opacity: saving || !content.trim() ? 0.5 : 1,
          }}
        >
          {t('journal.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 16px', borderRadius: '6px',
            background: 'none', color: theme.colors.secondary,
            border: `1px solid ${theme.colors.border}`,
            cursor: 'pointer', fontSize: 'var(--font-sm)',
          }}
        >
          {t('journal.cancel')}
        </button>
      </div>
    </div>
  );
};

export default JournalNewBlockForm;
