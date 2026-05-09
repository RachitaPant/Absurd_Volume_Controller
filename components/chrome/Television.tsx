"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { play } from "@/lib/audio/presets";

// A persistent CRT in the corner. Live oscilloscope + frequency bars + VU
// meter, all driven by the engine's analyser. Volume number on the bezel,
// dial graphic that rotates with master, and a chassis tremor that grows
// as the volume climbs. The whole thing is draggable.
export function Television() {
  const screenRef = useRef<HTMLCanvasElement>(null);
  const vuRef = useRef<HTMLDivElement>(null);
  const tvRef = useRef<HTMLDivElement>(null);
  const audioReady = useSceneStore((s) => s.audioReady);
  const master = useVolumeStore((s) => s.master);
  const isMuted = useVolumeStore((s) => s.isMuted);
  const accent = useVolumeStore((s) => s.sceneAccent);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number; startX: number; startY: number } | null>(null);

  // Anchor in the bottom-left until the user drags it. queueMicrotask keeps
  // the React-19 set-state-in-effect lint quiet without changing semantics.
  useEffect(() => {
    if (pos !== null) return;
    queueMicrotask(() =>
      setPos({ x: 22, y: window.innerHeight - 240 }),
    );
  }, [pos]);

  // Drag the chassis around (only when grabbing the bezel header)
  useEffect(() => {
    const headerEl = tvRef.current?.querySelector<HTMLElement>("[data-tv-handle]");
    if (!headerEl) return;
    const onDown = (e: PointerEvent) => {
      if (!pos) return;
      dragRef.current = {
        ox: pos.x,
        oy: pos.y,
        startX: e.clientX,
        startY: e.clientY,
      };
      headerEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const nx = d.ox + (e.clientX - d.startX);
      const ny = d.oy + (e.clientY - d.startY);
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 220, nx)),
        y: Math.max(8, Math.min(window.innerHeight - 60, ny)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    headerEl.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      headerEl.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pos]);

  // Draw waveform + spectrum + VU on the screen
  useEffect(() => {
    if (!audioReady) return;
    const canvas = screenRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const handle = getAudioEngine().getAnalyser();
    if (!handle) return;
    let raf = 0;
    let peak = 0;

    const draw = () => {
      canvas.width = canvas.clientWidth * 2;
      canvas.height = canvas.clientHeight * 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(2, 2);
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      handle.analyser.getByteTimeDomainData(handle.timeData);
      handle.analyser.getByteFrequencyData(handle.frequencyData);

      // RMS for VU
      let sum = 0;
      for (let i = 0; i < handle.timeData.length; i++) {
        const v = (handle.timeData[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / handle.timeData.length);
      peak = Math.max(peak * 0.92, rms);
      if (vuRef.current) {
        vuRef.current.style.height = `${Math.min(100, peak * 600)}%`;
      }

      // CRT background — phosphor-tinted with vignette
      const bgGrad = ctx.createRadialGradient(cw / 2, ch / 2, 4, cw / 2, ch / 2, cw * 0.7);
      bgGrad.addColorStop(0, "#0c1410");
      bgGrad.addColorStop(1, "#000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cw, ch);

      // FREQUENCY BARS — bottom half
      const bands = 24;
      const binsPer = Math.floor(handle.frequencyData.length / bands);
      const barW = (cw - 8) / bands;
      for (let b = 0; b < bands; b++) {
        let avg = 0;
        for (let i = 0; i < binsPer; i++) avg += handle.frequencyData[b * binsPer + i];
        avg /= binsPer;
        const norm = avg / 255;
        const barH = norm * ch * 0.42;
        const x = 4 + b * barW;
        const y = ch - barH - 2;
        ctx.fillStyle = `${accent}cc`;
        ctx.fillRect(x + 1, y, barW - 2, barH);
        ctx.fillStyle = `${accent}44`;
        ctx.fillRect(x + 1, y - 2, barW - 2, 2);
      }

      // OSCILLOSCOPE — top half overlay
      ctx.strokeStyle = "#9CFF54";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "#9CFF54";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const wave = handle.timeData;
      const step = wave.length / cw;
      for (let x = 0; x < cw; x++) {
        const i = Math.floor(x * step);
        const v = (wave[i] - 128) / 128;
        const y = ch * 0.28 + v * ch * 0.18;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // SCANLINES
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      for (let y = 0; y < ch; y += 3) ctx.fillRect(0, y, cw, 1);

      // STATIC at high volume — speckle in
      const v = useVolumeStore.getState().master;
      if (v > 80) {
        const intensity = (v - 80) / 80;
        const dots = Math.floor(intensity * 80);
        ctx.fillStyle = "rgba(245,242,234,0.18)";
        for (let d = 0; d < dots; d++) {
          ctx.fillRect(Math.random() * cw, Math.random() * ch, 1, 1);
        }
      }

      // CHANNEL OVERLAY — top right
      ctx.fillStyle = "rgba(245,242,234,0.55)";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(isMuted ? "CH 00 — MUTED" : "CH 47 // LIVE", cw - 6, 14);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [audioReady, accent, isMuted]);

  if (!pos) return null;

  // Tremor scale = volume past 80, capped
  const tremor = Math.max(0, Math.min(1, (master - 80) / 80));
  const dialAngle = -135 + (Math.min(master, 200) / 100) * 270;

  return (
    <motion.div
      ref={tvRef}
      className="fixed z-30 pointer-events-auto select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: collapsed ? 168 : 280,
        transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}
      animate={{
        x: [0, tremor * 1.2, -tremor * 1.2, 0],
        y: [0, -tremor * 0.8, tremor * 0.8, 0],
      }}
      transition={{ duration: 0.18, repeat: Infinity, ease: "linear" }}
    >
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #c8b89a 0%, #8a7c66 30%, #5e5448 60%, #3a3328 100%)",
          boxShadow:
            "0 24px 60px -10px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.18), inset 0 -8px 24px rgba(0,0,0,0.45)",
          border: "1px solid #4a4338",
        }}
      >
        {/* antennas */}
        <div className="absolute -top-12 left-12 w-px h-12 bg-[#4a4338] rotate-[-18deg] origin-bottom" />
        <div className="absolute -top-12 right-14 w-px h-12 bg-[#4a4338] rotate-[18deg] origin-bottom" />
        <div className="absolute -top-12 left-12 w-1.5 h-1.5 rounded-full bg-[#7c6a4a]" />
        <div className="absolute -top-12 right-14 w-1.5 h-1.5 rounded-full bg-[#7c6a4a]" />

        {/* drag handle / brand strip */}
        <div
          data-tv-handle
          className="px-3 py-1.5 hud text-[#1c1612] flex items-center justify-between cursor-grab active:cursor-grabbing"
          style={{
            background:
              "linear-gradient(180deg, #d6c4a4, #b09872 40%, #8a7c66 100%)",
            borderBottom: "1px solid #2c241c",
            touchAction: "none",
          }}
        >
          <span className="tracking-[0.3em] text-[10px] font-bold">VOLUMETRON™</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
              play("knob-tick", 0.3);
            }}
            className="text-[10px] tracking-wider hover:opacity-70"
          >
            {collapsed ? "△ EXPAND" : "▽"}
          </button>
        </div>

        <div className="flex">
          {/* screen */}
          {!collapsed && (
            <div
              className="m-3 rounded-md overflow-hidden flex-1 relative"
              style={{
                background: "#000",
                boxShadow:
                  "inset 0 0 16px rgba(156,255,84,0.28), inset 0 0 50px rgba(0,0,0,0.7)",
                border: "2px solid #1a1a1a",
              }}
            >
              <canvas ref={screenRef} className="block w-full" style={{ height: 110 }} />
              {/* curvature overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.5) 100%)",
                }}
              />
            </div>
          )}

          {/* knob + VU panel */}
          <div className={`flex flex-col items-center gap-2 py-3 ${collapsed ? "px-3" : "pr-3"}`}>
            {/* dial */}
            <div className="relative w-12 h-12">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #6c6660, #2c2620 70%, #08080a)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.6)",
                  transform: `rotate(${dialAngle}deg)`,
                  transition: "transform 80ms linear",
                }}
              >
                <div
                  className="absolute left-1/2 top-1 w-[2px] h-3 rounded-full -translate-x-1/2"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
              </div>
            </div>

            {/* VU meter */}
            <div className="w-3 h-16 bg-black/80 rounded-sm overflow-hidden relative border border-[#4a4338]">
              <div ref={vuRef} className="absolute bottom-0 inset-x-0" style={{ background: accent, height: "0%", transition: "height 60ms linear" }} />
            </div>

            {/* readout */}
            <div className="hud text-[#1c1612] text-[9px] tnum tracking-[0.18em] mt-1">
              {isMuted ? "MUTE" : `${String(Math.round(master)).padStart(3, "0")}%`}
            </div>
          </div>
        </div>

        {/* speaker grille */}
        <div
          className="px-3 pb-3"
          aria-hidden
        >
          <div
            className="rounded-md py-2"
            style={{
              background:
                "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0 2px, rgba(0,0,0,0.18) 2px 5px)",
              border: "1px solid #2c241c",
            }}
          >
            <div className="text-center hud text-[#f5f2ea]/30 text-[9px] tracking-[0.4em]">
              ※ ※ ※
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
