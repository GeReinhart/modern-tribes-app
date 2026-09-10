import React from 'react';

import RecipeIngredientRow from './RecipeIngredientRow.tsx';
import { RecipeIngredient, RecipeIngredientUpdate } from './types.ts';

const noop = () => undefined;

interface Props {
  title?: string;
  ingredients: RecipeIngredient[];
  canEdit: boolean;
  onMove?: (ingredientId: string, direction: 'up' | 'down') => void;
  onUpdateIngredient?: (ingredientId: string, data: RecipeIngredientUpdate) => void;
  onRemove?: (ingredientId: string) => void;
}

// Renders one ingredient group (main / condiments / accompaniments) as either an editable
// list (recipe's own ingredients) or a plain read-only bullet list (a component's ingredients,
// or the recipe's own when read-only) — shared so the two never drift apart.
const IngredientGroupBlock: React.FC<Props> = ({
  title, ingredients, canEdit, onMove = noop, onUpdateIngredient = noop, onRemove = noop,
}) => {
  if (ingredients.length === 0) return null;
  const rows = ingredients.map((ingredient, index) => (
    <RecipeIngredientRow
      key={ingredient.id}
      ingredient={ingredient}
      canEdit={canEdit}
      canMoveUp={index > 0}
      canMoveDown={index < ingredients.length - 1}
      onMove={onMove}
      onUpdateIngredient={onUpdateIngredient}
      onRemove={onRemove}
    />
  ));
  return (
    <div style={{ breakInside: 'avoid' }}>
      {title && <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', margin: '10px 0 4px' }}>{title}</div>}
      {canEdit ? rows : <ul style={{ margin: 0, paddingLeft: '20px' }}>{rows}</ul>}
    </div>
  );
};

export default IngredientGroupBlock;
