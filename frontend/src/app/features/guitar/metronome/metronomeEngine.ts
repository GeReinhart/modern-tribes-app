import { getAudioContext } from '../audioContext.ts';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;

function playClick(time: number, accent: boolean): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = accent ? 1200 : 800;
  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  osc.start(time);
  osc.stop(time + 0.04);
}

export interface MetronomeHandle {
  stop: () => void;
}

export function startMetronome(
  bpm: number,
  beatsPerBar: number,
  accentEnabled: boolean,
  onBeat: (beat: number) => void,
): MetronomeHandle {
  const ctx = getAudioContext();
  let beat = 0;
  let nextBeatTime = ctx.currentTime + 0.1;
  let running = true;

  function schedule() {
    if (!running) return;
    while (nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const currentBeat = beat % beatsPerBar;
      playClick(nextBeatTime, accentEnabled && currentBeat === 0);
      const delay = (nextBeatTime - ctx.currentTime) * 1000;
      const capturedBeat = currentBeat;
      setTimeout(() => { if (running) onBeat(capturedBeat); }, Math.max(0, delay));
      nextBeatTime += 60 / bpm;
      beat++;
    }
    setTimeout(schedule, LOOKAHEAD_MS);
  }

  schedule();
  return { stop: () => { running = false; } };
}
