"use client";

import { motion } from "framer-motion";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  crabs: number;
  streak: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  playerScore: number;
}

export default function Leaderboard({ entries, playerScore }: LeaderboardProps) {
  // Update CLAW-MAN's score in the leaderboard
  const updatedEntries = entries.map((e) =>
    e.name === "CLAW-MAN" ? { ...e, crabs: playerScore } : e
  );

  // Re-sort by crabs
  const sorted = [...updatedEntries].sort((a, b) => b.crabs - a.crabs);
  sorted.forEach((e, i) => (e.rank = i + 1));

  return (
    <div className="neon-border-pink bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#ff6ec7]/30 flex items-center gap-2">
        <span className="text-[10px]">🏆</span>
        <span className="neon-text-pink text-[8px] tracking-wider">
          TOP CRABS HARVESTED
        </span>
      </div>

      {/* Table */}
      <div className="p-2">
        <table className="w-full" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          <thead>
            <tr className="text-[7px] text-[#ff6ec7]/60">
              <th className="text-left pb-2 w-8">#</th>
              <th className="text-left pb-2">NAME</th>
              <th className="text-right pb-2">🦀</th>
              <th className="text-right pb-2">🔥</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 8).map((entry, index) => (
              <motion.tr
                key={entry.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`text-[7px] ${
                  entry.name === "CLAW-MAN"
                    ? "text-[#ffd700]"
                    : "text-[#39ff14]/70"
                }`}
                style={
                  entry.name === "CLAW-MAN"
                    ? {
                        textShadow: "0 0 5px #ffd700",
                      }
                    : {}
                }
              >
                <td className="py-1 text-left">
                  {entry.rank === 1
                    ? "👑"
                    : entry.rank === 2
                    ? "🥈"
                    : entry.rank === 3
                    ? "🥉"
                    : `${entry.rank}.`}
                </td>
                <td className="py-1 text-left">
                  {entry.name === "CLAW-MAN" ? `> ${entry.name}` : entry.name}
                </td>
                <td className="py-1 text-right">{entry.crabs.toLocaleString()}</td>
                <td className="py-1 text-right">{entry.streak}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
