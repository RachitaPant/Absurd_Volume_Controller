"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAudioBridge } from "@/lib/hooks/use-audio-bridge";
import { AudioGate } from "@/components/AudioGate";
import { Intro } from "@/components/Intro";
import { BhaiBhaiDashboard } from "@/components/dashboard/BhaiBhaiDashboard";
import { HudCorner } from "@/components/chrome/HudCorner";
import { AchievementToasts } from "@/components/chrome/AchievementToasts";
import { OverloadOverlay } from "@/components/chrome/OverloadOverlay";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { getAudioEngine, PROFILES } from "@/lib/audio/audio-engine";
import { motion } from "motion/react";
import { easings } from "@/lib/utils/easings";

export default function Page() {
  useAudioBridge();
  const audioReady = useSceneStore((s) => s.audioReady);
  const introComplete = useSceneStore((s) => s.introComplete);
  const unlock = useEasterEggStore((s) => s.unlock);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Start the procedural pad on the cosmicOrbit profile once intro completes
  useEffect(() => {
    if (!introComplete || !audioReady) return;
    const e = getAudioEngine();
    if (e.isReady()) {
      e.startPad(PROFILES.cosmicOrbit);
    }
    if (unlock("first-touch")) {
      pushToast({
        text: "Bhai Bhai Enterprises welcomes you. Sharma Sir has noted your arrival.",
        flavor: "diary",
      });
    }
  }, [introComplete, audioReady, unlock, pushToast]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-void">
      {mounted && <AudioGate />}
      {mounted && audioReady && (
        <>
          <Intro />
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: introComplete ? 1 : 0 }}
            transition={{ duration: 1.2, ease: easings.cinematic }}
          >
            <BhaiBhaiDashboard />
            <HudCorner />
            <AchievementToasts />
            <OverloadOverlay />
            <GlobalShortcuts />
          </motion.div>
        </>
      )}
    </main>
  );
}
