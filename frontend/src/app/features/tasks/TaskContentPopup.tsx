import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LabelInfo {
  id: string;
  name: string;
  color: string;
}

interface Props {
  title: string;
  documentContentHtml: string | null;
  labels: LabelInfo[];
  size?: number | null;
  dueDate?: string | null;
  assignedPersonName?: string | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}

interface MetaProps {
  size?: number | null;
  dueDate?: string | null;
  assignedPersonName?: string | null;
}

const PopupMeta: React.FC<MetaProps> = ({ size, dueDate, assignedPersonName }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  if (!size && !dueDate && !assignedPersonName) return null;
  const badgeBase: React.CSSProperties = { fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px' };
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {size && (
        <span style={{ ...badgeBase, background: theme.colors.primary + '22', color: theme.colors.primary, border: `1px solid ${theme.colors.primary}44` }}>
          {t('features.kanban.size')}: {size}
        </span>
      )}
      {dueDate && (
        <span style={{ ...badgeBase, background: theme.colors.accent + '15', color: theme.colors.accent, border: `1px solid ${theme.colors.accent}33` }}>
          {t('features.kanban.dueDate')}: {dueDate}
        </span>
      )}
      {assignedPersonName && (
        <span style={{ ...badgeBase, background: theme.colors.secondary + '15', color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
          {assignedPersonName}
        </span>
      )}
    </div>
  );
};

const TaskContentPopup: React.FC<Props> = ({
  title, documentContentHtml, labels, size, dueDate, assignedPersonName, canEdit, onClose, onEdit,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '8px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor: theme.colors.surface, borderRadius: '14px', border: `1px solid ${theme.colors.border}`, width: '98vw', maxWidth: '98vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 20px 14px', borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ flex: 1, fontSize: 'var(--font-md)', fontWeight: 600, color: theme.colors.text }}>
            {title}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <ThemedSvgIcon name="x" color={theme.colors.secondary} size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {labels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {labels.map((label) => (
                <span key={label.id} style={{ padding: '3px 10px', borderRadius: '10px', background: label.color, color: theme.colors.surface, fontSize: '12px', fontWeight: 600 }}>
                  {label.name}
                </span>
              ))}
            </div>
          )}
          <PopupMeta size={size} dueDate={dueDate} assignedPersonName={assignedPersonName} />
          {documentContentHtml ? (
            <div className="prose max-w-none" style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} dangerouslySetInnerHTML={{ __html: documentContentHtml }} />
          ) : (
            <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, fontStyle: 'italic' }}>
              {t('features.kanban.noDocument')}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '14px 20px', borderTop: `1px solid ${theme.colors.border}`, gap: '8px' }}>
          <ThemedButton variant="ghost" onClick={onClose} leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}>
            {t('common.close')}
          </ThemedButton>
          {canEdit && (
            <ThemedButton variant="primary" onClick={onEdit} leftIcon={<ThemedSvgIcon name="pencil" color="currentColor" size={16} />}>
              {t('common.edit')}
            </ThemedButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskContentPopup;
