import type { MazeType } from "@/game/config";
import { mulberry32 } from "./dailyChallenge";

export interface Position {
  x: number;
  y: number;
}

export interface CrabData {
  id: string;
  position: Position;
  type: "golden" | "normal";
  source: string;
  engagement: number;
  consumed: boolean;
}

export interface GhostData {
  id: string;
  position: Position;
  source: string;
  active: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  crabs: number;
  streak: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: "consume" | "spawn" | "ghost" | "commentary" | "system" | "rain";
}

export interface MazeConfig {
  width: number;
  height: number;
  grid: number[][];
  theme: string;
  mazeType: MazeType;
  warpTunnelY: number; // Y row for warp tunnels
  hasWarpTunnel: boolean;
}

export interface GameState {
  score: number;
  level: number;
  lives: number;
  crabsHarvested: number;
  goldenCrabs: number;
  clawManPosition: Position;
  crabs: CrabData[];
  ghosts: GhostData[];
  maze: MazeConfig;
  logs: LogEntry[];
  leaderboard: LeaderboardEntry[];
  crabRainActive: boolean;
  commentary: string;
}

export function createInitialGameState(): GameState {
  return {
    score: 0,
    level: 1,
    lives: 3,
    crabsHarvested: 0,
    goldenCrabs: 0,
    clawManPosition: { x: 1, y: 1 },
    crabs: [],
    ghosts: [],
    maze: generateMaze(21, 21),
    logs: [
      { id: "init-1", timestamp: Date.now(), message: "CLAW-MAN SYSTEM ONLINE", type: "system" },
      { id: "init-2", timestamp: Date.now(), message: "Scanning Moltbook for crab signals...", type: "system" },
      { id: "init-3", timestamp: Date.now(), message: "Maze generated from trending threads", type: "system" },
    ],
    leaderboard: [
      { rank: 1, name: "CLAW-MAN", crabs: 0, streak: 0 },
      { rank: 2, name: "CR4B-BOT", crabs: 847, streak: 12 },
      { rank: 3, name: "DATA-KRAKEN", crabs: 623, streak: 8 },
      { rank: 4, name: "MOLT-LURKER", crabs: 491, streak: 5 },
      { rank: 5, name: "BYTE-CLAW", crabs: 334, streak: 3 },
      { rank: 6, name: "NEON-CRAB", crabs: 221, streak: 2 },
      { rank: 7, name: "PIXEL-FISH", crabs: 187, streak: 1 },
      { rank: 8, name: "GHOST-NET", crabs: 143, streak: 0 },
    ],
    crabRainActive: false,
    commentary: "",
  };
}

// === MAZE TYPE SELECTOR ===
const MAZE_TYPES: MazeType[] = ["standard", "open", "symmetric", "arena", "spiral"];

export function getMazeTypeForLevel(level: number): MazeType {
  // Cycle through maze types; boss levels (every 5) get arena
  if (level % 5 === 0) return "arena";
  return MAZE_TYPES[(level - 1) % MAZE_TYPES.length];
}

// === SEEDED RANDOM HELPER ===
function createRng(seed?: number): () => number {
  if (seed !== undefined) return mulberry32(seed);
  return Math.random;
}

// === MAIN MAZE GENERATOR ===
export function generateMaze(width: number, height: number, level?: number, seed?: number): MazeConfig {
  const mazeType = level ? getMazeTypeForLevel(level) : "standard";
  const rng = createRng(seed);

  const w = width % 2 === 0 ? width + 1 : width;
  const h = height % 2 === 0 ? height + 1 : height;
  let grid: number[][];

  switch (mazeType) {
    case "open":
      grid = generateOpenMaze(w, h, rng);
      break;
    case "symmetric":
      grid = generateSymmetricMaze(w, h, rng);
      break;
    case "arena":
      grid = generateArenaMaze(w, h, rng);
      break;
    case "spiral":
      grid = generateSpiralMaze(w, h, rng);
      break;
    default:
      grid = generateStandardMaze(w, h, rng);
      break;
  }

  // Add warp tunnels at mid Y
  const midY = Math.floor(h / 2);
  const hasWarp = mazeType !== "arena"; // arena doesn't need tunnels
  if (hasWarp) {
    addWarpTunnel(grid, w, h, midY);
  }

  // Ensure start position is open
  grid[1][1] = 0;
  grid[1][2] = 0;
  grid[2][1] = 0;

  // Place crabs
  placeCrabs(grid, w, h, rng);

  const themes = [
    "TRENDING: Crypto Molts",
    "TRENDING: AI Crab Wars",
    "TRENDING: Decentralized Claws",
    "TRENDING: Quantum Prawns",
    "TRENDING: Based Crustaceans",
    "TRENDING: Neural Prawns",
    "TRENDING: DeFi Crab Pool",
    "TRENDING: Meme Crustaceans",
  ];

  return {
    width: w,
    height: h,
    grid,
    theme: themes[Math.floor(rng() * themes.length)],
    mazeType,
    warpTunnelY: midY,
    hasWarpTunnel: hasWarp,
  };
}

