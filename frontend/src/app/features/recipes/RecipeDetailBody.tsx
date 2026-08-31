import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedDivider } from '@/app/platform/core/layout/themes/components/ThemedDivider.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddIngredientModal from './AddIngredientModal.tsx';
import RecipeIngredientsList from './RecipeIngredientsList.tsx';
import RecipeLabelsSection from './RecipeLabelsSection.tsx';
import { RecipeDetail, RecipeIngredientCreate, RecipeIngredientUpdate, RecipeLabel } from './types.ts';

interface Props {
  recipe: RecipeDetail;
  labels: RecipeLabel[];
  canEdit: boolean;
  onUpdate: (data: { name?: string; servings?: number; document_content_html?: string }) => Promise<void>;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onToggleLabel: (labelId: string) => Promise<void>;
  onUpdateLabel: (labelId: string, data: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
  onReorderLabel: (orderedIds: string[]) => Promise<void>;
  onAddIngredient: (data: RecipeIngredientCreate) => Promise<boolean>;
  onMoveIngredient: (ingredientId: string, direction: 'up' | 'down') => Promise<void>;
  onUpdateIngredient: (ingredientId: string, data: RecipeIngredientUpdate) => Promise<void>;
  onRemoveIngredient: (ingredientId: string) => Promise<void>;
}

const RecipeDetailBody: React.FC<Props> = ({
  recipe, labels, canEdit, onUpdate, onCreateLabel, onToggleLabel,
  onUpdateLabel, onDeleteLabel, onReorderLabel, onAddIngredient, onMoveIngredient, onUpdateIngredient,
  onRemoveIngredient,
}) => {
  const { t } = useTranslation();
  const [addingIngredient, setAddingIngredient] = useState(false);

  const labelsSection = (
    <RecipeLabelsSection
      labels={labels}
      selectedLabelIds={recipe.label_ids}
      canEdit={canEdit}
      showTitle={canEdit}
      onToggle={onToggleLabel}
      onCreate={onCreateLabel}
      onUpdate={onUpdateLabel}
      onDelete={onDeleteLabel}
      onReorder={onReorderLabel}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {canEdit ? (
        <div style={{ display: 'flex', gap: '16px' }}>
          <ThemedInput
            label={t('features.recipes.name')}
            defaultValue={recipe.name}
            onBlur={(e) => e.target.value.trim() && onUpdate({ name: e.target.value.trim() })}
          />
          <ThemedInput
            label={t('features.recipes.servings')}
            type="number"
            min={1}
            defaultValue={recipe.servings}
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (Number.isInteger(value) && value > 0) onUpdate({ servings: value });
            }}
          />
        </div>
      ) : (
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>{recipe.name}</h2>
          <div>{t('features.recipes.servingsCount', { count: recipe.servings })}</div>
        </div>
      )}

      <RecipeIngredientsList
        ingredients={recipe.ingredients}
        canEdit={canEdit}
        onAdd={() => setAddingIngredient(true)}
        onMove={onMoveIngredient}
        onUpdateIngredient={onUpdateIngredient}
        onRemove={onRemoveIngredient}
      />

      <div>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.recipes.description')}</div>
        {canEdit ? (
          <EditorJoditComponent
            content={recipe.document_content_html || ''}
            onChange={(content) => onUpdate({ document_content_html: content })}
          />
        ) : (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: recipe.document_content_html || '' }} />
        )}
      </div>

      {(canEdit || recipe.label_ids.length > 0) && (
        <>
          <ThemedDivider variant="secondary" />
          {labelsSection}
        </>
      )}

      {addingIngredient && (
        <AddIngredientModal
          featureInstanceId={recipe.feature_instance_id}
          onClose={() => setAddingIngredient(false)}
          onSubmit={onAddIngredient}
        />
      )}
    </div>
  );
};

export default RecipeDetailBody;
