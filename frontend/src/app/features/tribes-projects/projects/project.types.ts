export interface ProjectBase {
  name: string;
  document_id: string;
  theme_code?: string | null;
}

export type ProjectCreate = ProjectBase;

export interface ProjectUpdate {
  name?: string;
  document_id?: string;
  status?: string;
  theme_code?: string | null;
}

export interface Project extends ProjectBase {
  id: string;
  url_param_id: string;
  status: string;
  theme_code?: string | null;
  created_at: string;
  updated_at: string;
}
