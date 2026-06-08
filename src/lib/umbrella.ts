import type { RareUmbrellaStyle, UmbrellaDesign } from '../types';
import { generatePalette, patternTypes, pick, randomBetween, randomInt } from './random';

const TAU = Math.PI * 2;

type DesignRarity = 'normal' | 'rare' | 'weird';

const rareStyles: readonly RareUmbrellaStyle[] = ['jewels', 'lace', 'moon', 'pinwheel', 'confetti', 'constellation'];

export const createUmbrellaDesign = (rarity: DesignRarity = 'normal'): UmbrellaDesign => {
  const isWeird = rarity === 'weird';
  const isRare = rarity === 'rare';

  return {
    palette: generatePalette(isWeird || isRare),
    pattern: isWeird ? 'weird' : pick(patternTypes),
    segments: isWeird ? randomInt(7, 15) : isRare ? pick([9, 11, 13, 18]) : pick([8, 10, 12, 14, 16]),
    dotCount: isRare ? randomInt(24, 48) : randomInt(12, 32),
    stripeCount: isRare ? randomInt(12, 22) : randomInt(7, 16),
    ringCount: isRare ? randomInt(4, 8) : randomInt(2, 5),
    wobble: isWeird ? randomBetween(0.012, 0.028) : isRare ? randomBetween(0.006, 0.018) : randomBetween(0, 0.012),
    weirdness: isWeird ? randomBetween(0.22, 0.5) : isRare ? randomBetween(0.16, 0.34) : randomBetween(0, 0.16),
    rarity,
    rareStyle: pick(rareStyles),
    ornamentSeed: randomBetween(0, TAU),
  };
};

const canopyPoint = (angle: number, radius: number, wobble: number): [number, number] => {
  const warped = radius * (1 + Math.sin(angle * 8) * wobble * 0.45 + Math.cos(angle * 16) * wobble * 0.18);

  return [Math.cos(angle) * warped, Math.sin(angle) * warped];
};

