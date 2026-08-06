import { useState } from 'react';

import { triggerSongPdfDownload } from './layoutService.ts';

export const useSongPdfDownload = (songId: string, songTitle: string) => {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await triggerSongPdfDownload(songId, songTitle);
    } finally {
      setDownloading(false);
    }
  };

  return { download, downloading };
};
