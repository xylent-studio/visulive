import * as THREE from 'three';
import type { PaletteState } from '../../../types/visual';

export type HeroColorToneBand = 'sub' | 'mid' | 'air';
export type HeroColorWarmth = 'cool' | 'neutral' | 'warm';

const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const VOLT_VIOLET = new THREE.Color('#7c4dff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const MATRIX_GREEN = new THREE.Color('#37ff7c');
const SOLAR_ORANGE = new THREE.Color('#ff9f2d');
const CYBER_YELLOW = new THREE.Color('#ffe933');
const TOXIC_PINK = new THREE.Color('#ff5cff');
const ELECTRIC_WHITE = new THREE.Color('#f7fbff');

const PALETTE_COLOR_FAMILIES: Record<PaletteState, readonly THREE.Color[]> = {
  'void-cyan': [LASER_CYAN, ELECTRIC_WHITE, TRON_BLUE, VOLT_VIOLET],
  'tron-blue': [TRON_BLUE, LASER_CYAN, VOLT_VIOLET, ELECTRIC_WHITE],
  'acid-lime': [ACID_LIME, MATRIX_GREEN, CYBER_YELLOW, TOXIC_PINK],
  'solar-magenta': [HOT_MAGENTA, TOXIC_PINK, SOLAR_ORANGE, CYBER_YELLOW],
  'ghost-white': [ELECTRIC_WHITE, VOLT_VIOLET, LASER_CYAN, HOT_MAGENTA]
};

const HERO_PALETTE_TONE_INDEX_ORDERS: Record<
  PaletteState,
  Record<HeroColorToneBand, readonly number[]>
> = {
  'void-cyan': {
    sub: [2, 3, 0, 1],
    mid: [3, 0, 2, 1],
    air: [0, 1, 2, 3]
  },
  'tron-blue': {
    sub: [0, 2, 1, 3],
    mid: [2, 1, 0, 3],
    air: [1, 3, 0, 2]
  },
  'acid-lime': {
    sub: [1, 0, 3, 2],
    mid: [3, 0, 1, 2],
    air: [2, 0, 1, 3]
  },
  'solar-magenta': {
    sub: [2, 3, 0, 1],
    mid: [0, 1, 2, 3],
    air: [1, 3, 0, 2]
  },
  'ghost-white': {
    sub: [1, 3, 0, 2],
    mid: [3, 1, 2, 0],
    air: [0, 2, 1, 3]
  }
};

export const HERO_COLOR_TRIGGER_OFFSETS = {
  handoff: 0,
  section: 2,
  strike: 1,
  release: 3,
  phrase: 2,
  bar: 1,
  tone: 0
} as const;

export function saturateColor(
  target: THREE.Color,
  saturationDelta: number,
  lightnessDelta = 0
): THREE.Color {
  return target.offsetHSL(0, saturationDelta, lightnessDelta);
}

export function hashSignature(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function copyPaletteCycleColor(
  target: THREE.Color,
  palette: PaletteState,
  cycle: number,
  seed = ''
): THREE.Color {
  const family = PALETTE_COLOR_FAMILIES[palette];
  const index = (hashSignature(`${palette}:${seed}`) + cycle) % family.length;

  return target.copy(family[index] ?? family[0]!);
}

export function selectHeroPaletteCycle(
  palette: PaletteState,
  toneBand: HeroColorToneBand,
  warmth: HeroColorWarmth,
  role: 'primary' | 'accent' | 'pulse',
  triggerKind: keyof typeof HERO_COLOR_TRIGGER_OFFSETS,
  seed: string
): number {
  const family = PALETTE_COLOR_FAMILIES[palette];
  const order = HERO_PALETTE_TONE_INDEX_ORDERS[palette][toneBand];
  const baseOffset = hashSignature(seed) % order.length;
  const warmthOffset = warmth === 'warm' ? 1 : warmth === 'neutral' ? 2 : 0;
  const roleOffset = role === 'primary' ? 0 : role === 'accent' ? 1 : 2;
  const triggerOffset = HERO_COLOR_TRIGGER_OFFSETS[triggerKind];
  const index =
    order[(baseOffset + warmthOffset + roleOffset + triggerOffset) % order.length] ??
    order[0] ??
    0;

  return index % Math.max(1, family.length);
}
