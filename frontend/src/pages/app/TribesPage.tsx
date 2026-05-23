import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {AppLayout} from '@/components/layout/AppLayout';
import {useUserTribes} from '@/hooks/useTribes.ts';
import {useCurrentUserProfile} from "@/hooks/useCurrentUserProfile.ts";
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText} from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import {TribeCard} from '@/components/entities/tribes/TribeCard.tsx';
import {useNavigate} from 'react-router-dom';
import {themesById} from "@/components/themes/themes.ts";
import {ThemeProvider} from "@/contexts/ThemeContext.tsx";
import {ThemedLoadingSpinner} from "@/components/common/layout/ThemedLoadingSpinner.tsx";
import {ThemedDivider} from "@/components/common/layout/ThemedDivider.tsx";
import {useVerifyAuthorization} from "@/hooks/userVerifyAuthorization.ts";
import {errorStyle} from "@/styles/theme.styles.tsx";
import { TribeEntry } from '@/types/queries/tribes.query.types.ts';


const TribesPageContent: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {user, isLoading: currentUserLoading} = useCurrentUserProfile();
    const {tribes, loading: tribesLoading} = useUserTribes(user?.id || '', {enabled: !!user?.id});
    const { data: authorization, error: authorizationError, verifyAuthorization } = useVerifyAuthorization();

    const dedupedTribes = useMemo((): TribeEntry[] => {
        const map = new Map<string, TribeEntry>();
        for (const row of tribes) {
            const existing = map.get(row.tribe_id);
            if (!existing) {
                map.set(row.tribe_id, {
                    tribe_id: row.tribe_id,
                    tribe_name: row.tribe_name,
                    direct_position: row.via_represents ? null : row.position,
                    represented_persons: row.via_represents
                        ? [{ first_name: row.person_first_name, last_name: row.person_last_name, position: row.position }]
                        : [],
                });
            } else {
                if (!row.via_represents) {
                    existing.direct_position = row.position;
                } else {
                    existing.represented_persons.push({ first_name: row.person_first_name, last_name: row.person_last_name, position: row.position });
                }
            }
        }
        return Array.from(map.values());
    }, [tribes]);

    const breadcrumbs = [
        { label: t('common.home'), path: '/app' },
        { label: t('tribes.title') }
    ];

    // Check authorization
    useEffect(() => {
            verifyAuthorization(['admin','can_create_own_tribes']).catch((err) => {
                console.error('Authorization check failed:', err);
            });
    }, [verifyAuthorization]);

    const headerActions = (
        <>
            {authorization?.authorized && (
                <ThemedButton onClick={() => navigate('/app/tribes/create')} variant="primary">
                    {t('tribes.createTribe')}
                </ThemedButton>
            )}

            <ThemedButton requiredPermissions={["admin"]}
                variant={'ghost'}
                onClick={() => navigate('/admin')}
                theme={themesById['main_3']}
            >
                {t('common.admin')}
            </ThemedButton>
        </>
    );

    if (currentUserLoading || tribesLoading) {
        return (
            <AppLayout headerActions={headerActions}>
                <ThemedLoadingSpinner/>
            </AppLayout>
        );
    }

    return (
        <AppLayout headerActions={headerActions}  breadcrumbs={breadcrumbs} >
            <div className="container mx-auto px-4 py-8">

                {/* Authorization Error Message */}
                {authorizationError && (
                    <ThemedCard>
                        <div style={errorStyle}>
                            <strong>Authorization Error:</strong> {authorizationError.message}
                        </div>
                    </ThemedCard>
                )}


                {/* Tribes Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dedupedTribes.map((tribe) => (
                        <TribeCard
                            key={tribe.tribe_id}
                            tribe={tribe}
                            onClick={(t) => navigate(`/app/tribes/${t.tribe_id}`)}
                        />
                    ))}
                </div>

                {dedupedTribes.length === 0 && (
                    <ThemedCard variant="secondary">
                        <ThemedText variant="secondary" size="medium">
                            {t('tribes.empty')}
                        </ThemedText>
                    </ThemedCard>
                )}
            </div>
        </AppLayout>
    );
};

export const TribesPage: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="default">
            <TribesPageContent />
        </ThemeProvider>
    );
};
