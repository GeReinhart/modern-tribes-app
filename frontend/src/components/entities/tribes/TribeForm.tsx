import React, { useState, useEffect } from 'react';
import { Tribe, TribeCreate, TribeUpdate } from '@/types/tribe.types.ts';
import { FormMode } from '@/types/common.types.ts';
import { useDocuments } from '@/hooks/useDocuments.ts';
import {useProjects} from "@/hooks/useProjects.ts";
import {ThemedButton} from "@/components/common/form/ThemedButton.tsx";
import {ThemedInput} from "@/components/common/form/ThemedInput.tsx";
import {ThemedSelect} from "@/components/common/form/ThemedSelect.tsx";
import {ThemedMultiSelect} from "@/components/common/form/ThemedMultiSelect.tsx";

interface TribeFormProps {
    tribe?: Tribe;
    mode: FormMode;
    onSubmit: (data: TribeCreate | TribeUpdate) => Promise<void>;
    onCancel: () => void;
}

export const TribeForm: React.FC<TribeFormProps> = ({
                                                        tribe,
                                                        mode,
                                                        onSubmit,
                                                        onCancel,
                                                    }) => {
    const { documents } = useDocuments();
    const { projects } = useProjects();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<TribeCreate>({
        name: '',
        document_id: null,
    });
    const [status, setStatus] = useState(tribe?.status ?? 'active');

    useEffect(() => {
        if (tribe && mode !== 'create') {
            setFormData({
                name: tribe.name,
                document_id: tribe.document_id || null,
                project_ids: tribe.project_ids || [],
            });
            setStatus(tribe.status ?? 'active');
        }
    }, [tribe, mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSubmit(mode === 'create' ? formData : { ...formData, status });
        } catch (err: any) {
            setError(err.message || 'An error occurred');
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

    const documentOptions = [
        { value: '', label: 'None' },
        ...documents.map((doc) => ({
            value: doc.id,
            label: doc.content_summary ? `${doc.content_summary} (${doc.id})` : doc.id,
        })),
    ];

    const projectOptions = projects.map((project) => ({
        value: project.id,
        label: project.name,
    }));


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <ThemedInput
                label="Name"
                value={formData.name}
                onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                }
                required
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

            <ThemedMultiSelect
                label="Projects"
                options={projectOptions}
                value={formData.project_ids || []}
                onChange={(values) =>
                    setFormData({ ...formData, project_ids: values })
                }
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