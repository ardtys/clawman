"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FeedEntry {
  id: string;
  timestamp: number;
  message: string;
  type: "consume" | "spawn" | "ghost" | "commentary" | "system" | "rain";
}

interface LiveFeedProps {
  entries: FeedEntry[];
}

const typeColors: Record<string, string> = {
  consume: "#39ff14",
  spawn: "#00fff7",
  ghost: "#ff6ec7",
  commentary: "#ffd700",
  system: "#888888",
  rain: "#ff6600",
};

const typePrefix: Record<string, string> = {
  consume: "[HARVEST]",
  spawn: "[SPAWN]",
  ghost: "[ALERT]",
  commentary: "[CLAW-AI]",
  system: "[SYS]",
  rain: "[RAIN]",
};

export default function LiveFeed({ entries }: LiveFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="neon-border flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#39ff14]/30 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
        <span className="neon-text-green text-[8px] tracking-wider">
          LIVE MOLTBOOK FEED
        </span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="text-[7px] leading-relaxed"
            >
              <span className="text-[#555]">
                {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                  hour12: false,
                })}
              </span>{" "}
              <span style={{ color: typeColors[entry.type] || "#39ff14" }}>
                {typePrefix[entry.type] || "[LOG]"}
              </span>{" "}
              <span
                style={{
                  color:
                    entry.type === "commentary"
                      ? "#ffd700"
                      : "rgba(57, 255, 20, 0.8)",
                }}
              >
                {entry.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Blinking cursor at bottom */}
        <div className="text-[8px] text-[#39ff14]">
          <span className="cursor-blink">_</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 border-t border-[#39ff14]/30 flex justify-between text-[7px]">
        <span className="text-[#555]">ENTRIES: {entries.length}</span>
        <span className="text-[#39ff14] animate-pulse">STREAMING</span>
      </div>
    </div>
  );
}
