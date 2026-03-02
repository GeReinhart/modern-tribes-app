import React, {useEffect} from 'react';
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

const TribesPageContent: React.FC = () => {
    const navigate = useNavigate();
    const {user, isLoading: currentUserLoading} = useCurrentUserProfile();
    const {tribes, loading: tribesLoading} = useUserTribes(user?.id || '', {enabled: !!user?.id});
    const { data: authorization, error: authorizationError, verifyAuthorization } = useVerifyAuthorization();

    const breadcrumbs = [
        { label: 'Home', path: '/app' },
        { label: 'Tribes' }
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
                Create Tribe
            </ThemedButton>
            )}

            <ThemedButton requiredPermissions={["admin"]}
                variant={'ghost'}
                onClick={() => {
                    navigate('/admin');
                }}
                theme={themesById['main_3']}
            >
                Admin
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

                {/* Header */}
                <div className="mb-6">
                    <ThemedText variant="primary" size="large" as="h1">
                        Tribes
                    </ThemedText>
                    <ThemedText variant="primary" size="small">
                        The tribes I'm involved with.
                    </ThemedText>
                </div>

                <ThemedDivider variant="primary"/>

                {/* Tribes Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tribes.map((tribe) => (
                        <TribeCard
                            key={tribe.tribe_id}
                            tribe={tribe}
                            onClick={(t) => navigate(`/app/tribes/${t.tribe_id}`)}
                        />
                    ))}
                </div>

                {tribes.length === 0 && (
                    <ThemedCard variant="secondary">
                        <ThemedText variant="secondary" size="medium">
                            No tribes yet. Create your first tribe!
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
