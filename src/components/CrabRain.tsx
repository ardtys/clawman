"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FallingCrab {
  id: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

interface CrabRainProps {
  active: boolean;
  onCrabCaught?: () => void;
  onRainEnd?: () => void;
}

export default function CrabRain({ active, onCrabCaught, onRainEnd }: CrabRainProps) {
  const [crabs, setCrabs] = useState<FallingCrab[]>([]);
  const [caught, setCaught] = useState(0);
  // Store callback in ref to avoid re-triggering effect on callback change
  const onRainEndRef = useRef(onRainEnd);
  onRainEndRef.current = onRainEnd;

  useEffect(() => {
    if (!active) {
      setCrabs([]);
      setCaught(0);
      return;
    }

    const newCrabs: FallingCrab[] = [];
    for (let i = 0; i < 50; i++) {
      newCrabs.push({
        id: `rain-${Date.now()}-${i}`,
        x: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 4,
        size: 16 + Math.random() * 24,
      });
    }
    setCrabs(newCrabs);

    const timer = setTimeout(() => {
      onRainEndRef.current?.();
    }, 8000);

    return () => clearTimeout(timer);
  }, [active]);

  const handleCatch = useCallback(
    (id: string) => {
      setCrabs((prev) => prev.filter((s) => s.id !== id));
      setCaught((prev) => prev + 1);
      onCrabCaught?.();
    },
    [onCrabCaught]
  );

  if (!active && crabs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      {/* Caught counter */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[1001]"
          >
            <div className="neon-border-cyan bg-[#0a0a0a]/90 px-6 py-3 text-center">
              <div
                className="neon-text-cyan text-[10px] mb-1"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                🦀 CRAB RAIN 🦀
              </div>
              <div
                className="neon-text-yellow text-[8px]"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                CAUGHT: {caught}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Falling crabs */}
      {crabs.map((crab) => (
        <div
          key={crab.id}
          className="crab-rain pointer-events-auto"
          onClick={() => handleCatch(crab.id)}
          style={{
            left: `${crab.x}%`,
            fontSize: `${crab.size}px`,
            animationDelay: `${crab.delay}s`,
            animationDuration: `${crab.duration}s`,
          }}
        >
          🦀
        </div>
      ))}
    </div>
  );
}
