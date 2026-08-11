import { useState } from 'react';

export const usePersistedBoolean = (key: string, defaultValue = false): [boolean, () => void] => {
  const [value, setValue] = useState<boolean>(() => {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  });

  const toggle = () => {
    setValue((previous) => {
      const next = !previous;
      localStorage.setItem(key, String(next));
      return next;
    });
  };

  return [value, toggle];
};
