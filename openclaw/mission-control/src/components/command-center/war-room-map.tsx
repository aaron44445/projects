"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  getDefaultMapConfig,
  type MapConfig,
  type ProjectBase,
  type Decoration,
} from "@/lib/map-data";
import {
  getAgentSprite,
  type SpriteFrame,
} from "@/lib/sprites";
import { BUILDING_POSITIONS, getWaypoints, moveToward, WALK_SPEED } from "@/lib/pathfinding";
import type { BuildingId } from "@/lib/job-building-map";

// ---------------------------------------------------------------------------
// Pixel scale — each sprite/building pixel renders as S*S canvas pixels
// ---------------------------------------------------------------------------
const PIXEL_SCALE = 3;

// Draw scale — multiplier for sprites/buildings to make them visually larger
const DRAW_SCALE = 2;
const DS = PIXEL_SCALE * DRAW_SCALE; // each sprite/building pixel = DS*DS canvas pixels

// Logical resolution (matches map-data tile coords)
const LOGICAL_W = 480;
const LOGICAL_H = 320;

// Actual canvas resolution
const CANVAS_W = LOGICAL_W * PIXEL_SCALE;
const CANVAS_H = LOGICAL_H * PIXEL_SCALE;

const TARGET_FPS = 8;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

const S = PIXEL_SCALE; // shorthand

// Sentinel yell interval (~10 seconds at 8fps)
const YELL_CHECK_INTERVAL = 80;
// Speech bubble duration (~3 seconds at 8fps)
const BUBBLE_DURATION = 24;

// Yell phrases
const YELL_PHRASES = ["MOVE IT!", "GET TO WORK!", "NO SLACKING!", "DOUBLE TIME!"];

