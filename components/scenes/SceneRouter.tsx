"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { useSceneStore } from "@/lib/state/use-scene-store";

// Lazy-load every scene. The cosmic orbit alone pulls a few hundred KB of
// three.js — we only pay for it when the user picks it.
const CursedKnobScene = dynamic(
  () => import("./CursedKnobScene"),
  { ssr: false, loading: () => null },
);
const CosmicOrbitScene = dynamic(
  () => import("./cosmic-orbit/CosmicOrbitScene"),
  { ssr: false, loading: () => null },
);

export function SceneRouter() {
  const scene = useSceneStore((s) => s.scene);

  return (
    <AnimatePresence mode="sync">
      {scene === "cursed-knob" && <CursedKnobScene key="cursed-knob" />}
      {scene === "cosmic-orbit" && <CosmicOrbitScene key="cosmic-orbit" />}
    </AnimatePresence>
  );
}
