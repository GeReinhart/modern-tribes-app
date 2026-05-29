import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedMultiSelect } from '@/platform/core/layout/themes/components/ThemedMultiSelect.tsx';
import { ThemedSelect } from '@/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedTextarea } from '@/platform/core/layout/themes/components/ThemedTextarea.tsx';
import { FormMode } from '@/platform/core/common.types.ts';

import React, { useState } from 'react';

import { permissionsHooks } from '../../permissions-hooks.ts';
import { Role, RoleCreate, RoleUpdate } from '../../role.types.ts';

interface RoleFormProps {
  role?: Role;
  mode: FormMode;
  onSubmit: (data: RoleCreate | RoleUpdate) => Promise<void>;
  onCancel: () => void;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  role,
  mode,
  onSubmit,
  onCancel,
}) => {
  const { permissions, loading: permissionLoading } = permissionsHooks();
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permission_ids: role?.permission_ids || [],
  });
  const [status, setStatus] = useState(role?.status ?? 'active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'archived', label: 'Archived' },
  ];

  const isViewMode = mode === 'view';

  const permissionOptions = permissions.map((permission) => ({
    value: permission.id,
    label: permission.name,
  }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(mode === 'create' ? formData : { ...formData, status });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ThemedInput
        label="Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        disabled={isViewMode}
        required
      />

      <ThemedTextarea
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        disabled={isViewMode}
        rows={3}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
      />

      <ThemedMultiSelect
        label="Permissions"
        options={permissionOptions}
        value={formData.permission_ids}
        onChange={(values) => handleChange('permission_ids', values)}
        disabled={isViewMode || permissionLoading}
        placeholder="Select permissions"
      />

      {mode !== 'create' && (
        <ThemedSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          disabled={isViewMode}
          allowEmpty={false}
        />
      )}

      {!isViewMode && (
        <div className="flex justify-end gap-3 pt-4">
          <ThemedButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </ThemedButton>
          <ThemedButton
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {mode === 'create' ? 'Create Role' : 'Update Role'}
          </ThemedButton>
        </div>
      )}
    </form>
  );
};
