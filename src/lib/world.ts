import type { GenerationMode, LayoutMode, SpeedMode, UmbrellaDesign, UmbrellaInstance, WorldState } from '../types';
import { color, generateSeedLabel, pick, randomBetween, randomInt, weightedMode } from './random';
import { createUmbrellaDesign } from './umbrella';

const createBackground = () => {
  const hue = randomInt(168, 238);
  return {
    top: color(hue, randomBetween(42, 62), randomBetween(82, 90)),
    bottom: color((hue + randomBetween(46, 96)) % 360, randomBetween(48, 68), randomBetween(70, 82)),
    haze: color((hue + randomBetween(120, 180)) % 360, 74, 76, 0.22),
    glow: color((hue + randomBetween(210, 280)) % 360, 82, 74, 0.18),
  };
};

interface LayoutPlan {
  mode: LayoutMode;
  speedMode: SpeedMode;
  cols: number;
  rows: number;
  spacingX: number;
  spacingY: number;
  radius: number;
  startY: number;
  jitter: number;
  speedScale: number;
}

const weightedLayoutMode = (): LayoutMode => {
  const value = Math.random();
  if (value < 0.3) return 'neat-grid';
  if (value < 0.53) return 'offset-grid';
  if (value < 0.73) return 'wide-grid';
  if (value < 0.91) return 'dense-grid';
  return 'diagonal-drift';
};

const weightedSpeedMode = (): SpeedMode => {
  const value = Math.random();
  if (value < 0.25) return 'sleepy';
  if (value < 0.62) return 'steady';
  if (value < 0.84) return 'breezy';
  return 'mixed';
};

const createLayoutPlan = (width: number, height: number): LayoutPlan => {
  const mode = weightedLayoutMode();
  const speedMode = weightedSpeedMode();
  const minSide = Math.max(420, Math.min(width, height));
  const density = {
    'neat-grid': randomBetween(0.118, 0.14),
    'offset-grid': randomBetween(0.108, 0.132),
    'wide-grid': randomBetween(0.152, 0.19),
    'dense-grid': randomBetween(0.086, 0.108),
    'diagonal-drift': randomBetween(0.116, 0.146),
  }[mode];
  const cols = Math.max(mode === 'dense-grid' ? 10 : 6, Math.ceil(width / (minSide * density)));
  const spacingX = width / cols;
  const spacingY = spacingX * (mode === 'wide-grid' ? randomBetween(1.06, 1.2) : randomBetween(0.9, 1.06));
  const rows = Math.ceil(height / spacingY) + 2;
  const radiusScale = {
    'neat-grid': randomBetween(0.35, 0.42),
    'offset-grid': randomBetween(0.34, 0.43),
    'wide-grid': randomBetween(0.4, 0.5),
    'dense-grid': randomBetween(0.27, 0.34),
    'diagonal-drift': randomBetween(0.31, 0.41),
  }[mode];
  const speedScale = {
    sleepy: randomBetween(0.45, 0.72),
    steady: randomBetween(0.82, 1.12),
    breezy: randomBetween(1.32, 1.75),
    mixed: randomBetween(0.75, 1.55),
  }[speedMode];

  return {
    mode,
    speedMode,
    cols,
    rows,
    spacingX,
    spacingY,
    radius: Math.max(16, Math.min(74, Math.min(spacingX, spacingY) * radiusScale)),
    startY: (height - (rows - 1) * spacingY) * 0.5,
    jitter: mode === 'neat-grid' ? 0 : mode === 'dense-grid' ? 0.04 : randomBetween(0.04, 0.13),
    speedScale,
  };
};

const generateModeDesigns = (mode: GenerationMode): UmbrellaDesign[] => {
  if (mode === 'unified') return [createUmbrellaDesign(Math.random() < 0.12 ? 'rare' : 'normal')];
  if (mode === 'two-type') {
    return [
      createUmbrellaDesign(Math.random() < 0.16 ? 'rare' : 'normal'),
      createUmbrellaDesign(Math.random() < 0.16 ? 'rare' : 'normal'),
    ];
  }
  return [];
};

const pickDesign = (
  mode: GenerationMode,
  row: number,
  col: number,
  modeDesigns: readonly UmbrellaDesign[],
): UmbrellaDesign => {
  if (mode === 'unified') return modeDesigns[0];
  if (mode === 'two-type') return modeDesigns[(row + col) % 2];
  if (mode === 'rare-weird') return createUmbrellaDesign(Math.random() < 0.18 ? 'weird' : Math.random() < 0.12 ? 'rare' : 'normal');
  return createUmbrellaDesign(Math.random() < 0.045 ? 'rare' : 'normal');
};

export const createWorld = (width: number, height: number): WorldState => {
  const mode = weightedMode();
  const layout = createLayoutPlan(width, height);
  const modeDesigns = generateModeDesigns(mode);
  const umbrellas: UmbrellaInstance[] = [];

  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      const offsetX =
        layout.mode === 'offset-grid'
          ? (row % 2) * layout.spacingX * 0.5
          : layout.mode === 'diagonal-drift'
            ? row * layout.spacingX * 0.18
            : 0;
      const waveX = layout.mode === 'diagonal-drift' ? Math.sin(row * 0.75) * layout.spacingX * 0.15 : 0;
      const x =
        (col * layout.spacingX + layout.spacingX * 0.5 + offsetX + waveX) % (width + layout.spacingX) -
        layout.spacingX * 0.5;
      const y =
        layout.startY +
        row * layout.spacingY +
        (col % 2) * layout.spacingY * (layout.mode === 'neat-grid' ? 0 : 0.035) +
        randomBetween(-layout.spacingY, layout.spacingY) * layout.jitter;
      const speedBase = randomBetween(0.00009, 0.00034) * layout.speedScale;
      const speedDirection = Math.random() < 0.5 ? -1 : 1;
      const mixedPulse = layout.speedMode === 'mixed' && (row + col) % 5 === 0 ? randomBetween(1.6, 2.3) : 1;
      umbrellas.push({
        x: x + randomBetween(-layout.spacingX, layout.spacingX) * layout.jitter,
        y,
        radius: layout.radius * randomBetween(layout.mode === 'dense-grid' ? 0.82 : 0.88, layout.mode === 'wide-grid' ? 1.22 : 1.1),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: speedBase * speedDirection * mixedPulse,
        design: pickDesign(mode, row, col, modeDesigns),
      });
    }
  }

  if (layout.mode === 'wide-grid' && Math.random() < 0.45) {
    const spotlightDesign = createUmbrellaDesign(pick(['rare', 'weird'] as const));
    umbrellas.push({
      x: width * randomBetween(0.25, 0.75),
      y: height * randomBetween(0.22, 0.78),
      radius: layout.radius * randomBetween(1.55, 2.05),
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(0.00004, 0.00012) * (Math.random() < 0.5 ? -1 : 1),
      design: spotlightDesign,
    });
  }

  return {
    mode,
    umbrellas,
    background: createBackground(),
    seedLabel: generateSeedLabel(),
    layoutMode: layout.mode,
    speedMode: layout.speedMode,
  };
};

export const drawBackground = (ctx: CanvasRenderingContext2D, world: WorldState, width: number, height: number): void => {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, world.background.top);
  gradient.addColorStop(1, world.background.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = world.background.haze;
  ctx.beginPath();
  ctx.ellipse(width * 0.18, height * 0.28, width * 0.34, height * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = world.background.glow;
  ctx.beginPath();
  ctx.ellipse(width * 0.78, height * 0.7, width * 0.38, height * 0.24, 0.18, 0, Math.PI * 2);
  ctx.fill();
};
