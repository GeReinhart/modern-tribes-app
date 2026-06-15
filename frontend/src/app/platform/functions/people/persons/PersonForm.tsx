import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useDocuments } from '@/app/platform/functions/documents/useDocuments.ts';
import { FormMode } from '@/app/platform/core/common.types.ts';
import {
  Gender,
  Person,
  PersonCreate,
  PersonUpdate,
} from '@/app/platform/functions/people/persons/person.types.ts';

import React, { useEffect, useState } from 'react';

interface PersonFormProps {
  person?: Person;
  mode: FormMode;
  onSubmit: (data: PersonCreate | PersonUpdate) => Promise<void>;
  onCancel: () => void;
}

export const PersonForm: React.FC<PersonFormProps> = ({
  person,
  mode,
  onSubmit,
  onCancel,
}) => {
  const { documents } = useDocuments();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<PersonCreate>({
    first_name: '',
    last_name: '',
    gender: 'prefer_not_to_say',
    document_id: null,
  });
  const [status, setStatus] = useState(person?.status ?? 'active');

  useEffect(() => {
    if (person && mode !== 'create') {
      setFormData({
        first_name: person.first_name,
        last_name: person.last_name,
        gender: person.gender,
        document_id: person.document_id || null,
      });
      setStatus(person.status ?? 'active');
    }
  }, [person, mode]);

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

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const documentOptions = [
    { value: '', label: 'None' },
    ...documents.map((doc) => ({
      value: doc.id,
      label: doc.content_summary
        ? `${doc.content_summary} (${doc.id})`
        : doc.id,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <ThemedInput
        label="First Name"
        value={formData.first_name}
        onChange={(e) =>
          setFormData({ ...formData, first_name: e.target.value })
        }
        required
        disabled={isReadOnly}
      />

      <ThemedInput
        label="Last Name"
        value={formData.last_name}
        onChange={(e) =>
          setFormData({ ...formData, last_name: e.target.value })
        }
        required
        disabled={isReadOnly}
      />

      <ThemedSelect
        label="Gender"
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e as Gender })}
        options={genderOptions}
        disabled={isReadOnly}
      />

      <ThemedSelect
        label="Document"
        value={formData.document_id || ''}
        onChange={(e) =>
          setFormData({
            ...formData,
            document_id: e || null,
          })
        }
        options={documentOptions}
        disabled={isReadOnly}
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
