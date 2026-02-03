// === GAME SETTINGS SYSTEM ===

import type { GameMode, Difficulty } from "@/game/config";

export interface GameSettings {
  // Audio
  masterVolume: number; // 0-1
  sfxVolume: number; // 0-1
  musicVolume: number; // 0-1
  sfxEnabled: boolean;
  musicEnabled: boolean;

  // Visual
  crtEffects: boolean;
  scanlines: boolean;
  screenCurvature: boolean;
  flickerEffect: boolean;
  screenShake: boolean;
  particleEffects: boolean;

  // Accessibility
  reducedMotion: boolean;
  colorblindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  highContrast: boolean;
  largeText: boolean;

  // Gameplay
  gameMode: GameMode;
  difficulty: Difficulty;
  showTutorial: boolean;
  autoSave: boolean;

  // Controls
  touchControlsEnabled: boolean;
  touchControlsSize: "small" | "medium" | "large";
  vibrationEnabled: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  // Audio
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  sfxEnabled: true,
  musicEnabled: true,

  // Visual
  crtEffects: true,
  scanlines: true,
  screenCurvature: false,
  flickerEffect: false,
  screenShake: true,
  particleEffects: true,

  // Accessibility
  reducedMotion: false,
  colorblindMode: "none",
  highContrast: false,
  largeText: false,

  // Gameplay
  gameMode: "classic",
  difficulty: "normal",
  showTutorial: true,
  autoSave: true,

  // Controls
  touchControlsEnabled: true,
  touchControlsSize: "medium",
  vibrationEnabled: true,
};

const STORAGE_KEY = "clawman-settings";

export function loadSettings(walletAddress?: string): GameSettings {
  try {
    const key = walletAddress ? `${STORAGE_KEY}-${walletAddress}` : STORAGE_KEY;
    const saved = localStorage.getItem(key);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore errors
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings, walletAddress?: string): void {
  try {
    const key = walletAddress ? `${STORAGE_KEY}-${walletAddress}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // Ignore errors
  }
}

export function updateSetting<K extends keyof GameSettings>(
  key: K,
  value: GameSettings[K],
  walletAddress?: string
): GameSettings {
  const current = loadSettings(walletAddress);
  const updated = { ...current, [key]: value };
  saveSettings(updated, walletAddress);
  return updated;
}

// Colorblind filter matrices for CSS
export const COLORBLIND_FILTERS: Record<string, string> = {
  none: "none",
  protanopia: "url(#protanopia)",
  deuteranopia: "url(#deuteranopia)",
  tritanopia: "url(#tritanopia)",
};

// SVG filter definitions for colorblind modes
export const COLORBLIND_SVG_FILTERS = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <defs>
    <filter id="protanopia">
      <feColorMatrix type="matrix" values="
        0.567, 0.433, 0, 0, 0
        0.558, 0.442, 0, 0, 0
        0, 0.242, 0.758, 0, 0
        0, 0, 0, 1, 0
      "/>
    </filter>
    <filter id="deuteranopia">
      <feColorMatrix type="matrix" values="
        0.625, 0.375, 0, 0, 0
        0.7, 0.3, 0, 0, 0
        0, 0.3, 0.7, 0, 0
        0, 0, 0, 1, 0
      "/>
    </filter>
    <filter id="tritanopia">
      <feColorMatrix type="matrix" values="
        0.95, 0.05, 0, 0, 0
        0, 0.433, 0.567, 0, 0
        0, 0.475, 0.525, 0, 0
        0, 0, 0, 1, 0
      "/>
    </filter>
  </defs>
</svg>
`;

// Calculate effective volume
export function getEffectiveVolume(settings: GameSettings, type: "sfx" | "music"): number {
  if (type === "sfx" && !settings.sfxEnabled) return 0;
  if (type === "music" && !settings.musicEnabled) return 0;
  const typeVolume = type === "sfx" ? settings.sfxVolume : settings.musicVolume;
  return settings.masterVolume * typeVolume;
}
