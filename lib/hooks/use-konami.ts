"use client";

import { useEffect, useRef } from "react";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

export function useKonami(onTrigger: () => void) {
  const ref = useRef<string[]>([]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      ref.current.push(k);
      if (ref.current.length > KONAMI.length) ref.current.shift();
      if (ref.current.length === KONAMI.length) {
        const ok = ref.current.every((c, i) => c === KONAMI[i]);
        if (ok) {
          ref.current = [];
          onTrigger();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTrigger]);
}
