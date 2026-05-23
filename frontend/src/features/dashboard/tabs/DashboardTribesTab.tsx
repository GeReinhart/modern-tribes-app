import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext.tsx';
import { ThemedCard } from '@/components/common/layout/ThemedCard.tsx';
import { ThemedText } from '@/components/common/layout/ThemedText.tsx';
import { ThemedDivider } from '@/components/common/layout/ThemedDivider.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { TribeCard } from '@/components/entities/tribes/TribeCard.tsx';
import { useUserTribes } from '@/hooks/useTribes.ts';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile.ts';
import type { TribeEntry } from '@/types/queries/tribes.query.types.ts';

function buildDedupedTribes(tribes: ReturnType<typeof useUserTribes>['tribes']): TribeEntry[] {
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
                existing.represented_persons.push({
                    first_name: row.person_first_name,
                    last_name: row.person_last_name,
                    position: row.position,
                });
            }
        }
    }
    return Array.from(map.values());
}

const DashboardTribesTab: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { user, isLoading: userLoading } = useCurrentUserProfile();
    const { tribes, loading: tribesLoading } = useUserTribes(user?.id || '', { enabled: !!user?.id });

    const dedupedTribes = useMemo(() => buildDedupedTribes(tribes), [tribes]);

    if (userLoading || tribesLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <ThemedLoadingSpinner size="sm" />
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dedupedTribes.map(tribe => (
                    <TribeCard
                        key={tribe.tribe_id}
                        tribe={tribe}
                        onClick={tr => navigate(`/app/tribes/${tr.tribe_id}`)}
                    />
                ))}
            </div>
            {dedupedTribes.length === 0 && (
                <ThemedCard variant="secondary">
                    <ThemedText variant="secondary" size="medium" style={{ color: theme.colors.secondary }}>
                        {t('tribes.empty')}
                    </ThemedText>
                </ThemedCard>
            )}
        </div>
    );
};

export default DashboardTribesTab;
