import CalendarDayGrid from '@/app/platform/core/layout/themes/components/calendar/CalendarDayGrid.tsx';
import type { CalendarItemRenderContext } from '@/app/platform/core/layout/themes/components/calendar/types.ts';

import React, { useCallback } from 'react';

import DayEventCard from './DayEventCard.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';

interface Props {
  events: CalendarEvent[];
  labels: FeatureLabel[];
  persons: PersonOption[];
  selectedDate: string;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
}

const EventDayView: React.FC<Props> = ({ events, labels, persons, selectedDate, onSelectEvent, onEditEvent }) => {
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
    <CalendarDayGrid
      items={events}
      selectedDate={selectedDate}
      onSelectItem={onSelectEvent}
      onEditItem={onEditEvent}
      renderItem={renderItem}
    />
  );
};

export default EventDayView;
