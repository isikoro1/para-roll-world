import { useEffect, useRef, useState } from 'react';
import type { FootprintState, WorldState } from './types';
import { createFootprintState, drawFootprints, setFootprintTarget, updateFootprints } from './lib/footprints';
import { drawUmbrella } from './lib/umbrella';
import { createWorld, drawBackground } from './lib/world';

const SWIPE_REGENERATE_DISTANCE = 72;
const IDLE_WALK_DELAY = 2600;
const IDLE_TARGET_INTERVAL = 4400;

const getCanvasPoint = (event: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<WorldState | null>(null);
  const footprintsRef = useRef<FootprintState | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastInputTimeRef = useRef<number>(performance.now());
  const nextIdleTargetTimeRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [seedLabel, setSeedLabel] = useState('');

  const regenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    worldRef.current = createWorld(canvas.clientWidth, canvas.clientHeight);
    setSeedLabel(worldRef.current.seedLabel);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return undefined;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      worldRef.current = createWorld(width, height);
      footprintsRef.current = createFootprintState(width, height);
      setSeedLabel(worldRef.current.seedLabel);
    };

    const drawFrame = (time: number) => {
      const world = worldRef.current;
      const footprints = footprintsRef.current;
      if (!world || !footprints) {
        frameRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      const delta = Math.min(48, time - lastTimeRef.current);
      lastTimeRef.current = time;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (time - lastInputTimeRef.current > IDLE_WALK_DELAY && time >= nextIdleTargetTimeRef.current) {
        const margin = Math.min(120, Math.max(36, Math.min(width, height) * 0.12));
        const wanderDistance = Math.min(180, Math.max(70, Math.min(width, height) * 0.18));
        const angle = Math.random() * Math.PI * 2;
        const distance = wanderDistance * (0.45 + Math.random() * 0.55);
        setFootprintTarget(
          footprints,
          Math.min(width - margin, Math.max(margin, footprints.followerX + Math.cos(angle) * distance)),
          Math.min(height - margin, Math.max(margin, footprints.followerY + Math.sin(angle) * distance)),
        );
        nextIdleTargetTimeRef.current = time + IDLE_TARGET_INTERVAL + Math.random() * 2600;
      }

      updateFootprints(footprints, delta);
      drawBackground(ctx, world, width, height);
      drawFootprints(ctx, footprints.prints);

      for (const umbrella of world.umbrellas) {
        umbrella.rotation += umbrella.rotationSpeed * delta;
        ctx.save();
        ctx.translate(umbrella.x, umbrella.y);
        ctx.rotate(umbrella.rotation);
        drawUmbrella(ctx, umbrella.design, umbrella.radius);
        ctx.restore();
      }
      frameRef.current = requestAnimationFrame(drawFrame);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const state = footprintsRef.current;
      if (!state) return;
      const point = getCanvasPoint(event, canvas);
      setFootprintTarget(state, point.x, point.y);
      lastInputTimeRef.current = performance.now();
      nextIdleTargetTimeRef.current = lastInputTimeRef.current + IDLE_WALK_DELAY;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') {
        regenerate();
      }
    };

    resize();
    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(drawFrame);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <main className="app-shell">
      <canvas
        ref={canvasRef}
        className="world-canvas"
        aria-label="para-roll-world canvas animation"
        onPointerDown={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const point = getCanvasPoint(event, canvas);
          pointerStartRef.current = { ...point, pointerId: event.pointerId };
          lastInputTimeRef.current = performance.now();
          nextIdleTargetTimeRef.current = lastInputTimeRef.current + IDLE_WALK_DELAY;
          canvas.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef.current;
          const state = footprintsRef.current;
          if (!canvas || !state) return;
          const point = getCanvasPoint(event, canvas);
          setFootprintTarget(state, point.x, point.y);
          lastInputTimeRef.current = performance.now();
          nextIdleTargetTimeRef.current = lastInputTimeRef.current + IDLE_WALK_DELAY;
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef.current;
          const start = pointerStartRef.current;
          const state = footprintsRef.current;
          if (!canvas || !start || start.pointerId !== event.pointerId) return;
          const point = getCanvasPoint(event, canvas);
          if (state) setFootprintTarget(state, point.x, point.y);
          lastInputTimeRef.current = performance.now();
          nextIdleTargetTimeRef.current = lastInputTimeRef.current + IDLE_WALK_DELAY;
          if (Math.hypot(point.x - start.x, point.y - start.y) >= SWIPE_REGENERATE_DISTANCE) {
            regenerate();
          }
          pointerStartRef.current = null;
          canvas.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          pointerStartRef.current = null;
        }}
      />
      <span className="seed-label" aria-label="seed value">{seedLabel}</span>
    </main>
  );
}

export default App;
