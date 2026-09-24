import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useRef } from 'react';

interface ThemedFileUploadProps {
  label?: string;
  helperText?: string;
  error?: string;
  accept?: string;
  buttonLabel: string;
  uploading?: boolean;
  fileName?: string | null;
  onSelect: (file: File) => void;
}

// A single-file picker (button + hidden input) for uploading one attachment through the
// platform's generic /uploads/file endpoint -- the caller owns the actual upload call and its
// resulting state (uploading/fileName/error), this component only surfaces the file choice.
export const ThemedFileUpload: React.FC<ThemedFileUploadProps> = ({
  label, helperText, error, accept, buttonLabel, uploading = false, fileName, onSelect,
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = '';
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <ThemedSubmitButton
          type="button"
          variant="secondary"
          fullWidth={false}
          isLoading={uploading}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </ThemedSubmitButton>
        {fileName && (
          <span className="text-sm" style={{ color: theme.colors.secondary }}>{fileName}</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      {error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.danger }}>{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.secondary }}>{helperText}</p>
      )}
    </div>
  );
};
