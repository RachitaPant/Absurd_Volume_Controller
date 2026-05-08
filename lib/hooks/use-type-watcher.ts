"use client";

import { useEffect, useRef } from "react";

// Watches the keyboard for typed words and fires a callback for matches.
// Buffers up to 32 chars; case-insensitive.
export function useTypeWatcher(words: Record<string, () => void>, enabled = true) {
  const buf = useRef("");
  useEffect(() => {
    if (!enabled) return;
    const list = Object.entries(words);
    const onKey = (e: KeyboardEvent) => {
      // ignore when typing into an input/textarea/contenteditable
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (e.key.length === 1) {
        buf.current = (buf.current + e.key.toLowerCase()).slice(-32);
        for (const [word, cb] of list) {
          if (buf.current.endsWith(word.toLowerCase())) {
            cb();
            buf.current = "";
            break;
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [words, enabled]);
}
