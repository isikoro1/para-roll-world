import type { Footprint, FootprintState } from '../types';

// footprints.ts は足跡の状態更新と描画を担当します。
// App.tsx から目的地だけ受け取り、ここで追従・歩幅・フェードアウトを処理します。
const WALK_INTERVAL = 34;
const FOLLOW_RATE = 0.024;
const MAX_STEP_PER_FRAME = 1.15;

// 足跡の初期状態です。
// cursor が目的地、follower が実際に歩いている位置です。
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

// マウス入力や自動散歩から、足跡の目的地を更新します。
export const setFootprintTarget = (state: FootprintState, x: number, y: number): void => {
  state.cursorX = x;
  state.cursorY = y;
};

// 足跡の本体ロジックです。
// follower は目的地へ直接飛ばず、速度上限つきでゆっくり追いかけます。
export const updateFootprints = (state: FootprintState, deltaMs: number): void => {
  const previousX = state.followerX;
  const previousY = state.followerY;

  const targetDx = state.cursorX - state.followerX;
  const targetDy = state.cursorY - state.followerY;
  const targetDistance = Math.hypot(targetDx, targetDy);
  const intendedStep = targetDistance * FOLLOW_RATE;
  const step = Math.min(intendedStep, MAX_STEP_PER_FRAME * Math.max(0.55, deltaMs / 16.67));
  if (targetDistance > 0.01) {
    state.followerX += (targetDx / targetDistance) * step;
    state.followerY += (targetDy / targetDistance) * step;
  }

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

// 靴底っぽいシンプルな跡を描きます。
// 傘より下のレイヤーに描かれるため、濃すぎない透明度にしています。
const drawSinglePrint = (ctx: CanvasRenderingContext2D, print: Footprint): void => {
  const progress = print.age / print.maxAge;
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.translate(print.x, print.y);
  ctx.rotate(print.angle + Math.PI / 2 + print.side * 0.05);
  ctx.globalAlpha = alpha * 0.42;
  ctx.fillStyle = 'rgba(32, 38, 50, 1)';

  ctx.beginPath();
  ctx.ellipse(0, -3.2, 4.8, 8.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.3;
  ctx.beginPath();
  ctx.ellipse(0, 6.2, 5.4, 5.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = alpha * 0.16;
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.beginPath();
  ctx.ellipse(0, 0.5, 2.2, 2.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// 保存されている足跡を古い順に描画します。
export const drawFootprints = (ctx: CanvasRenderingContext2D, prints: readonly Footprint[]): void => {
  for (const print of prints) {
    drawSinglePrint(ctx, print);
  }
};
