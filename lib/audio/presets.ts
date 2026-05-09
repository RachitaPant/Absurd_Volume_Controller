// Synthesized one-shots. Built and disposed each time. No sample files.

import { getAudioEngine } from "./audio-engine";

export type PresetName =
  | "knob-tick"
  | "knob-snap"
  | "swoosh"
  | "shimmer"
  | "thud"
  | "ping"
  | "ascend"
  | "descend"
  | "buzz"
  | "snore"
  | "yawn"
  | "supernova"
  | "glass-shatter"
  | "achievement"
  | "tabla"
  | "dholak"
  | "shehnai"
  | "whatsapp-thunk"
  | "printer-brrr"
  | "dholak-loop";

export function play(preset: PresetName, gain = 1) {
  const engine = getAudioEngine();
  const ctx = engine.context();
  if (!ctx) return;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = gain * 0.6;
  // Route through the engine's analyser so the on-screen TV picks up
  // every SFX, not just the procedural pad.
  out.connect(engine.output());
  switch (preset) {
    case "knob-tick":
      tick(ctx, out, now);
      break;
    case "knob-snap":
      snap(ctx, out, now);
      break;
    case "swoosh":
      swoosh(ctx, out, now);
      break;
    case "shimmer":
      shimmer(ctx, out, now);
      break;
    case "thud":
      thud(ctx, out, now);
      break;
    case "ping":
      ping(ctx, out, now, 880);
      break;
    case "ascend":
      arpeggio(ctx, out, now, [440, 554.37, 659.25, 880]);
      break;
    case "descend":
      arpeggio(ctx, out, now, [880, 659.25, 554.37, 440]);
      break;
    case "buzz":
      buzz(ctx, out, now);
      break;
    case "snore":
      snore(ctx, out, now);
      break;
    case "yawn":
      yawn(ctx, out, now);
      break;
    case "supernova":
      supernova(ctx, out, now);
      break;
    case "glass-shatter":
      glass(ctx, out, now);
      break;
    case "achievement":
      arpeggio(ctx, out, now, [523.25, 659.25, 783.99, 1046.5], 0.06);
      break;
    case "tabla":
      tabla(ctx, out, now);
      break;
    case "dholak":
      dholak(ctx, out, now);
      break;
    case "shehnai":
      shehnai(ctx, out, now);
      break;
    case "whatsapp-thunk":
      whatsappThunk(ctx, out, now);
      break;
    case "printer-brrr":
      printerBrrr(ctx, out, now);
      break;
    case "dholak-loop":
      dholakLoop(ctx, out, now);
      break;
  }
}

function tick(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(2200, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.04);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.06);
}

function snap(ctx: AudioContext, out: GainNode, t: number) {
  const noise = whiteNoise(ctx, 0.06);
  const bp = ctx.createBiquadFilter();
  bp.type = "highpass";
  bp.frequency.value = 1200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  noise.connect(bp).connect(g).connect(out);
  noise.start(t);
}

function swoosh(ctx: AudioContext, out: GainNode, t: number) {
  const noise = whiteNoise(ctx, 0.7);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1;
  bp.frequency.setValueAtTime(200, t);
  bp.frequency.exponentialRampToValueAtTime(4000, t + 0.6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  noise.connect(bp).connect(g).connect(out);
  noise.start(t);
}

function shimmer(ctx: AudioContext, out: GainNode, t: number) {
  [1318.5, 1760, 2349.3, 2637].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.04 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 0.6);
    o.connect(g).connect(out);
    o.start(t + i * 0.04);
    o.stop(t + i * 0.04 + 0.7);
  });
}

function thud(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.3);
}

function ping(ctx: AudioContext, out: GainNode, t: number, freq: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.5);
}

function arpeggio(
  ctx: AudioContext,
  out: GainNode,
  t: number,
  freqs: number[],
  step = 0.08,
) {
  freqs.forEach((f, i) => ping(ctx, out, t + i * step, f));
}

function buzz(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.value = 110;
  g.gain.setValueAtTime(0.001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.5);
}

function snore(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(80, t);
  o.frequency.linearRampToValueAtTime(140, t + 0.4);
  o.frequency.linearRampToValueAtTime(80, t + 0.9);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.18, t + 0.4);
  g.gain.linearRampToValueAtTime(0.001, t + 0.9);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 1);
}

function yawn(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(180, t);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.6);
  f.type = "lowpass";
  f.frequency.setValueAtTime(800, t);
  f.frequency.exponentialRampToValueAtTime(280, t + 0.6);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.2);
  g.gain.linearRampToValueAtTime(0.001, t + 0.7);
  o.connect(f).connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.8);
}

