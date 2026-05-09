"use client";

import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Mesh, Color, Plane, Vector3, Raycaster, Vector2 } from "three";

type Props = {
  bandIndex: 0 | 1 | 2 | 3 | 4;
  baseRadius: number;
  angularSpeed: number;
  size: number;
  color: string;
  initialAngle: number;
  onRadiusChange: (r: number, baseR: number) => void;
  bandLabel: string;
  onDragStart?: () => void;
  onPlanetClick?: () => void;
  isSelected?: boolean;
  // shrink: 0..1 where 1 = full size, <1 = being yelled at
  shrinkFactor?: number;
  paused?: boolean;
};

const ORBITAL_PLANE = new Plane(new Vector3(0, 0, 1), 0);

export function Planet({
  baseRadius,
  angularSpeed,
  size,
  color,
  initialAngle,
  onRadiusChange,
  onDragStart,
  onPlanetClick,
  isSelected = false,
  shrinkFactor = 1,
  paused = false,
}: Props) {
  const ref = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const selectRingRef = useRef<Mesh>(null);
  const { camera, gl } = useThree();
  const [hover, setHover] = useState(false);

  const angleRef = useRef(initialAngle);
  const radiusRef = useRef(baseRadius);
  const radialVelRef = useRef(0);
  const draggingRef = useRef(false);
  const pointerMovedRef = useRef(false);
  const currentShrink = useRef(1);

  useFrame((_state, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    if (!ref.current) return;

    if (!paused) {
      angleRef.current += angularSpeed * dt;
    }

    if (!draggingRef.current) {
      const k = 4.5;
      const damping = 1.8;
      const accel =
        (baseRadius - radiusRef.current) * k - radialVelRef.current * damping;
      radialVelRef.current += accel * dt;
      radiusRef.current += radialVelRef.current * dt;
    }

    const x = Math.cos(angleRef.current) * radiusRef.current;
    const y = Math.sin(angleRef.current) * radiusRef.current;

    // Lerp shrink factor for smooth shrink animation
    currentShrink.current += (shrinkFactor - currentShrink.current) * 0.12;
    const s = currentShrink.current;

    ref.current.position.set(x, y, 0);
    ref.current.scale.setScalar(s);

    if (haloRef.current) {
      haloRef.current.position.set(x, y, 0);
      const target = hover || draggingRef.current ? 1.6 : 1.2;
      haloRef.current.scale.setScalar(
        haloRef.current.scale.x + (target - haloRef.current.scale.x) * 0.18,
      );
    }

    if (selectRingRef.current) {
      selectRingRef.current.position.set(x, y, 0);
      selectRingRef.current.rotation.z += dt * 1.5;
    }

    onRadiusChange(radiusRef.current, baseRadius);
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      pointerMovedRef.current = true;
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new Raycaster();
      ray.setFromCamera(ndc, camera);
      const hit = new Vector3();
      ray.ray.intersectPlane(ORBITAL_PLANE, hit);
      const r = Math.hypot(hit.x, hit.y);
      const clamped = Math.max(0.45, Math.min(6.5, r));
      radialVelRef.current = (clamped - radiusRef.current) * 12;
      radiusRef.current = clamped;
    };
    const onUp = (e: PointerEvent) => {
      if (draggingRef.current && !pointerMovedRef.current) {
        // It was a click, not a drag
        const target = e.target;
        void target; // suppress lint
        onPlanetClick?.();
      }
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl, onPlanetClick]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    draggingRef.current = true;
    pointerMovedRef.current = false;
    onDragStart?.();
  };

  const selectedColor = new Color(color).multiplyScalar(1.4);

  return (
    <group>
      {/* selection ring — rotates slowly when selected */}
      {isSelected && (
        <mesh ref={selectRingRef}>
          <ringGeometry args={[size * 2.2, size * 2.6, 32]} />
          <meshBasicMaterial
            color={selectedColor}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
      )}

      <mesh ref={haloRef}>
        <sphereGeometry args={[size * 1.7, 16, 16]} />
        <meshBasicMaterial
          color={new Color(color).multiplyScalar(isSelected ? 1.0 : 0.6)}
          transparent
          opacity={isSelected ? 0.3 : 0.18}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={ref}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onPointerDown={onPointerDown}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hover || isSelected ? 1.1 : 0.4}
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>

      {/* static orbit ring */}
      <mesh>
        <ringGeometry args={[baseRadius - 0.005, baseRadius + 0.005, 96]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.18 : 0.08}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
