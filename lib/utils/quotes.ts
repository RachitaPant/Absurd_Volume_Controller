// 101 quotes — one per integer percent. Some are intentionally numbered so
// you discover them. Most are filler; the gems are the milestones.

const SPECIFICS: Record<number, string> = {
  0: "merciful silence.",
  1: "barely there.",
  2: "the whisper of a whisper.",
  3: "shy.",
  5: "polite.",
  7: "lucky.",
  10: "we begin.",
  13: "unlucky for some.",
  17: "the prime of audibility.",
  21: "old enough to drink ambient.",
  23: "a comfortable nothing.",
  25: "quartered.",
  31: "the lull before the lull.",
  33: "thirty-three percent committed.",
  37: "the hum of fluorescent lights.",
  42: "the answer.",
  47: "neither here nor there.",
  50: "exactly the middle. coward.",
  55: "warm.",
  59: "almost loud.",
  62: "leaning forward.",
  64: "perceptible commitment.",
  66: "near the beast.",
  67: "post-beast. shaken.",
  68: "almost.",
  69: "nice.",
  70: "the doorway to drama.",
  73: "actively listening.",
  77: "approaching meaningful.",
  80: "neighbors flagged.",
  85: "the wall is rumbling.",
  88: "the lucky eight.",
  90: "deniable plausibility.",
  93: "we are committed.",
  95: "the dog is concerned.",
  99: "you are trembling.",
  100: "MAXIMUM.",
  101: "you weren't supposed to be here.",
  108: "sacred geometry achieved.",
  111: "wishful thinking.",
  120: "ear protection recommended.",
  133: "now we're cooking.",
  144: "a gross overestimation.",
  150: "your speakers want a lawyer.",
  160: "warranty void.",
  169: "very nice.",
  175: "the air is hot now.",
  180: "physical discomfort.",
  187: "the cops would be called if cops listened.",
  200: "this is no longer about music.",
  250: "physically impossible. yet.",
  333: "the trinity.",
  420: "blaze it. the volume, that is.",
  500: "we have left the human range.",
  666: "you have summoned something.",
  777: "jackpot of bad ideas.",
  888: "infinity, but louder.",
  999: "one more click.",
  1000: "kilowatt regrets.",
  9001: "IT'S OVER 9000.",
};

const FILLER = [
  "noise.",
  "audible.",
  "hearing this is a choice.",
  "okay.",
  "you are deciding things.",
  "it is loud, but not yet absurd.",
  "we register your enthusiasm.",
  "documented.",
  "noted by the council.",
  "filed for review.",
  "the air is louder now.",
  "molecules: agitated.",
  "this is happening.",
  "approved by the volume notary.",
  "permission to be loud: granted.",
];

export function quoteForVolume(v: number): string {
  const i = Math.round(v);
  if (SPECIFICS[i]) return SPECIFICS[i];
  // pseudo-stable filler — always returns the same line for the same integer
  return FILLER[Math.abs(i) % FILLER.length];
}

// for negative volumes (yes, you can go below zero — UI inverts)
export function quoteForBelow(): string {
  return "you have gone below. things are upside down now.";
}
