import { Theme } from '@/components/themes/themes.ts';
import { useTheme } from '@/contexts/ThemeContext.tsx';

import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
}

interface ThemedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  selectedRows?: Set<string>;
  onRowSelect?: (id: string) => void;
  getRowId: (item: T) => string;
  theme?: Theme;
}

export function ThemedTable<T>({
  data,
  columns,
  onRowClick,
  selectedRows,
  onRowSelect,
  getRowId,
  theme: themeOverride,
}: ThemedTableProps<T>) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onRowSelect) return;

    if (e.target.checked) {
      data.forEach((item) => onRowSelect(getRowId(item)));
    } else {
      data.forEach((item) => onRowSelect(getRowId(item)));
    }
  };

  const allSelected =
    selectedRows &&
    data.length > 0 &&
    data.every((item) => selectedRows.has(getRowId(item)));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              backgroundColor: `${theme.colors.primary}15`,
              borderBottom: `2px solid ${theme.colors.primary}`,
            }}
          >
            {onRowSelect && (
              <th
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  color: theme.colors.primary,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  color: theme.colors.primary,
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const rowId = getRowId(item);
            const isSelected = selectedRows?.has(rowId);

            return (
              <tr
                key={rowId}
                onClick={() => onRowClick?.(item)}
                style={{
                  backgroundColor: isSelected
                    ? `${theme.colors.primary}10`
                    : index % 2 === 0
                      ? 'white'
                      : `${theme.colors.surface}50`,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = `${theme.colors.primary}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSelected
                    ? `${theme.colors.primary}10`
                    : index % 2 === 0
                      ? 'white'
                      : `${theme.colors.surface}50`;
                }}
              >
                {onRowSelect && (
                  <td
                    style={{ padding: '12px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onRowSelect(rowId)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                      }}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '12px',
                      color: theme.colors.text,
                      fontSize: '14px',
                    }}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: theme.colors.text,
          }}
        >
          No data found
        </div>
      )}
    </div>
  );
}
