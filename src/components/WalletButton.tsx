"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { detectEIP6963Wallets, detectLegacyWallet, type DetectedWallet } from "@/lib/walletUtils";

export default function WalletButton() {
  const { connected, connecting, displayAddress, walletName, connect, disconnect } = useWallet();
  const [showPicker, setShowPicker] = useState(false);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [detecting, setDetecting] = useState(false);

  const detectWallets = async () => {
    setDetecting(true);
    const eip6963 = await detectEIP6963Wallets();
    const legacy = detectLegacyWallet();
    const all: DetectedWallet[] = [...eip6963];
    if (legacy && !eip6963.some(w => w.name === legacy.name)) {
      all.push(legacy);
    }
    setWallets(all);
    setDetecting(false);
  };

  const handleClick = async () => {
    if (connected) {
      disconnect();
      return;
    }
    await detectWallets();
    setShowPicker(true);
  };

  const handleSelectWallet = async (wallet: DetectedWallet) => {
    setShowPicker(false);
    try {
      await connect(wallet.provider);
    } catch (err: any) {
      console.error("Wallet connect error:", err);
    }
  };

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".wallet-picker")) {
        setShowPicker(false);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [showPicker]);

  return (
    <div className="relative wallet-picker">
      <button
        onClick={handleClick}
        disabled={connecting}
        className="arcade-btn text-[7px] flex items-center gap-2"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        {connecting ? (
          <span className="animate-pulse">CONNECTING...</span>
        ) : connected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[#39ff14] inline-block" style={{ boxShadow: "0 0 6px #39ff14" }} />
            <span>{walletName} | {displayAddress}</span>
          </>
        ) : (
          <span>CONNECT WALLET</span>
        )}
      </button>

      {showPicker && !connected && (
        <div
          className="absolute top-full mt-2 right-0 z-50 min-w-[220px] neon-border-cyan bg-[#0a0a0a] p-2"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          <div className="text-[6px] text-[#00fff7] mb-2 text-center opacity-70">
            SELECT WALLET
          </div>
          {detecting ? (
            <div className="text-[6px] text-center py-3 animate-pulse text-[#555]">
              DETECTING...
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-[6px] text-center py-3 text-[#ff6600]">
              NO WALLET FOUND
              <div className="text-[5px] mt-1 text-[#555]">
                Install MetaMask or another Web3 wallet
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {wallets.map((w, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectWallet(w)}
                  className="w-full text-left px-2 py-2 text-[6px] text-[#00fff7] hover:bg-[#00fff7]/10 transition-colors flex items-center gap-2 border border-transparent hover:border-[#00fff7]/30"
                >
                  {w.icon ? (
                    <img src={w.icon} alt="" className="w-4 h-4" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-[8px]">
                      {">"}
                    </span>
                  )}
                  <span>{w.name.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
