import { useState, useEffect, useCallback } from 'react';
import { RecentChange } from '@/types/monitoring.types.ts';
import { monitoringService } from '@/services/monitoring.service.ts';

export const useRecentChanges = (hours: number, userEmail?: string) => {
    const [data, setData] = useState<RecentChange[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const result = await monitoringService.getRecentChanges(hours, userEmail);
            setData(result);
            setError(null);
        } catch {
            setError('Failed to load recent changes');
        } finally {
            setLoading(false);
        }
    }, [hours, userEmail]);

    useEffect(() => { fetch(); }, [fetch]);

    return { data, loading, error, refetch: fetch };
};
