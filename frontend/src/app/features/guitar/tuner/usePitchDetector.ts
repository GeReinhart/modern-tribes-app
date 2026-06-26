import { useCallback, useEffect, useRef, useState } from 'react';
import { getAudioContext } from '../audioContext.ts';
import { detectGuitarPitch } from './pitchDetector.ts';
import { GuitarTunerResult } from './tunerTypes.ts';

const FFT_SIZE = 4096;
const POLL_INTERVAL_MS = 100;
const HOLD_DURATION_MS = 3000;

export type MicState = 'idle' | 'requesting' | 'active' | 'denied';

interface UsePitchDetectorResult {
  micState: MicState;
  pitch: GuitarTunerResult | null;
  start: () => void;
  stop: () => void;
}

export function usePitchDetector(): UsePitchDetectorResult {
  const [micState, setMicState] = useState<MicState>('idle');
  const [pitch, setPitch] = useState<GuitarTunerResult | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const poll = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    const result = detectGuitarPitch(buffer, getAudioContext().sampleRate);
    if (result !== null) {
      clearHoldTimer();
      setPitch(result);
    } else {
      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          holdTimerRef.current = null;
          setPitch(null);
        }, HOLD_DURATION_MS);
      }
    }
  }, [clearHoldTimer]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    clearHoldTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    setPitch(null);
    setMicState('idle');
  }, [clearHoldTimer]);

  const start = useCallback(async () => {
    setMicState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;
      setMicState('active');
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    } catch {
      setMicState('denied');
    }
  }, [poll]);

  useEffect(() => () => { stop(); }, [stop]);

  return { micState, pitch, start, stop };
}