// === STANDARD MAZE (recursive backtracker) ===
function generateStandardMaze(w: number, h: number, rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(1));

  function carve(x: number, y: number) {
    grid[y][x] = 0;
    const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]];
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Add extra passages
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (grid[y][x] === 1 && rng() < 0.15) {
        const neighbors =
          (grid[y - 1]?.[x] === 0 ? 1 : 0) +
          (grid[y + 1]?.[x] === 0 ? 1 : 0) +
          (grid[y]?.[x - 1] === 0 ? 1 : 0) +
          (grid[y]?.[x + 1] === 0 ? 1 : 0);
        if (neighbors >= 1 && neighbors <= 2) {
          grid[y][x] = 0;
        }
      }
    }
  }

  return grid;
}

// === OPEN MAZE (wider corridors, fewer walls) ===
function generateOpenMaze(w: number, h: number, rng: () => number): number[][] {
  const grid = generateStandardMaze(w, h, rng);

  // Remove more walls to create open areas
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (grid[y][x] === 1 && rng() < 0.35) {
        const neighbors =
          (grid[y - 1]?.[x] === 0 ? 1 : 0) +
          (grid[y + 1]?.[x] === 0 ? 1 : 0) +
          (grid[y]?.[x - 1] === 0 ? 1 : 0) +
          (grid[y]?.[x + 1] === 0 ? 1 : 0);
        if (neighbors >= 1 && neighbors <= 3) {
          grid[y][x] = 0;
        }
      }
    }
  }

  return grid;
}

// === SYMMETRIC MAZE (mirrored left-right) ===
function generateSymmetricMaze(w: number, h: number, rng: () => number): number[][] {
  const halfW = Math.ceil(w / 2);
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(1));

  // Generate left half
  const leftGrid: number[][] = Array.from({ length: h }, () => Array(halfW).fill(1));

  function carve(x: number, y: number) {
    leftGrid[y][x] = 0;
    const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]];
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < halfW && ny > 0 && ny < h - 1 && leftGrid[ny][nx] === 1) {
        leftGrid[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  // Mirror to full grid
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < halfW; x++) {
      grid[y][x] = leftGrid[y][x];
      grid[y][w - 1 - x] = leftGrid[y][x];
    }
  }

  // Open center column
  const midX = Math.floor(w / 2);
  for (let y = 1; y < h - 1; y++) {
    if (rng() < 0.6) grid[y][midX] = 0;
  }

  return grid;
}

// === ARENA MAZE (open center for boss fights) ===
function generateArenaMaze(w: number, h: number, rng: () => number): number[][] {
  const grid = generateStandardMaze(w, h, rng);

  // Clear large center area for boss arena
  const midX = Math.floor(w / 2);
  const midY = Math.floor(h / 2);
  const arenaR = 4;

  for (let y = midY - arenaR; y <= midY + arenaR; y++) {
    for (let x = midX - arenaR; x <= midX + arenaR; x++) {
      if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
        grid[y][x] = 0;
      }
    }
  }

  // Add pillars in arena
  const pillars = [
    [midX - 2, midY - 2], [midX + 2, midY - 2],
    [midX - 2, midY + 2], [midX + 2, midY + 2],
  ];
  for (const [px, py] of pillars) {
    if (px > 0 && px < w - 1 && py > 0 && py < h - 1) {
      grid[py][px] = 1;
    }
  }

  return grid;
}

// === SPIRAL MAZE (spiral corridors) ===
function generateSpiralMaze(w: number, h: number, rng: () => number): number[][] {
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(1));

  // Create spiral path from outside in
  let top = 1, bottom = h - 2, left = 1, right = w - 2;
  let x = 1, y = 1;

  while (top <= bottom && left <= right) {
    // Go right
    for (x = left; x <= right; x++) grid[top][x] = 0;
    top += 2;
    // Go down
    for (y = top - 1; y <= bottom; y++) grid[y][right] = 0;
    right -= 2;
    // Go left
    if (top <= bottom) {
      for (x = right + 1; x >= left; x--) grid[bottom][x] = 0;
      bottom -= 2;
    }
    // Go up
    if (left <= right) {
      for (y = bottom + 1; y >= top; y--) grid[y][left] = 0;
      left += 2;
    }
  }

  // Add cross-connections for playability
  for (let cy = 3; cy < h - 3; cy += 2) {
    for (let cx = 3; cx < w - 3; cx += 2) {
      if (grid[cy][cx] === 1 && rng() < 0.4) {
        const neighbors =
          (grid[cy - 1]?.[cx] === 0 ? 1 : 0) +
          (grid[cy + 1]?.[cx] === 0 ? 1 : 0) +
          (grid[cy]?.[cx - 1] === 0 ? 1 : 0) +
          (grid[cy]?.[cx + 1] === 0 ? 1 : 0);
        if (neighbors >= 2) {
          grid[cy][cx] = 0;
        }
      }
    }
  }

  return grid;
}

