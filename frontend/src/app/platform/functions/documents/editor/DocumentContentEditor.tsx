import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { DocumentRevision } from './documentRevisionTypes.ts';
import { useDocumentVersionEditor } from './useDocumentVersionEditor.ts';

interface Props {
  content: string;
  onSave: (contentHtml: string) => Promise<boolean>;
  fetchRevisions: () => Promise<DocumentRevision[]>;
  compact?: boolean;
  minimal?: boolean;
  minHeight?: number;
  allowFullscreen?: boolean;
  // For a caller that wraps this in its own "editing" toggle (e.g. a card that only shows the
  // editor once the user clicks a pencil icon): fires once a manual Save has committed, or once
  // Cancel has discarded the draft -- not on every silent autosave tick.
  onDone?: () => void;
}

// Drop-in replacement for a bare EditorJoditComponent + its Save/Cancel buttons: adds
// every-minute autosave (only while the content actually changed) and '<'/'>' navigation
// through the document's revision history, editable in place -- saving from an old version
// makes it the new current one, per the app's document versioning feature.
const DocumentContentEditor: React.FC<Props> = ({
  content, onSave, fetchRevisions, compact, minimal, minHeight, allowFullscreen, onDone,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const editor = useDocumentVersionEditor(content, onSave, fetchRevisions);

  return (
    <div>
      <EditorJoditComponent
        content={editor.draft}
        onChange={editor.setDraft}
        compact={compact}
        minimal={minimal}
        minHeight={minHeight}
        allowFullscreen={allowFullscreen}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
        <ThemedButton
          variant="ghost"
          icon="arrow-left"
          iconOnly
          onClick={editor.goOlder}
          disabled={!editor.canGoOlder}
        >
          {t('common.previousVersion')}
        </ThemedButton>
        <ThemedButton
          variant="ghost"
          icon="arrow-right"
          iconOnly
          onClick={editor.goNewer}
          disabled={!editor.canGoNewer}
        >
          {t('common.nextVersion')}
        </ThemedButton>
        {editor.viewIndex > 0 && (
          <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
            {t('common.viewingPastVersion')}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <ThemedButton
          variant="secondary"
          onClick={async () => { await editor.cancel(); onDone?.(); }}
          disabled={!editor.dirty && editor.viewIndex === 0}
        >
          {t('common.cancel')}
        </ThemedButton>
        <ThemedButton
          onClick={async () => { await editor.save(); onDone?.(); }}
          disabled={!editor.dirty}
        >
          {t('common.save')}
        </ThemedButton>
      </div>
    </div>
  );
};

export default DocumentContentEditor;
