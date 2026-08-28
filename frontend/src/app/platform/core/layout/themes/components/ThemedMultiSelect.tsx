import { Theme } from '@/app/platform/core/layout/themes/themes.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

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
  /** Renders the search box and the option list always expanded instead of behind a collapsed dropdown. Use when the option list can be long. */
  inline?: boolean;
}

interface ChipsRowProps {
  options: SelectOption[];
  placeholder: string;
  placeholderColor: string;
  chipColor: string;
  disabled: boolean;
  onRemove: (value: string, e: React.MouseEvent) => void;
}

const ChipsRow: React.FC<ChipsRowProps> = ({ options, placeholder, placeholderColor, chipColor, disabled, onRemove }) => {
  if (options.length === 0) {
    return <span style={{ color: placeholderColor, opacity: 0.5 }}>{placeholder}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <span
          key={option.value}
          className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded"
          style={{ backgroundColor: `${chipColor}20`, color: chipColor }}
        >
          {option.label}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => onRemove(option.value, e)}
              style={{ background: 'none', border: 'none', color: chipColor, cursor: 'pointer' }}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
};

interface OptionsListProps {
  options: SelectOption[];
  selectedValues: string[];
  color: string;
  textColor: string;
  onToggle: (value: string) => void;
  maxHeightClass: string;
}

const OptionsList: React.FC<OptionsListProps> = ({ options, selectedValues, color, textColor, onToggle, maxHeightClass }) => (
  <div className={maxHeightClass}>
    {options.map((option) => {
      const isSelected = selectedValues.includes(option.value);
      return (
        <div
          key={option.value}
          className="px-3 py-2 cursor-pointer"
          style={{ backgroundColor: isSelected ? `${color}10` : 'transparent' }}
          onClick={() => onToggle(option.value)}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = `${color}05`; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <div className="flex items-center">
            <input type="checkbox" checked={isSelected} onChange={() => {}} className="mr-2" style={{ accentColor: color }} />
            <span style={{ color: textColor }}>{option.label}</span>
          </div>
        </div>
      );
    })}
  </div>
);

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
  inline = false,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilterText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inline]);

  useEffect(() => {
    if (inline) return;
    if (isOpen) filterInputRef.current?.focus();
    else setFilterText('');
  }, [isOpen, inline]);

  const toggleOption = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(filterText.toLowerCase()));
  const color = theme.colors[variant];

  const labelNode = label && (
    <label className="block text-sm font-medium mb-1" style={{ color }}>
      {label}
    </label>
  );
  const messageNodes = (
    <>
      {error && <p className="mt-1 text-sm" style={{ color: theme.colors.danger }}>{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm" style={{ color: theme.colors.text }}>{helperText}</p>}
    </>
  );

  if (inline) {
    return (
      <div className="w-full">
        {labelNode}
        <ChipsRow
          options={selectedOptions}
          placeholder={placeholder}
          placeholderColor={theme.colors.text}
          chipColor={color}
          disabled={disabled}
          onRemove={removeOption}
        />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter..."
          disabled={disabled}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none mt-2"
          style={{ borderColor: theme.colors.border, color: theme.colors.text }}
        />
        <div className="mt-2 rounded-lg border" style={{ borderColor: theme.colors.border }}>
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={{ color: theme.colors.text, opacity: 0.5 }}>
              No results
            </div>
          ) : (
            <OptionsList
              options={filteredOptions}
              selectedValues={value}
              color={color}
              textColor={theme.colors.text}
              onToggle={toggleOption}
              maxHeightClass="max-h-40 overflow-auto"
            />
          )}
        </div>
        {messageNodes}
      </div>
    );
  }

  return (
    <div className="w-full" ref={containerRef}>
      {labelNode}
      <div className="relative">
        <div
          className="min-h-[42px] w-full rounded-lg border px-3 py-2 cursor-pointer focus:outline-none focus:ring-2"
          style={{
            borderColor: error ? theme.colors.danger : color,
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <ChipsRow
            options={selectedOptions}
            placeholder={placeholder}
            placeholderColor={theme.colors.text}
            chipColor={color}
            disabled={disabled}
            onRemove={removeOption}
          />
        </div>

        {isOpen && !disabled && (
          <div
            className="absolute z-10 w-full mt-1 rounded-lg shadow-lg"
            style={{ backgroundColor: 'white', border: `1px solid ${theme.colors.border}` }}
          >
            <div className="p-2" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
              <input
                ref={filterInputRef}
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Filter..."
                className="w-full rounded px-2 py-1 text-sm focus:outline-none"
                style={{ border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
              />
            </div>
            <OptionsList
              options={filteredOptions}
              selectedValues={value}
              color={color}
              textColor={theme.colors.text}
              onToggle={toggleOption}
              maxHeightClass="max-h-52 overflow-auto"
            />
          </div>
        )}
      </div>
      {messageNodes}
    </div>
  );
};
