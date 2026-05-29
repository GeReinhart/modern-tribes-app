import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSelect } from '@/platform/core/layout/themes/components/ThemedSelect.tsx';
import { usePersons } from '@/hooks/usePersons.ts';
import { useTribes } from '@/hooks/useTribes.ts';
import { FormMode } from '@/types/common.types.ts';
import {
  Position,
  PositionCreate,
  PositionEnum,
  PositionUpdate,
} from '@/types/position.types.ts';

import React, { useEffect, useState } from 'react';

interface PositionFormProps {
  position?: Position;
  mode: FormMode;
  onSubmit: (data: PositionCreate | PositionUpdate) => Promise<void>;
  onCancel: () => void;
}

export const PositionForm: React.FC<PositionFormProps> = ({
  position,
  mode,
  onSubmit,
  onCancel,
}) => {
  const { tribes } = useTribes();
  const { persons } = usePersons();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PositionCreate>({
    position: 'guest',
    tribe_id: null,
    person_id: null,
  });
  const [status, setStatus] = useState(position?.status ?? 'active');

  useEffect(() => {
    if (position && mode !== 'create') {
      setFormData({
        position: position.position,
        tribe_id: position.tribe_id,
        person_id: position.person_id,
      });
      setStatus(position.status ?? 'active');
    }
  }, [position, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(mode === 'create' ? formData : { ...formData, status });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isReadOnly = mode === 'view';

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
  ];

  const positionOptions = [
    { value: 'manager', label: 'Manager' },
    { value: 'member', label: 'Member' },
    { value: 'guest', label: 'guest' },
  ];

  const tribeOptions = tribes.map((tribe) => ({
    value: tribe.id,
    label: tribe.name,
  }));

  const personOptions = [
    { value: '', label: 'None' },
    ...persons.map((p) => ({
      value: p.id,
      label: p.first_name + ' ' + p.last_name,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <ThemedSelect
        label="Tribe"
        value={formData.tribe_id || ''}
        onChange={(e) =>
          setFormData({
            ...formData,
            tribe_id: e || null,
          })
        }
        options={tribeOptions}
        disabled={isReadOnly}
        allowEmpty={false}
      />

      <ThemedSelect
        label="Position"
        value={formData.position}
        onChange={(e) =>
          setFormData({ ...formData, position: e as PositionEnum })
        }
        options={positionOptions}
        disabled={isReadOnly}
        allowEmpty={false}
      />

      <ThemedSelect
        label="Person"
        value={formData.person_id || ''}
        onChange={(e) =>
          setFormData({
            ...formData,
            person_id: e || null,
          })
        }
        options={personOptions}
        disabled={isReadOnly}
        allowEmpty={false}
      />

      {mode !== 'create' && (
        <ThemedSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          disabled={isReadOnly}
          allowEmpty={false}
        />
      )}

      {!isReadOnly && (
        <div className="flex gap-3 pt-4">
          <ThemedButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </ThemedButton>
          <ThemedButton type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </ThemedButton>
        </div>
      )}
    </form>
  );
};
