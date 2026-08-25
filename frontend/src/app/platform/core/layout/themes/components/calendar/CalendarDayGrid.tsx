import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import { useTranslation } from 'react-i18next';

import CalendarHourLabelsGutter, { CALENDAR_HOUR_HEIGHT } from './CalendarHourLabelsGutter.tsx';
import CalendarTimelineColumn from './CalendarTimelineColumn.tsx';
import { clipToDay, computeRange, dayBoundsMs, spansFullDay } from './calendarDayLayout.ts';
import { DEFAULT_CALENDAR_ITEM_COLOR } from './types.ts';
import type { CalendarItem, CalendarItemRenderer } from './types.ts';

interface Props<T extends CalendarItem> {
  items: T[];
  selectedDate: string;
  onSelectItem: (item: T) => void;
  onEditItem?: (item: T) => void;
  renderItem?: CalendarItemRenderer<T>;
}

// The single-day view: an "all day" chip row above an hourly timeline.
// Generic over any feature's CalendarItem.
function CalendarDayGrid<T extends CalendarItem>({ items, selectedDate, onSelectItem, onEditItem, renderItem }: Props<T>) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const allDayItems = items.filter(i => i.all_day || spansFullDay(i, selectedDate));
  const timedItems = items.filter(i => !i.all_day && !spansFullDay(i, selectedDate));

  const bounds = dayBoundsMs(selectedDate);
  const clippedRanges = timedItems.map(i => clipToDay(i, bounds));

  const { startH, endH } = computeRange(clippedRanges);
  const containerH = (endH - startH) * CALENDAR_HOUR_HEIGHT;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPx = (nowH - startH) * CALENDAR_HOUR_HEIGHT;
  const showNow = selectedDate === todayStr && nowH >= startH && nowH <= endH;

  return (
    <div>
      {allDayItems.length > 0 && (
        <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${theme.colors.border}` }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.secondary, marginBottom: '5px', letterSpacing: '0.05em' }}>
            {t('calendar.allDay')}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {allDayItems.map(item => {
              const color = item.color ?? DEFAULT_CALENDAR_ITEM_COLOR;
              return (
                <div
                  key={item.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px 3px 10px', borderRadius: '12px', backgroundColor: color + '18', border: `1.5px solid ${color}` }}
                >
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color }}>{item.title}</span>
                  <button type="button" onClick={() => onSelectItem(item)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
                    <ThemedSvgIcon name="eye" color={color} size={14} />
                  </button>
                  {onEditItem && (
                    <button type="button" onClick={() => onEditItem(item)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
                      <ThemedSvgIcon name="pencil" color={color} size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <span style={{ display: 'block', fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('calendar.noItemsDay')}
        </span>
      )}

      {timedItems.length > 0 && <div style={{ display: 'flex', position: 'relative', height: containerH }}>
        <CalendarHourLabelsGutter startH={startH} endH={endH} />

        <CalendarTimelineColumn
          date={selectedDate}
          items={timedItems}
          startH={startH}
          endH={endH}
          now={{ show: showNow, px: nowPx }}
          onSelectItem={onSelectItem}
          onEditItem={onEditItem}
          renderItem={renderItem}
        />
      </div>}
    </div>
  );
}

export default CalendarDayGrid;
