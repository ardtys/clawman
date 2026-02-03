"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import ArcadeFrame from "@/components/ArcadeFrame";
import LiveFeed from "@/components/LiveFeed";
import type { FeedEntry } from "@/components/LiveFeed";
import Leaderboard from "@/components/Leaderboard";
import type { LeaderboardEntry } from "@/components/Leaderboard";
import Commentary from "@/components/Commentary";
import StatsPanel from "@/components/StatsPanel";
import CrabRain from "@/components/CrabRain";
import DPad from "@/components/DPad";
import WalletButton from "@/components/WalletButton";
import ThemeSelector from "@/components/ThemeSelector";
import AchievementPanel from "@/components/AchievementPanel";
import AchievementPopup from "@/components/AchievementPopup";
import ShareScore from "@/components/ShareScore";
import SkinSelector from "@/components/SkinSelector";
import DailyChallenge from "@/components/DailyChallenge";
import ReplayViewer from "@/components/ReplayViewer";
import type { GameCanvasHandle, GameCallbacks } from "@/components/GameCanvas";
import { createInitialGameState, simulateMoltbookActivity, getRandomCommentary } from "@/lib/gameState";
import { loadThemeId, saveThemeId } from "@/lib/themes";
import { loadSkinId, saveSkinId } from "@/lib/skins";
import { getTodayDateString, saveDailyScore } from "@/lib/dailyChallenge";
import {
  loadStats,
  saveStats,
  checkNewAchievements,
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  createDefaultStats,
  ACHIEVEMENTS,
  type PlayerStats,
} from "@/lib/achievements";
import { useWallet } from "@/contexts/WalletContext";
import { saveWalletProgress, loadWalletProgress } from "@/lib/walletUtils";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="crt-screen flex items-center justify-center bg-[#0a0a0a] mx-auto"
      style={{ width: 21 * 24, height: 21 * 24 + 40 }}
    >
      <div className="text-center">
        <div
          className="neon-text-green text-[10px] animate-pulse"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          INITIALIZING CLAW-MAN...
        </div>
        <div className="mt-3 text-[8px] text-[#555]" style={{ fontFamily: '"Press Start 2P"' }}>
          Loading Phaser Engine
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  const gameState = useRef(createInitialGameState());
  const gameRef = useRef<GameCanvasHandle>(null);
  const { address: walletAddress, connected } = useWallet();

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [crabsHarvested, setCrabsHarvested] = useState(0);
  const [goldenCrabs, setGoldenCrabs] = useState(0);
  const [combo, setCombo] = useState(0);
  const [logs, setLogs] = useState<FeedEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(gameState.current.leaderboard);
  const [commentary, setCommentary] = useState("");
  const [crabRainActive, setCrabRainActive] = useState(false);
  const [themeId, setThemeId] = useState("green");
  const [skinId, setSkinId] = useState("default");
  const [achievementPopup, setAchievementPopup] = useState<{
    name: string;
    icon: string;
    rarity: string;
  } | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    setThemeId(loadThemeId());
    setSkinId(loadSkinId());
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (themeId === "green") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
    }
  }, [themeId]);

  // Save progress to wallet when score changes significantly
  useEffect(() => {
    if (!connected || !walletAddress || score === 0) return;
    const timer = setTimeout(() => {
      saveWalletProgress(walletAddress, {
        highScore: score,
        level,
        crabsHarvested,
        goldenCrabs,
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [score, connected, walletAddress, level, crabsHarvested, goldenCrabs]);

  // Populate initial logs client-side only (avoids hydration mismatch from Date.now())
  useEffect(() => {
    const now = Date.now();
    setLogs([
      { id: "init-1", timestamp: now, message: "CLAW-MAN SYSTEM ONLINE", type: "system" },
      { id: "init-2", timestamp: now, message: "Scanning Moltbook for crab signals...", type: "system" },
      { id: "init-3", timestamp: now, message: "Maze generated from trending threads", type: "system" },
    ]);
  }, []);

  const addLog = useCallback((message: string, type: string) => {
    const entry: FeedEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      message,
      type: type as FeedEntry["type"],
    };
    setLogs((prev) => [...prev.slice(-100), entry]);
  }, []);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    setLeaderboard((prev) => {
      const updated = prev.map((e) =>
        e.name === "CLAW-MAN" ? { ...e, crabs: newScore } : e
      );
      const sorted = [...updated].sort((a, b) => b.crabs - a.crabs);
      sorted.forEach((e, i) => (e.rank = i + 1));
      return sorted;
    });
  }, []);

  const handleCrabConsumed = useCallback((type: string) => {
    if (type === "golden") {
      setGoldenCrabs((prev) => prev + 1);
    }
    setCrabsHarvested((prev) => prev + 1);
  }, []);

  const handleGhostHit = useCallback(() => {
    setLives((prev) => {
      if (prev <= 1) {
        setScore(0);
        setCrabsHarvested(0);
        setGoldenCrabs(0);
        return 3;
      }
      return prev - 1;
    });
  }, []);

  const handleCommentary = useCallback((text: string) => {
    setCommentary(text);
  }, []);

  const handleLevelComplete = useCallback(() => {
    setLevel((prev) => prev + 1);
  }, []);

  const handleComboUpdate = useCallback((newCombo: number) => {
    setCombo(newCombo);
  }, []);

  // Track last known session stats to compute deltas
  const lastSessionStats = useRef<Record<string, number>>({
    ghostsEaten: 0,
    fruitsEaten: 0,
    bossesDefeated: 0,
  });

  const handleAchievementStats = useCallback(
    (stats: Record<string, number>) => {
      const addr = walletAddress || undefined;
      const current = loadStats(addr);
      const prev = lastSessionStats.current;

      // Compute deltas from last known session values
      const deltaGhosts = Math.max(0, (stats.ghostsEaten || 0) - (prev.ghostsEaten || 0));
      const deltaFruits = Math.max(0, (stats.fruitsEaten || 0) - (prev.fruitsEaten || 0));
      const deltaBosses = Math.max(0, (stats.bossesDefeated || 0) - (prev.bossesDefeated || 0));

      // Update last known values
      lastSessionStats.current = {
        ghostsEaten: stats.ghostsEaten || 0,
        fruitsEaten: stats.fruitsEaten || 0,
        bossesDefeated: stats.bossesDefeated || 0,
      };

      const updated: PlayerStats = {
        ...current,
        totalScore: Math.max(current.totalScore, stats.currentScore || 0),
        highScore: Math.max(current.highScore, stats.currentScore || 0),
        totalGhostsEaten: current.totalGhostsEaten + deltaGhosts,
        highestCombo: Math.max(current.highestCombo, stats.highestCombo || 0),
        highestLevel: Math.max(current.highestLevel, stats.currentLevel || 0),
        totalFruitsEaten: current.totalFruitsEaten + deltaFruits,
        totalBossesDefeated: current.totalBossesDefeated + deltaBosses,
      };
      saveStats(updated, addr);

      // Save daily challenge score
      saveDailyScore(
        { date: getTodayDateString(), score: stats.currentScore || 0, level: stats.currentLevel || 1, crabs: stats.crabsEaten || 0 },
        addr
      );

      // Check for new achievements
      const unlocked = loadUnlockedAchievements(addr);
      const newAchievements = checkNewAchievements(updated, unlocked);
      if (newAchievements.length > 0) {
        const allUnlocked = [...unlocked, ...newAchievements.map((a) => a.id)];
        saveUnlockedAchievements(allUnlocked, addr);
        // Show popup for the first new achievement
        setAchievementPopup({
          name: newAchievements[0].name,
          icon: newAchievements[0].icon,
          rarity: newAchievements[0].rarity,
        });
        addLog(`ACHIEVEMENT: ${newAchievements[0].name}!`, "system");
      }
    },
    [walletAddress, addLog]
  );

  // Stable callbacks object
  const gameCallbacks: GameCallbacks = useMemo(
    () => ({
      onScoreUpdate: handleScoreUpdate,
      onCrabConsumed: handleCrabConsumed,
      onGhostHit: handleGhostHit,
      onCommentary: handleCommentary,
      onLog: addLog,
      onLevelComplete: handleLevelComplete,
      onAchievementStats: handleAchievementStats,
      onComboUpdate: handleComboUpdate,
    }),
    [
      handleScoreUpdate,
      handleCrabConsumed,
      handleGhostHit,
      handleCommentary,
      addLog,
      handleLevelComplete,
      handleAchievementStats,
      handleComboUpdate,
    ]
  );

  const triggerCrabRain = useCallback(() => {
    setCrabRainActive(true);
    addLog("CRAB RAIN ACTIVATED! Click the crabs!", "rain");
    gameRef.current?.triggerCrabRain();
  }, [addLog]);

  const handleCrabRainCaught = useCallback(() => {
    setScore((prev) => prev + 25);
    setCrabsHarvested((prev) => prev + 1);
  }, []);

  const handleCrabRainEnd = useCallback(() => {
    setCrabRainActive(false);
    addLog("Crab Rain ended. Back to harvesting.", "system");
  }, [addLog]);

  const handleDPad = useCallback((dir: { x: number; y: number }) => {
    gameRef.current?.setTouchDirection(dir);
  }, []);

  const handleThemeChange = useCallback((newThemeId: string) => {
    setThemeId(newThemeId);
    saveThemeId(newThemeId);
    gameRef.current?.setTheme(newThemeId);
  }, []);

  const handleSkinChange = useCallback((newSkinId: string) => {
    setSkinId(newSkinId);
    saveSkinId(newSkinId);
    gameRef.current?.setSkin(newSkinId);
  }, []);

  const getScoreData = useCallback(() => {
    return gameRef.current?.getScoreData() ?? null;
  }, []);

  // Simulate periodic Moltbook activity with varying delay
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 4000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const activity = simulateMoltbookActivity();
        if (activity.isGolden) {
          addLog(
            `New high-engagement post on ${activity.source}: "${activity.content}" [${activity.engagement} molts]`,
            "spawn"
          );
        } else {
          addLog(
            `Low-engagement ghost at ${activity.source}: "${activity.content}"`,
            "ghost"
          );
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [addLog]);

  // Periodic AI commentary with varying delay
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const scheduleNext = () => {
      const delay = 18000 + Math.random() * 12000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const c = getRandomCommentary();
        setCommentary(c);
        addLog(`[AI] ${c}`, "commentary");
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [addLog]);

  return (
    <ArcadeFrame>
      <CrabRain
        active={crabRainActive}
        onCrabCaught={handleCrabRainCaught}
        onRainEnd={handleCrabRainEnd}
      />

      <AchievementPopup
        achievement={achievementPopup}
        onDone={() => setAchievementPopup(null)}
      />

      <div className="power-on">
        {/* Top Bar: Navigation + Wallet */}
        <div className="max-w-[1200px] mx-auto mb-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                className="text-[7px] text-[#00fff7] border border-[#00fff7]/40 px-2 py-1 hover:bg-[#00fff7]/10 transition-colors"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                &lt; BACK
              </button>
            </Link>
            <div
              className="text-[8px] neon-text-green"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              CLAW-MAN v2.0
            </div>
          </div>
          <WalletButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 max-w-[1200px] mx-auto">
          {/* Left Column: Game + Stats */}
          <div className="space-y-3">
            {/* Game Canvas */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <GameCanvas
                ref={gameRef}
                callbacks={gameCallbacks}
                themeId={themeId}
                skinId={skinId}
              />
              <div className="text-center mt-2 hidden lg:block">
                <span
                  className="text-[7px] text-[#555]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  CLICK GAME THEN USE [WASD / ARROWS] | COLLECT 🦀 | AVOID 👻
                </span>
              </div>
              <div className="text-center mt-1 lg:hidden">
                <span
                  className="text-[6px] text-[#555]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  USE D-PAD BELOW | COLLECT 🦀 | AVOID 👻
                </span>
              </div>
              <DPad onDirectionChange={handleDPad} />
            </motion.div>

            {/* Stats + Commentary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <StatsPanel
                  score={score}
                  crabsHarvested={crabsHarvested}
                  goldenCrabs={goldenCrabs}
                  level={level}
                  lives={lives}
                  combo={combo}
                />
              </motion.div>
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Commentary text={commentary} />
              </motion.div>
            </div>

            {/* Share + Crab Rain Row */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-2 items-stretch"
            >
              <button
                onClick={triggerCrabRain}
                disabled={crabRainActive}
                className="arcade-btn text-[8px] flex-1"
                style={{
                  fontFamily: '"Press Start 2P"',
                }}
              >
                🦀 CRAB RAIN 🦀
              </button>
              <div className="flex-1">
                <ShareScore getScoreData={getScoreData} />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Feed + Leaderboard + Customization */}
          <div className="space-y-3">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="h-[250px] lg:h-[300px]"
            >
              <LiveFeed entries={logs} />
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Leaderboard entries={leaderboard} playerScore={score} />
            </motion.div>

            {/* Theme Selector */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <ThemeSelector currentTheme={themeId} onThemeChange={handleThemeChange} />
            </motion.div>

            {/* Skin Selector */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              <SkinSelector
                currentSkin={skinId}
                onSkinChange={handleSkinChange}
                walletAddress={walletAddress || undefined}
              />
            </motion.div>

            {/* Daily Challenge */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <DailyChallenge
                currentScore={score}
                currentLevel={level}
                crabs={crabsHarvested}
                walletAddress={walletAddress || undefined}
              />
            </motion.div>

            {/* Replay Viewer */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.75 }}
            >
              <ReplayViewer walletAddress={walletAddress || undefined} />
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <AchievementPanel walletAddress={walletAddress || undefined} />
            </motion.div>
          </div>
        </div>
      </div>
    </ArcadeFrame>
  );
}
