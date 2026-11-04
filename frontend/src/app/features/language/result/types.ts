export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

export interface ScoreHistory {
  points: ScoreHistoryPoint[];
}

export interface EffortDay {
  date: string;
  success: number;
  errors: number;
}

export interface EffortHistory {
  days: EffortDay[];
}

export interface CompetitionMember {
  user_id: string;
  name: string;
  points: ScoreHistoryPoint[];
}

export interface CompetitionHistory {
  members: CompetitionMember[];
}

export interface ResultMember {
  user_id: string;
  name: string;
}
