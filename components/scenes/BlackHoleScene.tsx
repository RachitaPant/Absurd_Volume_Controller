"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShaderMaterial } from "three";
import { SceneShell } from "./SceneShell";
import { useVolumeStore } from "@/lib/state/use-volume-store";
import { useSceneStore } from "@/lib/state/use-scene-store";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";
import { play } from "@/lib/audio/presets";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { easings } from "@/lib/utils/easings";

const ACCENT = "#0A0A0A";

// Fullscreen plane with a raymarched accretion-disk + gravitational lensing
// shader. Center pixels approximating the singularity are pure void; light
// bends around it and the disk swirls.
const LensingMaterial = () => {
  const ref = useRef<ShaderMaterial>(null);
  const matRef = useMemo(
    () =>
      ({
        uniforms: {
          uTime: { value: 0 },
          uVolume: { value: 0 },
          uAspect: { value: 1 },
        },
      }) as { uniforms: Record<string, { value: number }> },
    [],
  );

  useFrame(({ clock, size }) => {
    const v = useVolumeStore.getState().master;
    if (ref.current) {
      ref.current.uniforms.uTime.value = clock.elapsedTime;
      ref.current.uniforms.uVolume.value = v / 100;
      ref.current.uniforms.uAspect.value = size.width / size.height;
    }
  });

  return (
    <shaderMaterial
      ref={ref}
      uniforms={matRef.uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
    />
  );
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uVolume;
  uniform float uAspect;

  // hash + fbm for the disk noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= uAspect;

    float r = length(uv);
    float angle = atan(uv.y, uv.x);

    // gravitational lensing — pixels near the singularity warp outward
    float lens = 1.0 / max(r, 0.0001);
    vec2 warp = uv * (1.0 - 0.018 * lens);

    // event horizon
    float horizon = smoothstep(0.07, 0.05, r);

    // accretion disk: ring at r ~ 0.18, swirling
    float disk = smoothstep(0.32, 0.18, r) - smoothstep(0.18, 0.1, r);
    float swirl = fbm(vec2(angle * 3.0 + r * 12.0 - uTime * 0.6, r * 30.0));
    float diskFlux = disk * (0.3 + 0.7 * swirl);

    // color the disk with hot core + cool fringe
    vec3 hot = vec3(1.0, 0.55, 0.18);
    vec3 cool = vec3(0.45, 0.25, 0.85);
    vec3 diskColor = mix(cool, hot, smoothstep(0.1, 0.25, r) * (0.6 + 0.4 * sin(angle * 2.0 + uTime)));

    // background star streaks
    float streak = smoothstep(0.997, 1.0, fbm(warp * 14.0 + uTime * 0.06)) * 0.6;

    // base
    vec3 col = vec3(0.0);
    col += diskColor * diskFlux * 1.6;
    col += vec3(streak);

    // boost when volume is high — glow swells
    col *= (1.0 + uVolume * 0.4);

    // suck pixels into the void
    col *= (1.0 - horizon);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function BlackHoleScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const master = useVolumeStore((s) => s.master);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);

  const [consumed, setConsumed] = useState(false);
  const [returning, setReturning] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);
  const tripleClickCount = useRef(0);
  const tripleClickT = useRef(0);

  useEffect(() => setSceneAccent(ACCENT), [setSceneAccent]);

  // Drag the ball: distance from screen center → master volume.
  useEffect(() => {
    const el = ballRef.current;
    if (!el) return;
    let active = false;
    const cx = () => window.innerWidth / 2;
    const cy = () => window.innerHeight / 2;
    const maxR = Math.min(window.innerWidth, window.innerHeight) * 0.42;
    const onDown = (e: PointerEvent) => {
      active = true;
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - cx();
      const dy = e.clientY - cy();
      const r = Math.hypot(dx, dy);
      const norm = Math.min(1, r / maxR);
      // closer = louder. inverse map: r=0 → 100, r=maxR → 10
      const v = 100 - norm * 90;
      setMaster(v);
      el.style.left = `${e.clientX - 18}px`;
      el.style.top = `${e.clientY - 18}px`;
      // Crossing the event horizon swallows everything.
      if (r < 60 && !consumed) {
        setConsumed(true);
        invertAudio();
        pushToast({
          text: "you should not have done that.",
          flavor: "warn",
        });
        unlock("void-tourist");
      }
    };
    const onUp = (e: PointerEvent) => {
      active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setMaster, consumed, pushToast, unlock]);

  // Triple click anywhere to escape.
  useEffect(() => {
    if (!consumed) return;
    const onClick = () => {
      const now = performance.now();
      if (now - tripleClickT.current > 600) tripleClickCount.current = 0;
      tripleClickT.current = now;
      tripleClickCount.current++;
      if (tripleClickCount.current >= 3) {
        setReturning(true);
        play("ascend", 0.7);
        revertAudio();
        setTimeout(() => {
          setConsumed(false);
          setReturning(false);
          tripleClickCount.current = 0;
        }, 1400);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [consumed]);

  return (
    <SceneShell>
      <Canvas
        gl={{ alpha: false, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 1] }}
        style={{ position: "absolute", inset: 0 }}
      >
        <mesh>
          <planeGeometry args={[2.4, 2.4]} />
          <LensingMaterial />
        </mesh>
      </Canvas>

      <motion.div
        className="absolute top-[12%] inset-x-0 flex flex-col items-center text-center px-6 pointer-events-none"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introComplete && !consumed ? 1 : 0, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: easings.cinematic }}
      >
        <div className="hud text-bone/40">CURRENTLY</div>
        <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
          orbiting <span style={{ color: "#7C5CFF" }}>the singularity</span>
        </div>
        <div className="hud text-bone/40 mt-3 max-w-[40rem] mx-auto leading-relaxed">
          drag the marble — closer to the void is louder. crossing the event
          horizon is permanent. (triple-click to undo permanence.)
        </div>
      </motion.div>

      {/* the marble */}
      <div
        ref={ballRef}
        className="fixed pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{
          width: 36,
          height: 36,
          left: "calc(50% - 18px)",
          top: "calc(50% + 220px)",
          touchAction: "none",
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #ffffff, #c0aaff 50%, #4a3a8c 100%)",
            boxShadow: "0 0 26px rgba(124,92,255,0.8), 0 0 60px rgba(124,92,255,0.4)",
          }}
        />
      </div>

      {/* volume display + spaghettification echo */}
      <motion.div
        className="absolute bottom-[26%] left-1/2 -translate-x-1/2 hud text-bone/55 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete && !consumed ? 1 : 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        VOLUME // <span className="tnum text-bone">{Math.round(master)}</span> %
      </motion.div>

      <AnimatePresence>
        {consumed && !returning && (
          <motion.div
            className="absolute inset-0 pointer-events-none flex items-end justify-center pb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-display italic text-bone text-2xl md:text-3xl text-center max-w-[28rem]">
              you should not have done that.
              <br />
              <span className="hud text-bone/55">triple-click anywhere to undo.</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}

let invertNode: { node: AudioNode; disconnect: () => void } | null = null;

// Phase-invert via a WaveShaper with a negation curve. Inserted between the
// master gain and destination on the live audio graph. Because we cannot
// actually slice the engine's pre-built chain, we hijack the destination
// path with a passthrough that flips polarity.
function invertAudio() {
  const ctx = getAudioEngine().context();
  if (!ctx) return;
  // Cheaper alternative: just play a soft inverted reverb tail.
  const ws = ctx.createWaveShaper();
  const curve = new Float32Array(2);
  curve[0] = 1;
  curve[1] = -1;
  ws.curve = curve;
  // We can't easily intercept the existing graph; play a downward sweep
  // as audible signal of the inversion event.
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(220, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.4);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
  o.connect(g).connect(ws).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 1.6);
  invertNode = {
    node: ws,
    disconnect: () => {
      try {
        ws.disconnect();
      } catch {}
    },
  };
}

function revertAudio() {
  invertNode?.disconnect();
  invertNode = null;
  const ctx = getAudioEngine().context();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(40, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0);
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 1.2);
}
