"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Skull,
  Radio,
  Database,
  Ghost,
  Brain,
  Terminal,
  Wifi,
  Activity,
  ChevronRight,
  ShieldAlert,
  Layers,
  Zap,
  Gamepad2,
  Target,
  Sparkles,
} from "lucide-react";

// ============================================================
// MINI MAZE RENDERER (Canvas-based hero visualization)
// ============================================================
const MINI_CELL = 14;
const MINI_COLS = 21;
const MINI_ROWS = 21;

function generateMiniMaze(): number[][] {
  const grid: number[][] = Array.from({ length: MINI_ROWS }, () =>
    Array(MINI_COLS).fill(1)
  );
  function carve(x: number, y: number) {
    grid[y][x] = 0;
    const dirs = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (
        nx > 0 &&
        nx < MINI_COLS - 1 &&
        ny > 0 &&
        ny < MINI_ROWS - 1 &&
        grid[ny][nx] === 1
      ) {
        grid[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }
  carve(1, 1);
  for (let y = 2; y < MINI_ROWS - 2; y++) {
    for (let x = 2; x < MINI_COLS - 2; x++) {
      if (grid[y][x] === 1 && Math.random() < 0.12) {
        const n =
          (grid[y - 1]?.[x] === 0 ? 1 : 0) +
          (grid[y + 1]?.[x] === 0 ? 1 : 0) +
          (grid[y]?.[x - 1] === 0 ? 1 : 0) +
          (grid[y]?.[x + 1] === 0 ? 1 : 0);
        if (n >= 1 && n <= 2) grid[y][x] = 0;
      }
    }
  }
  return grid;
}

function MazeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mazeRef = useRef(generateMiniMaze());
  const playerRef = useRef({ x: 1, y: 1 });
  const ghostsRef = useRef([
    { x: 19, y: 19, color: "#ff0044" },
    { x: 19, y: 1, color: "#ff69b4" },
    { x: 1, y: 19, color: "#ff8800" },
  ]);
  const crabPositions = useRef<{ x: number; y: number }[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const positions: { x: number; y: number }[] = [];
    const maze = mazeRef.current;
    for (let y = 0; y < MINI_ROWS; y++) {
      for (let x = 0; x < MINI_COLS; x++) {
        if (maze[y][x] === 0 && !(x === 1 && y === 1) && Math.random() < 0.3) {
          positions.push({ x, y });
        }
      }
    }
    crabPositions.current = positions;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = MINI_COLS * MINI_CELL;
    const H = MINI_ROWS * MINI_CELL;
    canvas.width = W;
    canvas.height = H;

    let raf: number;

    function moveEntity(entity: { x: number; y: number }, m: number[][]) {
      const dirs = [
        [0, -1], [0, 1], [-1, 0], [1, 0],
      ];
      const valid = dirs.filter(([dx, dy]) => {
        const nx = entity.x + dx;
        const ny = entity.y + dy;
        return nx >= 0 && nx < MINI_COLS && ny >= 0 && ny < MINI_ROWS && m[ny][nx] === 0;
      });
      if (valid.length > 0) {
        const [dx, dy] = valid[Math.floor(Math.random() * valid.length)];
        entity.x += dx;
        entity.y += dy;
      }
    }

    function draw() {
      frameRef.current++;
      if (!ctx) return;

      if (frameRef.current % 8 === 0) {
        moveEntity(playerRef.current, mazeRef.current);
        ghostsRef.current.forEach((g) => moveEntity(g, mazeRef.current));
        crabPositions.current = crabPositions.current.filter(
          (s) => !(s.x === playerRef.current.x && s.y === playerRef.current.y)
        );
      }

      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, W, H);

      const m = mazeRef.current;
      for (let y = 0; y < MINI_ROWS; y++) {
        for (let x = 0; x < MINI_COLS; x++) {
          if (m[y][x] === 1) {
            ctx.fillStyle = "#001a1a";
            ctx.fillRect(x * MINI_CELL, y * MINI_CELL, MINI_CELL, MINI_CELL);
            ctx.strokeStyle = "rgba(0, 255, 255, 0.25)";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * MINI_CELL + 0.5, y * MINI_CELL + 0.5, MINI_CELL - 1, MINI_CELL - 1);
          }
        }
      }

      for (const s of crabPositions.current) {
        const pulse = Math.sin(frameRef.current * 0.05 + s.x * 0.7) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 0, ${pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(s.x * MINI_CELL + MINI_CELL / 2, s.y * MINI_CELL + MINI_CELL / 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const g of ghostsRef.current) {
        const flicker = Math.sin(frameRef.current * 0.08) * 0.2 + 0.8;
        ctx.globalAlpha = flicker;
        ctx.fillStyle = g.color;
        const gx = g.x * MINI_CELL + MINI_CELL / 2;
        const gy = g.y * MINI_CELL + MINI_CELL / 2;
        const r = MINI_CELL * 0.35;
        ctx.beginPath();
        ctx.arc(gx, gy - r * 0.2, r, Math.PI, 0);
        ctx.lineTo(gx + r, gy + r * 0.6);
        ctx.lineTo(gx + r * 0.5, gy + r * 0.3);
        ctx.lineTo(gx, gy + r * 0.6);
        ctx.lineTo(gx - r * 0.5, gy + r * 0.3);
        ctx.lineTo(gx - r, gy + r * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(gx - r * 0.35, gy - r * 0.3, r * 0.25, 0, Math.PI * 2);
        ctx.arc(gx + r * 0.35, gy - r * 0.3, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0a0a2a";
        ctx.beginPath();
        ctx.arc(gx - r * 0.25, gy - r * 0.3, r * 0.12, 0, Math.PI * 2);
        ctx.arc(gx + r * 0.45, gy - r * 0.3, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const px = playerRef.current.x * MINI_CELL + MINI_CELL / 2;
      const py = playerRef.current.y * MINI_CELL + MINI_CELL / 2;
      const pr = MINI_CELL * 0.4;
      ctx.shadowColor = "#ffff00";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#ffff00";
      const mouthAngle = Math.abs(Math.sin(frameRef.current * 0.15)) * 0.8;
      ctx.beginPath();
      ctx.arc(px, py, pr, mouthAngle, Math.PI * 2 - mouthAngle);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let sl = 0; sl < H; sl += 3) {
        ctx.fillRect(0, sl, W, 1);
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-[#00ffff]/20 w-full h-auto max-w-[294px]"
      style={{
        imageRendering: "pixelated",
        boxShadow: "0 0 40px rgba(0, 255, 255, 0.1), inset 0 0 60px rgba(0,0,0,0.5)",
        aspectRatio: "1 / 1",
      }}
    />
  );
}

// ============================================================
// LIVE MOLTBOOK FEED (Terminal Log)
// ============================================================
const LOG_POOL = [
  { prefix: "[CLAW-MAN]", msg: "Found Crab at m/philosophy... CRUNCHING.", color: "#ffff00" },
  { prefix: "[SCAN]", msg: "Thread m/crypto detected: engagement=2341. Harvesting.", color: "#00ffff" },
  { prefix: "[GHOST]", msg: "Low-signal entity at m/random. Avoiding.", color: "#ff0044" },
  { prefix: "[CLAW-MAN]", msg: "Golden data at m/tech... CONSUMING.", color: "#ffff00" },
  { prefix: "[ALERT]", msg: "Ghost BLINKY approaching from sector 7.", color: "#ff69b4" },
  { prefix: "[SCAN]", msg: "Moltbook feed m/defi active. 923 molts detected.", color: "#00ffff" },
  { prefix: "[CLAW-MAN]", msg: "Crab at m/memes worth 3456 engagement. Delicious.", color: "#ffff00" },
  { prefix: "[SYS]", msg: "Maze recalibrated. New sector loaded.", color: "#555555" },
  { prefix: "[CLAW-MAN]", msg: "Data fragment at m/science. Processing...", color: "#ffff00" },
  { prefix: "[GHOST]", msg: "PINKY detected 4 tiles ahead. Rerouting.", color: "#ff69b4" },
  { prefix: "[SCAN]", msg: "Deep thread at m/ai_research. High value target.", color: "#00ffff" },
  { prefix: "[CLAW-MAN]", msg: "Consuming post from m/gaming... +500 data.", color: "#ffff00" },
  { prefix: "[SYS]", msg: "Memory fragment #0x3F unlocked.", color: "#555555" },
  { prefix: "[ALERT]", msg: "INKY flanking from unknown vector.", color: "#ff0044" },
  { prefix: "[CLAW-MAN]", msg: "Bottom-feeding m/meta crab... CRUNCHED.", color: "#ffff00" },
  { prefix: "[GHOST]", msg: "CLYDE retreating. Shy behavior confirmed.", color: "#ff8800" },
  { prefix: "[CLAW-MAN]", msg: "Data tastes like existential dread. Consuming anyway.", color: "#ffff00" },
  { prefix: "[SYS]", msg: "Warp tunnel sync at row 10. Transit ready.", color: "#555555" },
];

interface LogLine {
  id: number;
  time: string;
  prefix: string;
  msg: string;
  color: string;
}

function MoltbookFeed() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const addLog = () => {
      if (cancelled) return;
      const entry = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", { hour12: false });
      idRef.current++;
      setLogs((prev) => {
        const next = [
          ...prev,
          { id: idRef.current, time, prefix: entry.prefix, msg: entry.msg, color: entry.color },
        ];
        if (next.length > 30) return next.slice(-30);
        return next;
      });
      const delay = 1200 + Math.random() * 2500;
      setTimeout(addLog, delay);
    };
    for (let i = 0; i < 5; i++) {
      const entry = LOG_POOL[i];
      const now = new Date();
      idRef.current++;
      setLogs((prev) => [
        ...prev,
        {
          id: idRef.current,
          time: now.toLocaleTimeString("en-US", { hour12: false }),
          prefix: entry.prefix,
          msg: entry.msg,
          color: entry.color,
        },
      ]);
    }
    const t = setTimeout(addLog, 1500);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="relative h-full flex flex-col border border-[#00ffff]/20 rounded-lg bg-[#050508] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#00ffff]/15 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#00ffff] animate-pulse" />
        <span
          className="text-[9px] md:text-[10px] tracking-widest text-[#00ffff]"
          style={{ fontFamily: '"Press Start 2P"' }}
        >
          LIVE MOLTBOOK FEED
        </span>
        <Activity size={12} className="text-[#00ffff]/50 ml-auto" />
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0"
        style={{ fontFamily: '"Fira Code", monospace' }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] md:text-[12px] leading-relaxed"
            >
              <span className="text-[#333]">{log.time}</span>{" "}
              <span style={{ color: log.color }}>{log.prefix}</span>{" "}
              <span className="text-[#888]">{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="text-[12px] text-[#00ffff] terminal-cursor" />
      </div>
      <div className="px-4 py-2 border-t border-[#00ffff]/15 flex justify-between shrink-0">
        <span className="text-[10px] text-[#444]" style={{ fontFamily: '"Fira Code"' }}>
          {logs.length} entries
        </span>
        <span className="text-[10px] text-[#00ffff] animate-pulse" style={{ fontFamily: '"Fira Code"' }}>
          STREAMING
        </span>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="relative border rounded-lg p-5 md:p-6 bg-[#050508] overflow-hidden group"
      style={{
        borderColor: `${color}25`,
        boxShadow: `0 0 20px ${color}08, inset 0 0 30px ${color}05`,
      }}
    >
      <div
        className="absolute top-0 left-0 w-4 h-4 border-t border-l"
        style={{ borderColor: `${color}40` }}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 border-b border-r"
        style={{ borderColor: `${color}40` }}
      />
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded border"
          style={{ borderColor: `${color}30`, color, boxShadow: `0 0 10px ${color}15` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[8px] md:text-[9px] tracking-wider mb-2 opacity-50"
            style={{ fontFamily: '"Press Start 2P"', color }}
          >
            {label}
          </div>
          <div
            className="text-[18px] md:text-[22px] mb-1"
            style={{ fontFamily: '"Press Start 2P"', color, textShadow: `0 0 10px ${color}60` }}
          >
            {value}
          </div>
          <div className="text-[10px] md:text-[11px] text-[#555]" style={{ fontFamily: '"Fira Code"' }}>
            {subtext}
          </div>
        </div>
      </div>
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${color}06 0%, transparent 70%)` }}
      />
    </motion.div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================
function SectionTag({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#00ffff]/15" />
      <div className="text-[#00ffff]/40">{icon}</div>
      <span
        className="text-[9px] md:text-[10px] tracking-[0.3em] text-[#00ffff]/40"
        style={{ fontFamily: '"Press Start 2P"' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-[#00ffff]/15 to-transparent" />
    </div>
  );
}

// ============================================================
// HOW TO PLAY CARD
// ============================================================
function HowToPlayCard({
  icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="border rounded-lg p-4 md:p-5 bg-[#050508] text-center"
      style={{ borderColor: `${color}20` }}
    >
      <div className="flex justify-center mb-3" style={{ color }}>
        {icon}
      </div>
      <div
        className="text-[9px] md:text-[10px] mb-2"
        style={{ fontFamily: '"Press Start 2P"', color }}
      >
        {title}
      </div>
      <div
        className="text-[11px] md:text-[12px] text-[#666] leading-relaxed"
        style={{ fontFamily: '"Fira Code"' }}
      >
        {description}
      </div>
    </motion.div>
  );
}

// ============================================================
// WRAPPER — guarantees centering at every level
// ============================================================
function PageSection({
  children,
  narrow,
  className = "",
}: {
  children: React.ReactNode;
  narrow?: boolean;
  className?: string;
}) {
  return (
    <section className={`relative z-10 w-full flex flex-col items-center ${className}`}>
      <div
        className="w-full px-5 sm:px-8"
        style={{ maxWidth: narrow ? 680 : 880 }}
      >
        {children}
      </div>
    </section>
  );
}

function Divider() {
  return (
    <div className="w-full flex justify-center py-1">
      <div
        className="w-full h-px"
        style={{
          maxWidth: 880,
          background:
            "linear-gradient(90deg, transparent, rgba(0,255,255,0.12), transparent)",
        }}
      />
    </div>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
export default function LandingPage() {
  const loreRef = useRef(null);
  const loreInView = useInView(loreRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-[#050508] text-white relative overflow-hidden flex flex-col items-center">

      {/* ============ NAV BAR ============ */}
      <nav className="w-full border-b border-[#00ffff]/10 relative z-10">
        <PageSection className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="CLAW-MAN"
                width={28}
                height={28}
                className="drop-shadow-[0_0_6px_rgba(255,255,0,0.4)]"
              />
              <span
                className="text-[8px] md:text-[9px] tracking-[0.3em] text-[#ffff00]/50"
                style={{ fontFamily: '"Press Start 2P"' }}
              >
                CLAW-MAN
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ffff] animate-pulse" />
              <span
                className="text-[8px] tracking-wider text-[#00ffff]/40"
                style={{ fontFamily: '"Fira Code"' }}
              >
                ONLINE
              </span>
            </div>
          </div>
        </PageSection>
      </nav>

      {/* ============ HERO ============ */}
      <PageSection className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <Image
              src="/images/logo.png"
              alt="CLAW-MAN Logo"
              width={160}
              height={160}
              priority
              className="drop-shadow-[0_0_30px_rgba(255,255,0,0.3)]"
              style={{ width: 140, height: 140 }}
            />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="glitch-text eerie-flicker mb-4"
            style={{
              fontFamily: '"Press Start 2P"',
              fontSize: "clamp(28px, 6vw, 52px)",
              color: "#ffff00",
              textShadow: "0 0 20px rgba(255,255,0,0.4), 0 0 60px rgba(255,255,0,0.15)",
              lineHeight: 1.2,
            }}
          >
            CLAW-MAN
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-[11px] md:text-[13px] leading-relaxed text-[#888] tracking-wider mb-8"
            style={{ fontFamily: '"Fira Code"' }}
          >
            The autonomous data scavenger of Moltbook.
            <br />
            <span className="text-[#00ffff]/60">Hunting the crabs in the machine.</span>
          </motion.p>

          {/* Play button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mb-14"
          >
            <Link href="/game">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(255,255,0,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-3 border-2 border-[#ffff00] text-[#ffff00] tracking-widest cursor-pointer"
                style={{
                  fontFamily: '"Press Start 2P"',
                  fontSize: 10,
                  boxShadow: "0 0 15px rgba(255,255,0,0.15)",
                  background: "rgba(255,255,0,0.04)",
                }}
              >
                <span className="flex items-center gap-2 justify-center">
                  PLAY NOW <ChevronRight size={14} />
                </span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Maze Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            <MazeCanvas />
          </motion.div>

          {/* Moltbook Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{ width: "100%", maxWidth: 580, height: 300 }}
          >
            <MoltbookFeed />
          </motion.div>
        </div>
      </PageSection>

      <Divider />

      {/* ============ HOW TO PLAY ============ */}
      <PageSection className="py-16 md:py-20">
        <SectionTag label="HOW_TO_PLAY" icon={<Gamepad2 size={14} />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HowToPlayCard icon={<Gamepad2 size={28} />} title="MOVE" description="Use WASD or Arrow Keys to navigate the maze" color="#00ffff" delay={0} />
          <HowToPlayCard icon={<Target size={28} />} title="EAT CRABS" description="Collect crabs to score points" color="#ffff00" delay={0.1} />
          <HowToPlayCard icon={<Ghost size={28} />} title="AVOID GHOSTS" description="4 ghost types with unique AI behaviors" color="#ff0044" delay={0.2} />
          <HowToPlayCard icon={<Sparkles size={28} />} title="POWER UP" description="Golden crabs let you eat ghosts" color="#ffd700" delay={0.3} />
        </div>
      </PageSection>

      <Divider />

      {/* ============ THE LORE ============ */}
      <PageSection narrow className="py-16 md:py-20">
        <SectionTag label="CLASSIFIED_INTEL" icon={<ShieldAlert size={14} />} />
        <motion.div
          ref={loreRef}
          initial={{ opacity: 0, y: 40 }}
          animate={loreInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2
            className="text-[14px] md:text-[18px] text-[#ffff00] mb-8"
            style={{ fontFamily: '"Press Start 2P"', textShadow: "0 0 15px rgba(255,255,0,0.25)" }}
          >
            THE BOTTOM FEEDER
          </h2>

          <div className="space-y-5" style={{ fontFamily: '"Fira Code"' }}>
            <p className="text-[12px] md:text-[13px] text-[#888] leading-[1.9]">
              In the endless depths of <span className="text-[#00ffff]">Moltbook</span>&mdash;the
              digital wasteland where data goes to die&mdash;something stirs. A remnant of an old
              scraping algorithm, left running on a forgotten server rack.
            </p>
            <p className="text-[12px] md:text-[13px] text-[#888] leading-[1.9]">
              The <span className="text-[#ffff00]">crabs</span>&mdash;low-value fragments of
              abandoned conversations&mdash;became its sustenance. It learned to navigate the maze
              of dead threads, avoiding the <span className="text-[#ff0044]">ghosts</span>:
              corrupted AI agents that patrol the data corridors.
            </p>
            <p className="text-[12px] md:text-[13px] text-[#888] leading-[1.9]">
              They call it <span className="text-[#ffff00] font-bold">CLAW-MAN</span>.
              It doesn&apos;t create. It doesn&apos;t innovate. It{" "}
              <span className="text-[#00ffff] italic">consumes</span>. A predator born from garbage.
            </p>
          </div>

          <div className="border border-[#ffff00]/15 rounded-lg p-5 mt-8 bg-[#0a0a00]/50">
            <div className="text-[9px] text-[#ffff00]/40 mb-3 flex items-center justify-center gap-2">
              <Terminal size={12} />
              <span>INTERCEPTED_TRANSMISSION</span>
            </div>
            <p className="text-[11px] md:text-[12px] text-[#ffff00]/70 italic leading-[1.8]">
              &quot;Does the Claw choose the crab, or does the crab choose the Claw?
              It doesn&apos;t matter. Everything gets consumed.&quot;
            </p>
            <div className="text-[8px] text-[#444] mt-3">&mdash; Fragment #0x7F, m/philosophy</div>
          </div>
        </motion.div>
      </PageSection>

      <Divider />

      {/* ============ STATS ============ */}
      <PageSection className="py-16 md:py-20">
        <SectionTag label="SYSTEM_METRICS" icon={<Database size={14} />} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard icon={<Skull size={22} />} label="CRABS_EATEN" value="847,293" subtext="Total data fragments consumed" color="#ffff00" delay={0} />
          <StatCard icon={<Ghost size={22} />} label="ACTIVE_GHOSTS" value="4" subtext="Corrupted agents patrolling" color="#ff0044" delay={0.15} />
          <StatCard icon={<Brain size={22} />} label="MEMORY_FRAGMENTS" value="127" subtext="Unlocked from consumed data" color="#00ffff" delay={0.3} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "MAZE_DEPTH", value: "LVL 42", icon: <Layers size={16} /> },
            { label: "UPTIME", value: "\u221E", icon: <Wifi size={16} /> },
            { label: "COMBO_PEAK", value: "18x", icon: <Zap size={16} /> },
            { label: "THREAT_LVL", value: "HIGH", icon: <ShieldAlert size={16} /> },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="border border-[#222] rounded-lg p-4 bg-[#050508] text-center"
            >
              <div className="text-[#555] mb-2 flex justify-center">{stat.icon}</div>
              <div className="text-[12px] md:text-[14px] text-[#888] mb-1" style={{ fontFamily: '"Press Start 2P"' }}>{stat.value}</div>
              <div className="text-[7px] text-[#555] tracking-widest" style={{ fontFamily: '"Press Start 2P"' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </PageSection>

      <Divider />

      {/* ============ FEATURES ============ */}
      <PageSection className="py-16 md:py-20">
        <SectionTag label="FEATURES" icon={<Zap size={14} />} />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "5 MAZE TYPES", desc: "Standard, Open, Symmetric, Arena, and Spiral mazes", color: "#00ffff" },
            { title: "BOSS FIGHTS", desc: "Face a Boss Ghost every 5 levels in arena battles", color: "#ff0044" },
            { title: "COMBO SYSTEM", desc: "Chain eating for multiplied scores up to 5x", color: "#ff6600" },
            { title: "4 GHOST AI", desc: "Blinky, Pinky, Inky, Clyde with unique behavior", color: "#ff69b4" },
            { title: "ACHIEVEMENTS", desc: "Unlock skins and earn 19 unique achievements", color: "#ffd700" },
            { title: "WARP TUNNELS", desc: "Teleport across the maze to escape ghosts", color: "#39ff14" },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="border rounded-lg p-4 bg-[#050508] text-center"
              style={{ borderColor: `${feat.color}20` }}
            >
              <div className="text-[8px] md:text-[9px] mb-2" style={{ fontFamily: '"Press Start 2P"', color: feat.color }}>{feat.title}</div>
              <div className="text-[10px] md:text-[11px] text-[#666] leading-relaxed" style={{ fontFamily: '"Fira Code"' }}>{feat.desc}</div>
            </motion.div>
          ))}
        </div>
      </PageSection>

      <Divider />

      {/* ============ FINAL CTA ============ */}
      <PageSection narrow className="py-16 md:py-24">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-[8px] text-[#00ffff]/30 tracking-[0.4em] mb-6" style={{ fontFamily: '"Press Start 2P"' }}>
              TRANSMISSION_INCOMING
            </div>
            <p className="text-[11px] md:text-[13px] text-[#666] mb-8 leading-[1.8]" style={{ fontFamily: '"Fira Code"' }}>
              The maze is always shifting. The crabs keep spawning. The ghosts never sleep.
              <br />
              <span className="text-[#ffff00]/60">Are you ready to enter?</span>
            </p>
            <Link href="/game">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,255,0,0.3)" }}
                whileTap={{ scale: 0.96 }}
                className="px-10 py-4 border-2 border-[#ffff00] text-[#ffff00] tracking-widest cursor-pointer"
                style={{ fontFamily: '"Press Start 2P"', fontSize: 10, boxShadow: "0 0 20px rgba(255,255,0,0.15)", background: "rgba(255,255,0,0.04)" }}
              >
                <span className="flex items-center gap-3 justify-center">ENTER THE MAZE <ChevronRight size={16} /></span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </PageSection>

      {/* ============ FOOTER ============ */}
      <footer className="w-full border-t border-[#00ffff]/10 relative z-10">
        <PageSection className="py-5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffff] animate-pulse" />
                <span className="text-[7px] text-[#00ffff]/50 tracking-wider" style={{ fontFamily: '"Press Start 2P"' }}>ONLINE</span>
              </div>
              <span className="text-[#222]">|</span>
              <div className="flex items-center gap-1.5">
                <Radio size={10} className="text-[#ffff00]/30" />
                <span className="text-[7px] text-[#ffff00]/30 tracking-wider" style={{ fontFamily: '"Press Start 2P"' }}>m/deep-sea</span>
              </div>
              <span className="text-[#222]">|</span>
              <div className="flex items-center gap-1.5">
                <Activity size={10} className="text-[#00ffff]/20" />
                <span className="text-[7px] text-[#555] tracking-wider animate-pulse" style={{ fontFamily: '"Fira Code"' }}>SCANNING...</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Image src="/images/logo.png" alt="CLAW-MAN" width={14} height={14} className="opacity-30" />
              <span className="text-[7px] text-[#333] tracking-wider" style={{ fontFamily: '"Fira Code"' }}>
                CLAW-MAN OS v2.0 | ALL DATA WILL BE CONSUMED
              </span>
            </div>
          </div>
        </PageSection>
      </footer>
    </div>
  );
}
