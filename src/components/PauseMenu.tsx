"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  type GameSettings,
} from "@/lib/gameSettings";
import { DIFFICULTIES, GAME_MODES, type Difficulty, type GameMode } from "@/game/config";

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onSettingsChange: (settings: GameSettings) => void;
  walletAddress?: string;
}

type TabType = "main" | "audio" | "visual" | "accessibility" | "gameplay";

export default function PauseMenu({
  isOpen,
  onClose,
  onRestart,
  onQuit,
  onSettingsChange,
  walletAddress,
}: PauseMenuProps) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabType>("main");

  useEffect(() => {
    if (isOpen) {
      setSettings(loadSettings(walletAddress));
      setActiveTab("main");
    }
  }, [isOpen, walletAddress]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated, walletAddress);
    onSettingsChange(updated);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "main", label: "MENU", icon: "🎮" },
    { id: "audio", label: "AUDIO", icon: "🔊" },
    { id: "visual", label: "VISUAL", icon: "👁️" },
    { id: "accessibility", label: "ACCESS", icon: "♿" },
    { id: "gameplay", label: "GAME", icon: "⚙️" },
  ];

  const renderSlider = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    min = 0,
    max = 1,
    step = 0.1
  ) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <span className="text-[8px] text-[#888]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-24 h-2 accent-[#00fff7] bg-[#333]"
        />
        <span className="text-[8px] text-[#00fff7] w-8 text-right">
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  );

  const renderToggle = (label: string, value: boolean, onChange: (val: boolean) => void) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <span className="text-[8px] text-[#888]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${
          value ? "bg-[#00fff7]" : "bg-[#333]"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  const renderSelect = <T extends string>(
    label: string,
    value: T,
    options: { id: T; name: string }[],
    onChange: (val: T) => void
  ) => (
    <div className="flex items-center justify-between gap-3 mb-3">
      <span className="text-[8px] text-[#888]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-[#222] text-[8px] text-[#00fff7] border border-[#00fff7]/30 px-2 py-1"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "main":
        return (
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full arcade-btn text-[10px] py-3"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              RESUME GAME
            </button>
            <button
              onClick={onRestart}
              className="w-full arcade-btn text-[10px] py-3"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              RESTART
            </button>
            <button
              onClick={() => setActiveTab("audio")}
              className="w-full border border-[#00fff7]/40 text-[#00fff7] text-[9px] py-2 hover:bg-[#00fff7]/10"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              🔊 AUDIO SETTINGS
            </button>
            <button
              onClick={() => setActiveTab("visual")}
              className="w-full border border-[#00fff7]/40 text-[#00fff7] text-[9px] py-2 hover:bg-[#00fff7]/10"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              👁️ VISUAL SETTINGS
            </button>
            <button
              onClick={() => setActiveTab("accessibility")}
              className="w-full border border-[#00fff7]/40 text-[#00fff7] text-[9px] py-2 hover:bg-[#00fff7]/10"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              ♿ ACCESSIBILITY
            </button>
            <button
              onClick={onQuit}
              className="w-full border border-[#ff4444]/40 text-[#ff4444] text-[9px] py-2 hover:bg-[#ff4444]/10 mt-4"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              QUIT TO MENU
            </button>
          </div>
        );

      case "audio":
        return (
          <div>
            <h3
              className="text-[10px] text-[#00fff7] mb-4"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              AUDIO SETTINGS
            </h3>
            {renderSlider("Master Volume", settings.masterVolume, (v) =>
              updateSetting("masterVolume", v)
            )}
            {renderSlider("SFX Volume", settings.sfxVolume, (v) =>
              updateSetting("sfxVolume", v)
            )}
            {renderSlider("Music Volume", settings.musicVolume, (v) =>
              updateSetting("musicVolume", v)
            )}
            {renderToggle("Sound Effects", settings.sfxEnabled, (v) =>
              updateSetting("sfxEnabled", v)
            )}
            {renderToggle("Background Music", settings.musicEnabled, (v) =>
              updateSetting("musicEnabled", v)
            )}
          </div>
        );

      case "visual":
        return (
          <div>
            <h3
              className="text-[10px] text-[#00fff7] mb-4"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              VISUAL SETTINGS
            </h3>
            {renderToggle("CRT Effects", settings.crtEffects, (v) =>
              updateSetting("crtEffects", v)
            )}
            {renderToggle("Scanlines", settings.scanlines, (v) =>
              updateSetting("scanlines", v)
            )}
            {renderToggle("Screen Curvature", settings.screenCurvature, (v) =>
              updateSetting("screenCurvature", v)
            )}
            {renderToggle("Flicker Effect", settings.flickerEffect, (v) =>
              updateSetting("flickerEffect", v)
            )}
            {renderToggle("Screen Shake", settings.screenShake, (v) =>
              updateSetting("screenShake", v)
            )}
            {renderToggle("Particle Effects", settings.particleEffects, (v) =>
              updateSetting("particleEffects", v)
            )}
          </div>
        );

      case "accessibility":
        return (
          <div>
            <h3
              className="text-[10px] text-[#00fff7] mb-4"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              ACCESSIBILITY
            </h3>
            {renderToggle("Reduced Motion", settings.reducedMotion, (v) =>
              updateSetting("reducedMotion", v)
            )}
            {renderSelect(
              "Colorblind Mode",
              settings.colorblindMode,
              [
                { id: "none" as const, name: "OFF" },
                { id: "protanopia" as const, name: "PROTANOPIA" },
                { id: "deuteranopia" as const, name: "DEUTERANOPIA" },
                { id: "tritanopia" as const, name: "TRITANOPIA" },
              ],
              (v) => updateSetting("colorblindMode", v)
            )}
            {renderToggle("High Contrast", settings.highContrast, (v) =>
              updateSetting("highContrast", v)
            )}
            {renderToggle("Large Text", settings.largeText, (v) =>
              updateSetting("largeText", v)
            )}
            {renderToggle("Vibration", settings.vibrationEnabled, (v) =>
              updateSetting("vibrationEnabled", v)
            )}
          </div>
        );

      case "gameplay":
        return (
          <div>
            <h3
              className="text-[10px] text-[#00fff7] mb-4"
              style={{ fontFamily: '"Press Start 2P"' }}
            >
              GAMEPLAY
            </h3>
            {renderSelect(
              "Difficulty",
              settings.difficulty,
              Object.values(DIFFICULTIES).map((d) => ({ id: d.id, name: d.name })),
              (v) => updateSetting("difficulty", v)
            )}
            {renderToggle("Show Tutorial", settings.showTutorial, (v) =>
              updateSetting("showTutorial", v)
            )}
            {renderToggle("Auto Save", settings.autoSave, (v) =>
              updateSetting("autoSave", v)
            )}
            {renderToggle("Touch Controls", settings.touchControlsEnabled, (v) =>
              updateSetting("touchControlsEnabled", v)
            )}
            {renderSelect(
              "Touch Size",
              settings.touchControlsSize,
              [
                { id: "small" as const, name: "SMALL" },
                { id: "medium" as const, name: "MEDIUM" },
                { id: "large" as const, name: "LARGE" },
              ],
              (v) => updateSetting("touchControlsSize", v)
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0a0a0a] border-2 border-[#00fff7] p-4 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-[12px] neon-text-green"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                PAUSED
              </h2>
              <button
                onClick={onClose}
                className="text-[#ff4444] hover:text-[#ff6666] text-lg"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            {activeTab !== "main" && (
              <div className="flex gap-1 mb-4 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-1 text-[6px] border transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-[#00fff7] bg-[#00fff7]/20 text-[#00fff7]"
                        : "border-[#333] text-[#666] hover:border-[#00fff7]/50"
                    }`}
                    style={{ fontFamily: '"Press Start 2P"' }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="min-h-[250px]">{renderContent()}</div>

            {/* Back button for sub-menus */}
            {activeTab !== "main" && (
              <button
                onClick={() => setActiveTab("main")}
                className="w-full mt-4 border border-[#00fff7]/40 text-[#00fff7] text-[8px] py-2 hover:bg-[#00fff7]/10"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                &lt; BACK TO MENU
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
