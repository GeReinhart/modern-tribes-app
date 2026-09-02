import React, { useEffect, useState } from 'react';

import { SongAuthorPicker } from './SongAuthorPicker.tsx';
import { useGuitarSongAuthors } from './useGuitarSongAuthors.ts';

interface SongAuthorEditableFieldProps {
  projectId: string;
  value: string;
  onSave: (value: string) => Promise<void>;
}

// Wraps SongAuthorPicker with the draft/commit-on-blur pattern the rest of the song's inline
// editable fields use (see SongInlineEditableText), instead of persisting on every keystroke.
export const SongAuthorEditableField: React.FC<SongAuthorEditableFieldProps> = ({ projectId, value, onSave }) => {
  const authors = useGuitarSongAuthors(projectId);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = (next: string) => {
    if (next !== value) onSave(next);
  };

  return (
    <SongAuthorPicker authors={authors} value={draft} onChange={setDraft} onCommit={commit} />
  );
};
