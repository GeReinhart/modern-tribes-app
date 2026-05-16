import React, { useState, useEffect } from 'react';
import { Project, ProjectCreate, ProjectUpdate } from '@/types/project.types.ts';
import { FormMode } from '@/types/common.types.ts';
import { useDocuments } from '@/hooks/useDocuments.ts';
import {ThemedButton} from "@/components/common/form/ThemedButton.tsx";
import {ThemedSelect} from "@/components/common/form/ThemedSelect.tsx";
import {ThemedInput} from "@/components/common/form/ThemedInput.tsx";

interface ProjectFormProps {
    project?: Project;
    mode: FormMode;
    onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
    onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
                                                            project,
                                                            mode,
                                                            onSubmit,
                                                            onCancel,
                                                        }) => {
    const { documents } = useDocuments();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<ProjectCreate>({
        name: '',
        document_id: '',
    });
    const [status, setStatus] = useState(project?.status ?? 'active');

    useEffect(() => {
        if (project && mode !== 'create') {
            setFormData({
                name: project.name,
                document_id: project.document_id,
            });
            setStatus(project.status ?? 'active');
        }
    }, [project, mode]);

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

    const documentOptions = documents.map((doc) => ({
        value: doc.id,
        label: doc.content_summary ? `${doc.content_summary} (${doc.id})` : doc.id,
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
                value={formData.document_id}
                onChange={(e) =>
                    setFormData({ ...formData, document_id: e })
                }
                options={documentOptions}
                required
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