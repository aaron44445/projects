"use client";

export function MissionBanner() {
  return (
    <div className="relative overflow-hidden border-b-2 border-[#ff2d2d]/30 bg-[#0a0a0f]">
      {/* CRT scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)",
          backgroundSize: "100% 2px",
        }}
      />

      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="font-[family-name:var(--font-pixel)] text-[10px] text-[#ff2d2d] tracking-wider">
            MISSION CONTROL
          </span>
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#00ff41]/80">
            NEVER STOP. NEVER SLEEP.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-[family-name:var(--font-pixel)] text-[8px] text-[#ffa500]/80">
            ACCOMPLISH THE MISSION. 24/7. BY ANY MEANS NECESSARY.
          </span>
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
