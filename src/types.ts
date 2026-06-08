export type GenerationMode = 'full-random' | 'unified' | 'two-type' | 'rare-weird';
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
export type UmbrellaRarity = 'normal' | 'rare' | 'superRare' | 'mythic' | 'weird';
export type RareUmbrellaStyle = 'jewels' | 'lace' | 'moon' | 'pinwheel' | 'confetti' | 'constellation';
export type SuperRareUmbrellaStyle = 'halo' | 'sundial' | 'petalCrown' | 'prismOrbit';
export type MythicUmbrellaStyle = 'aurora' | 'eclipse' | 'cometMap';

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

export interface UmbrellaInstance {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  design: UmbrellaDesign;
}

export interface Footprint {
  x: number;
  y: number;
  angle: number;
  side: -1 | 1;
  age: number;
  maxAge: number;
}

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
