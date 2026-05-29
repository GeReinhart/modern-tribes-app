import EditorFileUploader from '@/platform/functions/documents/editor/EditorFileUploader.tsx';
import EditorJoditComponent from '@/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { LabelSelector } from '@/platform/core/layout/themes/components/LabelSelector.tsx';
import { ThemedSection } from '@/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import { AttachmentFile } from '@/types/document.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface ProjectDocumentFieldsProps {
  title: string;
  onTitleChange: (v: string) => void;
  labelNames: string[];
  onLabelNamesChange: (v: string[]) => void;
  allLabelSuggestions: string[];
  tocDepth: number;
  onTocDepthChange: (v: number) => void;
  content: string;
  onContentChange: (v: string) => void;
  attachments: AttachmentFile[];
  onAttachmentsChange: (v: AttachmentFile[]) => void;
}

export const ProjectDocumentFields: React.FC<ProjectDocumentFieldsProps> = ({
  title,
  onTitleChange,
  labelNames,
  onLabelNamesChange,
  allLabelSuggestions,
  tocDepth,
  onTocDepthChange,
  content,
  onContentChange,
  attachments,
  onAttachmentsChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <ThemedSection themeId="main_1">
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            color: theme.colors.secondary,
            marginBottom: '6px',
          }}
        >
          {t('projectDocuments.title')} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('projectDocuments.titlePlaceholder')}
          style={inputStyle}
          required
          autoFocus
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <LabelSelector
          label={t('projectDocuments.labels')}
          value={labelNames}
          onChange={onLabelNamesChange}
          suggestions={allLabelSuggestions}
          placeholder={t('projectDocuments.labelsPlaceholder')}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <ThemedText size="small" variant="secondary" style={{ marginBottom: '8px' }}>
          {t('projectDocuments.tocDepthLabel')}
        </ThemedText>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([1, 2, 3, 4] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onTocDepthChange(d)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: `1px solid ${tocDepth === d ? theme.colors.primary : theme.colors.border}`,
                backgroundColor: tocDepth === d ? theme.colors.primary : theme.colors.surface,
                color: tocDepth === d ? '#fff' : theme.colors.secondary,
                cursor: 'pointer',
                fontSize: 'var(--font-sm)',
                fontWeight: tocDepth === d ? 600 : 400,
              }}
            >
              H{d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <ThemedText size="small" variant="secondary" style={{ marginBottom: '8px' }}>
          {t('projects.description')}
        </ThemedText>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <EditorJoditComponent content={content} onChange={onContentChange} />
        </div>
      </div>

      <div>
        <EditorFileUploader attachments={attachments} onAttachmentsChange={onAttachmentsChange} />
      </div>
    </ThemedSection>
  );
};
