"use client";

import { create } from "zustand";

export type Achievement =
  | "first-touch"
  | "first-mute-attempt"
  | "the-answer"
  | "nice"
  | "knob-pet"
  | "konami-believer"
  | "the-knob-knows-your-name"
  | "void-tourist"
  | "lever-snapper"
  | "reactor-survivor"
  | "scream-king"
  | "balance-achieved"
  | "the-strike"
  | "supernova"
  | "wednesday-hat"
  | "midnight-witness"
  | "glacial"
  | "chaos"
  | "retro-1998"
  | "diary-keeper"
  | "tax-evader"
  | "notarized"
  | "boss-defeated";

type ToastEntry = {
  id: string;
  text: string;
  ts: number;
  flavor?: "info" | "achievement" | "warn" | "diary";
};

type EggState = {
  unlocked: Set<Achievement>;
  toasts: ToastEntry[];
  diary: { ts: number; text: string }[];
  unlock: (a: Achievement) => boolean;
  pushToast: (t: Omit<ToastEntry, "id" | "ts"> & { id?: string }) => void;
  dismissToast: (id: string) => void;
  pushDiary: (text: string) => void;
};

export const useEasterEggStore = create<EggState>((set, get) => ({
  unlocked: new Set(),
  toasts: [],
  diary: [],
  unlock: (a) => {
    if (get().unlocked.has(a)) return false;
    const next = new Set(get().unlocked);
    next.add(a);
    set({ unlocked: next });
    return true;
  },
  pushToast: (t) => {
    const id = t.id ?? Math.random().toString(36).slice(2, 9);
    set((s) => ({
      toasts: [
        ...s.toasts.filter((x) => x.id !== id),
        { id, ts: Date.now(), flavor: "info", ...t },
      ],
    }));
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  pushDiary: (text) =>
    set((s) => ({ diary: [{ ts: Date.now(), text }, ...s.diary].slice(0, 200) })),
}));
