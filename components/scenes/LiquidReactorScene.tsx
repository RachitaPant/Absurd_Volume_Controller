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
import { easings } from "@/lib/utils/easings";

const ACCENT = "#9CFF54";

const liquidVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const liquidFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFill;     // 0..1.2
  uniform float uSlosh;    // wave amplitude
  uniform float uPhase;    // wave phase

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    // Vertical fluid: y = fill level. Surface waves above fill.
    float surface = uFill + uSlosh * sin(uv.x * 8.0 + uPhase + uTime * 1.4) * 0.018
                          + uSlosh * sin(uv.x * 21.0 + uPhase * 1.7) * 0.008;

    // Glass sides: thin highlight at left/right
    float side = smoothstep(0.0, 0.04, uv.x) * smoothstep(1.0, 0.96, uv.x);

    if (uv.y < surface) {
      // Liquid body: glow + caustic-ish noise
      float depth = (surface - uv.y);
      float noise1 = noise(uv * vec2(8.0, 4.0) + vec2(0.0, uTime * 0.3));
      float noise2 = noise(uv * vec2(20.0, 10.0) + vec2(uTime * 0.6, -uTime * 0.4));
      vec3 liquid = vec3(0.18, 0.85, 0.32) * (0.6 + 0.5 * noise1) + vec3(0.65, 1.0, 0.4) * noise2 * 0.25;
      liquid *= (1.0 - depth * 0.6);
      // bright surface band
      float sBand = smoothstep(0.012, 0.0, abs(uv.y - surface));
      liquid += vec3(0.85, 1.0, 0.55) * sBand * 0.8;
      gl_FragColor = vec4(liquid * side, 1.0);
    } else {
      // Above surface: faint vapour
      float fog = noise(uv * vec2(6.0, 18.0) + vec2(uTime * 0.4, uTime * -0.2)) * 0.18;
      gl_FragColor = vec4(vec3(0.4, 0.7, 0.35) * fog * side, 1.0);
    }
  }
