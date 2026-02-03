import Phaser from "phaser";
import {
  TILE_SIZE, COLORS, CELL_TYPES, GAME_SPEED, GHOST_SPEED,
  GHOST_NAMES, GHOST_NICKNAMES, GHOST_BEHAVIORS,
  BOSS_LEVEL_INTERVAL, BOSS_HP, BOSS_SPEED_MULT, BOSS_SCORE,
  COMBO_WINDOW_MS, COMBO_MAX,
  FRUIT_EMOJIS, FRUIT_POINTS,
  POWER_UPS, POWER_UP_SPAWN_CHANCE, POWER_UP_SPAWN_INTERVAL,
  DIFFICULTIES, SPECIAL_GHOSTS,
  type PowerUpType, type Difficulty, type GameMode, type SpecialGhostType,
} from "../config";
import type { MazeConfig } from "@/lib/gameState";
import { generateMaze, getMazeTypeForLevel, getRandomCommentary, simulateMoltbookActivity } from "@/lib/gameState";
import type { CRTTheme } from "@/lib/themes";
import { getTheme } from "@/lib/themes";
import type { ClawSkin } from "@/lib/skins";
import { getSkin } from "@/lib/skins";
import { createReplayRecorder, saveReplay, type ReplayData } from "@/lib/replay";

// === POWER-UP OBJECT ===
interface PowerUpObj {
  sprite: Phaser.GameObjects.Text;
  type: PowerUpType;
  gridX: number;
  gridY: number;
}

// === SPECIAL GHOST ===
interface SpecialGhostObj {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  gridX: number;
  gridY: number;
  direction: { x: number; y: number };
  moving: boolean;
  type: SpecialGhostType;
  hp: number;
  lastAbilityTime: number;
  children?: SpecialGhostObj[]; // For splitter ghost children
}

// Ghost personalities like original Pac-Man
type GhostMode = "chase" | "scatter" | "frightened";

interface GhostObj {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  skirt: Phaser.GameObjects.Graphics;
  eyeL: Phaser.GameObjects.Arc;
  eyeR: Phaser.GameObjects.Arc;
  pupilL: Phaser.GameObjects.Arc;
  pupilR: Phaser.GameObjects.Arc;
  gridX: number;
  gridY: number;
  direction: { x: number; y: number };
  color: number;
  moving: boolean;
  personality: number;
  scatterTarget: { x: number; y: number };
  eaten: boolean;
  spawnX: number;
  spawnY: number;
}

interface BossGhostObj {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  eye: Phaser.GameObjects.Arc;
  pupil: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Graphics;
  gridX: number;
  gridY: number;
  direction: { x: number; y: number };
  moving: boolean;
  hp: number;
  maxHp: number;
  active: boolean;
  spawnX: number;
  spawnY: number;
}

// === RETRO SOUND GENERATOR (Web Audio API) ===
class RetroSFX {
  private ctx: AudioContext | null = null;
  private bgmOsc: OscillatorNode | null = null;
  private bgmLfo: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  public masterVolume = 0.7;
  public sfxVolume = 0.8;
  public musicVolume = 0.5;
  public sfxEnabled = true;
  public musicEnabled = true;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); } catch { return null; }
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  private getEffectiveVolume(): number {
    if (!this.sfxEnabled) return 0;
    return this.masterVolume * this.sfxVolume;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = "square", vol = 0.15) {
    const ctx = this.getCtx();
    if (!ctx || !this.sfxEnabled) return;
    const effectiveVol = vol * this.getEffectiveVolume();
    if (effectiveVol <= 0) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  chomp() {
    this.playTone(200, 0.08, "square", 0.1);
    setTimeout(() => this.playTone(160, 0.08, "square", 0.1), 80);
  }
  eatGolden() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 0.12, "square", 0.12), i * 60));
  }
  ghostHit() {
    this.playTone(400, 0.15, "sawtooth", 0.15);
    setTimeout(() => this.playTone(200, 0.3, "sawtooth", 0.12), 100);
    setTimeout(() => this.playTone(100, 0.4, "sawtooth", 0.1), 250);
  }
  eatGhost() {
    [400, 600, 800, 1200].forEach((f, i) => setTimeout(() => this.playTone(f, 0.08, "square", 0.12), i * 40));
  }
  powerUp() {
    [262, 330, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.playTone(f, 0.15, "triangle", 0.1), i * 70));
  }
  levelUp() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.playTone(f, 0.12, "square", 0.12), i * 80));
  }
  death() {
    [500, 450, 400, 350, 300, 250, 200, 150].forEach((f, i) => setTimeout(() => this.playTone(f, 0.12, "sawtooth", 0.12), i * 80));
  }
  fruit() {
    [800, 1000, 1200, 1000, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 0.06, "triangle", 0.1), i * 50));
  }
  combo() {
    this.playTone(600, 0.05, "square", 0.08);
    setTimeout(() => this.playTone(800, 0.05, "square", 0.08), 50);
  }
  bossHit() {
    [200, 300, 400, 600].forEach((f, i) => setTimeout(() => this.playTone(f, 0.1, "sawtooth", 0.15), i * 50));
  }
  bossDeath() {
    [300, 400, 500, 600, 800, 1000, 1200, 1600].forEach((f, i) => setTimeout(() => this.playTone(f, 0.15, "square", 0.15), i * 60));
  }
  warp() {
    [1000, 800, 600, 400, 600, 800, 1000].forEach((f, i) => setTimeout(() => this.playTone(f, 0.04, "sine", 0.08), i * 30));
  }
  achievement() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.playTone(f, 0.15, "triangle", 0.12), i * 100));
  }
  // Power-up specific sounds
  speedBoost() {
    [600, 800, 1000, 1200, 1400].forEach((f, i) => setTimeout(() => this.playTone(f, 0.1, "square", 0.12), i * 40));
  }
  shieldActivate() {
    [300, 400, 500, 600, 500, 400, 300].forEach((f, i) => setTimeout(() => this.playTone(f, 0.1, "triangle", 0.1), i * 50));
  }
  magnetActivate() {
    [200, 400, 200, 400, 200, 400].forEach((f, i) => setTimeout(() => this.playTone(f, 0.08, "sawtooth", 0.08), i * 60));
  }
  freezeActivate() {
    [1200, 1000, 800, 600, 400, 200].forEach((f, i) => setTimeout(() => this.playTone(f, 0.15, "sine", 0.1), i * 70));
  }
  teleportGhost() {
    [800, 600, 400, 600, 800].forEach((f, i) => setTimeout(() => this.playTone(f, 0.05, "sine", 0.08), i * 30));
  }
  splitGhost() {
    [400, 300, 500, 400, 600, 500].forEach((f, i) => setTimeout(() => this.playTone(f, 0.06, "sawtooth", 0.1), i * 40));
  }
  timerWarning() {
    this.playTone(800, 0.1, "square", 0.15);
    setTimeout(() => this.playTone(600, 0.1, "square", 0.15), 150);
  }

  startBgm() {
    if (this.bgmOsc || !this.musicEnabled) return; // Already playing or disabled
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 80;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.value = 0.03 * this.masterVolume * this.musicVolume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    lfo.start();
    this.bgmOsc = osc;
    this.bgmLfo = lfo;
    this.bgmGain = gain;
  }

  updateBgmVolume() {
    if (this.bgmGain) {
      const vol = this.musicEnabled ? 0.03 * this.masterVolume * this.musicVolume : 0;
      this.bgmGain.gain.value = vol;
    }
  }

  setVolumes(master: number, sfx: number, music: number, sfxEnabled: boolean, musicEnabled: boolean) {
    this.masterVolume = master;
    this.sfxVolume = sfx;
    this.musicVolume = music;
    this.sfxEnabled = sfxEnabled;
    this.musicEnabled = musicEnabled;
    this.updateBgmVolume();
    if (!musicEnabled) {
      this.stopBgm();
    } else if (!this.bgmOsc) {
      this.startBgm();
    }
  }

  stopBgm() {
    try {
      this.bgmOsc?.stop();
      this.bgmLfo?.stop();
    } catch { /* already stopped */ }
    this.bgmOsc = null;
    this.bgmLfo = null;
    this.bgmGain = null;
  }

  destroy() {
    this.stopBgm();
    try { this.ctx?.close(); } catch { /* noop */ }
    this.ctx = null;
  }
}

export default class MainScene extends Phaser.Scene {
  private maze!: MazeConfig;
  private wallLayer!: Phaser.GameObjects.Graphics;
  private clawMan!: Phaser.GameObjects.Container;
  private clawBody!: Phaser.GameObjects.Arc;
  private clawMouth!: Phaser.GameObjects.Graphics;
  private crabs: Map<string, Phaser.GameObjects.Text> = new Map();
  private ghostObjs: GhostObj[] = [];

  // Grid position
  private gridX = 1;
  private gridY = 1;
  private targetX = 1;
  private targetY = 1;
  private isMoving = false;
  private moveDir = { x: 0, y: 0 };
  private nextDir = { x: 0, y: 0 };
  private touchDir = { x: 0, y: 0 };

  // Keys
  private kUp!: Phaser.Input.Keyboard.Key;
  private kDown!: Phaser.Input.Keyboard.Key;
  private kLeft!: Phaser.Input.Keyboard.Key;
  private kRight!: Phaser.Input.Keyboard.Key;
  private kW!: Phaser.Input.Keyboard.Key;
  private kA!: Phaser.Input.Keyboard.Key;
  private kS!: Phaser.Input.Keyboard.Key;
  private kD!: Phaser.Input.Keyboard.Key;

  // Game state
  private score = 0;
  private lives = 3;
  private level = 1;
  private mouthAngle = 0;
  private mouthDir = 1;
  private invincible = false;
  private invincibleTimer = 0;
  private dead = false;
  private highScore = 0;
  private paused = false;

  // Ghost mode
  private ghostMode: GhostMode = "scatter";
  private ghostModeTimer = 0;
  private ghostModePhase = 0;
  private readonly ghostPhases: { mode: GhostMode; duration: number }[] = [
    { mode: "scatter", duration: 7000 },
    { mode: "chase", duration: 20000 },
    { mode: "scatter", duration: 7000 },
    { mode: "chase", duration: 20000 },
    { mode: "scatter", duration: 5000 },
    { mode: "chase", duration: Infinity },
  ];

  // Frightened mode
  private frightenedTimer = 0;
  private frightenedDuration = 8000;
  private frightenedBlinkStart = 5500;
  private ghostsEatenCombo = 0;
  private preFrightenedMode: GhostMode = "scatter";

  // Power-up timer bar
  private powerBarBg!: Phaser.GameObjects.Graphics;
  private powerBarFill!: Phaser.GameObjects.Graphics;

  // Fruit bonus
  private fruitObj: Phaser.GameObjects.Text | null = null;
  private fruitGridX = 0;
  private fruitGridY = 0;
  private fruitTimer = 0;
  private fruitInterval = 15000;
  private fruitDuration = 8000;
  private fruitSpawnedAt = 0;
  private crabEatenCount = 0;

  // Particles (player trail)
  private particles: Phaser.GameObjects.Arc[] = [];

  // Sound
  private sfx = new RetroSFX();
  private bgmStarted = false;

  // === COMBO SYSTEM ===
  private comboCount = 0;
  private lastEatTime = 0;
  private comboText: Phaser.GameObjects.Text | null = null;

  // === BOSS GHOST ===
  private bossGhost: BossGhostObj | null = null;
  private isBossLevel = false;

  // === THEME ===
  private theme!: CRTTheme;

  // === SKIN ===
  private skin!: ClawSkin;
  private rainbowHue = 0;

  // === POWER-UPS ===
  private powerUps: Map<string, PowerUpObj> = new Map();
  private activePowerUp: PowerUpType | null = null;
  private powerUpEndTime = 0;
  private lastPowerUpSpawn = 0;
  private speedBoostActive = false;
  private shieldActive = false;
  private magnetActive = false;
  private freezeActive = false;
  private powerUpIndicator: Phaser.GameObjects.Text | null = null;

  // === SPECIAL GHOSTS ===
  private specialGhosts: SpecialGhostObj[] = [];

  // === GAME MODE ===
  private gameMode: GameMode = "classic";
  private difficulty: Difficulty = "normal";
  private timeAttackTimer = 0;
  private timeAttackStartTime = 0;
  private timerText: Phaser.GameObjects.Text | null = null;
  private endlessWave = 0;

  // === CO-OP (Player 2) ===
  private isCoopMode = false;
  private player2!: Phaser.GameObjects.Container | null;
  private player2Body!: Phaser.GameObjects.Arc | null;
  private player2GridX = 1;
  private player2GridY = 1;
  private player2TargetX = 1;
  private player2TargetY = 1;
  private player2Moving = false;
  private player2MoveDir = { x: 0, y: 0 };
  private player2NextDir = { x: 0, y: 0 };
  private player2Lives = 3;
  private player2Invincible = false;
  private player2InvincibleTimer = 0;
  // Player 2 Keys (IJKL)
  private kI!: Phaser.Input.Keyboard.Key;
  private kJ!: Phaser.Input.Keyboard.Key;
  private kK!: Phaser.Input.Keyboard.Key;
  private kL!: Phaser.Input.Keyboard.Key;

