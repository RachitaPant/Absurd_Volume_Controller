// Singleton wrapper around the Web Audio graph. Created on first user gesture
// because browsers refuse to make sound otherwise. The displayed volume can
// climb to absurd numbers; the underlying GainNode is HARD-CLAMPED to 1.0 so
// no one's eardrums get sued.

export type AnalyserHandle = {
  analyser: AnalyserNode;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
};

const BAND_FREQS = [80, 250, 800, 2500, 8000] as const;
type BandIndex = 0 | 1 | 2 | 3 | 4;

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bands: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private convolver: ConvolverNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private waveshaper: WaveShaperNode | null = null;
  private padNodes: { stop: () => void } | null = null;

  // The displayed volume is theatre. Real gain stays inside this clamp so the
  // app cannot, in fact, deafen anyone.
  private readonly REAL_GAIN_CEILING = 0.85;

  private padStarted = false;
  private muted = false;
  private displayVolume = 23; // matches the "default mood" from the spec

  init(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor =
      typeof window !== "undefined"
        ? (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)
        : null;
    if (!Ctor) throw new Error("AudioContext unavailable");
    this.ctx = new Ctor();
    this.buildGraph();
    return this.ctx;
  }

  private buildGraph() {
    const ctx = this.ctx!;
    // master gain -> 5 EQ bands (in series) -> waveshaper -> convolver (wet/dry) -> compressor -> analyser -> destination
    this.master = ctx.createGain();
    this.master.gain.value = 0;

    this.bands = BAND_FREQS.map((freq, i) => {
      const f = ctx.createBiquadFilter();
      f.type = i === 0 ? "lowshelf" : i === 4 ? "highshelf" : "peaking";
      f.frequency.value = freq;
      f.Q.value = 1.1;
      f.gain.value = 0;
      return f;
    });

    this.waveshaper = ctx.createWaveShaper();
    this.waveshaper.curve = makeDistortionCurve(0); // identity for now
    this.waveshaper.oversample = "2x";

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = makeImpulseResponse(ctx, 2.4, 2.6);

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.78;

    // wire master -> band chain
    let node: AudioNode = this.master;
    for (const b of this.bands) {
      node.connect(b);
      node = b;
    }
    // dry path
    const dry = ctx.createGain();
    dry.gain.value = 0.78;
    // wet path
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    node.connect(this.waveshaper);
    this.waveshaper.connect(dry);
    this.waveshaper.connect(this.convolver);
    this.convolver.connect(wet);

    dry.connect(this.compressor);
    wet.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(ctx.destination);
  }

  resume() {
    return this.ctx?.resume() ?? Promise.resolve();
  }

  isReady() {
    return this.ctx !== null;
  }

  context() {
    return this.ctx;
  }

  // displayed 0..200+ -> real 0..REAL_GAIN_CEILING
  // Curve is logarithmic-ish so the bottom feels expressive and the top
  // approaches ceiling but never crosses it.
  setDisplayVolume(v: number) {
    this.displayVolume = v;
    if (!this.ctx || !this.master) return;
    const real = displayToReal(v, this.muted, this.REAL_GAIN_CEILING);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(real, t + 0.06);

    // distortion intensifies above 100
    if (this.waveshaper) {
      const k = Math.max(0, Math.min(1, (v - 100) / 100));
      this.waveshaper.curve = makeDistortionCurve(k * 80);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const real = displayToReal(this.displayVolume, muted, this.REAL_GAIN_CEILING);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(real, t + 0.4);
  }

  setBand(i: BandIndex, db: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.bands[i].gain.cancelScheduledValues(t);
    this.bands[i].gain.linearRampToValueAtTime(db, t + 0.08);
  }

  getAnalyser(): AnalyserHandle | null {
    if (!this.analyser) return null;
    return {
      analyser: this.analyser,
      frequencyData: new Uint8Array(this.analyser.frequencyBinCount),
      timeData: new Uint8Array(this.analyser.frequencyBinCount),
    };
  }

  // Procedural ambient pad. Three detuned oscillators in a minor 9th-ish
  // voicing, slow LFO on filter cutoff. No samples touched.
  startPad() {
    if (this.padStarted || !this.ctx || !this.master) return;
    this.padStarted = true;
    const ctx = this.ctx;
    const dest = this.master;

    // rooted at A2
    const fundamentals = [55, 82.41, 130.81, 164.81, 196]; // A1, E2, C3, E3, G3
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 600;
    filt.Q.value = 0.7;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filt.frequency);
    lfo.start();

    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    padGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 4);

    fundamentals.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i % 2 ? "triangle" : "sawtooth";
      o.frequency.value = f;
      o.detune.value = (i - 2) * 7;
      g.gain.value = 0.08 + (i === 0 ? 0.12 : 0);
      o.connect(g);
      g.connect(filt);
      o.start();
      oscs.push(o);
      gains.push(g);
    });

    filt.connect(padGain);
    padGain.connect(dest);

    this.padNodes = {
      stop: () => {
        const t = ctx.currentTime;
        padGain.gain.cancelScheduledValues(t);
        padGain.gain.linearRampToValueAtTime(0, t + 0.4);
        oscs.forEach((o) => o.stop(t + 0.5));
        lfo.stop(t + 0.5);
      },
    };
  }

  stopPad() {
    this.padNodes?.stop();
    this.padNodes = null;
    this.padStarted = false;
  }
}

function displayToReal(displayed: number, muted: boolean, ceiling: number) {
  if (muted) return 0;
  const v = Math.max(-50, Math.min(displayed, 250));
  if (v <= 0) return 0;
  // Approx perceptual curve: log-ish with a hard ceiling.
  const norm = Math.min(v, 100) / 100;
  const base = Math.pow(norm, 1.7) * (ceiling * 0.85);
  // The "above 100" range adds a little more real gain but quickly asymptotes.
  const overflow = Math.max(0, v - 100);
  const extra = (1 - Math.exp(-overflow / 50)) * (ceiling - ceiling * 0.85);
  return Math.min(ceiling, base + extra);
}

function makeDistortionCurve(amount: number) {
  const n = 1024;
  const curve = new Float32Array(n);
  const k = amount;
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function makeImpulseResponse(ctx: AudioContext, seconds: number, decay: number) {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

let singleton: AudioEngineImpl | null = null;
export function getAudioEngine(): AudioEngineImpl {
  if (!singleton) singleton = new AudioEngineImpl();
  return singleton;
}

export type AudioEngine = AudioEngineImpl;
