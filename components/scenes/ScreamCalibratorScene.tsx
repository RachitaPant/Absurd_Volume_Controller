"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneShell } from "./SceneShell";
import { useDecibels } from "@/lib/hooks/use-decibels";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";
import { easings } from "@/lib/utils/easings";

const ACCENT = "#F26B3A";

export default function ScreamCalibratorScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const setGodMode = useVolumeStore((s) => s.setGodMode);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);

  const [granted, setGranted] = useState(false);
  const decibels = useDecibels(granted);

  const screamStartRef = useRef<number | null>(null);
  const lastInputAtRef = useRef(0);
  const silentToastedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // initialize lastInputAt once the component has mounted, not during render
  useEffect(() => {
    lastInputAtRef.current = performance.now();
  }, []);

  useEffect(() => setSceneAccent(ACCENT), [setSceneAccent]);

  // Map mic level → master volume.
  // - Level > 0.04: shouting → push volume up
  // - Level < 0.01: silence → drift to default 23
  useEffect(() => {
    if (!granted) return;
    const id = window.setInterval(() => {
      const lvl = decibels.level;
      const cur = useVolumeStore.getState().master;
      if (lvl > 0.04) {
        const tgt = Math.min(120, 30 + lvl * 320);
        setMaster(cur + (tgt - cur) * 0.18);
        lastInputAtRef.current = performance.now();
        silentToastedRef.current = false;
        // Sustained scream → GOD MODE
        if (lvl > 0.18) {
          if (screamStartRef.current === null) {
            screamStartRef.current = performance.now();
          } else if (performance.now() - screamStartRef.current > 4000) {
            if (unlock("scream-king")) {
              pushToast({
                text: "GOD MODE conferred upon the screamer.",
                flavor: "achievement",
              });
              setGodMode(true);
              play("ascend", 0.8);
            }
            screamStartRef.current = null;
          }
        } else {
          screamStartRef.current = null;
        }
      } else if (lvl < 0.012) {
        // drift to default
        setMaster(cur + (23 - cur) * 0.04);
        if (
          performance.now() - lastInputAtRef.current > 10_000 &&
          !silentToastedRef.current
        ) {
          silentToastedRef.current = true;
          pushToast({
            text: "speak up. we can't hear your art.",
            flavor: "warn",
          });
        }
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [granted, decibels.level, setMaster, setGodMode, pushToast, unlock]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !decibels.waveform) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * 2) canvas.width = w * 2;
    if (canvas.height !== h * 2) canvas.height = h * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = ACCENT;
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    const buf = decibels.waveform;
    const step = Math.floor(buf.length / w);
    for (let x = 0; x < w; x++) {
      const v = (buf[x * step] - 128) / 128;
      const y = h / 2 + v * h * 0.4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [decibels.waveform]);

  return (
    <SceneShell>
      {/* permission UI */}
      <AnimatePresence>
        {!granted && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center max-w-[36rem] px-6">
              <div className="hud text-bone/40 tracking-[0.4em] mb-4">
                CALIBRATION REQUEST
              </div>
              <div className="font-display italic text-bone text-3xl md:text-4xl mb-6">
                we require access to your <span style={{ color: ACCENT }}>voice</span>.
              </div>
              <p className="hud text-bone/55 mb-8 leading-relaxed">
                a microphone permission prompt will appear. nothing leaves
                this tab. nothing is recorded. we just need to hear you
                committing to the bit.
              </p>
              <button
                className="px-6 py-3 rounded-full font-bold tracking-[0.2em] uppercase border border-bone/30 hover:bg-bone/5"
                style={{ color: "#fff" }}
                onClick={() => setGranted(true)}
              >
                grant the volume council audience
              </button>
              {decibels.error && (
                <div className="hud text-[var(--accent)] mt-6">
                  microphone refused: {decibels.error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* main scene once granted */}
      {granted && (
        <>
          <motion.div
            className="absolute top-[12%] inset-x-0 flex flex-col items-center text-center px-6 pointer-events-none"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: easings.cinematic }}
          >
            <div className="hud text-bone/40">CURRENTLY</div>
            <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
              calibrating by <span style={{ color: ACCENT }}>scream</span>
            </div>
            <div className="hud text-bone/40 mt-3 max-w-[42rem] mx-auto leading-relaxed">
              your voice is the volume now. yell to climb. whisper to fall.
              silence drifts you back to twenty-three.
            </div>
          </motion.div>

          {/* mic level meter */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hud text-bone/55 pointer-events-none">
            <div className="w-3 h-64 bg-bone/10 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute bottom-0 inset-x-0 rounded-full"
                style={{ background: ACCENT }}
                animate={{ height: `${Math.min(100, decibels.level * 600)}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
            <div className="tnum text-bone mt-2">
              {Math.round(decibels.level * 1000) / 10}
            </div>
          </div>

          {/* waveform */}
          <canvas
            ref={canvasRef}
            className="absolute inset-x-0 bottom-[16%] mx-auto pointer-events-none"
            style={{ width: "min(80vw, 720px)", height: 100 }}
          />
        </>
      )}
    </SceneShell>
  );
}