const drawCanopyShape = (ctx: CanvasRenderingContext2D, radius: number, wobble: number): void => {
  ctx.beginPath();
  for (let i = 0; i <= 80; i += 1) {
    const angle = (i / 80) * TAU;
    const [x, y] = canopyPoint(angle, radius, wobble);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const drawSegment = (
  ctx: CanvasRenderingContext2D,
  start: number,
  end: number,
  radius: number,
  wobble: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i <= 8; i += 1) {
    const angle = start + (end - start) * (i / 8);
    const [x, y] = canopyPoint(angle, radius, wobble);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const drawPattern = (ctx: CanvasRenderingContext2D, design: UmbrellaDesign, radius: number): void => {
  const { palette, pattern, segments, wobble } = design;

  if (pattern === 'alternating' || pattern === 'checker' || pattern === 'weird') {
    for (let i = 0; i < segments; i += 1) {
      const start = (i / segments) * TAU;
      const end = ((i + 1) / segments) * TAU;
      const checker = pattern === 'checker' && i % 4 < 2;
      ctx.fillStyle = checker || i % 2 === 0 ? palette.accent : palette.secondary;
      if (pattern === 'weird' && i % 3 === 0) ctx.fillStyle = palette.light;
      drawSegment(ctx, start, end, radius, wobble);
      ctx.fill();
    }
  }

  if (pattern === 'dots') {
    for (let i = 0; i < design.dotCount; i += 1) {
      const angle = (i / design.dotCount) * TAU + (i % 2) * 0.18;
      const distance = radius * (0.28 + (i % 4) * 0.15);
      ctx.beginPath();
      ctx.fillStyle = i % 3 === 0 ? palette.accent : palette.light;
      ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, radius * 0.055, 0, TAU);
      ctx.fill();
    }
  }

  if (pattern === 'stripes') {
    ctx.save();
    drawCanopyShape(ctx, radius, wobble);
    ctx.clip();
    ctx.strokeStyle = palette.light;
    ctx.lineWidth = Math.max(2, radius * 0.08);
    for (let i = -design.stripeCount; i <= design.stripeCount; i += 1) {
      const x = (i / design.stripeCount) * radius;
      ctx.beginPath();
      ctx.moveTo(x - radius, -radius);
      ctx.lineTo(x + radius, radius);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (pattern === 'rings' || pattern === 'weird') {
    for (let i = 1; i <= design.ringCount + (pattern === 'weird' ? 2 : 0); i += 1) {
      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0 ? palette.accent : palette.light;
      ctx.lineWidth = Math.max(1, radius * (pattern === 'weird' ? 0.035 : 0.028));
      ctx.arc(0, 0, radius * (i / (design.ringCount + 2.5)), 0, TAU);
      ctx.stroke();
    }
  }

  if (pattern === 'flower') {
    for (let i = 0; i < segments; i += 1) {
      const angle = (i / segments) * TAU;
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? palette.accent : palette.light;
      ctx.ellipse(Math.cos(angle) * radius * 0.38, Math.sin(angle) * radius * 0.38, radius * 0.14, radius * 0.34, angle, 0, TAU);
      ctx.fill();
    }
  }

  if (design.rarity === 'rare') drawRareDecoration(ctx, design, radius);

  if (pattern === 'weird') {
    ctx.fillStyle = palette.dark;
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 6; i += 1) {
      const angle = design.ornamentSeed + i * 1.37;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(angle) * radius * 0.46,
        Math.sin(angle) * radius * 0.46,
        radius * 0.035,
        radius * 0.14,
        angle + design.weirdness,
        0,
        TAU,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
};

const drawRareDecoration = (ctx: CanvasRenderingContext2D, design: UmbrellaDesign, radius: number): void => {
  const { palette, rareStyle, segments } = design;

  if (rareStyle === 'jewels') {
    const jewelCount = Math.max(7, Math.floor(segments * 0.75));
    for (let i = 0; i < jewelCount; i += 1) {
      const angle = design.ornamentSeed + (i / jewelCount) * TAU;
      const distance = radius * (0.47 + (i % 3) * 0.11);
      const size = radius * (0.035 + (i % 2) * 0.016);
      ctx.save();
      ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 === 0 ? palette.light : palette.accent;
      ctx.beginPath();
      ctx.moveTo(0, -size * 2.1);
      ctx.lineTo(size * 0.72, -size * 0.48);
      ctx.lineTo(size * 2, 0);
      ctx.lineTo(size * 0.72, size * 0.48);
      ctx.lineTo(0, size * 2.1);
      ctx.lineTo(-size * 0.72, size * 0.48);
      ctx.lineTo(-size * 2, 0);
      ctx.lineTo(-size * 0.72, -size * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  if (rareStyle === 'lace') {
    ctx.strokeStyle = palette.light;
    ctx.globalAlpha = 0.68;
    ctx.lineWidth = Math.max(1, radius * 0.018);
    for (let i = 0; i < segments * 2; i += 1) {
      const angle = design.ornamentSeed + (i / (segments * 2)) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72, radius * 0.105, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (rareStyle === 'moon') {
    for (let i = 0; i < 4; i += 1) {
      const angle = design.ornamentSeed + i * 1.58;
      const x = Math.cos(angle) * radius * 0.48;
      const y = Math.sin(angle) * radius * 0.48;
      ctx.beginPath();
      ctx.fillStyle = palette.light;
      ctx.arc(x, y, radius * 0.09, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = palette.base;
      ctx.arc(x + radius * 0.035, y - radius * 0.018, radius * 0.088, 0, TAU);
      ctx.fill();
    }
  }

  if (rareStyle === 'pinwheel') {
    for (let i = 0; i < segments; i += 1) {
      const angle = design.ornamentSeed + (i / segments) * TAU;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = i % 2 === 0 ? palette.light : palette.accent;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(radius * 0.18, 0);
      ctx.quadraticCurveTo(radius * 0.48, -radius * 0.12, radius * 0.72, radius * 0.04);
      ctx.quadraticCurveTo(radius * 0.44, radius * 0.12, radius * 0.18, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  if (rareStyle === 'confetti') {
    const count = segments * 3;
    for (let i = 0; i < count; i += 1) {
      const angle = design.ornamentSeed + i * 2.17;
      const distance = radius * (0.24 + ((i * 7) % 40) / 100);
      ctx.save();
      ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      ctx.rotate(angle * 1.7);
      ctx.fillStyle = i % 3 === 0 ? palette.light : i % 3 === 1 ? palette.accent : palette.secondary;
      ctx.globalAlpha = 0.62;
      ctx.fillRect(-radius * 0.025, -radius * 0.055, radius * 0.05, radius * 0.11);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  if (rareStyle === 'constellation') {
    ctx.strokeStyle = palette.light;
    ctx.fillStyle = palette.light;
    ctx.globalAlpha = 0.58;
    ctx.lineWidth = Math.max(1, radius * 0.014);
    let previousX = 0;
    let previousY = 0;
    for (let i = 0; i < 8; i += 1) {
      const angle = design.ornamentSeed + i * 0.93;
      const distance = radius * (0.24 + ((i * 11) % 38) / 100);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      if (i > 0 && i % 3 !== 0) {
        ctx.beginPath();
        ctx.moveTo(previousX, previousY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, radius * (0.022 + (i % 2) * 0.012), 0, TAU);
      ctx.fill();
      previousX = x;
      previousY = y;
    }
    ctx.globalAlpha = 1;
  }
};

export const drawUmbrella = (
  ctx: CanvasRenderingContext2D,
  design: UmbrellaDesign,
  radius: number,
): void => {
  const { palette, segments, wobble } = design;

  drawCanopyShape(ctx, radius, wobble);
  ctx.fillStyle = palette.base;
  ctx.fill();

  drawPattern(ctx, design, radius);

  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = Math.max(1, radius * 0.025);
  ctx.globalAlpha = 0.52;
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * TAU;
    const [x, y] = canopyPoint(angle, radius * 0.96, wobble);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = Math.max(1, radius * 0.035);
  ctx.arc(0, 0, radius * 0.91, 0, TAU);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = palette.light;
  ctx.arc(0, 0, radius * 0.13, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = palette.dark;
  ctx.lineWidth = Math.max(1, radius * 0.022);
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.arc(-radius * 0.22, -radius * 0.26, radius * 0.17, 0, TAU);
  ctx.fill();
};
