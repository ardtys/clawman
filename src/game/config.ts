export const TILE_SIZE = 24;
export const GAME_SPEED = 30;
export const GHOST_SPEED = 20;
export const MAZE_COLS = 21;
export const MAZE_ROWS = 21;

export const COLORS = {
  WALL: 0x00fff7,
  WALL_DARK: 0x004444,
  PATH: 0x0a0a0a,
  CLAW: 0xffd700,
  CRAB: 0xff6600,
  GOLDEN_CRAB: 0xffd700,
  GHOST_COLORS: [0xff0000, 0xff69b4, 0x00bfff, 0xffa500],
  DOT: 0x39ff14,
};

export const CELL_TYPES = {
  WALL: 1,
  EMPTY: 0,
  CRAB: 2,
  GOLDEN_CRAB: 3,
  POWER_UP: 4,
};

// === POWER-UP SYSTEM ===
export type PowerUpType = "speed" | "shield" | "magnet" | "freeze";

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  icon: string;
  color: number;
  duration: number; // ms
  description: string;
}

export const POWER_UPS: Record<PowerUpType, PowerUpConfig> = {
  speed: {
    type: "speed",
    name: "SPEED BOOST",
    icon: "⚡",
    color: 0xffff00,
    duration: 5000,
    description: "Move 50% faster",
  },
  shield: {
    type: "shield",
    name: "SHIELD",
    icon: "🛡️",
    color: 0x00ffff,
    duration: 8000,
    description: "Immune to ghost damage",
  },
  magnet: {
    type: "magnet",
    name: "CRAB MAGNET",
    icon: "🧲",
    color: 0xff00ff,
    duration: 6000,
    description: "Attract nearby crabs",
  },
  freeze: {
    type: "freeze",
    name: "FREEZE",
    icon: "❄️",
    color: 0x88ddff,
    duration: 4000,
    description: "Freeze all ghosts",
  },
};

export const POWER_UP_SPAWN_CHANCE = 0.02; // 2% chance per crab eaten
export const POWER_UP_SPAWN_INTERVAL = 20000; // Spawn every 20s minimum

// === GAME MODES ===
export type GameMode = "classic" | "endless" | "timeAttack" | "coop";

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  hasLives: boolean;
  hasTimer: boolean;
  timerSeconds?: number;
  difficultyScaling: boolean;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    id: "classic",
    name: "CLASSIC",
    description: "Standard gameplay with levels and lives",
    icon: "🎮",
    hasLives: true,
    hasTimer: false,
    difficultyScaling: true,
  },
  endless: {
    id: "endless",
    name: "ENDLESS",
    description: "Survive as long as possible, difficulty increases",
    icon: "♾️",
    hasLives: true,
    hasTimer: false,
    difficultyScaling: true,
  },
  timeAttack: {
    id: "timeAttack",
    name: "TIME ATTACK",
    description: "Score as much as possible in 3 minutes",
    icon: "⏱️",
    hasLives: false,
    hasTimer: true,
    timerSeconds: 180,
    difficultyScaling: false,
  },
  coop: {
    id: "coop",
    name: "CO-OP",
    description: "Play with a friend locally",
    icon: "👥",
    hasLives: true,
    hasTimer: false,
    difficultyScaling: true,
  },
};

// === DIFFICULTY SETTINGS ===
export type Difficulty = "easy" | "normal" | "hard";

export interface DifficultyConfig {
  id: Difficulty;
  name: string;
  ghostSpeedMult: number;
  playerSpeedMult: number;
  lives: number;
  powerUpFrequency: number; // multiplier
  frightDuration: number; // ms
  comboWindow: number; // ms
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: "easy",
    name: "EASY",
    ghostSpeedMult: 0.7,
    playerSpeedMult: 1.1,
    lives: 5,
    powerUpFrequency: 1.5,
    frightDuration: 12000,
    comboWindow: 3000,
  },
  normal: {
    id: "normal",
    name: "NORMAL",
    ghostSpeedMult: 1.0,
    playerSpeedMult: 1.0,
    lives: 3,
    powerUpFrequency: 1.0,
    frightDuration: 8000,
    comboWindow: 2000,
  },
  hard: {
    id: "hard",
    name: "HARD",
    ghostSpeedMult: 1.4,
    playerSpeedMult: 0.95,
    lives: 2,
    powerUpFrequency: 0.5,
    frightDuration: 5000,
    comboWindow: 1500,
  },
};

// === SPECIAL GHOST TYPES ===
export type SpecialGhostType = "teleporter" | "splitter";

export interface SpecialGhostConfig {
  type: SpecialGhostType;
  name: string;
  color: number;
  ability: string;
  spawnLevel: number; // Minimum level to appear
}

export const SPECIAL_GHOSTS: Record<SpecialGhostType, SpecialGhostConfig> = {
  teleporter: {
    type: "teleporter",
    name: "PHANTOM",
    color: 0x9900ff,
    ability: "Teleports randomly every 5 seconds",
    spawnLevel: 8,
  },
  splitter: {
    type: "splitter",
    name: "MITOSIS",
    color: 0x00ff99,
    ability: "Splits into 2 smaller ghosts when hit",
    spawnLevel: 12,
  },
};

// Ghost personality names (OG Pac-Man)
export const GHOST_NAMES = ["BLINKY", "PINKY", "INKY", "CLYDE"];
export const GHOST_NICKNAMES = ["SHADOW", "SPEEDY", "BASHFUL", "POKEY"];
export const GHOST_BEHAVIORS = [
  "Direct chaser - targets your tile",
  "Ambusher - targets 4 tiles ahead",
  "Flanker - unpredictable movement",
  "Shy - chases far, scatters close",
];

// Boss config
export const BOSS_LEVEL_INTERVAL = 5; // Boss every N levels
export const BOSS_HP = 3;
export const BOSS_SPEED_MULT = 0.7; // Slower but smarter
export const BOSS_SCORE = 5000;

// Combo config
export const COMBO_WINDOW_MS = 2000; // Time window to maintain combo
export const COMBO_MAX = 20;

// Warp tunnel Y position (row index)
export const WARP_TUNNEL_ROW_OFFSET = 0; // Will be set to maze midY

// Maze types
export type MazeType = "standard" | "open" | "symmetric" | "arena" | "spiral";

// Fruit config
export const FRUIT_EMOJIS = ["🍒", "🍓", "🍊", "🍎", "🍇", "🍈", "🔔", "🔑"];
export const FRUIT_POINTS = [100, 300, 500, 700, 1000, 2000, 3000, 5000];
