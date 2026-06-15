// types.ts はアプリ全体で共有するデータ構造を集約します。
// 描画ロジックから型定義を分離し、world / umbrella / footprints 間の契約を明確にします。

// 世界全体の生成方針です。傘デザインを個別にするか、共有するかなどを決めます。
export type GenerationMode = 'full-random' | 'unified' | 'two-type' | 'rare-weird';

// 配置にもレアリティがあります。上位ほど特殊な並び方になります。
export type LayoutRarity = 'normal' | 'rare' | 'superRare' | 'mythic';
export type LayoutMode =
  | 'neat-grid'
  | 'offset-grid'
  | 'wide-grid'
  | 'dense-grid'
  | 'diagonal-drift'
  | 'wave-grid'
  | 'courtyard-grid'
  | 'spiral-vortex'
  | 'radial-bloom'
  | 'nested-orbit';
export type SpeedMode = 'sleepy' | 'steady' | 'breezy' | 'mixed';

// 傘単体のレアリティです。superRare / mythic は下位レイヤーも重ねます。
export type UmbrellaRarity = 'normal' | 'rare' | 'superRare' | 'mythic' | 'weird';
export type RareUmbrellaStyle = 'jewels' | 'lace' | 'moon' | 'pinwheel' | 'confetti' | 'constellation';
export type SuperRareUmbrellaStyle = 'halo' | 'sundial' | 'petalCrown' | 'prismOrbit';
export type MythicUmbrellaStyle = 'aurora' | 'eclipse' | 'cometMap';

// 傘の基本模様です。レア装飾はこの上に追加されます。
export type UmbrellaPatternType =
  | 'solid'
  | 'alternating'
  | 'dots'
  | 'stripes'
  | 'rings'
  | 'checker'
  | 'flower'
  | 'weird';

export interface Palette {
  base: string;
  accent: string;
  secondary: string;
  light: string;
  dark: string;
}

// 傘1本の見た目を決めるデータです。
// createUmbrellaDesign で一度だけ生成し、毎フレーム使い回します。
export interface UmbrellaDesign {
  palette: Palette;
  pattern: UmbrellaPatternType;
  segments: number;
  dotCount: number;
  stripeCount: number;
  ringCount: number;
  wobble: number;
  weirdness: number;
  rarity: UmbrellaRarity;
  rareStyle: RareUmbrellaStyle;
  superRareStyle: SuperRareUmbrellaStyle;
  mythicStyle: MythicUmbrellaStyle;
  ornamentSeed: number;
}

// グリッド上に置かれた傘1本の位置・サイズ・回転状態です。
export interface UmbrellaInstance {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  design: UmbrellaDesign;
}

// 画面に残る足跡1つ分のデータです。
export interface Footprint {
  x: number;
  y: number;
  angle: number;
  side: -1 | 1;
  age: number;
  maxAge: number;
}

// 足跡全体の状態です。cursor は目的地、follower は実際に歩いている現在地です。
export interface FootprintState {
  cursorX: number;
  cursorY: number;
  followerX: number;
  followerY: number;
  lastPrintX: number;
  lastPrintY: number;
  nextSide: -1 | 1;
  prints: Footprint[];
}

// 1回のページ表示または再生成で作られる世界全体の状態です。
export interface WorldState {
  mode: GenerationMode;
  umbrellas: UmbrellaInstance[];
  background: {
    top: string;
    bottom: string;
    haze: string;
    glow: string;
  };
  seedLabel: string;
  layoutMode: LayoutMode;
  layoutRarity: LayoutRarity;
  speedMode: SpeedMode;
}
