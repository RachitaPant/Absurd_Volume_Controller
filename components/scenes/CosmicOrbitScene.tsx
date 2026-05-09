"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { SceneShell } from "./SceneShell";
import { Sun } from "./cosmic-orbit/Sun";
import { Planet } from "./cosmic-orbit/Planet";
import { Stars } from "./cosmic-orbit/Stars";
import { Comet } from "./cosmic-orbit/Comet";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { useBhaiStore } from "@/lib/state/use-bhai-store";
import { PLANET_CHARS } from "@/lib/copy/planets";
import { easings } from "@/lib/utils/easings";
import { play } from "@/lib/audio/presets";

const ACCENT = "#7C5CFF";

// Five planets = five EQ bands = five employees
const PLANETS = [
  { band: 0, base: 1.45, speed: 0.42, size: 0.16, initialAngle: 0.6 },
  { band: 1, base: 2.05, speed: -0.32, size: 0.14, initialAngle: 2.1 },
  { band: 2, base: 2.7,  speed: 0.24,  size: 0.18, initialAngle: 4.3 },
  { band: 3, base: 3.4,  speed: -0.18, size: 0.12, initialAngle: 5.8 },
  { band: 4, base: 4.15, speed: 0.14,  size: 0.13, initialAngle: 1.2 },
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
  const selectedPlanet = useBhaiStore((s) => s.selectedPlanet);
  const setSelectedPlanet = useBhaiStore((s) => s.setSelectedPlanet);
  const planetsPaused = useBhaiStore((s) => s.planetsPaused);
  const pawriActive = useBhaiStore((s) => s.pawriActive);
  const rawScreamLevel = useVolumeStore((s) => s.rawScreamLevel);
  const lastUpdate = useRef<number[]>([0, 0, 0, 0, 0]);
  const dragStatusCooldown = useRef<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    setSceneAccent(ACCENT);
  }, [setSceneAccent]);

  const onPlanetRadius = useCallback(
    (band: 0 | 1 | 2 | 3 | 4) => (r: number, baseR: number) => {
      const now = performance.now();
      if (now - lastUpdate.current[band] < 33) return;
      lastUpdate.current[band] = now;
      setBand(band, radiusToGainDb(r, baseR));

      if (r < 0.55) {
        if (useEasterEggStore.getState().unlock("supernova")) {
          pushToast({
            text: "KERNEL_PANIC: VOLUME EXCEEDED THERMAL ENVELOPE",
            flavor: "warn",
          });
        }
      }
    },
    [setBand, pushToast],
  );

  const onPlanetDragStart = useCallback(
    (band: 0 | 1 | 2 | 3 | 4) => () => {
      const now = performance.now();
      if (now - dragStatusCooldown.current[band] < 8000) return;
      dragStatusCooldown.current[band] = now;
      const char = PLANET_CHARS[band];
      const statuses = char.dragReplies as readonly string[];
      const msg = statuses[Math.floor(Math.random() * statuses.length)];
      // Increment Sharma Sir counter since user did something
      useBhaiStore.getState().incrementSharma();
      pushToast({ text: msg, flavor: "info" });
      play("tabla", 0.3);
    },
    [pushToast],
  );

  const onPlanetClick = useCallback(
    (band: 0 | 1 | 2 | 3 | 4) => () => {
      const current = useBhaiStore.getState().selectedPlanet;
      if (current === band) {
        setSelectedPlanet(null);
      } else {
        setSelectedPlanet(band);
        pushToast({
          text: `${PLANET_CHARS[band].name} selected. Hold mic button and yell.`,
          flavor: "info",
        });
      }
    },
    [setSelectedPlanet, pushToast],
  );

  // When yelling at a selected planet: it says its shrink reply
  const yellAtCooldown = useRef(0);
  useEffect(() => {
    if (selectedPlanet === null) return;
    if (rawScreamLevel < 0.08) return;
    const now = performance.now();
    if (now - yellAtCooldown.current < 4000) return;
    yellAtCooldown.current = now;
    const char = PLANET_CHARS[selectedPlanet];
    pushToast({ text: `${char.name}: "${char.shrinkReply}"`, flavor: "diary" });
    play("tabla", 0.25);
  }, [rawScreamLevel, selectedPlanet, pushToast]);

  // Disco ball accent colors during pawri mode
  const discoColors = ["#FF6464", "#FFC15B", "#7CFFB2", "#5CE5FF", "#C57CFF"];
  const getColor = (i: number) =>
    pawriActive
      ? discoColors[(i + Math.floor(Date.now() / 200)) % discoColors.length]
      : PLANET_CHARS[i].color;

  return (
    <SceneShell>
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
          {PLANETS.map((p, i) => (
            <Planet
              key={p.band}
              bandIndex={p.band as 0 | 1 | 2 | 3 | 4}
              baseRadius={p.base}
              angularSpeed={pawriActive ? p.speed * 2.8 : p.speed}
              size={p.size}
              color={getColor(i)}
              initialAngle={p.initialAngle}
              bandLabel={PLANET_CHARS[i].band}
              onRadiusChange={onPlanetRadius(p.band as 0 | 1 | 2 | 3 | 4)}
              onDragStart={onPlanetDragStart(p.band as 0 | 1 | 2 | 3 | 4)}
              onPlanetClick={onPlanetClick(p.band as 0 | 1 | 2 | 3 | 4)}
              isSelected={selectedPlanet === p.band}
              shrinkFactor={
                selectedPlanet === p.band && rawScreamLevel > 0.08
                  ? Math.max(0.45, 1 - rawScreamLevel * 0.6)
                  : 1
              }
              paused={planetsPaused}
            />
          ))}
          <Comet />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={pawriActive ? 2.2 : 0.95}
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

      {/* Title strip */}
      <motion.div
        className="absolute top-[19%] inset-x-0 flex flex-col items-center text-center pointer-events-none"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: easings.cinematic }}
      >
        <div className="hud text-bone/35 tracking-[0.4em] text-[9px]">
          BHAI BHAI ENTERPRISES PVT. LTD. — SOLAR SYSTEM OPERATIONS
        </div>
        <div className="font-display italic text-2xl md:text-3xl text-bone mt-1">
          {pawriActive ? (
            <span style={{ color: "#FF6464" }}>pawri ho rahi hai 🎉</span>
          ) : (
            <>
              managing volume for{" "}
              <span style={{ color: ACCENT }}>4.6 billion years</span>
            </>
          )}
        </div>
        <div className="hud text-bone/30 mt-2 text-[10px]">
          drag a planet to adjust its EQ band · click a planet then yell to manage it
        </div>
      </motion.div>

      {/* EQ band readout — character names + dB values */}
      <motion.div
        className="absolute bottom-[26%] left-1/2 -translate-x-1/2 flex gap-5 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: 1.0, duration: 0.7 }}
      >
        {PLANETS.map((p, i) => (
          <CharBandReadout
            key={p.band}
            index={p.band}
            char={PLANET_CHARS[i]}
            isSelected={selectedPlanet === p.band}
          />
        ))}
      </motion.div>
    </SceneShell>
  );
}

function CharBandReadout({
  index,
  char,
  isSelected,
}: {
  index: number;
  char: (typeof PLANET_CHARS)[number];
  isSelected: boolean;
}) {
  const db = useVolumeStore((s) => s.bands[index]);
  return (
    <div
      className="flex flex-col items-center min-w-[3.8rem] cursor-pointer"
      style={{ opacity: isSelected ? 1 : 0.7 }}
    >
      <div
        className="w-9 h-9 rounded-full border flex items-center justify-center text-base"
        style={{
          borderColor: char.color,
          background: isSelected
            ? `radial-gradient(circle, ${char.color}44 0%, transparent 70%)`
            : undefined,
          boxShadow: isSelected ? `0 0 12px ${char.color}88` : undefined,
        }}
      >
        {char.emoji}
      </div>
      <div
        className="hud text-[9px] uppercase tracking-[0.14em] mt-1"
        style={{ color: char.color }}
      >
        {char.name.split(" ")[0]}
      </div>
      <div className="hud text-bone/55 text-[9px] mt-0.5">
        {db > 0 ? "+" : ""}
        {db.toFixed(1)} dB
      </div>
    </div>
  );
}
