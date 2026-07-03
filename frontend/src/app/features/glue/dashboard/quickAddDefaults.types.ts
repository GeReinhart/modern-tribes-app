export type QuickAddType = 'task' | 'event';

export interface QuickAddDefaultEntry {
  feature_instance_id: string | null;
}

export interface QuickAddDefaultsResponse {
  task: QuickAddDefaultEntry;
  event: QuickAddDefaultEntry;
}
