"use client";

import { useSyncExternalStore } from "react";
import { useAudioBridge } from "@/lib/hooks/use-audio-bridge";
import { AudioGate } from "@/components/AudioGate";
import { Intro } from "@/components/Intro";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { motion } from "motion/react";
import { easings } from "@/lib/utils/easings";

// Bhai Bhai Enterprises — full dashboard loads here once built
export default function Page() {
  useAudioBridge();
  const audioReady = useSceneStore((s) => s.audioReady);
  const introComplete = useSceneStore((s) => s.introComplete);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

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
            {/* BhaiBhaiDashboard mounts here — coming in next commit */}
            <div className="flex items-center justify-center h-full hud text-bone/40">
              BHAI BHAI ENTERPRISES PVT. LTD. — LOADING...
            </div>
          </motion.div>
        </>
      )}
    </main>
  );
}
