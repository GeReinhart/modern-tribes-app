import { ThemedButton } from '@/platform/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/platform/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/platform/themes/components/ThemedSelect.tsx';
import { ThemedText } from '@/platform/themes/components/ThemedText';
import { useFeatureTypes } from '@/hooks/useProjectFeatures';
import { FeatureTypeInfo } from '@/types/project-features.types';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface FeatureDraft {
  localId: string;
  feature_type: string;
  name: string;
}

interface Props {
  drafts: FeatureDraft[];
  onChange: (drafts: FeatureDraft[]) => void;
  disabled: boolean;
}

let _counter = 0;
export function makeFeatureDraftId(): string {
  return `draft_${++_counter}`;
}

const FeatureRow: React.FC<{
  draft: FeatureDraft;
  featureTypes: FeatureTypeInfo[];
  onUpdate: (updated: FeatureDraft) => void;
  onRemove: () => void;
  disabled: boolean;
}> = ({ draft, featureTypes, onUpdate, onRemove, disabled }) => {
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      featureTypes.map((ft) => ({ value: ft.feature_type, label: ft.label })),
    [featureTypes],
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
        marginBottom: '8px',
      }}
    >
      <div style={{ flex: '0 0 200px' }}>
        <ThemedSelect
          options={options}
          value={draft.feature_type}
          placeholder={t('features.selectType')}
          onChange={(v) => onUpdate({ ...draft, feature_type: v })}
          allowEmpty
          disabled={disabled}
        />
      </div>
      <div style={{ flex: 1 }}>
        <ThemedInput
          value={draft.name}
          onChange={(e) => onUpdate({ ...draft, name: e.target.value })}
          placeholder={t('features.featureNamePlaceholder')}
          disabled={disabled}
        />
      </div>
      <div style={{ paddingTop: '2px' }}>
        <ThemedButton
          variant="ghost"
          type="button"
          onClick={onRemove}
          disabled={disabled}
        >
          {t('features.remove')}
        </ThemedButton>
      </div>
    </div>
  );
};

export const FeatureInstancesSection: React.FC<Props> = ({
  drafts,
  onChange,
  disabled,
}) => {
  const { t } = useTranslation();
  const { featureTypes } = useFeatureTypes();

  const addDraft = () =>
    onChange([
      ...drafts,
      { localId: makeFeatureDraftId(), feature_type: '', name: '' },
    ]);

  const updateDraft = (localId: string, updated: FeatureDraft) =>
    onChange(drafts.map((d) => (d.localId === localId ? updated : d)));

  const removeDraft = (localId: string) =>
    onChange(drafts.filter((d) => d.localId !== localId));

  return (
    <div style={{ marginTop: '16px' }}>
      <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
        {t('projects.features')}
      </ThemedText>

      {drafts.map((draft) => (
        <FeatureRow
          key={draft.localId}
          draft={draft}
          featureTypes={featureTypes}
          onUpdate={(updated) => updateDraft(draft.localId, updated)}
          onRemove={() => removeDraft(draft.localId)}
          disabled={disabled}
        />
      ))}

      <ThemedButton
        variant="secondary"
        type="button"
        onClick={addDraft}
        disabled={disabled}
      >
        {t('features.addFeature')}
      </ThemedButton>
    </div>
  );
};
