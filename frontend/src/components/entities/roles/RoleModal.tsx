import React from 'react';
import { Role, RoleCreate, RoleUpdate } from '@/types/role.types.ts';
import { RoleForm } from './RoleForm.tsx';
import { FormMode } from '@/types/common.types.ts';
import {ThemedModal,ModalBody} from "@/components/common/layout/ThemedModal.tsx";

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    role?: Role;
    mode: FormMode;
    onSubmit: (data: RoleCreate | RoleUpdate) => Promise<void>;
}

export const RoleModal: React.FC<RoleModalProps> = ({
                                                        isOpen,
                                                        onClose,
                                                        role,
                                                        mode,
                                                        onSubmit,
                                                    }) => {
    const titles = {
        create: 'Create New Role',
        edit: 'Edit Role',
        view: 'View Role',
    };

    const handleSubmit = async (data: RoleCreate | RoleUpdate) => {
        await onSubmit(data);
        onClose();
    };

    return (
        <ThemedModal isOpen={isOpen} onClose={onClose} title={titles[mode]} size="md">
            <ModalBody>
                <RoleForm
                    role={role}
                    mode={mode}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                />
            </ModalBody>
        </ThemedModal>
    );
};