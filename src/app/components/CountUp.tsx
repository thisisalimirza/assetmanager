"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number into view once (for headline marketing stats).
 * `format` receives the eased current value each frame.
 */
export function CountUp({
  value,
  durationMs = 1100,
  format,
  className,
}: {
  value: number;
  durationMs?: number;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => format(0));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(format(value));
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [format, value]);

  useEffect(() => {
    if (!started) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs);
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(format(from + (value - from) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, durationMs, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
