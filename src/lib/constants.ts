// Contract Address Configuration
export const CONTRACT_ADDRESS = "GgbFmPjGSxpEV3iyRRiHbAHPwpwkaCbCcrbReB4qpump";

// Format contract address for display (shortened)
export function formatContractAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Social Links
export const SOCIAL_LINKS = {
  // Add your social links here
  // twitter: "https://twitter.com/clawman",
  // telegram: "https://t.me/clawman",
  // dexscreener: `https://dexscreener.com/solana/${CONTRACT_ADDRESS}`,
};
