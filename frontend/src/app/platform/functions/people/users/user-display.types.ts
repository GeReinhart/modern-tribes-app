export interface UserDisplayInfo {
  user_id: string;
  login: string;
  first_name: string | null;
  last_name: string | null;
  photo_url?: string | null;
}
