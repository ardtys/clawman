// === ACHIEVEMENT SYSTEM ===

export interface PlayerStats {
  totalScore: number;
  highScore: number;
  totalCrabs: number;
  totalGoldenCrabs: number;
  totalGhostsEaten: number;
  highestCombo: number;
  highestLevel: number;
  totalDeaths: number;
  totalFruitsEaten: number;
  totalBossesDefeated: number;
  gamesPlayed: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  condition: (stats: PlayerStats) => boolean;
  skinUnlock?: string; // skin ID unlocked by this achievement
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_blood",
    name: "FIRST BLOOD",
    description: "Eat your first crab",
    icon: "🦀",
    rarity: "common",
    condition: (s) => s.totalCrabs >= 1,
  },
  {
    id: "crab_hunter",
    name: "CRAB HUNTER",
    description: "Harvest 100 crabs",
    icon: "🎯",
    rarity: "common",
    condition: (s) => s.totalCrabs >= 100,
  },
  {
    id: "crab_king",
    name: "CRAB KING",
    description: "Harvest 500 crabs",
    icon: "👑",
    rarity: "rare",
    condition: (s) => s.totalCrabs >= 500,
    skinUnlock: "neon",
  },
  {
    id: "crab_god",
    name: "CRAB GOD",
    description: "Harvest 2000 crabs",
    icon: "⚡",
    rarity: "legendary",
    condition: (s) => s.totalCrabs >= 2000,
    skinUnlock: "rainbow",
  },
  {
    id: "ghost_hunter",
    name: "GHOST HUNTER",
    description: "Eat 10 ghosts",
    icon: "👻",
    rarity: "common",
    condition: (s) => s.totalGhostsEaten >= 10,
  },
  {
    id: "ghost_slayer",
    name: "GHOST SLAYER",
    description: "Eat 50 ghosts",
    icon: "💀",
    rarity: "rare",
    condition: (s) => s.totalGhostsEaten >= 50,
    skinUnlock: "ghost_eater",
  },
  {
    id: "combo_starter",
    name: "COMBO STARTER",
    description: "Reach a 5x combo",
    icon: "🔥",
    rarity: "common",
    condition: (s) => s.highestCombo >= 5,
  },
  {
    id: "combo_master",
    name: "COMBO MASTER",
    description: "Reach a 15x combo",
    icon: "💥",
    rarity: "epic",
    condition: (s) => s.highestCombo >= 15,
    skinUnlock: "flame",
  },
  {
    id: "survivor",
    name: "SURVIVOR",
    description: "Reach level 5",
    icon: "🛡️",
    rarity: "common",
    condition: (s) => s.highestLevel >= 5,
  },
  {
    id: "veteran",
    name: "VETERAN",
    description: "Reach level 10",
    icon: "⭐",
    rarity: "rare",
    condition: (s) => s.highestLevel >= 10,
  },
  {
    id: "legend",
    name: "LEGEND",
    description: "Reach level 20",
    icon: "🏆",
    rarity: "epic",
    condition: (s) => s.highestLevel >= 20,
  },
  {
    id: "boss_slayer",
    name: "BOSS SLAYER",
    description: "Defeat a boss ghost",
    icon: "🐉",
    rarity: "rare",
    condition: (s) => s.totalBossesDefeated >= 1,
    skinUnlock: "diamond",
  },
  {
    id: "boss_master",
    name: "BOSS MASTER",
    description: "Defeat 5 bosses",
    icon: "👹",
    rarity: "epic",
    condition: (s) => s.totalBossesDefeated >= 5,
  },
  {
    id: "golden_touch",
    name: "GOLDEN TOUCH",
    description: "Collect 50 golden crabs",
    icon: "✨",
    rarity: "rare",
    condition: (s) => s.totalGoldenCrabs >= 50,
  },
  {
    id: "high_roller",
    name: "HIGH ROLLER",
    description: "Score over 10,000 points",
    icon: "💰",
    rarity: "rare",
    condition: (s) => s.highScore >= 10000,
  },
  {
    id: "millionaire",
    name: "MILLIONAIRE",
    description: "Score over 100,000 points",
    icon: "💎",
    rarity: "legendary",
    condition: (s) => s.highScore >= 100000,
  },
  {
    id: "fruit_lover",
    name: "FRUIT LOVER",
    description: "Eat 20 bonus fruits",
    icon: "🍒",
    rarity: "common",
    condition: (s) => s.totalFruitsEaten >= 20,
  },
  {
    id: "die_hard",
    name: "DIE HARD",
    description: "Die 50 times (and keep going)",
    icon: "💪",
    rarity: "rare",
    condition: (s) => s.totalDeaths >= 50,
    skinUnlock: "ghost_skin",
  },
  {
    id: "dedicated",
    name: "DEDICATED",
    description: "Play 25 games",
    icon: "🎮",
    rarity: "common",
    condition: (s) => s.gamesPlayed >= 25,
  },
];

export function createDefaultStats(): PlayerStats {
  return {
    totalScore: 0,
    highScore: 0,
    totalCrabs: 0,
    totalGoldenCrabs: 0,
    totalGhostsEaten: 0,
    highestCombo: 0,
    highestLevel: 0,
    totalDeaths: 0,
    totalFruitsEaten: 0,
    totalBossesDefeated: 0,
    gamesPlayed: 0,
  };
}

export function loadStats(walletAddress?: string): PlayerStats {
  try {
    const key = walletAddress ? `clawman-stats-${walletAddress}` : "clawman-stats";
    const raw = localStorage.getItem(key);
    if (raw) return { ...createDefaultStats(), ...JSON.parse(raw) };
  } catch { /* noop */ }
  return createDefaultStats();
}

export function saveStats(stats: PlayerStats, walletAddress?: string) {
  try {
    const key = walletAddress ? `clawman-stats-${walletAddress}` : "clawman-stats";
    localStorage.setItem(key, JSON.stringify(stats));
  } catch { /* noop */ }
}

export function loadUnlockedAchievements(walletAddress?: string): string[] {
  try {
    const key = walletAddress ? `clawman-achievements-${walletAddress}` : "clawman-achievements";
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

export function saveUnlockedAchievements(ids: string[], walletAddress?: string) {
  try {
    const key = walletAddress ? `clawman-achievements-${walletAddress}` : "clawman-achievements";
    localStorage.setItem(key, JSON.stringify(ids));
  } catch { /* noop */ }
}

export function checkNewAchievements(
  stats: PlayerStats,
  alreadyUnlocked: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => !alreadyUnlocked.includes(a.id) && a.condition(stats)
  );
}
