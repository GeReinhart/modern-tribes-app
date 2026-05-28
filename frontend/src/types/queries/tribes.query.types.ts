import { PositionEnum } from '@/types/position.types';

export interface UserPersonPositionTribe {
  user_id: string;
  user_login: string;
  user_email: string;
  person_id: string;
  person_first_name: string;
  person_last_name: string;
  position: PositionEnum;
  tribe_id: string;
  tribe_url_param_id: string;
  tribe_name: string;
  via_represents: boolean;
}

export interface TribeEntry {
  tribe_id: string;
  tribe_url_param_id: string;
  tribe_name: string;
  /** null when accessed only via represents (no direct person membership) */
  direct_position: PositionEnum | null;
  represented_persons: Array<{
    first_name: string;
    last_name: string;
    position: PositionEnum;
  }>;
}
