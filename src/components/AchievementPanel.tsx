"use client";

import { useState, useMemo } from "react";
import { ACHIEVEMENTS, type Achievement, type PlayerStats, loadStats } from "@/lib/achievements";

interface AchievementPanelProps {
  walletAddress?: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#39ff14",
  rare: "#00bfff",
  epic: "#bf5fff",
  legendary: "#ffd700",
};

export default function AchievementPanel({ walletAddress }: AchievementPanelProps) {
  const [open, setOpen] = useState(false);
  const unlockedIds = useMemo(() => {
    const stats = loadStats(walletAddress);
    return new Set(
      ACHIEVEMENTS.filter((a) => a.condition(stats)).map((a) => a.id)
    );
  }, [walletAddress]);
  const unlockedCount = unlockedIds.size;
  const totalCount = ACHIEVEMENTS.length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="arcade-btn text-[7px] w-full"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        ACHIEVEMENTS {unlockedCount}/{totalCount}
      </button>
    );
  }

  return (
    <div className="neon-border-cyan bg-[#0a0a0a] max-h-[400px] overflow-y-auto">
      <div className="px-3 py-2 border-b border-[#00fff7]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px]">🏆</span>
          <span
            className="neon-text-cyan text-[7px] tracking-wider"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            ACHIEVEMENTS {unlockedCount}/{totalCount}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[8px] text-[#ff6ec7] hover:text-[#ff9ee7]"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          X
        </button>
      </div>
      <div className="p-2 space-y-1">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = unlockedIds.has(ach.id);
          const color = RARITY_COLORS[ach.rarity];
          return (
            <div
              key={ach.id}
              className={`flex items-center gap-2 px-2 py-1.5 border transition-all ${
                unlocked ? "border-current/30" : "border-[#222] opacity-40"
              }`}
              style={{ borderColor: unlocked ? `${color}40` : undefined }}
            >
              <span className="text-[12px]">{unlocked ? ach.icon : "🔒"}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[5px] truncate"
                  style={{
                    fontFamily: '"Press Start 2P"',
                    color: unlocked ? color : "#555",
                  }}
                >
                  {ach.name}
                </div>
                <div
                  className="text-[4px] mt-0.5 truncate"
                  style={{
                    fontFamily: '"Press Start 2P"',
                    color: unlocked ? "#888" : "#333",
                  }}
                >
                  {ach.description}
                </div>
              </div>
              <span
                className="text-[4px] uppercase"
                style={{
                  fontFamily: '"Press Start 2P"',
                  color: unlocked ? color : "#333",
                }}
              >
                {ach.rarity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
