import { LabelBar } from '@/app/platform/core/layout/themes/components/LabelBar.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { User } from 'lucide-react';

import AddColumnForm from './AddColumnForm.tsx';
import KanbanCardModal from './KanbanCardModal.tsx';
import KanbanColumnComponent from './KanbanColumn.tsx';
import { useKanban } from './hooks.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const KanbanTab: React.FC<Props> = ({
  featureInstanceId,
  canEdit,
  isManager,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const {
    board,
    persons,
    error,
    loaded,
    createColumn,
    renameColumn,
    deleteColumn,
    moveColumn,
    createCard,
    updateCard,
    archiveCard,
    restoreCard,
    moveCard,
    reorderCard,
    createLabel,
    updateLabel,
    deleteLabel,
    toggleCardLabel,
  } = useKanban(featureInstanceId);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlTaskId = searchParams.get('taskId');
  const urlHighlight = searchParams.get('q') ?? undefined;

  const [configuring, setConfiguring] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [filterPersonId, setFilterPersonId] = useState<string | null>(null);

  const deepLinkedCard = urlTaskId ? board.cards.find((c) => c.id === urlTaskId) ?? null : null;

  const closeDeepLinked = () => {
    searchParams.delete('taskId');
    searchParams.delete('q');
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const hasArchived = board.cards.some((c) => c.status === 'archived');

  const tabActions = useMemo(
    () => [
      ...(isManager
        ? [
            {
              icon: 'settings' as const,
              label: configuring
                ? t('features.kanban.saveColumns')
                : t('features.kanban.configureColumns'),
              onClick: () => setConfiguring((v) => !v),
            },
          ]
        : []),
      ...(canEdit && hasArchived
        ? [
            {
              icon: (showArchived ? 'eye-off' as const : 'eye' as const),
              label: showArchived
                ? t('features.kanban.hideArchived')
                : t('features.kanban.showArchived'),
              onClick: () => setShowArchived((v) => !v),
              variant: 'danger' as const,
            },
          ]
        : []),
    ],
    [isManager, canEdit, hasArchived, configuring, showArchived, t],
  );

  useRegisterTabActions(tabActions);

  const initDone = useRef(false);
  const sortedCols = [...board.columns].sort((a, b) => a.position - b.position);
  const maxColumns = 4;

  const activeCardLabelIds = new Set(
    board.cards
      .filter((c) => c.status === 'active')
      .flatMap((c) => c.label_ids),
  );
  const assignedPersons = persons.filter((p) =>
    board.cards.some(
      (c) => c.status === 'active' && c.assigned_person_id === p.id,
    ),
  );

  useEffect(() => {
    if (!loaded || initDone.current || !isManager) return;
    initDone.current = true;
    if (board.columns.length === 0) setConfiguring(true);
  }, [loaded, board.columns.length, isManager]);

  useEffect(() => {
    if (!filterLabelId) return;
    const activeIds = new Set(
      board.cards
        .filter((c) => c.status === 'active')
        .flatMap((c) => c.label_ids),
    );
    if (!activeIds.has(filterLabelId)) setFilterLabelId(null);
  }, [board.cards, filterLabelId]);

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
          labels={board.labels}
          activeLabelIds={activeCardLabelIds}
          filterLabelId={filterLabelId}
          onFilter={setFilterLabelId}
          canEditLabels={isManager && configuring}
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

      {/* Columns */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
          overflowX: 'auto',
        }}
      >
        {sortedCols.map((col, idx) => (
          <KanbanColumnComponent
            key={col.id}
            column={col}
            board={board}
            featureInstanceId={featureInstanceId}
            canEdit={canEdit}
            configuring={isManager && configuring}
            isFirst={idx === 0}
            isLast={idx === sortedCols.length - 1}
            canDelete={
              sortedCols.length > 2 &&
              idx !== 0 &&
              idx !== sortedCols.length - 1
            }
            showArchived={showArchived}
            filterLabelId={filterLabelId}
            filterPersonId={filterPersonId}
            persons={persons}
            onRename={renameColumn}
            onMove={moveColumn}
            onDelete={deleteColumn}
            onCreateCard={createCard}
            onUpdateCard={updateCard}
            onArchiveCard={archiveCard}
            onRestoreCard={restoreCard}
            onMoveCard={moveCard}
            onReorderCard={reorderCard}
            onToggleLabel={toggleCardLabel}
            onCreateLabel={createLabel}
          />
        ))}

        {/* Add column */}
        {isManager && configuring && sortedCols.length < maxColumns && (
          <div style={{ minWidth: '200px', flex: '0 0 auto' }}>
            <AddColumnForm
              onAdd={(name) =>
                createColumn({ feature_instance_id: featureInstanceId, name })
              }
            />
          </div>
        )}
      </div>

      {deepLinkedCard && (
        <KanbanCardModal
          card={deepLinkedCard}
          boardLabels={board.labels}
          persons={persons}
          canEdit={false}
          highlightToken={urlHighlight}
          onClose={closeDeepLinked}
          onUpdate={updateCard}
          onToggleLabel={toggleCardLabel}
          onCreateLabel={createLabel}
        />
      )}
    </div>
  );
};

export default KanbanTab;
