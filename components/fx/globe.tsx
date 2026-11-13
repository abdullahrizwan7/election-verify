"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Decorative points and links between them. They illustrate a network of
// checks, not real data.
const POINTS: [number, number][] = [
  [28.61, 77.21], [24.86, 67.0], [23.81, 90.41], [-1.29, 36.82], [6.52, 3.38], [-23.55, -46.63],
  [19.43, -99.13], [38.9, -77.04], [51.51, -0.13], [-6.21, 106.85], [14.6, 120.98], [52.52, 13.4],
];
const MARKERS = POINTS.map((location, i) => ({ location, size: i % 3 === 0 ? 0.07 : 0.045 }));
const ARCS = [
  [0, 1], [0, 2], [0, 8], [3, 4], [5, 6], [6, 7], [7, 8], [9, 10], [11, 8], [2, 9],
].map(([a, b]) => ({ from: POINTS[a], to: POINTS[b] }));

/** A slowly turning, dotted 3D globe drawn with WebGL (the "cobe" library, about 5 KB). */
export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dark = resolvedTheme !== "light";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = canvas.offsetWidth;
    let phi = 0.6;
    let visible = true;
    let frame = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi,
      theta: 0.22,
      dark: dark ? 1 : 0,
      diffuse: dark ? 1.3 : 1.15,
      mapSamples: 16000,
      mapBrightness: dark ? 5.5 : 9,
      baseColor: dark ? [0.2, 0.24, 0.42] : [0.9, 0.93, 1],
      markerColor: [0.35, 0.82, 1],
      glowColor: dark ? [0.2, 0.3, 0.7] : [0.78, 0.85, 1],
      markers: MARKERS,
      arcs: ARCS,
      arcColor: [0.45, 0.72, 1],
      arcWidth: 0.6,
      arcHeight: 0.3,
      opacity: 0.95,
    });

    // Only animate while the globe is on screen, to save battery.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const onResize = () => {
      size = canvas.offsetWidth;
      globe.update({ width: size * dpr, height: size * dpr });
    };
    window.addEventListener("resize", onResize);

    const loop = () => {
      if (visible && !reduceMotion) {
        phi += 0.0032;
        globe.update({ phi });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    canvas.style.opacity = "1";

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("aspect-square w-full opacity-0 transition-opacity duration-1000 [contain:layout_paint_size]", className)}
    />
  );
}
