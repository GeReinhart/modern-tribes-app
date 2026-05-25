import { useTheme } from '@/contexts/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile.ts';

import { useNavigate } from 'react-router-dom';

function UserBadge() {
  const { user, person, isLoading } = useCurrentUserProfile();
  const { theme } = useTheme();
  const navigate = useNavigate();

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
    <div
      className="w-10 h-10 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold cursor-pointer hover:scale-105 transition-transform"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
      }}
      onClick={() => navigate('/app/profile')}
    >
      {initials}
    </div>
  );
}

export default UserBadge;
