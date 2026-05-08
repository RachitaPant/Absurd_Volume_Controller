// Custom cubic-beziers — every scene gets a feel. Naming things after how
// they MOVE rather than what they DO is the whole point.

export const easings = {
  cinematic: [0.16, 1, 0.3, 1] as const,
  authoritative: [0.7, 0, 0.3, 1] as const,
  dramatic: [0.85, 0, 0.15, 1] as const,
  swagger: [0.34, 1.56, 0.64, 1] as const,
  doom: [0.95, 0.05, 0.795, 0.035] as const,
  resurrection: [0.05, 0.7, 0.1, 1] as const,
};

export type Easing = (typeof easings)[keyof typeof easings];
