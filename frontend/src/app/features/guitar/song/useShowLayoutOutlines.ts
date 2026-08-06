import { useState } from 'react';

const STORAGE_KEY = 'guitarSong.presentation.showLayoutOutlines';

const readStored = (): boolean => localStorage.getItem(STORAGE_KEY) === 'true';

// Lets the presentation view show the same dotted row/column/block outlines the edit view
// shows, as a pure visual aid -- no editing capability comes with it. Remembered per device,
// like the page size choice.
export const useShowLayoutOutlines = () => {
  const [showOutlines, setShowOutlinesState] = useState<boolean>(readStored);

  const setShowOutlines = (value: boolean) => {
    setShowOutlinesState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  return { showOutlines, setShowOutlines };
};
