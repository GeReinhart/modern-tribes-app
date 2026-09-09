import { useState } from 'react';

import { triggerMealsPdfDownload } from './service.ts';

export const useMealsPdfDownload = (featureInstanceId: string, startDate: string, endDate: string) => {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await triggerMealsPdfDownload(featureInstanceId, startDate, endDate);
    } finally {
      setDownloading(false);
    }
  };

  return { download, downloading };
};
