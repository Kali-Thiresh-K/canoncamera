import { useEffect, useRef, memo } from "react";

/* ─────────────────────── types ─────────────────────── */

type FrameImage = ImageBitmap | HTMLImageElement;

interface CanvasSequenceProps {
  frameCount: number;
  framePath: (i: number) => string;
  /** Called on every frame update. Must NOT set React state. */
  onProgress?: (progress: number) => void;
  onReady?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** On mobile, skip every Nth frame to save memory/bandwidth. Default 1. */
  frameStep?: number;
}

/* ─────────────────────── constants ─────────────────────── */

const PRIORITY_FRAMES = 15; // loaded in parallel before anything shows
const BG_CONCURRENCY = 10; // background loading concurrency
const MAX_DPR_DESKTOP = 1.5; // cap device-pixel-ratio for GPU savings
const MAX_DPR_MOBILE = 1.0; // even lower on mobile
const WHEEL_SENSITIVITY = 0.0008; // scroll-delta → progress mapping
const TOUCH_SENSITIVITY = 0.003; // touch-delta → progress (more responsive)
const CAMERA_SCALE = 0.9; // scale-down: 90% of cover-fit size
const MOBILE_BREAKPOINT = 768;

/* ─────────────────────── helpers ─────────────────────── */

const supportsImageBitmap =
  typeof createImageBitmap === "function" && typeof fetch === "function";

const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;

