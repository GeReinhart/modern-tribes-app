import { useEffect, useState } from 'react';

interface ApkVersionInfo {
  versionCode: number;
  versionName: string;
}

export interface ApkVersionCheck {
  latestVersionCode: number | null;
  latestVersionName: string | null;
  currentVersionCode: number;
  updateAvailable: boolean;
  isLoading: boolean;
}

const CURRENT_VERSION_CODE = parseInt(import.meta.env.VITE_APK_VERSION_CODE ?? '0', 10);

export function useApkVersionCheck(): ApkVersionCheck {
  const [latest, setLatest] = useState<ApkVersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/apk-version.json')
      .then((r) => r.json() as Promise<ApkVersionInfo>)
      .then(setLatest)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const updateAvailable =
    latest !== null &&
    CURRENT_VERSION_CODE > 0 &&
    latest.versionCode > CURRENT_VERSION_CODE;

  return {
    latestVersionCode: latest?.versionCode ?? null,
    latestVersionName: latest?.versionName ?? null,
    currentVersionCode: CURRENT_VERSION_CODE,
    updateAvailable,
    isLoading,
  };
}
