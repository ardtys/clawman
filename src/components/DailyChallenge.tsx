"use client";

import { useState, useMemo } from "react";
import { getTodayDateString, loadDailyBest, type DailyScore } from "@/lib/dailyChallenge";

interface DailyChallengeProps {
  currentScore: number;
  currentLevel: number;
  crabs: number;
  walletAddress?: string;
}

export default function DailyChallenge({
  currentScore,
  currentLevel,
  crabs,
  walletAddress,
}: DailyChallengeProps) {
  const todayStr = getTodayDateString();

  const dailyBest = useMemo(() => {
    return loadDailyBest(walletAddress);
  }, [walletAddress]);

  const isNewBest = dailyBest ? currentScore > dailyBest.score : currentScore > 0;

  return (
    <div className="neon-border bg-[#0a0a0a]">
      <div className="px-3 py-2 border-b border-[#39ff14]/30 flex items-center gap-2">
        <span className="text-[10px]">📅</span>
        <span
          className="neon-text-green text-[7px] tracking-wider"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          DAILY CHALLENGE
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div
          className="text-[6px] text-[#555] text-center"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          {todayStr}
        </div>

        {dailyBest ? (
          <div className="text-center space-y-1">
            <div
              className="text-[6px] text-[#888]"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              TODAY&apos;S BEST
            </div>
            <div
              className="text-[10px] neon-text-cyan"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              {dailyBest.score.toLocaleString()}
            </div>
            <div
              className="text-[5px] text-[#555]"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              LVL {dailyBest.level} | {dailyBest.crabs} CRABS
            </div>
          </div>
        ) : (
          <div
            className="text-[6px] text-[#555] text-center"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            NO SCORE YET TODAY
          </div>
        )}

        {isNewBest && currentScore > 0 && (
          <div
            className="text-[6px] text-[#ffd700] text-center animate-pulse"
            style={{
              fontFamily: '"Press Start 2P"',
              textShadow: "0 0 5px #ffd700",
            }}
          >
            NEW DAILY BEST!
          </div>
        )}
      </div>
    </div>
  );
}
