import React from 'react';
import { User, UserCreate, UserUpdate } from '@/types/user.types.ts';
import { UserForm } from './UserForm.tsx';
import { FormMode } from '@/types/common.types.ts';
import {ModalBody,ThemedModal} from "@/components/common/layout/ThemedModal.tsx";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User;
    mode: FormMode;
    onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
}

export const UserModal: React.FC<UserModalProps> = ({
                                                        isOpen,
                                                        onClose,
                                                        user,
                                                        mode,
                                                        onSubmit,
                                                    }) => {
    const titles = {
        create: 'Create New User',
        edit: 'Edit User',
        view: 'View User',
    };

    const handleSubmit = async (data: UserCreate | UserUpdate) => {
        await onSubmit(data);
        onClose();
    };

    return (
        <ThemedModal isOpen={isOpen} onClose={onClose} title={titles[mode]} size="md">
            <ModalBody>
                <UserForm
                    user={user}
                    mode={mode}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                />
            </ModalBody>
        </ThemedModal>
    );
};