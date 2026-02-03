"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  connectWallet as connectWalletUtil,
  formatAddress,
  onAccountChange,
  onChainChange,
  type WalletInfo,
} from "@/lib/walletUtils";

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  walletName: string | null;
  connected: boolean;
  connecting: boolean;
  displayAddress: string;
  connect: (provider?: any) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  chainId: null,
  walletName: null,
  connected: false,
  connecting: false,
  displayAddress: "",
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Auto-reconnect if previously connected
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clawman-wallet-connected");
      if (saved === "true" && typeof window !== "undefined" && (window as any).ethereum) {
        connectWalletUtil()
          .then(setWallet)
          .catch(() => localStorage.removeItem("clawman-wallet-connected"));
      }
    } catch { /* noop */ }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!wallet) return;
    const unsub1 = onAccountChange((accounts) => {
      if (accounts.length === 0) {
        setWallet(null);
        localStorage.removeItem("clawman-wallet-connected");
      } else {
        setWallet((prev) => (prev ? { ...prev, address: accounts[0] } : null));
      }
    });
    const unsub2 = onChainChange((chainIdHex) => {
      setWallet((prev) =>
        prev ? { ...prev, chainId: parseInt(chainIdHex, 16) } : null
      );
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [wallet]);

  const connect = useCallback(async (provider?: any) => {
    setConnecting(true);
    try {
      const info = await connectWalletUtil(provider);
      setWallet(info);
      localStorage.setItem("clawman-wallet-connected", "true");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    localStorage.removeItem("clawman-wallet-connected");
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address: wallet?.address ?? null,
        chainId: wallet?.chainId ?? null,
        walletName: wallet?.walletName ?? null,
        connected: !!wallet,
        connecting,
        displayAddress: wallet ? formatAddress(wallet.address) : "",
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
