"use client";

import { motion } from "framer-motion";
import { GAME_MODES, DIFFICULTIES, type GameMode, type Difficulty } from "@/game/config";

interface GameModeSelectorProps {
  selectedMode: GameMode;
  selectedDifficulty: Difficulty;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStartGame: () => void;
}

export default function GameModeSelector({
  selectedMode,
  selectedDifficulty,
  onModeChange,
  onDifficultyChange,
  onStartGame,
}: GameModeSelectorProps) {
  const modes = Object.values(GAME_MODES);
  const difficulties = Object.values(DIFFICULTIES);

  return (
    <div className="crt-panel p-4">
      <h3
        className="text-[10px] neon-text-green mb-4"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        SELECT GAME MODE
      </h3>

      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {modes.map((mode) => (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onModeChange(mode.id)}
            className={`p-3 border transition-colors text-left ${
              selectedMode === mode.id
                ? "border-[#00fff7] bg-[#00fff7]/20"
                : "border-[#333] hover:border-[#00fff7]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{mode.icon}</span>
              <span
                className={`text-[8px] ${
                  selectedMode === mode.id ? "text-[#00fff7]" : "text-[#888]"
                }`}
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                {mode.name}
              </span>
            </div>
            <p
              className="text-[6px] text-[#666] leading-relaxed"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              {mode.description}
            </p>
            <div className="flex gap-2 mt-2">
              {mode.hasLives && (
                <span className="text-[6px] text-[#ff6666]">❤ LIVES</span>
              )}
              {mode.hasTimer && (
                <span className="text-[6px] text-[#ffaa00]">
                  ⏱ {mode.timerSeconds}s
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Difficulty Selection */}
      <h4
        className="text-[8px] text-[#888] mb-2"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        DIFFICULTY
      </h4>
      <div className="flex gap-2 mb-4">
        {difficulties.map((diff) => (
          <button
            key={diff.id}
            onClick={() => onDifficultyChange(diff.id)}
            className={`flex-1 py-2 border text-[8px] transition-colors ${
              selectedDifficulty === diff.id
                ? diff.id === "easy"
                  ? "border-[#39ff14] bg-[#39ff14]/20 text-[#39ff14]"
                  : diff.id === "normal"
                  ? "border-[#ffaa00] bg-[#ffaa00]/20 text-[#ffaa00]"
                  : "border-[#ff4444] bg-[#ff4444]/20 text-[#ff4444]"
                : "border-[#333] text-[#666] hover:border-[#555]"
            }`}
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            {diff.name}
          </button>
        ))}
      </div>

      {/* Difficulty Info */}
      <div className="bg-[#111] border border-[#333] p-2 mb-4">
        <div className="grid grid-cols-2 gap-2 text-[6px]" style={{ fontFamily: '"Press Start 2P"' }}>
          <div className="text-[#666]">
            Lives: <span className="text-[#00fff7]">{DIFFICULTIES[selectedDifficulty].lives}</span>
          </div>
          <div className="text-[#666]">
            Ghost Speed:{" "}
            <span className="text-[#00fff7]">
              {Math.round(DIFFICULTIES[selectedDifficulty].ghostSpeedMult * 100)}%
            </span>
          </div>
          <div className="text-[#666]">
            Power-ups:{" "}
            <span className="text-[#00fff7]">
              {Math.round(DIFFICULTIES[selectedDifficulty].powerUpFrequency * 100)}%
            </span>
          </div>
          <div className="text-[#666]">
            Fright Time:{" "}
            <span className="text-[#00fff7]">
              {DIFFICULTIES[selectedDifficulty].frightDuration / 1000}s
            </span>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStartGame}
        className="w-full arcade-btn text-[12px] py-4"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        🎮 START GAME
      </motion.button>
    </div>
  );
}
