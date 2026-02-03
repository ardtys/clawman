"use client";

import { THEMES, type CRTTheme } from "@/lib/themes";

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="neon-border-cyan bg-[#0a0a0a]">
      <div className="px-3 py-2 border-b border-[#00fff7]/30 flex items-center gap-2">
        <span className="text-[10px]">🎨</span>
        <span
          className="neon-text-cyan text-[7px] tracking-wider"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          CRT THEME
        </span>
      </div>
      <div className="p-2 flex gap-2 justify-center">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`px-3 py-2 text-[6px] border transition-all ${
              currentTheme === theme.id
                ? "border-current scale-105"
                : "border-[#333] opacity-60 hover:opacity-100"
            }`}
            style={{
              fontFamily: '"Press Start 2P"',
              color: theme.primaryCSS,
              backgroundColor: currentTheme === theme.id ? `${theme.primaryCSS}15` : "transparent",
              boxShadow: currentTheme === theme.id ? `0 0 8px ${theme.primaryCSS}40` : "none",
            }}
            title={theme.name}
          >
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{
                backgroundColor: theme.primaryCSS,
                boxShadow: `0 0 6px ${theme.primaryCSS}`,
              }}
            />
            <span>{theme.name.split(" ")[0].toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
