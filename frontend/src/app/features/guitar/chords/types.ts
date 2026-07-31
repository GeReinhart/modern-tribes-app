export type FretValue = number | 'X';

export interface GuitarChord {
  id: string;
  name: string;
  root_note: string;
  description: string | null;
  frets: FretValue[];
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface GuitarChordCreate {
  name: string;
  root_note: string;
  description?: string | null;
  frets: FretValue[];
}

export interface GuitarChordUpdate {
  name?: string;
  root_note?: string;
  description?: string | null;
  frets?: FretValue[];
}
