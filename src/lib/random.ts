import type { GenerationMode, Palette, UmbrellaPatternType } from '../types';

export const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

export const randomInt = (min: number, max: number): number => Math.floor(randomBetween(min, max + 1));

export const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export const weightedMode = (): GenerationMode => {
  const value = Math.random();

  if (value < 0.55) return 'full-random';
  if (value < 0.75) return 'unified';
  if (value < 0.95) return 'two-type';
  return 'rare-weird';
};

const hue = (base: number, offset: number): number => (base + offset + 360) % 360;

export const color = (h: number, s: number, l: number, alpha = 1): string =>
  `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${alpha})`;

export const generatePalette = (forceOdd = false): Palette => {
  const baseHue = randomInt(0, 359);
  const accentOffset = pick([36, 52, 88, 126, 158, 204]);
  const saturation = randomBetween(54, 78);

  if (forceOdd) {
    return {
      base: color(baseHue, 86, 42),
      accent: color(hue(baseHue, randomBetween(70, 180)), 92, 66),
      secondary: color(hue(baseHue, randomBetween(190, 300)), 88, 48),
      light: color(hue(baseHue, randomBetween(20, 330)), 95, 82),
      dark: color(hue(baseHue, randomBetween(120, 260)), 72, 18),
    };
  }

  return {
    base: color(baseHue, saturation, randomBetween(46, 62)),
    accent: color(hue(baseHue, accentOffset), saturation + 8, randomBetween(58, 72)),
    secondary: color(hue(baseHue, -accentOffset * 0.65), saturation - 5, randomBetween(42, 58)),
    light: color(hue(baseHue, 14), saturation - 12, randomBetween(78, 88)),
    dark: color(hue(baseHue, -16), saturation - 18, randomBetween(22, 32)),
  };
};

export const patternTypes: readonly UmbrellaPatternType[] = [
  'solid',
  'alternating',
  'dots',
  'stripes',
  'rings',
  'checker',
  'flower',
];

export const generateSeedLabel = (): string => {
  const left = pick(['mellow', 'mist', 'candy', 'orbit', 'paper', 'lagoon', 'quiet', 'prism']);
  const right = randomInt(1000, 9999);

  return `${left}-${right}`;
};
