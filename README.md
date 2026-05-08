# VOLUMETRIC HUBRIS

> A volume controller. A serious one.

**Volumetric Hubris** is a single-page application that treats the act of changing volume the way an opera treats a death scene: with weight, ceremony, and a willingness to make the audience uncomfortable. The product is, technically, a slider. In practice, it is a referendum on what user interfaces are willing to do to a person.

It launched on a Wednesday. The party hat is canon.

---

## Provenance

The first commit was authored from a hotel room outside Reykjavík at 03:17 local time. Internal documents refer to it as **v4.7.0** — a version number reportedly chosen because earlier integers "felt premature." There is no v4.6. There is no v4.5. There is, somewhere, a v4.7.0-rc.4 fragment in a public S3 bucket that nobody has been able to explain.

The project is described in marketing copy as "a volume controller," in code comments as "the loudest place on the internet," and in legal correspondence as "the matter."

---

## What it is

A Next.js 16 application (App Router, React 19, TypeScript strict) that renders a single, central, volume-bearing knob inside an evolving universe of metaphors. The current build ships with one fully realized "Reality" — **The Cursed Knob**, an emotional brushed-metal disc with a face, a chat input, and feelings about your input — and seven additional Realities (Cosmic Orbit, Medieval Lever, Liquid Reactor, Boss Battle, Scream Calibrator, Black Hole, Forbidden Button) sealed behind progressively more elaborate locks until subsequent phases ship.

Audio is generated entirely at runtime through the Web Audio API. There are no sample files. The ambient pad you hear on first interaction is five oscillators, a slow filter LFO, and a procedurally generated convolution reverb. The clicks of the knob are square-wave bursts shaped by exponential gain envelopes. The "glass shatter" past 100% is a high-pass-filtered noise burst followed by four sympathetic pings. None of this is sampled.

The displayed volume can climb to 9001%. The actual `GainNode.gain` is hard-clamped to a sane real-world output. The user is never in danger; the *interface* is.

---

## How to run it

```bash
npm install
npm run dev
```

The application runs on `http://localhost:3000`. It will refuse to begin until you click, tap, or press a key — a concession to browser autoplay policy disguised as theater.

To deploy, `npm run build` produces a static-prerendered output. There are no API routes. There is no database. There is, however, a state of Delaware notary stamp.

---

## Architecture

```
app/                — App Router entry. layout, page, globals.css, font wiring.
components/
  AudioGate.tsx     — first-gesture initializer.
  Intro.tsx         — the eight-second cinematic open.
  GlobalShortcuts.tsx — Konami, type-words, idle, retro toggle, witching hour.
  knob/             — MasterKnob (shared via layoutId) + KnobFace.
  scenes/           — Cursed Knob (Phase 1). Others in subsequent phases.
  chrome/           — HUD, NumberTicker, QuoteToast, AchievementToasts, RealitySelector, OverloadOverlay.
lib/
  audio/            — singleton AudioEngine + oscillator-graph SFX presets.
  state/            — zustand stores: volume, scene, easter eggs.
  hooks/            — useKonami, useIdleTimer, useTypeWatcher, usePrefersReducedMotion, useAudioBridge.
  utils/            — easing curves, volume quote table, knob emotion taxonomy.
```

The MasterKnob is a singleton React component identified by `layoutId="master-knob"` so that — once additional scenes ship — it morphs continuously across Reality changes via Framer Motion's FLIP. There is one `AudioContext` for the entire application, lazily created on first user gesture. State lives in three zustand stores composed via `subscribeWithSelector`.

---

## Hearing safety

The actual gain applied to the audio output is bounded above by `0.85` regardless of what the displayed volume claims. The displayed value is a piece of theatre. This is documented in `lib/audio/audio-engine.ts` and is not optional.

---

## Phases

This is **Phase 1** of a five-phase plan.

- **Phase 1 (this release)** — foundation, audio engine, volume store, intro, Cursed Knob scene, achievements, easter eggs, reduced motion, overload behavior up through 200%.
- **Phase 2** — Cosmic Orbit (`@react-three/fiber`, gravitational planet drag) and shared-element scene morphs.
- **Phase 3** — Liquid Reactor, Medieval Lever, Black Hole, Forbidden Button.
- **Phase 4** — Boss Battle (the only path to mute), Scream Calibrator (mic input), full overload at 200%+.
- **Phase 5** — performance pass, accessibility audit, the credits easter egg, a `WHY.md` you can already read today.

---

## Discoverable behavior

A non-exhaustive list of things that may or may not be in this build, depending on Wednesday:

- Hold the knob at exactly 42% for three seconds.
- Hold the knob at exactly 69%.
- The Konami sequence (↑↑↓↓←→←→BA).
- Type the word "boss" anywhere on the page.
- Type "void."
- Type "sudo make me a sandwich."
- Triple-click the wordmark.
- Press Tab seven times in a row.
- Walk away for thirty seconds.
- Mute three times in rapid succession.
- Visit at midnight, local time.
- Hold Shift while turning the knob.
- Hold Alt while turning the knob.
- Drop the volume below zero. Look at the world.

Most of these will produce a toast. Some will produce a small, perfectly-timed inconvenience. One will unionize the knob.

---

## License

All Rights Loud.
