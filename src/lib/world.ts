import type {
  GenerationMode,
  LayoutMode,
  LayoutRarity,
  SpeedMode,
  UmbrellaDesign,
  UmbrellaInstance,
  UmbrellaRarity,
  WorldState,
} from '../types';
import { color, generateSeedLabel, pick, randomBetween, randomInt, weightedMode } from './random';
import { createUmbrellaDesign } from './umbrella';

// world.ts は「1回のページ表示で作られる世界」の生成を担当します。
// 背景、傘の配置、サイズ、回転速度、生成モード、配置レアリティをここで決めます。
const TAU = Math.PI * 2;

// 背景は傘より主張しすぎないよう、淡い HSL 系のグラデーションで作ります。
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
  rarity: LayoutRarity;
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

// 配置にもレアリティを持たせます。
// 上位ほど出現率は低く、格子から離れた特殊な見た目になります。
const weightedLayoutRarity = (): LayoutRarity => {
  const value = Math.random();
  if (value < 0.018) return 'mythic';
  if (value < 0.07) return 'superRare';
  if (value < 0.21) return 'rare';
  return 'normal';
};

const weightedLayoutMode = (rarity: LayoutRarity): LayoutMode => {
  if (rarity === 'mythic') return 'nested-orbit';
  if (rarity === 'superRare') return pick(['spiral-vortex', 'radial-bloom'] as const);
  if (rarity === 'rare') return pick(['wave-grid', 'courtyard-grid'] as const);

  const value = Math.random();
  if (value < 0.3) return 'neat-grid';
  if (value < 0.53) return 'offset-grid';
  if (value < 0.73) return 'wide-grid';
  if (value < 0.91) return 'dense-grid';
  return 'diagonal-drift';
};

// 回転速度の世界観を決めます。
// 個々の傘の速度は後でばらつかせますが、全体傾向はここで選びます。
const weightedSpeedMode = (): SpeedMode => {
  const value = Math.random();
  if (value < 0.25) return 'sleepy';
  if (value < 0.62) return 'steady';
  if (value < 0.84) return 'breezy';
  return 'mixed';
};

