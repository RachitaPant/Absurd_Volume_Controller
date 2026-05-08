"use client";

import { useSyncExternalStore } from "react";
import { MasterKnob } from "./MasterKnob";
import { KnobFace } from "./KnobFace";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";

// Master Knob lives at the page level so scenes can mount/unmount around it
// without disturbing the singleton. Each scene gets to influence it via
// state (sceneStore + volumeStore.emotionalState) but doesn't render its
// own copy — that fixed an exit-loop where layoutId kept the previous
// scene's knob alive forever.
export function PersistentKnob() {
  const scene = useSceneStore((s) => s.scene);
  const emotion = useVolumeStore((s) => s.emotionalState);
  const size = useKnobSize();

  const face = scene === "cursed-knob" ? <KnobFace emotion={emotion} size={Math.round(size * 0.4)} /> : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className="pointer-events-auto"
        style={{ transform: "translateY(2vh)" }}
      >
        <MasterKnob face={face} size={size} />
      </div>
    </div>
  );
}

function useKnobSize() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () =>
      Math.min(
        420,
        Math.max(
          260,
          Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.45),
        ),
      ),
    () => 360,
  );
}
