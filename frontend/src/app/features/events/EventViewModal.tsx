import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';
import { fmtDateWithDay, isoToLocalDt } from './dateUtils.ts';

interface Props {
  event: CalendarEvent;
  labels: FeatureLabel[];
  persons: PersonOption[];
  canEdit: boolean;
  projectName?: string;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface ScheduleProps {
  event: CalendarEvent;
  locale: string;
  t: (key: string) => string;
  theme: { colors: { text: string; secondary: string } };
}

function ScheduleDisplay({ event, locale, t, theme }: ScheduleProps) {
  const startDate = isoToLocalDt(event.start_at).slice(0, 10);
  const endDate = isoToLocalDt(event.end_at).slice(0, 10);
  const sameDay = startDate === endDate;
  const textStyle: React.CSSProperties = { fontSize: 'var(--font-sm)', color: theme.colors.text };
  const dimStyle: React.CSSProperties = { fontSize: 'var(--font-sm)', color: theme.colors.secondary };

  if (event.all_day) {
    return (
      <div>
        {sameDay ? (
          <span style={textStyle}>{fmtDateWithDay(startDate, locale)}</span>
        ) : (
          <span style={textStyle}>
            {fmtDateWithDay(startDate, locale)} → {fmtDateWithDay(endDate, locale)}
          </span>
        )}
        <span style={{ ...dimStyle, marginLeft: '8px' }}>({t('features.events.allDay')})</span>
      </div>
    );
  }

  return (
    <div>
      <span style={textStyle}>{fmtDateWithDay(startDate, locale)}</span>
      <span style={{ ...dimStyle, marginLeft: '8px' }}>
        {fmtTime(event.start_at)} → {fmtTime(event.end_at)}
      </span>
    </div>
  );
}

const EventViewModal: React.FC<Props> = ({ event, labels, persons, canEdit, projectName, onClose, onEdit }) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  const eventLabels = labels.filter(l => event.label_ids.includes(l.id));
  const eventPersons = persons.filter(p => event.participant_ids.includes(p.id));

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '4px',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '8px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ backgroundColor: theme.colors.surface, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-lg)', color: theme.colors.text, display: 'block' }}>
              {event.title}
            </span>
            {projectName && (
              <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginTop: '2px', display: 'block' }}>
                {projectName}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
            {canEdit && (
              <button type="button" onClick={() => onEdit(event)} title={t('common.edit')} style={{ background: 'none', border: `1.5px solid ${theme.colors.border}`, borderRadius: '8px', padding: '6px', cursor: 'pointer', color: theme.colors.primary, lineHeight: 0 }}>
                <ThemedSvgIcon name="pencil" color="currentColor" size={18} />
              </button>
            )}
            <button type="button" onClick={onClose} title={t('common.close')} style={{ background: 'none', border: `1.5px solid ${theme.colors.border}`, borderRadius: '8px', padding: '6px', cursor: 'pointer', color: theme.colors.secondary, lineHeight: 0 }}>
              <ThemedSvgIcon name="x" color="currentColor" size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={sectionLabel}>{t('features.events.schedule')}</div>
            <ScheduleDisplay event={event} locale={i18n.language} t={t} theme={theme} />
          </div>

          {eventLabels.length > 0 && (
            <div>
              <div style={sectionLabel}>{t('features.events.labels')}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {eventLabels.map(l => (
                  <span key={l.id} style={{ padding: '2px 10px', borderRadius: '12px', backgroundColor: l.color + 'cc', color: 'white', fontSize: 'var(--font-xs)', fontWeight: 700 }}>
                    {l.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {eventPersons.length > 0 && (
            <div>
              <div style={sectionLabel}>{t('features.events.participants')}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {eventPersons.map(p => (
                  <span key={p.id} style={{ padding: '3px 10px', borderRadius: '12px', border: `1.5px solid ${theme.colors.border}`, fontSize: 'var(--font-xs)', fontWeight: 600, color: theme.colors.text }}>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {event.document_content_html && (
            <div>
              <div style={sectionLabel}>{t('features.events.notes')}</div>
              <div dangerouslySetInnerHTML={{ __html: event.document_content_html }} style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EventViewModal;
