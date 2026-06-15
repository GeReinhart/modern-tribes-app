export interface LabelInfo {
  id: string;
  name: string;
}

export interface LabelBase {
  name: string;
}

export type LabelCreate = LabelBase;

export interface LabelUpdate {
  name?: string;
}

export interface Label extends LabelBase {
  id: string;
  created_at: string;
  updated_at: string;
}
