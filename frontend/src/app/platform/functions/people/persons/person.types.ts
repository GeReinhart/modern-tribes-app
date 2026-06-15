export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface PersonBase {
  first_name: string;
  last_name: string;
  gender: Gender;
  document_id?: string | null;
}

export type PersonCreate = PersonBase;

export interface PersonUpdate {
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  document_id?: string | null;
  status?: string;
}

export interface Person extends PersonBase {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

