"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, AdditiveBlending } from "three";

// Seeded PRNG so the star field is identical render-to-render, dodges the
// React 19 "no impure calls during render" rule, and stays SSR/CSR-safe.
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1500 star points drifting slowly. Cheap, atmospheric.
export function Stars({ count = 1500, seed = 0xc0ffee }: { count?: number; seed?: number }) {
  const ref = useRef<Points>(null);

  const positions = useMemo(() => {
    const rand = mulberry32(seed);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 8 + rand() * 18;
      const theta = rand() * Math.PI * 2;
      const phi = (rand() - 0.5) * Math.PI;
      arr[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      arr[i * 3 + 1] = r * Math.sin(theta) * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * 0.5 - 4;
    }
    return arr;
  }, [count, seed]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#f5f2ea"
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.65}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
