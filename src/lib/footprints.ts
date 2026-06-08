import type { Footprint, FootprintState } from '../types';

const WALK_INTERVAL = 34;
const FOLLOW_RATE = 0.04;

export const createFootprintState = (width: number, height: number): FootprintState => {
  const x = width * 0.5;
  const y = height * 0.52;

  return {
    cursorX: x,
    cursorY: y,
    followerX: x,
    followerY: y,
    lastPrintX: x,
    lastPrintY: y,
    nextSide: -1,
    prints: [],
  };
};

export const setFootprintTarget = (state: FootprintState, x: number, y: number): void => {
  state.cursorX = x;
  state.cursorY = y;
};

export const updateFootprints = (state: FootprintState, deltaMs: number): void => {
  const previousX = state.followerX;
  const previousY = state.followerY;

  state.followerX += (state.cursorX - state.followerX) * FOLLOW_RATE;
  state.followerY += (state.cursorY - state.followerY) * FOLLOW_RATE;

  const movedFromLast = Math.hypot(state.followerX - state.lastPrintX, state.followerY - state.lastPrintY);
  if (movedFromLast > WALK_INTERVAL) {
    const angle = Math.atan2(state.followerY - previousY, state.followerX - previousX);
    const side = state.nextSide;
    const sideOffset = 8 * side;

    state.prints.push({
      x: state.followerX + Math.cos(angle + Math.PI / 2) * sideOffset,
      y: state.followerY + Math.sin(angle + Math.PI / 2) * sideOffset,
      angle,
      side,
      age: 0,
      maxAge: 4200,
    });
    state.lastPrintX = state.followerX;
    state.lastPrintY = state.followerY;
    state.nextSide = side === -1 ? 1 : -1;
  }

  for (const print of state.prints) {
    print.age += deltaMs;
  }

  while (state.prints.length > 0 && state.prints[0].age >= state.prints[0].maxAge) {
    state.prints.shift();
  }
};

const drawSinglePrint = (ctx: CanvasRenderingContext2D, print: Footprint): void => {
  const progress = print.age / print.maxAge;
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.translate(print.x, print.y);
  ctx.rotate(print.angle + Math.PI / 2 + print.side * 0.08);
  ctx.globalAlpha = alpha * 0.58;
  ctx.fillStyle = 'rgba(39, 45, 59, 1)';

  ctx.beginPath();
  ctx.ellipse(0, 0, 5.3, 12.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.36;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.arc(i * 2.5, -12.8 - Math.abs(i) * 0.6, 1.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

export const drawFootprints = (ctx: CanvasRenderingContext2D, prints: readonly Footprint[]): void => {
  for (const print of prints) {
    drawSinglePrint(ctx, print);
  }
};
