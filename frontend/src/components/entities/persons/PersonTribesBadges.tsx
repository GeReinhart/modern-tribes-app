import React from 'react';
import { useTribes } from '@/hooks/useTribes.ts';
import {ThemedBadge} from "@/components/common/layout/ThemedBadge.tsx";

interface PersonTribesBadgesProps {
    tribeIds: string[];
}

export const PersonTribesBadges: React.FC<PersonTribesBadgesProps> = ({ tribeIds }) => {
    const { tribes } = useTribes();

    if (!tribeIds || tribeIds.length === 0) {
        return <ThemedBadge variant="secondary">No tribes</ThemedBadge>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {tribeIds.map((tribeId) => {
                const tribe = tribes.find((t) => t.id === tribeId);
                return (
                    <ThemedBadge key={tribeId} variant="primary">
                        {tribe?.name || 'Unknown Tribe'}
                    </ThemedBadge>
                );
            })}
        </div>
    );
};