import React from 'react';
import {useTribe} from "@/hooks/useTribes.ts";
import {ThemedBadge} from "@/components/common/layout/ThemedBadge.tsx";

interface PositionTribeProps {
    tribeId: string | null;
}

export const PositionTribeBadge: React.FC<PositionTribeProps> = ({ tribeId }) => {
    const { tribe } = useTribe(tribeId);

    if (!tribeId) {
        return <ThemedBadge variant="secondary">No tribe</ThemedBadge>;
    }

    return (
        <div className="flex flex-wrap gap-2">

                    <ThemedBadge key={tribeId} variant="primary">
                        {tribe?.name || 'Unknown tribe'}
                    </ThemedBadge>
        </div>
    );
};