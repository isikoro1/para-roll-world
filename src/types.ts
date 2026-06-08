export type GenerationMode = 'full-random' | 'unified' | 'two-type' | 'rare-weird';

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
}