function supernova(ctx: AudioContext, out: GainNode, t: number) {
  const noise = whiteNoise(ctx, 1.5);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.4;
  bp.frequency.setValueAtTime(80, t);
  bp.frequency.exponentialRampToValueAtTime(8000, t + 0.6);
  bp.frequency.exponentialRampToValueAtTime(60, t + 1.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.7, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
  noise.connect(bp).connect(g).connect(out);
  noise.start(t);
}

function glass(ctx: AudioContext, out: GainNode, t: number) {
  // burst then several pings
  const noise = whiteNoise(ctx, 0.4);
  const bp = ctx.createBiquadFilter();
  bp.type = "highpass";
  bp.frequency.value = 3000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(bp).connect(g).connect(out);
  noise.start(t);
  [3200, 4400, 5300, 6800].forEach((f, i) => ping(ctx, out, t + 0.04 * i, f));
}

// ─── Indian office SFX ────────────────────────────────────────────────────────

// Tabla: sharp resonant hit around 160 Hz — bayan + dayan mixed
function tabla(ctx: AudioContext, out: GainNode, t: number) {
  // dayan (high drum) — sine pitch drop
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(310, t);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.06);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.7, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.2);
  // bayan (bass drum) — low thud
  const o2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  o2.type = "sine";
  o2.frequency.setValueAtTime(90, t);
  o2.frequency.exponentialRampToValueAtTime(50, t + 0.12);
  g2.gain.setValueAtTime(0.0001, t);
  g2.gain.exponentialRampToValueAtTime(0.45, t + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o2.connect(g2).connect(out);
  o2.start(t); o2.stop(t + 0.18);
}

// Dholak: deeper double-headed drum, more resonant
function dholak(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(60, t + 0.22);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.65, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + 0.32);
  // noise smack
  const noise = whiteNoise(ctx, 0.08);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 800;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.35, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  noise.connect(hp).connect(ng).connect(out);
  noise.start(t);
}

// Shehnai: nasal reed instrument — sawtooth with vibrato and bandpass
function shehnai(ctx: AudioContext, out: GainNode, t: number) {
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  const bp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.value = 523.25; // C5
  lfo.type = "sine";
  lfo.frequency.value = 5.8;
  lfoG.gain.value = 8;
  bp.type = "bandpass";
  bp.frequency.value = 1400;
  bp.Q.value = 4;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.28, t + 0.14);
  g.gain.linearRampToValueAtTime(0.22, t + 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  lfo.connect(lfoG).connect(o.frequency);
  o.connect(bp).connect(g).connect(out);
  lfo.start(t); o.start(t);
  lfo.stop(t + 1.2); o.stop(t + 1.2);
}

// WhatsApp notification: two-tone ascending ping (iconic green sound)
function whatsappThunk(ctx: AudioContext, out: GainNode, t: number) {
  ping(ctx, out, t, 880);
  ping(ctx, out, t + 0.11, 1174.66);
}

// Thermal printer: AM-modulated noise burst
function printerBrrr(ctx: AudioContext, out: GainNode, t: number) {
  const noise = whiteNoise(ctx, 1.6);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2400;
  bp.Q.value = 0.8;
  // amplitude modulation via LFO simulating print head back-and-forth
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  const g = ctx.createGain();
  lfo.type = "square";
  lfo.frequency.value = 22;
  lfoG.gain.value = 0.22;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.1);
  g.gain.setValueAtTime(0.3, t + 1.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.55);
  lfo.connect(lfoG).connect(g.gain);
  noise.connect(bp).connect(g).connect(out);
  lfo.start(t); noise.start(t);
  lfo.stop(t + 1.6);
}

// Dholak rhythm loop: ~8s of dhol-tasa pattern for pawri mode
function dholakLoop(ctx: AudioContext, out: GainNode, t: number) {
  // pattern: KICK-snare-kick-KICK-snare (folk dholak rhythm)
  const beats = [
    { dt: 0,    fn: dholak, v: 1.0 },
    { dt: 0.2,  fn: tabla,  v: 0.6 },
    { dt: 0.4,  fn: dholak, v: 0.8 },
    { dt: 0.6,  fn: dholak, v: 1.0 },
    { dt: 0.8,  fn: tabla,  v: 0.6 },
    { dt: 1.0,  fn: dholak, v: 0.7 },
    { dt: 1.1,  fn: tabla,  v: 0.4 },
    { dt: 1.2,  fn: dholak, v: 0.9 },
  ];
  const loopDuration = 1.4;
  const totalLoops = Math.floor(8 / loopDuration);
  for (let i = 0; i < totalLoops; i++) {
    for (const beat of beats) {
      const beatOut = ctx.createGain();
      beatOut.gain.value = beat.v * 0.55;
      beatOut.connect(out);
      beat.fn(ctx, beatOut, t + i * loopDuration + beat.dt);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

function whiteNoise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, rate * seconds, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}
