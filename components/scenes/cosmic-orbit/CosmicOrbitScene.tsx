"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { SceneShell } from "../SceneShell";
import { Sun } from "./Sun";
import { Planet } from "./Planet";
import { Stars } from "./Stars";
import { Comet } from "./Comet";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { easings } from "@/lib/utils/easings";

const ACCENT = "#7C5CFF";

// Planet definitions: orbital radius, speed, color, label, base angle.
// Mapped 1:1 to the five EQ bands.
const PLANETS = [
  { band: 0, base: 1.45, speed: 0.42, size: 0.16, color: "#FF6464", angle: 0.6, label: "low" },
  { band: 1, base: 2.05, speed: -0.32, size: 0.14, color: "#FFC15B", angle: 2.1, label: "lo-mid" },
  { band: 2, base: 2.7, speed: 0.24, size: 0.18, color: "#7CFFB2", angle: 4.3, label: "mid" },
  { band: 3, base: 3.4, speed: -0.18, size: 0.12, color: "#5CE5FF", angle: 5.8, label: "hi-mid" },
  { band: 4, base: 4.15, speed: 0.14, size: 0.13, color: "#C57CFF", angle: 1.2, label: "high" },
] as const;

function radiusToGainDb(r: number, base: number) {
  const span = 2;
  return Math.max(-12, Math.min(12, ((base - r) / span) * 12));
}

export default function CosmicOrbitScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setBand = useVolumeStore((s) => s.setBand);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const lastUpdate = useRef<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    setSceneAccent(ACCENT);
  }, [setSceneAccent]);

  // Throttle band writes to ~30Hz to keep the store quiet.
  const onPlanetRadius = (band: 0 | 1 | 2 | 3 | 4) => (r: number, baseR: number) => {
    const now = performance.now();
    if (now - lastUpdate.current[band] < 33) return;
    lastUpdate.current[band] = now;
    setBand(band, radiusToGainDb(r, baseR));

    // BSOD easter egg: a planet in the sun's mouth.
    if (r < 0.55) {
      if (useEasterEggStore.getState().unlock("supernova")) {
        pushToast({
          text: "KERNEL_PANIC: VOLUME EXCEEDED THERMAL ENVELOPE",
          flavor: "warn",
        });
      }
    }
  };

  return (
    <SceneShell>
      {/* WebGL plate behind the knob */}
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 8], fov: 55 }}
        style={{ position: "absolute", inset: 0 }}
        frameloop="always"
      >
        <ambientLight intensity={0.18} />
        <Suspense fallback={null}>
          <Stars />
          <Sun accentColor={ACCENT} />
          {PLANETS.map((p) => (
            <Planet
              key={p.band}
              bandIndex={p.band as 0 | 1 | 2 | 3 | 4}
              baseRadius={p.base}
              angularSpeed={p.speed}
              size={p.size}
              color={p.color}
              initialAngle={p.angle}
              bandLabel={p.label}
              onRadiusChange={onPlanetRadius(p.band as 0 | 1 | 2 | 3 | 4)}
            />
          ))}
          <Comet />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.95}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.6}
            mipmapBlur
          />
          <ChromaticAberration
            offset={new Vector2(0.0009, 0.0014)}
            radialModulation={false}
            modulationOffset={0}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.85} />
        </EffectComposer>
      </Canvas>

      {/* Title strip — same vertical anchor as cursed knob */}
      <motion.div
        className="absolute top-[12%] inset-x-0 flex flex-col items-center text-center pointer-events-none"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: easings.cinematic }}
      >
        <div className="hud text-bone/40">CURRENTLY</div>
        <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
          drifting in <span style={{ color: ACCENT }}>orbital concordance</span>
        </div>
        <div className="hud text-bone/35 mt-3 max-w-[40rem] mx-auto leading-relaxed">
          drag a planet — its distance from the sun is its eq band&apos;s gain.
          comets pass occasionally. step softly.
        </div>
      </motion.div>

      {/* the knob is rendered persistently by PersistentKnob at the page
          level. it just sits at the orbital center while the scene
          changes around it. */}

      {/* EQ band readout strip */}
      <motion.div
        className="absolute bottom-[26%] left-1/2 -translate-x-1/2 flex gap-6 hud text-bone/55 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: 1.0, duration: 0.7 }}
      >
        {PLANETS.map((p) => (
          <BandReadout key={p.band} index={p.band} label={p.label} color={p.color} />
        ))}
      </motion.div>
    </SceneShell>
  );
}

function BandReadout({ index, label, color }: { index: number; label: string; color: string }) {
  const db = useVolumeStore((s) => s.bands[index]);
  return (
    <div className="flex flex-col items-center min-w-[3.5rem]">
      <div className="w-10 h-10 rounded-full border" style={{ borderColor: color }}>
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            opacity: 0.18 + Math.abs(db) / 24,
          }}
        />
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] mt-1 text-bone/50">{label}</div>
      <div className="tnum text-bone/70 text-xs mt-0.5">
        {db > 0 ? "+" : ""}
        {db.toFixed(1)} dB
      </div>
    </div>
  );
}
