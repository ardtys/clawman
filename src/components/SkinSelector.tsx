"use client";

import { useMemo } from "react";
import { SKINS, type ClawSkin } from "@/lib/skins";
import { ACHIEVEMENTS, loadStats } from "@/lib/achievements";

interface SkinSelectorProps {
  currentSkin: string;
  onSkinChange: (skinId: string) => void;
  walletAddress?: string;
}

export default function SkinSelector({ currentSkin, onSkinChange, walletAddress }: SkinSelectorProps) {
  const unlockedAchievements = useMemo(() => {
    const stats = loadStats(walletAddress);
    return new Set(
      ACHIEVEMENTS.filter((a) => a.condition(stats)).map((a) => a.id)
    );
  }, [walletAddress]);

  const isSkinUnlocked = (skin: ClawSkin) => {
    if (!skin.requiresAchievement) return true;
    return unlockedAchievements.has(skin.requiresAchievement);
  };

  return (
    <div className="neon-border-cyan bg-[#0a0a0a]">
      <div className="px-3 py-2 border-b border-[#00fff7]/30 flex items-center gap-2">
        <span className="text-[10px]">🎭</span>
        <span
          className="neon-text-cyan text-[7px] tracking-wider"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          CLAW-MAN SKINS
        </span>
      </div>
      <div className="p-2 grid grid-cols-4 gap-1">
        {SKINS.map((skin) => {
          const unlocked = isSkinUnlocked(skin);
          const selected = currentSkin === skin.id;
          const hexColor = `#${skin.color.toString(16).padStart(6, "0")}`;

          return (
            <button
              key={skin.id}
              onClick={() => unlocked && onSkinChange(skin.id)}
              disabled={!unlocked}
              className={`p-1.5 border transition-all text-center ${
                selected
                  ? "border-[#ffd700] scale-105"
                  : unlocked
                  ? "border-[#333] hover:border-[#555]"
                  : "border-[#1a1a1a] opacity-30 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: selected ? `${hexColor}15` : "transparent",
                boxShadow: selected ? `0 0 8px ${hexColor}40` : "none",
              }}
              title={unlocked ? skin.description : `Locked: ${skin.requiresAchievement}`}
            >
              <div
                className="w-4 h-4 rounded-full mx-auto mb-1"
                style={{
                  background: skin.rainbow
                    ? "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)"
                    : hexColor,
                  boxShadow: unlocked ? `0 0 4px ${hexColor}` : "none",
                }}
              />
              <div
                className="text-[4px] truncate"
                style={{
                  fontFamily: '"Press Start 2P"',
                  color: unlocked ? hexColor : "#333",
                }}
              >
                {unlocked ? skin.name : "LOCKED"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
