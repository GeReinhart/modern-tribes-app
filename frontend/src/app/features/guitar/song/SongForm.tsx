import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedFileUpload } from '@/app/platform/core/layout/themes/components/ThemedFileUpload.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';
import { uploadFileWithMetadata, UploadedFileInfo } from '@/app/platform/functions/documents/editor/editor-upload-utils.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongAuthorPicker } from './SongAuthorPicker.tsx';
import { SongFormTemplatePicker } from './SongFormTemplatePicker.tsx';
import { GuitarSongContentType, GuitarSongCreate } from './types.ts';
import { useGuitarSongAuthors } from './useGuitarSongAuthors.ts';
import { useGuitarSongs } from './useGuitarSongs.ts';

interface SongFormProps {
  projectId: string | null;
  onSubmit: (data: GuitarSongCreate) => Promise<void>;
  onCancel: () => void;
}

export const SongForm: React.FC<SongFormProps> = ({ projectId, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const authors = useGuitarSongAuthors(projectId);
  const { songs: existingSongs } = useGuitarSongs(projectId || '');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [copyFromSongId, setCopyFromSongId] = useState('');
  const [contentType, setContentType] = useState<GuitarSongContentType>(GuitarSongContentType.layout);
  const [templateSongId, setTemplateSongId] = useState('');
  const [blankLayout, setBlankLayout] = useState(false);
  const [pdfFile, setPdfFile] = useState<UploadedFileInfo | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [saving, setSaving] = useState(false);

  const isPdf = !copyFromSongId && contentType === GuitarSongContentType.pdf;
  // A layout song's own layout can be used as a template; a PDF song has no layout to copy.
  const templateSongs = existingSongs.filter((s) => s.content_type === GuitarSongContentType.layout);

  const handlePdfSelect = async (file: File) => {
    setPdfError('');
    setUploadingPdf(true);
    try {
      setPdfFile(await uploadFileWithMetadata(file));
    } catch {
      setPdfError(t('guitarSong.form.pdfFileUploadError'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (isPdf && !pdfFile)) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim() || null,
        copy_from_song_id: copyFromSongId || null,
        ...(copyFromSongId
          ? {}
          : isPdf
            ? {
                content_type: GuitarSongContentType.pdf,
                pdf_file_url: pdfFile?.url, pdf_file_name: pdfFile?.name, pdf_file_size: pdfFile?.size,
              }
            : { template_song_id: blankLayout ? null : (templateSongId || null), blank_layout: blankLayout }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ThemedInput
        label={t('guitarSong.form.title')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        required
      />
      <SongAuthorPicker authors={authors} value={author} onChange={setAuthor} />
      <SongFormTemplatePicker
        songs={existingSongs}
        value={copyFromSongId}
        onChange={setCopyFromSongId}
        label={t('guitarSong.form.copyFromSong')}
        helperText={t('guitarSong.form.copyFromSongHelp')}
        placeholder={t('guitarSong.form.copyFromSongPlaceholder')}
      />
      {!copyFromSongId && (
        <>
          <ThemedSelect
            label={t('guitarSong.form.contentType')}
            helperText={t('guitarSong.form.contentTypeHelp')}
            options={[
              { value: GuitarSongContentType.layout, label: t('guitarSong.form.contentTypeLayout') },
              { value: GuitarSongContentType.pdf, label: t('guitarSong.form.contentTypePdf') },
            ]}
            value={contentType}
            onChange={(value) => setContentType(value as GuitarSongContentType)}
            allowEmpty={false}
          />
          {isPdf ? (
            <ThemedFileUpload
              label={t('guitarSong.form.pdfFile')}
              helperText={pdfFile ? undefined : t('guitarSong.form.pdfFileHelp')}
              error={pdfError}
              accept="application/pdf"
              buttonLabel={t('guitarSong.form.pdfFileButton')}
              uploading={uploadingPdf}
              fileName={pdfFile?.name}
              onSelect={handlePdfSelect}
            />
          ) : (
            <>
              <ThemedCheckbox
                label={t('guitarSong.form.blankLayout')}
                helperText={t('guitarSong.form.blankLayoutHelp')}
                checked={blankLayout}
                onChange={setBlankLayout}
              />
              {!blankLayout && (
                <SongFormTemplatePicker
                  songs={templateSongs}
                  value={templateSongId}
                  onChange={setTemplateSongId}
                  label={t('guitarSong.form.template')}
                  helperText={t('guitarSong.form.templateHelp')}
                  placeholder={t('guitarSong.form.templatePlaceholder')}
                />
              )}
            </>
          )}
        </>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedSubmitButton type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          {t('common.cancel')}
        </ThemedSubmitButton>
        <ThemedSubmitButton
          type="submit" fullWidth={false} isLoading={saving}
          disabled={!title.trim() || (isPdf && !pdfFile)}
        >
          {t('common.create')}
        </ThemedSubmitButton>
      </div>
    </form>
  );
};
