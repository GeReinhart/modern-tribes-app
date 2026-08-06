import { useState } from 'react';

export type PresentationPageSize = 'a4' | 'letter' | 'full';

const STORAGE_KEY = 'guitarSong.presentation.pageSize';

// A4/Letter widths in mm — the same unit the PDF's own @page size and margins use, so the
// on-screen preview lines up with what actually prints.
const PAGE_WIDTHS_MM: Record<PresentationPageSize, number | null> = {
  a4: 210,
  letter: 215.9,
  full: null,
};

const readStored = (): PresentationPageSize => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'a4' || stored === 'letter' || stored === 'full' ? stored : 'a4';
};

export const usePresentationPageSize = () => {
  const [pageSize, setPageSizeState] = useState<PresentationPageSize>(readStored);

  const setPageSize = (value: PresentationPageSize) => {
    setPageSizeState(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  const widthMm = PAGE_WIDTHS_MM[pageSize];
  return { pageSize, setPageSize, maxWidth: widthMm ? `${widthMm}mm` : undefined };
};
