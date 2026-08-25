import CalendarWeekGrid from '@/app/platform/core/layout/themes/components/calendar/CalendarWeekGrid.tsx';
import type { CalendarItemRenderContext } from '@/app/platform/core/layout/themes/components/calendar/types.ts';

import React, { useCallback } from 'react';

import DayEventCard from './DayEventCard.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';

interface Props {
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

const EventWeekView: React.FC<Props> = ({ events, labels, persons, selectedDate, onSelectDate, onPrevWeek, onNextWeek, onSelectEvent, onEditEvent }) => {
  const renderItem = useCallback((event: CalendarEvent, ctx: CalendarItemRenderContext) => (
    <DayEventCard
      event={event}
      startLabel={ctx.startLabel}
      endLabel={ctx.endLabel}
      heightPx={ctx.heightPx}
      labels={labels}
      persons={persons}
      onView={onSelectEvent}
      onEdit={onEditEvent}
    />
  ), [labels, persons, onSelectEvent, onEditEvent]);

  return (
    <CalendarWeekGrid
      items={events}
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      onPrevWeek={onPrevWeek}
      onNextWeek={onNextWeek}
      onSelectItem={onSelectEvent}
      onEditItem={onEditEvent}
      renderItem={renderItem}
    />
  );
};

export default EventWeekView;
