"use client";

import { useEffect } from "react";
import { getAudioEngine, profileForScene } from "@/lib/audio/audio-engine";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";

// Subscribes the AudioEngine to the stores. Mounts once at the root.
// Master volume → gain. Mute → ramp. Bands → filter EQ. Scene → pad profile
// (so each "channel" sounds different through the TV).
export function useAudioBridge() {
  useEffect(() => {
    const engine = getAudioEngine();
    const unsubMaster = useVolumeStore.subscribe(
      (s) => s.master,
      (v) => engine.setDisplayVolume(v),
    );
    const unsubMute = useVolumeStore.subscribe(
      (s) => s.isMuted,
      (m) => engine.setMuted(m),
    );
    const unsubBands = useVolumeStore.subscribe(
      (s) => s.bands,
      (bands) => bands.forEach((db, i) => engine.setBand(i as 0 | 1 | 2 | 3 | 4, db)),
    );
    const unsubScene = useSceneStore.subscribe((state, prev) => {
      if (state.scene !== prev?.scene) {
        engine.setMood(profileForScene(state.scene));
      }
    });
    return () => {
      unsubMaster();
      unsubMute();
      unsubBands();
      unsubScene();
    };
  }, []);
}
