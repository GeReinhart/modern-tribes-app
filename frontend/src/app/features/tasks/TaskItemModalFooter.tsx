import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  isEditing: boolean;
  canEdit: boolean;
  saving: boolean;
  canSave: boolean;
  onClose: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onSave: () => void;
}

const TaskItemModalFooter: React.FC<Props> = ({
  isEditing, canEdit, saving, canSave, onClose, onCancelEdit, onStartEdit, onSave,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '14px 20px', borderTop: `1px solid ${theme.colors.border}`, gap: '8px' }}>
      {isEditing ? (
        <>
          <ThemedButton variant="ghost" onClick={onCancelEdit} disabled={saving} leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}>
            {t('common.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" onClick={onSave} disabled={saving || !canSave} leftIcon={<ThemedSvgIcon name="save" color="currentColor" size={16} />}>
            {saving ? t('common.saving') : t('common.save')}
          </ThemedButton>
        </>
      ) : (
        <>
          <ThemedButton variant="ghost" onClick={onClose} leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}>
            {t('common.close')}
          </ThemedButton>
          {canEdit && (
            <ThemedButton variant="primary" onClick={onStartEdit}>
              {t('common.edit')}
            </ThemedButton>
          )}
        </>
      )}
    </div>
  );
};

export default TaskItemModalFooter;
