"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { useSceneStore } from "@/lib/state/use-scene-store";

// Lazy-load every scene. Three.js / shader bundles only ship when their
// scene is selected.
const CursedKnobScene = dynamic(() => import("./CursedKnobScene"), {
  ssr: false,
  loading: () => null,
});
const CosmicOrbitScene = dynamic(
  () => import("./cosmic-orbit/CosmicOrbitScene"),
  { ssr: false, loading: () => null },
);
const ForbiddenButtonScene = dynamic(() => import("./ForbiddenButtonScene"), {
  ssr: false,
  loading: () => null,
});
const BlackHoleScene = dynamic(() => import("./BlackHoleScene"), {
  ssr: false,
  loading: () => null,
});
const LiquidReactorScene = dynamic(() => import("./LiquidReactorScene"), {
  ssr: false,
  loading: () => null,
});
const MedievalLeverScene = dynamic(() => import("./MedievalLeverScene"), {
  ssr: false,
  loading: () => null,
});

export function SceneRouter() {
  const scene = useSceneStore((s) => s.scene);

  return (
    <AnimatePresence mode="sync">
      {scene === "cursed-knob" && <CursedKnobScene key="cursed-knob" />}
      {scene === "cosmic-orbit" && <CosmicOrbitScene key="cosmic-orbit" />}
      {scene === "forbidden-button" && <ForbiddenButtonScene key="forbidden-button" />}
      {scene === "black-hole" && <BlackHoleScene key="black-hole" />}
      {scene === "liquid-reactor" && <LiquidReactorScene key="liquid-reactor" />}
      {scene === "medieval-lever" && <MedievalLeverScene key="medieval-lever" />}
    </AnimatePresence>
  );
}
