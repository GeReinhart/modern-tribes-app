import { useState } from 'react';

export type PresentationPageSize = 'a4' | 'letter' | 'full' | 'custom';

const PRESET_STORAGE_KEY = 'guitarSong.presentation.pageSize';
const CUSTOM_WIDTH_STORAGE_KEY = 'guitarSong.presentation.customPageWidthMm';

export const MIN_CUSTOM_PAGE_WIDTH_MM = 100;
export const MAX_CUSTOM_PAGE_WIDTH_MM = 500;
const DEFAULT_CUSTOM_WIDTH_MM = 210;

// A4/Letter widths in mm — the same unit the PDF's own @page size and margins use, so the
// on-screen preview lines up with what actually prints. "full" has no width of its own (it
// stretches to the viewport); "custom" reads its width from its own separately stored value.
export const PRESET_PAGE_WIDTHS_MM: Record<'a4' | 'letter', number> = {
  a4: 210,
  letter: 215.9,
};

const readStoredPreset = (): PresentationPageSize => {
  const stored = localStorage.getItem(PRESET_STORAGE_KEY);
  return stored === 'a4' || stored === 'letter' || stored === 'full' || stored === 'custom' ? stored : 'a4';
};

const readStoredCustomWidth = (): number => {
  const stored = Number(localStorage.getItem(CUSTOM_WIDTH_STORAGE_KEY));
  return stored >= MIN_CUSTOM_PAGE_WIDTH_MM && stored <= MAX_CUSTOM_PAGE_WIDTH_MM ? stored : DEFAULT_CUSTOM_WIDTH_MM;
};

export const usePresentationPageSize = () => {
  const [pageSize, setPageSizeState] = useState<PresentationPageSize>(readStoredPreset);
  const [customWidthMm, setCustomWidthMmState] = useState<number>(readStoredCustomWidth);

  const setPageSize = (value: PresentationPageSize) => {
    setPageSizeState(value);
    localStorage.setItem(PRESET_STORAGE_KEY, value);
  };

  const setCustomWidthMm = (value: number) => {
    setCustomWidthMmState(value);
    localStorage.setItem(CUSTOM_WIDTH_STORAGE_KEY, String(value));
  };

  const widthMm = pageSize === 'full' ? null : pageSize === 'custom' ? customWidthMm : PRESET_PAGE_WIDTHS_MM[pageSize];
  return { pageSize, setPageSize, customWidthMm, setCustomWidthMm, maxWidth: widthMm ? `${widthMm}mm` : undefined };
};
