import { TabWithConfig } from './types.ts';

export function moveTab(
  tabs: TabWithConfig[],
  key: string,
  direction: -1 | 1,
): TabWithConfig[] {
  const index = tabs.findIndex((t) => t.key === key);
  const next = index + direction;
  if (index === -1 || next < 0 || next >= tabs.length) return tabs;
  const updated = [...tabs];
  [updated[index], updated[next]] = [updated[next], updated[index]];
  return updated.map((t, i) => ({ ...t, order: i }));
}

export function toggleVisible(tabs: TabWithConfig[], key: string): TabWithConfig[] {
  const updated = tabs.map((t) =>
    t.key === key ? { ...t, visible: !t.visible } : t,
  );
  const hasDefault = updated.some((t) => t.is_default && t.visible);
  if (!hasDefault) {
    const first = updated.find((t) => t.visible);
    return updated.map((t) => ({
      ...t,
      is_default: first ? t.key === first.key : t.is_default,
    }));
  }
  return updated;
}

export function setDefault(tabs: TabWithConfig[], key: string): TabWithConfig[] {
  return tabs.map((t) => ({ ...t, is_default: t.key === key }));
}

export function setIcon(tabs: TabWithConfig[], key: string, icon: string | null): TabWithConfig[] {
  return tabs.map((t) => (t.key === key ? { ...t, icon } : t));
}

export function setColor(tabs: TabWithConfig[], key: string, color: string | null): TabWithConfig[] {
  return tabs.map((t) => (t.key === key ? { ...t, color: color ?? undefined } : t));
}

export function toggleNameHidden(tabs: TabWithConfig[], key: string): TabWithConfig[] {
  return tabs.map((t) => (t.key === key ? { ...t, name: t.name === '' ? t.label : '' } : t));
}
