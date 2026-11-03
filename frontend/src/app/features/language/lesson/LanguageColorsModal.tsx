import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemeCodeSelect } from '@/app/platform/core/layout/themes/components/ThemeCodeSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LanguageColorsPreview from './LanguageColorsPreview.tsx';
import { withThemeOverrides } from '../shared/languageSamples.ts';
import { languageService } from '../shared/service.ts';
import { Language, LanguageSettings } from '../shared/types.ts';
import { useLanguages } from '../shared/useLanguages.ts';

interface Props {
  settings: LanguageSettings;
  onClose: () => void;
}

// Lets the project's two languages each be given a theme color (shared by every project), reused
// everywhere a word of that language is shown. The choice is previewed live on four sample
// words and only saved with the Save button. Picking goes through the shared ThemeCodeSelect.
const LanguageColorsModal: React.FC<Props> = ({ settings, onClose }) => {
  const { t } = useTranslation();
  const { languages, loading, error, refetch } = useLanguages();
  const [draft, setDraft] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const projectLanguages = [settings.source_language, settings.target_language]
    .map((code) => languages.find((l) => l.code === code))
    .filter((l): l is Language => Boolean(l));
  const previewLanguages = withThemeOverrides(languages, draft);
  const languageName = (language: Language) => t(`features.language.code.${language.code}`, { defaultValue: language.name });

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.entries(draft).map(([code, themeCode]) => languageService.updateLanguageTheme(code, themeCode)));
      await refetch();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.language.configureColors')}>
      <ThemedModalBody>
        {loading && <ThemedLoadingSpinner size="sm" />}
        {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {projectLanguages.map((language) => (
            <ThemeCodeSelect
              key={language.code}
              label={languageName(language)}
              value={language.code in draft ? draft[language.code] : language.theme_code}
              onChange={(themeCode) => setDraft((prev) => ({ ...prev, [language.code]: themeCode }))}
            />
          ))}
        </div>
        <LanguageColorsPreview settings={settings} languages={previewLanguages} />
      </ThemedModalBody>
      <ThemedModalFooter>
        <ThemedButton variant="ghost" onClick={onClose}>{t('features.language.cancel')}</ThemedButton>
        <ThemedButton isLoading={saving} disabled={Object.keys(draft).length === 0} onClick={handleSave}>
          {t('common.save')}
        </ThemedButton>
      </ThemedModalFooter>
    </ThemedModal>
  );
};

export default LanguageColorsModal;
