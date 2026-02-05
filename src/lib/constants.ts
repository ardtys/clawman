// Contract Address Configuration
export const CONTRACT_ADDRESS = "5hY8gGjnkYLe8AVwLNfqTtTx6KdEkh5zdGiQ8QkSBAGS";

// Format contract address for display (shortened)
export function formatContractAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
