"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ReactNode } from "react";

interface ArcadeFrameProps {
  children: ReactNode;
}

export default function ArcadeFrame({ children }: ArcadeFrameProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top Marquee */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center py-4 relative"
      >
        <div className="relative inline-block">
          {/* Glow backdrop */}
          <div
            className="absolute inset-0 blur-xl opacity-30"
            style={{
              background:
                "linear-gradient(90deg, #ff6ec7, #00fff7, #39ff14, #ffd700)",
            }}
          />
          <div className="relative flex items-center justify-center gap-3">
            <Image
              src="/images/logo.png"
              alt="CLAW-MAN"
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 drop-shadow-[0_0_10px_rgba(255,255,0,0.4)]"
            />
            <h1
              className="text-2xl md:text-4xl neon-text-cyan tracking-widest"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              CLAW-MAN
            </h1>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative text-[8px] md:text-[10px] text-[#ff6ec7] mt-2 tracking-wider"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              textShadow: "0 0 5px #ff6ec7",
            }}
          >
            AUTONOMOUS CRAB HARVESTER v2.0
          </motion.p>
        </div>

        {/* Decorative neon lines */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="h-[1px] w-16 md:w-32 bg-gradient-to-r from-transparent to-[#00fff7]" />
          <div className="w-2 h-2 rotate-45 border border-[#00fff7]" />
          <div className="h-[1px] w-8 bg-[#00fff7]" />
          <div className="w-2 h-2 rotate-45 border border-[#00fff7]" />
          <div className="h-[1px] w-16 md:w-32 bg-gradient-to-l from-transparent to-[#00fff7]" />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-2 md:px-4 pb-4">{children}</main>

      {/* Bottom Status Bar */}
      <footer className="border-t border-[#39ff14]/20 px-4 py-2 flex justify-between items-center">
        <span
          className="text-[7px] text-[#555]"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          CLAW-MAN OS v2.0 | MOLTBOOK SYNC: ACTIVE
        </span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse" />
          <span
            className="text-[7px] text-[#39ff14]"
            style={{ fontFamily: '"Press Start 2P"' }}
          >
            ONLINE
          </span>
        </div>
      </footer>
    </div>
  );
}
