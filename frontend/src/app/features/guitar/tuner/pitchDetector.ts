import { centsFromTarget, findClosestString } from './guitarStrings.ts';
import { ALL_NOTES, GuitarTunerResult, PitchResult, TunerNote } from './tunerTypes.ts';

const MIN_RMS = 0.01;

function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;
  const half = Math.floor(size / 2);

  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / size);
  if (rms < MIN_RMS) return -1;

  const correlations = new Float32Array(half);
  for (let offset = 0; offset < half; offset++) {
    let sum = 0;
    for (let i = 0; i < half; i++) sum += buffer[i] * buffer[i + offset];
    correlations[offset] = sum;
  }

  let bestOffset = -1;
  let bestCorr = 0;
  let falling = false;

  for (let i = 1; i < half; i++) {
    if (!falling && correlations[i] < correlations[i - 1]) {
      falling = true;
    }
    if (falling && correlations[i] > correlations[i - 1]) {
      if (correlations[i] > bestCorr) {
        bestCorr = correlations[i];
        bestOffset = i;
      }
    }
  }

  if (bestOffset === -1 || bestCorr < 0.01) return -1;
  return sampleRate / bestOffset;
}

export function frequencyToPitch(frequency: number): PitchResult {
  const midi = 12 * Math.log2(frequency / 440) + 69;
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return { frequency, note: ALL_NOTES[noteIndex] as TunerNote, octave, cents };
}

export function detectPitch(buffer: Float32Array, sampleRate: number): PitchResult | null {
  const frequency = autoCorrelate(buffer, sampleRate);
  if (frequency < 20 || frequency > 5000) return null;
  return frequencyToPitch(frequency);
}

export function detectGuitarPitch(buffer: Float32Array, sampleRate: number): GuitarTunerResult | null {
  const frequency = autoCorrelate(buffer, sampleRate);
  if (frequency < 60 || frequency > 400) return null;
  const target = findClosestString(frequency);
  const cents = centsFromTarget(frequency, target);
  return {
    frequency,
    targetNote: target.note,
    targetOctave: target.octave,
    targetLabel: target.label,
    targetString: target.string,
    cents,
  };
}
