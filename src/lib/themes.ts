// === CRT THEME SYSTEM ===

export interface CRTTheme {
  id: string;
  name: string;
  // Phaser colors (hex numbers)
  wallColor: number;
  wallBorderColor: number;
  pathColor: number;
  clawColor: number;
  dotColor: number;
  // CSS colors for React UI
  primaryCSS: string;
  secondaryCSS: string;
  accentCSS: string;
  wallCSS: string;
  // Additional visual properties
  bgCSS?: string;
  glowIntensity?: number;
}

export const THEMES: CRTTheme[] = [
  {
    id: "green",
    name: "GREEN PHOSPHOR",
    wallColor: 0x001a1a,
    wallBorderColor: 0x00fff7,
    pathColor: 0x0a0a0a,
    clawColor: 0xffd700,
    dotColor: 0x39ff14,
    primaryCSS: "#39ff14",
    secondaryCSS: "#00fff7",
    accentCSS: "#ff6ec7",
    wallCSS: "#00fff7",
    bgCSS: "#0a0a0a",
    glowIntensity: 1.0,
  },
  {
    id: "amber",
    name: "AMBER PHOSPHOR",
    wallColor: 0x1a1000,
    wallBorderColor: 0xffaa00,
    pathColor: 0x0a0800,
    clawColor: 0xffdd44,
    dotColor: 0xffcc00,
    primaryCSS: "#ffcc00",
    secondaryCSS: "#ffaa00",
    accentCSS: "#ff6644",
    wallCSS: "#ffaa00",
    bgCSS: "#0a0800",
    glowIntensity: 0.9,
  },
  {
    id: "blue",
    name: "BLUE PHOSPHOR",
    wallColor: 0x000a1a,
    wallBorderColor: 0x4488ff,
    pathColor: 0x050510,
    clawColor: 0x88ddff,
    dotColor: 0x44aaff,
    primaryCSS: "#44aaff",
    secondaryCSS: "#4488ff",
    accentCSS: "#ff44aa",
    wallCSS: "#4488ff",
    bgCSS: "#050510",
    glowIntensity: 1.0,
  },
  {
    id: "neon",
    name: "NEON CYBERPUNK",
    wallColor: 0x1a0033,
    wallBorderColor: 0xff00ff,
    pathColor: 0x0d0015,
    clawColor: 0x00ffff,
    dotColor: 0xff00ff,
    primaryCSS: "#ff00ff",
    secondaryCSS: "#00ffff",
    accentCSS: "#ffff00",
    wallCSS: "#ff00ff",
    bgCSS: "#0d0015",
    glowIntensity: 1.5,
  },
  {
    id: "retro",
    name: "RETRO ARCADE",
    wallColor: 0x222222,
    wallBorderColor: 0xff6600,
    pathColor: 0x111111,
    clawColor: 0xffcc00,
    dotColor: 0xff3300,
    primaryCSS: "#ff6600",
    secondaryCSS: "#ffcc00",
    accentCSS: "#ff0066",
    wallCSS: "#ff6600",
    bgCSS: "#111111",
    glowIntensity: 0.8,
  },
  {
    id: "dark",
    name: "DARK MODE",
    wallColor: 0x1a1a1a,
    wallBorderColor: 0x666666,
    pathColor: 0x0a0a0a,
    clawColor: 0xffffff,
    dotColor: 0xaaaaaa,
    primaryCSS: "#ffffff",
    secondaryCSS: "#888888",
    accentCSS: "#ff4444",
    wallCSS: "#666666",
    bgCSS: "#0a0a0a",
    glowIntensity: 0.5,
  },
  {
    id: "matrix",
    name: "MATRIX",
    wallColor: 0x001100,
    wallBorderColor: 0x00ff00,
    pathColor: 0x000800,
    clawColor: 0x00ff00,
    dotColor: 0x00ff00,
    primaryCSS: "#00ff00",
    secondaryCSS: "#00cc00",
    accentCSS: "#00ff88",
    wallCSS: "#00ff00",
    bgCSS: "#000800",
    glowIntensity: 1.2,
  },
  {
    id: "sunset",
    name: "SUNSET",
    wallColor: 0x1a0a1a,
    wallBorderColor: 0xff6688,
    pathColor: 0x0d050d,
    clawColor: 0xffaa44,
    dotColor: 0xff8866,
    primaryCSS: "#ff6688",
    secondaryCSS: "#ffaa44",
    accentCSS: "#aa44ff",
    wallCSS: "#ff6688",
    bgCSS: "#0d050d",
    glowIntensity: 1.0,
  },
];

export function getTheme(id: string): CRTTheme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function loadThemeId(): string {
  try {
    return localStorage.getItem("clawman-theme") || "green";
  } catch {
    return "green";
  }
}

export function saveThemeId(id: string) {
  try {
    localStorage.setItem("clawman-theme", id);
  } catch { /* noop */ }
}
