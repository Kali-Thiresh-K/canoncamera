import { useEffect, useState } from "react";

/**
 * Reactive `prefers-reduced-motion` hook.
 * Returns `true` when the user has requested reduced motion.
 * SSR-safe: defaults to `false` on the server / first client render.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  return reduced;
}
