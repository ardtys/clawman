// === REPLAY SYSTEM ===
// Records player input per frame for ghost replay

export interface ReplayFrame {
  t: number; // timestamp (ms since start)
  gx: number; // grid X
  gy: number; // grid Y
  dx: number; // move direction X
  dy: number; // move direction Y
}

export interface ReplayData {
  frames: ReplayFrame[];
  score: number;
  level: number;
  date: string;
  duration: number; // total ms
}

const MAX_REPLAY_FRAMES = 30000; // ~10 minutes at 50fps

export function createReplayRecorder() {
  let frames: ReplayFrame[] = [];
  let startTime = 0;
  let recording = false;

  return {
    start() {
      frames = [];
      startTime = Date.now();
      recording = true;
    },

    recordFrame(gx: number, gy: number, dx: number, dy: number) {
      if (!recording) return;
      if (frames.length >= MAX_REPLAY_FRAMES) return;
      const t = Date.now() - startTime;
      // Only record if position changed
      const last = frames[frames.length - 1];
      if (last && last.gx === gx && last.gy === gy && last.dx === dx && last.dy === dy) return;
      frames.push({ t, gx, gy, dx, dy });
    },

    stop(score: number, level: number): ReplayData {
      recording = false;
      return {
        frames: [...frames],
        score,
        level,
        date: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    },

    isRecording() {
      return recording;
    },
  };
}

export function saveReplay(replay: ReplayData, walletAddress?: string) {
  try {
    const key = walletAddress ? `clawman-replay-${walletAddress}` : "clawman-replay";
    // Keep only best replay
    const existing = loadReplay(walletAddress);
    if (!existing || replay.score > existing.score) {
      localStorage.setItem(key, JSON.stringify(replay));
    }
  } catch { /* noop */ }
}

export function loadReplay(walletAddress?: string): ReplayData | null {
  try {
    const key = walletAddress ? `clawman-replay-${walletAddress}` : "clawman-replay";
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}