// 画面サイズと配置モードから、列数・行数・傘サイズなどの基本計画を作ります。
// 各傘の位置そのものは createWorld 内でこの計画を使って決定します。
const createLayoutPlan = (width: number, height: number): LayoutPlan => {
  const rarity = weightedLayoutRarity();
  const mode = weightedLayoutMode(rarity);
  const speedMode = weightedSpeedMode();
  const minSide = Math.max(420, Math.min(width, height));
  const density = {
    'neat-grid': randomBetween(0.118, 0.14),
    'offset-grid': randomBetween(0.108, 0.132),
    'wide-grid': randomBetween(0.152, 0.19),
    'dense-grid': randomBetween(0.086, 0.108),
    'diagonal-drift': randomBetween(0.116, 0.146),
    'wave-grid': randomBetween(0.104, 0.13),
    'courtyard-grid': randomBetween(0.09, 0.118),
    'spiral-vortex': randomBetween(0.09, 0.12),
    'radial-bloom': randomBetween(0.095, 0.125),
    'nested-orbit': randomBetween(0.088, 0.115),
  }[mode];
  const cols = Math.max(mode === 'dense-grid' ? 10 : 6, Math.ceil(width / (minSide * density)));
  const spacingX = width / cols;
  const spacingY = spacingX * (mode === 'wide-grid' ? randomBetween(1.06, 1.2) : randomBetween(0.88, 1.06));
  const rows = Math.ceil(height / spacingY) + 2;
  const radiusScale = {
    'neat-grid': randomBetween(0.35, 0.42),
    'offset-grid': randomBetween(0.34, 0.43),
    'wide-grid': randomBetween(0.4, 0.5),
    'dense-grid': randomBetween(0.27, 0.34),
    'diagonal-drift': randomBetween(0.31, 0.41),
    'wave-grid': randomBetween(0.31, 0.4),
    'courtyard-grid': randomBetween(0.29, 0.38),
    'spiral-vortex': randomBetween(0.28, 0.36),
    'radial-bloom': randomBetween(0.3, 0.39),
    'nested-orbit': randomBetween(0.27, 0.35),
  }[mode];
  const speedScale = {
    sleepy: randomBetween(0.45, 0.72),
    steady: randomBetween(0.82, 1.12),
    breezy: randomBetween(1.32, 1.75),
    mixed: randomBetween(0.75, 1.55),
  }[speedMode];

  return {
    mode,
    rarity,
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

// superRare / mythic 配置は通常のグリッド座標では表現しにくいため、
// index から直接「渦」「放射」「軌道」の座標を作ります。
const createSpecialPosition = (
  index: number,
  total: number,
  layout: LayoutPlan,
  width: number,
  height: number,
): { x: number; y: number; radiusScale: number } | null => {
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const maxRadius = Math.hypot(width, height) * 0.46;
  const progress = total <= 1 ? 0 : index / (total - 1);

  if (layout.mode === 'spiral-vortex') {
    const angle = progress * Math.PI * 13.5 + Math.sin(progress * Math.PI * 4) * 0.3;
    const distance = maxRadius * Math.sqrt(progress) * 0.92;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance * 0.78,
      radiusScale: 0.86 + (1 - progress) * 0.34,
    };
  }

  if (layout.mode === 'radial-bloom') {
    const petals = 7;
    const ring = Math.floor(progress * 7);
    const local = (progress * 7) % 1;
    const angle = local * TAU + ring * 0.34;
    const petalWave = 0.78 + Math.sin(angle * petals) * 0.18;
    const distance = maxRadius * (0.16 + ring * 0.105) * petalWave;
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance * 0.82,
      radiusScale: 0.9 + (ring % 3) * 0.08,
    };
  }

  if (layout.mode === 'nested-orbit') {
    const orbitCount = 5;
    const orbit = index % orbitCount;
    const lap = Math.floor(index / orbitCount);
    const lapCount = Math.max(1, Math.ceil(total / orbitCount));
    const angle = (lap / lapCount) * TAU + orbit * 0.74;
    const distance = maxRadius * (0.16 + orbit * 0.145);
    return {
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance * 0.76,
      radiusScale: orbit === 0 ? 1.18 : 0.86 + orbit * 0.045,
    };
  }

  return null;
};

// unified / two-type では、共有デザインを先に作って使い回します。
const generateModeDesigns = (mode: GenerationMode): UmbrellaDesign[] => {
  if (mode === 'unified') return [createUmbrellaDesign(pickLayeredRarity(0.16, 0.035, 0.008))];
  if (mode === 'two-type') {
    return [
      createUmbrellaDesign(pickLayeredRarity(0.2, 0.045, 0.01)),
      createUmbrellaDesign(pickLayeredRarity(0.2, 0.045, 0.01)),
    ];
  }
  return [];
};

// 傘デザインのレア階層を抽選します。
// mythic -> superRare -> rare -> normal の順に判定し、上位ほど低確率です。
const pickLayeredRarity = (rareChance: number, superChance: number, mythicChance: number): UmbrellaRarity => {
  const value = Math.random();
  if (value < mythicChance) return 'mythic';
  if (value < mythicChance + superChance) return 'superRare';
  if (value < mythicChance + superChance + rareChance) return 'rare';
  return 'normal';
};

// generation mode に応じて、各グリッド位置へ割り当てる傘デザインを決めます。
const pickDesign = (
  mode: GenerationMode,
  row: number,
  col: number,
  modeDesigns: readonly UmbrellaDesign[],
): UmbrellaDesign => {
  if (mode === 'unified') return modeDesigns[0];
  if (mode === 'two-type') return modeDesigns[(row + col) % 2];
  if (mode === 'rare-weird') {
    if (Math.random() < 0.16) return createUmbrellaDesign('weird');
    return createUmbrellaDesign(pickLayeredRarity(0.22, 0.075, 0.025));
  }
  return createUmbrellaDesign(pickLayeredRarity(0.08, 0.018, 0.004));
};

