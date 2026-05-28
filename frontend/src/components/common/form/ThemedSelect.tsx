import { Theme } from '@/components/themes/themes.ts';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';
import { SelectOption } from '@/types/common.types.ts';

import React, { useEffect, useRef, useState } from 'react';

interface ThemedSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
  theme?: Theme;
  allowEmpty?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const ThemedSelect: React.FC<ThemedSelectProps> = ({
  label,
  error,
  helperText,
  options,
  value = '',
  placeholder = 'Select an option',
  onChange,
  variant = 'primary',
  theme: themeOverride,
  allowEmpty = true,
  disabled = false,
  id,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

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

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(filterText.toLowerCase()),
  );

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1"
          style={{ color: theme.colors[variant] }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div
          id={inputId}
          className="min-h-[42px] w-full rounded-lg border px-3 py-2 flex items-center justify-between"
          style={{
            borderColor: error ? theme.colors.danger : theme.colors[variant],
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span
            style={{
              color: selectedLabel ? theme.colors.text : theme.colors.text,
              opacity: selectedLabel ? 1 : 0.5,
            }}
          >
            {selectedLabel || placeholder}
          </span>
          <svg
            className="w-4 h-4 ml-2 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: theme.colors.text }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
            />
          </svg>
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
              {allowEmpty && (
                <div
                  className="px-3 py-2 cursor-pointer"
                  style={{
                    backgroundColor:
                      value === ''
                        ? `${theme.colors[variant]}10`
                        : 'transparent',
                  }}
                  onClick={() => handleSelect('')}
                  onMouseEnter={(e) => {
                    if (value !== '')
                      e.currentTarget.style.backgroundColor = `${theme.colors[variant]}05`;
                  }}
                  onMouseLeave={(e) => {
                    if (value !== '')
                      e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ color: theme.colors.text, opacity: 0.5 }}>
                    {placeholder}
                  </span>
                </div>
              )}
              {filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    className="px-3 py-2 cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? `${theme.colors[variant]}10`
                        : 'transparent',
                    }}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = `${theme.colors[variant]}05`;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ color: theme.colors.text }}>
                      {option.label}
                    </span>
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
