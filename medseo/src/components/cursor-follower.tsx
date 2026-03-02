"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

export function CursorFollower() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);

    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button, [role="button"], input, textarea, select, [tabindex]');
    setIsHovering(!!isInteractive);
  }, []);

  useEffect(() => {
    // Only show on desktop (no touch)
    const isTouchDevice = "ontouchstart" in window;
    if (isTouchDevice) return;

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      animate={{
        x: position.x - (isHovering ? 20 : 7.5),
        y: position.y - (isHovering ? 20 : 7.5),
        width: isHovering ? 40 : 15,
        height: isHovering ? 40 : 15,
        opacity: isHovering ? 0.4 : 0.2,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      style={{
        background: "radial-gradient(circle, rgba(0,255,143,0.4), transparent)",
        borderRadius: "50%",
      }}
    />
  );
}
