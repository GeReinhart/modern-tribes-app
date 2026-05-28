import { DocumentPagesSection } from '@/platform/documents/DocumentPagesSection.tsx';
import { ThemedButton } from '@/platform/themes/components/ThemedButton.tsx';
import { ThemedSection } from '@/platform/themes/components/ThemedSection.tsx';
import { DocumentPage } from '@/types/document-page.types.ts';

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
        >
          {t('documentPages.addPage')}
        </ThemedButton>
      </div>
    </ThemedSection>
  );
};
