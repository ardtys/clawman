import { NextRequest, NextResponse } from "next/server";

// In-memory leaderboard (in production, use a database)
// This is a simple implementation for demonstration
interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  level: number;
  crabs: number;
  ghosts: number;
  gameMode: string;
  difficulty: string;
  timestamp: number;
}

// Simple in-memory storage (resets on server restart)
// In production, use Redis, PostgreSQL, MongoDB, etc.
let leaderboard: LeaderboardEntry[] = [
  { id: "ai-1", name: "CRAB_MASTER_3000", score: 15420, level: 12, crabs: 450, ghosts: 35, gameMode: "classic", difficulty: "normal", timestamp: Date.now() - 86400000 },
  { id: "ai-2", name: "GHOST_HUNTER_X", score: 12850, level: 10, crabs: 380, ghosts: 52, gameMode: "classic", difficulty: "hard", timestamp: Date.now() - 172800000 },
  { id: "ai-3", name: "NEON_CLAW", score: 9750, level: 8, crabs: 290, ghosts: 28, gameMode: "endless", difficulty: "normal", timestamp: Date.now() - 259200000 },
  { id: "ai-4", name: "PIXEL_WARRIOR", score: 8200, level: 7, crabs: 245, ghosts: 22, gameMode: "timeAttack", difficulty: "normal", timestamp: Date.now() - 345600000 },
  { id: "ai-5", name: "RETRO_KING", score: 7100, level: 6, crabs: 210, ghosts: 18, gameMode: "classic", difficulty: "easy", timestamp: Date.now() - 432000000 },
];

// GET - Fetch leaderboard
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameMode = searchParams.get("gameMode") || "all";
  const difficulty = searchParams.get("difficulty") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);

  let filtered = [...leaderboard];

  // Filter by game mode
  if (gameMode !== "all") {
    filtered = filtered.filter((e) => e.gameMode === gameMode);
  }

  // Filter by difficulty
  if (difficulty !== "all") {
    filtered = filtered.filter((e) => e.difficulty === difficulty);
  }

  // Sort by score descending
  filtered.sort((a, b) => b.score - a.score);

  // Limit results
  filtered = filtered.slice(0, limit);

  // Add ranks
  const ranked = filtered.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  return NextResponse.json({
    success: true,
    data: ranked,
    total: leaderboard.length,
    filtered: filtered.length,
  });
}

// POST - Submit score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, score, level, crabs, ghosts, gameMode, difficulty } = body;

    // Validation
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 20) {
      return NextResponse.json(
        { success: false, error: "Invalid name (1-20 characters)" },
        { status: 400 }
      );
    }

    if (typeof score !== "number" || score < 0 || score > 10000000) {
      return NextResponse.json(
        { success: false, error: "Invalid score" },
        { status: 400 }
      );
    }

    // Sanitize name (remove special characters except underscore)
    const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, "").toUpperCase().slice(0, 20);

    const entry: LeaderboardEntry = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: sanitizedName || "ANONYMOUS",
      score: Math.floor(score),
      level: Math.floor(level) || 1,
      crabs: Math.floor(crabs) || 0,
      ghosts: Math.floor(ghosts) || 0,
      gameMode: gameMode || "classic",
      difficulty: difficulty || "normal",
      timestamp: Date.now(),
    };

    leaderboard.push(entry);

    // Keep only top 1000 entries
    leaderboard.sort((a, b) => b.score - a.score);
    if (leaderboard.length > 1000) {
      leaderboard = leaderboard.slice(0, 1000);
    }

    // Find rank
    const rank = leaderboard.findIndex((e) => e.id === entry.id) + 1;

    return NextResponse.json({
      success: true,
      data: {
        ...entry,
        rank,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
