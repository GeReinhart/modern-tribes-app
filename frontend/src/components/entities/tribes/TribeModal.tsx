import React from 'react';
import { Tribe, TribeCreate, TribeUpdate, TribeProjectInput } from '@/types/tribe.types.ts';
import { FormMode } from '@/types/common.types.ts';
import { TribeForm } from './TribeForm.tsx';
import { ThemedModal, ModalBody } from "@/components/common/layout/ThemedModal.tsx";

interface TribeModalProps {
    isOpen: boolean;
    onClose: () => void;
    tribe?: Tribe;
    mode: FormMode;
    onSubmit: (data: TribeCreate | TribeUpdate, projects: TribeProjectInput[]) => Promise<void>;
}

export const TribeModal: React.FC<TribeModalProps> = ({ isOpen, onClose, tribe, mode, onSubmit }) => {
    const title =
        mode === 'create' ? 'Create Tribe' :
        mode === 'edit' ? 'Edit Tribe' : 'Tribe Details';

    const handleSubmit = async (data: TribeCreate | TribeUpdate, projects: TribeProjectInput[]) => {
        await onSubmit(data, projects);
        onClose();
    };

    return (
        <ThemedModal isOpen={isOpen} onClose={onClose} title={title} size="md">
            <ModalBody>
                <TribeForm tribe={tribe} mode={mode} onSubmit={handleSubmit} onCancel={onClose} />
            </ModalBody>
        </ThemedModal>
    );
};