import type { UmbrellaDesign } from '../types';
import { generatePalette, patternTypes, pick, randomBetween, randomInt } from './random';

const TAU = Math.PI * 2;

export const createUmbrellaDesign = (weird = false): UmbrellaDesign => ({
  palette: generatePalette(weird),
  pattern: weird ? 'weird' : pick(patternTypes),
  segments: weird ? randomInt(7, 15) : pick([8, 10, 12, 14, 16]),
  dotCount: randomInt(12, 32),
  stripeCount: randomInt(7, 16),
  ringCount: randomInt(2, 5),
  wobble: weird ? randomBetween(0.05, 0.2) : randomBetween(0, 0.04),
  weirdness: weird ? randomBetween(0.45, 1) : randomBetween(0, 0.22),
});

const canopyPoint = (angle: number, radius: number, wobble: number): [number, number] => {
  const warped = radius * (1 + Math.sin(angle * 3.2) * wobble + Math.cos(angle * 5.1) * wobble * 0.55);

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
      drawSegment(ctx, start, end, radius * (pattern === 'weird' && i % 5 === 0 ? 0.88 : 1), wobble);
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
