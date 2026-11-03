import { useCallback, useState } from 'react';

const readStored = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, blocked): the choice simply isn't remembered.
  }
};

export const usePersistedString = <T extends string>(
  key: string,
  allowedValues: readonly T[],
  defaultValue: T,
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    const stored = readStored(key);
    return allowedValues.find((allowed) => allowed === stored) ?? defaultValue;
  });

  const update = useCallback((next: T) => {
    setValue(next);
    writeStored(key, next);
  }, [key]);

  return [value, update];
};
