// === CLAW-MAN SKIN SYSTEM ===

export interface ClawSkin {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: number; // Primary Phaser color
  glowColor?: number; // Optional glow effect color
  particleColor?: number; // Trail particle color
  emoji?: string; // If set, renders emoji instead of circle
  rainbow?: boolean; // Color cycles over time
  requiresAchievement?: string; // Achievement ID needed to unlock
}

export const SKINS: ClawSkin[] = [
  {
    id: "default",
    name: "CLASSIC CLAW",
    description: "The original golden claw",
    icon: "🟡",
    color: 0xffd700,
    particleColor: 0xffd700,
  },
  {
    id: "neon",
    name: "NEON CLAW",
    description: "Glowing green neon",
    icon: "🟢",
    color: 0x39ff14,
    glowColor: 0x39ff14,
    particleColor: 0x39ff14,
    requiresAchievement: "crab_king",
  },
  {
    id: "ghost_eater",
    name: "GHOST EATER",
    description: "Purple power of consumed ghosts",
    icon: "🟣",
    color: 0xaa44ff,
    glowColor: 0xaa44ff,
    particleColor: 0xaa44ff,
    requiresAchievement: "ghost_slayer",
  },
  {
    id: "flame",
    name: "FLAME CLAW",
    description: "Burning with combo energy",
    icon: "🔴",
    color: 0xff4400,
    glowColor: 0xff6600,
    particleColor: 0xff4400,
    requiresAchievement: "combo_master",
  },
  {
    id: "diamond",
    name: "DIAMOND CLAW",
    description: "Forged from boss defeats",
    icon: "💎",
    color: 0x88ddff,
    glowColor: 0xaaeeff,
    particleColor: 0x88ddff,
    requiresAchievement: "boss_slayer",
  },
  {
    id: "ghost_skin",
    name: "GHOST FORM",
    description: "Embraced the void",
    icon: "👻",
    color: 0xcccccc,
    particleColor: 0x888888,
    requiresAchievement: "die_hard",
  },
  {
    id: "rainbow",
    name: "RAINBOW CLAW",
    description: "The ultimate prize",
    icon: "🌈",
    color: 0xff0000,
    particleColor: 0xffffff,
    rainbow: true,
    requiresAchievement: "crab_god",
  },
  // New skins
  {
    id: "cyber",
    name: "CYBER CLAW",
    description: "Digital warrior of the net",
    icon: "💠",
    color: 0x00ffff,
    glowColor: 0x00ffff,
    particleColor: 0x00ffff,
  },
  {
    id: "lava",
    name: "LAVA CLAW",
    description: "Forged in volcanic heat",
    icon: "🌋",
    color: 0xff3300,
    glowColor: 0xff6600,
    particleColor: 0xff3300,
  },
  {
    id: "ice",
    name: "ICE CLAW",
    description: "Cold as absolute zero",
    icon: "🧊",
    color: 0xaaddff,
    glowColor: 0x88ccff,
    particleColor: 0xaaddff,
  },
  {
    id: "shadow",
    name: "SHADOW CLAW",
    description: "One with the darkness",
    icon: "🖤",
    color: 0x333333,
    particleColor: 0x222222,
  },
  {
    id: "gold",
    name: "PURE GOLD",
    description: "24 karat excellence",
    icon: "🏆",
    color: 0xffc800,
    glowColor: 0xffdd00,
    particleColor: 0xffc800,
  },
  {
    id: "toxic",
    name: "TOXIC CLAW",
    description: "Radioactive energy",
    icon: "☢️",
    color: 0x88ff00,
    glowColor: 0xaaff44,
    particleColor: 0x88ff00,
  },
  {
    id: "cosmic",
    name: "COSMIC CLAW",
    description: "Power of the universe",
    icon: "🌌",
    color: 0x6644ff,
    glowColor: 0x8866ff,
    particleColor: 0x6644ff,
    rainbow: true,
  },
  {
    id: "pixel",
    name: "PIXEL CLAW",
    description: "8-bit nostalgia",
    icon: "👾",
    color: 0xff00ff,
    particleColor: 0xff00ff,
  },
];

export function getSkin(id: string): ClawSkin {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}

export function getUnlockedSkins(unlockedAchievements: string[]): ClawSkin[] {
  return SKINS.filter(
    (s) => !s.requiresAchievement || unlockedAchievements.includes(s.requiresAchievement)
  );
}

export function loadSkinId(): string {
  try {
    return localStorage.getItem("clawman-skin") || "default";
  } catch {
    return "default";
  }
}

export function saveSkinId(id: string) {
  try {
    localStorage.setItem("clawman-skin", id);
  } catch { /* noop */ }
}
