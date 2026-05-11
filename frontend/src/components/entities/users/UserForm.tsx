import React, { useState } from 'react';
import { User, UserCreate, UserUpdate } from '@/types/user.types.ts';
import { useRoles } from '@/hooks/useRoles.ts';
import { FormMode } from '@/types/common.types.ts';
import {usePersons} from "@/hooks/usePersons.ts";
import {ThemedButton} from "@/components/common/form/ThemedButton.tsx";
import {ThemedInput} from "@/components/common/form/ThemedInput.tsx";
import {ThemedMultiSelect} from "@/components/common/form/ThemedMultiSelect.tsx";
import {ThemedSelect} from "@/components/common/form/ThemedSelect.tsx";

interface UserFormProps {
    user?: User;
    mode: FormMode;
    onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
    onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({
                                                      user,
                                                      mode,
                                                      onSubmit,
                                                      onCancel,
                                                  }) => {
    const { roles, loading: rolesLoading } = useRoles();
    const { persons, loading: personsLoading } = usePersons();
    const [formData, setFormData] = useState({
        login: user?.login || '',
        email: user?.email || '',
        role_ids: user?.role_ids || [],
        person_id: user?.person_id || null
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isViewMode = mode === 'view';

    const roleOptions = roles.map((role) => ({
        value: role.id,
        label: role.name,
    }));

    const personOptions = persons.map((person) => ({
        value: person.id,
        label: person.first_name + " " + person.last_name,
    }));

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.login.trim()) {
            newErrors.name = 'Login is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (mode === 'create') {
                await onSubmit(formData as UserCreate);
            } else {
                const updateData: UserUpdate = { ...formData };
                await onSubmit(updateData);
            }
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
                label="Login"
                value={formData.login}
                onChange={(e) => handleChange('login', e.target.value)}
                error={errors.name}
                disabled={isViewMode}
                required
            />

            <ThemedInput
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                disabled={isViewMode}
                required
            />

            <ThemedMultiSelect
                label="Roles"
                options={roleOptions}
                value={formData.role_ids}
                onChange={(values) => handleChange('role_ids', values)}
                disabled={isViewMode || rolesLoading}
                placeholder="Select roles"
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
                disabled={isViewMode || personsLoading}
            />

            {!isViewMode && (
                <div className="flex justify-end gap-3 pt-4">
                    <ThemedButton type="button" variant="secondary" onClick={onCancel}>
                        Cancel
                    </ThemedButton>
                    <ThemedButton type="submit" variant="primary" isLoading={isSubmitting}>
                        {mode === 'create' ? 'Create User' : 'Update User'}
                    </ThemedButton>
                </div>
            )}
        </form>
    );
};