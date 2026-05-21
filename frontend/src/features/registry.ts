import React from 'react';

export interface FeatureTabProps {
    featureInstanceId: string;
    canEdit: boolean;
    isManager: boolean;
    actions?: React.ReactNode;
}

export interface FeatureDefinition {
    feature_type: string;
    label: string;
    component: React.ComponentType<FeatureTabProps>;
}

const _registry = new Map<string, FeatureDefinition>();

export function registerFeature(def: FeatureDefinition): void {
    _registry.set(def.feature_type, def);
}

export function getFeatureComponent(featureType: string): React.ComponentType<FeatureTabProps> | null {
    return _registry.get(featureType)?.component ?? null;
}