  // === MINIMAP ===
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private minimapSize = 80;
  private minimapScale = 0;

  // === REPLAY ===
  private replayRecorder = createReplayRecorder();

  // === GHOST TRAIL ===
  private ghostParticles: Phaser.GameObjects.Arc[] = [];

  // === CUTSCENE ===
  private showingCutscene = false;

  // === STATS (for achievements) ===
  private statsTracker = {
    ghostsEaten: 0,
    fruitsEaten: 0,
    deaths: 0,
    bossesDefeated: 0,
  };

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private themeText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private comboHudText!: Phaser.GameObjects.Text;

  // Callbacks
  private onScoreUpdate?: (score: number) => void;
  private onCrabConsumed?: (type: string, source: string) => void;
  private onGhostHit?: () => void;
  private onCommentary?: (text: string) => void;
  private onLog?: (message: string, type: string) => void;
  private onLevelComplete?: () => void;
  private onAchievementStats?: (stats: Record<string, number>) => void;
  private onComboUpdate?: (combo: number) => void;

  constructor() {
    super({ key: "MainScene" });
  }

  init(data: {
    maze?: MazeConfig;
    onScoreUpdate?: (score: number) => void;
    onCrabConsumed?: (type: string, source: string) => void;
    onGhostHit?: () => void;
    onCommentary?: (text: string) => void;
    onLog?: (message: string, type: string) => void;
    onLevelComplete?: () => void;
    onAchievementStats?: (stats: Record<string, number>) => void;
    onComboUpdate?: (combo: number) => void;
    onTimeUpdate?: (timeLeft: number) => void;
    onPowerUpChange?: (type: PowerUpType | null, duration: number) => void;
    onGameModeEvent?: (event: string, data?: unknown) => void;
    themeId?: string;
    skinId?: string;
    seed?: number;
    gameMode?: GameMode;
    difficulty?: Difficulty;
  }) {
    this.maze = data.maze || generateMaze(21, 21, undefined, data.seed);
    this.onScoreUpdate = data.onScoreUpdate;
    this.onCrabConsumed = data.onCrabConsumed;
    this.onGhostHit = data.onGhostHit;
    this.onCommentary = data.onCommentary;
    this.onLog = data.onLog;
    this.onLevelComplete = data.onLevelComplete;
    this.onAchievementStats = data.onAchievementStats;
    this.onComboUpdate = data.onComboUpdate;
    this.onTimeUpdate = data.onTimeUpdate;
    this.onPowerUpChange = data.onPowerUpChange;
    this.onGameModeEvent = data.onGameModeEvent;
    this.theme = getTheme(data.themeId || "green");
    this.skin = getSkin(data.skinId || "default");
    this.gameMode = data.gameMode || "classic";
    this.difficulty = data.difficulty || "normal";
    this.isCoopMode = this.gameMode === "coop";
  }

  // Additional callbacks
  private onTimeUpdate?: (timeLeft: number) => void;
  private onPowerUpChange?: (type: PowerUpType | null, duration: number) => void;
  private onGameModeEvent?: (event: string, data?: unknown) => void;

