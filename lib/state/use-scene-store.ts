"use client";

import { create } from "zustand";
import type { RealityScene } from "./use-volume-store";

type SceneState = {
  scene: RealityScene;
  introComplete: boolean;
  audioReady: boolean;
  setScene: (s: RealityScene) => void;
  setIntroComplete: (b: boolean) => void;
  setAudioReady: (b: boolean) => void;
};

export const useSceneStore = create<SceneState>((set) => ({
  scene: "cursed-knob",
  introComplete: false,
  audioReady: false,
  setScene: (s) => set({ scene: s }),
  setIntroComplete: (b) => set({ introComplete: b }),
  setAudioReady: (b) => set({ audioReady: b }),
}));
