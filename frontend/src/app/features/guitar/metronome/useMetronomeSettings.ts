import { useState } from 'react';

const DEFAULT_BPM = 120;
const DEFAULT_BEATS_PER_BAR = 4;

interface MetronomeSettings {
  bpm: number;
  beatsPerBar: number;
  accentEnabled: boolean;
}

const DEFAULTS: MetronomeSettings = {
  bpm: DEFAULT_BPM,
  beatsPerBar: DEFAULT_BEATS_PER_BAR,
  accentEnabled: true,
};

function storageKey(instanceId: string): string {
  return `guitar_metronome_${instanceId}`;
}

function loadSettings(instanceId: string): MetronomeSettings {
  try {
    const stored = localStorage.getItem(storageKey(instanceId));
    if (!stored) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(stored) as Partial<MetronomeSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(instanceId: string, settings: MetronomeSettings): void {
  try {
    localStorage.setItem(storageKey(instanceId), JSON.stringify(settings));
  } catch {
    // storage unavailable
  }
}

export function useMetronomeSettings(instanceId: string) {
  const [settings, setSettings] = useState<MetronomeSettings>(() => loadSettings(instanceId));

  const update = (patch: Partial<MetronomeSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(instanceId, next);
      return next;
    });
  };

  return {
    bpm: settings.bpm,
    setBpm: (v: number) => update({ bpm: v }),
    beatsPerBar: settings.beatsPerBar,
    setBeatsPerBar: (v: number) => update({ beatsPerBar: v }),
    accentEnabled: settings.accentEnabled,
    setAccentEnabled: (v: boolean) => update({ accentEnabled: v }),
  };
}
