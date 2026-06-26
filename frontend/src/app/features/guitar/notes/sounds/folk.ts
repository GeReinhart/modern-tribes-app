function createPluckBuffer(ctx: AudioContext, freq: number): AudioBuffer {
  const size = Math.ceil(ctx.sampleRate / freq);
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playFolk(ctx: AudioContext, freq: number, duration: number): void {
  const buffer = createPluckBuffer(ctx, freq);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq * 3;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  source.start(t);
  source.stop(t + duration);
}
