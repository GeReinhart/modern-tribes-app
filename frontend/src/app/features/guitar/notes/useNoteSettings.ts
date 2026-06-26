import { useState } from 'react';

import { Note } from './noteTypes.ts';
import { Octave } from './sampleCatalog.ts';

const DEFAULT_HIDE = 5;
const DEFAULT_REVEAL = 2;
const DEFAULT_NOTES: Note[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const DEFAULT_OCTAVES: Octave[] = [2, 3];
const DEFAULT_MODE: 'auto' | 'manual' = 'auto';
const DEFAULT_FRET_COUNT = 14;

interface NoteSettings {
  hideDuration: number;
  revealDuration: number;
  enabledNotes: Note[];
  enabledOctaves: Octave[];
  mode: 'auto' | 'manual';
  fretCount: number;
  soundEnabled: boolean;
  autoRepeat: boolean;
}

const DEFAULTS: NoteSettings = {
  hideDuration: DEFAULT_HIDE,
  revealDuration: DEFAULT_REVEAL,
  enabledNotes: DEFAULT_NOTES,
  enabledOctaves: DEFAULT_OCTAVES,
  mode: DEFAULT_MODE,
  fretCount: DEFAULT_FRET_COUNT,
  soundEnabled: true,
  autoRepeat: false,
};

function storageKey(instanceId: string): string {
  return `guitar_notes_${instanceId}`;
}

function loadSettings(instanceId: string): NoteSettings {
  try {
    const stored = localStorage.getItem(storageKey(instanceId));
    if (!stored) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(stored) as Partial<NoteSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(instanceId: string, settings: NoteSettings): void {
  try {
    localStorage.setItem(storageKey(instanceId), JSON.stringify(settings));
  } catch {
    // storage unavailable
  }
}

export function useNoteSettings(instanceId: string) {
  const [settings, setSettings] = useState<NoteSettings>(() => loadSettings(instanceId));

  const update = (patch: Partial<NoteSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(instanceId, next);
      return next;
    });
  };

  return {
    hideDuration: settings.hideDuration,
    setHideDuration: (v: number) => update({ hideDuration: v }),
    revealDuration: settings.revealDuration,
    setRevealDuration: (v: number) => update({ revealDuration: v }),
    enabledNotes: settings.enabledNotes,
    setEnabledNotes: (v: Note[]) => update({ enabledNotes: v }),
    enabledOctaves: settings.enabledOctaves,
    setEnabledOctaves: (v: Octave[]) => update({ enabledOctaves: v }),
    mode: settings.mode,
    setMode: (v: 'auto' | 'manual') => update({ mode: v }),
    fretCount: settings.fretCount,
    setFretCount: (v: number) => update({ fretCount: v }),
    soundEnabled: settings.soundEnabled,
    setSoundEnabled: (v: boolean) => update({ soundEnabled: v }),
    autoRepeat: settings.autoRepeat,
    setAutoRepeat: (v: boolean) => update({ autoRepeat: v }),
  };
}
