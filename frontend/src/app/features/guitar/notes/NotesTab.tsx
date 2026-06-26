import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FretCountControl from './FretCountControl.tsx';
import GuitarFretboard from './GuitarFretboard.tsx';
import HideDurationControl from './HideDurationControl.tsx';
import { AutoIcon, EyeIcon, EyeOffIcon, FretboardIcon, IconButton, ManualIcon, NextIcon, PauseIcon, PlayIcon, RepeatIcon, SoundIcon, SoundOffIcon } from './icons.tsx';
import NoteDisplay from './NoteDisplay.tsx';
import NoteFilter from './NoteFilter.tsx';
import OctaveFilter from './OctaveFilter.tsx';
import RevealDurationControl from './RevealDurationControl.tsx';
import SamplesLoader from './SamplesLoader.tsx';
import { SAMPLE_CATALOG } from './sampleCatalog.ts';
import { useSampleCache } from './useSampleCache.ts';
import { useNoteSettings } from './useNoteSettings.ts';
import { useNoteTimer } from './useNoteTimer.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const NotesTab: React.FC<Props> = ({ featureInstanceId }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const {
    hideDuration, setHideDuration,
    revealDuration, setRevealDuration,
    enabledNotes, setEnabledNotes,
    enabledOctaves, setEnabledOctaves,
    mode, setMode,
    fretCount, setFretCount,
    soundEnabled, setSoundEnabled,
    autoRepeat, setAutoRepeat,
  } = useNoteSettings(featureInstanceId);

  const { isDownloading, progress, status, getBuffer } = useSampleCache();
  const [noteVisible, setNoteVisible] = useState(true);
  const [fretboardVisible, setFretboardVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => { setPaused(false); }, [mode]);

  const running = mode === 'auto' && !paused;

  const eligibleSamples = useMemo(
    () => SAMPLE_CATALOG.filter(s => enabledNotes.includes(s.note) && enabledOctaves.includes(s.octave)),
    [enabledNotes, enabledOctaves],
  );

  const { sample, forceNext, autoReveal, playKey } = useNoteTimer(
    hideDuration, revealDuration, eligibleSamples, !noteVisible,
    status === 'ready' ? getBuffer : () => null, running, soundEnabled, autoRepeat,
  );

  if (isDownloading) return <SamplesLoader progress={progress} />;

  const noteShown = noteVisible || autoReveal;
  const fretboardShown = noteVisible || autoReveal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: theme.colors.surface }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <NoteWithModeRow
          mode={mode} setMode={setMode} t={t}
          noteName={sample?.note ?? '?'} noteOctave={sample?.octave ?? null}
          noteShown={noteShown} showSpeaker={!noteShown && soundEnabled}
          playKey={playKey}
        />
        <ActionRow
          t={t}
          mode={mode}
          paused={paused}
          setPaused={setPaused}
          noteVisible={noteVisible}
          setNoteVisible={setNoteVisible}
          fretboardVisible={fretboardVisible}
          setFretboardVisible={setFretboardVisible}
          forceNext={forceNext}
          autoRepeat={autoRepeat}
          setAutoRepeat={setAutoRepeat}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
        />
      </div>
      {fretboardVisible && (
        <GuitarFretboard
          activeSample={fretboardShown ? sample : null}
          noteVisible={true}
          fretCount={fretCount}
        />
      )}
      <div style={{ alignSelf: 'stretch', marginTop: '8px' }}>
        <NoteFilter enabled={enabledNotes} onChange={setEnabledNotes} />
      </div>
      <div style={{ alignSelf: 'stretch' }}>
        <OctaveFilter enabled={enabledOctaves} onChange={setEnabledOctaves} />
      </div>
      <HideDurationControl value={hideDuration} onChange={setHideDuration} />
      <RevealDurationControl value={revealDuration} onChange={setRevealDuration} />
      <FretCountControl value={fretCount} onChange={setFretCount} />
    </div>
  );
};

interface NoteWithModeRowProps {
  mode: 'auto' | 'manual';
  setMode: (v: 'auto' | 'manual') => void;
  t: (key: string) => string;
  noteName: string;
  noteOctave: number | null;
  noteShown: boolean;
  showSpeaker: boolean;
  playKey: number;
}

const NoteWithModeRow: React.FC<NoteWithModeRowProps> = ({ mode, setMode, t, noteName, noteOctave, noteShown, showSpeaker, playKey }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <IconButton onClick={() => setMode('auto')} title={t('features.guitarNotes.modeAuto')} primary={mode === 'auto'}>
      <AutoIcon />
    </IconButton>
    <NoteDisplay note={noteName} octave={noteOctave} visible={noteShown} showSpeaker={showSpeaker} playKey={playKey} />
    <IconButton onClick={() => setMode('manual')} title={t('features.guitarNotes.modeManual')} primary={mode === 'manual'}>
      <ManualIcon />
    </IconButton>
  </div>
);

interface ActionRowProps {
  t: (key: string) => string;
  mode: 'auto' | 'manual';
  paused: boolean;
  setPaused: (fn: (p: boolean) => boolean) => void;
  noteVisible: boolean;
  setNoteVisible: (fn: (v: boolean) => boolean) => void;
  fretboardVisible: boolean;
  setFretboardVisible: (fn: (v: boolean) => boolean) => void;
  forceNext: () => void;
  autoRepeat: boolean;
  setAutoRepeat: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}

const ActionRow: React.FC<ActionRowProps> = ({ t, mode, paused, setPaused, noteVisible, setNoteVisible, fretboardVisible, setFretboardVisible, forceNext, autoRepeat, setAutoRepeat, soundEnabled, setSoundEnabled }) => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    {mode === 'auto' && (
      <IconButton
        onClick={() => setPaused(v => !v)}
        title={paused ? t('features.guitarNotes.resume') : t('features.guitarNotes.stop')}
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </IconButton>
    )}
    <IconButton primary onClick={forceNext} title={t('features.guitarNotes.nextNote')}>
      <NextIcon />
    </IconButton>
    <IconButton
      onClick={() => setNoteVisible(v => !v)}
      title={noteVisible ? t('features.guitarNotes.hideNote') : t('features.guitarNotes.showNote')}
    >
      {noteVisible ? <EyeIcon /> : <EyeOffIcon />}
    </IconButton>
    <IconButton
      primary={fretboardVisible}
      onClick={() => setFretboardVisible(v => !v)}
      title={fretboardVisible ? t('features.guitarNotes.hideFretboard') : t('features.guitarNotes.showFretboard')}
    >
      <FretboardIcon />
    </IconButton>
    <IconButton
      primary={autoRepeat}
      onClick={() => setAutoRepeat(!autoRepeat)}
      title={t('features.guitarNotes.repeatNote')}
    >
      <RepeatIcon />
    </IconButton>
    <IconButton
      onClick={() => setSoundEnabled(!soundEnabled)}
      title={soundEnabled ? t('features.guitarNotes.muteSound') : t('features.guitarNotes.unmuteSound')}
    >
      {soundEnabled ? <SoundIcon /> : <SoundOffIcon />}
    </IconButton>
  </div>
);

export default NotesTab;
