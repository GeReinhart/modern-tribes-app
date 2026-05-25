export interface ProjectFeatureInstance {
  id: string;
  project_id: string;
  feature_type: string;
  name: string;
  status: 'active' | 'archived';
  position: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProjectFeatureInstanceCreate {
  feature_type: string;
  name: string;
  position?: number;
}

export interface ProjectFeatureInstanceUpdate {
  name?: string;
  status?: string;
  position?: number;
}

export interface FeatureTypeInfo {
  feature_type: string;
  label: string;
}
