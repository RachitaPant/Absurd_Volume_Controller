export type KnobEmotion =
  | "asleep"
  | "sleepy"
  | "bored"
  | "content"
  | "excited"
  | "manic"
  | "transcendent"
  | "existential"
  | "sulking"
  | "preening"
  | "striking";

// Pure mapping from volume to emotion. Sleeping/sulking/striking are imposed
// by external triggers and override this.
export function emotionForVolume(v: number): KnobEmotion {
  if (v <= 0) return "sleepy";
  if (v <= 20) return "bored";
  if (v <= 60) return "content";
  if (v <= 80) return "excited";
  if (v <= 99) return "manic";
  if (v <= 100) return "transcendent";
  return "existential";
}

export const emotionPalette: Record<KnobEmotion, { mouth: string; eye: string; tint: string; label: string }> = {
  asleep: { mouth: "asleep", eye: "closed", tint: "#7C8DA6", label: "asleep" },
  sleepy: { mouth: "yawn", eye: "drooped", tint: "#7C8DA6", label: "sleepy" },
  bored: { mouth: "flat", eye: "half", tint: "#9C9CA8", label: "bored" },
  content: { mouth: "softSmile", eye: "open", tint: "#A5C8FF", label: "content" },
  excited: { mouth: "grin", eye: "wide", tint: "#FFB45C", label: "excited" },
  manic: { mouth: "manic", eye: "swirl", tint: "#FF4D6D", label: "manic" },
  transcendent: { mouth: "calm", eye: "halo", tint: "#F5F2EA", label: "transcendent" },
  existential: { mouth: "frown", eye: "void", tint: "#5A2A88", label: "existential dread" },
  sulking: { mouth: "pout", eye: "narrow", tint: "#FF4D6D", label: "sulking" },
  preening: { mouth: "smirk", eye: "twinkle", tint: "#FFD9E2", label: "preening" },
  striking: { mouth: "shut", eye: "x", tint: "#D89B4A", label: "on strike" },
};
