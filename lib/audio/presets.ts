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
  | "achievement";

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

function whiteNoise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const rate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, rate * seconds, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}
