import { GuitarChord } from '../chords/types.ts';

export interface GuitarSong {
  id: string;
  url_param_id: string;
  project_id: string;
  title: string;
  author: string | null;
  tempo_bpm: number;
  beats_per_bar: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarSongCreate {
  title: string;
  author?: string | null;
  tempo_bpm: number;
  beats_per_bar: number;
}

export interface GuitarSongUpdate {
  title?: string;
  author?: string | null;
  tempo_bpm?: number;
  beats_per_bar?: number;
}

export interface GuitarSongChord {
  id: string;
  song_id: string;
  position: number;
  comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  chord: GuitarChord;
}

export interface GuitarSongDetail extends GuitarSong {
  chords: GuitarSongChord[];
}

export interface GuitarSongChordCreate {
  chord_id: string;
  comment?: string | null;
}

export interface GuitarSongChordUpdate {
  comment?: string | null;
}

export type MoveDirection = 'prev' | 'next';
