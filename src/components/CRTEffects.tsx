"use client";

import { useEffect, useRef } from "react";
import type { GameSettings } from "@/lib/gameSettings";
import { COLORBLIND_SVG_FILTERS, COLORBLIND_FILTERS } from "@/lib/gameSettings";

interface CRTEffectsProps {
  settings: GameSettings;
  children: React.ReactNode;
}

export default function CRTEffects({ settings, children }: CRTEffectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Flicker effect
  useEffect(() => {
    if (!settings.flickerEffect || !containerRef.current) return;

    let animationId: number;
    let lastFlicker = 0;

    const flicker = (time: number) => {
      if (time - lastFlicker > 100 + Math.random() * 200) {
        if (containerRef.current) {
          const brightness = 0.95 + Math.random() * 0.1;
          containerRef.current.style.filter = `brightness(${brightness})`;
        }
        lastFlicker = time;
      }
      animationId = requestAnimationFrame(flicker);
    };

    animationId = requestAnimationFrame(flicker);

    return () => {
      cancelAnimationFrame(animationId);
      if (containerRef.current) {
        containerRef.current.style.filter = "";
      }
    };
  }, [settings.flickerEffect]);

  const getContainerStyle = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      position: "relative",
    };

    if (settings.screenCurvature) {
      styles.borderRadius = "20px";
      styles.transform = "perspective(1000px) rotateX(2deg)";
      styles.boxShadow = "inset 0 0 100px rgba(0,0,0,0.5)";
    }

    if (settings.colorblindMode !== "none") {
      styles.filter = COLORBLIND_FILTERS[settings.colorblindMode];
    }

    return styles;
  };

  return (
    <>
      {/* SVG Filters for colorblind modes */}
      <div dangerouslySetInnerHTML={{ __html: COLORBLIND_SVG_FILTERS }} />

      <div ref={containerRef} style={getContainerStyle()} className="crt-effects-container">
        {/* Scanlines overlay */}
        {settings.scanlines && settings.crtEffects && (
          <div
            className="pointer-events-none absolute inset-0 z-50"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.15) 2px,
                rgba(0, 0, 0, 0.15) 4px
              )`,
              mixBlendMode: "multiply",
            }}
          />
        )}

        {/* CRT glow effect */}
        {settings.crtEffects && (
          <div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              boxShadow: "inset 0 0 60px rgba(0, 255, 247, 0.1)",
              borderRadius: settings.screenCurvature ? "20px" : "0",
            }}
          />
        )}

        {/* Screen curvature vignette */}
        {settings.screenCurvature && (
          <div
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              background: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)`,
              borderRadius: "20px",
            }}
          />
        )}

        {/* Reduced motion alternative - simple fade transitions */}
        <div
          className={settings.reducedMotion ? "reduced-motion" : ""}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {children}
        </div>
      </div>

      {/* Global styles for reduced motion */}
      <style jsx global>{`
        .reduced-motion * {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }

        .crt-effects-container {
          overflow: hidden;
        }

        ${settings.highContrast
          ? `
          .crt-effects-container {
            filter: contrast(1.3) !important;
          }
          .crt-effects-container * {
            border-width: 2px !important;
          }
        `
          : ""}

        ${settings.largeText
          ? `
          .crt-effects-container [style*="Press Start 2P"] {
            font-size: calc(1em * 1.2) !important;
          }
        `
          : ""}
      `}</style>
    </>
  );
}
