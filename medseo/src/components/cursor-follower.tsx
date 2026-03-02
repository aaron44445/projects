"use client";

import { useEffect, useRef } from "react";

export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    // Skip on touch devices
    if ("ontouchstart" in window) return;

    const el = dotRef.current;
    if (!el) return;

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function tick() {
      // Smooth spring-like follow using lerp
      current.current.x = lerp(current.current.x, pos.current.x, 0.15);
      current.current.y = lerp(current.current.y, pos.current.y, 0.15);

      const size = hovering.current ? 40 : 15;
      const half = size / 2;
      const opacity = hovering.current ? 0.4 : 0.2;

      el!.style.transform = `translate3d(${current.current.x - half}px, ${current.current.y - half}px, 0)`;
      el!.style.width = `${size}px`;
      el!.style.height = `${size}px`;
      el!.style.opacity = `${opacity}`;

      raf.current = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      el!.style.display = "block";

      const target = e.target as HTMLElement;
      hovering.current = !!target.closest(
        'a, button, [role="button"], input, textarea, select, [tabindex]'
      );
    }

    function onLeave() {
      el!.style.display = "none";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      className="fixed pointer-events-none z-50"
      style={{
        display: "none",
        willChange: "transform",
        background:
          "radial-gradient(circle, rgba(0,255,143,0.4), transparent)",
        borderRadius: "50%",
        transition: "width 0.2s, height 0.2s, opacity 0.2s",
      }}
    />
  );
}