// Non-barracks buildings for random dispatch
const DISPATCH_BUILDINGS: BuildingId[] = [
  "war-room",
  "outreach-hq",
  "intel-room",
  "content-lab",
  "comms-tower",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AgentPosition {
  agentId: string;
  x: number; // logical pixel position (480x320 space)
  y: number;
  targetX: number;
  targetY: number;
  state: "idle" | "working" | "walking" | "yelled-at";
  currentProject?: string;
  frame: number;
  buildingId?: string;
}

interface AnimatedAgent {
  x: number;
  y: number;
  state: "idle" | "working" | "walking" | "yelled-at";
  buildingId: string;
  waypoints: { x: number; y: number }[];
  waypointIndex: number;
  frame: number;
}

interface YellState {
  active: boolean;
  targetAgentId: string;
  bubbleText: string;
  bubbleFramesLeft: number;
  sentinelMovingToBarracks: boolean;
  dispatchBuildingId: BuildingId; // where to send the idle agent after yell
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

/** Seeded random for consistent terrain noise */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Layer 1 — dark military green terrain with noise texture. */
function drawTerrain(
  ctx: CanvasRenderingContext2D,
  _mapConfig: MapConfig,
  _frameCount: number,
) {
  ctx.fillStyle = "#1a2418";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Sparse noise texture — random dark/light green pixels
  const step = S * 4; // every 4th logical pixel
  for (let x = 0; x < CANVAS_W; x += step) {
    for (let y = 0; y < CANVAS_H; y += step) {
      const r = seededRandom(x * 73 + y * 137);
      if (r > 0.7) {
        const shade = r > 0.85 ? "#253020" : "#162012";
        ctx.fillStyle = shade;
        ctx.fillRect(x, y, S, S);
      }
    }
  }
}

/** Layer 2 — dirt paths between bases with dust motes. */
function drawDirtPaths(
  ctx: CanvasRenderingContext2D,
  mapConfig: MapConfig,
  frameCount: number,
) {
  for (const path of mapConfig.paths) {
    const wps = path.waypoints;
    if (wps.length < 2) continue;

    // Draw wider dark-edge border path first
    ctx.strokeStyle = "#6B5335";
    ctx.lineWidth = S * 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(wps[0].x * S, wps[0].y * S);
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(wps[i].x * S, wps[i].y * S);
    }
    ctx.stroke();

    // Draw inner sandy path
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = S * 2;
    ctx.beginPath();
    ctx.moveTo(wps[0].x * S, wps[0].y * S);
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(wps[i].x * S, wps[i].y * S);
    }
    ctx.stroke();

    // Rough edge noise — random offset pixels along path edges
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i];
      const b = wps[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(segLen / 4);

      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const px = (a.x + dx * t) * S;
        const py = (a.y + dy * t) * S;
        const seed = i * 1000 + s;
        const offsetX = (seededRandom(seed) - 0.5) * S * 3;
        const offsetY = (seededRandom(seed + 500) - 0.5) * S * 3;
        if (seededRandom(seed + 1000) > 0.6) {
          ctx.fillStyle = seededRandom(seed + 2000) > 0.5 ? "#7a6645" : "#6B5335";
          ctx.fillRect(px + offsetX, py + offsetY, S, S);
        }
      }
    }

    // Animated dust motes — tan particles floating upward
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i];
      const b = wps[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      const moteCount = Math.max(1, Math.floor(segLen / 40));

      for (let d = 0; d < moteCount; d++) {
        const t = ((d / moteCount + frameCount * 0.04 + i * 0.3) % 1 + 1) % 1;
        const moteX = (a.x + dx * t) * S;
        const baseY = (a.y + dy * t) * S;
        // Float upward over time
        const floatOffset = ((frameCount * 0.5 + d * 7) % 20) * S * 0.3;
        const moteY = baseY - floatOffset;
        const fade = 1 - floatOffset / (20 * S * 0.3);

        ctx.fillStyle = "#D4C4A8";
        ctx.globalAlpha = (0.15 + 0.25 * fade) * (((frameCount + d) % 3 === 0) ? 1 : 0.5);
        ctx.fillRect(Math.round(moteX), Math.round(moteY), S, S);
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
  statusOverride?: "active" | "idle" | "error",
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
  const effectiveStatus = statusOverride ?? base.status;
  const glowColors: Record<string, string> = {
    active: "#00ff41",
    idle: "#ffa500",
    error: "#ff2d2d",
  };
  const glowColor = glowColors[effectiveStatus] ?? "#00ff41";
  const centerX = cx + scaledW / 2;
  const centerY = cy + scaledH;
  const radius = Math.max(scaledW, scaledH) * 0.7;

  ctx.save();
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  const pulseAlpha = effectiveStatus === "idle"
    ? 0.06 + 0.03 * Math.sin(frameCount * 0.3)  // dim pulse for idle
    : 0.12 + 0.06 * Math.sin(frameCount * 0.5);  // brighter pulse for active
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
  ctx.fillStyle = "#D4C4A8";
  ctx.font = `bold ${Math.max(16, 6 * S)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(base.name, cx + scaledW / 2, cy - 4 * S);

  // Underline
  const textWidth = ctx.measureText(base.name).width;
  ctx.strokeStyle = "#6B5335";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + scaledW / 2 - textWidth / 2, cy - 3 * S);
  ctx.lineTo(cx + scaledW / 2 + textWidth / 2, cy - 3 * S);
  ctx.stroke();
  ctx.restore();
}

/** Layer 3.5 — static decorations (tank, jeep, sandbags, flag). Drawn at 2x size. */
function drawDecorations(
  ctx: CanvasRenderingContext2D,
  decorations: Decoration[],
  frameCount: number,
) {
  for (const deco of decorations) {
    const cx = deco.x * S;
    const cy = deco.y * S;
    const fi = frameCount % deco.frames.length;
    drawPixelArt(ctx, cx, cy, deco.frames[fi], deco.palette, DS);
  }
}

/** Layer 4 — agent sprites with name labels. Drawn at 2x size. */
function drawAgent(
  ctx: CanvasRenderingContext2D,
  agentId: string,
  x: number,
  y: number,
  state: "idle" | "working" | "walking" | "yelled-at",
  frame: number,
  targetX?: number,
  targetY?: number,
) {
  const spriteData = getAgentSprite(agentId);
  if (!spriteData) return;

  const sheet = spriteData.sheet;
  let frames: SpriteFrame[];

  switch (state) {
    case "working":
      frames = sheet.working;
      break;
    case "walking": {
      const dx = (targetX ?? x) - x;
      frames = dx < 0 ? sheet.walkLeft : sheet.walkRight;
      break;
    }
    case "yelled-at":
      frames = sheet.idle; // idle pose when being yelled at
      break;
    case "idle":
    default:
      frames = sheet.idle;
      break;
  }

  if (!frames || frames.length === 0) frames = sheet.idle;

  const fi = frame % frames.length;
  const spriteFrame = frames[fi];

  // Convert logical position to canvas coordinates
  const canvasX = x * S;
  const canvasY = y * S;

  // Draw sprite centered horizontally, bottom-aligned — at 2x size
  const spriteCanvasSize = sheet.size * DS;
  const drawX = Math.round(canvasX - spriteCanvasSize / 2);
  const drawY = Math.round(canvasY - spriteCanvasSize);

  drawPixelArt(ctx, drawX, drawY, spriteFrame, sheet.palette, DS);

  // --- Agent name label below sprite --- (larger, bolder)
  const label = AGENT_LABELS[agentId] ?? agentId.toUpperCase();
  const color = AGENT_COLORS[agentId] ?? "#00ff41";

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

/** Draw a speech bubble above an agent */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
) {
  const bubbleW = text.length * 5 * S + 10 * S;
  const bubbleH = 10 * S;
  const bx = x * S - bubbleW / 2;
  const by = y * S - 40 * S;

  // White bubble with rounded corners
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleW, bubbleH, 4 * S);
  ctx.fill();

  // Black border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = S;
  ctx.stroke();

  // Tail triangle pointing down
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x * S - 4 * S, by + bubbleH);
  ctx.lineTo(x * S, by + bubbleH + 6 * S);
  ctx.lineTo(x * S + 4 * S, by + bubbleH);
  ctx.fill();

  // Tail border
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = S;
  ctx.beginPath();
  ctx.moveTo(x * S - 4 * S, by + bubbleH);
  ctx.lineTo(x * S, by + bubbleH + 6 * S);
  ctx.lineTo(x * S + 4 * S, by + bubbleH);
  ctx.stroke();

  // Text
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${6 * S}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(text, x * S, by + 7 * S);
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

  // Internal animated positions — smooth interpolation state per agent
  const animatedPositions = useRef<Map<string, AnimatedAgent>>(new Map());

  // Sentinel yell state
  const yellState = useRef<YellState | null>(null);
  const yellCooldownRef = useRef(0);

  // Sync animated positions with incoming prop targets
  const syncAnimatedPositions = useCallback(
    (positions: AgentPosition[]) => {
      const map = animatedPositions.current;

      for (const pos of positions) {
        const existing = map.get(pos.agentId);
        const targetBuildingId = pos.buildingId || "barracks";

        if (!existing) {
          // First time seeing this agent — snap to position
          map.set(pos.agentId, {
            x: pos.x,
            y: pos.y,
            state: pos.state === "walking" ? "walking" : pos.state,
            buildingId: targetBuildingId,
            waypoints: [],
            waypointIndex: 0,
            frame: 0,
          });
          continue;
        }

        // Check if agent is currently being yelled at — don't override yell state
        if (yellState.current?.active && yellState.current.targetAgentId === pos.agentId) {
          continue;
        }

        // If sentinel is currently being controlled by yell system, skip prop updates
        if (
          yellState.current?.active &&
          pos.agentId === "enforcer" &&
          yellState.current.sentinelMovingToBarracks
        ) {
          continue;
        }

        // Check if building target changed
        if (existing.buildingId !== targetBuildingId && existing.state !== "walking") {
          // Generate waypoints for smooth walk
          const fromBuilding = existing.buildingId as BuildingId;
          const toBuilding = targetBuildingId as BuildingId;

          // Only pathfind between known buildings
          if (
            BUILDING_POSITIONS[fromBuilding] &&
            BUILDING_POSITIONS[toBuilding]
          ) {
            const waypoints = getWaypoints(fromBuilding, toBuilding);
            existing.waypoints = waypoints;
            existing.waypointIndex = 0;
            existing.state = "walking";
            // Don't update buildingId until arrival
          } else {
            // Unknown building — snap
            existing.x = pos.x;
            existing.y = pos.y;
            existing.buildingId = targetBuildingId;
            existing.state = pos.state;
          }
        } else if (existing.state !== "walking") {
          // Not walking, and same building — update state from props
          existing.state = pos.state;
          // Gently nudge to dock point if not walking
          existing.x = pos.x;
          existing.y = pos.y;
        }
      }
    },
    [],
  );

  // Advance walking agents each tick
  const tickAnimations = useCallback(() => {
    const map = animatedPositions.current;

    for (const [agentId, agent] of map) {
      agent.frame++;

      if (agent.state === "walking" && agent.waypoints.length > 0) {
        const target = agent.waypoints[agent.waypointIndex];
        if (!target) {
          // Done with all waypoints
          agent.state = "idle";
          agent.waypoints = [];
          agent.waypointIndex = 0;
          continue;
        }

        const result = moveToward(agent.x, agent.y, target.x, target.y, WALK_SPEED);
        agent.x = result.x;
        agent.y = result.y;

        if (result.arrived) {
          agent.waypointIndex++;
          if (agent.waypointIndex >= agent.waypoints.length) {
            // Arrived at final destination
            const lastWp = agent.waypoints[agent.waypoints.length - 1];

            // Determine which building we arrived at
            let arrivedBuildingId = agent.buildingId;
            for (const [bid, pos] of Object.entries(BUILDING_POSITIONS)) {
              if (Math.abs(pos.x - lastWp.x) < 10 && Math.abs(pos.y - lastWp.y) < 10) {
                arrivedBuildingId = bid;
                break;
              }
            }

            agent.buildingId = arrivedBuildingId;
            agent.waypoints = [];
            agent.waypointIndex = 0;

            // Check if this was a sentinel arriving at barracks for a yell
            if (
              agentId === "enforcer" &&
              yellState.current?.sentinelMovingToBarracks
            ) {
              yellState.current.sentinelMovingToBarracks = false;
              // Now show the bubble
              yellState.current.bubbleFramesLeft = BUBBLE_DURATION;
              // Mark the target agent as yelled-at
              const targetAgent = map.get(yellState.current.targetAgentId);
              if (targetAgent) {
                targetAgent.state = "yelled-at";
              }
            } else {
              // Normal arrival — determine state from props
              const propAgent = agentPositions.find(
                (p) => p.agentId === agentId,
              );
              agent.state = propAgent?.state === "working" ? "working" : "idle";
            }
          }
        }
      }
    }

    // --- Yell state machine ---
    if (yellState.current?.active) {
      const ys = yellState.current;

      if (!ys.sentinelMovingToBarracks && ys.bubbleFramesLeft > 0) {
        ys.bubbleFramesLeft--;

        if (ys.bubbleFramesLeft <= 0) {
          // Bubble expired — dispatch idle agent to random building
          const targetAgent = map.get(ys.targetAgentId);
          if (targetAgent) {
            const destBuilding = ys.dispatchBuildingId;
            const waypoints = getWaypoints(
              targetAgent.buildingId as BuildingId,
              destBuilding,
            );
            targetAgent.waypoints = waypoints;
            targetAgent.waypointIndex = 0;
            targetAgent.state = "walking";
          }

          // Return sentinel to war-room
          const sentinel = map.get("enforcer");
          if (sentinel && sentinel.buildingId === "barracks") {
            // Find the sentinel's prop building
            const sentinelProp = agentPositions.find(
              (p) => p.agentId === "enforcer",
            );
            const sentinelTarget = (sentinelProp?.buildingId ||
              "war-room") as BuildingId;
            if (sentinelTarget !== "barracks") {
              const waypoints = getWaypoints("barracks", sentinelTarget);
              sentinel.waypoints = waypoints;
              sentinel.waypointIndex = 0;
              sentinel.state = "walking";
            }
          }

          // Clear yell state
          yellState.current = null;
        }
      }
    }
  }, [agentPositions]);

  // Check for idle agents at barracks and trigger sentinel yell
  const checkForYell = useCallback(() => {
    if (yellState.current?.active) return; // Already yelling

    const map = animatedPositions.current;
    const sentinel = map.get("enforcer");
    if (!sentinel) return;
    if (sentinel.state === "walking") return; // Don't interrupt sentinel walks

    // Find idle agents at barracks (excluding sentinel)
    const idleAtBarracks: string[] = [];
    for (const [agentId, agent] of map) {
      if (agentId === "enforcer") continue;
      if (agent.buildingId === "barracks" && agent.state === "idle") {
        idleAtBarracks.push(agentId);
      }
    }

    if (idleAtBarracks.length === 0) return;

    // Pick a random idle agent
    const targetId =
      idleAtBarracks[Math.floor(Math.random() * idleAtBarracks.length)];
    const phrase =
      YELL_PHRASES[Math.floor(Math.random() * YELL_PHRASES.length)];
    const dispatchBuilding =
      DISPATCH_BUILDINGS[
        Math.floor(Math.random() * DISPATCH_BUILDINGS.length)
      ];

    // Is sentinel already at barracks?
    if (sentinel.buildingId === "barracks") {
      // Already there — start yelling immediately
      yellState.current = {
        active: true,
        targetAgentId: targetId,
        bubbleText: phrase,
        bubbleFramesLeft: BUBBLE_DURATION,
        sentinelMovingToBarracks: false,
        dispatchBuildingId: dispatchBuilding,
      };

      // Mark target as yelled-at
      const targetAgent = map.get(targetId);
      if (targetAgent) {
        targetAgent.state = "yelled-at";
      }
    } else {
      // Sentinel needs to walk to barracks first
      const waypoints = getWaypoints(
        sentinel.buildingId as BuildingId,
        "barracks",
      );
      sentinel.waypoints = waypoints;
      sentinel.waypointIndex = 0;
      sentinel.state = "walking";

      yellState.current = {
        active: true,
        targetAgentId: targetId,
        bubbleText: phrase,
        bubbleFramesLeft: 0, // will start when sentinel arrives
        sentinelMovingToBarracks: true,
        dispatchBuildingId: dispatchBuilding,
      };
    }
  }, []);

  // Determine building status based on animated agent positions
  const getBuildingStatus = useCallback(
    (buildingId: string): "active" | "idle" | "error" => {
      const map = animatedPositions.current;
      let hasWorking = false;
      let hasError = false;

      for (const [, agent] of map) {
        if (agent.buildingId === buildingId) {
          if (agent.state === "working") hasWorking = true;
          // Check corresponding prop for error state
          const prop = agentPositions.find(
            (p) => p.agentId === [...map].find(([, a]) => a === agent)?.[0],
          );
          if (prop?.state === "working") {
            // Check the original activity for errors
            hasWorking = true;
          }
        }
      }

      // Also check props directly for error indication
      for (const pos of agentPositions) {
        if (pos.buildingId === buildingId) {
          // The parent maps "error" action to "working" state, but we can check
          // if any agent at this building is in error via the original activities
          if (pos.state === "working") hasWorking = true;
        }
      }

      if (hasError) return "error";
      if (hasWorking) return "active";
      return "idle";
    },
    [agentPositions],
  );

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

      // Sync prop positions to animated state
      syncAnimatedPositions(agentPositions);

      // Advance animations
      tickAnimations();

      // Check for yell opportunity
      yellCooldownRef.current++;
      if (yellCooldownRef.current >= YELL_CHECK_INTERVAL) {
        yellCooldownRef.current = 0;
        checkForYell();
      }

      // --- RENDER ---

      // Layer 1: Terrain
      drawTerrain(ctx!, mapCfg, fc);

      // Layer 2: Dirt paths
      drawDirtPaths(ctx!, mapCfg, fc);

      // Layer 3: Buildings with dynamic glow state
      for (const base of mapCfg.bases) {
        const dynamicStatus = getBuildingStatus(base.projectId);
        drawBase(ctx!, base, fc, dynamicStatus);
      }

      // Layer 3.5: Decorations
      drawDecorations(ctx!, mapCfg.decorations, fc);

      // Layer 4: Agents from animated positions
      const map = animatedPositions.current;
      for (const [agentId, agent] of map) {
        // Determine walk target for sprite direction
        let targetX = agent.x;
        let targetY = agent.y;
        if (
          agent.state === "walking" &&
          agent.waypoints.length > 0 &&
          agent.waypointIndex < agent.waypoints.length
        ) {
          targetX = agent.waypoints[agent.waypointIndex].x;
          targetY = agent.waypoints[agent.waypointIndex].y;
        }

        drawAgent(ctx!, agentId, agent.x, agent.y, agent.state, agent.frame, targetX, targetY);
      }

      // Layer 5: Speech bubbles
      if (yellState.current?.active && !yellState.current.sentinelMovingToBarracks) {
        const ys = yellState.current;
        if (ys.bubbleFramesLeft > 0) {
          const sentinel = map.get("enforcer");
          if (sentinel) {
            drawSpeechBubble(ctx!, sentinel.x, sentinel.y, ys.bubbleText);
          }
        }
      }

      frameCountRef.current = fc + 1;
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [agentPositions, syncAnimatedPositions, tickAnimations, checkForYell, getBuildingStatus]);

  // Click handling — translate screen coords -> logical coords
  // Hit areas are scaled up to match 2x rendered size
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Screen -> canvas -> logical
      const canvasX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      const canvasY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
      const logicalX = canvasX / S;
      const logicalY = canvasY / S;

      const mapCfg = mapConfigRef.current;

      // Check agents first — use animated positions for accuracy
      const hitSize = 16 * DRAW_SCALE;
      const map = animatedPositions.current;
      for (const [agentId, agent] of map) {
        const ax = agent.x - hitSize / 2;
        const ay = agent.y - hitSize;
        if (logicalX >= ax && logicalX <= ax + hitSize && logicalY >= ay && logicalY <= ay + hitSize) {
          onAgentClick?.(agentId);
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
    [onBaseClick, onAgentClick],
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
