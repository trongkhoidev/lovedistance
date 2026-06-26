'use client';

/**
 * Tiny self-contained sound engine (Web Audio API) — no asset files.
 * All sounds are synthesized. Respects a persisted mute flag.
 */

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = 'lvdist_muted';

if (typeof window !== 'undefined') {
  muted = localStorage.getItem(MUTE_KEY) === '1';
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted() {
  return muted;
}
export function setMuted(v: boolean) {
  muted = v;
  if (typeof window !== 'undefined') localStorage.setItem(MUTE_KEY, v ? '1' : '0');
}

/** A single enveloped oscillator note. */
function note(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18, slideTo?: number) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

function noiseBurst(start: number, dur: number, gain = 0.12) {
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1600;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(c.destination);
  src.start(c.currentTime + start);
}

export type SoundName =
  | 'tap'
  | 'send'
  | 'heart'
  | 'kiss'
  | 'hug'
  | 'miss'
  | 'angry'
  | 'success'
  | 'makeup'
  | 'lock'
  | 'wrong'
  | 'mega';

export function playSound(name: SoundName, combo = 1) {
  if (muted) return;
  if (!ac()) return;
  switch (name) {
    case 'tap':
      note(620, 0, 0.08, 'triangle', 0.12);
      break;
    case 'send':
      note(523, 0, 0.12, 'sine', 0.16);
      note(784, 0.06, 0.16, 'sine', 0.14);
      break;
    case 'heart':
      note(659, 0, 0.12, 'sine', 0.16, 880);
      note(988, 0.08, 0.2, 'sine', 0.12);
      break;
    case 'kiss':
      noiseBurst(0, 0.06, 0.1);
      note(900, 0.02, 0.07, 'sine', 0.14, 560);
      note(620, 0.1, 0.08, 'sine', 0.12, 420);
      break;
    case 'hug':
      note(392, 0, 0.25, 'sine', 0.16, 523);
      break;
    case 'miss':
      note(587, 0, 0.3, 'sine', 0.12, 392);
      break;
    case 'angry':
      note(160, 0, 0.18, 'sawtooth', 0.16);
      note(150, 0.04, 0.2, 'sawtooth', 0.14);
      break;
    case 'lock':
      note(120, 0, 0.4, 'sawtooth', 0.18);
      note(116, 0, 0.4, 'square', 0.08);
      break;
    case 'wrong':
      note(200, 0, 0.12, 'sawtooth', 0.14, 140);
      break;
    case 'success':
    case 'makeup': {
      const seq = [523, 659, 784, 1047];
      seq.forEach((f, i) => note(f, i * 0.09, 0.22, 'sine', 0.16));
      break;
    }
    case 'mega': {
      const seq = [523, 659, 784, 1047, 1319];
      seq.forEach((f, i) => note(f, i * 0.06, 0.3, 'triangle', 0.16));
      break;
    }
  }
  if (name === 'send' && combo >= 2) {
    const base = 600 + combo * 40;
    note(base, 0.12, 0.1, 'triangle', 0.12);
  }
}

/* ---- continuous: charge tone while holding ---- */
let chargeOsc: OscillatorOscillatorPair | null = null;
type OscillatorOscillatorPair = { osc: OscillatorNode; gain: GainNode };

export function startCharge() {
  if (muted) return;
  const c = ac();
  if (!c || chargeOsc) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 2.4);
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 0.1);
  osc.connect(gain).connect(c.destination);
  osc.start();
  chargeOsc = { osc, gain };
}
export function stopCharge() {
  const c = ac();
  if (!c || !chargeOsc) return;
  const { osc, gain } = chargeOsc;
  chargeOsc = null;
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.08);
  osc.stop(c.currentTime + 0.12);
}

/* ---- continuous: synced heartbeat while holding hands ---- */
let heartTimer: ReturnType<typeof setInterval> | null = null;
export function startHeartbeat() {
  if (muted || heartTimer) return;
  const beat = () => {
    note(72, 0, 0.16, 'sine', 0.22);
    note(64, 0.18, 0.2, 'sine', 0.2);
  };
  beat();
  heartTimer = setInterval(beat, 1000);
}
export function stopHeartbeat() {
  if (heartTimer) {
    clearInterval(heartTimer);
    heartTimer = null;
  }
}
