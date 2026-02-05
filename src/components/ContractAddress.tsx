"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { CONTRACT_ADDRESS, formatContractAddress } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface ContractAddressProps {
  variant?: "default" | "compact" | "full";
  showLabel?: boolean;
  className?: string;
}

export default function ContractAddress({
  variant = "default",
  showLabel = true,
  className = "",
}: ContractAddressProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = CONTRACT_ADDRESS;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayAddress =
    variant === "full"
      ? CONTRACT_ADDRESS
      : variant === "compact"
      ? formatContractAddress(CONTRACT_ADDRESS, 4, 4)
      : formatContractAddress(CONTRACT_ADDRESS, 6, 4);

  return (
    <motion.div
      className={`inline-flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {showLabel && (
        <span
          className="text-[9px] md:text-[10px] tracking-wider text-[#00ffff]/60"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          CA:
        </span>
      )}
      <button
        onClick={copyToClipboard}
        className="group flex items-center gap-2 px-3 py-1.5 rounded border border-[#00ffff]/20 bg-[#050508] hover:border-[#00ffff]/40 hover:bg-[#0a0a12] transition-all duration-200 cursor-pointer"
        title="Click to copy contract address"
      >
        <span
          className="text-[10px] md:text-[11px] text-[#00ffff]/80 group-hover:text-[#00ffff] transition-colors"
          style={{ fontFamily: '"Fira Code"' }}
        >
          {displayAddress}
        </span>
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check size={14} className="text-[#39ff14]" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Copy
                size={14}
                className="text-[#00ffff]/40 group-hover:text-[#00ffff]/80 transition-colors"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-[9px] text-[#39ff14]"
            style={{ fontFamily: '"Fira Code"' }}
          >
            Copied!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
