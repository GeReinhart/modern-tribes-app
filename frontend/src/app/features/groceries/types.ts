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
  suggested_quantity: number | null;
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

export interface GroceriesItemSuggestedQuantityUpdate {
  feature_instance_id: string;
  suggested_quantity?: number | null;
}

export interface GroceriesSection {
  id: string;
  name: string;
  icon: string | null;
  is_food: boolean;
  status: string;
}

export interface GroceriesSectionCreate {
  feature_instance_id: string;
  name: string;
  icon?: string;
  is_food?: boolean;
}

export interface GroceriesSectionUpdate {
  feature_instance_id: string;
  name?: string;
  icon?: string;
  is_food?: boolean;
}

export interface GroceriesList {
  id: string;
  feature_instance_id: string;
  name: string | null;
  scheduled_date: string | null;
  list_status: 'planned' | 'done' | 'passed';
  assigned_person_id: string | null;
  force_on_dashboard: boolean;
  is_favorite: boolean;
  status: string;
  items_count: number;
  picked_up_count: number;
}

export interface GroceriesListCreate {
  feature_instance_id: string;
  name?: string;
  scheduled_date?: string;
  assigned_person_id?: string;
  force_on_dashboard?: boolean;
  copy_from_list_id?: string;
}

export interface GroceriesListUpdate {
  name?: string;
  scheduled_date?: string;
  clear_scheduled_date?: boolean;
  status?: 'active' | 'archived';
  is_favorite?: boolean;
}

export interface GroceriesListItemDetail {
  id: string;
  groceries_item_id: string | null;
  name: string;
  unit: string | null;
  icon: string | null;
  is_divisible: boolean;
  comment: string | null;
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
  groceries_item_id: string | null;
  custom_name: string | null;
  custom_unit: string | null;
  comment: string | null;
  quantity: number;
  picked_up: boolean;
  status: string;
}

export interface GroceriesListItemCreate {
  groceries_item_id?: string;
  custom_name?: string;
  custom_unit?: string;
  quantity: number;
}

export interface GroceriesListItemUpdate {
  quantity?: number;
  picked_up?: boolean;
  comment?: string;
}

export interface GroceriesSuggestion {
  groceries_item_id: string;
  name: string;
  unit: GroceriesUnit;
  icon: string | null;
  renewal_duration_days: number;
  suggested_quantity: number | null;
}

export interface MealSuggestionIngredient {
  recipe_ingredient_id: string;
  groceries_item_id: string | null;
  name: string;
  unit: string | null;
  quantity: number;
  is_accompaniment: boolean;
}

export interface MealSuggestion {
  meal_id: string;
  meal_title: string | null;
  meal_start_at: string;
  recipe_id: string;
  recipe_name: string;
  headcount: number;
  added: boolean;
  ingredients: MealSuggestionIngredient[];
}

export interface AddedMeal {
  meal_id: string;
  meal_title: string | null;
  meal_start_at: string;
  headcount: number;
  recipe_names: string[];
}
