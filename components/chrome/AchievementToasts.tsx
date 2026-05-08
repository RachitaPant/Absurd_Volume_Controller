"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { easings } from "@/lib/utils/easings";

// Right-edge toasts. Single source of truth: useEasterEggStore.toasts
export function AchievementToasts() {
  const toasts = useEasterEggStore((s) => s.toasts);
  const dismiss = useEasterEggStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => {
      const oldest = toasts[0];
      if (oldest && Date.now() - oldest.ts > 4500) dismiss(oldest.id);
    }, 600);
    return () => window.clearTimeout(id);
  }, [toasts, dismiss]);

  return (
    <div
      className="fixed top-[18%] right-6 z-40 flex flex-col gap-3 max-w-[28rem]"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.slice(-5).map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 40, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: easings.cinematic }}
            className={[
              "px-4 py-3 border backdrop-blur-md rounded-sm",
              t.flavor === "achievement"
                ? "border-[var(--accent)]/60 bg-[color-mix(in_oklch,_var(--accent)_15%,_#08080a)]"
                : t.flavor === "warn"
                  ? "border-[#ff1a1a]/60 bg-[#240505]/80"
                  : t.flavor === "diary"
                    ? "border-bone/15 bg-smoke/60 italic"
                    : "border-bone/15 bg-smoke/70",
            ].join(" ")}
          >
            <div className="hud text-bone/80 text-[11px] mb-1">
              {t.flavor === "achievement"
                ? "★ ACHIEVEMENT UNLOCKED"
                : t.flavor === "warn"
                  ? "⚠ NOTICE"
                  : t.flavor === "diary"
                    ? "VOLUME DIARY"
                    : "SYSTEM"}
            </div>
            <div className="text-bone text-sm leading-snug">{t.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
