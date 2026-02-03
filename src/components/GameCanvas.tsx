"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface GameCanvasHandle {
  triggerCrabRain: () => void;
  setTouchDirection: (dir: { x: number; y: number }) => void;
  setTheme: (themeId: string) => void;
  setSkin: (skinId: string) => void;
  getScoreData: () => any | null;
}

export interface GameCallbacks {
  onScoreUpdate: (score: number) => void;
  onCrabConsumed: (type: string, source: string) => void;
  onGhostHit: () => void;
  onCommentary: (text: string) => void;
  onLog: (message: string, type: string) => void;
  onLevelComplete: () => void;
  onAchievementStats?: (stats: Record<string, number>) => void;
  onComboUpdate?: (combo: number) => void;
}

interface GameCanvasProps {
  callbacks: GameCallbacks;
  themeId?: string;
  skinId?: string;
  seed?: number;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ callbacks, themeId, skinId, seed }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<any>(null);
    const callbacksRef = useRef<GameCallbacks>(callbacks);
    const initedRef = useRef(false);

    // Always keep callbacks ref fresh without re-creating game
    callbacksRef.current = callbacks;

    useImperativeHandle(ref, () => ({
      triggerCrabRain: () => {
        sceneRef.current?.triggerCrabRain?.();
      },
      setTouchDirection: (dir: { x: number; y: number }) => {
        sceneRef.current?.setTouchDirection?.(dir);
      },
      setTheme: (themeId: string) => {
        sceneRef.current?.setTheme?.(themeId);
      },
      setSkin: (skinId: string) => {
        sceneRef.current?.setSkin?.(skinId);
      },
      getScoreData: () => {
        return sceneRef.current?.getScoreData?.() ?? null;
      },
    }));

    useEffect(() => {
      // Prevent double-init from React StrictMode
      if (initedRef.current || !containerRef.current) return;
      initedRef.current = true;

      let game: Phaser.Game | null = null;
      let destroyed = false;
      let checkSceneTimer: ReturnType<typeof setTimeout> | null = null;

      (async () => {
        const Phaser = (await import("phaser")).default;
        const { default: MainScene } = await import("@/game/scenes/MainScene");

        if (!containerRef.current || destroyed) return;

        // Capture initial props
        const initThemeId = themeId;
        const initSkinId = skinId;
        const initSeed = seed;

        // Create scene class that reads from the ref (always latest callbacks)
        class GameScene extends MainScene {
          constructor() {
            super();
          }
          init() {
            super.init({
              onScoreUpdate: (s: number) => callbacksRef.current.onScoreUpdate(s),
              onCrabConsumed: (t: string, src: string) =>
                callbacksRef.current.onCrabConsumed(t, src),
              onGhostHit: () => callbacksRef.current.onGhostHit(),
              onCommentary: (t: string) => callbacksRef.current.onCommentary(t),
              onLog: (m: string, t: string) => callbacksRef.current.onLog(m, t),
              onLevelComplete: () => callbacksRef.current.onLevelComplete(),
              onAchievementStats: (stats: Record<string, number>) =>
                callbacksRef.current.onAchievementStats?.(stats),
              onComboUpdate: (combo: number) =>
                callbacksRef.current.onComboUpdate?.(combo),
              themeId: initThemeId,
              skinId: initSkinId,
              seed: initSeed,
            });
          }
        }

        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: containerRef.current,
          width: 21 * 24,
          height: 21 * 24 + 40,
          backgroundColor: "#0a0a0a",
          pixelArt: true,
          input: {
            keyboard: true,
          },
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          scene: GameScene,
        });

        gameRef.current = game;

        // Get scene reference once it's ready, with cleanup guard
        const checkScene = () => {
          if (destroyed) return;
          const scene = game?.scene?.getScene("MainScene");
          if (scene) {
            sceneRef.current = scene;
          } else {
            checkSceneTimer = setTimeout(checkScene, 200);
          }
        };
        checkSceneTimer = setTimeout(checkScene, 300);
      })();

      return () => {
        destroyed = true;
        initedRef.current = false; // Allow re-init on StrictMode remount
        if (checkSceneTimer) clearTimeout(checkSceneTimer);
        if (game) {
          game.destroy(true);
          game = null;
        }
        gameRef.current = null;
        sceneRef.current = null;
      };
    }, []); // Empty deps - only init once

    // Auto-focus the game container so keyboard works
    const handleClick = () => {
      const canvas = containerRef.current?.querySelector("canvas");
      canvas?.focus();
    };

    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        className="crt-screen mx-auto"
        style={{
          width: "100%",
          maxWidth: 21 * 24,
          cursor: "pointer",
        }}
      />
    );
  }
);

export default GameCanvas;
