import { useState } from 'react';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile.ts';
import ProfileModal from '@/components/entities/users/ProfileModal.tsx';
import { useTheme } from '@/contexts/ThemeContext.tsx';

function UserBadge() {
    const { user, person, isLoading } = useCurrentUserProfile();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { theme } = useTheme();

    if (isLoading) {
        return (
            <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
        );
    }

    if (!user) return null;

    const initials = person
        ? `${person.first_name[0]}${person.last_name[0]}`
        : user.login.substring(0, 2).toUpperCase();

    return (
        <>
            <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-lg font-bold cursor-pointer hover:scale-105 transition-transform"
                style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                }}
                onClick={() => setIsModalOpen(true)}
            >
                {initials}
            </div>

            <ProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                person={person}
            />
        </>
    );
}

export default UserBadge;