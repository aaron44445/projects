"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BorderBeamCardProps {
  children: ReactNode;
  className?: string;
  duration?: number;
}

export function BorderBeamCard({ children, className, duration = 3 }: BorderBeamCardProps) {
  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      {/* Beam effect - rotating gradient */}
      <div
        className="absolute inset-[-1px] rounded-lg z-0"
        style={{
          background: `conic-gradient(from 0deg, transparent, transparent 340deg, #00FF8F 360deg)`,
          animation: `border-beam ${duration}s linear infinite`,
        }}
      />
      {/* Card content */}
      <div className="relative z-10 rounded-lg bg-[rgba(10,10,11,0.95)] border border-white/10 h-full">
        {children}
      </div>
    </div>
  );
}
