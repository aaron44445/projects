"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  getDefaultMapConfig,
  type MapConfig,
  type ProjectBase,
} from "@/lib/map-data";
import {
  getAgentSprite,
  type SpriteFrame,
} from "@/lib/sprites";

// ---------------------------------------------------------------------------
// Pixel scale — each sprite/building pixel renders as S×S canvas pixels
// ---------------------------------------------------------------------------
const PIXEL_SCALE = 3;

// Draw scale — multiplier for sprites/buildings to make them visually larger
const DRAW_SCALE = 2;
const DS = PIXEL_SCALE * DRAW_SCALE; // each sprite/building pixel = DS×DS canvas pixels

// Logical resolution (matches map-data tile coords)
const LOGICAL_W = 480;
const LOGICAL_H = 320;

// Actual canvas resolution
const CANVAS_W = LOGICAL_W * PIXEL_SCALE;
const CANVAS_H = LOGICAL_H * PIXEL_SCALE;

const TARGET_FPS = 8;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

const S = PIXEL_SCALE; // shorthand

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AgentPosition {
  agentId: string;
  x: number; // logical pixel position (480x320 space)
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

// Agent display names
const AGENT_LABELS: Record<string, string> = {
  main: "CLAW",
  marketer: "BLOOM",
  "board-moderator": "BOARD",
  builder: "FORGE",
  enforcer: "SENTINEL",
};

// Agent accent colors for name labels
const AGENT_COLORS: Record<string, string> = {
  main: "#00ff41",
  marketer: "#ff69b4",
  "board-moderator": "#9b59b6",
  builder: "#ff6600",
  enforcer: "#F59E0B",
};

// ---------------------------------------------------------------------------
// Drawing helpers — all coordinates are in CANVAS space (scaled)
// ---------------------------------------------------------------------------

/** Render a pixel-art frame at canvas position (cx, cy). pixelSize controls how large each data pixel is rendered. */
function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  frame: number[][],
  palette: string[],
  pixelSize: number = S,
) {
  for (let row = 0; row < frame.length; row++) {
    const cols = frame[row];
    for (let col = 0; col < cols.length; col++) {
      const idx = cols[col];
      if (idx === 0) continue;
      const color = palette[idx];
      if (!color || color === "transparent") continue;
      ctx.fillStyle = color;
      ctx.fillRect(cx + col * pixelSize, cy + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

/** Layer 1 — dark background + grid. */
function drawGround(
  ctx: CanvasRenderingContext2D,
  _mapConfig: MapConfig,
  _frameCount: number,
) {
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grid every tile (16 * S canvas pixels)
  ctx.strokeStyle = "#13131f";
  ctx.lineWidth = 1;
  const gridStep = 16 * S;

  for (let x = 0; x <= CANVAS_W; x += gridStep) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS_W, y + 0.5);
    ctx.stroke();
  }
}

/** Layer 2 — circuit traces between bases. */
function drawCircuitTraces(
  ctx: CanvasRenderingContext2D,
  mapConfig: MapConfig,
  frameCount: number,
) {
  for (const path of mapConfig.paths) {
    const wps = path.waypoints;
    if (wps.length < 2) continue;

    // Draw line in canvas space — thicker for visibility
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = S * 2;
    ctx.beginPath();
    ctx.moveTo(wps[0].x * S + 0.5, wps[0].y * S + 0.5);
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(wps[i].x * S + 0.5, wps[i].y * S + 0.5);
    }
    ctx.stroke();

    // Animated green data dots — bigger
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i];
      const b = wps[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const dotCount = Math.max(1, Math.floor(segLen / 30));

      for (let d = 0; d < dotCount; d++) {
        const t = ((d / dotCount + frameCount * 0.12 + i * 0.25) % 1 + 1) % 1;
        const dotX = (a.x + dx * t) * S;
        const dotY = (a.y + dy * t) * S;
        const visible = (frameCount + d + i * 3) % 4 < 2;
        if (!visible) continue;

        ctx.fillStyle = "#00ff41";
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin((frameCount + d) * 0.8);
        ctx.fillRect(Math.round(dotX) - 1, Math.round(dotY) - 1, S * 2, S * 2);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** Layer 3 — base building + glow + label. Drawn at 2x size, centered on tile position. */
function drawBase(
  ctx: CanvasRenderingContext2D,
  base: ProjectBase,
  frameCount: number,
) {
  // Original tile position in canvas space
  const origCx = base.x * 16 * S;
  const origCy = base.y * 16 * S;
  const origW = base.width * S;
  const origH = base.height * S;

  // Scaled dimensions
  const scaledW = base.width * DS;
  const scaledH = base.height * DS;

  // Center the larger building on the original position
  const cx = origCx + (origW - scaledW) / 2;
  const cy = origCy + (origH - scaledH) / 2;

  // --- Status glow --- (scaled up)
  const glowColors: Record<string, string> = {
    active: "#00ff41",
    idle: "#ffa500",
    error: "#ff2d2d",
  };
  const glowColor = glowColors[base.status] ?? "#00ff41";
  const centerX = cx + scaledW / 2;
  const centerY = cy + scaledH;
  const radius = Math.max(scaledW, scaledH) * 0.9;

  ctx.save();
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  const pulseAlpha = 0.18 + 0.1 * Math.sin(frameCount * 0.5);
  grad.addColorStop(0, glowColor + alphaHex(pulseAlpha));
  grad.addColorStop(1, glowColor + "00");
  ctx.fillStyle = grad;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  // --- Pixel art building at 2x ---
  const fi = frameCount % base.frames.length;
  drawPixelArt(ctx, cx, cy, base.frames[fi], base.palette, DS);

  // --- Building name label --- (larger font)
  ctx.save();
  ctx.fillStyle = "#c0c0d0";
  ctx.font = `bold ${Math.max(16, 6 * S)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(base.name, cx + scaledW / 2, cy - 4 * S);

  // Underline
  const textWidth = ctx.measureText(base.name).width;
  ctx.strokeStyle = "#3a3a4e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + scaledW / 2 - textWidth / 2, cy - 3 * S);
  ctx.lineTo(cx + scaledW / 2 + textWidth / 2, cy - 3 * S);
  ctx.stroke();
  ctx.restore();
}

/** Layer 4 — agent sprites with name labels. Drawn at 2x size. */
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
      const dx = agent.targetX - agent.x;
      frames = dx < 0 ? sheet.walkLeft : sheet.walkRight;
      break;
    }
    case "idle":
    default:
      frames = sheet.idle;
      break;
  }

  if (!frames || frames.length === 0) frames = sheet.idle;

  const fi = agent.frame % frames.length;
  const frame = frames[fi];

  // Convert logical position to canvas coordinates
  const canvasX = agent.x * S;
  const canvasY = agent.y * S;

  // Draw sprite centered horizontally, bottom-aligned — at 2x size
  const spriteCanvasSize = sheet.size * DS;
  const drawX = Math.round(canvasX - spriteCanvasSize / 2);
  const drawY = Math.round(canvasY - spriteCanvasSize);

  drawPixelArt(ctx, drawX, drawY, frame, sheet.palette, DS);

  // --- Agent name label below sprite --- (larger, bolder)
  const label = AGENT_LABELS[agent.agentId] ?? agent.agentId.toUpperCase();
  const color = AGENT_COLORS[agent.agentId] ?? "#00ff41";

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(14, 5 * S)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.globalAlpha = 0.95;

  // Text shadow for readability
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText(label, canvasX, canvasY + 3 * S);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function alphaHex(a: number): string {
  const clamped = Math.max(0, Math.min(1, a));
  return Math.round(clamped * 255).toString(16).padStart(2, "0");
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let rafId: number;

    function tick(timestamp: number) {
      rafId = requestAnimationFrame(tick);
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed < FRAME_INTERVAL) return;
      lastFrameTimeRef.current = timestamp - (elapsed % FRAME_INTERVAL);

      const fc = frameCountRef.current;
      const mapCfg = mapConfigRef.current;

      drawGround(ctx!, mapCfg, fc);
      drawCircuitTraces(ctx!, mapCfg, fc);

      for (const base of mapCfg.bases) {
        drawBase(ctx!, base, fc);
      }
      for (const agent of agentPositions) {
        drawAgent(ctx!, agent, fc);
      }

      frameCountRef.current = fc + 1;
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [agentPositions]);

  // Click handling — translate screen coords → logical coords
  // Hit areas are scaled up to match 2x rendered size
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Screen → canvas → logical
      const canvasX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      const canvasY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
      const logicalX = canvasX / S;
      const logicalY = canvasY / S;

      const mapCfg = mapConfigRef.current;

      // Check agents first — larger hit area for 2x sprites
      const hitSize = 16 * DRAW_SCALE;
      for (const agent of agentPositions) {
        const ax = agent.x - hitSize / 2;
        const ay = agent.y - hitSize;
        if (logicalX >= ax && logicalX <= ax + hitSize && logicalY >= ay && logicalY <= ay + hitSize) {
          onAgentClick?.(agent.agentId);
          return;
        }
      }

      // Check bases — larger hit area
      for (const base of mapCfg.bases) {
        const bx = base.x * 16;
        const by = base.y * 16;
        const bw = base.width * DRAW_SCALE;
        const bh = base.height * DRAW_SCALE;
        const hitX = bx + (base.width - bw) / 2;
        const hitY = by + (base.height - bh) / 2;
        if (logicalX >= hitX && logicalX <= hitX + bw && logicalY >= hitY && logicalY <= hitY + bh) {
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
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={handleClick}
      className="w-full h-full cursor-pointer"
      style={{ imageRendering: "pixelated", objectFit: "contain" }}
    />
  );
}

export default WarRoomMap;