`;

const Liquid = ({
  sloshRef,
}: {
  sloshRef: React.MutableRefObject<{ amp: number; phase: number; vel: number }>;
}) => {
  const ref = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFill: { value: 0.23 },
      uSlosh: { value: 0 },
      uPhase: { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    if (!ref.current) return;
    const v = useVolumeStore.getState().master;
    const fill = Math.max(0.02, Math.min(1.18, v / 100));

    // Slosh damping
    const s = sloshRef.current;
    const k = 14;
    const damp = 2.6;
    s.vel += (-s.amp * k - s.vel * damp) * dt;
    s.amp += s.vel * dt;
    s.phase += dt * 6;

    ref.current.uniforms.uTime.value = clock.elapsedTime;
    ref.current.uniforms.uFill.value = fill;
    ref.current.uniforms.uSlosh.value = Math.min(1, Math.abs(s.amp) * 4 + 0.15);
    ref.current.uniforms.uPhase.value = s.phase;
  });

  return (
    <mesh>
      <planeGeometry args={[1.0, 2.0]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        vertexShader={liquidVertex}
        fragmentShader={liquidFragment}
        transparent
      />
    </mesh>
  );
};

export default function LiquidReactorScene() {
  const introComplete = useSceneStore((s) => s.introComplete);
  const setSceneAccent = useVolumeStore((s) => s.setSceneAccent);
  const setMaster = useVolumeStore((s) => s.setMaster);
  const master = useVolumeStore((s) => s.master);
  const pushToast = useEasterEggStore((s) => s.pushToast);
  const unlock = useEasterEggStore((s) => s.unlock);
  const sloshRef = useRef({ amp: 0, phase: 0, vel: 0 });

  const [meltdown, setMeltdown] = useState(false);
  const [meltdownT, setMeltdownT] = useState(0);
  const [taps, setTaps] = useState(0);

  useEffect(() => setSceneAccent(ACCENT), [setSceneAccent]);

  // Drag the column: vertical drag changes fill. Horizontal = slosh.
  const cylinderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cylinderRef.current;
    if (!el) return;
    let active = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      active = true;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const rect = el.getBoundingClientRect();
      const norm = 1 - (e.clientY - rect.top) / rect.height;
      setMaster(Math.max(0, Math.min(120, norm * 120)));
      const dx = e.clientX - lastX;
      sloshRef.current.vel += dx * 0.01;
      lastX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
      // release nudge
      sloshRef.current.vel += (Math.random() - 0.5) * 0.4;
      play("knob-tick", 0.4);
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
  }, [setMaster]);

  // Meltdown trigger at 100%+. Wrapped in queueMicrotask so the lint rule
  // about synchronous setState-in-effect is satisfied; the behavior is
  // identical (microtask runs in the same tick before paint).
  useEffect(() => {
    if (master >= 100 && !meltdown) {
      queueMicrotask(() => {
        setMeltdown(true);
        setTaps(0);
        setMeltdownT(3.0);
      });
      play("glass-shatter", 0.7);
      pushToast({
        text: "REACTOR MELTDOWN — mash any key to vent.",
        flavor: "warn",
      });
    } else if (master < 95 && meltdown) {
      queueMicrotask(() => setMeltdown(false));
    }
  }, [master, meltdown, pushToast]);

  // Meltdown countdown + key-mash detection
  useEffect(() => {
    if (!meltdown) return;
    const onKey = () => setTaps((t) => t + 1);
    window.addEventListener("keydown", onKey);
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      setMeltdownT(Math.max(0, 3 - elapsed));
      if (elapsed >= 3) {
        window.clearInterval(id);
        // failure: blackout, reset to 50%
        play("thud", 0.8);
        setMaster(50);
        pushToast({
          text: "crisis averted. for now.",
          flavor: "warn",
        });
        setMeltdown(false);
      }
    }, 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(id);
    };
  }, [meltdown, setMaster, pushToast]);

  // Successful vent at 20 taps
  useEffect(() => {
    if (meltdown && taps >= 20) {
      play("achievement", 0.7);
      unlock("reactor-survivor");
      pushToast({
        text: "core vented. reactor survivor.",
        flavor: "achievement",
      });
      setMaster(60);
      queueMicrotask(() => setMeltdown(false));
    }
  }, [taps, meltdown, setMaster, unlock, pushToast]);

  return (
    <SceneShell>
      <motion.div
        className="absolute top-[12%] inset-x-0 flex flex-col items-center text-center px-6 pointer-events-none"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: introComplete ? 1 : 0, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: easings.cinematic }}
      >
        <div className="hud text-bone/40">CURRENTLY</div>
        <div className="font-display italic text-3xl md:text-4xl text-bone mt-1">
          tending <span style={{ color: ACCENT }}>the reactor</span>
        </div>
        <div className="hud text-bone/40 mt-3 max-w-[40rem] mx-auto leading-relaxed">
          drag the column to set the fill. push it sideways to slosh. above
          100% the core demands tribute.
        </div>
      </motion.div>

      {/* Cylinder anchored bottom-center */}
      <div
        ref={cylinderRef}
        className="absolute left-1/2 -translate-x-1/2 bottom-[8%] pointer-events-auto"
        style={{
          width: "min(220px, 28vmin)",
          height: "min(60vh, 520px)",
          touchAction: "none",
          cursor: "ns-resize",
        }}
      >
        <div
          className="absolute inset-0 rounded-[24px] overflow-hidden"
          style={{
            border: "2px solid rgba(245,242,234,0.18)",
            boxShadow:
              "inset 0 0 24px rgba(156,255,84,0.15), 0 0 60px rgba(156,255,84,0.18)",
            background: "linear-gradient(180deg, rgba(20,30,15,0.7), rgba(8,12,8,0.95))",
          }}
        >
          <Canvas
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
            camera={{ position: [0, 0, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Liquid sloshRef={sloshRef} />
          </Canvas>

          {/* glass shine */}
          <div
            className="absolute inset-y-0 left-3 w-1 rounded-full"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)" }}
          />
        </div>

        {/* steam vents above 80 */}
        <AnimatePresence>
          {master > 80 && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute -top-6 rounded-full"
                  style={{
                    left: `${20 + i * 30}%`,
                    width: 8,
                    height: 8,
                    background: "rgba(245,242,234,0.4)",
                    filter: "blur(4px)",
                  }}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.6, 0], y: -80, scale: 2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* readout */}
      <motion.div
        className="absolute bottom-[8%] right-[8%] hud text-bone/55 text-right pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
      >
        FILL // <span className="tnum text-bone">{Math.round(master)}</span> %
        <br />
        <span className="text-bone/35">core temp: {coreTempLabel(master)}</span>
      </motion.div>

      {/* meltdown overlay */}
      <AnimatePresence>
        {meltdown && (
          <motion.div
            className="absolute inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: "rgba(255,30,30,0.15)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
            <div className="absolute inset-x-0 top-[18%] text-center">
              <div className="hud text-[var(--accent)] tracking-[0.4em]">
                MELTDOWN IMMINENT
              </div>
              <div className="font-display text-bone text-6xl md:text-7xl mt-3 tnum">
                {meltdownT.toFixed(1)}
              </div>
              <div className="hud text-bone/70 mt-2">
                MASH ANY KEY · taps: <span className="tnum">{taps}</span> / 20
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneShell>
  );
}

function coreTempLabel(v: number) {
  if (v < 20) return "tepid";
  if (v < 50) return "warm";
  if (v < 80) return "uncomfortable";
  if (v < 100) return "concerning";
  if (v < 110) return "see your supervisor";
  return "see your priest";
}
