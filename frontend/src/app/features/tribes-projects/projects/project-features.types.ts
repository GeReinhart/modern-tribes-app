export interface ProjectFeatureInstance {
  id: string;
  project_id: string;
  feature_type: string;
  name: string | null;
  icon?: string | null;
  theme_code?: string | null;
  status: 'active' | 'archived';
  position: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProjectFeatureInstanceCreate {
  feature_type: string;
  name?: string;
  icon?: string | null;
  position?: number;
  theme_code?: string | null;
}

export interface ProjectFeatureInstanceUpdate {
  name?: string;
  icon?: string | null;
  status?: string;
  position?: number;
  theme_code?: string | null;
}

export interface FeatureTypeInfo {
  feature_type: string;
  label: string;
}
