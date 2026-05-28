export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface BaseEntity {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type FormMode = 'create' | 'edit' | 'view';

export interface SelectOption {
  value: string;
  label: string;
}
