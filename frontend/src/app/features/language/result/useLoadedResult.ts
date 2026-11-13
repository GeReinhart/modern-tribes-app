import { useEffect, useState } from 'react';

export interface LoadedResult<T> {
  data: T;
  loading: boolean;
}

// Runs `load` whenever `deps` change: `data` is `empty` until the answer arrives (or when it fails),
// and `loading` is true while waiting, so the results pages can show a spinner.
export function useLoadedResult<T>(load: () => Promise<T>, empty: T, deps: ReadonlyArray<string | undefined>): LoadedResult<T> {
  const [state, setState] = useState<LoadedResult<T>>({ data: empty, loading: true });

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));
    load()
      .then((data) => !cancelled && setState({ data, loading: false }))
      .catch(() => !cancelled && setState({ data: empty, loading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
