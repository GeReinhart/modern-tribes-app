import DocumentContentEditor from '@/app/platform/functions/documents/editor/DocumentContentEditor.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { languageService } from '../shared/service.ts';

interface Props {
  lessonId: string;
  title: string;
  documentContent: string;
  canEdit: boolean;
  onUpdateTitle: (title: string) => Promise<boolean>;
  onUpdateDocument: (contentHtml: string) => Promise<boolean>;
}

// The lesson's title and its rich-text write-up -- the title renames inline (blur-to-save,
// like the recipe/meal title fields), the document reuses the shared document editor with its
// own autosave and '<'/'>' revision stepping, exactly like recipes' description field.
const LessonDocumentSection: React.FC<Props> = ({
  lessonId, title, documentContent, canEdit, onUpdateTitle, onUpdateDocument,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!canEdit) {
    return (
      <div style={{ marginTop: '16px' }}>
        <div
          className="prose max-w-none"
          style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}
          dangerouslySetInnerHTML={{ __html: documentContent }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      <ThemedInput
        aria-label={t('features.language.lessonTitle')}
        defaultValue={title}
        onBlur={(e) => {
          const value = e.target.value.trim();
          if (value && value !== title) onUpdateTitle(value);
        }}
      />
      <DocumentContentEditor
        content={documentContent}
        onSave={onUpdateDocument}
        fetchRevisions={() => languageService.getLessonDocumentRevisions(lessonId)}
      />
    </div>
  );
};

export default LessonDocumentSection;
