export const VU_TIERS = [
  { threshold: 0,    label: "Quietly Quitting",       color: "#7CFFB2" },
  { threshold: 0.25, label: "Meets Expectations",     color: "#FFC15B" },
  { threshold: 0.5,  label: "Sharma Sir is Watching", color: "#FF9B56" },
  { threshold: 0.75, label: "OFFER LETTER REVOKED",   color: "#FF4D6D" },
] as const;

export type VuLabel = { label: string; color: string };

export function getVuLabel(level: number): VuLabel {
  let result: VuLabel = { label: VU_TIERS[0].label, color: VU_TIERS[0].color };
  for (const tier of VU_TIERS) {
    if (level >= tier.threshold) result = { label: tier.label, color: tier.color };
  }
  return result;
}
