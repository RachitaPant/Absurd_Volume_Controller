"use client";

import { useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { MasterKnob } from "./MasterKnob";
import { KnobFace } from "./KnobFace";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { easings } from "@/lib/utils/easings";

// The master knob lives at the page level. Most scenes want it dead-center
// (it IS the scene); a few scenes have a more important central element
// (boss boss, mic permission button, hourglass column, lever, marble) — for
// those we shrink the knob and dock it to the upper-right so it never
// covers narrative copy or modals.
type Layout = {
  size: number;
  centered: boolean;
  hidden?: boolean;
};

function layoutForScene(
  scene: ReturnType<typeof useSceneStore.getState>["scene"],
  vmin: number,
): Layout {
  const centerSize = Math.min(420, Math.max(260, Math.round(vmin * 0.45)));
  const dockedSize = Math.min(180, Math.max(132, Math.round(vmin * 0.22)));
  switch (scene) {
    case "cursed-knob":
    case "cosmic-orbit":
      return { size: centerSize, centered: true };
    case "boss-battle":
    case "scream-calibrator":
      // The scene fully takes over the volume metaphor. Knob hides.
      return { size: dockedSize, centered: false, hidden: true };
    case "black-hole":
    case "liquid-reactor":
    case "medieval-lever":
    case "forbidden-button":
      return { size: dockedSize, centered: false };
    default:
      return { size: centerSize, centered: true };
  }
}

export function PersistentKnob() {
  const scene = useSceneStore((s) => s.scene);
  const emotion = useVolumeStore((s) => s.emotionalState);
  const vmin = useViewportMin();
  const layout = layoutForScene(scene, vmin);

  if (layout.hidden) return null;

  const face =
    scene === "cursed-knob" ? (
      <KnobFace emotion={emotion} size={Math.round(layout.size * 0.4)} />
    ) : null;

  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      animate={
        layout.centered
          ? {
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "calc(-50% + 2vh)",
            }
          : {
              top: 96,
              right: 24,
              left: "auto",
              x: 0,
              y: 0,
            }
      }
      transition={{ duration: 0.9, ease: easings.cinematic }}
    >
      <motion.div
        className="pointer-events-auto"
        animate={{ width: layout.size, height: layout.size }}
        transition={{ duration: 0.9, ease: easings.cinematic }}
      >
        <MasterKnob face={face} size={layout.size} />
      </motion.div>
    </motion.div>
  );
}

function useViewportMin() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => Math.min(window.innerWidth, window.innerHeight),
    () => 800,
  );
}