/** Load + decode a single frame off the main thread when possible. */
function loadFrame(src: string): Promise<FrameImage | null> {
  if (supportsImageBitmap) {
    return fetch(src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((blob) => createImageBitmap(blob as Blob))
      .catch(() => null);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (typeof img.decode === "function") {
        img
          .decode()
          .then(
            () => resolve(img),
            () => resolve(img),
          );
      } else resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Get the natural pixel dimensions of a decoded frame. */
function frameDims(f: FrameImage): { w: number; h: number } {
  if (f instanceof ImageBitmap) return { w: f.width, h: f.height };
  return { w: f.naturalWidth, h: f.naturalHeight };
}

/* ─────────────────────── component ─────────────────────── */

export const CanvasSequence = memo(function CanvasSequence({
  frameCount,
  framePath,
  onProgress,
  onReady,
  containerRef,
  frameStep = 1,
}: CanvasSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* All mutable state lives in refs — zero React state, zero re-renders. */
  const framesRef = useRef<(FrameImage | null)[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const frameRef = useRef(0); // target frame index
  const displayRef = useRef(0); // smoothed frame (float)
  const drawnRef = useRef(-1); // last drawn integer frame
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const readyRef = useRef(false);
  const progressRef = useRef(0); // 0..1 hover-scroll progress
  // Track the camera's drawn position on screen (CSS pixels, not canvas pixels)
  const drawBoundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const cbRef = useRef({ onProgress, onReady });
  cbRef.current = { onProgress, onReady };

  // Effective frame count after stepping
  const effectiveCount = Math.ceil(frameCount / frameStep);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    /* ─── context: created once, never recreated ─── */
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: false });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    let cancelled = false;
    const mobile = isMobileDevice();
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      mobile ? MAX_DPR_MOBILE : MAX_DPR_DESKTOP,
    );

    /* ─── sizing ─── */
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (sizeRef.current.w === w && sizeRef.current.h === h) return;
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      drawnRef.current = -1;
      scheduleRender();
    };

    /* ─── drawing: scaled cover-fit, centered ─── */
    const draw = (frame: FrameImage) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const { w: iw, h: ih } = frameDims(frame);
      if (!iw || !ih) return;

      // Clear to background
      ctx.fillStyle = "#060606";
      ctx.fillRect(0, 0, cw, ch);

      // Cover-fit: scale to fill, then apply camera scale-down
      const coverScale = Math.max(cw / iw, ch / ih) * CAMERA_SCALE;
      const dw = iw * coverScale;
      const dh = ih * coverScale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;

      ctx.drawImage(frame, dx, dy, dw, dh);

      // Soft edge-blend: gradient overlays on left and right so edges fade smoothly
      const edgeW = Math.round(cw * 0.08); // 8% of canvas width
      // Left edge
      const gL = ctx.createLinearGradient(0, 0, edgeW, 0);
      gL.addColorStop(0, "#060606");
      gL.addColorStop(1, "rgba(6,6,6,0)");
      ctx.fillStyle = gL;
      ctx.fillRect(0, 0, edgeW, ch);
      // Right edge
      const gR = ctx.createLinearGradient(cw - edgeW, 0, cw, 0);
      gR.addColorStop(0, "rgba(6,6,6,0)");
      gR.addColorStop(1, "#060606");
      ctx.fillStyle = gR;
      ctx.fillRect(cw - edgeW, 0, edgeW, ch);

      // Record drawn bounds in CSS pixels (for hit-testing cursor)
      drawBoundsRef.current = {
        x: dx / dpr,
        y: dy / dpr,
        w: dw / dpr,
        h: dh / dpr,
      };
    };

    const render = () => {
      rafRef.current = 0;
      const i = Math.round(displayRef.current);
      if (i === drawnRef.current) return; // skip duplicate

      // Find the best available frame (fallback to nearest if target not loaded)
      let frame = framesRef.current[i];
      if (!frame) {
        for (let offset = 1; offset < effectiveCount; offset++) {
          if (i - offset >= 0 && framesRef.current[i - offset]) {
            frame = framesRef.current[i - offset];
            break;
          }
          if (i + offset < effectiveCount && framesRef.current[i + offset]) {
            frame = framesRef.current[i + offset];
            break;
          }
        }
      }
      if (!frame) return;

      drawnRef.current = i;
      draw(frame);
    };

    const scheduleRender = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(render);
    };

    /* ─── loading ─── */
    const loadAll = async () => {
      framesRef.current = new Array(effectiveCount).fill(null);

      // Phase 1: load priority frames in PARALLEL
      const priorityEnd = Math.min(PRIORITY_FRAMES, effectiveCount);
      const priorityPromises: Promise<void>[] = [];

      for (let i = 0; i < priorityEnd; i++) {
        priorityPromises.push(
          loadFrame(framePath(i * frameStep)).then((f) => {
            if (!cancelled && f) framesRef.current[i] = f;
          }),
        );
      }

      await Promise.all(priorityPromises);
      if (cancelled) return;

      // Draw frame 0 immediately
      const firstFrame = framesRef.current[0];
      if (firstFrame) {
        displayRef.current = 0;
        drawnRef.current = -1;
        draw(firstFrame);
        drawnRef.current = 0;
      }

      // Fade canvas in
      canvas.style.opacity = "1";

      // Mark ready
      readyRef.current = true;
      cbRef.current.onReady?.();

      // Now attach interaction listeners
      attachInteraction();

      // Phase 2: load remaining frames in background
      if (priorityEnd < effectiveCount) {
        let cursor = priorityEnd;
        await Promise.all(
          new Array(Math.min(BG_CONCURRENCY, effectiveCount - priorityEnd))
            .fill(0)
            .map(async () => {
              while (!cancelled && cursor < effectiveCount) {
                const idx = cursor++;
                const f = await loadFrame(framePath(idx * frameStep));
                if (!cancelled && f) framesRef.current[idx] = f;
              }
            }),
        );
      }
    };

    /* ─── wheel interaction: only when cursor is over the camera image ─── */
    const isOverCamera = (e: MouseEvent | WheelEvent): boolean => {
      // The text overlays occupy the left ~35% — only scrub in the camera zone
      const vw = window.innerWidth;
      if (e.clientX < vw * 0.35) return false;

      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const b = drawBoundsRef.current;
      return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
    };

    const updateProgress = (delta: number) => {
      const prev = progressRef.current;
      const next = Math.max(0, Math.min(1, prev + delta));

      // At boundaries, let the page scroll naturally
      if ((prev <= 0 && delta < 0) || (prev >= 1 && delta > 0)) {
        return false; // don't consume — normal scroll
      }

      progressRef.current = next;
      displayRef.current = next * (effectiveCount - 1);
      cbRef.current.onProgress?.(next);
      scheduleRender();
      return true;
    };

    const onWheel = (e: WheelEvent) => {
      if (!readyRef.current || !isOverCamera(e)) return;

      const delta = e.deltaY * WHEEL_SENSITIVITY;
      if (updateProgress(delta)) {
        e.preventDefault();
      }
    };

    /* ─── touch interaction: only when finger is on the camera image ─── */
    let touchLastY = 0;
    let touchScrubbing = false; // true only when touch started over camera

    /** Check if a touch point is within the drawn camera bounds. */
    const isTouchOverCamera = (touch: Touch): boolean => {
      const rect = canvas.getBoundingClientRect();
      const cx = touch.clientX - rect.left;
      const cy = touch.clientY - rect.top;
      const b = drawBoundsRef.current;
      return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!readyRef.current) return;
      const touch = e.touches[0];
      touchLastY = touch.clientY;
      // Only capture for frame scrubbing if finger is on the camera image
      touchScrubbing = isTouchOverCamera(touch);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!readyRef.current || !touchScrubbing) return; // not over camera → normal scroll
      const y = e.touches[0].clientY;
      const delta = (touchLastY - y) * TOUCH_SENSITIVITY;
      touchLastY = y;

      if (updateProgress(delta)) {
        e.preventDefault(); // only prevent scroll when scrubbing frames
      }
    };

    const onTouchEnd = () => {
      touchScrubbing = false;
    };

    const attachInteraction = () => {
      if (cancelled) return;

      // Desktop: wheel on canvas only when cursor is over camera
      canvas.addEventListener("wheel", onWheel, { passive: false });

      // Mobile: touch on the container, but only scrub when finger is on camera
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: false });
      container.addEventListener("touchend", onTouchEnd, { passive: true });
    };

    /* ─── init ─── */
    resize();
    window.addEventListener("resize", resize);
    void loadAll();

    /* ─── cleanup ─── */
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;

      // Dispose ImageBitmap objects
      for (const f of framesRef.current) {
        if (f instanceof ImageBitmap) f.close();
      }
      framesRef.current = [];
    };
  }, [frameCount, framePath, containerRef, frameStep, effectiveCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{
        background: "#060606",
        opacity: 0,
        transition: "opacity 0.4s ease-out",
        contain: "strict",
        touchAction: "none", // prevent browser scroll interference on touch
      }}
      aria-hidden
    />
  );
});
