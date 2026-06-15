import { LabelBar } from '@/app/platform/core/layout/themes/components/LabelBar.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { User } from 'lucide-react';

import TodoItemModal from './TodoItemModal.tsx';
import TodoRow from './TodoRow.tsx';
import { useTodoList } from './hooks.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const TodoListTab: React.FC<Props> = ({
  featureInstanceId,
  canEdit,
  isManager,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    items,
    labels,
    persons,
    error,
    createItem,
    updateItem,
    createLabel,
    updateLabel,
    deleteLabel,
    toggleLabel,
  } = useTodoList(featureInstanceId);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlTaskId = searchParams.get('taskId');
  const urlHighlight = searchParams.get('q') ?? undefined;

  const deepLinkedItem = urlTaskId ? items.find((i) => i.id === urlTaskId) ?? null : null;

  const closeDeepLinked = () => {
    searchParams.delete('taskId');
    searchParams.delete('q');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [filterPersonId, setFilterPersonId] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const isConfiguring = isManager && configuring;

  const activeItems = items.filter((i) => i.status !== 'archived');
  const archivedCount = items.filter((i) => i.status === 'archived').length;

  const tabActions = useMemo(
    () => [
      ...(isManager
        ? [
            {
              icon: 'settings' as const,
              label: configuring
                ? t('features.todo.doneConfiguring')
                : t('features.todo.configure'),
              onClick: () => setConfiguring((v) => !v),
            },
          ]
        : []),
      ...(archivedCount > 0
        ? [
            {
              icon: (showArchived ? 'eye-off' as const : 'eye' as const),
              label: showArchived
                ? t('features.todo.hideArchived')
                : t('features.todo.showArchived', { count: archivedCount }),
              onClick: () => setShowArchived((s) => !s),
              variant: 'danger' as const,
            },
          ]
        : []),
      ...(urlHighlight
        ? [
            {
              icon: 'x' as const,
              label: t('search.removeHighlight'),
              onClick: () => {
                const next = new URLSearchParams(searchParams);
                next.delete('q');
                navigate({ search: next.toString() }, { replace: true });
              },
            },
          ]
        : []),
    ],
    [isManager, archivedCount, configuring, showArchived, t, urlHighlight, searchParams, navigate],
  );

  useRegisterTabActions(tabActions);

  const activeItemLabelIds = new Set(activeItems.flatMap((i) => i.label_ids));
  const assignedPersons = persons.filter((p) =>
    activeItems.some((i) => i.assigned_person_id === p.id),
  );

  useEffect(() => {
    const labelIds = new Set(
      items.filter((i) => i.status !== 'archived').flatMap((i) => i.label_ids),
    );
    if (filterLabelId && !labelIds.has(filterLabelId)) setFilterLabelId(null);
  }, [items, filterLabelId]);

  const visibleItems = items
    .filter((i) => showArchived || i.status !== 'archived')
    .filter((i) => !filterLabelId || i.label_ids.includes(filterLabelId))
    .filter((i) => !filterPersonId || i.assigned_person_id === filterPersonId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    await createItem({
      feature_instance_id: featureInstanceId,
      title: newTitle.trim(),
      position: items.length,
    });
    setNewTitle('');
    setAdding(false);
    setTimeout(() => addInputRef.current?.focus(), 0);
  };

  return (
    <div>
      {error && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '12px',
            color: theme.colors.danger,
            fontSize: 'var(--font-sm)',
          }}
        >
          {error}
        </div>
      )}

      {/* Filters bar */}
      <div style={{ marginBottom: '10px' }}>
        <LabelBar
          labels={labels}
          activeLabelIds={activeItemLabelIds}
          filterLabelId={filterLabelId}
          onFilter={setFilterLabelId}
          canEditLabels={isConfiguring}
          onUpdate={updateLabel}
          onDelete={deleteLabel}
        />
        {assignedPersons.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
              marginTop: '8px',
            }}
          >
            <User size={14} color={theme.colors.primary} />
            {assignedPersons.map((person) => {
              const active = filterPersonId === person.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() =>
                    setFilterPersonId((prev) =>
                      prev === person.id ? null : person.id,
                    )
                  }
                  style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: 'var(--font-xs)',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    border: `1px solid ${theme.colors.primary}`,
                    backgroundColor: active
                      ? theme.colors.primary
                      : 'transparent',
                    color: active
                      ? theme.colors.surface
                      : theme.colors.primary,
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {person.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        {visibleItems.length === 0 && items.length === 0 && (
          <span
            style={{
              fontSize: 'var(--font-sm)',
              color: theme.colors.secondary,
            }}
          >
            {t('features.todo.empty')}
          </span>
        )}
        {visibleItems.map((item) => (
          <TodoRow
            key={item.id}
            item={item}
            labels={labels}
            persons={persons}
            canEdit={canEdit}
            featureInstanceId={featureInstanceId}
            onToggle={(id, done) =>
              updateItem(id, { todo_status: done ? 'done' : 'todo' })
            }
            onSetStatus={(id, s) => updateItem(id, { status: s })}
            onUpdate={updateItem}
            onToggleLabel={toggleLabel}
            onCreateLabel={createLabel}
          />
        ))}
      </div>

      {canEdit && (
        <form
          onSubmit={handleAdd}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <input
            ref={addInputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('features.todo.addPlaceholder')}
            disabled={adding}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              fontSize: 'var(--font-sm)',
            }}
          />
          <ThemedButton
            variant="primary"
            type="submit"
            disabled={adding || !newTitle.trim()}
            leftIcon={
              <ThemedSvgIcon name="plus" color="currentColor" size={16} />
            }
          >
            {t('features.todo.add')}
          </ThemedButton>
        </form>
      )}

      {deepLinkedItem && (
        <TodoItemModal
          item={deepLinkedItem}
          labels={labels}
          persons={persons}
          canEdit={false}
          featureInstanceId={featureInstanceId}
          highlightToken={urlHighlight}
          onClose={closeDeepLinked}
          onUpdate={updateItem}
          onToggleLabel={toggleLabel}
          onCreateLabel={createLabel}
        />
      )}
    </div>
  );
};

export default TodoListTab;
