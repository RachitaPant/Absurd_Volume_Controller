"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";
import { easings } from "@/lib/utils/easings";

// The "why does this exist" pile. A collapsible kit on the left edge:
// Insurance, Roulette, Bug Report. All of them are jokes. None of them
// are functional. They are real anyway.
export function SideKit() {
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [insuranceDeclined, setInsuranceDeclined] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const pushToast = useEasterEggStore((s) => s.pushToast);

  const onRoulette = () => {
    play("ascend", 0.5);
    // 1% chance of the absurd value
    let target: number;
    if (Math.random() < 0.01) {
      target = Math.PI * 31.83098; // ≈ 100
      pushToast({ text: "the dice rolled something sacred.", flavor: "achievement" });
    } else {
      target = Math.round(Math.random() * 110);
    }
    // chaos animation: a few jitters then land
    const jitters = 8;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      if (i < jitters) {
        setMaster(Math.random() * 110);
      } else {
        setMaster(target);
        window.clearInterval(id);
      }
    }, 70);
  };

  return (
    <>
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 items-start">
        <button
          className="px-3 py-2 rounded-r-md hud bg-smoke/60 backdrop-blur border border-l-0 border-bone/15 text-bone/55 hover:text-bone"
          onClick={() => {
            setInsuranceOpen(true);
            play("knob-tick", 0.3);
          }}
        >
          🩹 BUY HEARING INSURANCE
        </button>
        <button
          className="px-3 py-2 rounded-r-md hud bg-smoke/60 backdrop-blur border border-l-0 border-bone/15 text-bone/55 hover:text-bone"
          onClick={onRoulette}
        >
          🎲 RANDOMIZE
        </button>
        <button
          className="px-3 py-2 rounded-r-md hud bg-smoke/60 backdrop-blur border border-l-0 border-bone/15 text-bone/55 hover:text-bone"
          onClick={() => {
            setBugOpen(true);
            play("knob-tick", 0.3);
          }}
        >
          🐛 REPORT A BUG
        </button>
      </div>

      <AnimatePresence>
        {insuranceOpen && (
          <Modal onClose={() => setInsuranceOpen(false)} title="hearing coverage">
            {!insuranceDeclined ? (
              <>
                <p className="text-bone/80 leading-relaxed mb-4">
                  Choose your plan. Coverage begins at policy approval and ends
                  the moment you turn the volume up.
                </p>
                <div className="space-y-3">
                  <PlanCard
                    name="bronze"
                    blurb="for the meek. covers up to 14% of any acoustic loss, payable in handshakes."
                  />
                  <PlanCard
                    name="silver"
                    blurb="includes one (1) replacement eardrum per calendar year, mailed 4–6 weeks."
                  />
                  <PlanCard
                    name="platinum eardrum"
                    blurb="diamond-encrusted ossicles. vintage tinnitus excluded."
                  />
                </div>
                <button
                  className="mt-6 hud text-bone/40 hover:text-bone underline"
                  onClick={() => setInsuranceDeclined(true)}
                >
                  no thank you →
                </button>
              </>
            ) : (
              <p className="font-display italic text-bone text-2xl text-center py-12">
                you have chosen to live recklessly.
              </p>
            )}
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bugOpen && (
          <Modal onClose={() => setBugOpen(false)} title="bug report">
            <p className="font-display italic text-bone text-2xl mb-3 text-center">
              there are no bugs.
            </p>
            <p className="text-bone/70 text-center">
              only features you weren&apos;t ready for.
            </p>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[160] bg-void/85 backdrop-blur-md flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-smoke border border-bone/15 rounded p-6 w-[min(92vw,520px)]"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
        transition={{ duration: 0.45, ease: easings.cinematic }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display italic text-2xl text-bone">{title}</h3>
          <button
            onClick={onClose}
            className="hud text-bone/40 hover:text-bone"
            aria-label="Close"
          >
            CLOSE
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function PlanCard({ name, blurb }: { name: string; blurb: string }) {
  return (
    <div className="border border-bone/15 rounded p-3 hover:bg-bone/5 cursor-pointer">
      <div className="hud text-bone tracking-[0.2em]">{name}</div>
      <p className="text-bone/70 text-sm mt-1 leading-snug">{blurb}</p>
    </div>
  );
}
