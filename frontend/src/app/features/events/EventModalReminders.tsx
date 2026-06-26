import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import EventTimePicker from './EventTimePicker.tsx';
import type { EventReminderCreate } from './types.ts';

interface Props {
  reminders: EventReminderCreate[];
  canEdit: boolean;
  onChange: (reminders: EventReminderCreate[]) => void;
  eventStartAt?: string;
  eventEndAt?: string;
  eventTitle?: string;
}

const EventModalReminders: React.FC<Props> = ({ reminders, canEdit, onChange, eventStartAt, eventEndAt, eventTitle }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const addReminder = () => {
    const soon = new Date();
    soon.setHours(soon.getHours() + 1, 0, 0, 0);
    const p = (n: number) => String(n).padStart(2, '0');
    const val = `${soon.getFullYear()}-${p(soon.getMonth() + 1)}-${p(soon.getDate())}T${p(soon.getHours())}:00`;
    onChange([...reminders, { remind_at: val, reminder_type: 'notification' }]);
  };

  const updateReminder = (index: number, patch: Partial<EventReminderCreate>) => {
    onChange(reminders.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeReminder = (index: number) => {
    onChange(reminders.filter((_, i) => i !== index));
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px', backgroundColor: theme.colors.surface,
    color: theme.colors.text, fontSize: 'var(--font-sm)',
  };

  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.secondary, marginBottom: '6px' }}>
        {t('features.events.reminders')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {reminders.map((r, i) => {
          const sameDay = eventStartAt && r.remind_at.slice(0, 10) === eventStartAt.slice(0, 10);
          const maxAt = sameDay ? eventStartAt : undefined;
          return (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <ThemedDateSelection
              value={r.remind_at.slice(0, 10)}
              onChange={(d) => canEdit && updateReminder(i, { remind_at: d + 'T' + r.remind_at.slice(11, 16) })}
              disabled={!canEdit}
              dateFormat="EEEE dd/MM/yyyy"
              width="190px"
              maxDate={eventStartAt?.slice(0, 10)}
            />
            <EventTimePicker
              startAt={r.remind_at}
              endAt={r.remind_at}
              onStartAtChange={(v) => updateReminder(i, { remind_at: v })}
              onEndAtChange={() => {}}
              disabled={!canEdit}
              showDuration={false}
              maxAt={maxAt}
              eventStartAt={sameDay ? eventStartAt : undefined}
              eventEndAt={sameDay ? eventEndAt : undefined}
              eventTitle={eventTitle}
            />
            <select
              value={r.reminder_type}
              onChange={(e) => updateReminder(i, { reminder_type: e.target.value as 'notification' | 'mail' })}
              disabled={!canEdit}
              style={selectStyle}
            >
              <option value="notification">{t('features.events.reminderNotification')}</option>
              <option value="mail">{t('features.events.reminderMail')}</option>
            </select>
            {canEdit && (
              <button type="button" onClick={() => removeReminder(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
                <ThemedSvgIcon name="x" color="currentColor" size={16} />
              </button>
            )}
          </div>
          );
        })}
        {canEdit && (
          <button
            type="button"
            onClick={addReminder}
            title={t('features.events.addReminder')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.primary, padding: '4px' }}
          >
            <ThemedSvgIcon name="plus" color="currentColor" size={14} />
            <ThemedSvgIcon name="bell" color="currentColor" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EventModalReminders;
