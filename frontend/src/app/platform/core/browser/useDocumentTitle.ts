import { useEffect } from 'react';

export const useDocumentTitle = (title: string | undefined): void => {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
};
