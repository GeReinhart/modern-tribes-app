import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import { DEFAULT_CALENDAR_ITEM_COLOR } from './types.ts';
import type { CalendarItem } from './types.ts';

interface Props<T extends CalendarItem> {
  item: T;
  startLabel: string;
  endLabel: string;
  onSelect: () => void;
  onEdit?: () => void;
}

// Fallback content for a timed calendar item card: title + time range, with
// the same colored-left-border look every feature gets for free when it
// does not supply its own renderItem.
function DefaultCalendarItemCard<T extends CalendarItem>({ item, startLabel, endLabel, onSelect, onEdit }: Props<T>) {
  const { theme } = useTheme();
  const color = item.color ?? DEFAULT_CALENDAR_ITEM_COLOR;

  return (
    <div
      style={{
        width: '100%', height: '100%', boxSizing: 'border-box',
        backgroundColor: theme.colors.surface,
        borderLeft: `4px solid ${color}`,
        borderTop: `1px solid ${color}33`,
        borderRight: `1px solid ${color}33`,
        borderBottom: `1px solid ${color}33`,
        borderRadius: '0 4px 4px 0',
        padding: '3px 5px 3px 6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', flexShrink: 0 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          style={{ background: `${color}22`, border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
        >
          <ThemedSvgIcon name="eye" color={color} size={20} />
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{ background: `${color}22`, border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
          >
            <ThemedSvgIcon name="pencil" color={color} size={20} />
          </button>
        )}
        <span style={{ fontSize: '14px', fontWeight: 800, color: theme.colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
          {item.title}
        </span>
      </div>
      <span style={{ fontSize: '12px', color: theme.colors.secondary, display: 'block', whiteSpace: 'nowrap', fontWeight: 600 }}>
        {startLabel} → {endLabel}
      </span>
    </div>
  );
}

export default DefaultCalendarItemCard;
