"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneShell } from "./SceneShell";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { easings } from "@/lib/utils/easings";

const ACCENT = "#FF1A1A";

const CLAUSE_PARTS = [
  "By continuing, I forfeit my dental records to the Volume Council.",
  "I acknowledge that loud is a verb, a noun, and a state of grace.",
  "All ear-drum events arising from this session are mine alone to grieve.",
  "I waive any claim against the knob, its emotions, or its descendants.",
  "I accept that this volume is, in fact, the volume.",
  "I will not characterize the proceedings as 'unhinged' in any review.",
  "I understand the Boss exists, even when not currently summoned.",
  "I will treat the comet's bullet-time as a gift and not a feature.",
  "I forgo the right to be heard over this volume by anyone in particular.",
  "I have read approximately 0% of this agreement.",
  "I am aware that the witching hour confers horns. I accept the horns.",
  "I will not ask which State of Delaware notarized my volume. They know.",
];

export default function ForbiddenButtonScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);
  const [pressed, setPressed] = useState(false);
  const [clauses, setClauses] = useState(() => shuffle(CLAUSE_PARTS));
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setSceneAccent(ACCENT);
  }, [setSceneAccent]);

  const onPress = () => {
    setPressed(true);
    play("thud", 0.6);
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate([80, 40, 200]);

    // Eldritch synth chord
    const ctx = getAudioEngine().context();
    if (ctx) {
      [110, 165, 220, 277.18, 329.63].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = i % 2 ? "sawtooth" : "triangle";
        o.frequency.value = f;
        o.detune.value = (i - 2) * 12;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.4);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 2.5);
      });
    }
  };

  const onAccept = () => {
    setAccepted(true);
    play("achievement", 0.7);
    unlock("supernova");
    pushToast({
      text: "you have read the eula. the volume council is impressed.",
      flavor: "achievement",
    });
    // bump volume dramatically
    setMaster(88);
    setTimeout(() => {
      setPressed(false);
      setAccepted(false);
      setClauses(shuffle(CLAUSE_PARTS));
    }, 2200);
  };

  return (
    <SceneShell>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* atmospheric red haze */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 52%, color-mix(in oklch, #ff1a1a 18%, transparent) 0%, transparent 60%)",
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* narrative line */}
        <motion.div
          className="absolute top-[14%] inset-x-0 flex flex-col items-center text-center px-6 pointer-events-none"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: easings.cinematic }}
        >
          <div className="hud text-bone/40">CURRENTLY</div>
          <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
            beneath the <span style={{ color: ACCENT }}>forbidden button</span>
          </div>
          <div className="hud text-bone/40 mt-3 max-w-[40rem] mx-auto leading-relaxed">
            do not press it. you will press it. there is no other ending.
          </div>
        </motion.div>

        {/* THE button — sits below the knob to avoid overlap */}
        <motion.button
          onClick={onPress}
          disabled={pressed}
          className="pointer-events-auto absolute bottom-[18%] left-1/2 -translate-x-1/2 px-10 py-5 rounded-full text-bone font-display italic text-2xl tracking-wide cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(180deg, #ff5e5e 0%, #c80000 100%)",
            boxShadow:
              "0 0 60px rgba(255,30,30,0.6), inset 0 -6px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
            border: "1px solid #ff6e6e",
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={{ delay: 0.7, duration: 0.7, ease: easings.cinematic }}
        >
          do not press
        </motion.button>
      </div>

      <AnimatePresence>
        {pressed && !accepted && (
          <Eula clauses={clauses} setClauses={setClauses} onAccept={onAccept} onClose={() => setPressed(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {accepted && <AcceptedBanner />}
      </AnimatePresence>
    </SceneShell>
  );
}

function Eula({
  clauses,
  setClauses,
  onAccept,
  onClose,
}: {
  clauses: string[];
  setClauses: (c: string[]) => void;
  onAccept: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastT = useRef<number>(0);
  const lastY = useRef<number>(0);
  const [bottomReached, setBottomReached] = useState(false);
  const [pace, setPace] = useState(0);

  // Watch scroll velocity. Bottom appears only at the right pace.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const t = performance.now();
      const y = el.scrollTop;
      const dt = (t - lastT.current) / 1000;
      const dy = Math.abs(y - lastY.current);
      const px_per_s = dt > 0 ? dy / dt : 0;
      setPace(px_per_s);

      // Re-shuffle clauses every scroll. Sisyphus.
      if (Math.random() < 0.15) {
        setClauses(shuffle(CLAUSE_PARTS));
      }

      lastT.current = t;
      lastY.current = y;

      // Sweet spot: 75–101 px/s for ~600ms cumulative
      const inSpot = px_per_s > 75 && px_per_s < 101;
      if (inSpot) {
        const sustained = (el.dataset.sustain ? Number(el.dataset.sustain) : 0) + dt;
        el.dataset.sustain = String(sustained);
        if (sustained > 0.6) setBottomReached(true);
      } else {
        el.dataset.sustain = "0";
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [setClauses]);

  return (
    <motion.div
      className="fixed inset-0 z-[150] bg-void/85 backdrop-blur-md flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-smoke border border-bone/15 rounded p-6 w-[min(92vw,640px)] max-h-[80vh] flex flex-col"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
        transition={{ duration: 0.5, ease: easings.cinematic }}
      >
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="font-display italic text-2xl text-bone">end-user volume agreement</h3>
          <button
            onClick={onClose}
            className="hud text-bone/40 hover:text-bone"
            aria-label="Close EULA"
          >
            CLOSE
          </button>
        </div>
        <div className="hud text-bone/40 mb-3">
          scroll at exactly <span className="text-bone">88 px/s</span> to reach
          the bottom — current pace: <span className="tnum text-bone">{Math.round(pace)} px/s</span>
        </div>
        <div
          ref={ref}
          className="flex-1 overflow-y-auto pr-2 space-y-3 text-bone/80 text-sm leading-relaxed"
        >
          {Array.from({ length: 24 }).flatMap((_, blk) =>
            clauses.map((c, i) => (
              <p key={`${blk}-${i}`}>
                <span className="text-bone/40 font-mono mr-2">§{blk + 1}.{i + 1}</span>
                {c}
              </p>
            )),
          )}
          {bottomReached && (
            <motion.div
              className="border-t border-bone/15 pt-4 mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-bone font-display italic text-xl mb-3">
                you have arrived.
              </p>
              <button
                onClick={onAccept}
                className="w-full py-3 px-4 rounded-full font-bold tracking-[0.2em] uppercase"
                style={{
                  background: "linear-gradient(180deg, #ff5e5e, #c80000)",
                  color: "#fff",
                  boxShadow: "0 0 30px rgba(255,30,30,0.5)",
                }}
              >
                I CONSENT TO THE VOLUME
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AcceptedBanner() {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="font-display italic text-bone text-center"
        style={{ fontSize: "clamp(3rem, 8vw, 8rem)" }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 1.1 }}
        transition={{ duration: 0.6, ease: easings.swagger }}
      >
        consented.
      </motion.div>
    </motion.div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
