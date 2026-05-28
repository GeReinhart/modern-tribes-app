import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { useTheme } from '@/contexts/ThemeContext';
import { PersonOption, fibColor, urgencyColor } from './types';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import TodoItemModal from './TodoItemModal';
import { TodoItem, TodoItemUpdate, TodoLabel, TodoLabelCreate } from './types';

interface Props {
  item: TodoItem;
  labels: TodoLabel[];
  persons: PersonOption[];
  canEdit: boolean;
  featureInstanceId: string;
  onToggle: (id: string, done: boolean) => void;
  onSetStatus: (id: string, status: 'pending' | 'active' | 'archived') => void;
  onUpdate: (itemId: string, data: TodoItemUpdate) => Promise<void>;
  onToggleLabel: (itemId: string, labelId: string) => Promise<void>;
  onCreateLabel: (data: TodoLabelCreate) => Promise<TodoLabel | null>;
}

const TodoRow: React.FC<Props> = ({
  item,
  labels,
  persons,
  canEdit,
  featureInstanceId,
  onToggle,
  onSetStatus,
  onUpdate,
  onToggleLabel,
  onCreateLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isDone = item.todo_status === 'done';
  const isArchived = item.status === 'archived';
  const cardLabels = labels.filter((l) => item.label_ids.includes(l.id));
  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <div
      style={{
        borderRadius: '8px',
        border: `1px solid ${theme.colors.border}`,
        marginBottom: '8px',
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        opacity: isArchived ? 0.65 : 1,
      }}
    >
      {/* Line 1: checkbox + title + edit/archive + chevron */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 14px 4px',
        }}
      >
        {canEdit && !isArchived ? (
          <input
            type="checkbox"
            checked={isDone}
            onChange={(e) => onToggle(item.id, e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
          />
        ) : (
          <span
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              border: `2px solid ${theme.colors.border}`,
              borderRadius: '3px',
              backgroundColor: isDone ? theme.colors.primary : 'transparent',
              display: 'inline-block',
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            textDecoration: isDone || isArchived ? 'line-through' : 'none',
            color:
              isArchived || isDone ? theme.colors.secondary : theme.colors.text,
            fontSize: 'var(--font-lg)',
            cursor: 'pointer',
          }}
          onClick={() => setModalOpen(true)}
        >
          {item.title}
        </span>
        {!isArchived && (
          <button
            onClick={() => setModalOpen(true)}
            title={t('common.edit')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px 2px',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            <ThemedSvgIcon name="pencil" color={theme.colors.text} size={13} />
          </button>
        )}
        {canEdit && !isArchived && (
          <button
            onClick={() => onSetStatus(item.id, 'archived')}
            title={t('common.archive')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px 2px',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            <ThemedSvgIcon
              name="archive"
              color={theme.colors.danger}
              size={13}
            />
          </button>
        )}
        {canEdit && isArchived && (
          <button
            onClick={() => onSetStatus(item.id, 'active')}
            title={t('common.restore')}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.success}`,
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '1px 3px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <ThemedSvgIcon
              name="refresh"
              color={theme.colors.success}
              size={13}
            />
          </button>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.75,
            flexShrink: 0,
          }}
        >
          <ThemedSvgIcon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            color={theme.colors.text}
            size={14}
          />
        </button>
      </div>

      {/* Line 2: badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 14px 8px',
          justifyContent: 'flex-end',
        }}
      >
        {item.size && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '8px',
              background: fibColor(item.size),
              color: theme.colors.surface,
              flexShrink: 0,
            }}
          >
            {item.size}
          </span>
        )}
        {item.due_date &&
          (() => {
            const uc = urgencyColor(item.due_date, item.size);
            const overdue =
              new Date(item.due_date + 'T00:00:00') <
              new Date(new Date().toDateString());
            return (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: '8px',
                  background: overdue ? uc : uc + '28',
                  color: overdue ? '#fff' : uc,
                  flexShrink: 0,
                }}
                title={t('features.todo.dueDate')}
              >
                {item.due_date}
              </span>
            );
          })()}
        {cardLabels.map((l) => (
          <span
            key={l.id}
            title={l.name}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: l.color,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        ))}
        {item.assigned_person_name && persons.length > 1 && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '10px',
              background: theme.colors.accent + '22',
              color: theme.colors.accent,
              fontWeight: 600,
              border: `1px solid ${theme.colors.accent}44`,
              whiteSpace: 'nowrap',
            }}
          >
            {getInitials(item.assigned_person_name)}
          </span>
        )}
      </div>

      {expanded && (
        <div
          style={{
            padding: '0 14px 12px 14px',
            borderTop: `1px solid ${theme.colors.border}`,
          }}
        >
          {cardLabels.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                paddingTop: '10px',
              }}
            >
              {cardLabels.map((label) => (
                <span
                  key={label.id}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: `1px solid ${label.color}`,
                    background: label.color,
                    color: theme.colors.surface,
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
          <div style={{ paddingTop: '10px' }}>
            {item.document_content_html ? (
              <div
                className="prose max-w-none"
                style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }}
                dangerouslySetInnerHTML={{ __html: item.document_content_html }}
              />
            ) : (
              <span
                style={{
                  fontSize: 'var(--font-sm)',
                  color: theme.colors.secondary,
                  fontStyle: 'italic',
                }}
              >
                {t('features.todo.noNote')}
              </span>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <TodoItemModal
          item={item}
          labels={labels}
          persons={persons}
          canEdit={canEdit && !isArchived}
          featureInstanceId={featureInstanceId}
          onClose={() => setModalOpen(false)}
          onUpdate={onUpdate}
          onToggleLabel={onToggleLabel}
          onCreateLabel={onCreateLabel}
        />
      )}
    </div>
  );
};

export default TodoRow;
