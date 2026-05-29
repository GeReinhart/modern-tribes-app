import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';

interface LabelSelectorProps {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  label?: string;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add labels...',
  label,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s),
  );

  const showCreate =
    inputValue.trim() &&
    !suggestions.some(
      (s) => s.toLowerCase() === inputValue.trim().toLowerCase(),
    ) &&
    !value.some((v) => v.toLowerCase() === inputValue.trim().toLowerCase());

  const addLabel = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeLabel = (name: string) => {
    onChange(value.filter((v) => v !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addLabel(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeLabel(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    backgroundColor: `${theme.colors.primary}20`,
    color: theme.colors.primary,
    borderRadius: '12px',
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    border: `1px solid ${theme.colors.primary}40`,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const optionStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 'var(--font-sm)',
    color: theme.colors.text,
  };

  return (
    <div>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            color: theme.colors.secondary,
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}
      <div ref={containerRef} style={{ position: 'relative' }}>
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
            padding: '8px 12px',
            border: `1px solid ${open ? theme.colors.primary : theme.colors.border}`,
            borderRadius: '8px',
            backgroundColor: theme.colors.surface,
            cursor: 'text',
            minHeight: '42px',
            transition: 'border-color 0.15s',
          }}
        >
          {value.map((name) => (
            <span key={name} style={chipStyle}>
              {name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLabel(name);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  color: theme.colors.primary,
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            style={{
              flex: '1 1 80px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 'var(--font-sm)',
              color: theme.colors.text,
              minWidth: '80px',
            }}
          />
        </div>

        {open && (filtered.length > 0 || showCreate) && (
          <div style={dropdownStyle}>
            {filtered.map((s) => (
              <div
                key={s}
                style={optionStyle}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addLabel(s);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {s}
              </div>
            ))}
            {showCreate && (
              <div
                style={{
                  ...optionStyle,
                  color: theme.colors.primary,
                  fontStyle: 'italic',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addLabel(inputValue);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Create "{inputValue.trim()}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
