import React from 'react';
import {ThemedModal,ModalBody, ModalFooter} from "@/components/common/layout/ThemedModal.tsx";
import {ThemedButton} from "@/components/common/form/ThemedButton.tsx";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ThemedConfirmDialog: React.FC<ConfirmDialogProps> = ({
                                                                isOpen,
                                                                onClose,
                                                                onConfirm,
                                                                title,
                                                                message,
                                                                confirmText = 'Confirm',
                                                                cancelText = 'Cancel',
                                                                variant = 'danger',
                                                                isLoading = false,
                                                            }) => {
    const handleConfirm = () => {
        onConfirm();
    };

    const variantColors = {
        danger: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
    };

    return (
        <ThemedModal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalBody>
                <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10`}>
                        <svg
                            className={`h-6 w-6 ${variantColors[variant]}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <ThemedButton variant="secondary" onClick={onClose} disabled={isLoading}>
                    {cancelText}
                </ThemedButton>
                <ThemedButton variant="danger" onClick={handleConfirm}>
                    {confirmText}
                </ThemedButton>
            </ModalFooter>
        </ThemedModal>
    );
};