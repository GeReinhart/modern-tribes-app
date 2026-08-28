export interface CatalogItemOption {
  id: string;
  name: string;
  unit: string;
  is_divisible: boolean;
  section_ids: string[];
}

export interface CatalogSectionOption {
  id: string;
  name: string;
  icon: string | null;
  is_food: boolean;
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
  position: number;
  is_accompaniment: boolean;
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredientCreate {
  groceries_item_id?: string;
  custom_name?: string;
  custom_unit?: string;
  quantity: number;
  is_accompaniment?: boolean;
}

export interface RecipeIngredientUpdate {
  quantity?: number;
  position?: number;
  is_accompaniment?: boolean;
}
