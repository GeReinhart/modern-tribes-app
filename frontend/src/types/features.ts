import { FIB_COLORS } from '@/components/themes/themes';

export interface PersonOption {
    id: string;
    name: string;
}

export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;

export function fibColor(size: number | null): string {
    if (size === null) return '';
    const idx = FIBONACCI.indexOf(size as typeof FIBONACCI[number]);
    return idx === -1 ? '' : (FIB_COLORS[idx] ?? '');
}
