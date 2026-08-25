export interface PersonOption {
  id: string;
  name: string;
}

export interface RecipeOption {
  id: string;
  name: string;
}

export interface MealParticipantInfo {
  person_id: string;
  person_name: string;
}

export interface Meal {
  id: string;
  feature_instance_id: string;
  title: string;
  start_at: string;
  end_at: string;
  headcount: number;
  status: string;
  participant_ids: string[];
  participants: MealParticipantInfo[];
  recipe_ids: string[];
}

export interface MealCreate {
  feature_instance_id: string;
  title: string;
  start_at: string;
  end_at: string;
  headcount: number;
}

export interface MealUpdate {
  title?: string;
  start_at?: string;
  end_at?: string;
  headcount?: number;
  status?: 'active' | 'archived';
}

export interface GrocerySuggestionIngredient {
  groceries_item_id: string | null;
  name: string;
  unit: string | null;
  quantity: number;
}

export interface GrocerySuggestion {
  meal_id: string;
  meal_title: string;
  meal_start_at: string;
  recipe_id: string;
  recipe_name: string;
  headcount: number;
  ingredients: GrocerySuggestionIngredient[];
}
