"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  getDefaultMapConfig,
  type MapConfig,
  type ProjectBase,
} from "@/lib/map-data";
import {
  getAgentSprite,
  type SpriteSheet,
  type SpriteFrame,
} from "@/lib/sprites";

// ---------------------------------------------------------------------------
// Native canvas resolution — scaled up with CSS + image-rendering: pixelated
// ---------------------------------------------------------------------------
const NATIVE_W = 480;
const NATIVE_H = 320;
const TARGET_FPS = 8;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AgentPosition {
  agentId: string;
  x: number; // pixel position
  y: number;
  targetX: number;
  targetY: number;
  state: "idle" | "working" | "walking";
  currentProject?: string;
  frame: number;
}

interface WarRoomMapProps {
  agentPositions: AgentPosition[];
  onBaseClick?: (projectId: string) => void;
  onAgentClick?: (agentId: string) => void;
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

/** Render a single pixel-art frame (2-D grid of palette indices) at (x, y). */
function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number[][],
  palette: string[],
) {
  for (let row = 0; row < frame.length; row++) {
    const cols = frame[row];
    for (let col = 0; col < cols.length; col++) {
      const idx = cols[col];
      if (idx === 0) continue; // transparent
      const color = palette[idx];
      if (!color || color === "transparent") continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col, y + row, 1, 1);
    }
  }
}

/** Layer 1 — dark background + subtle grid lines every 16 px. */
function drawGround(
  ctx: CanvasRenderingContext2D,
  mapConfig: MapConfig,
  _frameCount: number,
) {
  // Fill background
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, NATIVE_W, NATIVE_H);

  // Grid lines
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 1;

  const ts = mapConfig.tileSize;
  for (let x = 0; x <= NATIVE_W; x += ts) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, NATIVE_H);
    ctx.stroke();
  }
  for (let y = 0; y <= NATIVE_H; y += ts) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(NATIVE_W, y + 0.5);
    ctx.stroke();
  }
}

