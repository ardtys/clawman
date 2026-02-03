// === DAILY CHALLENGE SYSTEM ===
// Seeded PRNG for deterministic maze generation

// Mulberry32 - fast 32-bit PRNG
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const chr = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return Math.abs(hash);
}

export function getTodaySeed(): number {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return dateToSeed(today);
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export interface DailyScore {
  date: string;
  score: number;
  level: number;
  crabs: number;
}

export function loadDailyScore(walletAddress?: string): DailyScore | null {
  try {
    const today = getTodayDateString();
    const key = walletAddress
      ? `clawman-daily-${walletAddress}-${today}`
      : `clawman-daily-${today}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

export function saveDailyScore(score: DailyScore, walletAddress?: string) {
  try {
    const key = walletAddress
      ? `clawman-daily-${walletAddress}-${score.date}`
      : `clawman-daily-${score.date}`;
    const existing = loadDailyScore(walletAddress);
    if (!existing || score.score > existing.score) {
      localStorage.setItem(key, JSON.stringify(score));
    }
  } catch { /* noop */ }
}

export function loadDailyBest(walletAddress?: string): DailyScore | null {
  return loadDailyScore(walletAddress);
}