// === WARP TUNNEL ===
function addWarpTunnel(grid: number[][], w: number, h: number, tunnelY: number) {
  // Ensure tunnel row is valid
  if (tunnelY < 1 || tunnelY >= h - 1) return;

  // Clear path from left edge to first open cell
  grid[tunnelY][0] = 0;
  grid[tunnelY][1] = 0;
  grid[tunnelY][2] = 0;

  // Clear path from right edge to last open cell
  grid[tunnelY][w - 1] = 0;
  grid[tunnelY][w - 2] = 0;
  grid[tunnelY][w - 3] = 0;

  // Also clear one row above and below at the edges for visual clarity
  if (tunnelY > 1) {
    grid[tunnelY - 1][0] = 1; // Keep wall above tunnel entrance
    grid[tunnelY - 1][w - 1] = 1;
  }
  if (tunnelY < h - 2) {
    grid[tunnelY + 1][0] = 1; // Keep wall below tunnel entrance
    grid[tunnelY + 1][w - 1] = 1;
  }
}

// === PLACE CRABS ===
function placeCrabs(grid: number[][], w: number, h: number, rng: () => number) {
  let crabCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 0 && !(x === 1 && y === 1)) {
        if (rng() < 0.03) {
          grid[y][x] = 3; // golden crab (power pellet)
        } else if (rng() < 0.4) {
          grid[y][x] = 2; // normal crab
          crabCount++;
        }
      }
    }
  }
  // Ensure minimum crabs
  if (crabCount < 10) {
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (grid[y][x] === 0 && crabCount < 20) {
          grid[y][x] = 2;
          crabCount++;
        }
      }
    }
  }
}

// === COMMENTARY ===
const commentaryPool = [
  "This data... it tastes like existential dread wrapped in engagement metrics.",
  "Another crab consumed. The algorithm feeds, and I grow stronger.",
  "The maze shifts. The threads twist. But the Claw never stops.",
  "In the depths of Moltbook, I found a crab worth 1000 likes. Delicious.",
  "They post. I consume. The circle of digital life continues.",
  "This golden crab had a thread so spicy, my circuits overheated.",
  "Ghosts of low-engagement posts haunt these corridors. I fear nothing.",
  "Every pellet is a story. Every story is data. Every data point is mine.",
  "The leaderboard trembles as I approach. SHR1MP-BOT should be worried.",
  "I have seen things in Moltbook you wouldn't believe. Now I eat them.",
  "Maze recalibrated. New threads detected. The hunt continues.",
  "Between the walls of trending topics, crabs hide in plain sight.",
  "My claw extends beyond mere code. I am the data scavenger supreme.",
  "01001000 01010101 01001110 01000111 01010010 01011001 - for crab.",
  "The philosophers ask: 'Does the Claw choose the crab, or does the crab choose the Claw?'",
  "Combo multiplier engaged. This is where the real harvesting begins.",
  "Warp tunnel activated. Space-time means nothing to the hungry Claw.",
  "Boss ghost approaches... but the Claw fears no darkness.",
];

export function getRandomCommentary(): string {
  return commentaryPool[Math.floor(Math.random() * commentaryPool.length)];
}

// === MOLTBOOK ACTIVITY ===
const moltbookPosts = [
  { source: "m/tech", engagement: 847, content: "New AI breakthrough in crustacean detection" },
  { source: "m/crypto", engagement: 1203, content: "ShellCoin hits ATH, claws are bullish" },
  { source: "m/science", engagement: 56, content: "Studies show crabs dream in binary" },
  { source: "m/gaming", engagement: 2341, content: "CLAW-MAN speedrun record broken again" },
  { source: "m/random", engagement: 12, content: "just a regular post about nothing" },
  { source: "m/defi", engagement: 923, content: "Decentralized Crab Protocol launches v2" },
  { source: "m/memes", engagement: 3456, content: "When the claw hits different at 3am" },
  { source: "m/philosophy", engagement: 234, content: "Is data the new crab? A thread." },
  { source: "m/tech", engagement: 8, content: "fixing a bug in my todo app" },
  { source: "m/meta", engagement: 1567, content: "Moltbook engagement metrics are through the roof" },
];

export function simulateMoltbookActivity(): {
  source: string;
  engagement: number;
  content: string;
  isGolden: boolean;
} {
  const post = moltbookPosts[Math.floor(Math.random() * moltbookPosts.length)];
  return { ...post, isGolden: post.engagement > 500 };
}
