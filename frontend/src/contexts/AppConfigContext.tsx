import { useAuth } from '@/platform/authentication/AuthContext';
import { appConfigService } from '@/services/app-config.service';
import { AppConfigValues } from '@/types/app-config.types';

import React, { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_CONFIG: AppConfigValues = {
  uploadMaxFiles: 5,
  uploadMaxFileSizeMb: 10,
  editorImageExtensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
};

function parseConfig(
  entries: { key: string; value: string }[],
): AppConfigValues {
  const map = Object.fromEntries(entries.map((e) => [e.key, e.value]));
  return {
    uploadMaxFiles:
      parseInt(map['upload.max_files'] ?? '5', 10) ||
      DEFAULT_CONFIG.uploadMaxFiles,
    uploadMaxFileSizeMb:
      parseInt(map['upload.max_file_size_mb'] ?? '10', 10) ||
      DEFAULT_CONFIG.uploadMaxFileSizeMb,
    editorImageExtensions: map['editor.image_extensions']
      ? map['editor.image_extensions']
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_CONFIG.editorImageExtensions,
  };
}

interface AppConfigContextType {
  config: AppConfigValues;
  isLoading: boolean;
  reload: () => void;
}

const AppConfigContext = createContext<AppConfigContextType>({
  config: DEFAULT_CONFIG,
  isLoading: false,
  reload: () => {},
});

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState<AppConfigValues>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    appConfigService
      .getPublic()
      .then((entries) => setConfig(parseConfig(entries)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, tick]);

  const reload = () => setTick((t) => t + 1);

  return (
    <AppConfigContext.Provider value={{ config, isLoading, reload }}>
      {children}
    </AppConfigContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppConfig() {
  return useContext(AppConfigContext);
}
