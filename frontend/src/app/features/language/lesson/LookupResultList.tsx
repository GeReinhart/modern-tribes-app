import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { CSSProperties } from 'react';

interface Props<T> {
  loading: boolean;
  // null = no lookup requested yet (or cleared); [] is itself a real answer: "nothing found".
  items: T[] | null;
  itemKey: (item: T, index: number) => string;
  renderItem: (item: T) => React.ReactNode;
  onPick: (item: T) => void;
  emptyMessage: string;
  containerStyle?: CSSProperties;
}

// The loading / explicit-empty / clickable-row skeleton shared by every lookup-result list in
// the word form (SuggestionList, DictionaryAutocompleteList) -- written once here so each only
// has to describe its own row shape and empty/loading semantics, not re-implement the scrollable
// bordered list, the spinner or the "nothing found" state.
function LookupResultList<T>({
  loading, items, itemKey, renderItem, onPick, emptyMessage, containerStyle,
}: Props<T>) {
  const { theme } = useTheme();

  if (loading) return <ThemedLoadingSpinner size="sm" />;
  if (items === null) return null;
  if (items.length === 0) {
    return <ThemedText variant="secondary" size="small">{emptyMessage}</ThemedText>;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', maxHeight: '160px', overflowY: 'auto',
      border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-sm)', ...containerStyle,
    }}
    >
      {items.map((item, index) => (
        <div
          key={itemKey(item, index)}
          onClick={() => onPick(item)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', cursor: 'pointer', borderBottom: `1px solid ${theme.colors.border}` }}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export default LookupResultList;
