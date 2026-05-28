import { Theme } from '@/platform/themes/themes.ts';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';
import { SelectOption } from '@/types/common.types.ts';

import React, { useEffect, useRef, useState } from 'react';

interface ThemedMultiSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
  theme?: Theme;
}

export const ThemedMultiSelect: React.FC<ThemedMultiSelectProps> = ({
  label,
  error,
  helperText,
  options,
  value = [],
  onChange,
  placeholder = 'Select options',
  disabled = false,
  variant = 'primary',
  theme: themeOverride,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFilterText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) filterInputRef.current?.focus();
    else setFilterText('');
  }, [isOpen]);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(filterText.toLowerCase()),
  );

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: theme.colors[variant] }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className="min-h-[42px] w-full rounded-lg border px-3 py-2 cursor-pointer focus:outline-none focus:ring-2"
          style={{
            borderColor: error ? theme.colors.danger : theme.colors[variant],
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${theme.colors[variant]}20`,
                    color: theme.colors[variant],
                  }}
                >
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeOption(option.value, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors[variant],
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span style={{ color: theme.colors.text, opacity: 0.5 }}>
                {placeholder}
              </span>
            )}
          </div>
        </div>

        {isOpen && !disabled && (
          <div
            className="absolute z-10 w-full mt-1 rounded-lg shadow-lg"
            style={{
              backgroundColor: 'white',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <div
              className="p-2"
              style={{ borderBottom: `1px solid ${theme.colors.border}` }}
            >
              <input
                ref={filterInputRef}
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Filter..."
                className="w-full rounded px-2 py-1 text-sm focus:outline-none"
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                }}
              />
            </div>
            <div className="max-h-52 overflow-auto">
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className="px-3 py-2 cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? `${theme.colors[variant]}10`
                        : 'transparent',
                    }}
                    onClick={() => toggleOption(option.value)}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = `${theme.colors[variant]}05`;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mr-2"
                        style={{ accentColor: theme.colors[variant] }}
                      />
                      <span style={{ color: theme.colors.text }}>
                        {option.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.danger }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.text }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
