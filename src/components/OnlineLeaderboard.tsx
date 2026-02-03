"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  level: number;
  crabs: number;
  ghosts: number;
  gameMode: string;
  difficulty: string;
  rank: number;
  timestamp: number;
}

interface OnlineLeaderboardProps {
  onSubmitScore?: (name: string) => void;
  currentScore?: number;
  currentLevel?: number;
  crabs?: number;
  ghosts?: number;
  gameMode?: string;
  difficulty?: string;
}

export default function OnlineLeaderboard({
  onSubmitScore,
  currentScore = 0,
  currentLevel = 1,
  crabs = 0,
  ghosts = 0,
  gameMode = "classic",
  difficulty = "normal",
}: OnlineLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterDiff, setFilterDiff] = useState<string>("all");
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterMode !== "all") params.set("gameMode", filterMode);
      if (filterDiff !== "all") params.set("difficulty", filterDiff);
      params.set("limit", "20");

      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();

      if (data.success) {
        setEntries(data.data);
      } else {
        setError(data.error || "Failed to load leaderboard");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  }, [filterMode, filterDiff]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSubmit = async () => {
    if (!playerName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName.trim(),
          score: currentScore,
          level: currentLevel,
          crabs,
          ghosts,
          gameMode,
          difficulty,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setPlayerRank(data.data.rank);
        setShowSubmit(false);
        fetchLeaderboard();
        onSubmitScore?.(playerName);
      } else {
        setError(data.error || "Failed to submit score");
      }
    } catch (err) {
      setError("Network error");
    }
    setSubmitting(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="crt-panel p-3">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[10px] neon-text-green"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          🌐 GLOBAL LEADERBOARD
        </h3>
        <button
          onClick={fetchLeaderboard}
          className="text-[8px] text-[#888] hover:text-[#00fff7]"
        >
          ↻ REFRESH
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="bg-[#111] text-[7px] text-[#888] border border-[#333] px-1 py-0.5"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          <option value="all">ALL MODES</option>
          <option value="classic">CLASSIC</option>
          <option value="endless">ENDLESS</option>
          <option value="timeAttack">TIME ATTACK</option>
        </select>
        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
          className="bg-[#111] text-[7px] text-[#888] border border-[#333] px-1 py-0.5"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          <option value="all">ALL DIFF</option>
          <option value="easy">EASY</option>
          <option value="normal">NORMAL</option>
          <option value="hard">HARD</option>
        </select>
      </div>

      {/* Leaderboard entries */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="text-[8px] text-[#666] text-center py-4" style={{ fontFamily: '"Press Start 2P"' }}>
            LOADING...
          </div>
        ) : error ? (
          <div className="text-[8px] text-[#ff4444] text-center py-4" style={{ fontFamily: '"Press Start 2P"' }}>
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-[8px] text-[#666] text-center py-4" style={{ fontFamily: '"Press Start 2P"' }}>
            NO ENTRIES YET
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-1 border ${
                index === 0
                  ? "border-[#ffd700] bg-[#ffd700]/10"
                  : index === 1
                  ? "border-[#c0c0c0] bg-[#c0c0c0]/10"
                  : index === 2
                  ? "border-[#cd7f32] bg-[#cd7f32]/10"
                  : "border-[#222]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[8px] w-6 ${
                    index === 0
                      ? "text-[#ffd700]"
                      : index === 1
                      ? "text-[#c0c0c0]"
                      : index === 2
                      ? "text-[#cd7f32]"
                      : "text-[#666]"
                  }`}
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  #{entry.rank}
                </span>
                <div>
                  <div
                    className="text-[7px] text-[#00fff7]"
                    style={{ fontFamily: '"Press Start 2P"' }}
                  >
                    {entry.name}
                  </div>
                  <div
                    className="text-[5px] text-[#555]"
                    style={{ fontFamily: '"Press Start 2P"' }}
                  >
                    LVL {entry.level} | {entry.gameMode.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-[8px] text-[#39ff14]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {entry.score.toLocaleString()}
                </div>
                <div
                  className="text-[5px] text-[#555]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {formatDate(entry.timestamp)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Submit score */}
      {!submitted && currentScore > 0 && (
        <div className="mt-3 pt-3 border-t border-[#333]">
          {!showSubmit ? (
            <button
              onClick={() => setShowSubmit(true)}
              className="w-full arcade-btn text-[8px] py-2"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              SUBMIT YOUR SCORE ({currentScore.toLocaleString()})
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                placeholder="ENTER NAME"
                maxLength={20}
                className="w-full bg-[#111] border border-[#00fff7] text-[8px] text-[#00fff7] px-2 py-2 text-center"
                style={{ fontFamily: '"Press Start 2P"' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSubmit(false)}
                  className="flex-1 border border-[#333] text-[#888] text-[7px] py-1 hover:border-[#555]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!playerName.trim() || submitting}
                  className="flex-1 arcade-btn text-[7px] py-1"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {submitting ? "..." : "SUBMIT"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submitted confirmation */}
      {submitted && playerRank !== null && (
        <div className="mt-3 pt-3 border-t border-[#333] text-center">
          <div
            className="text-[8px] text-[#39ff14]"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            SCORE SUBMITTED!
          </div>
          <div
            className="text-[7px] text-[#888] mt-1"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            YOUR RANK: #{playerRank}
          </div>
        </div>
      )}
    </div>
  );
}
