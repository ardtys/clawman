"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CommentaryProps {
  text: string;
}

export default function Commentary({ text }: CommentaryProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      return;
    }

    setIsTyping(true);
    setDisplayText("");
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="neon-border bg-[#0a0a0a]">
      <div className="px-3 py-2 border-b border-[#39ff14]/30 flex items-center gap-2">
        <span className="text-[10px]">🤖</span>
        <span
          className="neon-text-yellow text-[8px] tracking-wider"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          CLAW-MAN AI COMMENTARY
        </span>
      </div>
      <div className="p-3 min-h-[60px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[8px] text-[#ffd700] leading-relaxed"
            style={{
              fontFamily: '"Press Start 2P"',
              textShadow: "0 0 3px rgba(255, 215, 0, 0.3)",
            }}
          >
            {displayText}
            {isTyping && <span className="cursor-blink">|</span>}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
