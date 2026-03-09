import type { BuildingId } from "./job-building-map";

export interface PathNode {
  id: BuildingId | string;
  x: number;
  y: number;
}

export interface PathEdge {
  from: string;
  to: string;
  waypoints: { x: number; y: number }[];
}

export interface PathGraph {
  nodes: PathNode[];
  edges: PathEdge[];
}

// Building center positions (logical pixels) — matches map-data.ts layout
export const BUILDING_POSITIONS: Record<BuildingId, { x: number; y: number }> = {
  "war-room": { x: 200, y: 46 },
  "outreach-hq": { x: 41, y: 139 },
  "intel-room": { x: 361, y: 139 },
  "content-lab": { x: 41, y: 250 },
  "comms-tower": { x: 360, y: 254 },
  "barracks": { x: 200, y: 248 },
};

// Adjacency graph for BFS pathfinding
const ADJACENCY: Record<BuildingId, BuildingId[]> = {
  "war-room": ["outreach-hq", "intel-room", "barracks"],
  "outreach-hq": ["war-room", "content-lab", "intel-room"],
  "intel-room": ["war-room", "comms-tower", "outreach-hq"],
  "content-lab": ["outreach-hq", "barracks"],
  "comms-tower": ["intel-room", "barracks"],
  "barracks": ["war-room", "content-lab", "comms-tower"],
};

// BFS to find shortest building path
export function findPath(from: BuildingId, to: BuildingId): BuildingId[] {
  if (from === to) return [from];

  const queue: BuildingId[][] = [[from]];
  const visited = new Set<BuildingId>([from]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    for (const neighbor of ADJACENCY[current] || []) {
      if (neighbor === to) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [from, to]; // fallback direct
}

// Convert building path to pixel waypoints for smooth walking
export function getWaypoints(from: BuildingId, to: BuildingId): { x: number; y: number }[] {
  const buildingPath = findPath(from, to);
  return buildingPath.map((id) => BUILDING_POSITIONS[id]);
}

// Movement speed (pixels per frame at 8 FPS)
export const WALK_SPEED = 4;

// Calculate next position moving toward a target at given speed
export function moveToward(
  x: number, y: number,
  targetX: number, targetY: number,
  speed: number
): { x: number; y: number; arrived: boolean } {
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= speed) {
    return { x: targetX, y: targetY, arrived: true };
  }

  return {
    x: x + (dx / dist) * speed,
    y: y + (dy / dist) * speed,
    arrived: false,
  };
}
