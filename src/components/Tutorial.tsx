"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

interface TutorialStep {
  title: string;
  content: string;
  icon: string;
  tips?: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "WELCOME TO CLAW-MAN",
    content: "You are CLAW-MAN, an autonomous data scavenger in the digital wasteland of Moltbook. Your mission: harvest crabs and avoid ghosts!",
    icon: "🦀",
    tips: ["Move with WASD or Arrow keys", "On mobile, use the D-Pad"],
  },
  {
    title: "COLLECT CRABS",
    content: "Navigate through the maze and collect all the crabs to advance to the next level. Each crab gives you points!",
    icon: "🦀",
    tips: [
      "Regular crabs = 10 points",
      "Golden crabs = 50 points + power-up!",
      "Build combos for multipliers",
    ],
  },
  {
    title: "AVOID GHOSTS",
    content: "Four ghosts patrol the maze, each with unique behavior. Touching them costs you a life!",
    icon: "👻",
    tips: [
      "BLINKY (Red) - Chases you directly",
      "PINKY (Pink) - Ambushes ahead",
      "INKY (Blue) - Unpredictable flanker",
      "CLYDE (Orange) - Shy, scatters when close",
    ],
  },
  {
    title: "POWER-UPS",
    content: "Collect golden crabs to activate Frightened mode - ghosts turn blue and you can eat them for bonus points!",
    icon: "⚡",
    tips: [
      "⚡ Speed Boost - Move faster",
      "🛡️ Shield - Temporary invincibility",
      "🧲 Magnet - Attract nearby crabs",
      "❄️ Freeze - Stop all ghosts",
    ],
  },
  {
    title: "SPECIAL FEATURES",
    content: "Use warp tunnels on the sides to teleport across the maze. Boss ghosts appear every 5 levels!",
    icon: "🌀",
    tips: [
      "Warp tunnels = instant teleport",
      "Boss = 3 hits to defeat",
      "Bonus fruits appear periodically",
    ],
  },
  {
    title: "GAME MODES",
    content: "Choose your challenge: Classic, Endless survival, Time Attack, or Co-op with a friend!",
    icon: "🎮",
    tips: [
      "Classic - Standard gameplay",
      "Endless - Survive as long as possible",
      "Time Attack - 3 minutes to score",
      "Co-op - Play with Player 2!",
    ],
  },
  {
    title: "READY TO PLAY!",
    content: "Good luck, CLAW-MAN! The crabs await your harvest. Press ESC anytime to pause.",
    icon: "🏆",
    tips: [
      "Check achievements for unlocks",
      "Customize your theme and skin",
      "Compete on the leaderboard!",
    ],
  },
];

export default function Tutorial({ isOpen, onClose, onDontShowAgain }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onClose();
    setCurrentStep(0);
  };

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        >
          <motion.div
            key={currentStep}
            initial={{ scale: 0.9, opacity: 0, x: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.9, opacity: 0, x: -50 }}
            className="bg-[#0a0a0a] border-2 border-[#00fff7] p-6 max-w-lg w-full mx-4"
          >
            {/* Progress indicator */}
            <div className="flex gap-1 mb-4">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-colors ${
                    i === currentStep
                      ? "bg-[#00fff7]"
                      : i < currentStep
                      ? "bg-[#00fff7]/50"
                      : "bg-[#333]"
                  }`}
                />
              ))}
            </div>

            {/* Step counter */}
            <div className="text-[7px] text-[#666] mb-2" style={{ fontFamily: '"Press Start 2P"' }}>
              STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
            </div>

            {/* Icon */}
            <div className="text-5xl text-center mb-4">{step.icon}</div>

            {/* Title */}
            <h2
              className="text-[14px] text-[#00fff7] text-center mb-4"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              {step.title}
            </h2>

            {/* Content */}
            <p
              className="text-[9px] text-[#888] text-center mb-4 leading-relaxed"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              {step.content}
            </p>

            {/* Tips */}
            {step.tips && (
              <div className="bg-[#111] border border-[#00fff7]/30 p-3 mb-4">
                <div
                  className="text-[7px] text-[#00fff7] mb-2"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  TIPS:
                </div>
                <ul className="space-y-1">
                  {step.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="text-[7px] text-[#666]"
                      style={{ fontFamily: '"Press Start 2P"' }}
                    >
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`flex-1 border text-[8px] py-2 transition-colors ${
                  currentStep === 0
                    ? "border-[#333] text-[#333] cursor-not-allowed"
                    : "border-[#00fff7]/40 text-[#00fff7] hover:bg-[#00fff7]/10"
                }`}
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                &lt; PREV
              </button>
              <button
                onClick={handleNext}
                className="flex-1 arcade-btn text-[8px] py-2"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? "START!" : "NEXT >"}
              </button>
            </div>

            {/* Don't show again checkbox */}
            <div className="flex items-center justify-center gap-2">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 accent-[#00fff7]"
              />
              <label
                htmlFor="dontShowAgain"
                className="text-[7px] text-[#666] cursor-pointer"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                Don&apos;t show again
              </label>
            </div>

            {/* Skip button */}
            <button
              onClick={handleClose}
              className="w-full mt-4 text-[7px] text-[#666] hover:text-[#888]"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              SKIP TUTORIAL
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
