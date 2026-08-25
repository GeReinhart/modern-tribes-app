export interface CatalogItemOption {
  id: string;
  name: string;
  unit: string;
  is_divisible: boolean;
}

export interface RecipeLabel {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Recipe {
  id: string;
  feature_instance_id: string;
  name: string;
  servings: number;
  document_id: string | null;
  document_content_html: string | null;
  status: string;
  label_ids: string[];
}

export interface RecipeCreate {
  feature_instance_id: string;
  name: string;
  servings: number;
  document_content_html?: string;
}

export interface RecipeUpdate {
  name?: string;
  servings?: number;
  document_content_html?: string;
  status?: 'active' | 'archived';
}

export interface RecipeIngredient {
  id: string;
  groceries_item_id: string | null;
  name: string;
  unit: string | null;
  is_divisible: boolean;
  quantity: number;
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredientCreate {
  groceries_item_id?: string;
  custom_name?: string;
  custom_unit?: string;
  quantity: number;
}

export interface RecipeIngredientUpdate {
  quantity?: number;
  position?: number;
}
