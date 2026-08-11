import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { SongMetronomeControls } from './SongMetronomeControls.tsx';
import { SongVideoList } from './SongVideoList.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongLearningToolsPanelProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  canManage: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// A metronome and video links are tools to keep glancing at or listening to while scrolling
// through the rest of the song -- deliberately NOT a ThemedModal: no backdrop, no page-scroll
// lock, and it stays open (fixed to the viewport corner) while the user keeps interacting with
// the song page behind it. Closes only via its own close button or Escape, never an outside
// click, so it doesn't vanish while the user is busy elsewhere on the page.
export const SongLearningToolsPanel: React.FC<SongLearningToolsPanelProps> = ({
  song, hook, canManage, isOpen, onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', right: '16px', bottom: '16px', zIndex: 1600,
        width: '320px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)',
        display: 'flex', flexDirection: 'column',
        backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
        borderTop: `4px solid ${theme.colors.primary}`, borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          padding: '10px 12px', borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        <ThemedText size="medium" as="h3">{t('guitarSong.learningTools.title')}</ThemedText>
        <button
          type="button" onClick={onClose} aria-label={t('common.close')} title={t('common.close')}
          style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ThemedSvgIcon name="x" color={theme.colors.text} size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px', overflowY: 'auto' }}>
        <div>
          <ThemedText size="small" as="h4" style={{ marginBottom: '6px' }}>
            {t('features.guitarMetronome.title')}
          </ThemedText>
          <SongMetronomeControls tempoBpm={song.tempo_bpm} beatsPerBar={song.beats_per_bar} />
        </div>
        <div>
          <ThemedText size="small" as="h4" style={{ marginBottom: '6px' }}>
            {t('guitarSong.videos.title')}
          </ThemedText>
          {/* A song can attach several videos -- its own scroll area keeps the panel's own
              height capped instead of growing past the viewport as the list gets longer. */}
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <SongVideoList
              videos={song.videos} canEdit={canManage} canManage={canManage}
              onAdd={hook.addVideo} onUpdate={hook.updateVideo} onMove={hook.moveVideo} onRemove={hook.removeVideo}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
