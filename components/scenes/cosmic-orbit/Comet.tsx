"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Mesh, Vector3 } from "three";
import { play } from "@/lib/audio/presets";
import { useEasterEggStore } from "@/lib/state/use-easter-egg-store";

type Path = { from: Vector3; to: Vector3; lifeMs: number; bornAt: number };

// Occasional comets streak through the scene. Click one for a brief bullet-
// time flash + chromatic aberration spike (driven via CSS variable so it
// influences the global Vignette overlay too).
export function Comet() {
  const ref = useRef<Mesh>(null);
  const pathRef = useRef<Path | null>(null);
  const tailRef = useRef<Mesh>(null);

  const refresh = useMemo(
    () => () => {
      const startSide = Math.random() > 0.5 ? 1 : -1;
      const from = new Vector3(
        startSide * 9,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 2,
      );
      const to = new Vector3(
        -startSide * 9,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 2,
      );
      pathRef.current = { from, to, lifeMs: 4500, bornAt: performance.now() };
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFrame(() => {
    if (!ref.current || !pathRef.current) return;
    const { from, to, lifeMs, bornAt } = pathRef.current;
    const t = Math.min(1, (performance.now() - bornAt) / lifeMs);
    if (t >= 1) {
      // schedule another after a 4–10s wait
      pathRef.current = {
        from: new Vector3(0, 0, 50),
        to: new Vector3(0, 0, 50),
        lifeMs: 8000 + Math.random() * 6000,
        bornAt: performance.now(),
      };
      window.setTimeout(refresh, 4000 + Math.random() * 6000);
      return;
    }
    ref.current.position.lerpVectors(from, to, t);
    if (tailRef.current) {
      tailRef.current.position.copy(ref.current.position);
      tailRef.current.lookAt(to);
    }
  });

  const onClick = () => {
    play("shimmer", 0.5);
    document.documentElement.style.setProperty("--vignette-opacity", "0.85");
    window.setTimeout(
      () => document.documentElement.style.setProperty("--vignette-opacity", "0.6"),
      220,
    );
    if (useEasterEggStore.getState().unlock("supernova")) {
      useEasterEggStore.getState().pushToast({
        text: "comet caught. time bent. you bent it.",
        flavor: "achievement",
      });
    }
  };

  return (
    <group>
      <mesh ref={ref} onClick={onClick}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#f5f2ea" />
      </mesh>
      <mesh ref={tailRef} renderOrder={-1}>
        <coneGeometry args={[0.04, 0.6, 12]} />
        <meshBasicMaterial color="#f5f2ea" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}
