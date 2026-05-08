"use client";

import { useEffect, useRef, useState } from "react";

export type DecibelState = {
  level: number;        // 0..1 normalized (rms)
  permitted: boolean;   // mic granted
  error: string | null;
  waveform: Uint8Array<ArrayBuffer> | null;
};

// getUserMedia + AnalyserNode → smoothed RMS. Returns a ref-like value object
// updated each frame. Caller is expected to read .current and dispatch into
// state on a throttled cadence to avoid 60fps re-renders.
export function useDecibels(active: boolean) {
  const [state, setState] = useState<DecibelState>({
    level: 0,
    permitted: false,
    error: null,
    waveform: null,
  });
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const emaRef = useRef(0);
  const lastEmitT = useRef(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia not supported");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctor();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        src.connect(analyser);
        analyserRef.current = analyser;
        bufRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        setState((s) => ({ ...s, permitted: true }));

        const tick = () => {
          if (cancelled) return;
          const buf = bufRef.current!;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          // EMA smoothing
          const alpha = 0.16;
          emaRef.current = emaRef.current * (1 - alpha) + rms * alpha;

          const now = performance.now();
          if (now - lastEmitT.current > 50) {
            lastEmitT.current = now;
            setState((s) => ({
              ...s,
              level: emaRef.current,
              waveform: buf.slice(),
            }));
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        setState((s) => ({ ...s, error: msg }));
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ctxRef.current?.close().catch(() => {});
      streamRef.current = null;
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [active]);

  return state;
}
