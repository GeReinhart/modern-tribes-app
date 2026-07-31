import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedErrorMessage } from '@/app/platform/core/layout/themes/components/ThemedErrorMessage.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChordCard } from './ChordCard.tsx';
import { ChordsFilterBar } from './ChordsFilterBar.tsx';
import { ChordFormModal } from './ChordFormModal.tsx';
import { guitarChordsService } from './service.ts';
import { GuitarChord, GuitarChordCreate } from './types.ts';
import { useGuitarChords } from './useGuitarChords.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const ChordsTab: React.FC<Props> = () => {
  const { t } = useTranslation();
  const { chords, loading, error, reload } = useGuitarChords();
  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState('');
  const [editingChord, setEditingChord] = useState<GuitarChord | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuitarChord | null>(null);

  const filteredChords = useMemo(
    () => chords.filter((chord) =>
      chord.name.toLowerCase().includes(search.trim().toLowerCase())
      && (!rootFilter || chord.root_note === rootFilter)),
    [chords, search, rootFilter],
  );

  const openAddForm = () => { setEditingChord(undefined); setFormOpen(true); };
  const openEditForm = (chord: GuitarChord) => { setEditingChord(chord); setFormOpen(true); };

  const handleSubmit = async (data: GuitarChordCreate) => {
    if (editingChord) await guitarChordsService.updateChord(editingChord.id, data);
    else await guitarChordsService.createChord(data);
    await reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await guitarChordsService.deleteChord(deleteTarget.id);
    setDeleteTarget(null);
    await reload();
  };

  if (loading) return <ThemedLoadingSpinner text={t('common.loading')} />;
  if (error) return <ThemedErrorMessage message={t('guitarChords.list.loadError')} onRetry={reload} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      <ChordsFilterBar
        search={search}
        onSearchChange={setSearch}
        rootFilter={rootFilter}
        onRootFilterChange={setRootFilter}
        onAdd={openAddForm}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {filteredChords.map((chord) => (
          <ChordCard
            key={chord.id}
            chord={chord}
            onEdit={() => openEditForm(chord)}
            onDelete={() => setDeleteTarget(chord)}
          />
        ))}
      </div>
      <ChordFormModal
        isOpen={formOpen}
        chord={editingChord}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <ThemedConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('guitarChords.list.deleteTitle')}
        message={t('guitarChords.list.deleteMessage', { name: deleteTarget?.name ?? '' })}
        variant="danger"
      />
    </div>
  );
};

export default ChordsTab;
