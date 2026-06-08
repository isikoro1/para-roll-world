import type { GenerationMode, UmbrellaDesign, UmbrellaInstance, WorldState } from '../types';
import { color, generateSeedLabel, randomBetween, randomInt, weightedMode } from './random';
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

const generateModeDesigns = (mode: GenerationMode): UmbrellaDesign[] => {
  if (mode === 'unified') return [createUmbrellaDesign()];
  if (mode === 'two-type') return [createUmbrellaDesign(), createUmbrellaDesign()];
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
  if (mode === 'rare-weird') return createUmbrellaDesign(Math.random() < 0.16);
  return createUmbrellaDesign();
};

export const createWorld = (width: number, height: number): WorldState => {
  const mode = weightedMode();
  const minSide = Math.max(420, Math.min(width, height));
  const cols = Math.max(7, Math.ceil(width / (minSide * 0.12)));
  const spacing = width / cols;
  const rows = Math.ceil(height / spacing) + 2;
  const radius = Math.max(22, Math.min(62, spacing * 0.38));
  const startY = (height - (rows - 1) * spacing) * 0.5;
  const modeDesigns = generateModeDesigns(mode);
  const umbrellas: UmbrellaInstance[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * spacing + spacing * 0.5;
      const y = startY + row * spacing + (col % 2) * spacing * 0.04;
      umbrellas.push({
        x,
        y,
        radius: radius * randomBetween(0.9, 1.08),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: randomBetween(-0.00028, 0.00028) || 0.00012,
        design: pickDesign(mode, row, col, modeDesigns),
      });
    }
  }

  return {
    mode,
    umbrellas,
    background: createBackground(),
    seedLabel: generateSeedLabel(),
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
