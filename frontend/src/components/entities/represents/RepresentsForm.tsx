import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSelect } from '@/platform/core/layout/themes/components/ThemedSelect.tsx';
import { usePersons } from '@/hooks/usePersons.ts';
import { useUsers } from '@/hooks/useUsers.ts';
import { FormMode } from '@/types/common.types.ts';
import {
  Represents,
  RepresentsCreate,
  RepresentsUpdate,
} from '@/types/represents.types.ts';

import React, { useEffect, useState } from 'react';

interface RepresentsFormProps {
  represents?: Represents;
  mode: FormMode;
  onSubmit: (data: RepresentsCreate | RepresentsUpdate) => Promise<void>;
  onCancel: () => void;
}

export const RepresentsForm: React.FC<RepresentsFormProps> = ({
  represents,
  mode,
  onSubmit,
  onCancel,
}) => {
  const { users } = useUsers();
  const { persons } = usePersons();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RepresentsCreate>({
    user_id: '',
    person_id: '',
  });
  const [status, setStatus] = useState(represents?.status ?? 'active');

  useEffect(() => {
    if (represents && mode !== 'create') {
      setFormData({
        user_id: represents.user_id,
        person_id: represents.person_id,
      });
      setStatus(represents.status ?? 'active');
    }
  }, [represents, mode]);

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

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.email,
  }));

  const personOptions = persons.map((p) => ({
    value: p.id,
    label: `${p.first_name} ${p.last_name}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <ThemedSelect
        label="User"
        value={formData.user_id}
        onChange={(v) => setFormData({ ...formData, user_id: v })}
        options={userOptions}
        disabled={isReadOnly}
        allowEmpty={false}
      />

      <ThemedSelect
        label="Person"
        value={formData.person_id}
        onChange={(v) => setFormData({ ...formData, person_id: v })}
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
