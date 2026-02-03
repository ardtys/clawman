"use client";

import { useMemo, useState } from "react";
import { loadReplay, type ReplayData } from "@/lib/replay";

interface ReplayViewerProps {
  walletAddress?: string;
}

export default function ReplayViewer({ walletAddress }: ReplayViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const replay = useMemo(() => {
    return loadReplay(walletAddress);
  }, [walletAddress]);

  if (!replay) return null;

  const durationSec = Math.round(replay.duration / 1000);
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const dateStr = new Date(replay.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="neon-border bg-[#0a0a0a]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 border-b border-[#39ff14]/30 flex items-center gap-2 text-left"
      >
        <span className="text-[10px]">🎬</span>
        <span
          className="neon-text-green text-[7px] tracking-wider flex-1"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          BEST REPLAY
        </span>
        <span
          className="text-[6px] text-[#555]"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          {expanded ? "[-]" : "[+]"}
        </span>
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div
                className="text-[5px] text-[#888] mb-1"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                SCORE
              </div>
              <div
                className="text-[9px] neon-text-cyan"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                {replay.score.toLocaleString()}
              </div>
            </div>
            <div>
              <div
                className="text-[5px] text-[#888] mb-1"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                LEVEL
              </div>
              <div
                className="text-[9px] neon-text-green"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                {replay.level}
              </div>
            </div>
            <div>
              <div
                className="text-[5px] text-[#888] mb-1"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                DURATION
              </div>
              <div
                className="text-[9px] text-[#ffd700]"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                {mins}:{secs.toString().padStart(2, "0")}
              </div>
            </div>
            <div>
              <div
                className="text-[5px] text-[#888] mb-1"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                DATE
              </div>
              <div
                className="text-[9px] text-[#ff6ec7]"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                {dateStr}
              </div>
            </div>
          </div>

          <div
            className="text-[5px] text-[#555] text-center"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            {replay.frames.length} FRAMES RECORDED
          </div>
        </div>
      )}
    </div>
  );
}
