export interface RepresentsBase {
  user_id: string;
  person_id: string;
}

export interface RepresentsCreate extends RepresentsBase {
  status?: string;
}

export interface RepresentsUpdate {
  user_id?: string;
  person_id?: string;
  status?: string;
}

export interface Represents extends RepresentsBase {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}
