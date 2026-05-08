"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh, Color, MeshBasicMaterial } from "three";
import { useVolumeStore } from "@/lib/state/use-volume-store";

// The sun lives at the origin — exactly where the master knob will be. The
// 2D knob overlays it via the DOM, but the WebGL sun pulses with master
// volume so the illusion is that knob == sun.
export function Sun({ accentColor = "#ff9b56" }: { accentColor?: string }) {
  const ref = useRef<Mesh>(null);
  const coronaRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const v = useVolumeStore.getState().master;
    const k = Math.max(0, Math.min(1.6, v / 100));
    const t = clock.elapsedTime;
    if (ref.current) {
      const breathe = 1 + Math.sin(t * 0.6) * 0.04;
      ref.current.scale.setScalar(breathe * (0.95 + k * 0.18));
    }
    if (coronaRef.current) {
      const pulse = 1 + Math.sin(t * 1.4) * 0.06;
      coronaRef.current.scale.setScalar(pulse * (1 + k * 0.4));
      const mat = coronaRef.current.material as MeshBasicMaterial;
      mat.opacity = 0.15 + k * 0.18;
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.45, 48, 48]} />
        <meshBasicMaterial color={new Color(accentColor)} />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial
          color={new Color(accentColor).multiplyScalar(0.6)}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>
      <pointLight color={accentColor} intensity={2.6} distance={20} decay={1.4} />
    </group>
  );
}
