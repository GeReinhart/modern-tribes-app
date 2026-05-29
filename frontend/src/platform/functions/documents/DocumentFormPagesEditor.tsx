import { DocumentPagesSection } from '@/platform/functions/documents/DocumentPagesSection.tsx';
import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedSection } from '@/platform/core/layout/themes/components/ThemedSection.tsx';
import { DocumentPage } from '@/platform/functions/documents/document-page.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface DocumentFormPagesEditorProps {
  tribeId: string;
  projectId: string;
  projectDocumentId: string;
  pages: DocumentPage[];
  loading: boolean;
  onReordered: () => void;
}

export const DocumentFormPagesEditor: React.FC<
  DocumentFormPagesEditorProps
> = ({ tribeId, projectId, projectDocumentId, pages, loading, onReordered }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const addPagePath = `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/pages/new`;

  return (
    <ThemedSection themeId="main_1">
      <DocumentPagesSection
        tribeId={tribeId}
        projectId={projectId}
        projectDocumentId={projectDocumentId}
        pages={pages}
        loading={loading}
        canEdit
        onReordered={onReordered}
      />
      <div style={{ marginTop: '16px' }}>
        <ThemedButton
          variant="secondary"
          onClick={() => navigate(addPagePath)}
          leftIcon={
            <ThemedSvgIcon name="plus" color="currentColor" size={16} />
          }
        >
          {t('documentPages.addPage')}
        </ThemedButton>
      </div>
    </ThemedSection>
  );
};
