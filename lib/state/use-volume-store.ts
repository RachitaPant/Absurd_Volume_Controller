"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { KnobEmotion } from "@/lib/utils/knob-emotions";

export type RealityScene =
  | "cursed-knob"
  | "cosmic-orbit"
  | "medieval-lever"
  | "liquid-reactor"
  | "boss-battle"
  | "scream-calibrator"
  | "black-hole"
  | "forbidden-button";

type VolumeState = {
  master: number;
  bands: [number, number, number, number, number];
  isMuted: boolean;
  emotionalState: KnobEmotion;
  rawScreamLevel: number;
  godMode: boolean;
  retroMode: boolean;
  taxCents: number;
  adjustmentCount: number;
  sceneAccent: string;
  isShaking: boolean;
  isOverloaded: boolean;
  isCrashed: boolean;

  setMaster: (v: number) => void;
  delta: (d: number) => void;
  setBand: (i: 0 | 1 | 2 | 3 | 4, db: number) => void;
  setMuted: (m: boolean) => void;
  toggleMute: () => void;
  setEmotion: (e: KnobEmotion) => void;
  setScream: (level: number) => void;
  setGodMode: (b: boolean) => void;
  setRetroMode: (b: boolean) => void;
  setSceneAccent: (color: string) => void;
  setShaking: (b: boolean) => void;
  setOverloaded: (b: boolean) => void;
  setCrashed: (b: boolean) => void;
};

const MIN = -50;

export const useVolumeStore = create<VolumeState>()(
  subscribeWithSelector((set, get) => ({
    master: 23,
    bands: [0, 0, 0, 0, 0],
    isMuted: false,
    emotionalState: "bored",
    rawScreamLevel: 0,
    godMode: false,
    retroMode: false,
    taxCents: 0,
    adjustmentCount: 0,
    sceneAccent: "#FF4D6D",
    isShaking: false,
    isOverloaded: false,
    isCrashed: false,

    setMaster: (v) => {
      const cap = get().godMode ? 9001 : 200;
      const clamped = Math.max(MIN, Math.min(cap, v));
      const overloaded = clamped > 100;
      set((s) => ({
        master: clamped,
        adjustmentCount: s.adjustmentCount + 1,
        taxCents: s.taxCents + 0.01,
        isOverloaded: overloaded,
      }));
    },
    delta: (d) => get().setMaster(get().master + d),
    setBand: (i, db) =>
      set((s) => {
        const next = [...s.bands] as VolumeState["bands"];
        next[i] = Math.max(-12, Math.min(12, db));
        return { bands: next };
      }),
    setMuted: (m) => set({ isMuted: m }),
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    setEmotion: (e) => set({ emotionalState: e }),
    setScream: (level) => set({ rawScreamLevel: level }),
    setGodMode: (b) => set({ godMode: b }),
    setRetroMode: (b) => set({ retroMode: b }),
    setSceneAccent: (color) => set({ sceneAccent: color }),
    setShaking: (b) => set({ isShaking: b }),
    setOverloaded: (b) => set({ isOverloaded: b }),
    setCrashed: (b) => set({ isCrashed: b }),
  })),
);
