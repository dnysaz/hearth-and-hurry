// Sound synthesised with WebAudio: no audio files, no network, no autoplay.
// The sound is optional — the game stays fully playable with it muted.

let context = null;
let muted = false;

/** Lazily create the audio context after the first user gesture. */
function audio() {
  if (muted) return null;
  if (!context) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    context = new Ctx();
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

/** One note: type, frequency, length, gain and optional ending frequency. */
function tone(type, from, to, seconds, gain) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

/** A short noise burst for chops and sizzles. */
function noise(seconds, gain, frequency) {
  const ctx = audio();
  if (!ctx) return;
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  amp.gain.value = gain;
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start();
}

/** Tiny cues named after the events that trigger them. */
export const SOUND = {
  pick() { tone('triangle', 520, 760, 0.1, 0.05); },
  chop() { noise(0.09, 0.09, 1800); tone('square', 220, 130, 0.07, 0.03); },
  cook() { noise(0.28, 0.05, 900); tone('sine', 180, 340, 0.22, 0.04); },
  ready() { tone('sine', 660, 990, 0.16, 0.06); tone('sine', 990, 1320, 0.12, 0.03); },
  plate() { tone('triangle', 880, 1180, 0.13, 0.05); },
  serve() { tone('sine', 523, 784, 0.18, 0.06); tone('sine', 784, 1046, 0.2, 0.04); },
  bad() { tone('sawtooth', 260, 90, 0.26, 0.04); },
  wave() { tone('triangle', 392, 587, 0.24, 0.05); },
  click() { tone('sine', 700, 900, 0.06, 0.035); },
};

/** M toggles sound; the renderer shows the state through the status line. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}
