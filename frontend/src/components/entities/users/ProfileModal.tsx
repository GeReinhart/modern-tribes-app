import { X } from 'lucide-react';
import { UserWithRolesAndPermissions} from '@/types/user.types.ts';
import { Person } from '@/types/person.types.ts';
import { useAuth } from "@/contexts/AuthContext.tsx";
import { useNavigate } from "react-router-dom";
import { useTheme } from '@/contexts/ThemeContext.tsx';
import {ThemedText} from "@/components/common/layout/ThemedText.tsx";
import {ThemedDivider} from "@/components/common/layout/ThemedDivider.tsx";
import {ThemedCard} from "@/components/common/layout/ThemedCard.tsx";
import {ThemedBadge} from "@/components/common/layout/ThemedBadge.tsx";
import {ThemedButton} from "@/components/common/form/ThemedButton.tsx";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserWithRolesAndPermissions | null;
    person: Person | null;
}

function ProfileModal({ isOpen, onClose, user, person }: ProfileModalProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const handleLogout = async () => {
        await logout();
        onClose();
        navigate('/auth/login');
    };

    if (!isOpen) return null;

    const initials = person ? `${person.first_name[0]}${person.last_name[0]}` : user?.login.substring(0, 2).toUpperCase();

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <ThemedText variant="primary" size="large" as="h2">
                            Profile
                        </ThemedText>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                                }}
                            >
                                {initials}
                            </div>
                            {person && (
                                <ThemedText variant="primary" size="large" as="h3">
                                    {person.first_name} {person.last_name}
                                </ThemedText>
                            )}
                        </div>

                        <ThemedDivider variant="secondary" />

                        {/* Personal Information */}
                        {person && (
                            <ThemedCard variant="secondary" bordered>
                                <ThemedText variant="primary" size="medium" as="h4">
                                    Personal Information
                                </ThemedText>
                                <div className="space-y-2 mt-3">
                                    <div className="flex justify-between items-center">
                                        <ThemedText variant="secondary" size="small">First Name:</ThemedText>
                                        <ThemedText variant="text" size="small">{person.first_name}</ThemedText>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <ThemedText variant="secondary" size="small">Last Name:</ThemedText>
                                        <ThemedText variant="text" size="small">{person.last_name}</ThemedText>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <ThemedText variant="secondary" size="small">Gender:</ThemedText>
                                        <ThemedBadge variant="accent">{person.gender}</ThemedBadge>
                                    </div>
                                    {person.document_id && (
                                        <div className="flex justify-between items-center">
                                            <ThemedText variant="secondary" size="small">Document ID:</ThemedText>
                                            <ThemedText variant="text" size="small">{person.document_id}</ThemedText>
                                        </div>
                                    )}
                                </div>
                            </ThemedCard>
                        )}

                        {/* Account Information */}
                        <ThemedCard variant="primary" bordered>
                            <ThemedText variant="primary" size="medium" as="h4">
                                Account Information
                            </ThemedText>
                            <div className="space-y-2 mt-3">
                                <div className="flex justify-between items-center">
                                    <ThemedText variant="secondary" size="small">Login:</ThemedText>
                                    <ThemedText variant="text" size="small">{user?.login}</ThemedText>
                                </div>
                                <div className="flex justify-between items-center">
                                    <ThemedText variant="secondary" size="small">Email:</ThemedText>
                                    <ThemedText variant="text" size="small">{user?.email}</ThemedText>
                                </div>
                                <div className="flex justify-between items-center">
                                    <ThemedText variant="secondary" size="small">Roles:</ThemedText>
                                    <div className="flex gap-1">
                                        {user?.roles.map((role, idx) => (
                                            <ThemedBadge key={idx} variant="success">{role.name}</ThemedBadge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ThemedCard>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50 flex gap-3">
                        <ThemedButton
                            onClick={handleLogout}
                            variant="danger"
                            fullWidth
                        >
                            Logout
                        </ThemedButton>
                        <ThemedButton
                            onClick={onClose}
                            variant="secondary"
                            fullWidth
                        >
                            Close
                        </ThemedButton>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProfileModal;