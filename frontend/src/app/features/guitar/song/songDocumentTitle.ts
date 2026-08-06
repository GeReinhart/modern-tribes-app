import { GuitarSong } from './types.ts';

export const songDocumentTitle = (song: GuitarSong, prefix?: string): string => {
  const titleAndAuthor = song.author ? `${song.title} - ${song.author}` : song.title;
  return prefix ? `${prefix} ${titleAndAuthor}` : titleAndAuthor;
};
