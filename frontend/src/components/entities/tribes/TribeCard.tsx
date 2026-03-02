import React from 'react';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText} from '@/components/common/layout/ThemedText';
import { UserPersonPositionTribe } from '@/types/queries/tribes.query.types.ts';
import {ThemedBadge} from "@/components/common/layout/ThemedBadge.tsx";

interface ThemedTribeCardProps {
    tribe: UserPersonPositionTribe;
    onClick: (tribe: UserPersonPositionTribe) => void;
}

const getPositionVariant = (position: string): 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'ghost' => {
    const positionLower = position.toLowerCase();

    if (positionLower === 'chief') {
        return 'accent';
    }
    if (positionLower === 'member') {
        return 'primary';
    }
    if (positionLower === 'guest') {
        return 'ghost';
    }
    return 'primary'; // default
};

export const TribeCard: React.FC<ThemedTribeCardProps> = ({ tribe, onClick }) => {
    return (
        <ThemedCard variant="primary" bordered>
            <div onClick={() => onClick(tribe)} style={{ cursor: 'pointer' }}>
                <ThemedText variant="primary" size="medium" as="h3">
                    {tribe.tribe_name}
                </ThemedText>

                <div style={{ marginTop: '12px' }}>
                    <ThemedBadge variant={getPositionVariant(tribe.position)}>
                        {tribe.position}
                    </ThemedBadge>
                </div>
            </div>
        </ThemedCard>
    );
};