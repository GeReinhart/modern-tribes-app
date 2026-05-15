import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile.ts';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedText } from '@/components/common/layout/ThemedText.tsx';
import { ThemedDivider } from '@/components/common/layout/ThemedDivider.tsx';
import { ThemedCard } from '@/components/common/layout/ThemedCard.tsx';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge.tsx';
import { ThemedButton } from '@/components/common/form/ThemedButton.tsx';

function ProfilePageContent() {
    const { t, i18n } = useTranslation();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user, person } = useCurrentUserProfile();

    const breadcrumbs = [
        { label: t('common.home'), path: '/app' },
        { label: t('profile.title') },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('user_language', lang);
    };

    const initials = person
        ? `${person.first_name[0]}${person.last_name[0]}`
        : user?.login.substring(0, 2).toUpperCase();

    const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';

    const langButtonStyle = (lang: string): React.CSSProperties => ({
        padding: '6px 16px',
        borderRadius: '6px',
        border: `2px solid ${currentLang === lang ? theme.colors.primary : theme.colors.border}`,
        backgroundColor: currentLang === lang ? theme.colors.primary : 'transparent',
        color: currentLang === lang ? 'white' : theme.colors.text,
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: currentLang === lang ? 600 : 400,
        transition: 'all 0.2s ease',
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3"
                        style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
                    >
                        {initials}
                    </div>
                    {person && (
                        <ThemedText variant="primary" size="large" as="h2">
                            {person.first_name} {person.last_name}
                        </ThemedText>
                    )}
                </div>

                <ThemedDivider variant="secondary" />

                {/* Language Switcher */}
                <ThemedCard variant="secondary" bordered>
                    <ThemedText variant="primary" size="medium" as="h3">
                        {t('profile.language')}
                    </ThemedText>
                    <div className="mt-3">
                        <ThemedText variant="secondary" size="small">
                            {t('profile.languageLabel')}
                        </ThemedText>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                            <button style={langButtonStyle('en')} onClick={() => handleLanguageChange('en')}>
                                English
                            </button>
                            <button style={langButtonStyle('fr')} onClick={() => handleLanguageChange('fr')}>
                                Français
                            </button>
                        </div>
                    </div>
                </ThemedCard>

                {/* Personal Information */}
                {person && (
                    <ThemedCard variant="secondary" bordered>
                        <ThemedText variant="primary" size="medium" as="h3">
                            {t('profile.personalInfo')}
                        </ThemedText>
                        <div className="space-y-2 mt-3">
                            <div className="flex justify-between items-center">
                                <ThemedText variant="secondary" size="small">{t('profile.firstName')}</ThemedText>
                                <ThemedText variant="text" size="small">{person.first_name}</ThemedText>
                            </div>
                            <div className="flex justify-between items-center">
                                <ThemedText variant="secondary" size="small">{t('profile.lastName')}</ThemedText>
                                <ThemedText variant="text" size="small">{person.last_name}</ThemedText>
                            </div>
                            <div className="flex justify-between items-center">
                                <ThemedText variant="secondary" size="small">{t('profile.gender')}</ThemedText>
                                <ThemedBadge variant="accent">{person.gender}</ThemedBadge>
                            </div>
                            {person.document_id && (
                                <div className="flex justify-between items-center">
                                    <ThemedText variant="secondary" size="small">{t('profile.documentId')}</ThemedText>
                                    <ThemedText variant="text" size="small">{person.document_id}</ThemedText>
                                </div>
                            )}
                        </div>
                    </ThemedCard>
                )}

                {/* Account Information */}
                <ThemedCard variant="primary" bordered>
                    <ThemedText variant="primary" size="medium" as="h3">
                        {t('profile.accountInfo')}
                    </ThemedText>
                    <div className="space-y-2 mt-3">
                        <div className="flex justify-between items-center">
                            <ThemedText variant="secondary" size="small">{t('profile.login')}</ThemedText>
                            <ThemedText variant="text" size="small">{user?.login}</ThemedText>
                        </div>
                        <div className="flex justify-between items-center">
                            <ThemedText variant="secondary" size="small">{t('profile.email')}</ThemedText>
                            <ThemedText variant="text" size="small">{user?.email}</ThemedText>
                        </div>
                        <div className="flex justify-between items-center">
                            <ThemedText variant="secondary" size="small">{t('profile.roles')}</ThemedText>
                            <div className="flex gap-1">
                                {user?.roles.map((role, idx) => (
                                    <ThemedBadge key={idx} variant="success">{role.name}</ThemedBadge>
                                ))}
                            </div>
                        </div>
                    </div>
                </ThemedCard>

                {/* Actions */}
                <ThemedButton onClick={handleLogout} variant="danger" fullWidth mobileIcon="logout">
                    {t('profile.logout')}
                </ThemedButton>
            </div>
        </AppLayout>
    );
}

function ProfilePage() {
    return (
        <ThemeProvider defaultTheme="default">
            <ProfilePageContent />
        </ThemeProvider>
    );
}

export default ProfilePage;
