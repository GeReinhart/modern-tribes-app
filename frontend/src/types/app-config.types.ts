export interface AppConfigEntry {
  id: string;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AppConfigPublic {
  key: string;
  value: string;
}

export interface AppConfigValues {
  uploadMaxFiles: number;
  uploadMaxFileSizeMb: number;
  editorImageExtensions: string[];
}

export interface AppConfigCreate {
  key: string;
  value: string;
  description?: string;
}

export interface AppConfigUpdate {
  value?: string;
  description?: string;
}
