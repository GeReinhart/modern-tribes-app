import { getAudioContext } from './audioContext.ts';
import { Sample } from './sampleCatalog.ts';
import { playFolk } from './sounds/folk.ts';

const FALLBACK_FREQUENCIES: Record<string, number> = {
  A: 440.0, 'A#': 466.16, B: 493.88,
  C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13,
  E: 329.63, F: 349.23, 'F#': 369.99, G: 392.0, 'G#': 415.3,
};

function playSampleBuffer(buffer: AudioBuffer, duration: number): void {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(1.0, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(t);
  source.stop(t + duration);
}

function playFallback(note: string, duration: number): void {
  const freq = FALLBACK_FREQUENCIES[note];
  if (freq === undefined) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    void ctx.resume().then(() => playFolk(ctx, freq, duration));
    return;
  }
  playFolk(ctx, freq, duration);
}

export function playSample(
  sample: Sample,
  duration: number,
  getBuffer: (file: string) => AudioBuffer | null,
): void {
  const ctx = getAudioContext();
  const buffer = getBuffer(sample.file);

  const doPlay = () => {
    if (buffer) {
      playSampleBuffer(buffer, duration);
    } else {
      playFallback(sample.note, duration);
    }
  };

  if (ctx.state === 'suspended') {
    void ctx.resume().then(doPlay);
  } else {
    doPlay();
  }
}
