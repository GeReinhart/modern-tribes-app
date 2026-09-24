import { ThemedFileUpload } from '@/app/platform/core/layout/themes/components/ThemedFileUpload.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { uploadFileWithMetadata } from '@/app/platform/functions/documents/editor/editor-upload-utils.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongDetail, GuitarSongState } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongPdfContentProps {
  song: GuitarSongDetail;
  canEdit: boolean;
  hook: ReturnType<typeof useGuitarSong>;
}

// The whole content of a PDF-content song (see GuitarSongContentType) -- an inline preview of
// the uploaded file, with an "open in a new tab" fallback since inline PDF rendering is
// unreliable on some mobile browsers, and a "replace" upload while still a draft.
export const SongPdfContent: React.FC<SongPdfContentProps> = ({ song, canEdit, hook }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const canReplace = canEdit && song.song_state === GuitarSongState.draft;

  const handleReplace = async (file: File) => {
    setError('');
    setUploading(true);
    try {
      const info = await uploadFileWithMetadata(file);
      await hook.updateSongFields({ pdf_file_url: info.url, pdf_file_name: info.name, pdf_file_size: info.size });
    } catch {
      setError(t('guitarSong.form.pdfFileUploadError'));
    } finally {
      setUploading(false);
    }
  };

  if (!song.pdf_file_url) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
        <a
          href={song.pdf_file_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme.colors.primary, textDecoration: 'underline', fontSize: 'var(--font-sm)' }}
        >
          {t('guitarSong.pdf.openInNewTab')}
        </a>
        {canReplace && (
          <ThemedFileUpload
            accept="application/pdf"
            buttonLabel={t('guitarSong.pdf.replaceButton')}
            helperText={t('guitarSong.pdf.replaceHelp')}
            uploading={uploading}
            error={error}
            onSelect={handleReplace}
          />
        )}
      </div>
      <iframe
        src={song.pdf_file_url}
        title={song.title}
        style={{ width: '100%', height: '80vh', border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)' }}
      />
    </div>
  );
};
