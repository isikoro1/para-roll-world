import { useEffect, useRef, useState } from 'react';
import type { FootprintState, WorldState } from './types';
import { createFootprintState, drawFootprints, setFootprintTarget, updateFootprints } from './lib/footprints';
import { drawUmbrella } from './lib/umbrella';
import { createWorld, drawBackground } from './lib/world';

const getCanvasPoint = (event: MouseEvent | React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
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
  const [modeLabel, setModeLabel] = useState('preparing');
  const [seedLabel, setSeedLabel] = useState('');

  const regenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    worldRef.current = createWorld(canvas.clientWidth, canvas.clientHeight);
    setModeLabel(worldRef.current.mode);
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
      setModeLabel(worldRef.current.mode);
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
        aria-label="回転する傘と足跡の抽象アニメーション"
        onClick={(event) => {
          const canvas = canvasRef.current;
          const state = footprintsRef.current;
          if (canvas && state) {
            const point = getCanvasPoint(event, canvas);
            setFootprintTarget(state, point.x, point.y);
          }
          regenerate();
        }}
      />
      <section className="hud" aria-label="アプリ情報">
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