  create() {
    // Get difficulty settings
    const diffConfig = DIFFICULTIES[this.difficulty];

    this.score = 0;
    this.lives = diffConfig.lives;
    this.level = 1;
    this.gridX = 1;
    this.gridY = 1;
    this.targetX = 1;
    this.targetY = 1;
    this.isMoving = false;
    this.moveDir = { x: 0, y: 0 };
    this.nextDir = { x: 0, y: 0 };
    this.invincible = false;
    this.dead = false;
    this.paused = false;
    this.crabs = new Map();
    this.ghostObjs = [];
    this.particles = [];
    this.ghostParticles = [];
    this.fruitObj = null;
    this.crabEatenCount = 0;
    this.comboCount = 0;
    this.lastEatTime = 0;
    this.bossGhost = null;
    this.isBossLevel = false;
    this.showingCutscene = false;
    this.rainbowHue = 0;
    this.statsTracker = { ghostsEaten: 0, fruitsEaten: 0, deaths: 0, bossesDefeated: 0 };

    // Power-up reset
    this.powerUps = new Map();
    this.activePowerUp = null;
    this.powerUpEndTime = 0;
    this.lastPowerUpSpawn = 0;
    this.speedBoostActive = false;
    this.shieldActive = false;
    this.magnetActive = false;
    this.freezeActive = false;

    // Special ghosts reset
    this.specialGhosts = [];

    // Game mode specific
    this.timeAttackTimer = 0;
    this.timeAttackStartTime = this.time.now;
    this.endlessWave = 0;

    // Co-op reset
    this.player2 = null;
    this.player2Body = null;
    this.player2Lives = diffConfig.lives;
    this.player2Invincible = false;

    // Frightened duration based on difficulty
    this.frightenedDuration = diffConfig.frightDuration;

    // Load high score
    try {
      this.highScore = parseInt(localStorage.getItem("clawman-highscore") || "0", 10) || 0;
    } catch { this.highScore = 0; }

    this.drawMaze();
    this.placeCrabs();
    this.createClawMan();
    this.createGhosts();
    this.setupInput();
    this.createHUD();
    this.createPowerBar();
    this.createMinimap();

    // Create co-op player if needed
    if (this.isCoopMode) {
      this.createPlayer2();
    }

    // Create timer for time attack mode
    if (this.gameMode === "timeAttack") {
      this.createTimerHUD();
    }

    // Start replay recording
    this.replayRecorder.start();

    // Show ghost personalities on first level
    this.showGhostPersonalities();

    this.onLog?.("CLAW-MAN deployed to maze", "system");
    this.onLog?.(`Mode: ${this.gameMode.toUpperCase()} | Difficulty: ${this.difficulty.toUpperCase()}`, "system");
    this.onLog?.(`Maze type: ${this.maze.mazeType.toUpperCase()} | ${this.maze.theme}`, "system");
    if (this.maze.hasWarpTunnel) {
      this.onLog?.("WARP TUNNELS active on left/right edges!", "system");
    }

    this.game.canvas.setAttribute("tabindex", "0");
    this.game.canvas.focus();

    this.input.once("pointerdown", () => {
      if (!this.bgmStarted) {
        this.sfx.startBgm();
        this.bgmStarted = true;
      }
    });
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    // Player 1: WASD + Arrows
    this.kUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.kDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.kLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.kRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.kW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.kA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.kS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.kD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    // Player 2: IJKL (for co-op mode)
    this.kI = kb.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.kJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.kK = kb.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.kL = kb.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    // Pause key
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", () => {
      this.togglePause();
    });
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.P).on("down", () => {
      this.togglePause();
    });
  }

  public togglePause() {
    this.paused = !this.paused;
    this.onGameModeEvent?.(this.paused ? "paused" : "resumed");
  }

  // === PLAYER 2 (CO-OP) ===
  private createPlayer2() {
    // Spawn player 2 at opposite corner
    this.player2GridX = this.maze.width - 2;
    this.player2GridY = this.maze.height - 2;
    // Find valid spawn
    for (let y = this.maze.height - 2; y > 0; y--) {
      for (let x = this.maze.width - 2; x > 0; x--) {
        if (this.maze.grid[y][x] !== CELL_TYPES.WALL) {
          this.player2GridX = x;
          this.player2GridY = y;
          y = 0;
          break;
        }
      }
    }
    this.player2TargetX = this.player2GridX;
    this.player2TargetY = this.player2GridY;

    const px = this.player2GridX * TILE_SIZE + TILE_SIZE / 2;
    const py = this.player2GridY * TILE_SIZE + TILE_SIZE / 2;
    const r = TILE_SIZE * 0.4;
    this.player2Body = this.add.circle(0, 0, r, 0x00ffff); // Cyan for P2
    const mouth = this.add.graphics();
    mouth.fillStyle(this.theme.pathColor);
    mouth.beginPath();
    mouth.moveTo(0, 0);
    const rad = Phaser.Math.DegToRad(30);
    mouth.lineTo(r * Math.cos(-rad), r * Math.sin(-rad));
    mouth.lineTo(r, 0);
    mouth.lineTo(r * Math.cos(rad), r * Math.sin(rad));
    mouth.closePath();
    mouth.fillPath();
    this.player2 = this.add.container(px, py, [this.player2Body, mouth]);
    this.player2.setDepth(10);

    // P2 label
    const label = this.add.text(0, -r - 5, "P2", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "6px",
      color: "#00ffff",
    }).setOrigin(0.5);
    this.player2.add(label);
  }

  private readPlayer2Input() {
    if (!this.isCoopMode || !this.player2) return;
    let dx = 0;
    let dy = 0;
    if (this.kJ?.isDown) { dx = -1; }
    else if (this.kL?.isDown) { dx = 1; }
    else if (this.kI?.isDown) { dy = -1; }
    else if (this.kK?.isDown) { dy = 1; }
    this.player2NextDir = { x: dx, y: dy };
  }

  private movePlayer2(delta: number) {
    if (!this.isCoopMode || !this.player2 || this.player2Lives <= 0) return;
    const diffConfig = DIFFICULTIES[this.difficulty];
    const speed = GAME_SPEED * diffConfig.playerSpeedMult * (delta / 1000) * TILE_SIZE;

    if (this.player2Moving) {
      const tx = this.player2TargetX * TILE_SIZE + TILE_SIZE / 2;
      const ty = this.player2TargetY * TILE_SIZE + TILE_SIZE / 2;
      const dx = tx - this.player2.x;
      const dy = ty - this.player2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= speed || dist < 1) {
        this.player2.x = tx;
        this.player2.y = ty;
        this.player2GridX = this.player2TargetX;
        this.player2GridY = this.player2TargetY;
        this.player2Moving = false;
        this.eatCrabAtPosition(this.player2GridX, this.player2GridY, true);
      } else {
        this.player2.x += (dx / dist) * speed;
        this.player2.y += (dy / dist) * speed;
      }
    }

    if (!this.player2Moving) {
      if (this.player2NextDir.x === 0 && this.player2NextDir.y === 0) {
        this.player2MoveDir = { x: 0, y: 0 };
        return;
      }
      const nx = this.player2GridX + this.player2NextDir.x;
      const ny = this.player2GridY + this.player2NextDir.y;
      if (this.canMoveTo(nx, ny)) {
        this.player2MoveDir = { ...this.player2NextDir };
        this.player2TargetX = nx;
        this.player2TargetY = ny;
        this.player2Moving = true;
        // Rotate P2
        const { x, y } = this.player2MoveDir;
        if (x === 1 && y === 0) this.player2.setAngle(0);
        else if (x === -1 && y === 0) this.player2.setAngle(180);
        else if (x === 0 && y === -1) this.player2.setAngle(-90);
        else if (x === 0 && y === 1) this.player2.setAngle(90);
      }
    }

    // Handle invincibility
    if (this.player2Invincible && this.time.now > this.player2InvincibleTimer) {
      this.player2Invincible = false;
      this.player2.setAlpha(1);
    }
    if (this.player2Invincible) {
      this.player2.setAlpha(Math.sin(this.time.now * 0.01) > 0 ? 1 : 0.3);
    }
  }

  // === TIMER HUD (Time Attack) ===
  private createTimerHUD() {
    this.timerText = this.add.text(
      this.maze.width * TILE_SIZE / 2,
      8,
      "3:00",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "12px",
        color: "#ff6600",
      }
    ).setOrigin(0.5, 0).setDepth(100);
  }

  private updateTimeAttack(time: number) {
    if (this.gameMode !== "timeAttack") return;

    const elapsed = time - this.timeAttackStartTime;
    const totalMs = 180000; // 3 minutes
    const remaining = Math.max(0, totalMs - elapsed);
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (this.timerText) {
      this.timerText.setText(`${minutes}:${secs.toString().padStart(2, "0")}`);
      // Change color as time runs low
      if (remaining < 30000) {
        this.timerText.setColor("#ff0000");
        if (secs % 2 === 0 && remaining > 0) {
          this.sfx.timerWarning();
        }
      } else if (remaining < 60000) {
        this.timerText.setColor("#ff6600");
      }
    }

    this.onTimeUpdate?.(remaining);

    // Game over when time runs out
    if (remaining <= 0 && !this.dead) {
      this.onLog?.("TIME'S UP! Final score: " + this.score, "system");
      this.onGameModeEvent?.("timeUp", { score: this.score, level: this.level });
      this.paused = true;
    }
  }

  // === HUD ===
  private createHUD() {
    const hudY = this.maze.height * TILE_SIZE + 2;
    const fontFamily = '"Press Start 2P", monospace';
    this.scoreText = this.add.text(8, hudY, "SCORE: 0", { fontFamily, fontSize: "8px", color: this.theme.primaryCSS });
    this.highScoreText = this.add.text(8, hudY + 12, `HI: ${this.highScore}`, { fontFamily, fontSize: "7px", color: "#888" });
    this.livesText = this.add.text(8, hudY + 24, "LIVES: ❤❤❤", { fontFamily, fontSize: "8px", color: this.theme.accentCSS });
    this.levelText = this.add.text(300, hudY, "LVL 1", { fontFamily, fontSize: "8px", color: this.theme.secondaryCSS });
    this.themeText = this.add.text(300, hudY + 12, this.maze.theme, { fontFamily, fontSize: "6px", color: "#ffd700" });
    this.comboHudText = this.add.text(300, hudY + 24, "", { fontFamily, fontSize: "8px", color: "#ff6600" });
    this.comboHudText.setVisible(false);
  }

  // === POWER BAR ===
  private createPowerBar() {
    this.powerBarBg = this.add.graphics().setDepth(15).setVisible(false);
    this.powerBarFill = this.add.graphics().setDepth(16).setVisible(false);
  }

  private updatePowerBar(time: number) {
    if (this.ghostMode !== "frightened") {
      this.powerBarBg.setVisible(false);
      this.powerBarFill.setVisible(false);
      return;
    }
    const elapsed = time - this.frightenedTimer;
    const remaining = Math.max(0, 1 - elapsed / this.frightenedDuration);
    const barW = this.maze.width * TILE_SIZE - 16;
    const barH = 4;
    const barX = 8;
    const barY = 2;
    this.powerBarBg.setVisible(true).clear().fillStyle(0x333333, 0.8).fillRect(barX, barY, barW, barH);
    this.powerBarFill.setVisible(true).clear().fillStyle(remaining > 0.3 ? 0x2222ff : 0xff4444, 0.9).fillRect(barX, barY, barW * remaining, barH);
  }

  // === MINIMAP ===
  private createMinimap() {
    this.minimapScale = this.minimapSize / Math.max(this.maze.width, this.maze.height);
    this.minimapGfx = this.add.graphics().setDepth(50).setAlpha(0.7);
    this.minimapGfx.setScrollFactor(0);
  }

  private updateMinimap() {
    const g = this.minimapGfx;
    g.clear();
    const offX = this.maze.width * TILE_SIZE - this.minimapSize - 6;
    const offY = 8;
    const s = this.minimapScale;

    // Background
    g.fillStyle(0x000000, 0.6);
    g.fillRect(offX - 2, offY - 2, this.minimapSize + 4, this.minimapSize + 4);
    g.lineStyle(1, this.theme.wallBorderColor, 0.5);
    g.strokeRect(offX - 2, offY - 2, this.minimapSize + 4, this.minimapSize + 4);

    // Walls
    g.fillStyle(this.theme.wallBorderColor, 0.3);
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        if (this.maze.grid[y][x] === CELL_TYPES.WALL) {
          g.fillRect(offX + x * s, offY + y * s, Math.max(1, s), Math.max(1, s));
        }
      }
    }

    // Player dot
    g.fillStyle(this.skin.color, 1);
    g.fillCircle(offX + this.gridX * s + s / 2, offY + this.gridY * s + s / 2, 2);

    // Ghost dots
    for (const gh of this.ghostObjs) {
      if (!gh.eaten) {
        const c = this.ghostMode === "frightened" ? 0x2222ff : gh.color;
        g.fillStyle(c, 0.8);
        g.fillCircle(offX + gh.gridX * s + s / 2, offY + gh.gridY * s + s / 2, 1.5);
      }
    }

    // Boss dot
    if (this.bossGhost?.active) {
      g.fillStyle(0xff0000, 1);
      g.fillCircle(offX + this.bossGhost.gridX * s + s / 2, offY + this.bossGhost.gridY * s + s / 2, 3);
    }
  }

  // === DRAW MAZE ===
  private drawMaze() {
    this.wallLayer = this.add.graphics();
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        if (this.maze.grid[y][x] === CELL_TYPES.WALL) {
          this.wallLayer.fillStyle(this.theme.wallColor, 1);
          this.wallLayer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          this.wallLayer.lineStyle(1.5, this.theme.wallBorderColor, 0.7);
          if (y > 0 && this.maze.grid[y - 1][x] !== CELL_TYPES.WALL)
            this.wallLayer.strokeLineShape(new Phaser.Geom.Line(px, py, px + TILE_SIZE, py));
          if (y < this.maze.height - 1 && this.maze.grid[y + 1][x] !== CELL_TYPES.WALL)
            this.wallLayer.strokeLineShape(new Phaser.Geom.Line(px, py + TILE_SIZE, px + TILE_SIZE, py + TILE_SIZE));
          if (x > 0 && this.maze.grid[y][x - 1] !== CELL_TYPES.WALL)
            this.wallLayer.strokeLineShape(new Phaser.Geom.Line(px, py, px, py + TILE_SIZE));
          if (x < this.maze.width - 1 && this.maze.grid[y][x + 1] !== CELL_TYPES.WALL)
            this.wallLayer.strokeLineShape(new Phaser.Geom.Line(px + TILE_SIZE, py, px + TILE_SIZE, py + TILE_SIZE));
        } else {
          this.wallLayer.fillStyle(this.theme.pathColor, 1);
          this.wallLayer.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw warp tunnel indicators
    if (this.maze.hasWarpTunnel) {
      const ty = this.maze.warpTunnelY;
      const arrowColor = this.theme.secondaryCSS;
      // Left tunnel arrow
      this.add.text(2, ty * TILE_SIZE + 4, "◄", { fontSize: "12px", color: arrowColor }).setDepth(5).setAlpha(0.6);
      // Right tunnel arrow
      this.add.text(this.maze.width * TILE_SIZE - 14, ty * TILE_SIZE + 4, "►", { fontSize: "12px", color: arrowColor }).setDepth(5).setAlpha(0.6);
    }
  }

  // === CRABS ===
  private placeCrabs() {
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.maze.grid[y][x];
        if (cell === CELL_TYPES.CRAB || cell === CELL_TYPES.GOLDEN_CRAB) {
          const isGolden = cell === CELL_TYPES.GOLDEN_CRAB;
          const key = `${x}-${y}`;
          const emoji = this.add
            .text(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "🦀", { fontSize: isGolden ? "14px" : "10px" })
            .setOrigin(0.5);
          if (isGolden) {
            this.tweens.add({ targets: emoji, scaleX: 1.3, scaleY: 1.3, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
          this.crabs.set(key, emoji);
        }
      }
    }
  }

  // === CLAW-MAN ===
  private createClawMan() {
    const px = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    const py = this.gridY * TILE_SIZE + TILE_SIZE / 2;
    const r = TILE_SIZE * 0.4;
    this.clawBody = this.add.circle(0, 0, r, this.skin.color);
    this.clawMouth = this.add.graphics();
    this.drawMouth(30);
    this.clawMan = this.add.container(px, py, [this.clawBody, this.clawMouth]);
    this.clawMan.setDepth(10);
  }

  private drawMouth(angle: number) {
    const r = TILE_SIZE * 0.42;
    this.clawMouth.clear();
    this.clawMouth.fillStyle(this.theme.pathColor);
    this.clawMouth.beginPath();
    this.clawMouth.moveTo(0, 0);
    const rad = Phaser.Math.DegToRad(angle);
    this.clawMouth.lineTo(r * Math.cos(-rad), r * Math.sin(-rad));
    this.clawMouth.lineTo(r, 0);
    this.clawMouth.lineTo(r * Math.cos(rad), r * Math.sin(rad));
    this.clawMouth.closePath();
    this.clawMouth.fillPath();
  }

  // === GHOSTS ===
  private createGhosts() {
    const spawnPoints = this.findGhostSpawns();
    for (let i = 0; i < Math.min(4, spawnPoints.length); i++) {
      const pos = spawnPoints[i];
      const color = COLORS.GHOST_COLORS[i];
      const r = TILE_SIZE * 0.35;
      const body = this.add.circle(0, 0, r, color);
      const skirt = this.add.graphics();
      skirt.fillStyle(color);
      skirt.fillRect(-r, 0, r * 2, r * 0.4);
      const eyeL = this.add.circle(-3, -3, 3, 0xffffff);
      const eyeR = this.add.circle(4, -3, 3, 0xffffff);
      const pupilL = this.add.circle(-3, -3, 1.5, 0x000000);
      const pupilR = this.add.circle(4, -3, 1.5, 0x000000);
      const container = this.add.container(
        pos.x * TILE_SIZE + TILE_SIZE / 2,
        pos.y * TILE_SIZE + TILE_SIZE / 2,
        [body, skirt, eyeL, eyeR, pupilL, pupilR]
      );
      container.setDepth(9);
      const corners = [
        { x: this.maze.width - 2, y: 1 },
        { x: 1, y: 1 },
        { x: this.maze.width - 2, y: this.maze.height - 2 },
        { x: 1, y: this.maze.height - 2 },
      ];
      this.ghostObjs.push({
        container, body, skirt, eyeL, eyeR, pupilL, pupilR,
        gridX: pos.x, gridY: pos.y,
        direction: { x: 0, y: 0 }, color, moving: false, personality: i,
        scatterTarget: corners[i], eaten: false, spawnX: pos.x, spawnY: pos.y,
      });
    }
  }

  private findGhostSpawns(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const midX = Math.floor(this.maze.width / 2);
    const midY = Math.floor(this.maze.height / 2);
    for (let r = 0; r < Math.max(this.maze.width, this.maze.height) && points.length < 4; r++) {
      for (let dy = -r; dy <= r && points.length < 4; dy++) {
        for (let dx = -r; dx <= r && points.length < 4; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const x = midX + dx;
          const y = midY + dy;
          if (x > 0 && x < this.maze.width - 1 && y > 0 && y < this.maze.height - 1 &&
            this.maze.grid[y][x] !== CELL_TYPES.WALL && !(x <= 2 && y <= 2)) {
            points.push({ x, y });
          }
        }
      }
    }
    return points;
  }

  // === GHOST PERSONALITY DISPLAY ===
  private showGhostPersonalities() {
    const cx = this.maze.width * TILE_SIZE / 2;
    const cy = this.maze.height * TILE_SIZE / 2;
    const objs: Phaser.GameObjects.Text[] = [];
    const title = this.add.text(cx, cy - 60, "MEET THE GHOSTS", {
      fontFamily: '"Press Start 2P", monospace', fontSize: "10px", color: this.theme.secondaryCSS,
      stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    objs.push(title);
    this.tweens.add({ targets: title, alpha: 1, duration: 300 });

    const ghostColors = ["#ff0000", "#ff69b4", "#00bfff", "#ffa500"];
    for (let i = 0; i < 4; i++) {
      const yOff = cy - 30 + i * 22;
      const nameText = this.add.text(cx, yOff, `${GHOST_NAMES[i]} "${GHOST_NICKNAMES[i]}"`, {
        fontFamily: '"Press Start 2P", monospace', fontSize: "7px", color: ghostColors[i],
        stroke: "#000", strokeThickness: 2,
      }).setOrigin(0.5).setDepth(100).setAlpha(0);
      objs.push(nameText);
      this.tweens.add({ targets: nameText, alpha: 1, duration: 300, delay: 200 + i * 150 });

      const behaviorText = this.add.text(cx, yOff + 10, GHOST_BEHAVIORS[i], {
        fontFamily: '"Press Start 2P", monospace', fontSize: "5px", color: "#888",
        stroke: "#000", strokeThickness: 1,
      }).setOrigin(0.5).setDepth(100).setAlpha(0);
      objs.push(behaviorText);
      this.tweens.add({ targets: behaviorText, alpha: 1, duration: 300, delay: 300 + i * 150 });
    }

    // Fade out after 3s
    this.time.delayedCall(3000, () => {
      objs.forEach((o) => this.tweens.add({ targets: o, alpha: 0, duration: 500, onComplete: () => o.destroy() }));
    });
  }

  // === BOSS GHOST ===
  private createBossGhost() {
    const midX = Math.floor(this.maze.width / 2);
    const midY = Math.floor(this.maze.height / 2);
    // Find open tile near center for boss
    let bx = midX, by = midY;
    for (let r = 0; r < 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = midX + dx, ty = midY + dy;
          if (tx > 0 && tx < this.maze.width - 1 && ty > 0 && ty < this.maze.height - 1 &&
            this.maze.grid[ty][tx] !== CELL_TYPES.WALL) {
            bx = tx; by = ty; r = 99; dy = 99; break;
          }
        }
      }
    }

    const bigR = TILE_SIZE * 0.6;
    const body = this.add.circle(0, 0, bigR, 0xff0000);
    const eye = this.add.circle(0, -4, 5, 0xffffff);
    const pupil = this.add.circle(0, -4, 2.5, 0x000000);
    const hpBar = this.add.graphics();
    const container = this.add.container(
      bx * TILE_SIZE + TILE_SIZE / 2,
      by * TILE_SIZE + TILE_SIZE / 2,
      [body, eye, pupil, hpBar]
    );
    container.setDepth(11);

    // Pulsing aura
    this.tweens.add({
      targets: body, scaleX: 1.15, scaleY: 1.15,
      duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.bossGhost = {
      container, body, eye, pupil, hpBar,
      gridX: bx, gridY: by,
      direction: { x: 0, y: 0 }, moving: false,
      hp: BOSS_HP, maxHp: BOSS_HP, active: true,
      spawnX: bx, spawnY: by,
    };

    this.updateBossHpBar();
    this.onLog?.("BOSS GHOST has appeared! Eat golden crabs to power up!", "ghost");
    this.cameras.main.shake(500, 0.015);
  }

  private updateBossHpBar() {
    if (!this.bossGhost) return;
    const g = this.bossGhost.hpBar;
    g.clear();
    const w = 24;
    const h = 4;
    g.fillStyle(0x333333, 0.8);
    g.fillRect(-w / 2, -TILE_SIZE * 0.6 - 8, w, h);
    const pct = this.bossGhost.hp / this.bossGhost.maxHp;
    const color = pct > 0.5 ? 0xff0000 : pct > 0.25 ? 0xff6600 : 0xffff00;
    g.fillStyle(color, 1);
    g.fillRect(-w / 2, -TILE_SIZE * 0.6 - 8, w * pct, h);
  }

  private moveBossGhost(delta: number) {
    if (!this.bossGhost?.active) return;
    const b = this.bossGhost;
    const speed = GHOST_SPEED * BOSS_SPEED_MULT * (delta / 1000) * TILE_SIZE;

    if (!b.moving) {
      // Boss always chases player directly
      const allDirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
      const dirs = allDirs.filter((d) => {
        if (!this.canMoveTo(b.gridX + d.x, b.gridY + d.y)) return false;
        if (d.x === -b.direction.x && d.y === -b.direction.y) return false;
        return true;
      });
      if (dirs.length === 0) {
        const reverse = allDirs.filter((d) => this.canMoveTo(b.gridX + d.x, b.gridY + d.y));
        if (reverse.length > 0) { b.direction = reverse[0]; b.moving = true; }
        return;
      }
      // Target player
      dirs.sort((a, c) => {
        const dxA = (b.gridX + a.x) - this.gridX, dyA = (b.gridY + a.y) - this.gridY;
        const dxC = (b.gridX + c.x) - this.gridX, dyC = (b.gridY + c.y) - this.gridY;
        return (dxA * dxA + dyA * dyA) - (dxC * dxC + dyC * dyC);
      });
      b.direction = this.ghostMode === "frightened" ? dirs[dirs.length - 1] : dirs[0];
      b.moving = true;
    }

    if (b.moving) {
      const tx = (b.gridX + b.direction.x) * TILE_SIZE + TILE_SIZE / 2;
      const ty = (b.gridY + b.direction.y) * TILE_SIZE + TILE_SIZE / 2;
      const dx = tx - b.container.x;
      const dy = ty - b.container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= speed || dist < 1) {
        b.gridX += b.direction.x;
        b.gridY += b.direction.y;
        b.container.x = b.gridX * TILE_SIZE + TILE_SIZE / 2;
        b.container.y = b.gridY * TILE_SIZE + TILE_SIZE / 2;
        b.moving = false;
      } else {
        b.container.x += (dx / dist) * speed;
        b.container.y += (dy / dist) * speed;
      }
    }
  }

  private checkBossCollision(time: number) {
    if (!this.bossGhost?.active) return;
    const b = this.bossGhost;
    const dx = Math.abs(this.clawMan.x - b.container.x);
    const dy = Math.abs(this.clawMan.y - b.container.y);
    if (dx < TILE_SIZE * 0.7 && dy < TILE_SIZE * 0.7) {
      if (this.ghostMode === "frightened") {
        this.hitBoss();
      } else if (!this.invincible) {
        this.hitByGhost(time);
      }
    }
  }

  private hitBoss() {
    if (!this.bossGhost) return;
    this.bossGhost.hp--;
    this.sfx.bossHit();
    this.cameras.main.shake(300, 0.015);
    this.updateBossHpBar();

    const popup = this.add.text(this.bossGhost.container.x, this.bossGhost.container.y - 20, `HIT! ${this.bossGhost.hp}HP`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "10px", color: "#ff4444",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 800, onComplete: () => popup.destroy() });

    // Flash boss
    this.tweens.add({
      targets: this.bossGhost.body, alpha: 0.2, duration: 100, yoyo: true, repeat: 3,
    });

    if (this.bossGhost.hp <= 0) {
      this.defeatBoss();
    }

    this.onLog?.(`BOSS HIT! ${this.bossGhost.hp} HP remaining!`, "consume");
  }

  private defeatBoss() {
    if (!this.bossGhost) return;
    this.sfx.bossDeath();
    this.score += BOSS_SCORE;
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.onScoreUpdate?.(this.score);
    this.updateHighScore();
    this.statsTracker.bossesDefeated++;
    this.emitStats();

    const popup = this.add.text(this.bossGhost.container.x, this.bossGhost.container.y - 20, `BOSS DEFEATED! +${BOSS_SCORE}`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "10px", color: "#ffd700",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: popup, y: popup.y - 40, alpha: 0, duration: 1500, onComplete: () => popup.destroy() });

    // Death animation
    this.tweens.add({
      targets: this.bossGhost.container, scaleX: 2, scaleY: 2, alpha: 0, angle: 360,
      duration: 1000, onComplete: () => {
        this.bossGhost?.container.destroy();
        this.bossGhost = null;
      },
    });
    this.bossGhost.active = false;

    this.cameras.main.flash(800, 255, 215, 0);
    this.onLog?.(`BOSS GHOST DEFEATED! +${BOSS_SCORE} points!`, "consume");
  }

  // === UPDATE LOOP ===
  update(time: number, delta: number) {
    if (this.dead || this.paused || this.showingCutscene) return;

    this.readInput();
    this.movePlayer(delta);

    // Don't move ghosts if frozen
    if (!this.freezeActive) {
      this.updateGhostMode(time);
      this.moveAllGhosts(delta);
      this.updateGhostTrails();
    }

    this.checkGhostCollisions(time);
    this.animateClawMouth(delta);
    this.updatePowerBar(time);
    this.updateFruit(time);
    this.updateCombo(time);
    this.updateMinimap();
    this.updateRainbowSkin(time);
    this.updatePowerUps(time);
    this.updateSpecialGhosts(time, delta);

    // Boss ghost
    if (this.isBossLevel && this.bossGhost?.active && !this.freezeActive) {
      this.moveBossGhost(delta);
      this.checkBossCollision(time);
    }

    // Co-op player 2
    if (this.isCoopMode) {
      this.readPlayer2Input();
      this.movePlayer2(delta);
      this.checkPlayer2GhostCollisions(time);
    }

    // Time attack mode
    this.updateTimeAttack(time);

    // Endless mode wave management
    if (this.gameMode === "endless") {
      this.updateEndlessMode(time);
    }

    // Record replay
    this.replayRecorder.recordFrame(this.gridX, this.gridY, this.moveDir.x, this.moveDir.y);

    // Invincibility
    if (this.invincible && time > this.invincibleTimer) {
      this.invincible = false;
      this.clawMan.setAlpha(1);
    }
    if (this.invincible) {
      this.clawMan.setAlpha(Math.sin(time * 0.01) > 0 ? 1 : 0.3);
    }
  }

  // === ENDLESS MODE ===
  private updateEndlessMode(time: number) {
    // Increase difficulty every 30 seconds
    const newWave = Math.floor((time - this.timeAttackStartTime) / 30000);
    if (newWave > this.endlessWave) {
      this.endlessWave = newWave;
      // Spawn additional ghosts or increase speed
      this.onLog?.(`WAVE ${this.endlessWave + 1}! Difficulty increased!`, "system");
      this.onGameModeEvent?.("waveChange", { wave: this.endlessWave + 1 });
      this.cameras.main.flash(300, 255, 165, 0);
    }
  }

  // === CHECK PLAYER 2 COLLISIONS ===
  private checkPlayer2GhostCollisions(time: number) {
    if (!this.player2 || this.player2Lives <= 0) return;

    for (const g of this.ghostObjs) {
      if (g.eaten) continue;
      const dx = Math.abs(this.player2.x - g.container.x);
      const dy = Math.abs(this.player2.y - g.container.y);
      if (dx < TILE_SIZE * 0.5 && dy < TILE_SIZE * 0.5) {
        if (this.ghostMode === "frightened") {
          this.eatGhost(g);
        } else if (!this.player2Invincible) {
          this.player2HitByGhost(time);
          return;
        }
      }
    }
  }

  private player2HitByGhost(time: number) {
    if (!this.player2) return;

    this.player2Lives--;
    this.sfx.death();
    this.onLog?.(`PLAYER 2 hit! Lives: ${this.player2Lives}`, "ghost");
    this.cameras.main.shake(200, 0.015);

    if (this.player2Lives <= 0) {
      this.onLog?.("PLAYER 2 eliminated!", "system");
      this.player2.destroy();
      this.player2 = null;
      return;
    }

    // Reset P2 position
    this.player2GridX = this.maze.width - 2;
    this.player2GridY = this.maze.height - 2;
    this.player2TargetX = this.player2GridX;
    this.player2TargetY = this.player2GridY;
    this.player2Moving = false;
    this.player2.x = this.player2GridX * TILE_SIZE + TILE_SIZE / 2;
    this.player2.y = this.player2GridY * TILE_SIZE + TILE_SIZE / 2;
    this.player2Invincible = true;
    this.player2InvincibleTimer = time + 2500;
  }

  // Eat crab at specific position (for P2 or magnet)
  private eatCrabAtPosition(gx: number, gy: number, isPlayer2 = false) {
    const key = `${gx}-${gy}`;
    const obj = this.crabs.get(key);
    if (!obj) {
      this.checkPowerUpPickup(gx, gy);
      return;
    }

    const isGolden = this.maze.grid[gy][gx] === CELL_TYPES.GOLDEN_CRAB;
    const time = this.time.now;

    this.incrementCombo(time);
    const multiplier = this.getComboMultiplier();

    const basePts = isGolden ? 50 : 10;
    const pts = basePts * multiplier;
    this.score += pts;
    this.maze.grid[gy][gx] = CELL_TYPES.EMPTY;
    this.crabEatenCount++;

    if (isGolden) {
      this.sfx.eatGolden();
      this.activateFrightenedMode();
      this.cameras.main.shake(100, 0.005);
    } else {
      this.sfx.chomp();
    }

    this.tweens.add({ targets: obj, scaleX: 2, scaleY: 2, alpha: 0, duration: 200, onComplete: () => obj.destroy() });

    const popupColor = multiplier > 1 ? "#ff6600" : (isGolden ? "#ffd700" : "#39ff14");
    const popupText = multiplier > 1 ? `+${pts} (${multiplier}x)` : `+${pts}`;
    const popup = this.add.text(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE, popupText, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "8px", color: popupColor,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: popup, y: popup.y - 24, alpha: 0, duration: 500, onComplete: () => popup.destroy() });

    this.crabs.delete(key);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.onScoreUpdate?.(this.score);
    this.updateHighScore();

    const source = isPlayer2 ? "Player 2" : simulateMoltbookActivity().source;
    this.onCrabConsumed?.(isGolden ? "golden" : "normal", source);

    // Check power-up pickup
    this.checkPowerUpPickup(gx, gy);

    if (this.crabs.size === 0) {
      this.nextLevel();
    }
  }

  private readInput() {
    let dx = 0;
    let dy = 0;
    if (this.kLeft?.isDown || this.kA?.isDown) { dx = -1; }
    else if (this.kRight?.isDown || this.kD?.isDown) { dx = 1; }
    else if (this.kUp?.isDown || this.kW?.isDown) { dy = -1; }
    else if (this.kDown?.isDown || this.kS?.isDown) { dy = 1; }
    if (this.touchDir.x !== 0 || this.touchDir.y !== 0) {
      dx = this.touchDir.x;
      dy = this.touchDir.y;
    }
    this.nextDir = { x: dx, y: dy };
  }

  public setTouchDirection(dir: { x: number; y: number }) {
    this.touchDir = { x: dir.x, y: dir.y };
  }

  private canMoveTo(gx: number, gy: number): boolean {
    // Warp tunnel: allow moving off-screen at warp row
    if (this.maze.hasWarpTunnel && gy === this.maze.warpTunnelY) {
      if (gx < 0 || gx >= this.maze.width) return true;
    }
    return gx >= 0 && gx < this.maze.width && gy >= 0 && gy < this.maze.height &&
      this.maze.grid[gy][gx] !== CELL_TYPES.WALL;
  }

  private movePlayer(delta: number) {
    const diffConfig = DIFFICULTIES[this.difficulty];
    const speedMult = this.speedBoostActive ? 1.5 : 1.0;
    const speed = GAME_SPEED * diffConfig.playerSpeedMult * speedMult * (delta / 1000) * TILE_SIZE;
    if (this.isMoving) {
      const tx = this.targetX * TILE_SIZE + TILE_SIZE / 2;
      const ty = this.targetY * TILE_SIZE + TILE_SIZE / 2;
      const dx = tx - this.clawMan.x;
      const dy = ty - this.clawMan.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= speed || dist < 1) {
        this.clawMan.x = tx;
        this.clawMan.y = ty;
        this.gridX = this.targetX;
        this.gridY = this.targetY;
        this.isMoving = false;
        this.eatCrab(this.gridX, this.gridY);
        this.checkFruitPickup();
        // Check warp tunnel
        this.checkWarpTunnel();
      } else {
        this.clawMan.x += (dx / dist) * speed;
        this.clawMan.y += (dy / dist) * speed;
        this.spawnParticle(this.clawMan.x, this.clawMan.y);
      }
    }
    if (!this.isMoving) {
      if (this.nextDir.x === 0 && this.nextDir.y === 0) {
        this.moveDir = { x: 0, y: 0 };
        return;
      }
      const nx = this.gridX + this.nextDir.x;
      const ny = this.gridY + this.nextDir.y;
      if (this.canMoveTo(nx, ny)) {
        this.moveDir = { ...this.nextDir };
        this.targetX = nx;
        this.targetY = ny;
        this.isMoving = true;
        this.setClawRotation();
      }
    }
  }

  // === WARP TUNNEL ===
  private checkWarpTunnel() {
    if (!this.maze.hasWarpTunnel) return;
    if (this.gridY !== this.maze.warpTunnelY) return;

    if (this.gridX <= 0) {
      // Teleport to right side
      this.gridX = this.maze.width - 2;
      this.targetX = this.gridX;
      this.clawMan.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
      this.sfx.warp();
      this.onLog?.("WARP! Teleported to right tunnel!", "system");
    } else if (this.gridX >= this.maze.width - 1) {
      // Teleport to left side
      this.gridX = 1;
      this.targetX = this.gridX;
      this.clawMan.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
      this.sfx.warp();
      this.onLog?.("WARP! Teleported to left tunnel!", "system");
    }
  }

  private setClawRotation() {
    const { x, y } = this.moveDir;
    if (x === 1 && y === 0) this.clawMan.setAngle(0);
    else if (x === -1 && y === 0) this.clawMan.setAngle(180);
    else if (x === 0 && y === -1) this.clawMan.setAngle(-90);
    else if (x === 0 && y === 1) this.clawMan.setAngle(90);
  }

  private animateClawMouth(delta: number) {
    this.mouthAngle += this.mouthDir * delta * 0.3;
    if (this.mouthAngle > 35) { this.mouthAngle = 35; this.mouthDir = -1; }
    if (this.mouthAngle < 2) { this.mouthAngle = 2; this.mouthDir = 1; }
    this.drawMouth(this.mouthAngle);
  }

  // === RAINBOW SKIN ===
  private updateRainbowSkin(time: number) {
    if (!this.skin.rainbow) return;
    this.rainbowHue = (this.rainbowHue + 2) % 360;
    const c = Phaser.Display.Color.HSLToColor(this.rainbowHue / 360, 1, 0.5);
    this.clawBody.setFillStyle(c.color);
  }

  // === PARTICLE POOL ===
  private particlePool: Phaser.GameObjects.Arc[] = [];
  private ghostParticlePool: Phaser.GameObjects.Arc[] = [];
  private readonly PARTICLE_POOL_SIZE = 30;
  private readonly GHOST_PARTICLE_POOL_SIZE = 40;

  private getPooledParticle(pool: Phaser.GameObjects.Arc[], poolArray: Phaser.GameObjects.Arc[], radius: number, depth: number): Phaser.GameObjects.Arc {
    // Reuse inactive particle from pool
    for (const p of pool) {
      if (!p.visible) {
        return p;
      }
    }
    // Create new if pool not at max
    if (pool.length < (poolArray === this.particlePool ? this.PARTICLE_POOL_SIZE : this.GHOST_PARTICLE_POOL_SIZE)) {
      const p = this.add.circle(0, 0, radius, 0xffffff, 0).setDepth(depth).setVisible(false);
      pool.push(p);
      return p;
    }
    // Steal oldest visible particle
    const oldest = pool[0];
    oldest.setVisible(false);
    return oldest;
  }

  // === PARTICLE TRAIL ===
  private spawnParticle(px: number, py: number) {
    if (Math.random() > 0.3) return;
    const color = this.skin.particleColor || this.skin.color;
    const p = this.getPooledParticle(this.particlePool, this.particlePool, 2, 5);
    p.setPosition(px, py).setFillStyle(color, 0.5).setScale(1).setAlpha(0.5).setVisible(true);
    this.tweens.add({
      targets: p, alpha: 0, scaleX: 0.1, scaleY: 0.1,
      duration: 300,
      onComplete: () => { p.setVisible(false); },
    });
  }

  // === GHOST TRAIL EFFECTS ===
  private updateGhostTrails() {
    for (const g of this.ghostObjs) {
      if (g.eaten || !g.moving) continue;
      if (Math.random() > 0.15) continue;
      const p = this.getPooledParticle(this.ghostParticlePool, this.ghostParticlePool, 1.5, 4);
      p.setPosition(g.container.x, g.container.y).setFillStyle(g.color, 0.3).setScale(1).setAlpha(0.3).setVisible(true);
      this.tweens.add({
        targets: p, alpha: 0, scaleX: 0.1, scaleY: 0.1,
        duration: 400,
        onComplete: () => { p.setVisible(false); },
      });
    }
  }

  // === COMBO SYSTEM ===
  private updateCombo(time: number) {
    if (this.comboCount > 0 && time - this.lastEatTime > COMBO_WINDOW_MS) {
      // Combo expired
      if (this.comboCount >= 3) {
        this.onLog?.(`Combo ended at ${this.comboCount}x!`, "system");
      }
      this.comboCount = 0;
      this.comboHudText.setVisible(false);
      this.onComboUpdate?.(0);
    }
  }

  private incrementCombo(time: number) {
    const timeSinceLastEat = time - this.lastEatTime;
    if (timeSinceLastEat < COMBO_WINDOW_MS && this.comboCount > 0) {
      this.comboCount = Math.min(this.comboCount + 1, COMBO_MAX);
    } else {
      this.comboCount = 1;
    }
    this.lastEatTime = time;
    this.onComboUpdate?.(this.comboCount);

    if (this.comboCount >= 2) {
      this.sfx.combo();
      this.comboHudText.setText(`${this.comboCount}x COMBO`);
      this.comboHudText.setVisible(true);

      // Show floating combo text
      if (this.comboCount >= 3) {
        const colors = ["#ff6600", "#ff4400", "#ff0000", "#ff00ff", "#ffd700"];
        const colorIdx = Math.min(this.comboCount - 3, colors.length - 1);
        const ct = this.add.text(this.clawMan.x, this.clawMan.y - 20, `${this.comboCount}x!`, {
          fontFamily: '"Press Start 2P", monospace', fontSize: "12px", color: colors[colorIdx],
          stroke: "#000", strokeThickness: 2,
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: ct, y: ct.y - 30, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 600, onComplete: () => ct.destroy() });
      }
    }
  }

  private getComboMultiplier(): number {
    if (this.comboCount < 2) return 1;
    if (this.comboCount < 5) return 2;
    if (this.comboCount < 10) return 3;
    if (this.comboCount < 15) return 4;
    return 5;
  }

  // === POWER-UP SYSTEM ===
  private maybeSpawnPowerUp(time: number) {
    const diffConfig = DIFFICULTIES[this.difficulty];
    const chance = POWER_UP_SPAWN_CHANCE * diffConfig.powerUpFrequency;

    if (time - this.lastPowerUpSpawn < POWER_UP_SPAWN_INTERVAL) return;
    if (Math.random() > chance) return;

    // Find empty cell
    const emptyCells: { x: number; y: number }[] = [];
    for (let y = 1; y < this.maze.height - 1; y++) {
      for (let x = 1; x < this.maze.width - 1; x++) {
        if (this.maze.grid[y][x] === CELL_TYPES.EMPTY && !this.crabs.has(`${x}-${y}`) && !this.powerUps.has(`${x}-${y}`)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) return;

    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const types: PowerUpType[] = ["speed", "shield", "magnet", "freeze"];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWER_UPS[type];

    const sprite = this.add.text(
      cell.x * TILE_SIZE + TILE_SIZE / 2,
      cell.y * TILE_SIZE + TILE_SIZE / 2,
      config.icon,
      { fontSize: "16px" }
    ).setOrigin(0.5).setDepth(8);

    // Animate
    this.tweens.add({
      targets: sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.powerUps.set(`${cell.x}-${cell.y}`, {
      sprite,
      type,
      gridX: cell.x,
      gridY: cell.y,
    });

    this.lastPowerUpSpawn = time;
    this.onLog?.(`${config.name} appeared in the maze!`, "spawn");
  }

  private checkPowerUpPickup(gx: number, gy: number) {
    const key = `${gx}-${gy}`;
    const powerUp = this.powerUps.get(key);
    if (!powerUp) return;

    this.activatePowerUp(powerUp.type);
    powerUp.sprite.destroy();
    this.powerUps.delete(key);
  }

  private activatePowerUp(type: PowerUpType) {
    const config = POWER_UPS[type];
    this.activePowerUp = type;
    this.powerUpEndTime = this.time.now + config.duration;

    // Deactivate previous power-ups
    this.speedBoostActive = false;
    this.shieldActive = false;
    this.magnetActive = false;
    this.freezeActive = false;

    // Activate new power-up
    switch (type) {
      case "speed":
        this.speedBoostActive = true;
        this.sfx.speedBoost();
        break;
      case "shield":
        this.shieldActive = true;
        this.sfx.shieldActivate();
        // Visual shield effect
        const shield = this.add.circle(0, 0, TILE_SIZE * 0.55, 0x00ffff, 0.3);
        this.clawMan.add(shield);
        this.tweens.add({
          targets: shield,
          alpha: { from: 0.5, to: 0.1 },
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
        this.time.delayedCall(config.duration, () => shield.destroy());
        break;
      case "magnet":
        this.magnetActive = true;
        this.sfx.magnetActivate();
        break;
      case "freeze":
        this.freezeActive = true;
        this.sfx.freezeActivate();
        // Visual freeze effect on ghosts
        for (const g of this.ghostObjs) {
          if (!g.eaten) {
            this.tweens.add({
              targets: g.container,
              alpha: 0.5,
              duration: 200,
            });
          }
        }
        break;
    }

    this.onPowerUpChange?.(type, config.duration);
    this.onLog?.(`${config.name} activated! ${config.description}`, "consume");
    this.updatePowerUpIndicator();
  }

  private updatePowerUps(time: number) {
    // Check for power-up expiration
    if (this.activePowerUp && time > this.powerUpEndTime) {
      this.deactivatePowerUp();
    }

    // Magnet effect: attract nearby crabs
    if (this.magnetActive) {
      this.attractCrabs();
    }

    // Maybe spawn new power-up
    this.maybeSpawnPowerUp(time);
  }

  private attractCrabs() {
    const magnetRange = 4; // tiles
    const attractSpeed = 0.05;

    this.crabs.forEach((emoji, key) => {
      const [xStr, yStr] = key.split("-");
      const cx = parseInt(xStr);
      const cy = parseInt(yStr);

      const dx = this.gridX - cx;
      const dy = this.gridY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < magnetRange && dist > 0.5) {
        // Move emoji toward player visually
        const targetX = emoji.x + (dx / dist) * TILE_SIZE * attractSpeed;
        const targetY = emoji.y + (dy / dist) * TILE_SIZE * attractSpeed;
        emoji.setPosition(targetX, targetY);
      }
    });
  }

  private deactivatePowerUp() {
    if (this.freezeActive) {
      // Restore ghost alpha
      for (const g of this.ghostObjs) {
        this.tweens.add({
          targets: g.container,
          alpha: 1,
          duration: 200,
        });
      }
    }

    this.activePowerUp = null;
    this.speedBoostActive = false;
    this.shieldActive = false;
    this.magnetActive = false;
    this.freezeActive = false;

    this.onPowerUpChange?.(null, 0);
    this.onLog?.("Power-up expired!", "system");
    this.updatePowerUpIndicator();
  }

  private updatePowerUpIndicator() {
    if (this.powerUpIndicator) {
      this.powerUpIndicator.destroy();
      this.powerUpIndicator = null;
    }

    if (this.activePowerUp) {
      const config = POWER_UPS[this.activePowerUp];
      this.powerUpIndicator = this.add.text(
        this.maze.width * TILE_SIZE / 2,
        this.maze.height * TILE_SIZE + 38,
        `${config.icon} ${config.name}`,
        {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: "7px",
          color: `#${config.color.toString(16).padStart(6, "0")}`,
        }
      ).setOrigin(0.5).setDepth(100);
    }
  }

  // === SPECIAL GHOSTS ===
  private maybeSpawnSpecialGhost() {
    // Check if level meets requirements
    for (const [type, config] of Object.entries(SPECIAL_GHOSTS)) {
      if (this.level >= config.spawnLevel && Math.random() < 0.3) {
        this.spawnSpecialGhost(type as SpecialGhostType);
        return; // Only spawn one per level
      }
    }
  }

  private spawnSpecialGhost(type: SpecialGhostType) {
    const config = SPECIAL_GHOSTS[type];
    const midX = Math.floor(this.maze.width / 2);
    const midY = Math.floor(this.maze.height / 2);

    // Find spawn point
    let sx = midX, sy = midY;
    for (let r = 0; r < 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = midX + dx, ty = midY + dy;
          if (tx > 0 && tx < this.maze.width - 1 && ty > 0 && ty < this.maze.height - 1 &&
            this.maze.grid[ty][tx] !== CELL_TYPES.WALL) {
            sx = tx; sy = ty; r = 99; dy = 99; break;
          }
        }
      }
    }

    const body = this.add.circle(0, 0, TILE_SIZE * 0.4, config.color);
    const eye = this.add.circle(0, -2, 4, 0xffffff);
    const pupil = this.add.circle(0, -2, 2, 0x000000);
    const label = this.add.text(0, TILE_SIZE * 0.5, config.name, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "5px",
      color: `#${config.color.toString(16).padStart(6, "0")}`,
    }).setOrigin(0.5);

    const container = this.add.container(
      sx * TILE_SIZE + TILE_SIZE / 2,
      sy * TILE_SIZE + TILE_SIZE / 2,
      [body, eye, pupil, label]
    ).setDepth(11);

    const ghost: SpecialGhostObj = {
      container,
      body,
      gridX: sx,
      gridY: sy,
      direction: { x: 0, y: 0 },
      moving: false,
      type,
      hp: type === "splitter" ? 2 : 1,
      lastAbilityTime: this.time.now,
    };

    this.specialGhosts.push(ghost);
    this.onLog?.(`${config.name} has appeared! ${config.ability}`, "ghost");
    this.cameras.main.shake(300, 0.01);
  }

  private updateSpecialGhosts(time: number, delta: number) {
    for (const ghost of this.specialGhosts) {
      this.moveSpecialGhost(ghost, delta);
      this.handleSpecialGhostAbility(ghost, time);
      this.checkSpecialGhostCollision(ghost, time);
    }
  }

  private moveSpecialGhost(ghost: SpecialGhostObj, delta: number) {
    if (this.freezeActive) return; // Frozen

    const speed = GHOST_SPEED * DIFFICULTIES[this.difficulty].ghostSpeedMult * (delta / 1000) * TILE_SIZE;

    if (!ghost.moving) {
      const allDirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
      const dirs = allDirs.filter((d) => {
        const nx = ghost.gridX + d.x;
        const ny = ghost.gridY + d.y;
        return this.canMoveTo(nx, ny) && !(d.x === -ghost.direction.x && d.y === -ghost.direction.y);
      });

      if (dirs.length > 0) {
        // Chase player
        dirs.sort((a, b) => {
          const dxA = (ghost.gridX + a.x) - this.gridX;
          const dyA = (ghost.gridY + a.y) - this.gridY;
          const dxB = (ghost.gridX + b.x) - this.gridX;
          const dyB = (ghost.gridY + b.y) - this.gridY;
          return (dxA * dxA + dyA * dyA) - (dxB * dxB + dyB * dyB);
        });
        ghost.direction = dirs[0];
        ghost.moving = true;
      }
    }

    if (ghost.moving) {
      const tx = (ghost.gridX + ghost.direction.x) * TILE_SIZE + TILE_SIZE / 2;
      const ty = (ghost.gridY + ghost.direction.y) * TILE_SIZE + TILE_SIZE / 2;
      const dx = tx - ghost.container.x;
      const dy = ty - ghost.container.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= speed || dist < 1) {
        ghost.gridX += ghost.direction.x;
        ghost.gridY += ghost.direction.y;
        ghost.container.x = ghost.gridX * TILE_SIZE + TILE_SIZE / 2;
        ghost.container.y = ghost.gridY * TILE_SIZE + TILE_SIZE / 2;
        ghost.moving = false;
      } else {
        ghost.container.x += (dx / dist) * speed;
        ghost.container.y += (dy / dist) * speed;
      }
    }
  }

  private handleSpecialGhostAbility(ghost: SpecialGhostObj, time: number) {
    const config = SPECIAL_GHOSTS[ghost.type];

    if (ghost.type === "teleporter") {
      // Teleport every 5 seconds
      if (time - ghost.lastAbilityTime > 5000) {
        this.teleportGhost(ghost);
        ghost.lastAbilityTime = time;
      }
    }
  }

  private teleportGhost(ghost: SpecialGhostObj) {
    // Find random valid position
    const validCells: { x: number; y: number }[] = [];
    for (let y = 1; y < this.maze.height - 1; y++) {
      for (let x = 1; x < this.maze.width - 1; x++) {
        if (this.maze.grid[y][x] !== CELL_TYPES.WALL) {
          const dist = Math.abs(x - this.gridX) + Math.abs(y - this.gridY);
          if (dist > 3 && dist < 10) { // Not too close, not too far
            validCells.push({ x, y });
          }
        }
      }
    }

    if (validCells.length > 0) {
      const cell = validCells[Math.floor(Math.random() * validCells.length)];
      ghost.gridX = cell.x;
      ghost.gridY = cell.y;
      ghost.container.x = cell.x * TILE_SIZE + TILE_SIZE / 2;
      ghost.container.y = cell.y * TILE_SIZE + TILE_SIZE / 2;
      ghost.moving = false;

      this.sfx.teleportGhost();
      // Visual effect
      this.tweens.add({
        targets: ghost.container,
        alpha: { from: 0, to: 1 },
        scale: { from: 1.5, to: 1 },
        duration: 300,
      });
      this.onLog?.("PHANTOM teleported!", "ghost");
    }
  }

  private checkSpecialGhostCollision(ghost: SpecialGhostObj, time: number) {
    const dx = Math.abs(this.clawMan.x - ghost.container.x);
    const dy = Math.abs(this.clawMan.y - ghost.container.y);

    if (dx < TILE_SIZE * 0.5 && dy < TILE_SIZE * 0.5) {
      if (this.ghostMode === "frightened") {
        this.hitSpecialGhost(ghost, time);
      } else if (!this.invincible && !this.shieldActive) {
        this.hitByGhost(time);
      }
    }
  }

  private hitSpecialGhost(ghost: SpecialGhostObj, time: number) {
    ghost.hp--;

    if (ghost.hp <= 0) {
      if (ghost.type === "splitter" && !ghost.children) {
        // Split into 2 smaller ghosts
        this.splitGhost(ghost);
      } else {
        // Destroy ghost
        this.destroySpecialGhost(ghost);
      }
    } else {
      // Flash effect
      this.tweens.add({
        targets: ghost.body,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 2,
      });
    }

    const points = 300 * this.getComboMultiplier();
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.onScoreUpdate?.(this.score);

    this.sfx.eatGhost();
  }

  private splitGhost(ghost: SpecialGhostObj) {
    this.sfx.splitGhost();

    // Create 2 smaller children
    for (let i = 0; i < 2; i++) {
      const offset = i === 0 ? -1 : 1;
      const nx = ghost.gridX + offset;
      const ny = ghost.gridY;

      if (!this.canMoveTo(nx, ny)) continue;

      const body = this.add.circle(0, 0, TILE_SIZE * 0.25, SPECIAL_GHOSTS.splitter.color);
      const container = this.add.container(
        nx * TILE_SIZE + TILE_SIZE / 2,
        ny * TILE_SIZE + TILE_SIZE / 2,
        [body]
      ).setDepth(11);

      const child: SpecialGhostObj = {
        container,
        body,
        gridX: nx,
        gridY: ny,
        direction: { x: 0, y: 0 },
        moving: false,
        type: "splitter",
        hp: 1,
        lastAbilityTime: this.time.now,
        children: [], // Mark as child
      };

      this.specialGhosts.push(child);
    }

    // Destroy parent
    this.destroySpecialGhost(ghost);
    this.onLog?.("MITOSIS split into two!", "ghost");
  }

  private destroySpecialGhost(ghost: SpecialGhostObj) {
    const index = this.specialGhosts.indexOf(ghost);
    if (index > -1) {
      this.specialGhosts.splice(index, 1);
    }

    this.tweens.add({
      targets: ghost.container,
      alpha: 0,
      scale: 0,
      duration: 300,
      onComplete: () => ghost.container.destroy(),
    });

    const config = SPECIAL_GHOSTS[ghost.type];
    this.onLog?.(`${config.name} defeated!`, "consume");
    this.statsTracker.ghostsEaten++;
  }

  // === FRUIT BONUS ===
  private updateFruit(time: number) {
    if (!this.fruitObj && time - this.fruitSpawnedAt > this.fruitInterval && this.crabEatenCount > 0) {
      this.spawnFruit(time);
    }
    if (this.fruitObj && time - this.fruitSpawnedAt > this.fruitDuration) {
      this.removeFruit();
    }
  }

  private spawnFruit(time: number) {
    const midX = Math.floor(this.maze.width / 2);
    const midY = Math.floor(this.maze.height / 2);
    let fx = midX, fy = midY;
    for (let r = 0; r < 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = midX + dx, ty = midY + dy;
          if (tx > 0 && tx < this.maze.width - 1 && ty > 0 && ty < this.maze.height - 1 &&
            this.maze.grid[ty][tx] === CELL_TYPES.EMPTY && !this.crabs.has(`${tx}-${ty}`)) {
            fx = tx; fy = ty; r = 99; dy = 99; break;
          }
        }
      }
    }
    const fruitIdx = Math.min(this.level - 1, FRUIT_EMOJIS.length - 1);
    this.fruitGridX = fx;
    this.fruitGridY = fy;
    this.fruitObj = this.add.text(fx * TILE_SIZE + TILE_SIZE / 2, fy * TILE_SIZE + TILE_SIZE / 2, FRUIT_EMOJIS[fruitIdx], { fontSize: "16px" })
      .setOrigin(0.5).setDepth(8).setAlpha(0);
    this.tweens.add({ targets: this.fruitObj, alpha: 1, scaleX: { from: 2, to: 1 }, scaleY: { from: 2, to: 1 }, duration: 300 });
    this.tweens.add({ targets: this.fruitObj, y: this.fruitObj.y - 3, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 300 });
    this.fruitSpawnedAt = time;
    this.sfx.fruit();
    this.onLog?.("BONUS FRUIT appeared in the maze!", "spawn");
  }

  private removeFruit() {
    if (this.fruitObj) {
      this.tweens.add({ targets: this.fruitObj, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 200, onComplete: () => { this.fruitObj?.destroy(); this.fruitObj = null; } });
    }
  }

  private checkFruitPickup() {
    if (!this.fruitObj) return;
    if (this.gridX === this.fruitGridX && this.gridY === this.fruitGridY) {
      const fruitIdx = Math.min(this.level - 1, FRUIT_POINTS.length - 1);
      const pts = FRUIT_POINTS[fruitIdx] * this.getComboMultiplier();
      this.score += pts;
      this.scoreText.setText(`SCORE: ${this.score}`);
      this.onScoreUpdate?.(this.score);
      this.updateHighScore();
      this.statsTracker.fruitsEaten++;
      this.emitStats();

      const popup = this.add.text(this.fruitObj.x, this.fruitObj.y - 10, `+${pts}`, {
        fontFamily: '"Press Start 2P", monospace', fontSize: "10px", color: "#ff6ec7",
      }).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 1000, onComplete: () => popup.destroy() });

      this.fruitObj.destroy();
      this.fruitObj = null;
      this.sfx.fruit();
      this.onLog?.(`FRUIT BONUS! +${pts} points!`, "consume");
    }
  }

  // === HIGH SCORE ===
  private updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreText.setText(`HI: ${this.highScore}`);
      try { localStorage.setItem("clawman-highscore", String(this.highScore)); } catch { /* noop */ }
    }
  }

  // === EMIT STATS (for achievements) ===
  private emitStats() {
    this.onAchievementStats?.({
      ghostsEaten: this.statsTracker.ghostsEaten,
      fruitsEaten: this.statsTracker.fruitsEaten,
      deaths: this.statsTracker.deaths,
      bossesDefeated: this.statsTracker.bossesDefeated,
      highestCombo: this.comboCount,
      currentLevel: this.level,
      currentScore: this.score,
    });
  }

  // === EAT CRAB ===
  private eatCrab(gx: number, gy: number) {
    const key = `${gx}-${gy}`;
    const obj = this.crabs.get(key);
    if (!obj) return;

    const isGolden = this.maze.grid[gy][gx] === CELL_TYPES.GOLDEN_CRAB;
    const time = this.time.now;

    // Increment combo
    this.incrementCombo(time);
    const multiplier = this.getComboMultiplier();

    const basePts = isGolden ? 50 : 10;
    const pts = basePts * multiplier;
    this.score += pts;
    this.maze.grid[gy][gx] = CELL_TYPES.EMPTY;
    this.crabEatenCount++;

    // Sound & effects
    if (isGolden) {
      this.sfx.eatGolden();
      this.activateFrightenedMode();
      this.cameras.main.shake(100, 0.005); // Screen shake on golden
    } else {
      this.sfx.chomp();
    }

    this.tweens.add({ targets: obj, scaleX: 2, scaleY: 2, alpha: 0, duration: 200, onComplete: () => obj.destroy() });

    const popupColor = multiplier > 1 ? "#ff6600" : (isGolden ? "#ffd700" : "#39ff14");
    const popupText = multiplier > 1 ? `+${pts} (${multiplier}x)` : `+${pts}`;
    const popup = this.add.text(gx * TILE_SIZE + TILE_SIZE / 2, gy * TILE_SIZE, popupText, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "8px", color: popupColor,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: popup, y: popup.y - 24, alpha: 0, duration: 500, onComplete: () => popup.destroy() });

    this.crabs.delete(key);
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.onScoreUpdate?.(this.score);
    this.updateHighScore();

    const activity = simulateMoltbookActivity();
    this.onCrabConsumed?.(isGolden ? "golden" : "normal", activity.source);
    this.onLog?.(`Claw-Man consumed ${isGolden ? "GOLDEN 🦀" : "🦀"} at ${activity.source}${multiplier > 1 ? ` [${multiplier}x COMBO]` : ""}`, "consume");

    if (this.score % 50 === 0) {
      const c = getRandomCommentary();
      this.onCommentary?.(c);
      this.onLog?.(`[AI] ${c}`, "commentary");
    }

    if (this.crabs.size === 0) {
      this.nextLevel();
    }
  }

  // === LEVEL TRANSITION ===
  private nextLevel() {
    this.level++;
    this.sfx.levelUp();
    this.paused = true;
    this.crabEatenCount = 0;
    this.isBossLevel = this.level % BOSS_LEVEL_INTERVAL === 0;

    // Save replay for current run
    const replayData = this.replayRecorder.stop(this.score, this.level);
    saveReplay(replayData);

    this.cameras.main.flash(500, 0, 255, 247);

    // Check if we should show a cutscene (every 3 levels)
    if (this.level % 3 === 0 && this.level > 1) {
      this.showCutscene(() => this.showLevelSplash());
    } else {
      this.showLevelSplash();
    }

    this.levelText.setText(`LVL ${this.level}`);
    this.onLog?.(`LEVEL ${this.level} - Maze type: ${this.isBossLevel ? "BOSS ARENA" : getMazeTypeForLevel(this.level).toUpperCase()}`, "system");
    this.onLevelComplete?.();
    this.emitStats();
  }

  private showLevelSplash() {
    const cx = this.maze.width * TILE_SIZE / 2;
    const cy = this.maze.height * TILE_SIZE / 2;

    const splash = this.add.text(cx, cy, `LEVEL ${this.level}`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "20px", color: this.theme.secondaryCSS,
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    const subText = this.add.text(cx, cy + 28, this.isBossLevel ? "BOSS FIGHT!" : "GET READY!", {
      fontFamily: '"Press Start 2P", monospace', fontSize: "10px",
      color: this.isBossLevel ? "#ff0000" : "#ffd700", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    const mazeTypeText = this.add.text(cx, cy + 46, `Maze: ${this.isBossLevel ? "ARENA" : getMazeTypeForLevel(this.level).toUpperCase()}`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "7px", color: "#888",
      stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({ targets: splash, alpha: 1, scaleX: { from: 3, to: 1 }, scaleY: { from: 3, to: 1 }, duration: 400 });
    this.tweens.add({ targets: subText, alpha: 1, duration: 400, delay: 300 });
    this.tweens.add({ targets: mazeTypeText, alpha: 1, duration: 400, delay: 500 });

    this.time.delayedCall(2000, () => {
      splash.destroy();
      subText.destroy();
      mazeTypeText.destroy();
      this.rebuildLevel();
      this.paused = false;
      // Start new replay recording
      this.replayRecorder.start();
    });
  }

  // === CUTSCENE (intermission) ===
  private showCutscene(onComplete: () => void) {
    this.showingCutscene = true;
    const cx = this.maze.width * TILE_SIZE / 2;
    const cy = this.maze.height * TILE_SIZE / 2;

    // Dark overlay
    const overlay = this.add.graphics().setDepth(90);
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, this.maze.width * TILE_SIZE, this.maze.height * TILE_SIZE);

    const title = this.add.text(cx, cy - 50, "~ INTERMISSION ~", {
      fontFamily: '"Press Start 2P", monospace', fontSize: "12px", color: this.theme.accentCSS,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    // Claw-Man chases ghost across screen
    const claw = this.add.circle(-20, cy, TILE_SIZE * 0.35, this.skin.color).setDepth(100);
    const ghost = this.add.circle(-60, cy, TILE_SIZE * 0.3, 0x2222ff).setDepth(100);

    this.tweens.add({ targets: title, alpha: 1, duration: 500 });
    this.tweens.add({
      targets: ghost, x: this.maze.width * TILE_SIZE + 60,
      duration: 2500, ease: "Linear",
    });
    this.tweens.add({
      targets: claw, x: this.maze.width * TILE_SIZE + 20,
      duration: 2500, ease: "Linear",
    });

    const quips = [
      "The Claw grows stronger...",
      "Ghosts beware: the harvest continues.",
      "Data is the new crab.",
      "Level complete. Hunger persists.",
    ];
    const quip = this.add.text(cx, cy + 30, quips[Math.floor(Math.random() * quips.length)], {
      fontFamily: '"Press Start 2P", monospace', fontSize: "7px", color: "#ffd700",
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({ targets: quip, alpha: 1, duration: 500, delay: 500 });

    this.time.delayedCall(3000, () => {
      overlay.destroy();
      title.destroy();
      claw.destroy();
      ghost.destroy();
      quip.destroy();
      this.showingCutscene = false;
      onComplete();
    });
  }

  private rebuildLevel() {
    this.wallLayer.destroy();
    this.crabs.forEach((s) => s.destroy());
    this.crabs = new Map();
    if (this.fruitObj) { this.fruitObj.destroy(); this.fruitObj = null; }
    if (this.bossGhost) {
      this.bossGhost.container.destroy();
      this.bossGhost = null;
    }

    this.maze = generateMaze(21, 21, this.level);
    this.drawMaze();
    this.placeCrabs();

    this.gridX = 1; this.gridY = 1;
    this.targetX = 1; this.targetY = 1;
    this.isMoving = false;
    this.moveDir = { x: 0, y: 0 };
    this.clawMan.x = 1 * TILE_SIZE + TILE_SIZE / 2;
    this.clawMan.y = 1 * TILE_SIZE + TILE_SIZE / 2;
    this.clawMan.setScale(1).setAngle(0).setAlpha(1);

    // Reset ghosts with level speed boost
    const spawns = this.findGhostSpawns();
    this.ghostObjs.forEach((g, i) => {
      if (spawns[i]) {
        g.gridX = spawns[i].x; g.gridY = spawns[i].y;
        g.spawnX = spawns[i].x; g.spawnY = spawns[i].y;
        g.container.x = g.gridX * TILE_SIZE + TILE_SIZE / 2;
        g.container.y = g.gridY * TILE_SIZE + TILE_SIZE / 2;
        g.moving = false; g.eaten = false;
        g.direction = { x: 0, y: 0 };
        this.restoreGhostColor(g);
      }
    });

    this.ghostMode = "scatter";
    this.ghostModePhase = 0;
    this.ghostModeTimer = 0;
    this.comboCount = 0;
    this.comboHudText.setVisible(false);
    this.themeText.setText(this.maze.theme);

    // Recreate minimap for new maze
    this.minimapGfx.clear();
    this.minimapScale = this.minimapSize / Math.max(this.maze.width, this.maze.height);

    // Spawn boss if boss level
    if (this.isBossLevel) {
      this.time.delayedCall(1000, () => this.createBossGhost());
    }

    // Maybe spawn special ghost based on level
    this.time.delayedCall(2000, () => this.maybeSpawnSpecialGhost());

    // Clear power-ups
    this.powerUps.forEach((p) => p.sprite.destroy());
    this.powerUps.clear();
    this.deactivatePowerUp();

    // Clear special ghosts
    this.specialGhosts.forEach((g) => g.container.destroy());
    this.specialGhosts = [];
  }

  private restoreGhostColor(g: GhostObj) {
    g.body.setFillStyle(g.color);
    g.skirt.clear();
    g.skirt.fillStyle(g.color);
    const r = TILE_SIZE * 0.35;
    g.skirt.fillRect(-r, 0, r * 2, r * 0.4);
    g.container.setAlpha(1);
    g.body.setVisible(true); g.skirt.setVisible(true);
    g.eyeL.setVisible(true); g.eyeR.setVisible(true);
    g.pupilL.setVisible(true); g.pupilR.setVisible(true);
  }

  // === GHOST SPEED PER LEVEL ===
  private getGhostSpeed(): number {
    const diffConfig = DIFFICULTIES[this.difficulty];
    const levelMult = Math.min(2, 1 + (this.level - 1) * 0.08);
    const endlessMult = this.gameMode === "endless" ? 1 + this.endlessWave * 0.05 : 1;
    return GHOST_SPEED * diffConfig.ghostSpeedMult * levelMult * endlessMult;
  }

  // === GHOST MODE ===
  private updateGhostMode(time: number) {
    if (this.ghostMode === "frightened") {
      const elapsed = time - this.frightenedTimer;
      if (elapsed > this.frightenedBlinkStart) {
        const blink = Math.sin(time * 0.015) > 0;
        for (const g of this.ghostObjs) {
          if (!g.eaten) {
            const c = blink ? 0x2222ff : 0xffffff;
            g.body.setFillStyle(c);
            g.skirt.clear(); g.skirt.fillStyle(c);
            const r = TILE_SIZE * 0.35;
            g.skirt.fillRect(-r, 0, r * 2, r * 0.4);
          }
        }
      }
      if (elapsed > this.frightenedDuration) {
        this.endFrightenedMode();
      }
      return;
    }
    if (this.ghostModePhase >= this.ghostPhases.length) return;
    if (this.ghostModeTimer === 0) this.ghostModeTimer = time;
    const phase = this.ghostPhases[this.ghostModePhase];
    if (phase.duration !== Infinity && time - this.ghostModeTimer > phase.duration) {
      this.ghostModePhase++;
      this.ghostModeTimer = time;
      if (this.ghostModePhase < this.ghostPhases.length) {
        this.ghostMode = this.ghostPhases[this.ghostModePhase].mode;
      }
    }
  }

  private activateFrightenedMode() {
    if (this.ghostMode !== "frightened") this.preFrightenedMode = this.ghostMode;
    this.ghostMode = "frightened";
    this.frightenedTimer = this.time.now;
    this.ghostsEatenCombo = 0;
    this.sfx.powerUp();
    for (const g of this.ghostObjs) {
      if (!g.eaten) {
        g.body.setFillStyle(0x2222ff);
        g.skirt.clear(); g.skirt.fillStyle(0x2222ff);
        const r = TILE_SIZE * 0.35;
        g.skirt.fillRect(-r, 0, r * 2, r * 0.4);
        g.direction = { x: -g.direction.x, y: -g.direction.y };
        g.moving = false;
      }
    }
    this.onLog?.("POWER UP! Ghosts are frightened! EAT THEM!", "spawn");
  }

  private endFrightenedMode() {
    this.ghostMode = this.preFrightenedMode;
    this.ghostModeTimer = this.time.now;
    for (const g of this.ghostObjs) {
      // Only restore ghosts that are NOT currently eaten (still tweening back to spawn)
      if (!g.eaten) {
        this.restoreGhostColor(g);
      }
    }
    this.onLog?.("Ghosts are back to normal!", "system");
  }

  // === GHOST EATEN ANIMATION ===
  private eatGhost(g: GhostObj) {
    this.ghostsEatenCombo++;
    const points = 200 * Math.pow(2, this.ghostsEatenCombo - 1) * this.getComboMultiplier();
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.onScoreUpdate?.(this.score);
    this.updateHighScore();
    this.sfx.eatGhost();
    this.statsTracker.ghostsEaten++;
    this.emitStats();

    const popup = this.add.text(g.container.x, g.container.y - 10, `+${points}`, {
      fontFamily: '"Press Start 2P", monospace', fontSize: "10px", color: "#00ffff",
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 800, onComplete: () => popup.destroy() });

    g.eaten = true;
    g.body.setVisible(false);
    g.skirt.setVisible(false);
    g.container.setAlpha(1);
    g.moving = false;

    const spawnPx = g.spawnX * TILE_SIZE + TILE_SIZE / 2;
    const spawnPy = g.spawnY * TILE_SIZE + TILE_SIZE / 2;
    this.tweens.add({
      targets: g.container, x: spawnPx, y: spawnPy,
      duration: 1200, ease: "Quad.easeInOut",
      onComplete: () => {
        g.gridX = g.spawnX; g.gridY = g.spawnY;
        g.direction = { x: 0, y: 0 };
        g.eaten = false;
        // If still in frightened mode, show frightened color; otherwise restore normal
        if (this.ghostMode === "frightened") {
          g.body.setVisible(true); g.skirt.setVisible(true);
          g.body.setFillStyle(0x2222ff);
          g.skirt.clear(); g.skirt.fillStyle(0x2222ff);
          const r = TILE_SIZE * 0.35;
          g.skirt.fillRect(-r, 0, r * 2, r * 0.4);
          g.container.setAlpha(1);
        } else {
          this.restoreGhostColor(g);
        }
      },
    });
    this.onLog?.(`GHOST EATEN! +${points} points! (${this.ghostsEatenCombo}x)`, "consume");
  }

  // === GET TARGET PER GHOST ===
  private getGhostTarget(g: GhostObj): { x: number; y: number } {
    if (this.ghostMode === "scatter") return g.scatterTarget;
    switch (g.personality) {
      case 0: return { x: this.gridX, y: this.gridY };
      case 1: {
        const ahead = 4;
        return {
          x: Math.max(0, Math.min(this.maze.width - 1, this.gridX + this.moveDir.x * ahead)),
          y: Math.max(0, Math.min(this.maze.height - 1, this.gridY + this.moveDir.y * ahead)),
        };
      }
      case 2: {
        const blinky = this.ghostObjs[0];
        const pivotX = this.gridX + this.moveDir.x * 2;
        const pivotY = this.gridY + this.moveDir.y * 2;
        return {
          x: Math.max(0, Math.min(this.maze.width - 1, pivotX + (pivotX - (blinky?.gridX ?? this.gridX)))),
          y: Math.max(0, Math.min(this.maze.height - 1, pivotY + (pivotY - (blinky?.gridY ?? this.gridY)))),
        };
      }
      case 3: {
        const dist = Math.abs(g.gridX - this.gridX) + Math.abs(g.gridY - this.gridY);
        return dist > 8 ? { x: this.gridX, y: this.gridY } : g.scatterTarget;
      }
      default: return { x: this.gridX, y: this.gridY };
    }
  }

  // === GHOST MOVEMENT ===
  private moveAllGhosts(delta: number) {
    const isFrightened = this.ghostMode === "frightened";
    const ghostSpeed = this.getGhostSpeed();
    const speedMultiplier = isFrightened ? 0.5 : 1;
    const speed = ghostSpeed * speedMultiplier * (delta / 1000) * TILE_SIZE;

    for (const g of this.ghostObjs) {
      if (g.eaten) continue;
      if (!g.moving) {
        const allDirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        const dirs = allDirs.filter((d) => {
          const nx = g.gridX + d.x;
          const ny = g.gridY + d.y;
          if (nx < 0 || nx >= this.maze.width || ny < 0 || ny >= this.maze.height) return false;
          if (this.maze.grid[ny][nx] === CELL_TYPES.WALL) return false;
          if (d.x === -g.direction.x && d.y === -g.direction.y) return false;
          return true;
        });
        if (dirs.length === 0) {
          const reverse = allDirs.filter((d) => {
            const nx = g.gridX + d.x;
            const ny = g.gridY + d.y;
            return nx >= 0 && nx < this.maze.width && ny >= 0 && ny < this.maze.height &&
              this.maze.grid[ny][nx] !== CELL_TYPES.WALL;
          });
          if (reverse.length > 0) { g.direction = reverse[0]; g.moving = true; }
          continue;
        }
        if (isFrightened) {
          g.direction = dirs[Math.floor(Math.random() * dirs.length)];
        } else {
          const target = this.getGhostTarget(g);
          dirs.sort((a, b) => {
            const dxA = (g.gridX + a.x) - target.x, dyA = (g.gridY + a.y) - target.y;
            const dxB = (g.gridX + b.x) - target.x, dyB = (g.gridY + b.y) - target.y;
            return (dxA * dxA + dyA * dyA) - (dxB * dxB + dyB * dyB);
          });
          g.direction = dirs[0];
        }
        g.moving = true;
      }
      if (g.moving) {
        const tx = (g.gridX + g.direction.x) * TILE_SIZE + TILE_SIZE / 2;
        const ty = (g.gridY + g.direction.y) * TILE_SIZE + TILE_SIZE / 2;
        const dx = tx - g.container.x;
        const dy = ty - g.container.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= speed || dist < 1) {
          g.gridX += g.direction.x; g.gridY += g.direction.y;
          g.container.x = g.gridX * TILE_SIZE + TILE_SIZE / 2;
          g.container.y = g.gridY * TILE_SIZE + TILE_SIZE / 2;
          g.moving = false;
        } else {
          g.container.x += (dx / dist) * speed;
          g.container.y += (dy / dist) * speed;
        }
      }
    }
  }

  // === COLLISION ===
  private checkGhostCollisions(time: number) {
    for (const g of this.ghostObjs) {
      if (g.eaten) continue;
      const dx = Math.abs(this.clawMan.x - g.container.x);
      const dy = Math.abs(this.clawMan.y - g.container.y);
      if (dx < TILE_SIZE * 0.5 && dy < TILE_SIZE * 0.5) {
        if (this.ghostMode === "frightened") {
          this.eatGhost(g);
        } else if (!this.invincible && !this.shieldActive) {
          this.hitByGhost(time);
          return;
        } else if (this.shieldActive) {
          // Shield absorbs hit
          this.onLog?.("Shield absorbed ghost hit!", "system");
        }
      }
    }
  }

  // === DEATH ANIMATION ===
  private hitByGhost(time: number) {
    this.lives--;
    this.livesText.setText(`LIVES: ${"❤".repeat(Math.max(0, this.lives))}`);
    this.onGhostHit?.();
    this.sfx.death();
    this.dead = true;
    this.statsTracker.deaths++;
    this.emitStats();

    // Screen shake
    this.cameras.main.shake(300, 0.02);

    this.onLog?.("CLAW-MAN hit by ghost! Low-engagement post detected!", "ghost");

    this.tweens.add({
      targets: this.clawMan,
      scaleX: 0, scaleY: 0, angle: this.clawMan.angle + 720,
      duration: 800, ease: "Quad.easeIn",
      onComplete: () => {
        this.cameras.main.flash(300, 255, 0, 0);
        if (this.lives <= 0) {
          this.onLog?.("GAME OVER - Reinitializing CLAW-MAN...", "system");
          this.updateHighScore();
          // Save replay on game over
          const replayData = this.replayRecorder.stop(this.score, this.level);
          saveReplay(replayData);

          this.lives = 3;
          this.score = 0;
          this.scoreText.setText("SCORE: 0");
          this.livesText.setText("LIVES: ❤❤❤");
          this.onScoreUpdate?.(0);
          this.emitStats();
        }

        this.gridX = 1; this.gridY = 1;
        this.targetX = 1; this.targetY = 1;
        this.isMoving = false;
        this.moveDir = { x: 0, y: 0 };
        this.clawMan.x = 1 * TILE_SIZE + TILE_SIZE / 2;
        this.clawMan.y = 1 * TILE_SIZE + TILE_SIZE / 2;
        this.clawMan.setScale(0).setAngle(0);
        this.tweens.add({
          targets: this.clawMan, scaleX: 1, scaleY: 1,
          duration: 400, ease: "Back.easeOut",
          onComplete: () => {
            this.dead = false;
            this.invincible = true;
            this.invincibleTimer = time + 2500;
          },
        });
      },
    });
  }

  // === PUBLIC METHODS ===
  public triggerCrabRain() {
    let added = 0;
    for (let y = 1; y < this.maze.height - 1 && added < 15; y++) {
      for (let x = 1; x < this.maze.width - 1 && added < 15; x++) {
        if (this.maze.grid[y][x] === CELL_TYPES.EMPTY && Math.random() < 0.15) {
          this.maze.grid[y][x] = CELL_TYPES.GOLDEN_CRAB;
          const key = `${x}-${y}`;
          const emoji = this.add
            .text(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, "🦀", { fontSize: "14px" })
            .setOrigin(0.5).setAlpha(0);
          this.tweens.add({ targets: emoji, alpha: 1, scaleX: { from: 2.5, to: 1 }, scaleY: { from: 2.5, to: 1 }, duration: 400 });
          this.tweens.add({ targets: emoji, scaleX: 1.3, scaleY: 1.3, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 400 });
          this.crabs.set(key, emoji);
          added++;
        }
      }
    }
    this.onLog?.(`CRAB RAIN! ${added} golden crabs spawned in maze!`, "rain");
    this.cameras.main.flash(800, 255, 165, 0);
  }

  public setTheme(themeId: string) {
    this.theme = getTheme(themeId);
    // Rebuild maze visuals with new theme
    if (this.wallLayer) {
      this.wallLayer.destroy();
      this.drawMaze();
    }
    // Update HUD colors
    this.scoreText?.setColor(this.theme.primaryCSS);
    this.livesText?.setColor(this.theme.accentCSS);
    this.levelText?.setColor(this.theme.secondaryCSS);
  }

  public setSkin(skinId: string) {
    this.skin = getSkin(skinId);
    if (this.clawBody) {
      this.clawBody.setFillStyle(this.skin.color);
    }
  }

  public getScoreData() {
    return {
      score: this.score,
      level: this.level,
      highScore: this.highScore,
      crabsEaten: this.crabEatenCount,
      ghostsEaten: this.statsTracker.ghostsEaten,
      bossesDefeated: this.statsTracker.bossesDefeated,
      highestCombo: this.comboCount,
    };
  }

  // === PUBLIC SETTINGS METHODS ===
  public setVolumes(master: number, sfx: number, music: number, sfxEnabled: boolean, musicEnabled: boolean) {
    this.sfx.setVolumes(master, sfx, music, sfxEnabled, musicEnabled);
  }

  public setScreenShakeEnabled(enabled: boolean) {
    // Store preference - will be checked before shaking
    this.cameras.main.shake(0); // Reset any current shake
  }

  public setGameMode(mode: GameMode) {
    this.gameMode = mode;
    this.isCoopMode = mode === "coop";
  }

  public setDifficulty(diff: Difficulty) {
    this.difficulty = diff;
    const config = DIFFICULTIES[diff];
    this.lives = config.lives;
    this.frightenedDuration = config.frightDuration;
    this.livesText.setText(`LIVES: ${"❤".repeat(this.lives)}`);
  }

  public getGameState() {
    return {
      gameMode: this.gameMode,
      difficulty: this.difficulty,
      score: this.score,
      level: this.level,
      lives: this.lives,
      activePowerUp: this.activePowerUp,
      timeRemaining: this.gameMode === "timeAttack" ? Math.max(0, 180000 - (this.time.now - this.timeAttackStartTime)) : null,
      endlessWave: this.endlessWave,
      player2Lives: this.isCoopMode ? this.player2Lives : null,
    };
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public restartGame() {
    this.scene.restart({
      onScoreUpdate: this.onScoreUpdate,
      onCrabConsumed: this.onCrabConsumed,
      onGhostHit: this.onGhostHit,
      onCommentary: this.onCommentary,
      onLog: this.onLog,
      onLevelComplete: this.onLevelComplete,
      onAchievementStats: this.onAchievementStats,
      onComboUpdate: this.onComboUpdate,
      onTimeUpdate: this.onTimeUpdate,
      onPowerUpChange: this.onPowerUpChange,
      onGameModeEvent: this.onGameModeEvent,
      themeId: this.theme.id,
      skinId: this.skin.id,
      gameMode: this.gameMode,
      difficulty: this.difficulty,
    });
  }

  shutdown() {
    this.sfx.destroy();
  }
}
