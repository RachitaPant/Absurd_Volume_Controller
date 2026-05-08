"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { easings } from "@/lib/utils/easings";

// Common shell for every scene: radial reveal in, radial collapse out, with
// the knob's center as the implicit anchor. Pair with AnimatePresence in
// SceneRouter for the full collapse → hold → expand choreography.
//
// Total transition: ~1.6s. The knob (PersistentKnob) stays put; the scene's
// surroundings explode/implode around it.
export function SceneShell({
  children,
  intensity = 1,
}: {
  children: ReactNode;
  intensity?: number;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{
        opacity: 0,
        clipPath: "circle(0% at 50% 52%)",
      }}
      animate={{
        opacity: 1,
        clipPath: "circle(140% at 50% 52%)",
      }}
      exit={{
        opacity: 0,
        clipPath: "circle(0% at 50% 52%)",
      }}
      transition={{
        duration: 1.4 * intensity,
        ease: easings.cinematic,
        opacity: { duration: 0.9 * intensity },
      }}
    >
      {children}
    </motion.div>
  );
}
