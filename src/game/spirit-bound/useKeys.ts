import { useEffect, useRef } from "react";

const MOVE_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  " ",
  "z",
  "Z",
  "x",
  "X",
  "Enter",
]);

/** Tracks held keys and fires a callback on fresh key presses. */
export function useKeys(onPress?: (key: string) => void) {
  const held = useRef<Set<string>>(new Set());
  const cb = useRef(onPress);
  cb.current = onPress;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (MOVE_KEYS.has(e.key)) e.preventDefault();
      if (!held.current.has(e.key)) {
        held.current.add(e.key);
        cb.current?.(e.key);
      }
    };
    const up = (e: KeyboardEvent) => held.current.delete(e.key);
    const blur = () => held.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  return held;
}

export const isDown = (held: Set<string>, ...keys: string[]) => keys.some((k) => held.has(k));
