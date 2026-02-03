"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadSettings, saveSettings, type GameSettings } from "@/lib/gameSettings";

interface VolumeControlsProps {
  onVolumeChange?: (settings: GameSettings) => void;
  walletAddress?: string;
}

export default function VolumeControls({ onVolumeChange, walletAddress }: VolumeControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    setSettings(loadSettings(walletAddress));
  }, [walletAddress]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated, walletAddress);
    onVolumeChange?.(updated);
  };

  if (!settings) return null;

  const masterIcon = !settings.sfxEnabled && !settings.musicEnabled ? "🔇" :
                     settings.masterVolume === 0 ? "🔇" :
                     settings.masterVolume < 0.5 ? "🔉" : "🔊";

  return (
    <div className="relative">
      {/* Volume button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 border flex items-center justify-center text-lg transition-colors ${
          isOpen
            ? "border-[#00fff7] bg-[#00fff7]/20 text-[#00fff7]"
            : "border-[#333] text-[#888] hover:border-[#00fff7]/50 hover:text-[#00fff7]"
        }`}
      >
        {masterIcon}
      </button>

      {/* Volume panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 bg-[#0a0a0a] border border-[#00fff7] p-3 z-50 min-w-[200px]"
          >
            <h4
              className="text-[8px] text-[#00fff7] mb-3"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              AUDIO
            </h4>

            {/* Master Volume */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[7px] text-[#888]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  MASTER
                </span>
                <span
                  className="text-[7px] text-[#00fff7]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.masterVolume}
                onChange={(e) => updateSetting("masterVolume", parseFloat(e.target.value))}
                className="w-full h-2 accent-[#00fff7] bg-[#333]"
              />
            </div>

            {/* SFX Volume */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => updateSetting("sfxEnabled", !settings.sfxEnabled)}
                  className={`text-[7px] flex items-center gap-1 ${
                    settings.sfxEnabled ? "text-[#888]" : "text-[#ff4444]"
                  }`}
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {settings.sfxEnabled ? "🔊" : "🔇"} SFX
                </button>
                <span
                  className="text-[7px] text-[#00fff7]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sfxVolume}
                onChange={(e) => updateSetting("sfxVolume", parseFloat(e.target.value))}
                className="w-full h-2 accent-[#00fff7] bg-[#333]"
                disabled={!settings.sfxEnabled}
              />
            </div>

            {/* Music Volume */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => updateSetting("musicEnabled", !settings.musicEnabled)}
                  className={`text-[7px] flex items-center gap-1 ${
                    settings.musicEnabled ? "text-[#888]" : "text-[#ff4444]"
                  }`}
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {settings.musicEnabled ? "🎵" : "🔇"} MUSIC
                </button>
                <span
                  className="text-[7px] text-[#00fff7]"
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.musicVolume}
                onChange={(e) => updateSetting("musicVolume", parseFloat(e.target.value))}
                className="w-full h-2 accent-[#00fff7] bg-[#333]"
                disabled={!settings.musicEnabled}
              />
            </div>

            {/* Quick mute button */}
            <button
              onClick={() => {
                const allMuted = !settings.sfxEnabled && !settings.musicEnabled;
                updateSetting("sfxEnabled", allMuted);
                updateSetting("musicEnabled", allMuted);
              }}
              className="w-full border border-[#333] text-[7px] py-1 hover:border-[#00fff7]/50 text-[#888]"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              {!settings.sfxEnabled && !settings.musicEnabled ? "UNMUTE ALL" : "MUTE ALL"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
