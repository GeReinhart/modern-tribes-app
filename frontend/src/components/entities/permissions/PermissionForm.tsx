import React, { useState } from 'react';
import { Permission, PermissionCreate, PermissionUpdate } from '@/types/permission.types.ts';
import { FormMode } from '@/types/common.types.ts';
import { ThemedButton } from "@/components/common/form/ThemedButton.tsx";
import { ThemedInput } from "@/components/common/form/ThemedInput.tsx";
import { ThemedTextarea } from "@/components/common/form/ThemedTextarea.tsx";

interface PermissionFormProps {
    permission?: Permission;
    mode: FormMode;
    onSubmit: (data: PermissionCreate | PermissionUpdate) => Promise<void>;
    onCancel: () => void;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({
    permission,
    mode,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        name: permission?.name || '',
        description: permission?.description || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isViewMode = mode === 'view';

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Permission name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
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

            {!isViewMode && (
                <div className="flex justify-end gap-3 pt-4">
                    <ThemedButton type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </ThemedButton>
                    <ThemedButton type="submit" variant="primary" isLoading={isSubmitting}>
                        {mode === 'create' ? 'Create Permission' : 'Update Permission'}
                    </ThemedButton>
                </div>
            )}
        </form>
    );
};
