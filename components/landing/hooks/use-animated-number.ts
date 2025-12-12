"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(value: number, duration = 800) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef<number>(value);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq) {
      setReduce(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    const from = prevRef.current;
    const to = value;

    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const next = from + (to - from) * easeOutQuint(p);
      setDisplay(next);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = to;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, reduce]);

  return display;
}



