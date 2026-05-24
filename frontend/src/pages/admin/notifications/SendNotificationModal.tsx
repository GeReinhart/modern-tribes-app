import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemedModal, ModalBody, ModalFooter } from '@/components/common/layout/ThemedModal';
import { ThemedTextarea } from '@/components/common/form/ThemedTextarea';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { UserSearchResult } from '@/types/notification.types';
import { notificationService } from '@/services/notification.service';

interface SendNotificationModalProps {
    user: UserSearchResult | null;
    onClose: () => void;
    onSuccess: (userName: string) => void;
    onError: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
    user,
    onClose,
    onSuccess,
    onError,
}) => {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = useCallback(() => {
        setMessage('');
        onClose();
    }, [onClose]);

    const handleSubmit = useCallback(async () => {
        if (!user || !message.trim()) return;
        setSubmitting(true);
        try {
            await notificationService.createForUser({ target_user_id: user.id, message: message.trim() });
            setMessage('');
            onSuccess(user.full_name);
        } catch {
            onError();
        } finally {
            setSubmitting(false);
        }
    }, [user, message, onSuccess, onError]);

    return (
        <ThemedModal
            isOpen={!!user}
            onClose={handleClose}
            title={t('admin.notifications.modalTitle', { name: user?.full_name ?? '' })}
            size="md"
        >
            <ModalBody>
                <ThemedTextarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('admin.notifications.messagePlaceholder')}
                    rows={4}
                    style={{ width: '100%' }}
                />
            </ModalBody>
            <ModalFooter>
                <ThemedButton variant="secondary" onClick={handleClose} disabled={submitting}>
                    {t('common.cancel')}
                </ThemedButton>
                <ThemedButton
                    onClick={handleSubmit}
                    disabled={!message.trim() || submitting}
                >
                    {t('admin.notifications.send')}
                </ThemedButton>
            </ModalFooter>
        </ThemedModal>
    );
};
