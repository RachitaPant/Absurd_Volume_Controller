"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SceneShell } from "./SceneShell";
import { NumberTicker } from "@/components/chrome/NumberTicker";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import {
  type KnobEmotion,
  emotionForVolume,
  emotionPalette,
} from "@/lib/utils/knob-emotions";
import { play } from "@/lib/audio/presets";
import { useIdleTimer } from "@/lib/hooks/use-idle-timer";
import { easings } from "@/lib/utils/easings";

const COMPLIMENTS = [
  "good",
  "great",
  "love",
  "cute",
  "pretty",
  "beautiful",
  "best",
  "wonderful",
  "amazing",
  "kind",
  "smart",
  "sweet",
  "darling",
  "perfect",
  "queen",
  "king",
  "legend",
  "iconic",
];
const INSULTS = [
  "bad",
  "ugly",
  "stupid",
  "hate",
  "terrible",
  "awful",
  "annoying",
  "worst",
  "boring",
  "gross",
  "garbage",
  "trash",
  "lame",
  "pathetic",
];

type Mood = {
  override?: KnobEmotion;
  expiresAt?: number;
};

export default function CursedKnobScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const master = useVolumeStore((s) => s.master);
  const isMuted = useVolumeStore((s) => s.isMuted);
  const setEmotion = useVolumeStore((s) => s.setEmotion);
  const emotion = useVolumeStore((s) => s.emotionalState);
  const accent = useVolumeStore((s) => s.sceneAccent);
  const adjustments = useVolumeStore((s) => s.adjustmentCount);
  const unlock = useEasterEggStore((s) => s.unlock);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const pushDiary = useEasterEggStore((s) => s.pushDiary);

  const [mood, setMood] = useState<Mood>({});
  const [chat, setChat] = useState("");
  const [pinned, setPinned] = useState<string | null>(null);
  const muteAttempts = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });
  const lastVolForCheck = useRef(master);

  // Resolve effective emotion: override > derived from volume
  useEffect(() => {
    const now = Date.now();
    if (mood.override && mood.expiresAt && mood.expiresAt > now) {
      setEmotion(mood.override);
      return;
    }
    setEmotion(emotionForVolume(master));
  }, [master, mood, setEmotion]);

  // expire mood overrides
  useEffect(() => {
    if (!mood.expiresAt) return;
    const id = window.setTimeout(() => setMood({}), Math.max(50, mood.expiresAt - Date.now()));
    return () => window.clearTimeout(id);
  }, [mood]);

  // hold-at-X detection (42 -> "the answer", 69 -> "nice.", 50 -> "balance achieved")
  useEffect(() => {
    const v = Math.round(master);
    let hitTimer: number | undefined;
    if (lastVolForCheck.current !== v) {
      lastVolForCheck.current = v;
      hitTimer = window.setTimeout(() => {
        if (v === 42) {
          if (unlock("the-answer")) {
            pushToast({ text: "the answer.", flavor: "achievement" });
            play("achievement", 0.6);
          }
        }
        if (v === 69) {
          if (unlock("nice")) {
            pushToast({ text: "nice.", flavor: "achievement" });
            play("achievement", 0.6);
          }
        }
      }, 3000);
    }
    return () => {
      if (hitTimer) window.clearTimeout(hitTimer);
    };
  }, [master, unlock, pushToast]);

  // diary on every 4th adjustment (relatively quiet)
  useEffect(() => {
    if (!adjustments || adjustments % 4 !== 0) return;
    pushDiary(narrativeFor(master));
  }, [adjustments, master, pushDiary]);

  // notarize every 10th adjustment
  useEffect(() => {
    if (!adjustments || adjustments % 10 !== 0) return;
    pushToast({
      text: "OFFICIALLY VOLUMED — STATE OF DELAWARE.",
      flavor: "achievement",
    });
    if (unlock("notarized")) play("achievement", 0.5);
  }, [adjustments, unlock, pushToast]);

  // mute is earned only by surviving the boss battle. clicking the mute
  // button now actually spawns the guardian. striking knob still triggers
  // on three clustered attempts inside ten seconds.
  const handleMute = () => {
    const now = Date.now();
    const m = muteAttempts.current;
    if (now - m.lastAt > 3000) m.count = 0;
    m.count++;
    m.lastAt = now;
    if (unlock("first-mute-attempt")) {
      pushToast({
        text: "you tried to mute. the GUARDIAN OF SOUND descends.",
        flavor: "warn",
      });
    }
    play("descend", 0.5);
    if (m.count >= 3) {
      setMood({ override: "striking", expiresAt: now + 7000 });
      pushToast({
        text: "the knob has unionized. demands met after seven seconds.",
        flavor: "achievement",
      });
      unlock("the-strike");
      m.count = 0;
      return;
    }
    setMood({ override: "sulking", expiresAt: now + 1500 });
    // dispatch to boss battle
    useSceneStore.getState().setScene("boss-battle");
  };

  // chat handler (sentiment + named recognition)
  const submitChat = (raw: string) => {
    const text = raw.trim().toLowerCase();
    if (!text) return;
    const isCompliment = COMPLIMENTS.some((w) => text.includes(w));
    const isInsult = INSULTS.some((w) => text.includes(w));
    const knowsName = /\bknob\b/.test(text);

    if (knowsName) {
      if (unlock("the-knob-knows-your-name")) {
        pushToast({
          text: "the knob knows you said its name. it does not appreciate the formality.",
          flavor: "achievement",
        });
      }
    }

    if (isCompliment) {
      setMood({ override: "preening", expiresAt: Date.now() + 4000 });
      setPinned("the knob preens.");
      play("shimmer", 0.5);
    } else if (isInsult) {
      setMood({ override: "sulking", expiresAt: Date.now() + 5000 });
      setPinned("the knob sulks. input ignored for five seconds.");
      play("descend", 0.4);
    } else if (text.endsWith("?")) {
      setPinned("the knob declines to comment.");
      play("ping", 0.4);
    } else {
      setPinned(`the knob considers: "${raw.slice(0, 40)}"`);
      play("knob-tick", 0.4);
    }
    setChat("");
    window.setTimeout(() => setPinned(null), 3500);
  };

  // idle: knob falls asleep
  useIdleTimer(
    30000,
    () => {
      setMood({ override: "asleep", expiresAt: Date.now() + 1000 * 60 * 60 });
      pushToast({ text: "the knob is asleep.", flavor: "diary" });
      play("snore", 0.4);
    },
    () => {
      if (mood.override === "asleep") {
        setMood({});
        play("yawn", 0.4);
      }
    },
  );

  const palette = emotionPalette[emotion];

  return (
    <SceneShell>
      {/* atmospheric back-glow tied to the emotion */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: `radial-gradient(ellipse at 50% 38%, color-mix(in oklch, ${palette.tint} 18%, transparent) 0%, transparent 60%)`,
        }}
        transition={{ duration: 1.4, ease: easings.cinematic }}
      />

      {/* narrative line above */}
      <motion.div
        className="absolute top-[14%] inset-x-0 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: easings.cinematic }}
      >
        <div className="hud text-bone/40">CURRENTLY</div>
        <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
          the knob is <span style={{ color: palette.tint }}>{palette.label}</span>
        </div>
      </motion.div>

      {/* the knob is rendered persistently at the page level — see PersistentKnob.
          this scene only contributes background, narrative, the chat input,
          and the big number readout below. */}

      {/* big number readout below */}
      <motion.div
        className="absolute bottom-[26%] flex flex-col items-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div
          className="font-display text-bone tnum leading-none"
          style={{
            fontSize: "clamp(4rem, 11vw, 11rem)",
            color: master > 100 ? accent : undefined,
            textShadow: master > 100 ? `0 0 28px ${accent}` : undefined,
          }}
        >
          <NumberTicker value={master} width={master >= 1000 ? 4 : 3} />
        </div>
        <div className="hud text-bone/40 mt-2">
          PERCENT // {isMuted ? "muted (theatrically)" : "audible"}
        </div>
      </motion.div>

      {/* talk to the knob */}
      <motion.form
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,30rem)] pointer-events-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
        onSubmit={(e) => {
          e.preventDefault();
          submitChat(chat);
        }}
      >
        <div className="relative flex items-center border border-bone/15 bg-smoke/50 backdrop-blur-md rounded-full px-5 py-2.5">
          <span className="hud text-bone/40 mr-3">SAY //</span>
          <input
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            disabled={emotion === "sulking" || emotion === "striking"}
            placeholder={
              emotion === "sulking"
                ? "the knob is not speaking to you."
                : emotion === "striking"
                  ? "[on strike — bring the konami]"
                  : "type something to the knob…"
            }
            aria-label="Talk to the knob"
            className="flex-1 bg-transparent outline-none text-bone placeholder:text-bone/30 text-sm"
          />
          <button
            type="button"
            onClick={handleMute}
            className="hud text-bone/35 hover:text-[var(--accent)] ml-3"
            aria-label="Attempt to mute"
            title="Mute (try)"
          >
            MUTE
          </button>
        </div>
        <AnimatePresence>
          {pinned && (
            <motion.div
              key={pinned}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
              className="hud text-bone/55 italic mt-2 text-center"
            >
              {pinned}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* peripheral atmosphere: a faint ring around the knob */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 rounded-full"
        style={{
          width: "min(78vmin, 720px)",
          height: "min(78vmin, 720px)",
          border: `1px solid color-mix(in oklch, ${palette.tint} 25%, transparent)`,
          opacity: 0.4,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
    </SceneShell>
  );
}

function narrativeFor(v: number) {
  const r = Math.round(v);
  const time = new Date().toLocaleTimeString();
  return `at ${time}, the user — for reasons known only to them — set the volume to ${r}%. the knob, ever loyal, complied.`;
}
