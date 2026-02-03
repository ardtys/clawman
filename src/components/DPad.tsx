"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DPadSize = "small" | "medium" | "large";

interface DPadProps {
  onDirectionChange: (dir: { x: number; y: number }) => void;
  size?: DPadSize;
  hapticFeedback?: boolean;
  showAlways?: boolean;
}

const SIZE_CONFIGS: Record<DPadSize, { btn: string; fontSize: string; gap: string }> = {
  small: { btn: "w-10 h-10", fontSize: "text-lg", gap: "gap-0.5" },
  medium: { btn: "w-14 h-14", fontSize: "text-xl", gap: "gap-1" },
  large: { btn: "w-18 h-18", fontSize: "text-2xl", gap: "gap-1.5" },
};

export default function DPad({
  onDirectionChange,
  size = "medium",
  hapticFeedback = true,
  showAlways = false,
}: DPadProps) {
  const [activeDir, setActiveDir] = useState<{ x: number; y: number } | null>(null);
  const lastVibrate = useRef(0);

  const vibrate = useCallback(() => {
    if (!hapticFeedback) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      const now = Date.now();
      if (now - lastVibrate.current > 50) {
        navigator.vibrate(10);
        lastVibrate.current = now;
      }
    }
  }, [hapticFeedback]);

  const handlePress = useCallback(
    (x: number, y: number) => {
      setActiveDir({ x, y });
      onDirectionChange({ x, y });
      vibrate();
    },
    [onDirectionChange, vibrate]
  );

  const handleRelease = useCallback(() => {
    setActiveDir(null);
    onDirectionChange({ x: 0, y: 0 });
  }, [onDirectionChange]);

  // Handle keyboard for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sizeConfig = SIZE_CONFIGS[size];

  const btnBase = `flex items-center justify-center ${sizeConfig.btn} rounded-lg select-none touch-none transition-all duration-75`;

  const getBtnStyle = (dirX: number, dirY: number) => {
    const isActive = activeDir?.x === dirX && activeDir?.y === dirY;
    return `bg-[#111] border-2 text-[#00fff7] ${sizeConfig.fontSize} shadow-[0_0_8px_rgba(0,255,247,0.3)] ${
      isActive
        ? "border-[#00fff7] bg-[#00fff7]/30 scale-95 shadow-[0_0_20px_rgba(0,255,247,0.6)]"
        : "border-[#00fff7]/50 active:bg-[#00fff7]/20 active:shadow-[0_0_16px_rgba(0,255,247,0.5)] active:scale-90"
    }`;
  };

  // Swipe gesture support
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, dirX: number, dirY: number) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    handlePress(dirX, dirY);
  }, [handlePress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current || !containerRef.current) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const threshold = 20;

    let newX = 0;
    let newY = 0;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        newX = dx > 0 ? 1 : -1;
      } else {
        newY = dy > 0 ? 1 : -1;
      }
    }

    if (!activeDir || activeDir.x !== newX || activeDir.y !== newY) {
      if (newX !== 0 || newY !== 0) {
        handlePress(newX, newY);
      }
    }
  }, [activeDir, handlePress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchStartRef.current = null;
    handleRelease();
  }, [handleRelease]);

  return (
    <div
      ref={containerRef}
      className={`${showAlways ? "" : "lg:hidden"} flex flex-col items-center ${sizeConfig.gap} py-2 select-none touch-none`}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Up button */}
      <div className="flex justify-center">
        <button
          className={`${btnBase} ${getBtnStyle(0, -1)}`}
          onTouchStart={(e) => handleTouchStart(e, 0, -1)}
          onMouseDown={() => handlePress(0, -1)}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          aria-label="Move up"
        >
          ▲
        </button>
      </div>

      {/* Middle row */}
      <div className={`flex ${sizeConfig.gap}`}>
        <button
          className={`${btnBase} ${getBtnStyle(-1, 0)}`}
          onTouchStart={(e) => handleTouchStart(e, -1, 0)}
          onMouseDown={() => handlePress(-1, 0)}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          aria-label="Move left"
        >
          ◀
        </button>

        {/* Center indicator */}
        <div className={`${btnBase} bg-[#111]/50 border border-[#333] rounded-lg`}>
          <div className="text-center">
            <span className="text-[6px] text-[#555]" style={{ fontFamily: '"Press Start 2P"' }}>
              {activeDir ? `${activeDir.x},${activeDir.y}` : "D-PAD"}
            </span>
          </div>
        </div>

        <button
          className={`${btnBase} ${getBtnStyle(1, 0)}`}
          onTouchStart={(e) => handleTouchStart(e, 1, 0)}
          onMouseDown={() => handlePress(1, 0)}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          aria-label="Move right"
        >
          ▶
        </button>
      </div>

      {/* Down button */}
      <div className="flex justify-center">
        <button
          className={`${btnBase} ${getBtnStyle(0, 1)}`}
          onTouchStart={(e) => handleTouchStart(e, 0, 1)}
          onMouseDown={() => handlePress(0, 1)}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          aria-label="Move down"
        >
          ▼
        </button>
      </div>

      {/* Size indicator for mobile */}
      <div className="mt-1 text-[5px] text-[#333]" style={{ fontFamily: '"Press Start 2P"' }}>
        TAP OR SWIPE
      </div>
    </div>
  );
}
