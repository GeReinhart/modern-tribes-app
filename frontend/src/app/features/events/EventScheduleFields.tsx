import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import ThemedTimeSelection from '@/app/platform/core/layout/themes/components/ThemedTimeSelection.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { diffMinutes, formatDuration } from './dateUtils.ts';
import EventTimePicker from './EventTimePicker.tsx';

interface Props {
  allDay: boolean;
  multiDay: boolean;
  startAt: string;
  endAt: string;
  canEdit: boolean;
  onAllDayChange: (v: boolean) => void;
  onMultiDayChange: (v: boolean) => void;
  onStartAtChange: (v: string) => void;
  onEndAtChange: (v: string) => void;
}

const EventScheduleFields: React.FC<Props> = ({
  allDay, multiDay, startAt, endAt, canEdit,
  onAllDayChange, onMultiDayChange, onStartAtChange, onEndAtChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '6px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer',
    fontSize: 'var(--font-sm)', color: theme.colors.text,
  };

  const duration = formatDuration(diffMinutes(startAt, endAt), t);

  const checkboxRow = (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
      <label style={checkboxLabelStyle}>
        <input type="checkbox" checked={allDay} onChange={(e) => canEdit && onAllDayChange(e.target.checked)} disabled={!canEdit} />
        {t('features.events.allDay')}
      </label>
      <label style={{ ...checkboxLabelStyle, opacity: allDay ? 0.5 : 1 }}>
        <input
          type="checkbox"
          checked={multiDay}
          onChange={(e) => canEdit && onMultiDayChange(e.target.checked)}
          disabled={!canEdit || allDay}
        />
        {t('features.events.multiDay')}
      </label>
    </div>
  );

  if (allDay) {
    return (
      <div>
        <div style={sectionLabel}>{t('features.events.schedule')}</div>
        {checkboxRow}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <ThemedDateSelection
            value={startAt.slice(0, 10)}
            onChange={(d) => {
              if (!canEdit) return;
              onStartAtChange(d + 'T00:00');
              if (endAt.slice(0, 10) < d) onEndAtChange(d + 'T23:59');
            }}
            disabled={!canEdit}
            label={t('features.events.from')}
            dateFormat="EEEE dd/MM/yyyy"
          />
          <ThemedDateSelection
            value={endAt.slice(0, 10)}
            onChange={(d) => canEdit && onEndAtChange(d + 'T23:59')}
            disabled={!canEdit}
            label={t('features.events.to')}
            dateFormat="EEEE dd/MM/yyyy"
            minDate={startAt.slice(0, 10)}
          />
        </div>
      </div>
    );
  }

  if (multiDay) {
    return (
      <div>
        <div style={sectionLabel}>{t('features.events.schedule')}</div>
        {checkboxRow}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
            <ThemedDateSelection
              value={startAt.slice(0, 10)}
              onChange={(d) => canEdit && onStartAtChange(d + 'T' + startAt.slice(11, 16))}
              disabled={!canEdit}
              label={t('features.events.from')}
              dateFormat="EEEE dd/MM/yyyy"
            />
            <ThemedTimeSelection
              value={startAt.slice(11, 16)}
              onChange={(v) => canEdit && onStartAtChange(startAt.slice(0, 10) + 'T' + v)}
              disabled={!canEdit}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
            <ThemedDateSelection
              value={endAt.slice(0, 10)}
              onChange={(d) => canEdit && onEndAtChange(d + 'T' + endAt.slice(11, 16))}
              disabled={!canEdit}
              label={t('features.events.to')}
              dateFormat="EEEE dd/MM/yyyy"
              minDate={startAt.slice(0, 10)}
            />
            <ThemedTimeSelection
              value={endAt.slice(11, 16)}
              onChange={(v) => canEdit && onEndAtChange(endAt.slice(0, 10) + 'T' + v)}
              disabled={!canEdit}
            />
          </div>
          {duration && (
            <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
              {t('features.events.during')} {duration}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={sectionLabel}>{t('features.events.schedule')}</div>
      <div style={{ marginBottom: '10px' }}>
        <ThemedDateSelection
          value={startAt.slice(0, 10)}
          onChange={(d) => {
            if (!canEdit) return;
            onStartAtChange(d + 'T' + startAt.slice(11, 16));
            onEndAtChange(d + 'T' + endAt.slice(11, 16));
          }}
          disabled={!canEdit}
          dateFormat="EEEE dd/MM/yyyy"
          width="190px"
        />
      </div>
      {checkboxRow}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.events.from')}</span>
        <EventTimePicker
          startAt={startAt} endAt={endAt}
          onStartAtChange={(v) => canEdit && onStartAtChange(v)}
          onEndAtChange={(v) => canEdit && onEndAtChange(v)}
          disabled={!canEdit}
        />
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.events.to').toLowerCase()}</span>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: theme.colors.text }}>{endAt.slice(11, 16) || '--:--'}</span>
        {duration && (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            ({t('features.events.during')} {duration})
          </span>
        )}
      </div>
    </div>
  );
};

export default EventScheduleFields;
