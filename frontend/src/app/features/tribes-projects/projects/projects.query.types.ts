import { PositionEnum } from '@/app/features/tribes-projects/positions/position.types.ts';

export interface UserProjectEntry {
  user_id: string;
  project_id: string;
  project_url_param_id: string;
  project_name: string;
  effective_position: PositionEnum;
  via_represents: boolean;
  person_first_name: string | null;
  person_last_name: string | null;
}

export interface ProjectEntry {
  project_id: string;
  project_url_param_id: string;
  project_name: string;
  /** null when accessed only via represents (no direct path) */
  direct_position: PositionEnum | null;
  represented_persons: Array<{
    first_name: string;
    last_name: string;
    position: PositionEnum;
  }>;
}

export interface ProjectTribeMember {
  person_id: string;
  first_name: string;
  last_name: string;
  position: PositionEnum;
}

export interface ProjectTribeWithMembers {
  tribe_id: string;
  tribe_url_param_id: string;
  tribe_name: string;
  members: ProjectTribeMember[];
}
