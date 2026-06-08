import { useEffect, useRef, useState } from 'react';
import type { FootprintState, WorldState } from './types';
import { createFootprintState, drawFootprints, setFootprintTarget, updateFootprints } from './lib/footprints';
import { drawUmbrella } from './lib/umbrella';
import { createWorld, drawBackground } from './lib/world';

const SWIPE_REGENERATE_DISTANCE = 72;

const getCanvasPoint = (event: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const formatWorldLabel = (world: WorldState): string => `${world.mode} / ${world.layoutMode} / ${world.speedMode}`;

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<WorldState | null>(null);
  const footprintsRef = useRef<FootprintState | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const [modeLabel, setModeLabel] = useState('preparing');
  const [seedLabel, setSeedLabel] = useState('');

  const regenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    worldRef.current = createWorld(canvas.clientWidth, canvas.clientHeight);
    setModeLabel(formatWorldLabel(worldRef.current));
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
      setModeLabel(formatWorldLabel(worldRef.current));
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

      updateFootprints(footprints, delta);
      drawBackground(ctx, world, width, height);

      for (const umbrella of world.umbrellas) {
        umbrella.rotation += umbrella.rotationSpeed * delta;
        ctx.save();
        ctx.translate(umbrella.x, umbrella.y);
        ctx.rotate(umbrella.rotation);
        drawUmbrella(ctx, umbrella.design, umbrella.radius);
        ctx.restore();
      }

      drawFootprints(ctx, footprints.prints);
      frameRef.current = requestAnimationFrame(drawFrame);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const state = footprintsRef.current;
      if (!state) return;
      const point = getCanvasPoint(event, canvas);
      setFootprintTarget(state, point.x, point.y);
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
          canvas.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef.current;
          const state = footprintsRef.current;
          if (!canvas || !state) return;
          const point = getCanvasPoint(event, canvas);
          setFootprintTarget(state, point.x, point.y);
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef.current;
          const start = pointerStartRef.current;
          const state = footprintsRef.current;
          if (!canvas || !start || start.pointerId !== event.pointerId) return;
          const point = getCanvasPoint(event, canvas);
          if (state) setFootprintTarget(state, point.x, point.y);
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
      <section className="hud" aria-label="app info">
        <div>
          <h1>para-roll-world</h1>
          <p>{modeLabel}</p>
        </div>
        <span>{seedLabel}</span>
      </section>
    </main>
  );
}

export default App;
