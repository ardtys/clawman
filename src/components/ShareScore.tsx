"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareScoreProps {
  getScoreData: () => {
    score: number;
    level: number;
    highScore: number;
    crabsEaten: number;
    ghostsEaten: number;
    bossesDefeated: number;
    highestCombo: number;
  } | null;
}

export default function ShareScore({ getScoreData }: ShareScoreProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const generateShareText = useCallback(() => {
    const data = getScoreData();
    if (!data) return null;
    return [
      `🦀 CLAW-MAN SCORE REPORT 🦀`,
      ``,
      `🏆 Score: ${data.score.toLocaleString()}`,
      `📊 Level: ${data.level}`,
      `⭐ High Score: ${data.highScore.toLocaleString()}`,
      `🦀 Crabs: ${data.crabsEaten} | 👻 Ghosts: ${data.ghostsEaten}`,
      data.bossesDefeated > 0 ? `💀 Bosses: ${data.bossesDefeated}` : null,
      data.highestCombo > 1 ? `🔥 Best Combo: ${data.highestCombo}x` : null,
      ``,
      `Play CLAW-MAN! #CLAWMAN #ArcadeGame`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [getScoreData]);

  const generateShareUrl = () => {
    return window.location.origin;
  };

  const handleShareTwitter = () => {
    const text = generateShareText();
    if (!text) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(generateShareUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOptions(false);
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareUrl())}&quote=${encodeURIComponent(generateShareText() || "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOptions(false);
  };

  const handleShareReddit = () => {
    const text = generateShareText();
    if (!text) return;
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(generateShareUrl())}&title=${encodeURIComponent(`My CLAW-MAN Score: ${getScoreData()?.score.toLocaleString() || 0}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOptions(false);
  };

  const handleShareWhatsApp = () => {
    const text = generateShareText();
    if (!text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(text + "\n\n" + generateShareUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOptions(false);
  };

  const handleShareTelegram = () => {
    const text = generateShareText();
    if (!text) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(generateShareUrl())}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setShowOptions(false);
  };

  const handleNativeShare = async () => {
    const text = generateShareText();
    if (!text) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "CLAW-MAN Score",
          text: text,
          url: generateShareUrl(),
        });
      } catch (err) {
        // User cancelled or error
      }
    }
    setShowOptions(false);
  };

  const handleCopy = async () => {
    const text = generateShareText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text + "\n\n" + generateShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text + "\n\n" + generateShareUrl();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowOptions(false);
  };

  const handleGenerateImage = async () => {
    const data = getScoreData();
    if (!data) return;

    setIsGeneratingImage(true);

    // Create a canvas for the score card
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsGeneratingImage(false);
      return;
    }

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 600, 400);

    // Border
    ctx.strokeStyle = "#00fff7";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 580, 380);

    // Inner glow
    const gradient = ctx.createRadialGradient(300, 200, 0, 300, 200, 400);
    gradient.addColorStop(0, "rgba(0, 255, 247, 0.1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(10, 10, 580, 380);

    // Title
    ctx.fillStyle = "#00fff7";
    ctx.font = "bold 28px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("CLAW-MAN", 300, 60);

    // Crab emoji
    ctx.font = "50px Arial";
    ctx.fillText("🦀", 300, 130);

    // Score
    ctx.fillStyle = "#39ff14";
    ctx.font = "24px 'Press Start 2P', monospace";
    ctx.fillText(`SCORE: ${data.score.toLocaleString()}`, 300, 190);

    // Stats
    ctx.fillStyle = "#888888";
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.fillText(`LEVEL: ${data.level}  |  HIGH SCORE: ${data.highScore.toLocaleString()}`, 300, 240);
    ctx.fillText(`CRABS: ${data.crabsEaten}  |  GHOSTS: ${data.ghostsEaten}`, 300, 270);

    if (data.highestCombo > 1) {
      ctx.fillStyle = "#ff6600";
      ctx.fillText(`BEST COMBO: ${data.highestCombo}x`, 300, 300);
    }

    // Footer
    ctx.fillStyle = "#444444";
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText("PLAY CLAW-MAN!", 300, 370);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `clawman-score-${data.score}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setIsGeneratingImage(false);
    });

    setShowOptions(false);
  };

  const supportsNativeShare = typeof navigator !== "undefined" && navigator.share;

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-full arcade-btn text-[8px] py-2"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        📤 SHARE SCORE
      </button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-[#0a0a0a] border border-[#00fff7] p-2 z-50"
          >
            <div className="grid grid-cols-2 gap-1">
              {/* Twitter/X */}
              <button
                onClick={handleShareTwitter}
                className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
              >
                <span className="text-sm">𝕏</span>
                <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                  TWITTER
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#4267B2] hover:bg-[#4267B2]/10 transition-colors"
              >
                <span className="text-sm">📘</span>
                <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                  FACEBOOK
                </span>
              </button>

              {/* Reddit */}
              <button
                onClick={handleShareReddit}
                className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#FF4500] hover:bg-[#FF4500]/10 transition-colors"
              >
                <span className="text-sm">🔴</span>
                <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                  REDDIT
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#25D366] hover:bg-[#25D366]/10 transition-colors"
              >
                <span className="text-sm">📱</span>
                <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                  WHATSAPP
                </span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleShareTelegram}
                className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#0088cc] hover:bg-[#0088cc]/10 transition-colors"
              >
                <span className="text-sm">✈️</span>
                <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                  TELEGRAM
                </span>
              </button>

              {/* Copy */}
              <button
                onClick={handleCopy}
                className={`flex items-center justify-center gap-1 p-2 border transition-colors ${
                  copied
                    ? "border-[#39ff14] bg-[#39ff14]/10"
                    : "border-[#333] hover:border-[#00fff7] hover:bg-[#00fff7]/10"
                }`}
              >
                <span className="text-sm">{copied ? "✓" : "📋"}</span>
                <span
                  className={`text-[6px] ${copied ? "text-[#39ff14]" : "text-[#888]"}`}
                  style={{ fontFamily: '"Press Start 2P"' }}
                >
                  {copied ? "COPIED!" : "COPY"}
                </span>
              </button>

              {/* Download Image */}
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#ffd700] hover:bg-[#ffd700]/10 transition-colors col-span-2"
              >
                <span className="text-sm">{isGeneratingImage ? "⏳" : "🖼️"}</span>
                <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                  {isGeneratingImage ? "GENERATING..." : "DOWNLOAD IMAGE"}
                </span>
              </button>

              {/* Native Share (mobile) */}
              {supportsNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-1 p-2 border border-[#333] hover:border-[#00fff7] hover:bg-[#00fff7]/10 transition-colors col-span-2"
                >
                  <span className="text-sm">📤</span>
                  <span className="text-[6px] text-[#888]" style={{ fontFamily: '"Press Start 2P"' }}>
                    MORE OPTIONS
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
