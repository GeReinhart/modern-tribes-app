import { useState, useEffect, useCallback, useMemo } from 'react';
import { TabDefinition } from '@/hooks/useUrlTab';
import { TabWithConfig } from './types';
import { tabConfigService } from './tabConfig.service';

interface UseTabConfigResult {
    visibleTabs: TabDefinition[];
    defaultTabKey: string;
    tabsWithConfig: TabWithConfig[];
    saveConfig: (updated: TabWithConfig[]) => Promise<void>;
    isLoading: boolean;
}

function buildDefaultConfigs(allTabs: TabDefinition[]): TabWithConfig[] {
    return allTabs.map((tab, index) => ({
        key: tab.key,
        label: tab.label,
        visible: true,
        order: index,
        is_default: index === 0,
    }));
}

function mergeWithSaved(allTabs: TabDefinition[], saved: { key: string; visible: boolean; order: number; is_default: boolean }[]): TabWithConfig[] {
    const savedMap = new Map(saved.map(s => [s.key, s]));
    const merged: TabWithConfig[] = allTabs.map((tab, index) => {
        const s = savedMap.get(tab.key);
        return {
            key: tab.key,
            label: tab.label,
            visible: s ? s.visible : true,
            order: s ? s.order : index,
            is_default: s ? s.is_default : false,
        };
    });
    merged.sort((a, b) => a.order - b.order);
    const hasDefault = merged.some(t => t.is_default && t.visible);
    if (!hasDefault) {
        const first = merged.find(t => t.visible);
        if (first) first.is_default = true;
    }
    return merged;
}

export function useTabConfig(contextKey: string, allTabs: TabDefinition[]): UseTabConfigResult {
    const [tabsWithConfig, setTabsWithConfig] = useState<TabWithConfig[]>(() =>
        buildDefaultConfigs(allTabs)
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!contextKey) return;
        let cancelled = false;
        setIsLoading(true);
        tabConfigService.get(contextKey)
            .then(resp => {
                if (cancelled) return;
                setTabsWithConfig(mergeWithSaved(allTabs, resp.tab_configs));
            })
            .catch(() => {
                if (cancelled) return;
                setTabsWithConfig(buildDefaultConfigs(allTabs));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextKey]);

    useEffect(() => {
        setTabsWithConfig(prev => mergeWithSaved(allTabs, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allTabs.map(t => t.key).join(',')]);

    const visibleTabs = useMemo(
        () => tabsWithConfig.filter(t => t.visible).map(({ key, label }) => ({ key, label })),
        [tabsWithConfig],
    );

    const defaultTabKey = useMemo(
        () => tabsWithConfig.find(t => t.is_default && t.visible)?.key ?? visibleTabs[0]?.key ?? '',
        [tabsWithConfig, visibleTabs],
    );

    const saveConfig = useCallback(async (updated: TabWithConfig[]) => {
        const saved = await tabConfigService.save(contextKey, updated);
        setTabsWithConfig(mergeWithSaved(allTabs, saved.tab_configs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextKey, allTabs.map(t => t.key).join(',')]);

    return { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig, isLoading };
}
