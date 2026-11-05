import { personService } from '@/app/platform/functions/people/persons/person.service.ts';
import { invalidateUserDisplayInfo } from '@/app/platform/functions/people/users/useUserDisplayInfo.ts';

import { ChangeEvent, RefObject, useCallback, useRef, useState } from 'react';

interface PersonPhoto {
  inputRef: RefObject<HTMLInputElement>;
  openPicker: () => void;
  onFileChosen: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  remove: () => Promise<void>;
  busy: boolean;
  error: string | null;
}

// Changing or removing the photo of one person (the profile owner), then refreshing what shows it.
export function usePersonPhoto(personId: string | undefined, userId: string | undefined, onChanged: () => Promise<void>): PersonPhoto {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (userId) invalidateUserDisplayInfo(userId);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [userId, onChanged]);

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && personId) await run(() => personService.setPhoto(personId, file));
  };

  const remove = async () => {
    if (personId) await run(() => personService.removePhoto(personId));
  };

  return { inputRef, openPicker: () => inputRef.current?.click(), onFileChosen, remove, busy, error };
}
