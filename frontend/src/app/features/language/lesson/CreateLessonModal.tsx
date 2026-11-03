import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Lesson } from '../shared/types.ts';

interface Props {
  onClose: () => void;
  onCreate: (title: string) => Promise<Lesson | null>;
}

const CreateLessonModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isValid = title.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const created = await onCreate(title.trim());
    setSubmitting(false);
    if (created) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.language.newLesson')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <ThemedInput
            label={t('features.language.lessonTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('features.language.lessonTitlePlaceholder')}
            autoFocus
          />
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.language.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!isValid}>
            {t('features.language.create')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default CreateLessonModal;
