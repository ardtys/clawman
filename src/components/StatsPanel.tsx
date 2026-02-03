"use client";

import { motion } from "framer-motion";

interface StatsPanelProps {
  score: number;
  crabsHarvested: number;
  goldenCrabs: number;
  level: number;
  lives: number;
  combo?: number;
}

export default function StatsPanel({
  score,
  crabsHarvested,
  goldenCrabs,
  level,
  lives,
  combo = 0,
}: StatsPanelProps) {
  return (
    <div className="neon-border-cyan bg-[#0a0a0a]">
      <div className="px-3 py-2 border-b border-[#00fff7]/30 flex items-center gap-2">
        <span className="text-[10px]">📊</span>
        <span
          className="neon-text-cyan text-[8px] tracking-wider"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          MISSION STATS
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-3">
        <StatItem label="SCORE" value={score.toLocaleString()} color="#39ff14" />
        <StatItem label="LEVEL" value={`${level}`} color="#00fff7" />
        <StatItem label="CRABS" value={`${crabsHarvested}`} icon="🦀" color="#ff6600" />
        <StatItem label="GOLDEN" value={`${goldenCrabs}`} icon="✨" color="#ffd700" />
        <StatItem label="LIVES" value={"❤️".repeat(Math.max(0, lives))} color="#ff6ec7" />
        {combo >= 2 ? (
          <StatItem label="COMBO" value={`${combo}x`} color="#ff00ff" blink />
        ) : (
          <StatItem label="STATUS" value="HUNTING" color="#39ff14" blink />
        )}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  icon,
  color,
  blink,
}: {
  label: string;
  value: string;
  icon?: string;
  color: string;
  blink?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <div
        className="text-[6px] mb-1 opacity-60"
        style={{ fontFamily: '"Press Start 2P"', color }}
      >
        {label}
      </div>
      <div
        className={`text-[10px] ${blink ? "animate-pulse" : ""}`}
        style={{
          fontFamily: '"Press Start 2P"',
          color,
          textShadow: `0 0 5px ${color}`,
        }}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </div>
    </motion.div>
  );
}
