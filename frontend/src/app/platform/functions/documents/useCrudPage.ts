import { FormMode } from '@/app/platform/core/common.types.ts';

import { useCallback, useState } from 'react';

interface ModalState<T> {
  isOpen: boolean;
  mode: FormMode;
  entity?: T;
}

interface DeleteDialog<T> {
  isOpen: boolean;
  entity?: T;
  isMultiple?: boolean;
}

export function useCrudPage<T extends { id: string }, CreateDto, UpdateDto>(
  refetch: () => void,
  create: (data: CreateDto) => Promise<T | undefined>,
  update: (id: string, data: UpdateDto) => Promise<T | undefined>,
  remove: (id: string) => Promise<unknown>,
) {
  const [filter, setFilter] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<ModalState<T>>({
    isOpen: false,
    mode: 'create',
  });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog<T>>({
    isOpen: false,
  });

  const handleRowSelect = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.size > 0)
      setDeleteDialog({ isOpen: true, isMultiple: true });
  }, [selectedRows]);

  const confirmDelete = useCallback(async () => {
    try {
      if (deleteDialog.isMultiple) {
        await Promise.all(Array.from(selectedRows).map((id) => remove(id)));
        setSelectedRows(new Set());
      } else if (deleteDialog.entity) {
        await remove(deleteDialog.entity.id);
      }
      refetch();
      setDeleteDialog({ isOpen: false });
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }, [deleteDialog, selectedRows, remove, refetch]);

  const handleSubmit = useCallback(
    async (data: CreateDto | UpdateDto) => {
      try {
        if (modalState.mode === 'create') {
          await create(data as CreateDto);
        } else if (modalState.mode === 'edit' && modalState.entity) {
          await update(modalState.entity.id, data as UpdateDto);
        }
        refetch();
      } catch (error) {
        console.error('Error saving:', error);
        throw error;
      }
    },
    [modalState, create, update, refetch],
  );

  const updateItem = useCallback(
    async (id: string, data: UpdateDto) => {
      try {
        await update(id, data);
        refetch();
      } catch (error) {
        console.error('Error updating item:', error);
        throw error;
      }
    },
    [update, refetch],
  );

  const openCreate = useCallback(
    () => setModalState({ isOpen: true, mode: 'create' }),
    [],
  );
  const openEdit = useCallback(
    (entity: T) => setModalState({ isOpen: true, mode: 'edit', entity }),
    [],
  );
  const openView = useCallback(
    (entity: T) => setModalState({ isOpen: true, mode: 'view', entity }),
    [],
  );
  const closeModal = useCallback(
    () => setModalState((prev) => ({ ...prev, isOpen: false })),
    [],
  );
  const openDeleteSingle = useCallback(
    (entity: T) => setDeleteDialog({ isOpen: true, entity }),
    [],
  );
  const closeDeleteDialog = useCallback(
    () => setDeleteDialog({ isOpen: false }),
    [],
  );

  return {
    filter,
    setFilter,
    selectedRows,
    modalState,
    deleteDialog,
    handleRowSelect,
    handleDeleteSelected,
    confirmDelete,
    handleSubmit,
    updateItem,
    openCreate,
    openEdit,
    openView,
    closeModal,
    openDeleteSingle,
    closeDeleteDialog,
  };
}
