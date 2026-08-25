import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import CalendarHourLabelsGutter, { CALENDAR_HOUR_HEIGHT } from './CalendarHourLabelsGutter.tsx';
import CalendarTimelineColumn from './CalendarTimelineColumn.tsx';
import CalendarWeekAllDayBanner from './CalendarWeekAllDayBanner.tsx';
import CalendarWeekHeader from './CalendarWeekHeader.tsx';
import { getWeekDates } from './calendarDateUtils.ts';
import { clipToDay, computeRange, dayBoundsMs, spansFullDay } from './calendarDayLayout.ts';
import type { CalendarItem, CalendarItemRenderer } from './types.ts';

interface Props<T extends CalendarItem> {
  items: T[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectItem: (item: T) => void;
  onEditItem?: (item: T) => void;
  renderItem?: CalendarItemRenderer<T>;
}

function timedItemsForDate<T extends CalendarItem>(items: T[], date: string): T[] {
  return items.filter(i =>
    !i.all_day && !spansFullDay(i, date) &&
    i.start_at.slice(0, 10) <= date && i.end_at.slice(0, 10) >= date,
  );
}

// The week view: a 7-day header, an all-day banner, and an hourly grid with
// one CalendarTimelineColumn per day. Generic over any feature's CalendarItem.
function CalendarWeekGrid<T extends CalendarItem>({
  items, selectedDate, onSelectDate, onPrevWeek, onNextWeek, onSelectItem, onEditItem, renderItem,
}: Props<T>) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const timedByDate = useMemo(
    () => new Map(weekDates.map(date => [date, timedItemsForDate(items, date)])),
    [items, weekDates],
  );

  const clippedRanges = weekDates.flatMap(date => {
    const bounds = dayBoundsMs(date);
    return (timedByDate.get(date) ?? []).map(item => clipToDay(item, bounds));
  });
  const { startH, endH } = computeRange(clippedRanges);
  const containerH = (endH - startH) * CALENDAR_HOUR_HEIGHT;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowH = now.getHours() + now.getMinutes() / 60;
  const nowPx = (nowH - startH) * CALENDAR_HOUR_HEIGHT;
  const showNow = nowH >= startH && nowH <= endH;

  const hasTimedItems = clippedRanges.length > 0;

  return (
    <div>
      <CalendarWeekHeader
        weekDates={weekDates} selectedDate={selectedDate}
        onSelectDate={onSelectDate} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek}
      />

      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '12px 0' }} />

      <CalendarWeekAllDayBanner items={items} weekDates={weekDates} onSelectItem={onSelectItem} onEditItem={onEditItem} />

      {!hasTimedItems && (
        <span style={{ display: 'block', fontSize: 'var(--font-sm)', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('calendar.noItemsWeek')}
        </span>
      )}

      {hasTimedItems && (
        <div style={{ display: 'flex', position: 'relative', height: containerH }}>
          <CalendarHourLabelsGutter startH={startH} endH={endH} />
          {weekDates.map(date => (
            <CalendarTimelineColumn
              key={date}
              date={date}
              items={timedByDate.get(date) ?? []}
              startH={startH}
              endH={endH}
              now={{ show: showNow && date === todayStr, px: nowPx }}
              onSelectItem={onSelectItem}
              onEditItem={onEditItem}
              renderItem={renderItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CalendarWeekGrid;
