"use client";

import { create } from "zustand";

export type Receipt = {
  id: string;
  reason: string;
  volume: number;
  ts: number;
};

type BhaiState = {
  // Mom's WhatsApp call
  momCallActive: boolean;
  momDeclineCount: number;

  // Suman Aunty HR bubble
  sumanMessage: string | null;
  sumanVisible: boolean;

  // Thermal receipt queue (max 3 visible)
  receipts: Receipt[];
  lastReceiptVolume: number;

  // Power cut
  powerCutActive: boolean;

  // Sharma ji ka beta counter (you are always losing)
  sharmaAdjustments: number;

  // Pawri ho rahi hai — disco mode
  pawriActive: boolean;

  // Chai mode — planets paused
  chaiActive: boolean;
  planetsPaused: boolean;

  // Konami / Saxena Sir sequence
  saxenaActive: boolean;

  // Hold at 100% for 10s — Sharma Sir strike
  sharmaStrikeActive: boolean;
  sharmaApologized: boolean;

  // Planet selected for yelling
  selectedPlanet: number | null;

  // Actions
  setMomCallActive: (b: boolean) => void;
  incrementMomDecline: () => void;
  resetMomDecline: () => void;
  showSuman: (msg: string) => void;
  hideSuman: () => void;
  addReceipt: (reason: string, volume: number) => void;
  removeReceipt: (id: string) => void;
  setLastReceiptVolume: (v: number) => void;
  setPowerCut: (b: boolean) => void;
  incrementSharma: () => void;
  setPawri: (b: boolean) => void;
  setChai: (b: boolean, paused?: boolean) => void;
  setSaxena: (b: boolean) => void;
  setSharmaStrike: (b: boolean) => void;
  setSharmaApologized: (b: boolean) => void;
  setSelectedPlanet: (idx: number | null) => void;
};

export const useBhaiStore = create<BhaiState>((set) => ({
  momCallActive: false,
  momDeclineCount: 0,
  sumanMessage: null,
  sumanVisible: false,
  receipts: [],
  lastReceiptVolume: 23,
  powerCutActive: false,
  sharmaAdjustments: 14, // user is already losing from the start
  pawriActive: false,
  chaiActive: false,
  planetsPaused: false,
  saxenaActive: false,
  sharmaStrikeActive: false,
  sharmaApologized: false,
  selectedPlanet: null,

  setMomCallActive: (b) => set({ momCallActive: b }),
  incrementMomDecline: () =>
    set((s) => ({ momDeclineCount: s.momDeclineCount + 1 })),
  resetMomDecline: () => set({ momDeclineCount: 0 }),
  showSuman: (msg) => set({ sumanMessage: msg, sumanVisible: true }),
  hideSuman: () => set({ sumanVisible: false }),
  addReceipt: (reason, volume) =>
    set((s) => ({
      receipts: [
        ...s.receipts,
        { id: Math.random().toString(36).slice(2), reason, volume, ts: Date.now() },
      ].slice(-3),
    })),
  removeReceipt: (id) =>
    set((s) => ({ receipts: s.receipts.filter((r) => r.id !== id) })),
  setLastReceiptVolume: (v) => set({ lastReceiptVolume: v }),
  setPowerCut: (b) => set({ powerCutActive: b }),
  incrementSharma: () =>
    set((s) => ({ sharmaAdjustments: s.sharmaAdjustments + 1 })),
  setPawri: (b) => set({ pawriActive: b }),
  setChai: (b, paused = b) => set({ chaiActive: b, planetsPaused: paused }),
  setSaxena: (b) => set({ saxenaActive: b }),
  setSharmaStrike: (b) => set({ sharmaStrikeActive: b }),
  setSharmaApologized: (b) => set({ sharmaApologized: b }),
  setSelectedPlanet: (idx) => set({ selectedPlanet: idx }),
}));
