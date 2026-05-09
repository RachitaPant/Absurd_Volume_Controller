"use client";

import { useEffect } from "react";
import { getAudioEngine, PROFILES } from "@/lib/audio/audio-engine";
import { useVolumeStore } from "@/lib/state/use-volume-store";

// Subscribes the AudioEngine to volume/mute/bands stores.
// Single scene means the pad is always the cosmicOrbit profile.
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
    return () => {
      unsubMaster();
      unsubMute();
      unsubBands();
    };
  }, []);
}

export { PROFILES };
