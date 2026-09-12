import { useCallback, useEffect, useRef, useState } from 'react';

import { DocumentRevision } from './documentRevisionTypes.ts';

const AUTO_SAVE_INTERVAL_MS = 60_000;

// Drives a document's editing buffer, its every-minute-if-changed auto-save, and browsing
// through its revision history. Every save (auto or manual) is treated identically: whatever
// is currently in the buffer becomes the new current version, whether it started from the
// live content or from a past version loaded via goOlder/goNewer -- that's what makes
// re-editing an old version and saving it act as a "restore".
export function useDocumentVersionEditor(
  content: string,
  onSave: (html: string) => Promise<boolean>,
  fetchRevisions: () => Promise<DocumentRevision[]>,
) {
  const [draft, setDraft] = useState(content);
  const [revisions, setRevisions] = useState<DocumentRevision[] | null>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const lastSavedRef = useRef(content);

  useEffect(() => {
    if (viewIndex === 0 && draft === lastSavedRef.current) {
      setDraft(content);
      lastSavedRef.current = content;
    }
    // Only resync when the parent hands us new saved content -- not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const dirty = draft !== lastSavedRef.current;

  const save = useCallback(async () => {
    if (draft === lastSavedRef.current) return;
    const ok = await onSave(draft);
    if (ok) {
      lastSavedRef.current = draft;
      setViewIndex(0);
      setRevisions(null);
    }
  }, [draft, onSave]);

  useEffect(() => {
    const id = setInterval(save, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [save]);

  const ensureRevisionsLoaded = useCallback(async (): Promise<DocumentRevision[]> => {
    if (revisions) return revisions;
    const fetched = await fetchRevisions();
    setRevisions(fetched);
    return fetched;
  }, [revisions, fetchRevisions]);

  const goToIndex = useCallback(async (index: number) => {
    const list = await ensureRevisionsLoaded();
    if (index < 0 || index >= list.length) return;
    setViewIndex(index);
    setDraft(list[index].content_html);
    lastSavedRef.current = list[index].content_html;
  }, [ensureRevisionsLoaded]);

  const goOlder = useCallback(() => goToIndex(viewIndex + 1), [goToIndex, viewIndex]);
  const goNewer = useCallback(() => goToIndex(viewIndex - 1), [goToIndex, viewIndex]);

  const cancel = useCallback(async () => {
    if (viewIndex === 0) {
      setDraft(lastSavedRef.current);
      return;
    }
    await goToIndex(0);
  }, [viewIndex, goToIndex]);

  return {
    draft,
    setDraft,
    dirty,
    save,
    cancel,
    viewIndex,
    goOlder,
    goNewer,
    canGoOlder: revisions ? viewIndex < revisions.length - 1 : true,
    canGoNewer: viewIndex > 0,
  };
}
