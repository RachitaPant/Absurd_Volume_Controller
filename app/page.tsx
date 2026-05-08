"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAudioBridge } from "@/lib/hooks/use-audio-bridge";
import { AudioGate } from "@/components/AudioGate";
import { Intro } from "@/components/Intro";
import { SceneRouter } from "@/components/scenes/SceneRouter";
import { PersistentKnob } from "@/components/knob/PersistentKnob";
import { HudCorner } from "@/components/chrome/HudCorner";
import { QuoteToast } from "@/components/chrome/QuoteToast";
import { AchievementToasts } from "@/components/chrome/AchievementToasts";
import { RealitySelector } from "@/components/chrome/RealitySelector";
import { OverloadOverlay } from "@/components/chrome/OverloadOverlay";
import { VolumeDiary } from "@/components/chrome/VolumeDiary";
import { SideKit } from "@/components/chrome/SideKit";
import { CapitalismMode } from "@/components/chrome/CapitalismMode";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { motion } from "motion/react";
import { easings } from "@/lib/utils/easings";

export default function Page() {
  useAudioBridge();
  const audioReady = useSceneStore((s) => s.audioReady);
  const introComplete = useSceneStore((s) => s.introComplete);
  const unlock = useEasterEggStore((s) => s.unlock);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  // Local mounted flag guarantees SSR + first client paint render an empty
  // shell, regardless of store state surviving HMR.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // start the procedural pad once intro completes
  useEffect(() => {
    if (!introComplete || !audioReady) return;
    const e = getAudioEngine();
    if (e.isReady()) e.startPad();
    if (unlock("first-touch")) {
      pushToast({
        text: "the pad enters. you have officially begun.",
        flavor: "diary",
      });
    }
  }, [introComplete, audioReady, unlock, pushToast]);

  // During SSR / pre-gesture nothing past the AudioGate is rendered. This
  // sidesteps hydration mismatches caused by viewport-derived layout values
  // (knob size, particle positions, etc.) and keeps initial HTML tiny.
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
            <SceneRouter />
            <PersistentKnob />
            <HudCorner />
            <QuoteToast />
            <AchievementToasts />
            <RealitySelector />
            <OverloadOverlay />
            <VolumeDiary />
            <SideKit />
            <CapitalismMode />
            <GlobalShortcuts />
          </motion.div>
        </>
      )}
    </main>
  );
}