// Canvas サイズを受け取り、描画ループで使う WorldState を生成します。
// フレームごとには再生成せず、リサイズ・スワイプ・Rキーのタイミングだけ作り直します。
export const createWorld = (width: number, height: number): WorldState => {
  const mode = weightedMode();
  const layout = createLayoutPlan(width, height);
  const modeDesigns = generateModeDesigns(mode);
  const umbrellas: UmbrellaInstance[] = [];
  const totalSlots = layout.rows * layout.cols;

  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      const index = row * layout.cols + col;
      const specialPosition = createSpecialPosition(index, totalSlots, layout, width, height);
      const offsetX =
        layout.mode === 'offset-grid'
          ? (row % 2) * layout.spacingX * 0.5
          : layout.mode === 'diagonal-drift'
            ? row * layout.spacingX * 0.18
            : 0;
      const waveX =
        layout.mode === 'diagonal-drift'
          ? Math.sin(row * 0.75) * layout.spacingX * 0.15
          : layout.mode === 'wave-grid'
            ? Math.sin(row * 0.72) * layout.spacingX * 0.34
            : 0;
      const waveY = layout.mode === 'wave-grid' ? Math.sin(col * 0.88) * layout.spacingY * 0.16 : 0;
      const gridX =
        (col * layout.spacingX + layout.spacingX * 0.5 + offsetX + waveX) % (width + layout.spacingX) -
        layout.spacingX * 0.5;
      const gridY =
        layout.startY +
        row * layout.spacingY +
        (col % 2) * layout.spacingY * (layout.mode === 'neat-grid' ? 0 : 0.035) +
        waveY +
        randomBetween(-layout.spacingY, layout.spacingY) * layout.jitter;
      const normalizedX = (gridX - width * 0.5) / Math.max(1, width * 0.5);
      const normalizedY = (gridY - height * 0.5) / Math.max(1, height * 0.5);
      // courtyard-grid は中央を抜いて、傘に囲まれた中庭のように見せます。
      if (layout.mode === 'courtyard-grid' && normalizedX * normalizedX * 1.2 + normalizedY * normalizedY * 1.7 < 0.22) {
        continue;
      }
      const speedBase = randomBetween(0.00009, 0.00034) * layout.speedScale;
      const speedDirection = Math.random() < 0.5 ? -1 : 1;
      const mixedPulse = layout.speedMode === 'mixed' && (row + col) % 5 === 0 ? randomBetween(1.6, 2.3) : 1;
      const radiusScale = specialPosition?.radiusScale ?? 1;
      umbrellas.push({
        x: specialPosition?.x ?? gridX + randomBetween(-layout.spacingX, layout.spacingX) * layout.jitter,
        y: specialPosition?.y ?? gridY,
        radius:
          layout.radius *
          radiusScale *
          randomBetween(layout.mode === 'dense-grid' ? 0.82 : 0.88, layout.mode === 'wide-grid' ? 1.22 : 1.1),
        rotation: randomBetween(0, Math.PI * 2),
        rotationSpeed: speedBase * speedDirection * mixedPulse,
        design: pickDesign(mode, row, col, modeDesigns),
      });
    }
  }

  if (layout.mode === 'wide-grid' && Math.random() < 0.45) {
    const spotlightDesign = createUmbrellaDesign(pick(['rare', 'superRare', 'mythic', 'weird'] as const));
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
    layoutRarity: layout.rarity,
    speedMode: layout.speedMode,
  };
};

// 背景描画だけは world.ts に置き、世界生成と同じ色設定を使います。
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
