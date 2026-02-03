// === WEB3 WALLET UTILITIES ===
// Supports all EVM wallets via window.ethereum (EIP-1193) and EIP-6963

export interface WalletInfo {
  address: string;
  chainId: number;
  walletName: string;
}

export interface DetectedWallet {
  name: string;
  icon: string;
  provider: any;
  rdns?: string;
}

// Detect wallets via EIP-6963 (modern standard)
export function detectEIP6963Wallets(): Promise<DetectedWallet[]> {
  return new Promise((resolve) => {
    const wallets: DetectedWallet[] = [];
    const handler = (event: any) => {
      const { info, provider } = event.detail;
      wallets.push({
        name: info.name,
        icon: info.icon,
        provider,
        rdns: info.rdns,
      });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("eip6963:announceProvider", handler);
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      // Give wallets 500ms to respond
      setTimeout(() => {
        window.removeEventListener("eip6963:announceProvider", handler);
        resolve(wallets);
      }, 500);
    } else {
      resolve([]);
    }
  });
}

// Fallback: detect legacy window.ethereum
export function detectLegacyWallet(): DetectedWallet | null {
  if (typeof window === "undefined") return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  let name = "Browser Wallet";
  if (eth.isMetaMask) name = "MetaMask";
  else if (eth.isCoinbaseWallet) name = "Coinbase Wallet";
  else if (eth.isBraveWallet) name = "Brave Wallet";
  else if (eth.isPhantom) name = "Phantom";
  else if (eth.isRabby) name = "Rabby";
  else if (eth.isTrust) name = "Trust Wallet";
  return { name, icon: "", provider: eth };
}

// Connect to a wallet provider
export async function connectWallet(provider?: any): Promise<WalletInfo> {
  const eth = provider || (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Please install a Web3 wallet.");

  // Request accounts
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts || accounts.length === 0) throw new Error("No accounts returned");

  // Get chain ID
  const chainIdHex: string = await eth.request({ method: "eth_chainId" });
  const chainId = parseInt(chainIdHex, 16);

  let walletName = "Wallet";
  if (eth.isMetaMask) walletName = "MetaMask";
  else if (eth.isCoinbaseWallet) walletName = "Coinbase";
  else if (eth.isBraveWallet) walletName = "Brave";
  else if (eth.isPhantom) walletName = "Phantom";
  else if (eth.isRabby) walletName = "Rabby";

  return {
    address: accounts[0],
    chainId,
    walletName,
  };
}

// Format address for display
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Listen for account changes
export function onAccountChange(callback: (accounts: string[]) => void) {
  const eth = (window as any).ethereum;
  if (!eth) return () => {};
  eth.on("accountsChanged", callback);
  return () => eth.removeListener("accountsChanged", callback);
}

// Listen for chain changes
export function onChainChange(callback: (chainId: string) => void) {
  const eth = (window as any).ethereum;
  if (!eth) return () => {};
  eth.on("chainChanged", callback);
  return () => eth.removeListener("chainChanged", callback);
}

// Save/load progress keyed by wallet address
export function saveWalletProgress(address: string, data: Record<string, any>) {
  try {
    const key = `clawman-progress-${address.toLowerCase()}`;
    const existing = loadWalletProgress(address);
    const merged = { ...existing, ...data, lastUpdated: Date.now() };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch { /* noop */ }
}

export function loadWalletProgress(address: string): Record<string, any> {
  try {
    const key = `clawman-progress-${address.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return {};
}
