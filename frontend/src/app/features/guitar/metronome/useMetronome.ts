import { useCallback, useEffect, useRef, useState } from 'react';
import { MetronomeHandle, startMetronome } from './metronomeEngine.ts';

const TAP_WINDOW_MS = 3000;
const MIN_BPM = 20;
const MAX_BPM = 300;

export function useMetronome(bpm: number, beatsPerBar: number, accentEnabled: boolean, setBpm: (v: number) => void) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const engineRef = useRef<MetronomeHandle | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setIsRunning(false);
    setActiveBeat(null);
  }, []);

  const start = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = startMetronome(bpm, beatsPerBar, accentEnabled, beat => setActiveBeat(beat));
    setIsRunning(true);
  }, [bpm, beatsPerBar, accentEnabled]);

  const toggle = useCallback(() => {
    if (isRunning) stop();
    else start();
  }, [isRunning, start, stop]);

  const tap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current = tapTimesRef.current
      .filter(t => now - t < TAP_WINDOW_MS)
      .concat(now);
    const taps = tapTimesRef.current;
    if (taps.length < 2) return;
    const intervals = taps.slice(1).map((t, i) => t - taps[i]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const computed = Math.round(60000 / avgInterval);
    setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, computed)));
  }, [setBpm]);

  // restart engine when bpm, beatsPerBar or accentEnabled change while running
  useEffect(() => {
    if (!isRunning) return;
    engineRef.current?.stop();
    engineRef.current = startMetronome(bpm, beatsPerBar, accentEnabled, beat => setActiveBeat(beat));
  }, [bpm, beatsPerBar, accentEnabled, isRunning]);

  useEffect(() => () => engineRef.current?.stop(), []);

  return { isRunning, activeBeat, toggle, tap };
}