/** Layer 2 — circuit-trace paths between bases with blinking green dots. */
function drawCircuitTraces(
  ctx: CanvasRenderingContext2D,
  mapConfig: MapConfig,
  frameCount: number,
) {
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 1;

  for (const path of mapConfig.paths) {
    const wps = path.waypoints;
    if (wps.length < 2) continue;

    // Draw connecting lines between waypoints
    ctx.beginPath();
    ctx.moveTo(wps[0].x + 0.5, wps[0].y + 0.5);
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(wps[i].x + 0.5, wps[i].y + 0.5);
    }
    ctx.stroke();

    // Blinking green data-flow dots along the path
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i];
      const b = wps[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const dotSpacing = 24; // pixels between dots
      const dotCount = Math.max(1, Math.floor(segLen / dotSpacing));

      for (let d = 0; d < dotCount; d++) {
        // Shift the position along the segment based on frameCount for animation
        const t =
          ((d / dotCount + (frameCount * 0.15 + i * 0.3)) % 1 + 1) % 1;
        const dotX = a.x + dx * t;
        const dotY = a.y + dy * t;

        // Only show some dots based on frame phase for blink effect
        const visible = (frameCount + d + i * 3) % 4 < 2;
        if (!visible) continue;

        ctx.fillStyle = "#00ff41";
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin((frameCount + d) * 0.8);
        ctx.fillRect(Math.round(dotX), Math.round(dotY), 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/**
 * Layer 3 + 4 + 5 — base building pixel art, status glow, and label.
 */
function drawBase(
  ctx: CanvasRenderingContext2D,
  base: ProjectBase,
  frameCount: number,
) {
  const px = base.x * 16; // tile -> pixel
  const py = base.y * 16;

  // --- Layer 4: status glow beneath the building ---
  const glowColors: Record<string, string> = {
    active: "#00ff41",
    idle: "#ffa500",
    error: "#ff2d2d",
  };
  const glowColor = glowColors[base.status] ?? "#00ff41";
  const centerX = px + base.width / 2;
  const centerY = py + base.height - 2;
  const radius = Math.max(base.width, base.height) * 0.6;

  ctx.save();
  const grad = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );
  const pulseAlpha = 0.12 + 0.06 * Math.sin(frameCount * 0.5);
  grad.addColorStop(0, glowColor + alphaHex(pulseAlpha));
  grad.addColorStop(1, glowColor + "00");
  ctx.fillStyle = grad;
  ctx.fillRect(
    centerX - radius,
    centerY - radius,
    radius * 2,
    radius * 2,
  );
  ctx.restore();

  // --- Layer 3: pixel-art frame ---
  const fi = frameCount % base.frames.length;
  drawPixelArt(ctx, px, py, base.frames[fi], base.palette);

  // --- Layer 5: project name label above the building ---
  ctx.save();
  ctx.fillStyle = "#8a8aaa";
  ctx.font = "4px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(base.name, px + base.width / 2, py - 2);
  ctx.restore();
}

/** Layer 6 — agent sprites. */
function drawAgent(
  ctx: CanvasRenderingContext2D,
  agent: AgentPosition,
  _frameCount: number,
) {
  const spriteData = getAgentSprite(agent.agentId);
  if (!spriteData) return;

  const sheet = spriteData.sheet;
  let frames: SpriteFrame[];

  switch (agent.state) {
    case "working":
      frames = sheet.working;
      break;
    case "walking": {
      // Pick walk direction based on movement delta
      const dx = agent.targetX - agent.x;
      frames = dx < 0 ? sheet.walkLeft : sheet.walkRight;
      break;
    }
    case "idle":
    default:
      frames = sheet.idle;
      break;
  }

  if (!frames || frames.length === 0) {
    frames = sheet.idle;
  }

  const fi = agent.frame % frames.length;
  const frame = frames[fi];

  // Draw the sprite centered horizontally on the agent position,
  // with the bottom of the sprite at the agent y
  const drawX = Math.round(agent.x - sheet.size / 2);
  const drawY = Math.round(agent.y - sheet.size);

  drawPixelArt(ctx, drawX, drawY, frame, sheet.palette);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Convert a 0-1 alpha value to a 2-char hex suffix. */
function alphaHex(a: number): string {
  const clamped = Math.max(0, Math.min(1, a));
  const byte = Math.round(clamped * 255);
  return byte.toString(16).padStart(2, "0");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WarRoomMap({
  agentPositions,
  onBaseClick,
  onAgentClick,
}: WarRoomMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const mapConfigRef = useRef<MapConfig>(getDefaultMapConfig());

  // ---- Animation loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    let rafId: number;

    function tick(timestamp: number) {
      rafId = requestAnimationFrame(tick);

      // Throttle to ~8 FPS
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) return;
      lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

      const fc = frameCountRef.current;
      const mapCfg = mapConfigRef.current;

      // Clear & draw all layers in order
      drawGround(ctx!, mapCfg, fc);
      drawCircuitTraces(ctx!, mapCfg, fc);

      // Draw bases (building + glow + label)
      for (const base of mapCfg.bases) {
        drawBase(ctx!, base, fc);
      }

      // Draw agents
      for (const agent of agentPositions) {
        drawAgent(ctx!, agent, fc);
      }

      frameCountRef.current = fc + 1;
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [agentPositions]);

  // ---- Click handling ----
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Translate screen coordinates to native canvas coordinates
      const rect = canvas.getBoundingClientRect();
      const scaleX = NATIVE_W / rect.width;
      const scaleY = NATIVE_H / rect.height;
      const nativeX = (e.clientX - rect.left) * scaleX;
      const nativeY = (e.clientY - rect.top) * scaleY;

      const mapCfg = mapConfigRef.current;

      // Check agent hit (16x16 bounding box centred on agent position)
      for (const agent of agentPositions) {
        const spriteData = getAgentSprite(agent.agentId);
        const size = spriteData?.sheet.size ?? 16;
        const ax = agent.x - size / 2;
        const ay = agent.y - size;
        if (
          nativeX >= ax &&
          nativeX <= ax + size &&
          nativeY >= ay &&
          nativeY <= ay + size
        ) {
          onAgentClick?.(agent.agentId);
          return;
        }
      }

      // Check base hit (pixel bounds at base tile position)
      for (const base of mapCfg.bases) {
        const bx = base.x * mapCfg.tileSize;
        const by = base.y * mapCfg.tileSize;
        if (
          nativeX >= bx &&
          nativeX <= bx + base.width &&
          nativeY >= by &&
          nativeY <= by + base.height
        ) {
          onBaseClick?.(base.projectId);
          return;
        }
      }
    },
    [agentPositions, onBaseClick, onAgentClick],
  );

  return (
    <canvas
      ref={canvasRef}
      width={NATIVE_W}
      height={NATIVE_H}
      onClick={handleClick}
      className="w-full h-full cursor-pointer"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export default WarRoomMap;
