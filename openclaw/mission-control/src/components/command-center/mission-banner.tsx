"use client";

import { useState } from "react";

export function MissionBanner() {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = async () => {
    if (deploying) return;
    setDeploying(true);
    setDeployed(false);

    try {
      await fetch("/api/deploy-all", { method: "POST" });
      setDeployed(true);
      setTimeout(() => setDeployed(false), 4000);
    } catch {
      // silently fail
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="relative overflow-hidden border-b-2 border-[#ff2d2d]/30 bg-[#0a0a0f]">
      {/* CRT scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)",
          backgroundSize: "100% 2px",
        }}
      />

      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-[#ff2d2d] tracking-wider">
            MISSION CONTROL
          </span>
          <span className="font-[family-name:var(--font-pixel)] text-[7px] text-[#00ff41]/70 hidden lg:inline">
            NEVER STOP. NEVER SLEEP. ACCOMPLISH THE MISSION.
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Deploy All button */}
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className={`
              relative font-[family-name:var(--font-pixel)] text-[8px] tracking-wider
              px-4 py-1.5 border rounded transition-all
              ${deploying
                ? "border-[#ffa500]/50 text-[#ffa500] bg-[#ffa500]/10 cursor-wait"
                : deployed
                  ? "border-[#00ff41]/50 text-[#00ff41] bg-[#00ff41]/10"
                  : "border-[#ff2d2d]/40 text-[#ff2d2d] bg-[#ff2d2d]/5 hover:bg-[#ff2d2d]/15 hover:border-[#ff2d2d]/60 hover:shadow-[0_0_12px_rgba(255,45,45,0.2)] cursor-pointer"
              }
            `}
          >
            {deploying ? "DEPLOYING..." : deployed ? "DEPLOYED ✓" : "DEPLOY ALL"}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[#ff2d2d] animate-pulse shadow-[0_0_6px_rgba(255,45,45,0.6)]" />
            <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ff2d2d]">
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
