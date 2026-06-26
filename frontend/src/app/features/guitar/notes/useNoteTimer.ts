import React, { useEffect, useRef, useState } from 'react';

import { playSample } from './notePlayer.ts';
import { Sample } from './sampleCatalog.ts';

function pickRandom(pool: Sample[], exclude?: Sample): Sample {
  const candidates = pool.filter(s => s !== exclude);
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function killTimers(ids: ReturnType<typeof setTimeout>[]): void {
  ids.forEach(clearTimeout);
}

function scheduleCycle(
  hidden: boolean,
  hideDuration: number,
  revealDuration: number,
  running: boolean,
  timerIds: React.MutableRefObject<ReturnType<typeof setTimeout>[]>,
  setAutoReveal: (v: boolean) => void,
  onAdvance: () => void,
  onComplete: () => void,
): void {
  killTimers(timerIds.current);
  setAutoReveal(false);
  if (!running) return;
  const totalCycle = hideDuration + revealDuration;
  if (!hidden) {
    timerIds.current = [setTimeout(() => { onAdvance(); onComplete(); }, totalCycle * 1000)];
  } else {
    timerIds.current = [
      setTimeout(() => setAutoReveal(true), hideDuration * 1000),
      setTimeout(() => { onAdvance(); onComplete(); }, totalCycle * 1000),
    ];
  }
}

function useCycleTimer(
  noteHidden: boolean,
  hideDuration: number,
  revealDuration: number,
  running: boolean,
  onAdvance: () => void,
  setAutoReveal: (v: boolean) => void,
): { forceNext: () => void } {
  const hiddenRef = useRef(noteHidden); hiddenRef.current = noteHidden;
  const hideRef = useRef(hideDuration); hideRef.current = hideDuration;
  const revealRef = useRef(revealDuration); revealRef.current = revealDuration;
  const runningRef = useRef(running); runningRef.current = running;
  const onAdvanceRef = useRef(onAdvance); onAdvanceRef.current = onAdvance;
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cycleRef = useRef<() => void>(() => {});

  cycleRef.current = () => {
    scheduleCycle(
      hiddenRef.current, hideRef.current, revealRef.current, runningRef.current,
      timerIds, setAutoReveal, onAdvanceRef.current, () => cycleRef.current(),
    );
  };

  const forceNextRef = useRef<() => void>(() => {});
  forceNextRef.current = () => {
    killTimers(timerIds.current);
    if (hiddenRef.current) {
      setAutoReveal(true);
      timerIds.current = [setTimeout(() => {
        onAdvanceRef.current();
        cycleRef.current();
      }, revealRef.current * 1000)];
    } else {
      onAdvanceRef.current();
      cycleRef.current();
    }
  };

  useEffect(() => {
    cycleRef.current();
    return () => killTimers(timerIds.current);
  }, [noteHidden, hideDuration, revealDuration, running]);

  return { forceNext: () => forceNextRef.current() };
}

export function useNoteTimer(
  hideDuration: number,
  revealDuration: number,
  eligibleSamples: Sample[],
  noteHidden: boolean,
  getBuffer: (file: string) => AudioBuffer | null,
  running: boolean,
  soundEnabled: boolean,
  autoRepeat: boolean,
): { sample: Sample | null; forceNext: () => void; autoReveal: boolean; playKey: number } {
  const [sample, setSample] = useState<Sample | null>(() =>
    eligibleSamples.length > 0 ? pickRandom(eligibleSamples) : null,
  );
  const [autoReveal, setAutoReveal] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const eligibleRef = useRef(eligibleSamples); eligibleRef.current = eligibleSamples;
  const sampleRef = useRef(sample); sampleRef.current = sample;
  const revealRef = useRef(revealDuration); revealRef.current = revealDuration;
  const getBufferRef = useRef(getBuffer); getBufferRef.current = getBuffer;
  const soundEnabledRef = useRef(soundEnabled); soundEnabledRef.current = soundEnabled;
  const autoRepeatRef = useRef(autoRepeat); autoRepeatRef.current = autoRepeat;
  const repeatTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = (s: Sample) => {
    if (soundEnabledRef.current) {
      playSample(s, revealRef.current, getBufferRef.current);
      setPlayKey(k => k + 1);
    }
  };

  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = () => {
    if (eligibleRef.current.length === 0) return;
    const next = pickRandom(eligibleRef.current, sampleRef.current ?? undefined);
    setSample(next);
    play(next);
    if (repeatTimerId.current !== null) {
      clearTimeout(repeatTimerId.current);
      repeatTimerId.current = null;
      if (autoRepeatRef.current && soundEnabledRef.current) scheduleRepeat();
    }
  };

  const { forceNext } = useCycleTimer(noteHidden, hideDuration, revealDuration, running, () => advanceRef.current(), setAutoReveal);

  function scheduleRepeat(): void {
    repeatTimerId.current = setTimeout(() => {
      if (autoRepeatRef.current && soundEnabledRef.current && sampleRef.current) {
        play(sampleRef.current);
        scheduleRepeat();
      }
    }, 1000);
  }

  useEffect(() => {
    if (repeatTimerId.current) { clearTimeout(repeatTimerId.current); repeatTimerId.current = null; }
    if (autoRepeat && soundEnabled) scheduleRepeat();
    return () => { if (repeatTimerId.current) clearTimeout(repeatTimerId.current); };
  }, [autoRepeat, soundEnabled]);

  useEffect(() => {
    if (sampleRef.current) play(sampleRef.current);
  }, []);

  return { sample, forceNext, autoReveal, playKey };
}
