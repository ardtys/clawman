"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AchievementPopupProps {
  achievement: { name: string; icon: string; rarity: string } | null;
  onDone: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#39ff14",
  rare: "#00bfff",
  epic: "#bf5fff",
  legendary: "#ffd700",
};

export default function AchievementPopup({ achievement, onDone }: AchievementPopupProps) {
  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [achievement, onDone]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none"
        >
          <div
            className="px-4 py-3 bg-[#0a0a0a] border-2 flex items-center gap-3"
            style={{
              borderColor: RARITY_COLORS[achievement.rarity] || "#39ff14",
              boxShadow: `0 0 20px ${RARITY_COLORS[achievement.rarity] || "#39ff14"}60, inset 0 0 10px ${RARITY_COLORS[achievement.rarity] || "#39ff14"}15`,
            }}
          >
            <span className="text-[20px]">{achievement.icon}</span>
            <div>
              <div
                className="text-[5px] mb-1 uppercase"
                style={{
                  fontFamily: '"Press Start 2P"',
                  color: RARITY_COLORS[achievement.rarity] || "#39ff14",
                }}
              >
                ACHIEVEMENT UNLOCKED!
              </div>
              <div
                className="text-[7px]"
                style={{
                  fontFamily: '"Press Start 2P"',
                  color: RARITY_COLORS[achievement.rarity] || "#39ff14",
                  textShadow: `0 0 8px ${RARITY_COLORS[achievement.rarity] || "#39ff14"}`,
                }}
              >
                {achievement.name}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
