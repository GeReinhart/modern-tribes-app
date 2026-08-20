import type { GroceriesUnit } from '@/types/groceries.ts';

export interface PersonOption {
  id: string;
  name: string;
}

export interface GroceriesItem {
  id: string;
  name: string;
  description: string;
  unit: GroceriesUnit;
  icon: string | null;
  is_divisible: boolean;
  status: string;
  section_ids: string[];
  renewal_duration_days: number | null;
}

export interface GroceriesItemCreate {
  feature_instance_id: string;
  name: string;
  description?: string;
  unit: GroceriesUnit;
  icon?: string;
  is_divisible?: boolean;
}

export interface GroceriesItemUpdate {
  feature_instance_id: string;
  name?: string;
  description?: string;
  unit?: GroceriesUnit;
  icon?: string;
  is_divisible?: boolean;
  status?: 'active' | 'archived';
}

export interface GroceriesItemRenewalUpdate {
  feature_instance_id: string;
  renewal_duration_days?: number | null;
}

export interface GroceriesSection {
  id: string;
  name: string;
  icon: string | null;
  status: string;
}

export interface GroceriesSectionCreate {
  feature_instance_id: string;
  name: string;
  icon?: string;
}

export interface GroceriesSectionUpdate {
  feature_instance_id: string;
  name?: string;
  icon?: string;
}

export interface GroceriesList {
  id: string;
  feature_instance_id: string;
  name: string | null;
  scheduled_date: string;
  list_status: 'planned' | 'done';
  assigned_person_id: string | null;
  force_on_dashboard: boolean;
  status: string;
}

export interface GroceriesListCreate {
  feature_instance_id: string;
  name?: string;
  scheduled_date: string;
  assigned_person_id?: string;
  force_on_dashboard?: boolean;
}

export interface GroceriesListItemDetail {
  id: string;
  groceries_item_id: string;
  name: string;
  unit: GroceriesUnit;
  icon: string | null;
  is_divisible: boolean;
  quantity: number;
  picked_up: boolean;
  section_ids: string[];
}

export interface GroceriesListDetail extends GroceriesList {
  items: GroceriesListItemDetail[];
}

export interface GroceriesListItem {
  id: string;
  groceries_list_id: string;
  groceries_item_id: string;
  quantity: number;
  picked_up: boolean;
  status: string;
}

export interface GroceriesListItemUpdate {
  quantity?: number;
  picked_up?: boolean;
}

export interface GroceriesSuggestion {
  groceries_item_id: string;
  name: string;
  unit: GroceriesUnit;
  icon: string | null;
  renewal_duration_days: number;
}
