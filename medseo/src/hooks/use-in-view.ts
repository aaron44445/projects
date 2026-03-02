"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight replacement for framer-motion's useInView / whileInView.
 * Returns a ref to attach to the element and a boolean indicating visibility.
 * Once triggered (once=true by default), the element stays "in view" permanently.
 */
export function useInView({
  once = true,
  margin = "-80px",
  threshold = 0,
}: {
  once?: boolean;
  margin?: string;
  threshold?: number;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin: margin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, margin, threshold]);

  return { ref, inView };
}
