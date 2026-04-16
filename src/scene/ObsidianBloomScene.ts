import * as THREE from 'three';
import type { ListeningFrame, ListeningMode, PerformanceIntent, ShowState } from '../types/audio';
import {
  DEFAULT_STAGE_AUDIO_FEATURES,
  deriveStageAudioFeatures,
  type StageAudioFeatures
} from '../audio/stageAudioFeatures';
import { DEFAULT_RUNTIME_TUNING, type RuntimeTuning } from '../types/tuning';
import { ChamberRig } from './rigs/ChamberRig';
import { EventRig } from './rigs/EventRig';
import { FramingRig } from './rigs/FramingRig';
import { HeroRig } from './rigs/HeroRig';
import { TelemetryRig } from './rigs/TelemetryRig';
import type { EventFrameContext, StageIdleContext } from './rigs/types';
import {
  buildShowActScores,
  buildPaletteStateScores,
  chooseShowAct,
  choosePaletteState,
  deriveStageCuePlan,
  deriveVisualCue,
  deriveTemporalWindows
} from './showDirection';
import {
  DEFAULT_STAGE_COMPOSITION_PLAN,
  DEFAULT_STAGE_CUE_PLAN,
  DEFAULT_VISUAL_CUE_STATE,
  DEFAULT_VISUAL_TELEMETRY,
  type AtmosphereMatterState,
  type PaletteState,
  type ShowAct,
  type StageCompositionPlan,
  type StageCuePlan,
  type StageHeroForm,
  type VisualCueState,
  type VisualTelemetryFrame
} from '../types/visual';

export type SceneQualityProfile = {
  tier: 'safe' | 'balanced' | 'premium';
  particleDrawCount: number;
  particleOpacityMultiplier: number;
  auraOpacityMultiplier: number;
};

type ParticlePoint = { radius: number; theta: number; phi: number; drift: number; bias: number };
type ChamberRing = { mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>; baseRotation: THREE.Euler; speed: number; offset: number };
type PortalRing = { mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; baseScale: number; offset: number };
type ChromaHalo = { mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; baseScale: number; offset: number };
type LaserBeam = { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; baseRotation: THREE.Euler; offset: number; spread: number; depth: number; side: number };
type StageBlade = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  axis: 'x' | 'y';
  side: -1 | 1;
  baseOffset: number;
};
type StageSweepPlane = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  side: -1 | 1;
  baseOffset: number;
  tilt: number;
};
type AtmosphereVeilMode = 'mist' | 'current' | 'charge' | 'veil';
type AtmosphereVeil = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  baseWidth: number;
  baseHeight: number;
  depth: number;
  offset: number;
  side: -1 | 1;
  mode: AtmosphereVeilMode;
};
type AtmosphereColumn = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  baseWidth: number;
  baseHeight: number;
  depth: number;
  offset: number;
  side: -1 | 1;
};
type Satellite = { mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshPhysicalMaterial>; orbitRadius: number; orbitSpeed: number; offset: number };
type Shard = { mesh: THREE.Mesh<THREE.TetrahedronGeometry, THREE.MeshPhysicalMaterial>; orbitRadius: number; orbitSpeed: number; offset: number; tilt: number };
type PressureWaveBand = 'sub' | 'mid' | 'high';
type PressureWaveStyle = 'ground-swell' | 'torsion-arc' | 'ion-crown';
type PressureWaveTriggerSource = 'moment' | 'drop' | 'macro';
type HeroColorToneBand = 'sub' | 'mid' | 'air';
type HeroColorWarmth = 'cool' | 'neutral' | 'warm';
type PressureWave = {
  group: THREE.Group;
  waveMesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  torusMesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  haloMesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  age: number;
  active: boolean;
  intensity: number;
  warmMix: number;
  band: PressureWaveBand;
  colorCycle: number;
  spin: number;
  tiltX: number;
  tiltY: number;
  driftX: number;
  driftY: number;
  depthBias: number;
  style: PressureWaveStyle;
  expansion: number;
  anchorY: number;
  anchorZ: number;
  haloBias: number;
  glowBias: number;
};
type ShowFamily = 'liquid-pressure-core' | 'portal-iris' | 'cathedral-rings' | 'ghost-lattice' | 'storm-crown' | 'eclipse-chamber' | 'spectral-plume';
type MacroEventKind = 'pressure-wave' | 'portal-open' | 'singularity-collapse' | 'halo-ignition' | 'ghost-afterimage' | 'twin-split' | 'world-stain' | 'cathedral-rise';
type MacroEvent = { kind: MacroEventKind; age: number; duration: number; intensity: number };
type ShowStateProfile = {
  supportStrength: number;
  dwellBase: number;
  dwellVariance: number;
  transitionRate: number;
};
type MotionPoseState = {
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  targetQuaternion: THREE.Quaternion;
  euler: THREE.Euler;
  targetEuler: THREE.Euler;
  angularVelocity: THREE.Vector3;
};

type SceneVariationProfile = {
  voidProfile: number;
  spectralProfile: number;
  stormProfile: number;
  solarProfile: number;
  eclipseProfile: number;
  prismaticProfile: number;
  noveltyDrive: number;
  ringSuppression: number;
  portalSuppression: number;
  latticeBoost: number;
  beamBoost: number;
  haloBoost: number;
  bladeBoost: number;
  sweepBoost: number;
  heroRoamBoost: number;
  cameraSpreadBoost: number;
  postContrastBoost: number;
};

function createMotionPoseState(): MotionPoseState {
  return {
    position: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    targetQuaternion: new THREE.Quaternion(),
    euler: new THREE.Euler(),
    targetEuler: new THREE.Euler(),
    angularVelocity: new THREE.Vector3()
  };
}

const SHOW_ACTS: ShowAct[] = [
  'void-chamber',
  'laser-bloom',
  'matrix-storm',
  'eclipse-rupture',
  'ghost-afterimage'
];
const HERO_FORMS: StageHeroForm[] = [
  'orb',
  'cube',
  'pyramid',
  'diamond',
  'prism',
  'shard',
  'mushroom'
];
const SHOW_FAMILIES: ShowFamily[] = ['liquid-pressure-core', 'portal-iris', 'cathedral-rings', 'ghost-lattice', 'storm-crown', 'eclipse-chamber', 'spectral-plume'];
const FAMILIES_BY_ACT: Record<ShowAct, ShowFamily[]> = {
  'void-chamber': ['eclipse-chamber', 'ghost-lattice', 'spectral-plume'],
  'laser-bloom': ['portal-iris', 'liquid-pressure-core', 'cathedral-rings'],
  'matrix-storm': ['storm-crown', 'cathedral-rings', 'spectral-plume'],
  'eclipse-rupture': ['eclipse-chamber', 'portal-iris', 'storm-crown'],
  'ghost-afterimage': ['ghost-lattice', 'spectral-plume', 'eclipse-chamber']
};
const FAMILY_BY_SHOW_STATE: Record<ShowState, ShowFamily[]> = {
  void: ['eclipse-chamber', 'ghost-lattice', 'spectral-plume'],
  atmosphere: ['spectral-plume', 'ghost-lattice', 'eclipse-chamber'],
  cadence: ['ghost-lattice', 'liquid-pressure-core', 'portal-iris'],
  tactile: ['storm-crown', 'liquid-pressure-core', 'ghost-lattice'],
  generative: ['liquid-pressure-core', 'portal-iris', 'cathedral-rings', 'spectral-plume'],
  surge: ['portal-iris', 'cathedral-rings', 'storm-crown', 'liquid-pressure-core'],
  aftermath: ['ghost-lattice', 'eclipse-chamber', 'spectral-plume']
};
const SHOW_STATE_PROFILES: Record<ShowState, ShowStateProfile> = {
  void: {
    supportStrength: 0.08,
    dwellBase: 8.6,
    dwellVariance: 5.4,
    transitionRate: 0.28
  },
  atmosphere: {
    supportStrength: 0.12,
    dwellBase: 7.2,
    dwellVariance: 4.4,
    transitionRate: 0.34
  },
  cadence: {
    supportStrength: 0.14,
    dwellBase: 5.8,
    dwellVariance: 3.4,
    transitionRate: 0.42
  },
  tactile: {
    supportStrength: 0.16,
    dwellBase: 4.8,
    dwellVariance: 2.8,
    transitionRate: 0.5
  },
  generative: {
    supportStrength: 0.18,
    dwellBase: 5.4,
    dwellVariance: 3.2,
    transitionRate: 0.46
  },
  surge: {
    supportStrength: 0.22,
    dwellBase: 4.2,
    dwellVariance: 2.2,
    transitionRate: 0.64
  },
  aftermath: {
    supportStrength: 0.1,
    dwellBase: 8.2,
    dwellVariance: 4.8,
    transitionRate: 0.26
  }
};

const BASE_BACKGROUND = new THREE.Color('#040507');
const COOL_BACKGROUND = new THREE.Color('#06141a');
const WARM_BACKGROUND = new THREE.Color('#1d1008');
const VOID_BACKGROUND = new THREE.Color('#020305');
const HERO_DARK = new THREE.Color('#0a0e12');
const HERO_GOLD = new THREE.Color('#b67c3e');
const HERO_TEAL = new THREE.Color('#1e7a77');
const GHOST_PALE = new THREE.Color('#f1e8d8');
const STAIN_VIOLET = new THREE.Color('#4f315a');
const STAIN_TEAL = new THREE.Color('#1a6f69');
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
const PRESSURE_WAVE_COLOR_FAMILIES: Record<PressureWaveBand, readonly THREE.Color[]> = {
  sub: [SOLAR_ORANGE, CYBER_YELLOW, ACID_LIME],
  mid: [HOT_MAGENTA, TOXIC_PINK, VOLT_VIOLET],
  high: [LASER_CYAN, TRON_BLUE, ELECTRIC_WHITE]
};
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
const HERO_COLOR_TRIGGER_OFFSETS = {
  handoff: 0,
  section: 2,
  strike: 1,
  release: 3,
  phrase: 2,
  bar: 1,
  tone: 0
} as const;

const HERO_FRESNEL_VERTEX_SHADER = `
varying vec3 vNormalDir;
varying vec3 vViewDir;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormalDir = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const HERO_FRESNEL_FRAGMENT_SHADER = `
uniform vec3 colorPrimary;
uniform vec3 colorSecondary;
uniform float intensity;
uniform float power;
uniform float bias;

varying vec3 vNormalDir;
varying vec3 vViewDir;

void main() {
  float fresnel = pow(
    clamp(bias + 1.0 - abs(dot(normalize(vNormalDir), normalize(vViewDir))), 0.0, 1.0),
    power
  );
  vec3 color = mix(colorPrimary, colorSecondary, clamp(fresnel * 0.7 + 0.15, 0.0, 1.0));
  gl_FragColor = vec4(color * fresnel * intensity, fresnel * intensity);
}
`;

type WeightedColorStop = {
  color: THREE.Color;
  weight: number;
};

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function createFamilyWeights(): Record<ShowFamily, number> {
  return {
    'liquid-pressure-core': 0,
    'portal-iris': 0,
    'cathedral-rings': 0,
    'ghost-lattice': 0,
    'storm-crown': 0,
    'eclipse-chamber': 1,
    'spectral-plume': 0
  };
}

function createActWeights(): Record<ShowAct, number> {
  return {
    'void-chamber': 1,
    'laser-bloom': 0,
    'matrix-storm': 0,
    'eclipse-rupture': 0,
    'ghost-afterimage': 0
  };
}

function easeInOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function pulseShape(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI);
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
}

function applyWeightedColor(
  target: THREE.Color,
  stops: WeightedColorStop[],
  base?: THREE.Color,
  baseWeight = 0
): THREE.Color {
  let total = 0;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (base && baseWeight > 0) {
    red += base.r * baseWeight;
    green += base.g * baseWeight;
    blue += base.b * baseWeight;
    total += baseWeight;
  }

  for (const stop of stops) {
    if (stop.weight <= 0) {
      continue;
    }

    red += stop.color.r * stop.weight;
    green += stop.color.g * stop.weight;
    blue += stop.color.b * stop.weight;
    total += stop.weight;
  }

  if (total <= 0) {
    return base ? target.copy(base) : target.setRGB(0, 0, 0);
  }

  return target.setRGB(red / total, green / total, blue / total);
}

function saturateColor(
  target: THREE.Color,
  saturationDelta: number,
  lightnessDelta = 0
): THREE.Color {
  return target.offsetHSL(0, saturationDelta, lightnessDelta);
}

function copyPaletteCycleColor(
  target: THREE.Color,
  palette: PaletteState,
  cycle: number,
  seed = ''
): THREE.Color {
  const family = PALETTE_COLOR_FAMILIES[palette];
  const index = (hashSignature(`${palette}:${seed}`) + cycle) % family.length;

  return target.copy(family[index] ?? family[0]!);
}

function copyPressureWaveColor(
  target: THREE.Color,
  band: PressureWaveBand,
  cycle: number,
  offset = 0
): THREE.Color {
  const family = PRESSURE_WAVE_COLOR_FAMILIES[band];
  const index = (cycle + offset) % family.length;

  return target.copy(family[index] ?? family[0]!);
}

function hashSignature(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function createAtmosphereAlphaTexture(
  kind: AtmosphereVeilMode | 'crystal',
  size = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (!context) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.needsUpdate = true;
    return fallback;
  }

  const imageData = context.createImageData(size, size);
  const data = imageData.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = x / (size - 1) * 2 - 1;
      const ny = y / (size - 1) * 2 - 1;
      const radius = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx);
      const edge = THREE.MathUtils.clamp(1 - radius, 0, 1);
      const radialSoft = Math.pow(edge, 1.8);
      const radialHard = Math.pow(edge, 2.4);
      const waveA =
        0.5 +
        0.5 *
          Math.sin(
            nx * 8.4 +
              angle * 3.4 +
              Math.cos(ny * 6.2 + radius * 8.4) * 1.6
          );
      const waveB =
        0.5 +
        0.5 *
          Math.cos(
            ny * 10.6 -
              angle * 4.3 +
              Math.sin(nx * 7.6 - radius * 6.4) * 1.8
          );
      const waveC =
        0.5 +
        0.5 *
          Math.sin(
            (nx + ny) * 14.2 +
              angle * 5.8 +
              Math.cos(radius * 10.4) * 2.1
          );
      const ribbon =
        0.5 +
        0.5 *
          Math.sin(
            (nx - ny) * 17.2 +
              radius * 12.8 +
              Math.sin(angle * 5.6) * 2.4
          );
      let alpha = 0;

      switch (kind) {
        case 'mist':
          alpha =
            radialSoft *
            Math.pow(
              THREE.MathUtils.clamp(
                waveA * 0.44 + waveB * 0.34 + waveC * 0.22,
                0,
                1
              ),
              1.7
            );
          break;
        case 'current':
          alpha =
            Math.pow(edge, 1.5) *
            THREE.MathUtils.clamp(
              waveA * 0.22 + waveB * 0.28 + ribbon * 0.5,
              0,
              1
            );
          alpha = Math.pow(alpha, 1.4);
          break;
        case 'charge':
          alpha =
            radialHard *
            Math.pow(
              THREE.MathUtils.clamp(
                ribbon * 0.52 +
                  waveC * 0.24 +
                  Math.abs(waveA - waveB) * 0.54,
                0,
                1
              ),
              2.1
            );
          break;
        case 'veil':
          alpha =
            Math.pow(edge, 1.3) *
            Math.pow(
              THREE.MathUtils.clamp(
                waveB * 0.4 + waveC * 0.28 + (1 - waveA) * 0.32,
                0,
                1
              ),
              1.55
            );
          break;
        case 'crystal':
          alpha =
            Math.pow(edge, 0.86) *
            Math.pow(
              THREE.MathUtils.clamp(
                Math.abs(waveA - 0.5) * 0.72 +
                  Math.abs(ribbon - 0.5) * 0.96 +
                  waveC * 0.24,
                0,
                1
              ),
              1.45
            );
          break;
      }

      const pixelIndex = (y * size + x) * 4;
      const value = Math.round(THREE.MathUtils.clamp(alpha, 0, 1) * 255);
      data[pixelIndex] = 255;
      data[pixelIndex + 1] = 255;
      data[pixelIndex + 2] = 255;
      data[pixelIndex + 3] = value;
    }
  }

  context.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

export class ObsidianBloomScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private readonly root = new THREE.Group();
  private readonly atmosphereGroup = new THREE.Group();
  private readonly chamberGroup = new THREE.Group();
  private readonly heroGroup = new THREE.Group();
  private readonly accentGroup = new THREE.Group();
  private readonly worldSphereMaterial = new THREE.MeshBasicMaterial({ color: BASE_BACKGROUND.clone(), side: THREE.BackSide });
  private readonly worldSphere = new THREE.Mesh(new THREE.SphereGeometry(24, 48, 32), this.worldSphereMaterial);
  private readonly worldStainMaterial = new THREE.MeshBasicMaterial({ color: STAIN_VIOLET.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  private readonly worldStainPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), this.worldStainMaterial);
  private readonly worldFlashMaterial = new THREE.MeshBasicMaterial({ color: GHOST_PALE.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  private readonly worldFlashPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), this.worldFlashMaterial);
  private readonly fogColor = BASE_BACKGROUND.clone();
  private readonly fog = new THREE.FogExp2(this.fogColor, 0.078);
  private readonly heroGeometry = new THREE.IcosahedronGeometry(0.96, 3);
  private readonly heroMaterial = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#04070b'), emissive: LASER_CYAN.clone(), emissiveIntensity: 0.1, metalness: 0.04, roughness: 0.36, transmission: 0.22, transparent: true, opacity: 0.72, thickness: 0.84, ior: 1.14, clearcoat: 0.55, clearcoatRoughness: 0.3 });
  private readonly heroMesh = new THREE.Mesh(this.heroGeometry, this.heroMaterial);
  private readonly heroAuraMaterial = new THREE.MeshBasicMaterial({ color: LASER_CYAN.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.BackSide });
  private readonly heroAuraMesh = new THREE.Mesh(this.heroGeometry, this.heroAuraMaterial);
  private readonly heroFresnelUniforms = {
    colorPrimary: { value: LASER_CYAN.clone() },
    colorSecondary: { value: ELECTRIC_WHITE.clone() },
    intensity: { value: 0 },
    power: { value: 2.6 },
    bias: { value: 0.12 }
  };
  private readonly heroFresnelMaterial = new THREE.ShaderMaterial({
    uniforms: this.heroFresnelUniforms,
    vertexShader: HERO_FRESNEL_VERTEX_SHADER,
    fragmentShader: HERO_FRESNEL_FRAGMENT_SHADER,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.BackSide
  });
  private readonly heroFresnelMesh = new THREE.Mesh(this.heroGeometry, this.heroFresnelMaterial);
  private readonly heroEnergyShellMaterial = new THREE.MeshBasicMaterial({ color: TRON_BLUE.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.BackSide });
  private readonly heroEnergyShellMesh = new THREE.Mesh(this.heroGeometry, this.heroEnergyShellMaterial);
  private readonly heroSeamMaterial = new THREE.MeshBasicMaterial({ color: LASER_CYAN.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, wireframe: true });
  private readonly heroSeamMesh = new THREE.Mesh(this.heroGeometry, this.heroSeamMaterial);
  private readonly ghostHeroMaterial = new THREE.MeshBasicMaterial({ color: GHOST_PALE.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, wireframe: true });
  private readonly ghostHeroMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.04, 2), this.ghostHeroMaterial);
  private readonly coreMaterial = new THREE.MeshPhysicalMaterial({ color: '#090d12', emissive: TRON_BLUE.clone(), emissiveIntensity: 0.08, metalness: 0.02, roughness: 0.18, transmission: 0.08, transparent: true, opacity: 0.74, thickness: 0.42, ior: 1.1, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  private readonly coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 2), this.coreMaterial);
  private readonly voidCoreMaterial = new THREE.MeshBasicMaterial({ color: '#030405', transparent: true, opacity: 0.9, depthWrite: false });
  private readonly voidCoreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), this.voidCoreMaterial);
  private readonly membraneMaterial = new THREE.MeshBasicMaterial({ color: HERO_TEAL.clone(), transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.DoubleSide });
  private readonly membraneMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28, 2), this.membraneMaterial);
  private readonly crownMaterial = new THREE.MeshBasicMaterial({ color: HERO_GOLD.clone(), transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
  private readonly crownMesh = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.03, 24, 160), this.crownMaterial);
  private readonly heroEdgesMaterial = new THREE.LineBasicMaterial({ color: GHOST_PALE.clone(), transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
  private readonly heroEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.94, 2)), this.heroEdgesMaterial);
  private readonly chamberRings: ChamberRing[] = [];
  private readonly portalRings: PortalRing[] = [];
  private readonly chromaHalos: ChromaHalo[] = [];
  private readonly latticeMaterials: THREE.LineBasicMaterial[] = [];
  private readonly ghostLattice = new THREE.Group();
  private readonly laserGroup = new THREE.Group();
  private readonly laserBeams: LaserBeam[] = [];
  private readonly atmosphereMistTexture = createAtmosphereAlphaTexture('mist');
  private readonly atmosphereCurrentTexture =
    createAtmosphereAlphaTexture('current');
  private readonly atmosphereChargeTexture =
    createAtmosphereAlphaTexture('charge');
  private readonly atmosphereVeilTexture = createAtmosphereAlphaTexture('veil');
  private readonly atmosphereCrystalTexture =
    createAtmosphereAlphaTexture('crystal');
  private readonly atmosphereVeils: AtmosphereVeil[] = [];
  private readonly atmosphereColumns: AtmosphereColumn[] = [];
  private readonly stageFrameGroup = new THREE.Group();
  private readonly stageBlades: StageBlade[] = [];
  private readonly stageSweepPlanes: StageSweepPlane[] = [];
  private readonly satellites: Satellite[] = [];
  private readonly shards: Shard[] = [];
  private readonly twinMeshes: Array<THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshPhysicalMaterial>> = [];
  private readonly twinLights: THREE.PointLight[] = [];
  private readonly pressureWaves: PressureWave[] = [];
  private readonly particleGeometry = new THREE.BufferGeometry();
  private readonly particleMaterial = new THREE.PointsMaterial({ size: 0.032, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, sizeAttenuation: true, vertexColors: true });
  private readonly particleCloud = new THREE.Points(this.particleGeometry, this.particleMaterial);
  private readonly particlePoints: ParticlePoint[] = [];
  private readonly particleScratch = new THREE.Vector3();
  private readonly particleColorScratch = new THREE.Color();
  private readonly atmosphereColorScratch = new THREE.Color();
  private readonly atmosphereColorScratchB = new THREE.Color();
  private readonly atmosphereColorScratchC = new THREE.Color();
  private readonly pressureWaveColorScratch = new THREE.Color();
  private readonly pressureWaveColorScratchB = new THREE.Color();
  private readonly pressureWaveLightColorScratch = new THREE.Color();
  private readonly pressureWaveLightColorScratchB = new THREE.Color();
  private readonly heroTelemetryColor = new THREE.Color();
  private readonly heroPrimaryColor = new THREE.Color();
  private readonly heroAccentColor = new THREE.Color();
  private readonly heroPulseColor = new THREE.Color();
  private readonly heroShadowTint = new THREE.Color();
  private readonly heroGlowLight = new THREE.PointLight('#35f4ff', 0, 8, 2);
  private readonly heroAccentLight = new THREE.PointLight('#ff3bc9', 0, 6, 2);
  private readonly pressureWaveLight = new THREE.PointLight('#35f4ff', 0, 8, 2);
  private readonly pressureWaveAccentLight = new THREE.PointLight('#ff3bc9', 0, 7, 2);
  private readonly ambientLight = new THREE.AmbientLight('#677483', 0.12);
  private readonly fillLight = new THREE.HemisphereLight('#26424f', '#040506', 0.36);
  private readonly warmLight = new THREE.PointLight('#ff4ed6', 0.42, 16, 2);
  private readonly coolLight = new THREE.PointLight('#35f4ff', 0.76, 20, 2);
  private readonly formBasePositions = this.heroGeometry.attributes.position.array.slice() as Float32Array;
  private readonly formDirections = new Float32Array(this.heroGeometry.attributes.position.array.length);
  private readonly formSeeds = new Float32Array(this.heroGeometry.attributes.position.count);
  private readonly pointerTarget = new THREE.Vector2();
  private readonly pointerCurrent = new THREE.Vector2();
  private readonly organicChamberDrift = new THREE.Vector3();
  private readonly organicChamberTarget = new THREE.Vector3();
  private readonly organicHeroDrift = new THREE.Vector3();
  private readonly organicHeroTarget = new THREE.Vector3();
  private readonly organicShellDrift = new THREE.Vector3();
  private readonly organicShellTarget = new THREE.Vector3();
  private readonly organicCameraDrift = new THREE.Vector3();
  private readonly organicCameraTarget = new THREE.Vector3();
  private readonly organicGazeDrift = new THREE.Vector3();
  private readonly organicGazeTarget = new THREE.Vector3();
  private readonly heroMotionState = createMotionPoseState();
  private readonly chamberMotionState = createMotionPoseState();
  private readonly cameraMotionState = createMotionPoseState();
  private readonly motionRotationMatrix = new THREE.Matrix4();
  private readonly motionRollQuaternion = new THREE.Quaternion();
  private readonly motionBaseQuaternion = new THREE.Quaternion();
  private readonly motionCompositeQuaternion = new THREE.Quaternion();
  private readonly motionLookTarget = new THREE.Vector3();
  private readonly motionLookOffset = new THREE.Vector3();
  private readonly motionPositionScratch = new THREE.Vector3();
  private readonly motionPositionScratchB = new THREE.Vector3();
  private readonly motionPositionScratchC = new THREE.Vector3();
  private readonly motionEulerScratch = new THREE.Euler();
  private readonly motionEulerScratchB = new THREE.Euler();
  private readonly motionEulerScratchC = new THREE.Euler();
  private readonly chamberTelemetryEuler = new THREE.Euler();
  private readonly cameraTelemetryEuler = new THREE.Euler();
  private readonly motionVelocityScratch = new THREE.Vector3();
  private readonly motionAngularScratch = new THREE.Vector3();
  private readonly motionUp = new THREE.Vector3(0, 1, 0);

  private qualityProfile: SceneQualityProfile;
  private tuning = DEFAULT_RUNTIME_TUNING;
  private currentListeningMode: ListeningMode = 'room-mic';
  private roomMusicVisualFloor = 0;
  private adaptiveMusicVisualFloor = 0;
  private subPressure = 0; private bassBody = 0; private lowMidBody = 0; private presence = 0; private body = 0; private air = 0; private shimmer = 0; private accent = 0; private brightness = 0; private roughness = 0; private tonalStability = 0; private harmonicColor = 0.5; private phraseTension = 0; private resonance = 0; private speech = 0; private roomness = 0; private musicConfidence = 0; private peakConfidence = 0; private momentum = 0; private ambienceConfidence = 0; private speechConfidence = 0; private transientConfidence = 0;
  private activeFamily: ShowFamily = 'eclipse-chamber';
  private fromFamily: ShowFamily = 'eclipse-chamber';
  private toFamily: ShowFamily = 'eclipse-chamber';
  private familyTransition = 1;
  private nextFamilyAt = 8;
  private readonly familyWeights = createFamilyWeights();
  private activeAct: ShowAct = 'void-chamber';
  private fromAct: ShowAct = 'void-chamber';
  private toAct: ShowAct = 'void-chamber';
  private actTransition = 1;
  private nextActAt = 9;
  private lastActChangeSeconds = 0;
  private readonly actWeights = createActWeights();
  private readonly activeEvents: MacroEvent[] = [];
  private nextEventAt = 10;
  private liftPulse = 0;
  private strikePulse = 0;
  private releasePulse = 0;
  private beatConfidence = 0;
  private beatPhase = 0;
  private beatJustHit = false;
  private barPhase = 0;
  private phrasePhase = 0;
  private preDropTension = 0;
  private dropImpact = 0;
  private sectionChange = 0;
  private releaseTail = 0;
  private performanceIntent: PerformanceIntent = 'hold';
  private lastMomentSignature = '';
  private directorInitialized = false;
  private directorEnergy = DEFAULT_RUNTIME_TUNING.energy;
  private directorWorldActivity = DEFAULT_RUNTIME_TUNING.worldActivity;
  private directorSpectacle = DEFAULT_RUNTIME_TUNING.spectacle;
  private directorRadiance = DEFAULT_RUNTIME_TUNING.radiance;
  private directorGeometry = DEFAULT_RUNTIME_TUNING.geometry;
  private directorAtmosphere = DEFAULT_RUNTIME_TUNING.atmosphere;
  private directorFraming = DEFAULT_RUNTIME_TUNING.framing;
  private directorColorBias = DEFAULT_RUNTIME_TUNING.colorBias;
  private directorColorWarp = 0.34;
  private directorLaserDrive = DEFAULT_RUNTIME_TUNING.beatDrive;
  private shellTension = 0.18;
  private shellBloom = 0.18;
  private shellOrbit = 0.22;
  private shellHalo = 0.24;
  private glowOverdrive = 0.2;
  private livingField = 0.22;
  private atmosphereGas = 1;
  private atmosphereLiquid = 0;
  private atmospherePlasma = 0;
  private atmosphereCrystal = 0;
  private atmospherePressure = 0.16;
  private atmosphereIonization = 0.08;
  private atmosphereResidue = 0.18;
  private atmosphereStructureReveal = 0.08;
  private activeMatterState: AtmosphereMatterState = 'gas';
  private preBeatLift = 0;
  private beatStrike = 0;
  private postBeatRelease = 0;
  private interBeatFloat = 0;
  private barTurn = 0;
  private phraseResolve = 0;
  private ambientGlowBudget = 0.12;
  private eventGlowBudget = 0.08;
  private worldGlowSpend = 0;
  private heroGlowSpend = 0;
  private shellGlowSpend = 0;
  private paletteState: PaletteState = 'void-cyan';
  private lastPaletteChangeSeconds = 0;
  private heroPrimaryColorCycle = 0;
  private heroAccentColorCycle = 1;
  private heroPulseColorCycle = 2;
  private lastHeroColorChangeSeconds = -999;
  private lastHeroColorTriggerSignature = '';
  private lastHeroColorRouteSignature = '';
  private lastHeroColorToneSignature = '';
  private lastPressureWaveTriggerSeconds = -999;
  private activeHeroForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroForm;
  private previousHeroForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroForm;
  private activeHeroAccentForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroAccentForm;
  private heroFormTransition = 1;
  private lastHeroFormChangeSeconds = 0;
  private cueState: VisualCueState = { ...DEFAULT_VISUAL_CUE_STATE };
  private stageCuePlan: StageCuePlan = { ...DEFAULT_STAGE_CUE_PLAN };
  private stageCompositionPlan: StageCompositionPlan = {
    ...DEFAULT_STAGE_COMPOSITION_PLAN,
    heroEnvelope: { ...DEFAULT_STAGE_COMPOSITION_PLAN.heroEnvelope },
    chamberEnvelope: { ...DEFAULT_STAGE_COMPOSITION_PLAN.chamberEnvelope },
    subtractivePolicy: { ...DEFAULT_STAGE_COMPOSITION_PLAN.subtractivePolicy }
  };
  private stageCueFamilySeconds = 0;
  private heroHue = 0;
  private worldHue = 0;
  private heroScaleCurrent = 0.56;
  private heroScreenX = 0.5;
  private heroScreenY = 0.5;
  private heroCoverageEstimateCurrent = 0.12;
  private heroOffCenterPenaltyCurrent = 0;
  private heroDepthPenaltyCurrent = 0;
  private ringAuthorityCurrent = 0;
  private chamberPresenceScoreCurrent = 0.18;
  private frameHierarchyScoreCurrent = 0.72;
  private compositionSafetyFlagCurrent = false;
  private compositionSafetyScoreCurrent = 0.82;
  private overbrightCurrent = 0;
  private ringBeltPersistenceCurrent = 0.08;
  private wirefieldDensityScoreCurrent = 0.16;
  private worldDominanceDeliveredCurrent = 0.18;
  private stageFallbackHeroOverreachCurrent = false;
  private stageFallbackRingOverdrawCurrent = false;
  private stageFallbackOverbrightRiskCurrent = false;
  private stageFallbackWashoutRiskCurrent = false;
  private stageAudioFeatures: StageAudioFeatures = {
    ...DEFAULT_STAGE_AUDIO_FEATURES
  };
  private readonly heroTelemetryVector = new THREE.Vector3();
  private readonly heroTelemetryOffsetX = new THREE.Vector3();
  private readonly heroTelemetryOffsetY = new THREE.Vector3();
  private visualTelemetry: VisualTelemetryFrame = { ...DEFAULT_VISUAL_TELEMETRY };
  private readonly heroRig: HeroRig;
  private readonly chamberRig: ChamberRig;
  private readonly eventRig: EventRig;
  private readonly framingRig: FramingRig;
  private readonly telemetryRig = new TelemetryRig();

  constructor(profile: SceneQualityProfile) {
    this.qualityProfile = profile;
    this.visualTelemetry.qualityTier = profile.tier;
    this.scene = new THREE.Scene();
    this.scene.background = BASE_BACKGROUND.clone();
    this.scene.fog = this.fog;
    this.camera = new THREE.PerspectiveCamera(54, 1, 0.1, 48);
    this.camera.position.set(0, 0.02, 10.4);
    this.cameraMotionState.position.copy(this.camera.position);
    this.cameraMotionState.targetPosition.copy(this.camera.position);
    this.cameraMotionState.quaternion.copy(this.camera.quaternion);
    this.cameraMotionState.targetQuaternion.copy(this.camera.quaternion);
    this.stageFrameGroup.position.z = -6.4;
    this.camera.add(this.stageFrameGroup);
    this.heroRig = new HeroRig({
      build: () => {
        this.buildHero();
      },
      update: (context) => {
        this.updateHero(context.elapsedSeconds, context.idleBreath);
      }
    });
    this.chamberRig = new ChamberRig({
      build: () => {
        this.buildAtmosphere();
        this.buildChamber();
      },
      updateWorld: (context) => {
        this.updateWorld(context.elapsedSeconds, context.idleBreath);
      },
      updateChamber: (context) => {
        this.updateChamber(context.elapsedSeconds, context.idleBreath);
      },
      updateLights: (elapsedSeconds) => {
        this.updateLights(elapsedSeconds);
      }
    });
    this.eventRig = new EventRig({
      build: () => {
        this.buildSatellites();
        this.buildShards();
        this.buildPressureWaves();
      },
      updateRouting: (context) => {
        this.updateEventRouting(
          context.frame,
          context.elapsedSeconds,
          context.deltaSeconds
        );
      },
      updateAccents: (context) => {
        this.updateAccents(context.elapsedSeconds, context.deltaSeconds);
      },
      updateParticles: (elapsedSeconds) => {
        this.updateParticles(elapsedSeconds);
      }
    });
    this.framingRig = new FramingRig({
      build: () => {
        this.buildStageFrame();
      },
      updateStageFrame: (context) => {
        this.updateStageFrame(context.elapsedSeconds, context.idleBreath);
      },
      updateCamera: (context) => {
        this.updateCamera(
          context.elapsedSeconds,
          context.director.geometry,
          context.director.spectacle,
          context.beatDrive,
          context.deltaSeconds
        );
      }
    });
    this.seedHeroGeometry();
    this.chamberRig.build();
    this.heroRig.build();
    this.eventRig.build();
    this.pressureWaveLight.position.set(0, -0.14, -0.82);
    this.pressureWaveAccentLight.position.set(0, 0.06, -1.08);
    this.accentGroup.add(this.pressureWaveLight);
    this.accentGroup.add(this.pressureWaveAccentLight);
    this.framingRig.build();
    this.buildParticleField();
    this.scene.add(this.camera);
    this.scene.add(this.worldSphere);
    this.worldStainPlane.position.z = -8;
    this.worldFlashPlane.position.z = -7.8;
    this.scene.add(this.worldStainPlane);
    this.scene.add(this.worldFlashPlane);
    this.root.add(this.atmosphereGroup);
    this.root.add(this.chamberGroup);
    this.root.add(this.heroGroup);
    this.root.add(this.accentGroup);
    this.root.add(this.particleCloud);
    this.scene.add(this.root);
    this.scene.add(this.ambientLight);
    this.scene.add(this.fillLight);
    this.scene.add(this.warmLight);
    this.scene.add(this.coolLight);
    this.warmLight.position.set(2.2, 1.5, 4);
    this.coolLight.position.set(-2.8, -1.4, 3.4);
    this.applyQualityProfile(profile);
  }

  resize(width: number, height: number): void { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
  setQualityProfile(profile: SceneQualityProfile): void { this.qualityProfile = profile; this.applyQualityProfile(profile); }
  setTuning(tuning: RuntimeTuning): void {
    this.tuning = tuning;
    if (!this.directorInitialized) {
      this.directorEnergy = tuning.energy;
      this.directorWorldActivity = tuning.worldActivity;
      this.directorSpectacle = tuning.spectacle;
      this.directorRadiance = tuning.radiance;
      this.directorGeometry = tuning.geometry;
      this.directorAtmosphere = tuning.atmosphere;
      this.directorFraming = tuning.framing;
      this.directorColorBias = tuning.colorBias;
      this.directorLaserDrive = tuning.beatDrive;
      this.directorColorWarp = THREE.MathUtils.clamp(
        tuning.radiance * 0.42 + tuning.spectacle * 0.16,
        0,
        1
      );
      this.directorInitialized = true;
    }
  }
  setPointerInfluence(x: number, y: number): void { this.pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1)); }
  getVisualTelemetry(): VisualTelemetryFrame { return { ...this.visualTelemetry, macroEventsActive: [...this.visualTelemetry.macroEventsActive], temporalWindows: { ...this.visualTelemetry.temporalWindows } }; }

  update(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const smooth = (current: number, target: number, rate: number) =>
      this.smoothValue(current, target, rate, deltaSeconds);

    this.pointerCurrent.lerp(
      this.pointerTarget,
      1 - Math.exp(-deltaSeconds * 2.8)
    );

    this.updateDirector(frame, elapsedSeconds, deltaSeconds);

    const response =
      0.88 +
      this.tuning.response * 0.22 +
      this.directorEnergy * 0.18 +
      this.directorSpectacle * 0.08;
    const motion =
      0.84 +
      this.tuning.motion * 0.16 +
      this.directorEnergy * 0.14 +
      this.directorWorldActivity * 0.08;
    const radiance = 0.8 + this.directorRadiance * 0.54;
    const beatDrive = THREE.MathUtils.clamp(
      this.tuning.beatDrive * 0.54 + this.directorLaserDrive * 0.62,
      0,
      1
    );

    this.subPressure = smooth(
      this.subPressure,
      frame.subPressure * (0.84 + this.directorEnergy * 0.42 + beatDrive * 0.16),
      3.4
    );
    this.bassBody = smooth(
      this.bassBody,
      frame.bassBody * (0.88 + this.directorEnergy * 0.36),
      3.2
    );
    this.lowMidBody = smooth(
      this.lowMidBody,
      frame.lowMidBody * (0.9 + response * 0.2),
      3.4
    );
    this.presence = smooth(this.presence, frame.presence * response, 4.2);
    this.body = smooth(
      this.body,
      frame.body * (0.9 + this.directorEnergy * 0.36 + this.directorSpectacle * 0.16),
      3.2
    );
    this.air = smooth(
      this.air,
      frame.air * (0.88 + this.directorAtmosphere * 0.34 + this.directorRadiance * 0.14),
      4.4
    );
    this.shimmer = smooth(
      this.shimmer,
      frame.shimmer * (0.84 + this.directorRadiance * 0.42 + this.directorColorWarp * 0.12),
      5
    );
    this.accent = smooth(
      this.accent,
      frame.accent * this.tuning.accentStrength * (0.9 + beatDrive * 0.28),
      frame.accent > this.accent ? 11 : 5.8
    );
    this.brightness = smooth(
      this.brightness,
      frame.brightness * radiance * (0.94 + this.directorColorWarp * 0.1),
      4.6
    );
    this.roughness = smooth(this.roughness, frame.roughness * motion, 4.8);
    this.tonalStability = smooth(this.tonalStability, frame.tonalStability, 2.4);
    this.harmonicColor = smooth(this.harmonicColor, frame.harmonicColor, 2);
    this.phraseTension = smooth(
      this.phraseTension,
      frame.phraseTension * (0.9 + this.tuning.eventfulness * 0.12 + this.directorSpectacle * 0.18),
      frame.phraseTension > this.phraseTension ? 1.8 : 0.78
    );
    this.resonance = smooth(
      this.resonance,
      frame.resonance * (0.9 + this.directorSpectacle * 0.22 + this.directorAtmosphere * 0.12),
      frame.resonance > this.resonance ? 1.8 : 0.64
    );
    this.speech = smooth(this.speech, frame.speech, 4.4);
    this.roomness = smooth(this.roomness, frame.roomness, 2.2);
    this.musicConfidence = smooth(
      this.musicConfidence,
      frame.musicConfidence * (0.92 + this.tuning.sensitivity * 0.18 + beatDrive * 0.16),
      2.8
    );
    this.peakConfidence = smooth(
      this.peakConfidence,
      frame.peakConfidence * (0.9 + this.tuning.eventfulness * 0.1 + this.directorSpectacle * 0.2),
      frame.peakConfidence > this.peakConfidence ? 4.2 : 2.1
    );
    this.beatConfidence = smooth(
      this.beatConfidence,
      frame.beatConfidence * (0.92 + this.tuning.beatDrive * 0.14),
      4.2
    );
    this.beatJustHit =
      (frame.beatPhase + 0.06 < this.beatPhase ||
        (frame.beatPhase < 0.08 && this.beatPhase > 0.24)) &&
      frame.beatConfidence > 0.14;
    this.currentListeningMode = frame.mode;
    this.beatPhase = frame.beatPhase;
    this.barPhase = frame.barPhase;
    this.phrasePhase = frame.phrasePhase;
    this.preDropTension = smooth(
      this.preDropTension,
      frame.preDropTension * (0.9 + this.tuning.eventfulness * 0.08 + this.directorSpectacle * 0.16),
      frame.preDropTension > this.preDropTension ? 2.4 : 0.7
    );
    this.dropImpact = smooth(
      this.dropImpact,
      frame.dropImpact * (0.9 + this.directorSpectacle * 0.24 + this.directorEnergy * 0.18),
      frame.dropImpact > this.dropImpact ? 12 : 2.1
    );
    this.sectionChange = smooth(
      this.sectionChange,
      frame.sectionChange * (0.9 + this.directorSpectacle * 0.22),
      frame.sectionChange > this.sectionChange ? 3.2 : 0.62
    );
    this.releaseTail = smooth(
      this.releaseTail,
      frame.releaseTail * (0.9 + this.directorAtmosphere * 0.16),
      frame.releaseTail > this.releaseTail ? 1.6 : 0.5
    );
    this.performanceIntent = frame.performanceIntent;
    this.momentum = smooth(
      this.momentum,
      frame.momentum * (0.92 + this.directorEnergy * 0.2 + this.directorSpectacle * 0.08),
      2.6
    );
    this.ambienceConfidence = smooth(
      this.ambienceConfidence,
      frame.ambienceConfidence,
      2.2
    );
    this.speechConfidence = smooth(
      this.speechConfidence,
      frame.speechConfidence,
      4.4
    );
    this.transientConfidence = smooth(
      this.transientConfidence,
      frame.transientConfidence * (0.94 + beatDrive * 0.18),
      7.4
    );

    this.updateTemporalWindows(frame, deltaSeconds);
    this.updateActRouting(frame, elapsedSeconds, deltaSeconds);
    this.stageAudioFeatures = deriveStageAudioFeatures(frame);
    this.cueState = deriveVisualCue(frame, this.activeAct, {
      preBeatLift: this.preBeatLift,
      beatStrike: this.beatStrike,
      postBeatRelease: this.postBeatRelease,
      interBeatFloat: this.interBeatFloat,
      barTurn: this.barTurn,
      phraseResolve: this.phraseResolve
    });
    const provisionalStageCuePlan = deriveStageCuePlan({
      frame,
      cueState: this.cueState,
      showAct: this.activeAct,
      cueFamilySeconds: this.stageCueFamilySeconds,
      tuning: this.tuning
    });
    const nextCueFamilySeconds =
      provisionalStageCuePlan.family === this.stageCuePlan.family
        ? this.stageCueFamilySeconds + deltaSeconds
        : 0;
    this.stageCuePlan = deriveStageCuePlan({
      frame,
      cueState: this.cueState,
      showAct: this.activeAct,
      cueFamilySeconds: nextCueFamilySeconds,
      tuning: this.tuning
    });
    this.stageCueFamilySeconds = nextCueFamilySeconds;
    this.updatePaletteState(frame, elapsedSeconds, this.stageCuePlan);
    this.updateHeroColorHandoff(frame, elapsedSeconds, this.stageCuePlan);
    this.updatePerformanceChoreography(elapsedSeconds, deltaSeconds);
    this.updateOrganicSpatialLife(elapsedSeconds, deltaSeconds);

    const momentSignature =
      frame.momentKind === 'none'
        ? 'none'
        : `${frame.momentKind}:${frame.timestampMs}`;
    if (
      frame.momentKind !== 'none' &&
      momentSignature !== this.lastMomentSignature
    ) {
      if (frame.momentKind === 'lift') {
        this.liftPulse = Math.max(this.liftPulse, frame.momentAmount);
      } else if (frame.momentKind === 'strike') {
        this.strikePulse = Math.max(this.strikePulse, frame.momentAmount);
      } else if (frame.momentKind === 'release') {
        this.releasePulse = Math.max(this.releasePulse, frame.momentAmount);
      }
      this.lastMomentSignature = momentSignature;
    }

    this.updateFamilyRouting(frame, elapsedSeconds, deltaSeconds);
    this.updateAtmosphereState(deltaSeconds);

    const idleBreath =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds * (0.26 + this.roomness * 0.06 + this.ambienceConfidence * 0.04)
        );
    const stageIdleContext: StageIdleContext = {
      frame,
      elapsedSeconds,
      deltaSeconds,
      idleBreath,
      activeAct: this.activeAct,
      paletteState: this.paletteState,
      cueState: this.cueState,
      cuePlan: this.stageCuePlan,
      audioFeatures: this.stageAudioFeatures,
      temporalWindows: {
        preBeatLift: this.preBeatLift,
        beatStrike: this.beatStrike,
        postBeatRelease: this.postBeatRelease,
        interBeatFloat: this.interBeatFloat,
        barTurn: this.barTurn,
        phraseResolve: this.phraseResolve
      },
      qualityTier: this.qualityProfile.tier,
      pointer: {
        x: this.pointerCurrent.x,
        y: this.pointerCurrent.y
      },
      budgets: {
        ambientGlow: this.ambientGlowBudget,
        eventGlow: this.eventGlowBudget
      },
      director: {
        worldActivity: this.directorWorldActivity,
        spectacle: this.directorSpectacle,
        geometry: this.directorGeometry,
        radiance: this.directorRadiance,
        atmosphere: this.directorAtmosphere,
        framing: this.directorFraming,
        colorBias: this.directorColorBias,
        colorWarp: this.directorColorWarp,
        laserDrive: this.directorLaserDrive
      },
      tuning: this.tuning
    };
    this.stageCompositionPlan = this.framingRig.updatePlan(stageIdleContext, {
      heroCoverageEstimate: this.visualTelemetry.heroCoverageEstimate,
      heroOffCenterPenalty: this.visualTelemetry.heroOffCenterPenalty,
      heroDepthPenalty: this.visualTelemetry.heroDepthPenalty,
      chamberPresenceScore: this.visualTelemetry.chamberPresenceScore,
      frameHierarchyScore: this.visualTelemetry.frameHierarchyScore,
      compositionSafetyFlag: this.visualTelemetry.compositionSafetyFlag,
      ringBeltPersistence: this.visualTelemetry.ringBeltPersistence,
      wirefieldDensityScore: this.visualTelemetry.wirefieldDensityScore,
      worldDominanceDelivered: this.visualTelemetry.worldDominanceDelivered,
      overbright: this.visualTelemetry.overbright
    });
    const framingSnapshot = this.framingRig.getSnapshot();
    this.stageFallbackHeroOverreachCurrent = framingSnapshot.fallbacks.some(
      (fallback) => fallback.applied && fallback.reason === 'hero-overreach'
    );
    this.stageFallbackRingOverdrawCurrent = framingSnapshot.fallbacks.some(
      (fallback) => fallback.applied && fallback.reason === 'ring-overdraw'
    );
    this.stageFallbackOverbrightRiskCurrent = framingSnapshot.fallbacks.some(
      (fallback) => fallback.applied && fallback.reason === 'overbright-risk'
    );
    this.stageFallbackWashoutRiskCurrent = framingSnapshot.fallbacks.some(
      (fallback) => fallback.applied && fallback.reason === 'washout-risk'
    );
    this.updateLocomotion(stageIdleContext);
    const eventFrameContext: EventFrameContext = {
      ...stageIdleContext,
      beatDrive
    };

    this.eventRig.updateRouting(stageIdleContext);
    this.chamberRig.updateStage(stageIdleContext);
    this.framingRig.updateStage(stageIdleContext);
    this.heroRig.update(stageIdleContext);
    this.eventRig.updateFrame(eventFrameContext);
    this.chamberRig.updateLighting(elapsedSeconds);
    this.framingRig.updateCamera(eventFrameContext);
    this.refreshVisualTelemetry();
  }

  dispose(): void {
    this.framingRig.dispose();
    this.eventRig.dispose();
    this.heroRig.dispose();
    this.chamberRig.dispose();
    this.scene.remove(this.root);
    this.scene.remove(this.worldSphere);
    this.scene.remove(this.worldStainPlane);
    this.scene.remove(this.worldFlashPlane);

    this.heroGeometry.dispose();
    this.heroMaterial.dispose();
    this.heroAuraMaterial.dispose();
    this.heroFresnelMaterial.dispose();
    this.heroEnergyShellMaterial.dispose();
    this.heroSeamMaterial.dispose();
    this.ghostHeroMaterial.dispose();
    this.coreMaterial.dispose();
    this.voidCoreMaterial.dispose();
    this.membraneMaterial.dispose();
    this.crownMaterial.dispose();
    this.heroEdgesMaterial.dispose();
    this.worldSphere.geometry.dispose();
    this.worldSphereMaterial.dispose();
    this.worldStainPlane.geometry.dispose();
    this.worldStainMaterial.dispose();
    this.worldFlashPlane.geometry.dispose();
    this.worldFlashMaterial.dispose();
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();

    this.chamberRings.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.portalRings.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.chromaHalos.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.latticeMaterials.forEach((material) => material.dispose());
    this.ghostLattice.children.forEach((child) => {
      const line = child as THREE.LineSegments;
      line.geometry.dispose();
    });
    this.laserBeams.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.stageBlades.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.stageSweepPlanes.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.satellites.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.shards.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.twinMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.pressureWaves.forEach(({ waveMesh, torusMesh, haloMesh }) => {
      waveMesh.geometry.dispose();
      waveMesh.material.dispose();
      torusMesh.geometry.dispose();
      torusMesh.material.dispose();
      haloMesh.geometry.dispose();
      haloMesh.material.dispose();
    });
    this.atmosphereVeils.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.atmosphereColumns.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.atmosphereMistTexture.dispose();
    this.atmosphereCurrentTexture.dispose();
    this.atmosphereChargeTexture.dispose();
    this.atmosphereVeilTexture.dispose();
    this.atmosphereCrystalTexture.dispose();
  }

  private applyQualityProfile(profile: SceneQualityProfile): void {
    this.visualTelemetry.qualityTier = profile.tier;
    this.particleGeometry.setDrawRange(0, profile.particleDrawCount);
    this.particleMaterial.opacity =
      0.08 * profile.particleOpacityMultiplier;
    this.particleMaterial.size =
      profile.tier === 'premium' ? 0.04 : profile.tier === 'balanced' ? 0.035 : 0.03;
    this.membraneMaterial.opacity = 0.04 * profile.auraOpacityMultiplier;
    this.crownMaterial.opacity = 0.05 * profile.auraOpacityMultiplier;
    this.heroAuraMaterial.opacity = 0;
    this.heroFresnelUniforms.intensity.value = 0;
    this.heroEnergyShellMaterial.opacity = 0;
    this.heroSeamMaterial.opacity = 0;
    this.ghostHeroMaterial.opacity = 0;
    this.portalRings.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.chromaHalos.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.laserBeams.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.atmosphereVeils.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.atmosphereColumns.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
  }

  private seedHeroGeometry(): void {
    const positions = this.heroGeometry.attributes.position
      .array as Float32Array;
    for (let index = 0; index < this.heroGeometry.attributes.position.count; index += 1) {
      const baseIndex = index * 3;
      const x = positions[baseIndex];
      const y = positions[baseIndex + 1];
      const z = positions[baseIndex + 2];
      const vector = new THREE.Vector3(x, y, z).normalize();

      this.formDirections[baseIndex] = vector.x;
      this.formDirections[baseIndex + 1] = vector.y;
      this.formDirections[baseIndex + 2] = vector.z;
      this.formSeeds[index] = (Math.sin(index * 12.9898) * 43758.5453) % 1;
    }
  }

  private buildAtmosphere(): void {
    const veilSpecs: Omit<AtmosphereVeil, 'mesh'>[] = [
      {
        baseWidth: 15.6,
        baseHeight: 10.8,
        depth: -2.8,
        offset: 0.2,
        side: -1,
        mode: 'mist'
      },
      {
        baseWidth: 20.4,
        baseHeight: 13.6,
        depth: -5.6,
        offset: 1,
        side: 1,
        mode: 'current'
      },
      {
        baseWidth: 25.8,
        baseHeight: 16.8,
        depth: -8.9,
        offset: 1.9,
        side: -1,
        mode: 'charge'
      },
      {
        baseWidth: 33.2,
        baseHeight: 20.8,
        depth: -12.6,
        offset: 2.8,
        side: 1,
        mode: 'veil'
      }
    ];
    const columnSpecs: Omit<AtmosphereColumn, 'mesh'>[] = [
      {
        baseWidth: 1.7,
        baseHeight: 12.8,
        depth: -7.4,
        offset: 0.4,
        side: -1
      },
      {
        baseWidth: 1.2,
        baseHeight: 15.6,
        depth: -9.8,
        offset: 1.1,
        side: 1
      },
      {
        baseWidth: 1.4,
        baseHeight: 18.2,
        depth: -12.2,
        offset: 1.8,
        side: -1
      },
      {
        baseWidth: 1.1,
        baseHeight: 16.4,
        depth: -10.6,
        offset: 2.5,
        side: 1
      }
    ];

    this.atmosphereGroup.renderOrder = -1;

    for (const spec of veilSpecs) {
      const alphaMap =
        spec.mode === 'mist'
          ? this.atmosphereMistTexture
          : spec.mode === 'current'
            ? this.atmosphereCurrentTexture
            : spec.mode === 'charge'
              ? this.atmosphereChargeTexture
              : this.atmosphereVeilTexture;
      const material = new THREE.MeshBasicMaterial({
        color: COOL_BACKGROUND.clone(),
        transparent: true,
        opacity: 0,
        alphaMap,
        blending:
          spec.mode === 'charge'
            ? THREE.AdditiveBlending
            : THREE.NormalBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.baseWidth, spec.baseHeight),
        material
      );
      mesh.position.z = spec.depth;
      mesh.rotation.y = spec.side * (0.16 + spec.offset * 0.04);
      mesh.renderOrder = -2;
      this.atmosphereVeils.push({
        mesh,
        ...spec
      });
      this.atmosphereGroup.add(mesh);
    }

    for (const spec of columnSpecs) {
      const material = new THREE.MeshBasicMaterial({
        color: ELECTRIC_WHITE.clone(),
        transparent: true,
        opacity: 0,
        alphaMap: this.atmosphereCrystalTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.baseWidth, spec.baseHeight),
        material
      );
      mesh.position.set(
        spec.side * (3.6 + spec.offset * 1.4),
        0.3,
        spec.depth
      );
      mesh.rotation.y = spec.side * (0.22 + spec.offset * 0.08);
      mesh.renderOrder = -1;
      this.atmosphereColumns.push({
        mesh,
        ...spec
      });
      this.atmosphereGroup.add(mesh);
    }
  }

  private buildChamber(): void {
    for (let index = 0; index < 6; index += 1) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: HERO_GOLD.clone(),
        transparent: true,
        opacity: 0.02,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(2.8 + index * 0.76, 0.026 + index * 0.004, 18, 180),
        ringMaterial
      );
      ringMesh.rotation.set(
        0.5 + index * 0.3,
        index * 0.28,
        index * 0.18
      );
      ringMesh.position.z = -1 - index * 0.46;
      this.chamberRings.push({
        mesh: ringMesh,
        baseRotation: ringMesh.rotation.clone(),
        speed: 0.06 + index * 0.02,
        offset: index * 0.6
      });
      this.chamberGroup.add(ringMesh);
    }

    for (let index = 0; index < 4; index += 1) {
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: HERO_TEAL.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const portalMesh = new THREE.Mesh(
        new THREE.RingGeometry(2.3 + index * 0.9, 2.46 + index * 0.9, 144),
        portalMaterial
      );
      portalMesh.position.z = -3 - index * 0.56;
      this.portalRings.push({
        mesh: portalMesh,
        baseScale: 1 + index * 0.14,
        offset: index * 0.8
      });
      this.chamberGroup.add(portalMesh);
    }

    for (let index = 0; index < 4; index += 1) {
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const haloMesh = new THREE.Mesh(
        new THREE.RingGeometry(5.8 + index * 1.4, 6.08 + index * 1.4, 192),
        haloMaterial
      );
      haloMesh.position.z = -8.5 - index * 0.8;
      this.chromaHalos.push({
        mesh: haloMesh,
        baseScale: 1 + index * 0.12,
        offset: index * 0.9
      });
      this.chamberGroup.add(haloMesh);
    }

    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.LineBasicMaterial({
        color: GHOST_PALE.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const geometry = new THREE.EdgesGeometry(
        new THREE.IcosahedronGeometry(3.4 + index * 1.1, index === 0 ? 1 : 0)
      );
      const line = new THREE.LineSegments(geometry, material);
      line.rotation.set(index * 0.4, index * 0.7, index * 0.2);
      this.latticeMaterials.push(material);
      this.ghostLattice.add(line);
    }

    this.chamberGroup.add(this.ghostLattice);

    for (let index = 0; index < 10; index += 1) {
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const beamMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1 + (index % 3) * 0.04, 17 + (index % 4) * 1.6),
        beamMaterial
      );
      beamMesh.position.z = -4.8 - (index % 4) * 0.65;
      beamMesh.rotation.set(
        (index % 2 === 0 ? -1 : 1) * (0.18 + (index % 3) * 0.06),
        (index % 2 === 0 ? 1 : -1) * (0.26 + (index % 4) * 0.08),
        -0.82 + index * 0.18
      );
      this.laserBeams.push({
        mesh: beamMesh,
        baseRotation: beamMesh.rotation.clone(),
        offset: index * 0.72,
        spread: 0.36 + index * 0.08,
        depth: beamMesh.position.z,
        side: index % 2 === 0 ? -1 : 1
      });
      this.laserGroup.add(beamMesh);
    }

    this.chamberGroup.add(this.laserGroup);
  }

  private buildStageFrame(): void {
    const bladeSpecs: Array<Pick<StageBlade, 'axis' | 'side' | 'baseOffset'> & { width: number; height: number }> = [
      { axis: 'x', side: -1, baseOffset: 6.2, width: 3.2, height: 16.8 },
      { axis: 'x', side: 1, baseOffset: 6.2, width: 3.2, height: 16.8 },
      { axis: 'y', side: -1, baseOffset: 3.9, width: 18.4, height: 2.4 },
      { axis: 'y', side: 1, baseOffset: 3.9, width: 18.4, height: 2.4 }
    ];

    for (const spec of bladeSpecs) {
      const material = new THREE.MeshBasicMaterial({
        color: BASE_BACKGROUND.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.width, spec.height),
        material
      );
      mesh.renderOrder = 30;
      if (spec.axis === 'x') {
        mesh.position.x = spec.side * spec.baseOffset;
      } else {
        mesh.position.y = spec.side * spec.baseOffset;
      }
      this.stageBlades.push({
        mesh,
        axis: spec.axis,
        side: spec.side,
        baseOffset: spec.baseOffset
      });
      this.stageFrameGroup.add(mesh);
    }

    for (let index = 0; index < 2; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4 + index * 0.9, 16.8),
        material
      );
      mesh.renderOrder = 31;
      this.stageSweepPlanes.push({
        mesh,
        side: index === 0 ? -1 : 1,
        baseOffset: 8.4 + index * 0.8,
        tilt: (index === 0 ? -1 : 1) * (0.26 + index * 0.08)
      });
      this.stageFrameGroup.add(mesh);
    }
  }

  private buildHero(): void {
    this.crownMesh.rotation.x = Math.PI / 2;
    this.heroAuraMesh.renderOrder = 1;
    this.heroFresnelMesh.renderOrder = 2;
    this.heroMesh.renderOrder = 3;
    this.heroEnergyShellMesh.renderOrder = 4;
    this.heroSeamMesh.renderOrder = 5;
    this.heroEdges.renderOrder = 6;
    this.heroGlowLight.position.set(0, 0, 0.6);
    this.heroAccentLight.position.set(0, 0, -0.2);
    this.heroGroup.add(this.membraneMesh);
    this.heroGroup.add(this.heroAuraMesh);
    this.heroGroup.add(this.heroFresnelMesh);
    this.heroGroup.add(this.heroEnergyShellMesh);
    this.heroGroup.add(this.heroSeamMesh);
    this.heroGroup.add(this.heroMesh);
    this.heroGroup.add(this.ghostHeroMesh);
    this.heroGroup.add(this.coreMesh);
    this.heroGroup.add(this.voidCoreMesh);
    this.heroGroup.add(this.crownMesh);
    this.heroGroup.add(this.heroEdges);
    this.heroGroup.add(this.heroGlowLight);
    this.coreMesh.add(this.heroAccentLight);

    for (let index = 0; index < 2; index += 1) {
      const twinMaterial = this.heroMaterial.clone();
      twinMaterial.transparent = true;
      twinMaterial.opacity = 0;
      twinMaterial.emissiveIntensity = 0.08;
      const twinMesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7, 2),
        twinMaterial
      );
      twinMesh.visible = false;
      const twinLight = new THREE.PointLight('#ff3bc9', 0, 4, 2);
      twinLight.position.set(0, 0, 0);
      twinMesh.add(twinLight);
      this.twinLights.push(twinLight);
      this.twinMeshes.push(twinMesh);
      this.heroGroup.add(twinMesh);
    }
  }

  private buildSatellites(): void {
    for (let index = 0; index < 7; index += 1) {
      const material = new THREE.MeshPhysicalMaterial({
        color: GHOST_PALE.clone(),
        emissive: HERO_GOLD.clone(),
        emissiveIntensity: 0.08,
        metalness: 0.22,
        roughness: 0.16,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), material);
      this.satellites.push({
        mesh,
        orbitRadius: 1.9 + index * 0.26,
        orbitSpeed: 0.22 + index * 0.05,
        offset: index * 0.8
      });
      this.accentGroup.add(mesh);
    }
  }

  private buildShards(): void {
    for (let index = 0; index < 12; index += 1) {
      const material = new THREE.MeshPhysicalMaterial({
        color: HERO_GOLD.clone(),
        emissive: HERO_TEAL.clone(),
        emissiveIntensity: 0.04,
        metalness: 0.36,
        roughness: 0.22,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.11, 0), material);
      this.shards.push({
        mesh,
        orbitRadius: 1.45 + index * 0.16,
        orbitSpeed: 0.34 + index * 0.04,
        offset: index * 0.52,
        tilt: 0.2 + index * 0.09
      });
      this.accentGroup.add(mesh);
    }
  }

  private buildPressureWaves(): void {
    for (let index = 0; index < 7; index += 1) {
      const waveMaterial = new THREE.MeshBasicMaterial({
        color: HERO_GOLD.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const torusMaterial = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: HOT_MAGENTA.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const group = new THREE.Group();
      const waveMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 0.98, 128),
        waveMaterial
      );
      const torusMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.045, 18, 96),
        torusMaterial
      );
      const haloMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.58, 0.62, 96),
        haloMaterial
      );
      waveMesh.renderOrder = 6;
      torusMesh.renderOrder = 7;
      haloMesh.renderOrder = 5;
      haloMesh.rotation.y = Math.PI / 2;
      group.visible = false;
      group.add(waveMesh);
      group.add(torusMesh);
      group.add(haloMesh);
      this.pressureWaves.push({
        group,
        waveMesh,
        torusMesh,
        haloMesh,
        age: 0,
        active: false,
        intensity: 0,
        warmMix: 0.5,
        band: 'mid',
        colorCycle: index % PRESSURE_WAVE_COLOR_FAMILIES.mid.length,
        spin: 0,
        tiltX: 0,
        tiltY: 0,
        driftX: 0,
        driftY: 0,
        depthBias: 0,
        style: 'torsion-arc',
        expansion: 3.2,
        anchorY: -0.08,
        anchorZ: -0.72,
        haloBias: 0.72,
        glowBias: 0.62
      });
      this.accentGroup.add(group);
    }
  }

  private buildParticleField(): void {
    const particleCount = 960;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const spread = index / particleCount;
      const point: ParticlePoint = {
        radius: 4.2 + Math.pow(spread, 0.7) * 9.4,
        theta: index * 0.37,
        phi: (index * 0.63) % Math.PI,
        drift: 0.16 + (index % 11) * 0.013,
        bias: ((index % 17) - 8) / 8
      };
      this.particlePoints.push(point);
      positions[index * 3] = 0;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = 0;
      colors[index * 3] = 0.7;
      colors[index * 3 + 1] = 0.66;
      colors[index * 3 + 2] = 0.6;
    }

    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
  }

  private updateFamilyRouting(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const eventRate =
      this.tuning.eventRate * 0.44 + this.directorSpectacle * 0.38 + this.directorEnergy * 0.18;
    const actCandidates = [...FAMILIES_BY_ACT[this.activeAct]];
    const candidates = [...actCandidates];
    const profile = SHOW_STATE_PROFILES[frame.showState];
    const showStateSupport = [...FAMILY_BY_SHOW_STATE[frame.showState]];

    for (const family of showStateSupport.reverse()) {
      const existing = candidates.indexOf(family);
      if (existing >= 0) {
        candidates.splice(existing, 1);
      }
      candidates.unshift(family);
    }

    const urgency =
      this.dropImpact * 0.42 +
      this.sectionChange * 0.28 +
      this.preDropTension * 0.18 +
      (this.performanceIntent === 'detonate' ? 0.22 : 0) +
      this.actWeights['eclipse-rupture'] * 0.14;
    const shouldSwitch =
      !candidates.includes(this.toFamily) || elapsedSeconds >= this.nextFamilyAt;

    if (shouldSwitch) {
      const nextFamily = this.chooseFamily(frame, candidates);

      if (nextFamily !== this.toFamily) {
        this.fromFamily = this.activeFamily;
        this.toFamily = nextFamily;
        this.familyTransition = 0;
      }

      this.nextFamilyAt =
        elapsedSeconds +
        Math.max(
          1.8,
          profile.dwellBase +
            (1 - eventRate) * profile.dwellVariance -
            urgency * 3.2 -
            (frame.showState === 'surge' ? 1.1 : 0)
        );
    }

    this.familyTransition = Math.min(
      1,
      this.familyTransition +
        deltaSeconds *
          (profile.transitionRate +
            this.directorSpectacle * 0.24 +
            this.directorEnergy * 0.12 +
            urgency * 0.72)
    );

    const blend = easeInOut(this.familyTransition);
    if (this.familyTransition >= 1) {
      this.activeFamily = this.toFamily;
    }

    for (const family of SHOW_FAMILIES) {
      let target = 0;

      if (family === this.fromFamily) {
        target = Math.max(target, 1 - blend);
      }

      if (family === this.toFamily) {
        target = Math.max(target, blend);
      }

      const candidateIndex = candidates.indexOf(family);
      if (candidateIndex >= 0) {
        const support = Math.max(
          0,
          profile.supportStrength +
            urgency * 0.1 -
            candidateIndex * (0.045 - Math.min(0.02, urgency * 0.03))
        );
        target = Math.max(target, support);
      }

      this.familyWeights[family] = this.smoothValue(
        this.familyWeights[family],
        target,
        family === this.fromFamily || family === this.toFamily ? 4.6 : 1.8,
        deltaSeconds
      );
    }
  }

  private updateAtmosphereState(deltaSeconds: number): void {
    const cueFamily = this.stageCuePlan.family;
    const cueReveal = cueFamily === 'reveal' ? 1 : 0;
    const cueRupture = cueFamily === 'rupture' ? 1 : 0;
    const cueRelease = cueFamily === 'release' ? 1 : 0;
    const cueHaunt = cueFamily === 'haunt' ? 1 : 0;
    const cueReset = cueFamily === 'reset' ? 1 : 0;
    const fieldBloom = this.stageCuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const cathedralRise =
      this.stageCuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const ghostChamber =
      this.stageCuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const collapseWell =
      this.stageCuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const impactBuild = this.stageAudioFeatures.impact.build;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const textureRoughness = this.stageAudioFeatures.texture.roughness;
    const restraint = this.stageAudioFeatures.stability.restraint;
    const gasTarget = THREE.MathUtils.clamp(
      0.28 +
        this.directorAtmosphere * 0.22 +
        this.air * 0.14 +
        this.releaseTail * 0.12 +
        memoryAfterglow * 0.14 +
        this.familyWeights['spectral-plume'] * 0.2 +
        this.familyWeights['ghost-lattice'] * 0.08 +
        spatialPresence * 0.08 +
        ghostChamber * 0.12 +
        cueRelease * 0.08 +
        cueHaunt * 0.1 -
        this.dropImpact * 0.12 -
        cueRupture * 0.08,
      0.04,
      1.4
    );
    const liquidTarget = THREE.MathUtils.clamp(
      0.08 +
        this.familyWeights['liquid-pressure-core'] * 0.32 +
        this.roomness * 0.12 +
        this.resonance * 0.16 +
        this.subPressure * 0.12 +
        textureRoughness * 0.1 +
        this.directorWorldActivity * 0.16 +
        fieldBloom * 0.1 +
        impactBuild * 0.08 -
        cueReset * 0.08,
      0.03,
      1.25
    );
    const plasmaTarget = THREE.MathUtils.clamp(
      0.06 +
        this.directorRadiance * 0.16 +
        this.directorLaserDrive * 0.14 +
        this.directorSpectacle * 0.08 +
        this.familyWeights['storm-crown'] * 0.22 +
        this.actWeights['laser-bloom'] * 0.12 +
        this.actWeights['matrix-storm'] * 0.14 +
        impactHit * 0.18 +
        this.dropImpact * 0.18 +
        this.sectionChange * 0.14 +
        cueReveal * 0.08 +
        cueRupture * 0.14,
      0.02,
      1.35
    );
    const crystalTarget = THREE.MathUtils.clamp(
      0.04 +
        this.directorGeometry * 0.18 +
        this.familyWeights['cathedral-rings'] * 0.26 +
        this.tonalStability * 0.1 +
        this.stageAudioFeatures.tempo.lock * 0.08 +
        this.stageCompositionPlan.chamberEnvelope.worldTakeoverBias * 0.1 +
        cathedralRise * 0.18 +
        shotWorldTakeover * 0.16 +
        cueReveal * 0.18 +
        collapseWell * 0.08 -
        cueReset * 0.08 -
        restraint * 0.05,
      0.02,
      1.22
    );
    const total =
      gasTarget + liquidTarget + plasmaTarget + crystalTarget;
    const nextGas = gasTarget / total;
    const nextLiquid = liquidTarget / total;
    const nextPlasma = plasmaTarget / total;
    const nextCrystal = crystalTarget / total;

    this.atmosphereGas = this.smoothValue(
      this.atmosphereGas,
      nextGas,
      nextGas > this.atmosphereGas ? 0.96 : 0.52,
      deltaSeconds
    );
    this.atmosphereLiquid = this.smoothValue(
      this.atmosphereLiquid,
      nextLiquid,
      nextLiquid > this.atmosphereLiquid ? 1.02 : 0.56,
      deltaSeconds
    );
    this.atmospherePlasma = this.smoothValue(
      this.atmospherePlasma,
      nextPlasma,
      nextPlasma > this.atmospherePlasma ? 1.26 : 0.74,
      deltaSeconds
    );
    this.atmosphereCrystal = this.smoothValue(
      this.atmosphereCrystal,
      nextCrystal,
      nextCrystal > this.atmosphereCrystal ? 0.82 : 0.42,
      deltaSeconds
    );

    const normalizedTotal =
      this.atmosphereGas +
      this.atmosphereLiquid +
      this.atmospherePlasma +
      this.atmosphereCrystal;
    if (normalizedTotal > 0.0001) {
      this.atmosphereGas /= normalizedTotal;
      this.atmosphereLiquid /= normalizedTotal;
      this.atmospherePlasma /= normalizedTotal;
      this.atmosphereCrystal /= normalizedTotal;
    }

    const statePairs: Array<[AtmosphereMatterState, number]> = [
      ['gas', this.atmosphereGas],
      ['liquid', this.atmosphereLiquid],
      ['plasma', this.atmospherePlasma],
      ['crystal', this.atmosphereCrystal]
    ];
    const [nextState, nextStateWeight] = statePairs.reduce((best, candidate) =>
      candidate[1] > best[1] ? candidate : best
    );
    const currentStateWeight =
      statePairs.find(([state]) => state === this.activeMatterState)?.[1] ?? 0;
    if (
      nextState === this.activeMatterState ||
      nextStateWeight >= currentStateWeight + 0.04
    ) {
      this.activeMatterState = nextState;
    }

    const nextPressure = THREE.MathUtils.clamp(
      0.06 +
        this.subPressure * 0.22 +
        this.preDropTension * 0.2 +
        impactBuild * 0.16 +
        this.phraseTension * 0.08 +
        this.directorWorldActivity * 0.12 +
        this.atmosphereLiquid * 0.12 +
        this.atmosphereCrystal * 0.06 -
        cueRelease * 0.06 -
        cueReset * 0.08,
      0,
      1.1
    );
    const nextIonization = THREE.MathUtils.clamp(
      0.04 +
        this.atmospherePlasma * 0.28 +
        this.directorLaserDrive * 0.14 +
        this.directorColorWarp * 0.14 +
        this.beatStrike * 0.08 +
        impactHit * 0.18 +
        cueReveal * 0.08 +
        cueRupture * 0.14,
      0,
      1.2
    );
    const nextResidue = THREE.MathUtils.clamp(
      0.06 +
        this.atmosphereGas * 0.08 +
        this.releaseTail * 0.18 +
        memoryAfterglow * 0.24 +
        this.resonance * 0.12 +
        cueRelease * 0.08 +
        cueHaunt * 0.1,
      0,
      1.2
    );
    const nextStructureReveal = THREE.MathUtils.clamp(
      0.02 +
        this.atmosphereCrystal * 0.26 +
        cathedralRise * 0.18 +
        shotWorldTakeover * 0.16 +
        cueReveal * 0.18 +
        this.sectionChange * 0.1 +
        this.stageAudioFeatures.impact.section * 0.08,
      0,
      1.2
    );

    this.atmospherePressure = this.smoothValue(
      this.atmospherePressure,
      nextPressure,
      nextPressure > this.atmospherePressure ? 1.12 : 0.54,
      deltaSeconds
    );
    this.atmosphereIonization = this.smoothValue(
      this.atmosphereIonization,
      nextIonization,
      nextIonization > this.atmosphereIonization ? 1.42 : 0.8,
      deltaSeconds
    );
    this.atmosphereResidue = this.smoothValue(
      this.atmosphereResidue,
      nextResidue,
      nextResidue > this.atmosphereResidue ? 0.94 : 0.34,
      deltaSeconds
    );
    this.atmosphereStructureReveal = this.smoothValue(
      this.atmosphereStructureReveal,
      nextStructureReveal,
      nextStructureReveal > this.atmosphereStructureReveal ? 0.72 : 0.28,
      deltaSeconds
    );
  }

  private chooseFamily(
    frame: ListeningFrame,
    candidates: ShowFamily[]
  ): ShowFamily {
    if (candidates.length === 0) {
      return this.toFamily;
    }

    let bestFamily = candidates[0];
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const family of candidates) {
      const score = this.scoreFamilyAffinity(family, frame);

      if (score > bestScore) {
        bestScore = score;
        bestFamily = family;
      }
    }

    return bestFamily;
  }

  private scoreFamilyAffinity(
    family: ShowFamily,
    frame: ListeningFrame
  ): number {
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const stableMusic =
      frame.musicConfidence * 0.42 +
      frame.tonalStability * 0.24 +
      frame.body * 0.18 +
      frame.preDropTension * 0.16;
    const violentEnergy =
      frame.dropImpact * 0.44 +
      frame.accent * 0.22 +
      frame.sectionChange * 0.2 +
      frame.transientConfidence * 0.14;
    const spectralGhost =
      frame.releaseTail * 0.34 +
      frame.resonance * 0.24 +
      frame.shimmer * 0.18 +
      coolBias * 0.12;
    const livingStageBias = THREE.MathUtils.clamp(
      frame.musicConfidence * 0.26 +
        frame.body * 0.16 +
        frame.tonalStability * 0.14 +
        frame.harmonicColor * 0.12 +
        frame.shimmer * 0.08 -
        frame.releaseTail * 0.12 -
        frame.speechConfidence * 0.14,
      0,
      1
    );
    const authoredStageBias = THREE.MathUtils.clamp(
      livingStageBias +
        this.tuning.neonStageFloor * 0.26 +
        this.tuning.worldBootFloor * 0.22 +
        this.tuning.readableHeroFloor * 0.16 -
        frame.releaseTail * 0.08,
      0,
      1
    );
    const matrixOpenFamilyBias =
      this.activeAct === 'matrix-storm' &&
      (this.cueState.cueClass === 'reveal' || this.cueState.cueClass === 'gather')
        ? THREE.MathUtils.clamp(
            frame.beatConfidence * 0.18 +
              frame.shimmer * 0.12 +
              this.tuning.neonStageFloor * 0.16 +
              this.tuning.worldBootFloor * 0.1 -
              frame.sectionChange * 0.04,
            0,
            1
          )
        : 0;

    const baseScores: Record<ShowFamily, number> = {
      'liquid-pressure-core':
        frame.body * 0.38 +
        frame.bassBody * 0.26 +
        stableMusic * 0.22 +
        frame.subPressure * 0.16 +
        warmBias * 0.04,
      'portal-iris':
        frame.preDropTension * 0.24 +
        frame.musicConfidence * 0.14 +
        frame.sectionChange * 0.14 +
        frame.dropImpact * 0.12 +
        coolBias * 0.06,
      'cathedral-rings':
        frame.tonalStability * 0.28 +
        frame.sectionChange * 0.24 +
        frame.phraseTension * 0.18 +
        frame.body * 0.12 +
        stableMusic * 0.12,
      'ghost-lattice':
        frame.releaseTail * 0.22 +
        frame.speechConfidence * 0.16 +
        frame.shimmer * 0.14 +
        spectralGhost * 0.28,
      'storm-crown':
        violentEnergy * 0.42 +
        frame.dropImpact * 0.22 +
        frame.beatConfidence * 0.12 +
        frame.accent * 0.18,
      'eclipse-chamber':
        (1 - frame.musicConfidence) * 0.18 +
        frame.releaseTail * 0.18 +
        frame.resonance * 0.14 +
        spectralGhost * 0.18 +
        (1 - frame.brightness) * 0.08,
      'spectral-plume':
        frame.air * 0.28 +
        frame.shimmer * 0.26 +
        frame.resonance * 0.2 +
        spectralGhost * 0.2 +
        coolBias * 0.12
    };

    let score = baseScores[family];

    const actBias: Record<ShowAct, Partial<Record<ShowFamily, number>>> = {
      'void-chamber': {
        'eclipse-chamber': 0.22,
        'ghost-lattice': 0.14,
        'spectral-plume': 0.12
      },
      'laser-bloom': {
        'portal-iris': 0.24,
        'liquid-pressure-core': 0.12,
        'cathedral-rings': 0.1
      },
      'matrix-storm': {
        'storm-crown': 0.08,
        'portal-iris': 0.04,
        'cathedral-rings': 0.06,
        'spectral-plume': 0.28,
        'liquid-pressure-core': 0.14
      },
      'eclipse-rupture': {
        'eclipse-chamber': 0.18,
        'portal-iris': 0.14,
        'storm-crown': 0.14,
        'cathedral-rings': 0.08
      },
      'ghost-afterimage': {
        'ghost-lattice': 0.28,
        'spectral-plume': 0.12,
        'eclipse-chamber': 0.12
      }
    };

    for (const act of SHOW_ACTS) {
      score += (actBias[act][family] ?? 0) * this.actWeights[act];
    }

    if (family === 'portal-iris') {
      score += authoredStageBias * 0.16 + matrixOpenFamilyBias * 0.08;
    } else if (family === 'liquid-pressure-core') {
      score += authoredStageBias * 0.22 + matrixOpenFamilyBias * 0.18;
    } else if (family === 'cathedral-rings') {
      score += authoredStageBias * (matrixOpenFamilyBias > 0 ? 0.04 : 0.18);
      score -= matrixOpenFamilyBias * 0.1;
    } else if (family === 'storm-crown') {
      score +=
        authoredStageBias *
        frame.beatConfidence *
        (matrixOpenFamilyBias > 0 ? 0.06 : 0.1);
      score -= matrixOpenFamilyBias * 0.16;
    } else if (family === 'eclipse-chamber') {
      score -= authoredStageBias * 0.24;
    } else if (family === 'ghost-lattice') {
      score -= authoredStageBias * 0.2;
    } else if (family === 'spectral-plume') {
      score -= authoredStageBias * 0.04;
      score += matrixOpenFamilyBias * 0.28;
    }

    if (family === this.toFamily) {
      score += 0.06;
    }

    if (family === this.activeFamily) {
      score += 0.04;
    }

    if (this.performanceIntent === 'detonate') {
      if (family === 'storm-crown' || family === 'portal-iris') {
        score += 0.08;
      }
    } else if (this.performanceIntent === 'ignite') {
      if (family === 'liquid-pressure-core' || family === 'spectral-plume') {
        score += 0.1;
      } else if (family === 'portal-iris' || family === 'cathedral-rings') {
        score += 0.06;
      }
    } else if (this.performanceIntent === 'haunt') {
      if (family === 'ghost-lattice' || family === 'spectral-plume' || family === 'eclipse-chamber') {
        score += 0.1;
      }
    }

    return score;
  }

  private updateEventRouting(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const cueRupture = this.cueState.cueClass === 'rupture' ? 1 : 0;
    const cueReveal = this.cueState.cueClass === 'reveal' ? 1 : 0;
    const cueResidue =
      this.cueState.cueClass === 'haunt' || this.cueState.cueClass === 'afterglow'
        ? 1
        : 0;
    const eventRate =
      this.tuning.eventRate * 0.42 +
      this.directorSpectacle * 0.4 +
      this.directorEnergy * 0.18 +
      this.cueState.eventDensity * 0.18;
    this.liftPulse = Math.max(0, this.liftPulse - deltaSeconds * 0.18);
    this.strikePulse = Math.max(0, this.strikePulse - deltaSeconds * 1.2);
    this.releasePulse = Math.max(0, this.releasePulse - deltaSeconds * 0.12);

    for (let index = this.activeEvents.length - 1; index >= 0; index -= 1) {
      const event = this.activeEvents[index];
      event.age += deltaSeconds;
      if (event.age >= event.duration) {
        this.activeEvents.splice(index, 1);
      }
    }

    if (frame.momentKind === 'strike' && frame.momentAmount > 0.12) {
      this.triggerPressureWave(
        frame,
        elapsedSeconds,
        0.64 +
          frame.momentAmount *
            (1 +
              this.directorSpectacle * 0.3 +
              this.dropImpact * 0.22 +
              this.cueState.screenWeight * 0.24),
        frame.harmonicColor,
        'moment'
      );
    }

    if (this.dropImpact > 0.18 && this.beatJustHit) {
      this.triggerPressureWave(
        frame,
        elapsedSeconds,
        1.08 +
          this.dropImpact *
            (1.35 +
              this.directorSpectacle * 0.42 +
              eventRate * 0.18 +
              this.cueState.screenWeight * 0.24),
        frame.harmonicColor,
        'drop'
      );
    }

    if (elapsedSeconds < this.nextEventAt) {
      return;
    }

    if (
      frame.performanceIntent === 'detonate' &&
      frame.dropImpact > 0.24 - this.cueState.screenWeight * 0.08 &&
      (this.beatJustHit ||
        frame.sectionChange > 0.34 ||
        frame.peakConfidence > 0.58 - cueRupture * 0.04)
    ) {
      const primaryEvent = this.chooseSurgeEvent(frame);
      this.triggerMacroEvent(primaryEvent, frame, elapsedSeconds);
      this.triggerMacroEvent(
        primaryEvent === 'singularity-collapse' ? 'world-stain' : 'halo-ignition',
        frame,
        elapsedSeconds,
        0.94
      );

      if (frame.sectionChange > 0.24 || frame.preDropTension > 0.42) {
        this.triggerMacroEvent('cathedral-rise', frame, elapsedSeconds, 0.86);
      }

      return;
    }

    if (
      frame.showState === 'surge' &&
      frame.peakConfidence >
        0.48 - eventRate * 0.08 - this.cueState.intensity * 0.04 &&
      (frame.momentKind === 'lift' ||
        (frame.peakConfidence > 0.64 && frame.phraseTension > 0.5))
    ) {
      this.triggerMacroEvent(this.chooseSurgeEvent(frame), frame, elapsedSeconds);

      return;
    }

    if (
      frame.showState === 'aftermath' &&
      (frame.momentKind === 'release' ||
        frame.releaseTail > 0.24 - this.cueState.residueWeight * 0.06) &&
      frame.resonance > 0.24 - cueResidue * 0.04 &&
      frame.musicConfidence > 0.14
    ) {
      this.triggerMacroEvent(this.chooseAftermathEvent(frame), frame, elapsedSeconds);

      return;
    }

    if (
      frame.showState === 'generative' &&
      frame.musicConfidence > 0.34 - cueReveal * 0.04 &&
      (frame.phraseTension > 0.32 - this.cueState.intensity * 0.04 ||
        frame.preDropTension > 0.26) &&
      frame.momentum > 0.3 &&
      (this.beatJustHit || this.barPhase < 0.08 || this.barPhase > 0.92)
    ) {
      this.triggerMacroEvent(this.chooseGenerativeEvent(frame), frame, elapsedSeconds);
    }
  }

  private chooseSurgeEvent(frame: ListeningFrame): MacroEventKind {
    const signature = this.buildEventSignature('surge', frame);
    const hashed = hashSignature(signature) % 5;

    if (frame.dropImpact > 0.68 && frame.subPressure > 0.48) {
      return 'singularity-collapse';
    }

    if (frame.sectionChange > 0.44 && frame.tonalStability > 0.4) {
      return 'cathedral-rise';
    }

    if (frame.accent > 0.54 && frame.transientConfidence > 0.46) {
      return hashed % 2 === 0 ? 'twin-split' : 'halo-ignition';
    }

    if (frame.preDropTension > 0.48 || frame.momentum > 0.52) {
      return hashed % 2 === 0 ? 'portal-open' : 'cathedral-rise';
    }

    return ['portal-open', 'halo-ignition', 'twin-split', 'cathedral-rise', 'singularity-collapse'][hashed] as MacroEventKind;
  }

  private chooseGenerativeEvent(frame: ListeningFrame): MacroEventKind {
    if (frame.sectionChange > 0.4 && frame.momentum > 0.44) {
      return frame.harmonicColor > 0.52 ? 'twin-split' : 'pressure-wave';
    }

    if (frame.releaseTail > 0.3 && frame.resonance > 0.28) {
      return frame.harmonicColor > 0.52 ? 'world-stain' : 'ghost-afterimage';
    }

    if (frame.tonalStability > 0.58 && frame.body > 0.44) {
      return frame.harmonicColor > 0.54 ? 'twin-split' : 'cathedral-rise';
    }

    if (frame.preDropTension > 0.5 || frame.momentum > 0.56) {
      return frame.beatConfidence > 0.56 ? 'pressure-wave' : 'portal-open';
    }

    if (frame.brightness > 0.52 || frame.shimmer > 0.48) {
      return frame.harmonicColor > 0.56 ? 'halo-ignition' : 'twin-split';
    }

    const signature = this.buildEventSignature('generative', frame);
    const hashed = hashSignature(signature) % 6;
    return [
      'portal-open',
      'cathedral-rise',
      'halo-ignition',
      'twin-split',
      'pressure-wave',
      'world-stain'
    ][hashed] as MacroEventKind;
  }

  private chooseAftermathEvent(frame: ListeningFrame): MacroEventKind {
    if (frame.releaseTail > 0.52 && frame.resonance > 0.44) {
      return frame.sectionChange > 0.26 ? 'world-stain' : 'ghost-afterimage';
    }

    if (frame.harmonicColor > 0.56 || frame.sectionChange > 0.34) {
      return 'world-stain';
    }

    if (frame.momentum > 0.36 && frame.beatConfidence > 0.34) {
      return 'pressure-wave';
    }

    const signature = this.buildEventSignature('aftermath', frame);
    return ['ghost-afterimage', 'world-stain', 'pressure-wave', 'twin-split'][
      hashSignature(signature) % 4
    ] as MacroEventKind;
  }

  private buildEventSignature(
    stage: 'surge' | 'generative' | 'aftermath',
    frame: ListeningFrame
  ): string {
    const bins = [
      stage,
      this.performanceIntent,
      frame.showState,
      Math.round(frame.dropImpact * 4),
      Math.round(frame.sectionChange * 4),
      Math.round(frame.preDropTension * 4),
      Math.round(frame.accent * 4),
      Math.round(frame.body * 4),
      Math.round(frame.tonalStability * 4),
      Math.round(frame.harmonicColor * 4)
    ];

    return bins.join('|');
  }

  private triggerMacroEvent(
    kind: MacroEventKind,
    frame: ListeningFrame,
    elapsedSeconds: number,
    intensityScale = 1
  ): void {
    const durationByKind: Record<MacroEventKind, number> = {
      'pressure-wave': 1.1,
      'portal-open': 4.8,
      'singularity-collapse': 2.8,
      'halo-ignition': 2.4,
      'ghost-afterimage': 5.6,
      'twin-split': 4.2,
      'world-stain': 6.4,
      'cathedral-rise': 5.2
    };
    const intensity = THREE.MathUtils.clamp(
      0.62 +
        frame.peakConfidence * 0.18 +
        frame.momentAmount * 0.14 +
        frame.dropImpact * 0.24 +
        frame.sectionChange * 0.18 +
        this.directorSpectacle * 0.18 +
        this.tuning.eventRate * 0.12 +
        (this.performanceIntent === 'detonate' ? 0.08 : 0),
      0.42,
      1
    ) * intensityScale;

    const existing = this.activeEvents.find((event) => event.kind === kind);
    if (existing) {
      existing.age = 0;
      existing.duration = Math.max(existing.duration, durationByKind[kind]);
      existing.intensity = Math.max(existing.intensity, intensity);
    } else {
      this.activeEvents.push({
        kind,
        age: 0,
        duration: durationByKind[kind],
        intensity
      });
    }

    if (this.activeEvents.length > 4) {
      this.activeEvents.sort((left, right) => right.intensity - left.intensity);
      this.activeEvents.length = 4;
    }

    if (kind === 'pressure-wave' || kind === 'halo-ignition') {
      this.triggerPressureWave(
        frame,
        elapsedSeconds,
        0.8 * intensity,
        frame.harmonicColor,
        'macro'
      );
    }

    if (kind === 'portal-open') {
      this.liftPulse = Math.max(this.liftPulse, intensity * 1.1);
    }

    if (kind === 'singularity-collapse') {
      this.releasePulse = Math.max(this.releasePulse, intensity * 0.85);
    }

    if (kind === 'world-stain' || kind === 'ghost-afterimage') {
      this.releasePulse = Math.max(this.releasePulse, intensity * 0.5);
    }

    this.nextEventAt =
      elapsedSeconds +
      Math.max(
        1.3,
        5.4 +
          (1 - this.tuning.eventRate) * 6.6 +
          (kind === 'ghost-afterimage' ? 1.2 : 0) +
          (kind === 'world-stain' ? 1.6 : 0) -
          frame.dropImpact * 3.2 -
          frame.sectionChange * 1.6 -
          (this.performanceIntent === 'detonate' ? 0.6 : 0)
      );
  }

  private eventAmount(kind: MacroEventKind): number {
    let total = 0;

    for (const event of this.activeEvents) {
      if (event.kind !== kind) {
        continue;
      }

      total += pulseShape(event.age / event.duration) * event.intensity;
    }

    return THREE.MathUtils.clamp(total, 0, 1.35);
  }

  private updateDirector(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const smooth = (current: number, target: number, rate: number) =>
      this.smoothValue(current, target, rate, deltaSeconds);
    const detonate = frame.performanceIntent === 'detonate' ? 1 : 0;
    const ignite = frame.performanceIntent === 'ignite' ? 1 : 0;
    const gather = frame.performanceIntent === 'gather' ? 1 : 0;
    const haunt = frame.performanceIntent === 'haunt' ? 1 : 0;
    const surge = frame.showState === 'surge' ? 1 : 0;
    const generative = frame.showState === 'generative' ? 1 : 0;
    const aftermath = frame.showState === 'aftermath' ? 1 : 0;
    const sourceBoost =
      frame.mode === 'system-audio' ? 0.12 : frame.mode === 'hybrid' ? 0.18 : 0;
    const beatPulse = onsetPulse(frame.beatPhase);
    const barPulse = phasePulse(
      frame.barPhase,
      elapsedSeconds * (0.56 + frame.beatConfidence * 0.18 + sourceBoost * 0.8)
    );
    const phrasePulse = phasePulse(
      frame.phrasePhase,
      elapsedSeconds * (0.18 + frame.musicConfidence * 0.08 + sourceBoost * 0.24)
    );
    const slowOrbit =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds *
            (0.06 + frame.musicConfidence * 0.04 + frame.resonance * 0.03 + sourceBoost * 0.06) +
            frame.harmonicColor * Math.PI * 2
        );
    const laserOrbit =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds *
            (0.16 + frame.beatConfidence * 0.18 + frame.preDropTension * 0.08 + sourceBoost * 0.12) +
            frame.barPhase * Math.PI * 2
        );
    const quietRoomMusicStructure =
      frame.mode === 'room-mic' &&
      frame.musicConfidence > 0.12 &&
      frame.speechConfidence < 0.34 &&
      frame.releaseTail < 0.28
        ? THREE.MathUtils.clamp(
            frame.musicConfidence * 0.86 +
              frame.body * 0.22 +
              frame.tonalStability * 0.18 +
              frame.harmonicColor * 0.22 +
              frame.shimmer * 0.18 +
              frame.momentum * 0.14,
            0,
            0.72
          )
        : 0;
    const adaptiveMusicStructure = THREE.MathUtils.clamp(
      frame.musicConfidence * 0.34 +
        frame.body * 0.18 +
        frame.tonalStability * 0.14 +
        frame.harmonicColor * 0.14 +
        frame.shimmer * 0.12 +
        frame.momentum * 0.1 -
        frame.releaseTail * 0.1 -
        frame.speechConfidence * 0.18,
      0,
      1
    );
    const livingStageFloor =
      Math.max(quietRoomMusicStructure, adaptiveMusicStructure) *
      (0.62 +
        this.tuning.neonStageFloor * 0.26 +
        this.tuning.worldBootFloor * 0.22 +
        this.tuning.readableHeroFloor * 0.18);

    const targetEnergy = THREE.MathUtils.clamp(
      this.tuning.energy * 0.76 +
        detonate * 0.18 +
        ignite * 0.08 +
        surge * 0.08 +
        frame.dropImpact * 0.14 +
        frame.preDropTension * 0.08 +
        livingStageFloor * 0.08 +
        sourceBoost,
      0,
      1
    );
    const targetWorldActivity = THREE.MathUtils.clamp(
      this.tuning.worldActivity * 0.78 +
        generative * 0.08 +
        surge * 0.12 +
        aftermath * 0.1 +
        frame.sectionChange * 0.12 +
        frame.resonance * 0.08 +
        slowOrbit * 0.08 +
        frame.body * 0.06 +
        livingStageFloor * (0.12 + this.tuning.worldBootFloor * 0.16) +
        sourceBoost * 0.6,
      0,
      1
    );
    const targetSpectacle = THREE.MathUtils.clamp(
      this.tuning.spectacle * 0.8 +
        detonate * 0.22 +
        surge * 0.12 +
        frame.sectionChange * 0.14 +
        frame.phraseTension * 0.1 +
        frame.harmonicColor * 0.08 +
        livingStageFloor * (0.16 + this.tuning.neonStageFloor * 0.18) +
        sourceBoost * 0.8 +
        beatPulse * 0.04,
      0,
      1
    );
    const targetRadiance = THREE.MathUtils.clamp(
      this.tuning.radiance * 0.64 +
        detonate * 0.08 +
        frame.musicConfidence * 0.08 +
        frame.body * 0.06 +
        frame.shimmer * 0.06 +
        frame.harmonicColor * 0.08 +
        frame.air * 0.04 +
        frame.sectionChange * 0.04 +
        laserOrbit * 0.02 +
        livingStageFloor * (0.18 + this.tuning.neonStageFloor * 0.22) +
        sourceBoost * 0.16,
      0,
      1
    );
    const targetGeometry = THREE.MathUtils.clamp(
      this.tuning.geometry * 0.78 +
        surge * 0.1 +
        detonate * 0.08 +
        frame.tonalStability * 0.06 +
        barPulse * 0.04 -
        haunt * 0.06,
      0,
      1
    );
    const targetAtmosphere = THREE.MathUtils.clamp(
      this.tuning.atmosphere * 0.74 +
        aftermath * 0.14 +
        generative * 0.08 +
        frame.releaseTail * 0.14 +
        frame.resonance * 0.1 +
        slowOrbit * 0.06 +
        livingStageFloor * (0.08 + this.tuning.worldBootFloor * 0.12),
      0,
      1
    );
    const targetFraming = THREE.MathUtils.clamp(
      this.tuning.framing +
        frame.musicConfidence * 0.08 +
        frame.momentum * 0.06 +
        haunt * 0.06 +
        frame.releaseTail * 0.04 -
        detonate * 0.08 -
        frame.dropImpact * 0.06 +
        (slowOrbit - 0.5) * 0.08 +
        livingStageFloor * 0.06,
      0,
      1
    );
    const targetColorBias = THREE.MathUtils.clamp(
      this.tuning.colorBias +
        (frame.harmonicColor - 0.5) * 0.28 +
        (phrasePulse - 0.5) * (0.16 + frame.musicConfidence * 0.08) +
        detonate * 0.08 -
        haunt * 0.06 +
        sourceBoost * 0.06,
      0,
      1
    );
    const targetColorWarp = THREE.MathUtils.clamp(
      this.tuning.radiance * 0.22 +
        this.tuning.spectacle * 0.08 +
        frame.shimmer * 0.12 +
        frame.dropImpact * 0.16 +
        frame.sectionChange * 0.12 +
        barPulse * 0.06 +
        phrasePulse * 0.04 +
        sourceBoost * 0.08,
      0,
      1
    );
    const targetLaserDrive = THREE.MathUtils.clamp(
      this.tuning.beatDrive * 0.56 +
        frame.beatConfidence * 0.22 +
        frame.preDropTension * 0.12 +
        beatPulse * 0.12 +
        detonate * 0.1 +
        sourceBoost * 0.18,
      0,
      1
    );

    this.directorEnergy = smooth(
      this.directorEnergy,
      targetEnergy,
      targetEnergy > this.directorEnergy ? 1.4 : 0.72
    );
    this.directorWorldActivity = smooth(
      this.directorWorldActivity,
      targetWorldActivity,
      targetWorldActivity > this.directorWorldActivity ? 1.1 : 0.58
    );
    this.directorSpectacle = smooth(
      this.directorSpectacle,
      targetSpectacle,
      targetSpectacle > this.directorSpectacle ? 1.4 : 0.7
    );
    this.directorRadiance = smooth(
      this.directorRadiance,
      targetRadiance,
      targetRadiance > this.directorRadiance ? 1.15 : 1.08
    );
    this.directorGeometry = smooth(this.directorGeometry, targetGeometry, 0.92);
    this.directorAtmosphere = smooth(
      this.directorAtmosphere,
      targetAtmosphere,
      targetAtmosphere > this.directorAtmosphere ? 0.9 : 0.46
    );
    this.directorFraming = smooth(this.directorFraming, targetFraming, 0.86);
    this.directorColorBias = smooth(this.directorColorBias, targetColorBias, 0.98);
    this.directorColorWarp = smooth(
      this.directorColorWarp,
      targetColorWarp,
      targetColorWarp > this.directorColorWarp ? 1.2 : 1
    );
    this.directorLaserDrive = smooth(
      this.directorLaserDrive,
      targetLaserDrive,
      targetLaserDrive > this.directorLaserDrive ? 1.8 : 0.94
    );
  }

  private updateTemporalWindows(
    frame: ListeningFrame,
    deltaSeconds: number
  ): void {
    const windows = deriveTemporalWindows(frame);
    const smooth = (current: number, target: number, rise: number, fall: number) =>
      this.smoothValue(current, target, target > current ? rise : fall, deltaSeconds);

    this.preBeatLift = smooth(this.preBeatLift, windows.preBeatLift, 4.2, 2.1);
    this.beatStrike = smooth(this.beatStrike, windows.beatStrike, 9.8, 6.2);
    this.postBeatRelease = smooth(
      this.postBeatRelease,
      windows.postBeatRelease,
      5.2,
      2.6
    );
    this.interBeatFloat = smooth(
      this.interBeatFloat,
      windows.interBeatFloat,
      1.6,
      1.1
    );
    this.barTurn = smooth(this.barTurn, windows.barTurn, 2.1, 1.2);
    this.phraseResolve = smooth(
      this.phraseResolve,
      windows.phraseResolve,
      1.7,
      0.96
    );
  }

  private updateActRouting(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const scores = buildShowActScores(frame, this.tuning);
    const rankedActs = Object.entries(scores).sort((left, right) => right[1] - left[1]);
    const bestActScore = rankedActs[0]?.[1] ?? 0;
    const runnerUpActScore = rankedActs[1]?.[1] ?? 0;
    const currentActScore = scores[this.activeAct] ?? 0;
    const currentActLead = Math.max(
      0,
      currentActScore -
        Math.max(
          ...SHOW_ACTS.filter((act) => act !== this.activeAct).map((act) => scores[act] ?? 0),
          0
        )
    );
    const antiMonopolyVarietyPressure = THREE.MathUtils.clamp(
      (this.activeAct === 'matrix-storm'
        ? 0.18
        : this.activeAct === 'laser-bloom'
          ? 0.12
          : 0) +
        (frame.mode === 'system-audio' ? 0.08 : 0) +
        (frame.showState === 'generative'
          ? 0.12
          : frame.showState === 'aftermath'
            ? 0.16
            : frame.showState === 'atmosphere'
              ? 0.12
              : 0) +
        frame.releaseTail * 0.14 +
        frame.sectionChange * 0.12 +
        frame.momentum * 0.06 -
        currentActLead * 2.8 -
        Math.max(0, bestActScore - runnerUpActScore) * 1.8,
      0,
      0.42
    );
    const nextAct = chooseShowAct({
      currentAct: this.activeAct,
      secondsSinceLastChange: elapsedSeconds - this.lastActChangeSeconds,
      scores,
      minimumHoldSeconds:
        Math.max(
          2.2,
          (frame.showState === 'surge'
            ? 3.2
            : frame.showState === 'aftermath'
              ? 5.2
              : frame.showState === 'atmosphere'
                ? 5.4
                : frame.showState === 'generative'
                  ? 4.8
                  : 5.6) -
            antiMonopolyVarietyPressure * 2.2
        ),
      switchThreshold: THREE.MathUtils.clamp(
        (frame.showState === 'surge' ? 0.08 : 0.09) -
          antiMonopolyVarietyPressure * 0.05,
        0.02,
        0.1
      )
    });
    const shouldSwitch = nextAct !== this.toAct || elapsedSeconds >= this.nextActAt;

    if (shouldSwitch) {
      if (nextAct !== this.toAct) {
        this.fromAct = this.activeAct;
        this.toAct = nextAct;
        this.actTransition = 0;
        this.lastActChangeSeconds = elapsedSeconds;
      }

      this.nextActAt =
        elapsedSeconds +
        Math.max(
          (frame.showState === 'surge'
            ? 2.8
            : frame.showState === 'aftermath'
              ? 4.8
              : frame.showState === 'generative'
                ? 4.4
                : 5.2) -
            antiMonopolyVarietyPressure * 1.8,
          4.4 +
            (1 - this.directorSpectacle) * 1.8 +
            (frame.showState === 'surge' ? -1.2 : 0) +
            (frame.showState === 'aftermath' ? 1.1 : 0) -
            antiMonopolyVarietyPressure * 1.6
        );
    }

    this.actTransition = Math.min(
      1,
      this.actTransition +
        deltaSeconds *
          (frame.showState === 'surge'
            ? 0.9 + this.sectionChange * 0.7 + this.dropImpact * 0.5
            : 0.42 + this.phraseResolve * 0.28 + this.barTurn * 0.18)
    );

    const blend = easeInOut(this.actTransition);
    if (this.actTransition >= 1) {
      this.activeAct = this.toAct;
    }

    for (const act of SHOW_ACTS) {
      let target = 0;

      if (act === this.fromAct) {
        target = Math.max(target, 1 - blend);
      }

      if (act === this.toAct) {
        target = Math.max(target, blend);
      }

      if (act === nextAct) {
        target = Math.max(target, 0.12 + this.sectionChange * 0.08);
      }

      this.actWeights[act] = this.smoothValue(
        this.actWeights[act],
        target,
        act === this.fromAct || act === this.toAct ? 3.8 : 1.4,
        deltaSeconds
      );
    }
  }

  private updatePaletteState(
    frame: ListeningFrame,
    elapsedSeconds: number,
    cuePlan: StageCuePlan
  ): void {
    const paletteTargetPeak = Math.max(...Object.values(cuePlan.paletteTargets));
    const paletteSpread = 1 - paletteTargetPeak;
    const paletteVarietyPressure = THREE.MathUtils.clamp(
      paletteSpread * 1.32 +
        cuePlan.heroMorphBias * 0.32 +
        cuePlan.heroMotionBias * 0.18 +
        frame.sectionChange * 0.48 +
        frame.dropImpact * 0.34 +
        frame.releaseTail * 0.2 +
        (frame.performanceIntent === 'detonate'
          ? 0.22
          : frame.performanceIntent === 'ignite'
            ? 0.16
            : frame.performanceIntent === 'gather'
              ? 0.08
              : 0),
      0,
      1.4
    );
    const matrixStructuralWindow =
      this.activeAct === 'matrix-storm' &&
      (cuePlan.family === 'brood' ||
        cuePlan.family === 'release' ||
        cuePlan.family === 'haunt' ||
        cuePlan.worldMode === 'ghost-chamber' ||
        cuePlan.worldMode === 'field-bloom');
    const paletteEscapePressure = THREE.MathUtils.clamp(
      paletteVarietyPressure +
        (this.paletteState === 'acid-lime'
          ? 0.22
          : this.paletteState === 'tron-blue'
            ? 0.14
            : 0) +
        (matrixStructuralWindow &&
        (this.paletteState === 'acid-lime' || this.paletteState === 'tron-blue')
          ? this.paletteState === 'acid-lime'
            ? 0.26
            : 0.18
          : 0) +
        (frame.mode === 'system-audio' ? 0.08 : 0) +
        frame.releaseTail * 0.14 +
        frame.sectionChange * 0.08,
      0,
      1.6
    );
    const scores = buildPaletteStateScores(frame, this.activeAct, cuePlan, this.tuning);
    const nextPaletteState = choosePaletteState({
      currentState: this.paletteState,
      secondsSinceLastChange: elapsedSeconds - this.lastPaletteChangeSeconds,
      scores,
      minimumHoldSeconds: Math.max(
        1.1,
        cuePlan.paletteHoldSeconds +
          (frame.showState === 'surge'
            ? -1.2
            : frame.showState === 'aftermath'
              ? 0.6
              : frame.showState === 'generative'
              ? 0.2
              : 0) -
          paletteEscapePressure * 1.6
      ),
      switchThreshold: THREE.MathUtils.clamp(
        0.08 -
          frame.sectionChange * 0.09 -
          frame.dropImpact * 0.1 -
          frame.releaseTail * 0.05 +
          cuePlan.paletteHoldSeconds * 0.004 -
          paletteEscapePressure * 0.04,
        0.015,
        0.09
      )
    });

    if (nextPaletteState !== this.paletteState) {
      this.paletteState = nextPaletteState;
      this.lastPaletteChangeSeconds = elapsedSeconds;
    }
  }

  private resolveHeroColorToneBand(frame: ListeningFrame): HeroColorToneBand {
    const subScore =
      frame.subPressure * 1.24 +
      frame.bassBody * 1.04 +
      frame.body * 0.26 +
      frame.dropImpact * 0.22;
    const midScore =
      frame.lowMidBody * 0.92 +
      frame.presence * 0.34 +
      frame.resonance * 0.56 +
      frame.accent * 0.26;
    const airScore =
      frame.air * 1.02 +
      frame.shimmer * 1.16 +
      frame.brightness * 0.74 +
      frame.accent * 0.18;

    if (subScore >= midScore && subScore >= airScore) {
      return 'sub';
    }

    if (airScore > subScore && airScore > midScore) {
      return 'air';
    }

    return 'mid';
  }

  private resolveHeroColorWarmth(frame: ListeningFrame): HeroColorWarmth {
    if (frame.harmonicColor >= 0.62) {
      return 'warm';
    }

    if (frame.harmonicColor <= 0.38) {
      return 'cool';
    }

    return 'neutral';
  }

  private selectHeroPaletteCycle(
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

  private updateHeroColorHandoff(
    frame: ListeningFrame,
    elapsedSeconds: number,
    cuePlan: StageCuePlan
  ): void {
    const rankedPaletteTargets = (
      Object.entries(cuePlan.paletteTargets) as Array<[PaletteState, number]>
    ).sort((left, right) => right[1] - left[1]);
    const dominantPalette = rankedPaletteTargets[0]?.[0] ?? this.paletteState;
    const secondaryPalette =
      rankedPaletteTargets[1]?.[1] && rankedPaletteTargets[1]![1] > 0.08
        ? rankedPaletteTargets[1]![0]
        : dominantPalette;
    const tertiaryPalette =
      rankedPaletteTargets[2]?.[1] && rankedPaletteTargets[2]![1] > 0.06
        ? rankedPaletteTargets[2]![0]
        : secondaryPalette;
    const toneBand = this.resolveHeroColorToneBand(frame);
    const warmth = this.resolveHeroColorWarmth(frame);
    const accentToneBand: HeroColorToneBand =
      toneBand === 'sub' ? 'mid' : toneBand === 'mid' ? 'air' : 'mid';
    const pulseToneBand: HeroColorToneBand =
      frame.sectionChange > 0.2 || frame.momentKind === 'strike'
        ? 'air'
        : toneBand === 'air'
          ? 'mid'
          : 'sub';
    const routeSignature = [
      this.activeAct,
      cuePlan.family,
      cuePlan.heroForm,
      cuePlan.heroAccentForm,
      dominantPalette,
      secondaryPalette,
      tertiaryPalette,
      this.paletteState
    ].join(':');
    const toneSignature = [
      toneBand,
      warmth,
      Math.round(frame.harmonicColor * 5),
      Math.round(frame.subPressure * 4),
      Math.round(frame.resonance * 4),
      Math.round(frame.shimmer * 4)
    ].join(':');
    const cueTriggerKind: keyof typeof HERO_COLOR_TRIGGER_OFFSETS =
      routeSignature !== this.lastHeroColorRouteSignature
        ? 'handoff'
        : frame.sectionChange > 0.18
          ? 'section'
          : frame.momentKind === 'strike' && frame.momentAmount > 0.16
            ? 'strike'
            : frame.momentKind === 'release' && frame.momentAmount > 0.14
              ? 'release'
              : this.phraseResolve > 0.42 &&
                  (frame.releaseTail > 0.16 ||
                    frame.resonance > 0.22 ||
                    frame.sectionChange > 0.08)
                ? 'phrase'
                : this.barTurn > 0.58 &&
                    (frame.accent > 0.22 ||
                      frame.dropImpact > 0.16 ||
                      frame.transientConfidence > 0.28)
                  ? 'bar'
                  : 'tone';
    const triggerSignature = [
      routeSignature,
      toneSignature,
      cueTriggerKind,
      frame.performanceIntent,
      frame.momentKind,
      Math.round(frame.dropImpact * 5),
      Math.round(frame.sectionChange * 4),
      Math.round(frame.releaseTail * 4)
    ].join(':');
    const minimumHoldSeconds = THREE.MathUtils.clamp(
      cuePlan.paletteHoldSeconds * 0.28 +
        (cuePlan.family === 'brood' || cuePlan.family === 'haunt' ? 0.34 : 0) +
        (frame.performanceIntent === 'detonate'
          ? -0.3
          : frame.performanceIntent === 'ignite'
            ? -0.18
            : 0) -
        frame.sectionChange * 0.56 -
        frame.dropImpact * 0.32 -
        cuePlan.eventDensity * 0.22,
      0.55,
      1.9
    );
    const routeChanged = routeSignature !== this.lastHeroColorRouteSignature;
    const toneChanged =
      toneSignature !== this.lastHeroColorToneSignature &&
      (frame.shimmer > 0.16 ||
        frame.resonance > 0.18 ||
        frame.subPressure > 0.22 ||
        frame.sectionChange > 0.08);
    const cueTriggered =
      cueTriggerKind !== 'tone' ||
      toneChanged ||
      frame.sectionChange > 0.08 ||
      frame.momentAmount > 0.14;
    const shouldTrigger =
      routeChanged ||
      ((elapsedSeconds - this.lastHeroColorChangeSeconds >= minimumHoldSeconds ||
        this.lastHeroColorChangeSeconds < 0) &&
        cueTriggered &&
        triggerSignature !== this.lastHeroColorTriggerSignature);

    if (!shouldTrigger) {
      return;
    }

    const seedBase = [
      triggerSignature,
      Math.round(frame.brightness * 4),
      Math.round(frame.air * 4),
      Math.round(frame.accent * 4)
    ].join(':');
    this.heroPrimaryColorCycle = this.selectHeroPaletteCycle(
      dominantPalette,
      toneBand,
      warmth,
      'primary',
      cueTriggerKind,
      `${seedBase}:primary`
    );
    this.heroAccentColorCycle = this.selectHeroPaletteCycle(
      secondaryPalette,
      accentToneBand,
      cueTriggerKind === 'release' ? 'warm' : warmth,
      'accent',
      cueTriggerKind,
      `${seedBase}:accent`
    );
    this.heroPulseColorCycle = this.selectHeroPaletteCycle(
      tertiaryPalette,
      pulseToneBand,
      cueTriggerKind === 'strike' || cueTriggerKind === 'bar' ? 'cool' : warmth,
      'pulse',
      cueTriggerKind,
      `${seedBase}:pulse`
    );
    this.lastHeroColorChangeSeconds = elapsedSeconds;
    this.lastHeroColorRouteSignature = routeSignature;
    this.lastHeroColorTriggerSignature = triggerSignature;
    this.lastHeroColorToneSignature = toneSignature;
  }

  private updateLocomotion(context: StageIdleContext): void {
    const { elapsedSeconds, deltaSeconds } = context;
    const sceneVariation = this.resolveSceneVariationProfile();
    const eventScaleBias =
      this.stageCompositionPlan.eventScale === 'stage'
        ? 1
        : this.stageCompositionPlan.eventScale === 'phrase'
          ? 0.76
          : 0.44;
    const worldTakeoverBias =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const stageBias = THREE.MathUtils.clamp(
      this.stageCuePlan.stageWeight * 0.42 +
        this.stageCuePlan.worldWeight * 0.28 +
        this.stageCuePlan.heroMotionBias * 0.24 +
        eventScaleBias * 0.34 +
        worldTakeoverBias * 0.18 +
        sceneVariation.heroRoamBoost * 0.24 +
        sceneVariation.noveltyDrive * 0.08,
      0,
      1.35
    );
    const laneTargetX = THREE.MathUtils.clamp(
      (this.stageCompositionPlan.heroEnvelope.laneTargetX - 0.5) * 2,
      -1,
      1
    );
    const laneTargetY = THREE.MathUtils.clamp(
      (0.5 - this.stageCompositionPlan.heroEnvelope.laneTargetY) * 2,
      -1,
      1
    );
    const laneTravelBias = THREE.MathUtils.clamp(
        0.16 +
        this.stageCuePlan.heroMotionBias * 0.24 +
        this.stageCompositionPlan.heroEnvelope.driftAllowance * 0.54 +
        eventScaleBias * 0.18 +
        sceneVariation.heroRoamBoost * 0.22 +
        sceneVariation.cameraSpreadBoost * 0.06,
      0.1,
      0.92
    );
    const lanePositionX =
      laneTargetX *
      (0.14 +
        stageBias * 0.22 +
        laneTravelBias * 0.24 +
        sceneVariation.heroRoamBoost * 0.12);
    const lanePositionY =
      laneTargetY *
      (0.08 +
        stageBias * 0.14 +
        laneTravelBias * 0.16 +
        sceneVariation.heroRoamBoost * 0.08);
    const heroLaneSign =
      Math.sign(laneTargetX || this.stageCuePlan.heroStageX || 0.24) || 1;
    const heroClock =
      elapsedSeconds *
        (0.18 +
          this.stageCuePlan.heroMotionBias * 0.32 +
          eventScaleBias * 0.1 +
          sceneVariation.noveltyDrive * 0.06) +
      this.barPhase * Math.PI * 2;
    const chamberClock =
      elapsedSeconds *
        (0.1 +
          this.directorWorldActivity * 0.14 +
          eventScaleBias * 0.04 +
          sceneVariation.spectralProfile * 0.04) +
      this.phrasePhase * Math.PI * 2;
    const cameraClock =
      elapsedSeconds *
        (0.14 +
          this.directorFraming * 0.12 +
          this.stageCuePlan.heroMotionBias * 0.08 +
          sceneVariation.cameraSpreadBoost * 0.08) +
      this.barPhase * Math.PI * 2;
    const heroPulse = phasePulse(this.phrasePhase, elapsedSeconds * 0.24);
    const chamberPulse = phasePulse(this.barPhase, elapsedSeconds * 0.18);
    const heroTravelGain =
      1 + sceneVariation.heroRoamBoost * 0.68 + sceneVariation.noveltyDrive * 0.18;
    const chamberTravelGain =
      1 + sceneVariation.beamBoost * 0.22 + sceneVariation.latticeBoost * 0.18;
    const cameraTravelGain = 1 + sceneVariation.cameraSpreadBoost * 0.56;
    const worldLedCameraBias = THREE.MathUtils.clamp(
      worldTakeoverBias +
        (this.stageCompositionPlan.shotClass === 'pressure' ? 0.62 : 0) +
        (this.stageCuePlan.family === 'reveal' ? 0.34 : 0) +
        (this.stageCuePlan.family === 'rupture' ? 0.22 : 0) +
        (this.stageCuePlan.worldMode === 'cathedral-rise' ? 0.26 : 0),
      0,
      1.6
    );

    const heroTargetPosition = this.motionPositionScratch.set(0, 0, 0);
    const heroTargetEuler = this.motionEulerScratch.set(0, 0, 0);
    switch (this.stageCuePlan.motionPhrase) {
      case 'bank-rise':
        heroTargetPosition.set(
          lanePositionX + Math.sin(heroClock * 0.8) * 0.42 * stageBias,
          lanePositionY +
            (0.1 + heroPulse * 0.24 + this.stageCuePlan.heroStageY * 0.1) *
              stageBias,
          Math.cos(heroClock * 0.64) * 0.24 * stageBias
        );
        heroTargetEuler.set(
          0.18 * stageBias + Math.sin(heroClock * 0.54) * 0.16,
          heroLaneSign * 0.28 * stageBias + Math.cos(heroClock * 0.66) * 0.24,
          heroLaneSign * (0.18 + heroPulse * 0.28) * stageBias
        );
        break;
      case 'arc-handoff':
        heroTargetPosition.set(
          lanePositionX +
            heroLaneSign * (0.22 + Math.sin(heroClock) * 0.44) * stageBias,
          lanePositionY + Math.sin(heroClock * 0.72) * 0.28 * stageBias,
          Math.cos(heroClock * 0.46) * 0.28 * stageBias
        );
        heroTargetEuler.set(
          Math.cos(heroClock * 0.8) * 0.22 * stageBias,
          heroLaneSign * (0.14 + Math.sin(heroClock * 0.52) * 0.26) * stageBias,
          heroLaneSign * Math.sin(heroClock * 0.72) * 0.24 * stageBias
        );
        break;
      case 'tumble-release':
        heroTargetPosition.set(
          lanePositionX + Math.sin(heroClock * 0.6) * 0.24 * stageBias,
          lanePositionY + Math.cos(heroClock * 0.44) * 0.14 * stageBias,
          -0.06 * stageBias + Math.sin(heroClock * 0.82) * 0.24 * stageBias
        );
        heroTargetEuler.set(
          Math.sin(heroClock * 0.84) * 0.26 * stageBias,
          Math.cos(heroClock * 0.62) * 0.22 * stageBias,
          heroLaneSign * Math.sin(heroClock * 0.96) * 0.28 * stageBias
        );
        break;
      case 'recoil-dive':
        heroTargetPosition.set(
          lanePositionX +
            heroLaneSign * Math.sin(heroClock * 1.06) * 0.36 * stageBias,
          lanePositionY -
            Math.abs(Math.cos(heroClock * 0.9)) * 0.22 * stageBias,
          -0.18 * stageBias + Math.sin(heroClock * 0.72) * 0.24 * stageBias
        );
        heroTargetEuler.set(
          -0.2 * stageBias + Math.cos(heroClock * 0.88) * 0.24 * stageBias,
          heroLaneSign * (0.22 + Math.sin(heroClock * 0.7) * 0.32) * stageBias,
          heroLaneSign * Math.sin(heroClock * 1.04) * 0.3 * stageBias
        );
        break;
      case 'cathedral-precession':
        heroTargetPosition.set(
          lanePositionX +
            heroLaneSign * Math.sin(heroClock * 0.42) * 0.34 * stageBias,
          lanePositionY +
            0.12 * stageBias +
            Math.cos(heroClock * 0.38) * 0.18 * stageBias,
          Math.sin(heroClock * 0.32) * 0.22 * stageBias
        );
        heroTargetEuler.set(
          Math.sin(heroClock * 0.36) * 0.18 * stageBias,
          heroLaneSign * (0.28 + Math.sin(heroClock * 0.28) * 0.24) * stageBias,
          heroLaneSign * Math.sin(heroClock * 0.3) * 0.18 * stageBias
        );
        break;
      default:
        heroTargetPosition.set(
          lanePositionX + Math.sin(heroClock * 0.72) * 0.22 * stageBias,
          lanePositionY + Math.cos(heroClock * 0.54) * 0.12 * stageBias,
          Math.sin(heroClock * 0.46) * 0.16 * stageBias
        );
        heroTargetEuler.set(
          Math.sin(heroClock * 0.58) * 0.12 * stageBias,
          heroLaneSign * Math.cos(heroClock * 0.48) * 0.18 * stageBias,
          heroLaneSign * Math.sin(heroClock * 0.7) * 0.1 * stageBias
        );
        break;
    }
    heroTargetPosition.multiplyScalar(heroTravelGain);
    heroTargetPosition.x += lanePositionX * sceneVariation.heroRoamBoost * 0.32;
    heroTargetPosition.y += lanePositionY * sceneVariation.heroRoamBoost * 0.18;
    heroTargetPosition.z +=
      Math.sin(heroClock * 0.28 + this.phrasePhase * Math.PI * 2) *
      0.04 *
      sceneVariation.heroRoamBoost;
    heroTargetEuler.x *= 1 + sceneVariation.noveltyDrive * 0.22;
    heroTargetEuler.y *= 1 + sceneVariation.heroRoamBoost * 0.2;
    heroTargetEuler.z *= 1 + sceneVariation.cameraSpreadBoost * 0.18;

    const chamberScale = THREE.MathUtils.clamp(
      0.16 +
        this.stageCuePlan.worldWeight * 0.3 +
        this.directorWorldActivity * 0.16 +
        eventScaleBias * 0.16 +
        worldLedCameraBias * 0.08,
      0,
      0.92
    );
    const chamberTargetPosition = this.motionPositionScratchB.set(0, 0, 0);
    const chamberTargetEuler = this.motionEulerScratchB.set(0, 0, 0);
    switch (this.stageCuePlan.motionPhrase) {
      case 'cathedral-precession':
        chamberTargetPosition.set(
          Math.sin(chamberClock * 0.26) * 0.24 * chamberScale,
          Math.cos(chamberClock * 0.18) * 0.12 * chamberScale,
          Math.sin(chamberClock * 0.22) * 0.28 * chamberScale
        );
        chamberTargetEuler.set(
          Math.sin(chamberClock * 0.22) * 0.12 * chamberScale,
          Math.cos(chamberClock * 0.18) * 0.28 * chamberScale,
          Math.sin(chamberClock * 0.16) * 0.12 * chamberScale
        );
        break;
      case 'recoil-dive':
        chamberTargetPosition.set(
          Math.sin(chamberClock * 0.34) * 0.18 * chamberScale,
          -Math.abs(Math.cos(chamberClock * 0.26)) * 0.12 * chamberScale,
          -0.12 * chamberScale + Math.sin(chamberClock * 0.28) * 0.2 * chamberScale
        );
        chamberTargetEuler.set(
          Math.sin(chamberClock * 0.24) * 0.14 * chamberScale,
          Math.cos(chamberClock * 0.2) * 0.22 * chamberScale,
          Math.sin(chamberClock * 0.22) * 0.14 * chamberScale
        );
        break;
      default:
        chamberTargetPosition.set(
          Math.sin(chamberClock * 0.3) * 0.14 * chamberScale,
          Math.cos(chamberClock * 0.22) * 0.08 * chamberScale,
          Math.sin(chamberClock * 0.24) * 0.18 * chamberScale
        );
        chamberTargetEuler.set(
          Math.sin(chamberClock * 0.2) * 0.08 * chamberScale,
          Math.cos(chamberClock * 0.18) * 0.18 * chamberScale,
          Math.sin(chamberClock * 0.16) * 0.1 * chamberScale
        );
        break;
    }
    chamberTargetPosition.multiplyScalar(chamberTravelGain);
    chamberTargetPosition.z -= sceneVariation.postContrastBoost * 0.04;
    chamberTargetEuler.x *= 1 + sceneVariation.spectralProfile * 0.18;
    chamberTargetEuler.y *= 1 + sceneVariation.noveltyDrive * 0.16;
    chamberTargetEuler.z *= 1 + sceneVariation.prismaticProfile * 0.18;

    const cameraScale = THREE.MathUtils.clamp(
      0.08 +
        this.directorFraming * 0.14 +
        this.stageCuePlan.screenWeight * 0.1 +
        eventScaleBias * 0.12 +
        sceneVariation.cameraSpreadBoost * 0.1 +
        worldLedCameraBias * 0.08,
      0,
      0.68
    );
    const rollGate =
      this.stageCompositionPlan.eventScale === 'stage' ||
      this.stageCompositionPlan.shotClass === 'worldTakeover' ||
      this.stageCuePlan.family === 'rupture';
    const cameraTargetPosition = this.motionPositionScratchC.set(0, 0, 0);
    const cameraTargetEuler = this.motionEulerScratchC.set(0, 0, 0);
    switch (this.stageCuePlan.cameraPhrase) {
      case 'bank-rise':
        cameraTargetPosition.set(
          Math.sin(cameraClock * 0.52) * 0.24 * cameraScale,
          Math.cos(cameraClock * 0.36) * 0.18 * cameraScale,
          Math.sin(cameraClock * 0.44) * 0.18 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.38) * 0.08 * cameraScale,
          Math.cos(cameraClock * 0.3) * 0.12 * cameraScale,
          rollGate
            ? heroLaneSign * (0.14 + chamberPulse * 0.14 + worldLedCameraBias * 0.08) * cameraScale
            : 0
        );
        break;
      case 'arc-handoff':
        cameraTargetPosition.set(
          heroLaneSign * Math.sin(cameraClock * 0.58) * 0.28 * cameraScale,
          Math.cos(cameraClock * 0.34) * 0.16 * cameraScale,
          Math.sin(cameraClock * 0.22) * 0.2 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.32) * 0.08 * cameraScale,
          heroLaneSign * Math.cos(cameraClock * 0.28) * 0.12 * cameraScale,
          rollGate
            ? heroLaneSign * Math.sin(cameraClock * 0.52) * 0.16 * cameraScale
            : 0
        );
        break;
      case 'recoil-dive':
        cameraTargetPosition.set(
          heroLaneSign * Math.sin(cameraClock * 0.74) * 0.22 * cameraScale,
          -Math.abs(Math.cos(cameraClock * 0.52)) * 0.14 * cameraScale,
          -0.14 * cameraScale + Math.sin(cameraClock * 0.4) * 0.14 * cameraScale
        );
        cameraTargetEuler.set(
          -Math.abs(Math.sin(cameraClock * 0.42)) * 0.1 * cameraScale,
          heroLaneSign * Math.cos(cameraClock * 0.34) * 0.14 * cameraScale,
          rollGate
            ? heroLaneSign * Math.sin(cameraClock * 0.62) * 0.2 * cameraScale
            : 0
        );
        break;
      case 'cathedral-precession':
        cameraTargetPosition.set(
          Math.sin(cameraClock * 0.24) * 0.2 * cameraScale,
          Math.cos(cameraClock * 0.18) * 0.14 * cameraScale,
          Math.sin(cameraClock * 0.16) * 0.24 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.18) * 0.07 * cameraScale,
          Math.cos(cameraClock * 0.16) * 0.1 * cameraScale,
          rollGate
            ? heroLaneSign * Math.sin(cameraClock * 0.24) * 0.16 * cameraScale
            : 0
        );
        break;
      default:
        cameraTargetPosition.set(
          Math.sin(cameraClock * 0.46) * 0.14 * cameraScale,
          Math.cos(cameraClock * 0.3) * 0.12 * cameraScale,
          Math.sin(cameraClock * 0.26) * 0.12 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.24) * 0.04 * cameraScale,
          Math.cos(cameraClock * 0.22) * 0.05 * cameraScale,
          rollGate
            ? heroLaneSign * Math.sin(cameraClock * 0.4) * 0.1 * cameraScale
            : 0
        );
        break;
    }
    cameraTargetPosition.multiplyScalar(cameraTravelGain);
    cameraTargetPosition.x +=
      heroLaneSign *
      sceneVariation.cameraSpreadBoost *
      (0.06 + worldLedCameraBias * 0.03);
    cameraTargetPosition.y +=
      Math.sin(cameraClock * 0.32) *
      (0.04 + worldLedCameraBias * 0.02) *
      sceneVariation.cameraSpreadBoost;
    cameraTargetPosition.z +=
      Math.cos(cameraClock * 0.22) *
      (0.06 + worldLedCameraBias * 0.04) *
      cameraScale;
    cameraTargetEuler.x *= 1 + sceneVariation.postContrastBoost * 0.18 + worldLedCameraBias * 0.08;
    cameraTargetEuler.y *= 1 + sceneVariation.cameraSpreadBoost * 0.22 + worldLedCameraBias * 0.1;
    cameraTargetEuler.z *= 1 + sceneVariation.cameraSpreadBoost * 0.48 + worldLedCameraBias * 0.16;

    this.applyMotionPoseState(
      this.heroMotionState,
      heroTargetPosition,
      heroTargetEuler,
      2.4 + this.stageCuePlan.heroMotionBias * 1.2,
      2.8 + eventScaleBias * 1.2,
      deltaSeconds
    );
    this.applyMotionPoseState(
      this.chamberMotionState,
      chamberTargetPosition,
      chamberTargetEuler,
      1.8 + this.directorWorldActivity * 1 + worldLedCameraBias * 0.4,
      2.2 + eventScaleBias * 0.8 + worldLedCameraBias * 0.3,
      deltaSeconds
    );
    this.applyMotionPoseState(
      this.cameraMotionState,
      cameraTargetPosition,
      cameraTargetEuler,
      2.2 + this.directorFraming * 0.9 + worldLedCameraBias * 0.4,
      2.7 + eventScaleBias * 1 + worldLedCameraBias * 0.5,
      deltaSeconds
    );
  }

  private updatePerformanceChoreography(
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const smooth = (current: number, target: number, rise: number, fall: number) =>
      this.smoothValue(current, target, target > current ? rise : fall, deltaSeconds);

    const detonate = this.performanceIntent === 'detonate' ? 1 : 0;
    const ignite = this.performanceIntent === 'ignite' ? 1 : 0;
    const gather = this.performanceIntent === 'gather' ? 1 : 0;
    const haunt = this.performanceIntent === 'haunt' ? 1 : 0;
    const laserBloom = this.actWeights['laser-bloom'];
    const matrixStorm = this.actWeights['matrix-storm'];
    const eclipseRupture = this.actWeights['eclipse-rupture'];
    const ghostAfterimage = this.actWeights['ghost-afterimage'];
    const cueRupture = this.cueState.cueClass === 'rupture' ? 1 : 0;
    const cueReveal = this.cueState.cueClass === 'reveal' ? 1 : 0;
    const cueHaunt =
      this.cueState.cueClass === 'haunt' || this.cueState.cueClass === 'afterglow'
        ? 1
        : 0;
    const cueScreen = this.stageCuePlan.screenWeight;
    const cueResidue = this.stageCuePlan.residueWeight;
    const cueWorld = this.stageCuePlan.worldWeight;
    const cueHero = this.stageCuePlan.heroWeight;
    const cueEventDensity = this.stageCuePlan.eventDensity;
    const stageSubtractive = this.stageCuePlan.subtractiveAmount;
    const stageFlash = this.stageCuePlan.flashAmount;
    const beatPulse = this.beatStrike;
    const barPulse = Math.max(
      this.barTurn,
      phasePulse(this.barPhase, elapsedSeconds * 0.16)
    );
    const phrasePulse = Math.max(
      this.phraseResolve,
      phasePulse(this.phrasePhase, elapsedSeconds * 0.06 + 0.6)
    );
    const impactAuthority = THREE.MathUtils.clamp(
      this.dropImpact * 0.68 +
        this.sectionChange * 0.24 +
        this.beatConfidence * 0.14 +
        this.subPressure * 0.16 +
        detonate * 0.22 +
        ignite * 0.08,
      0,
      1.2
    );

    const targetShellTension = THREE.MathUtils.clamp(
      0.12 +
        this.preDropTension * 0.48 +
        this.preBeatLift * 0.18 +
        gather * 0.16 +
        ignite * 0.08 +
        cueWorld * 0.08 +
        this.phraseTension * 0.12 +
        this.directorGeometry * 0.1 -
        impactAuthority * 0.22 +
        cueScreen * 0.06 +
        this.postBeatRelease * 0.1 +
        haunt * 0.08 +
        cueHero * 0.04,
      0,
      1
    );
    const targetShellBloom = THREE.MathUtils.clamp(
      0.018 +
        impactAuthority * 0.22 +
        cueScreen * 0.12 +
        cueResidue * 0.04 +
        this.releaseTail * 0.08 +
        this.postBeatRelease * 0.12 +
        this.directorSpectacle * 0.04 +
        laserBloom * 0.06 +
        eclipseRupture * 0.08 +
        phrasePulse * 0.06 -
        haunt * 0.08 -
        cueHero * 0.04,
      0,
      0.52
    );
    const targetShellOrbit = THREE.MathUtils.clamp(
      0.1 +
        this.musicConfidence * 0.12 +
        cueWorld * 0.14 +
        this.directorWorldActivity * 0.16 +
        this.directorLaserDrive * 0.04 +
        this.releaseTail * 0.1 +
        cueResidue * 0.06 +
        this.interBeatFloat * 0.2 +
        barPulse * 0.18 +
        phrasePulse * 0.16 +
        ghostAfterimage * 0.08,
      0,
      0.72
    );
    const targetShellHalo = THREE.MathUtils.clamp(
      0.008 +
        this.directorRadiance * 0.03 +
        this.shimmer * 0.04 +
        impactAuthority * 0.06 +
        cueScreen * 0.06 +
        cueResidue * 0.03 +
        this.sectionChange * 0.06 +
        this.directorColorWarp * 0.04 +
        this.phraseResolve * 0.08 +
        laserBloom * 0.04 +
        eclipseRupture * 0.04,
      0,
      0.34
    );
    const targetGlowOverdrive = THREE.MathUtils.clamp(
      0.003 +
        this.directorRadiance * 0.04 +
        this.directorColorWarp * 0.05 +
        impactAuthority * 0.14 +
        cueScreen * 0.08 +
        this.shimmer * 0.03 +
        this.sectionChange * 0.04 +
        this.beatStrike * 0.04 +
        this.phraseResolve * 0.06 +
        detonate * 0.1 +
        matrixStorm * 0.04 +
        cueRupture * 0.05,
      0,
      0.3
    );
    const targetAmbientGlowBudget = THREE.MathUtils.clamp(
      0.016 +
        this.directorRadiance * 0.022 +
        this.directorAtmosphere * 0.034 +
        this.livingField * 0.022 +
        cueWorld * 0.024 +
        cueResidue * 0.018 +
        this.interBeatFloat * 0.016 +
        ghostAfterimage * 0.016 -
        impactAuthority * 0.034 -
        cueScreen * 0.012 -
        stageSubtractive * 0.006,
      0.01,
      0.11
    );
    const targetEventGlowBudget = THREE.MathUtils.clamp(
      0.03 +
        this.dropImpact * 0.5 +
        this.sectionChange * 0.34 +
        cueScreen * 0.18 +
        cueEventDensity * 0.14 +
        stageFlash * 0.12 +
        this.beatStrike * 0.08 +
        this.phraseResolve * 0.18 +
        detonate * 0.18 +
        this.subPressure * 0.08 +
        laserBloom * 0.08 +
        eclipseRupture * 0.1 +
        cueReveal * 0.08 +
        cueRupture * 0.08 +
        cueHaunt * 0.02 +
        this.adaptiveMusicVisualFloor * 0.08 +
        this.roomMusicVisualFloor * 0.12,
      0,
      0.92
    );
    const targetRoomMusicVisualFloor =
      this.currentListeningMode === 'room-mic' &&
      this.musicConfidence > 0.14 &&
      this.speechConfidence < 0.34 &&
      this.stageCuePlan.family !== 'haunt' &&
      this.stageCuePlan.family !== 'reset'
        ? THREE.MathUtils.clamp(
            this.musicConfidence * 0.92 +
              this.harmonicColor * 0.3 +
              this.shimmer * 0.24 +
              this.beatConfidence * 0.18 +
              cueWorld * 0.12 +
              cueScreen * 0.12,
            0,
            0.56
          )
        : 0;
    const targetAdaptiveMusicVisualFloor =
      this.stageCuePlan.family !== 'haunt' &&
      this.stageCuePlan.family !== 'reset' &&
      this.musicConfidence > 0.14 &&
      this.speechConfidence < 0.22 &&
      (this.body > 0.08 ||
        this.harmonicColor > 0.28 ||
        this.shimmer > 0.08 ||
        this.momentum > 0.14 ||
        this.tonalStability > 0.24)
        ? THREE.MathUtils.clamp(
            this.musicConfidence * 0.72 +
              this.body * 0.34 +
              this.tonalStability * 0.14 +
              this.harmonicColor * 0.18 +
              this.shimmer * 0.18 +
              this.air * 0.1 +
              this.directorRadiance * 0.18 +
              this.directorSpectacle * 0.14 +
              this.directorWorldActivity * 0.12 -
              this.releaseTail * 0.08,
            0,
            0.68
          )
        : 0;
    const quietRoomAmbientFloor =
      targetRoomMusicVisualFloor *
      (0.084 + gather * 0.032 + cueReveal * 0.046 + this.tuning.neonStageFloor * 0.04);
    const quietRoomEventFloor =
      targetRoomMusicVisualFloor *
      (0.22 + gather * 0.1 + cueReveal * 0.16 + this.tuning.neonStageFloor * 0.06);
    const adaptiveAmbientFloor =
      targetAdaptiveMusicVisualFloor *
      (0.068 +
        gather * 0.028 +
        cueReveal * 0.04 +
        this.directorRadiance * 0.04 +
        this.tuning.neonStageFloor * 0.032);
    const adaptiveEventFloor =
      targetAdaptiveMusicVisualFloor *
      (0.16 +
        gather * 0.06 +
        cueReveal * 0.1 +
        this.directorSpectacle * 0.08 +
        this.directorLaserDrive * 0.06 +
        this.tuning.neonStageFloor * 0.04);
    const musicStageFloor = Math.max(targetRoomMusicVisualFloor, targetAdaptiveMusicVisualFloor);
    const ambientGlowCeiling = 0.12 + musicStageFloor * 0.18;
    const eventGlowCeiling = 0.92;
    const raisedAmbientGlowBudget = THREE.MathUtils.clamp(
      targetAmbientGlowBudget + quietRoomAmbientFloor + adaptiveAmbientFloor,
      0.006,
      ambientGlowCeiling
    );
    const raisedEventGlowBudget = THREE.MathUtils.clamp(
      targetEventGlowBudget + quietRoomEventFloor + adaptiveEventFloor,
      0,
      eventGlowCeiling
    );

    this.shellTension = smooth(this.shellTension, targetShellTension, 1.1, 0.58);
    this.shellBloom = smooth(this.shellBloom, targetShellBloom, 1.7, 0.64);
    this.shellOrbit = smooth(this.shellOrbit, targetShellOrbit, 0.8, 0.42);
    this.shellHalo = smooth(this.shellHalo, targetShellHalo, 1.2, 0.96);
    this.glowOverdrive = smooth(this.glowOverdrive, targetGlowOverdrive, 1.3, 1.12);
    this.ambientGlowBudget = smooth(
      this.ambientGlowBudget,
      raisedAmbientGlowBudget,
      1.2,
      0.92
    );
    this.eventGlowBudget = smooth(
      this.eventGlowBudget,
      raisedEventGlowBudget,
      1.8,
      1.1
    );
    this.roomMusicVisualFloor = smooth(
      this.roomMusicVisualFloor,
      targetRoomMusicVisualFloor,
      1.8,
      0.96
    );
    this.adaptiveMusicVisualFloor = smooth(
      this.adaptiveMusicVisualFloor,
      targetAdaptiveMusicVisualFloor,
      1.6,
      0.9
    );
  }

  private updateOrganicSpatialLife(
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const tempoLock = this.stageAudioFeatures.tempo.lock;
    const tempoDensity = this.stageAudioFeatures.tempo.density;
    const impactBuild = this.stageAudioFeatures.impact.build;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const musicPresence = this.stageAudioFeatures.presence.music;
    const textureRoughness = this.stageAudioFeatures.texture.roughness;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const memoryResonance = this.stageAudioFeatures.memory.resonance;
    const restraint = this.stageAudioFeatures.stability.restraint;
    const livingAuthority = THREE.MathUtils.clamp(
      this.musicConfidence * 0.28 +
        this.resonance * 0.2 +
        this.roomness * 0.08 +
        this.ambienceConfidence * 0.1 +
        musicPresence * 0.12 +
        spatialPresence * 0.12 +
        this.directorWorldActivity * 0.16 +
        this.directorAtmosphere * 0.14 +
        this.directorEnergy * 0.08,
      0,
      1.2
    );
    const tensionAuthority = THREE.MathUtils.clamp(
      this.preDropTension * 0.32 +
        this.phraseTension * 0.14 +
        this.sectionChange * 0.14 +
        this.dropImpact * 0.18 +
        impactBuild * 0.16 +
        impactHit * 0.18 -
        restraint * 0.06 +
        this.directorSpectacle * 0.1,
      0,
      1.2
    );
    const spectralAuthority = THREE.MathUtils.clamp(
      this.releaseTail * 0.28 +
        this.releasePulse * 0.12 +
        this.speechConfidence * 0.04 +
        memoryAfterglow * 0.22 +
        memoryResonance * 0.12 +
        this.directorAtmosphere * 0.18 +
        this.familyWeights['ghost-lattice'] * 0.12,
      0,
      1
    );
    const shellAuthority = THREE.MathUtils.clamp(
      this.shellOrbit * 0.28 +
        this.shellBloom * 0.22 +
        this.shellTension * 0.18 +
        tempoLock * 0.08 +
        textureRoughness * 0.08 +
        this.directorGeometry * 0.14 +
        tensionAuthority * 0.18,
      0,
      1.2
    );
    const phase = this.harmonicColor * Math.PI * 2;
    const deepClock = elapsedSeconds * (0.045 + livingAuthority * 0.05 + spectralAuthority * 0.02);
    const driftClock = elapsedSeconds * (0.072 + livingAuthority * 0.07 + tensionAuthority * 0.025);
    const shellClock = elapsedSeconds * (0.14 + shellAuthority * 0.08 + tensionAuthority * 0.03);
    const gazeClock = elapsedSeconds * (0.058 + this.directorFraming * 0.04 + livingAuthority * 0.035);

    const chamberAmplitude =
      0.06 +
      livingAuthority * 0.16 +
      this.directorWorldActivity * 0.08 +
      spectralAuthority * 0.04 +
      spatialPresence * 0.05;
    const heroAmplitude =
      0.05 +
      livingAuthority * 0.12 +
      spectralAuthority * 0.05 +
      tensionAuthority * 0.04 +
      impactBuild * 0.03 +
      tempoDensity * 0.02;
    const shellAmplitude =
      0.07 +
      shellAuthority * 0.14 +
      tensionAuthority * 0.05 +
      spectralAuthority * 0.03 +
      textureRoughness * 0.03;
    const cameraAmplitude =
      0.04 +
      livingAuthority * 0.12 +
      this.directorFraming * 0.06 +
      spectralAuthority * 0.05 +
      spatialPresence * 0.04 +
      tempoDensity * 0.02;

    this.organicChamberTarget.set(
      Math.sin(deepClock + phase) * chamberAmplitude +
        Math.sin(driftClock * 0.62 + this.phrasePhase * Math.PI * 2) * chamberAmplitude * 0.32,
      Math.sin(driftClock * 0.78 + phase * 0.35) * chamberAmplitude * 0.56 +
        Math.cos(deepClock * 0.84 + this.releaseTail * Math.PI * 2) * spectralAuthority * 0.05,
      -Math.cos(gazeClock + phase * 0.24) * chamberAmplitude * 0.82 +
        tensionAuthority * 0.06 -
        this.dropImpact * 0.08 +
        spectralAuthority * 0.06
    );

    this.organicHeroTarget.set(
      -this.organicChamberTarget.x * 0.42 +
        Math.sin(driftClock * 1.08 + phase * 0.72) * heroAmplitude,
      Math.sin(driftClock * 0.94 + this.barPhase * Math.PI * 2) * heroAmplitude * 1.2 +
        spectralAuthority * 0.06 -
        tensionAuthority * 0.03,
      Math.cos(deepClock * 1.16 + this.phrasePhase * Math.PI * 2) * heroAmplitude * 0.7 +
        this.releaseTail * 0.05 -
        this.preDropTension * 0.03
    );

    this.organicShellTarget.set(
      Math.sin(shellClock + phase * 0.48) * shellAmplitude +
        Math.cos(driftClock * 1.22) * shellAmplitude * 0.24,
      Math.cos(shellClock * 0.84 + this.phrasePhase * Math.PI * 2) * shellAmplitude * 0.86 +
        this.shellBloom * 0.04,
      Math.sin(shellClock * 0.66 + this.barPhase * Math.PI * 2) * shellAmplitude * 0.54 -
        this.shellTension * 0.04 +
        this.releaseTail * 0.03
    );

    this.organicCameraTarget.set(
      this.organicChamberTarget.x * 0.72 +
        Math.sin(gazeClock + this.barPhase * Math.PI * 2) * cameraAmplitude,
      this.organicChamberTarget.y * 0.68 +
        Math.cos(gazeClock * 0.88 + phase * 0.2) * cameraAmplitude * 0.82,
      Math.sin(deepClock * 0.74 + phase * 0.3) * cameraAmplitude * 0.92 +
        spectralAuthority * 0.06 -
        tensionAuthority * 0.04
    );

    this.organicGazeTarget.set(
      -this.organicHeroTarget.x * 0.34 +
        Math.sin(gazeClock * 1.24 + phase) * (0.04 + livingAuthority * 0.06),
      this.organicHeroTarget.y * 0.28 +
        Math.cos(gazeClock * 1.08 + this.releaseTail * Math.PI * 2) * (0.03 + spectralAuthority * 0.04),
      -0.12 + this.preDropTension * 0.05 - this.releaseTail * 0.03
    );

    this.livingField = this.smoothValue(
      this.livingField,
      THREE.MathUtils.clamp(
        0.18 +
          livingAuthority * 0.44 +
          tensionAuthority * 0.08 +
          spectralAuthority * 0.1 +
          this.directorWorldActivity * 0.08,
        0,
        1.25
      ),
      0.82,
      deltaSeconds
    );

    this.smoothVector(this.organicChamberDrift, this.organicChamberTarget, 0.84, deltaSeconds);
    this.smoothVector(this.organicHeroDrift, this.organicHeroTarget, 0.92, deltaSeconds);
    this.smoothVector(this.organicShellDrift, this.organicShellTarget, 1.04, deltaSeconds);
    this.smoothVector(this.organicCameraDrift, this.organicCameraTarget, 0.78, deltaSeconds);
    this.smoothVector(this.organicGazeDrift, this.organicGazeTarget, 0.86, deltaSeconds);
  }

  private updateAtmosphereLayers(
    elapsedSeconds: number,
    idleBreath: number,
    background: THREE.Color,
    stageColorLift: number,
    sceneVariation: SceneVariationProfile
  ): void {
    const cueFamily = this.stageCuePlan.family;
    const cueReveal = cueFamily === 'reveal' ? 1 : 0;
    const cueRupture = cueFamily === 'rupture' ? 1 : 0;
    const cueRelease = cueFamily === 'release' ? 1 : 0;
    const cueHaunt = cueFamily === 'haunt' ? 1 : 0;
    const cueWorld = this.stageCuePlan.worldWeight;
    const cueScreen = this.stageCuePlan.screenWeight;
    const cueResidue = this.stageCuePlan.residueWeight;
    const fieldBloom = this.stageCuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const cathedralFrame =
      this.stageCuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const ghostChamber =
      this.stageCuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const collapseWell =
      this.stageCuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure =
      this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const worldActivity = this.directorWorldActivity;
    const stateGas = this.activeMatterState === 'gas' ? 1 : 0;
    const stateLiquid = this.activeMatterState === 'liquid' ? 1 : 0;
    const statePlasma = this.activeMatterState === 'plasma' ? 1 : 0;
    const stateCrystal = this.activeMatterState === 'crystal' ? 1 : 0;
    const musicStageFloor = Math.max(
      this.roomMusicVisualFloor,
      this.adaptiveMusicVisualFloor
    );
    const chamberDrift = this.organicChamberDrift;
    const chamberMotion = this.chamberMotionState;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const musicPresence = this.stageAudioFeatures.presence.music;
    const restraint = this.stageAudioFeatures.stability.restraint;
    const phasePulseA = phasePulse(
      this.phrasePhase,
      elapsedSeconds * (0.16 + this.atmosphereGas * 0.04)
    );
    const phasePulseB = phasePulse(
      this.barPhase,
      elapsedSeconds * (0.3 + this.atmospherePlasma * 0.08)
    );

    this.atmosphereGroup.position.set(
      chamberDrift.x * 0.46 + chamberMotion.position.x * 0.22,
      chamberDrift.y * 0.36 + chamberMotion.position.y * 0.12,
      -0.5 +
        chamberDrift.z * 0.44 +
        chamberMotion.position.z * 0.14 -
        this.atmospherePressure * 0.18
    );
    this.atmosphereGroup.rotation.y =
      elapsedSeconds * (0.01 + this.atmosphereLiquid * 0.014) +
      chamberDrift.x * 0.18;
    this.atmosphereGroup.rotation.x =
      Math.sin(elapsedSeconds * (0.05 + this.atmosphereGas * 0.02)) *
        (0.03 + this.atmosphereGas * 0.04) +
      chamberDrift.y * 0.14;
    this.atmosphereGroup.rotation.z =
      Math.sin(elapsedSeconds * (0.04 + this.atmosphereCrystal * 0.02)) *
      (0.02 + this.atmosphereResidue * 0.04);

    const bedColor = this.atmosphereColorScratch
      .copy(background)
      .lerp(
        COOL_BACKGROUND,
        0.24 +
          this.atmosphereGas * 0.32 +
          stateGas * 0.08 +
          this.atmosphereLiquid * 0.12 +
          stateLiquid * 0.04 +
          cueWorld * 0.08 +
          musicStageFloor * 0.08
      )
      .lerp(
        LASER_CYAN,
        this.atmosphereGas * 0.08 +
          this.atmosphereIonization * 0.08 +
          statePlasma * 0.04 +
          sceneVariation.spectralProfile * 0.04
      )
      .lerp(
        HOT_MAGENTA,
        sceneVariation.prismaticProfile * 0.06 +
          sceneVariation.solarProfile * 0.04
      )
      .lerp(
        VOID_BACKGROUND,
        collapseWell * 0.12 + this.atmospherePressure * 0.08
      );
    const currentColor = this.atmosphereColorScratchB
      .copy(LASER_CYAN)
      .lerp(TRON_BLUE, 0.18 + this.atmosphereLiquid * 0.14 + stateLiquid * 0.06)
      .lerp(MATRIX_GREEN, this.atmosphereLiquid * 0.1)
      .lerp(TOXIC_PINK, sceneVariation.prismaticProfile * 0.08)
      .lerp(ELECTRIC_WHITE, this.atmosphereResidue * 0.08);
    const chargeColor = this.atmosphereColorScratchC
      .copy(LASER_CYAN)
      .lerp(TRON_BLUE, 0.18 + this.atmospherePlasma * 0.16 + statePlasma * 0.08)
      .lerp(HOT_MAGENTA, this.atmosphereIonization * 0.12)
      .lerp(ACID_LIME, sceneVariation.stormProfile * 0.08)
      .lerp(
        ELECTRIC_WHITE,
        this.atmosphereCrystal * 0.12 + stateCrystal * 0.08 + cueReveal * 0.06
      );

    this.atmosphereVeils.forEach((veil, index) => {
      const layerClock =
        elapsedSeconds *
          (0.024 +
            index * 0.008 +
            this.atmosphereGas * 0.018 +
            this.atmosphereLiquid * 0.02 +
            this.atmospherePlasma * 0.022) +
        veil.offset * 2.4;
      const wave = Math.sin(layerClock + this.barPhase * Math.PI * 2);
      const tide = Math.cos(layerClock * 0.74 + this.phrasePhase * Math.PI * 2);
      const material = veil.mesh.material;
      const mistBias = veil.mode === 'mist' ? 1 : 0;
      const currentBias = veil.mode === 'current' ? 1 : 0;
      const chargeBias = veil.mode === 'charge' ? 1 : 0;
      const veilBias = veil.mode === 'veil' ? 1 : 0;

      material.color
        .copy(bedColor)
        .lerp(currentColor, currentBias * (0.34 + this.atmosphereLiquid * 0.22))
        .lerp(chargeColor, chargeBias * (0.42 + this.atmospherePlasma * 0.28))
        .lerp(ELECTRIC_WHITE, veilBias * this.atmosphereResidue * 0.08);
      material.opacity = THREE.MathUtils.clamp(
        ambientGlow *
          (0.018 +
            mistBias * (this.atmosphereGas * 0.1 + this.atmosphereResidue * 0.04) +
            currentBias * (this.atmosphereLiquid * 0.08 + worldActivity * 0.04) +
            veilBias * (cueWorld * 0.06 + cueResidue * 0.06)) +
          eventGlow *
            (chargeBias *
              (this.atmosphereIonization * 0.09 +
                cueScreen * 0.04 +
                impactHit * 0.04) +
              veilBias *
                (cueReveal * 0.04 + this.sectionChange * 0.03)) +
          stageColorLift *
            (0.022 +
              musicStageFloor * 0.02 +
              this.atmosphereGas * 0.014 +
              cueWorld * 0.018) +
          this.atmosphereResidue * 0.018 -
          restraint * 0.012,
        0,
        chargeBias > 0 ? 0.18 : 0.14
      );
      veil.mesh.position.set(
        veil.side *
          (0.5 +
            index * 0.26 +
            wave * (0.8 + this.atmosphereLiquid * 0.8) +
            this.atmospherePressure * 0.18),
        tide * (0.4 + mistBias * 0.5 + veilBias * 0.32) +
          chamberDrift.y * 0.24 +
          (musicPresence - 0.5) * 0.24,
        veil.depth +
          this.atmospherePressure * index * -0.22 +
          cueReveal * 0.18 -
          cueRelease * 0.12 +
          cueHaunt * 0.16
      );
      veil.mesh.rotation.y =
        veil.side * (0.14 + veil.offset * 0.06) +
        wave * (0.08 + currentBias * 0.1) +
        phasePulseA * 0.04;
      veil.mesh.rotation.x =
        tide * (0.05 + mistBias * 0.08 + currentBias * 0.04) -
        cueRupture * 0.04;
      veil.mesh.rotation.z =
        wave * (0.04 + chargeBias * 0.08) +
        tide * 0.02 +
        phasePulseB * 0.04;
      veil.mesh.scale.set(
        1 +
          this.atmosphereGas * 0.12 +
          this.atmosphereLiquid * 0.08 +
          this.atmospherePressure * 0.08 +
          stageColorLift * 0.08 +
          cueReveal * 0.04 +
          idleBreath * 0.03,
        1 +
          mistBias * this.atmosphereGas * 0.16 +
          currentBias * this.atmosphereLiquid * 0.22 +
          this.atmosphereResidue * 0.08 +
          cueHaunt * 0.08,
        1
      );
    });

    this.atmosphereColumns.forEach((column, index) => {
      const material = column.mesh.material;
      const columnPulse =
        0.5 +
        0.5 *
          Math.sin(
            elapsedSeconds *
              (0.16 + this.atmosphereCrystal * 0.12 + this.atmospherePlasma * 0.06) +
              column.offset * 2.2 +
              this.barPhase * Math.PI * 2
          );
      material.color
        .copy(ELECTRIC_WHITE)
        .lerp(LASER_CYAN, 0.18 + this.atmospherePlasma * 0.18)
        .lerp(TRON_BLUE, this.atmosphereCrystal * 0.16 + cathedralFrame * 0.08)
        .lerp(HOT_MAGENTA, sceneVariation.prismaticProfile * 0.08)
        .lerp(GHOST_PALE, this.atmosphereResidue * 0.08 + cueRelease * 0.04);
      material.opacity = THREE.MathUtils.clamp(
        stageColorLift * 0.01 +
          this.atmosphereStructureReveal *
            (0.1 +
              cathedralFrame * 0.18 +
              shotWorldTakeover * 0.16 +
              cueReveal * 0.24) +
          eventGlow *
            (this.atmosphereCrystal * 0.09 +
              this.atmosphereIonization * 0.05 +
              cueReveal * 0.08 +
              cueRupture * 0.04) +
          ambientGlow *
            (this.atmosphereResidue * 0.018 +
              ghostChamber * 0.02 +
              shotPressure * 0.01) -
          cueHaunt * 0.012,
        0,
        0.24
      );
      column.mesh.position.set(
        column.side *
          (3.4 +
            index * 1.8 +
            columnPulse * 0.4 +
            this.atmospherePressure * 0.26),
        0.24 +
          Math.sin(elapsedSeconds * 0.14 + column.offset * 2.8) *
            (0.28 + spatialPresence * 0.22) +
          cueReveal * 0.26,
        column.depth -
          this.atmospherePressure * 0.3 +
          cueReveal * 0.2 +
          cueRelease * 0.08
      );
      column.mesh.rotation.y =
        column.side *
        (0.22 +
          column.offset * 0.08 +
          this.atmosphereCrystal * 0.08 -
          this.atmosphereGas * 0.04);
      column.mesh.rotation.z =
        column.side * columnPulse * (0.04 + this.atmosphereIonization * 0.06);
      column.mesh.scale.set(
        1 +
          this.atmosphereCrystal * 0.18 +
          cueReveal * 0.12 +
          shotWorldTakeover * 0.08,
        1 +
          this.atmospherePressure * 0.14 +
          this.atmosphereResidue * 0.08 +
          memoryAfterglow * 0.1 +
          fieldBloom * 0.06,
        1
      );
    });
  }

  private updateWorld(elapsedSeconds: number, idleBreath: number): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const liquid = this.familyWeights['liquid-pressure-core'];
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const ghost = this.familyWeights['ghost-lattice'];
    const storm = this.familyWeights['storm-crown'];
    const eclipse = this.familyWeights['eclipse-chamber'];
    const plume = this.familyWeights['spectral-plume'];
    const portalOpen = this.eventAmount('portal-open');
    const worldStain = this.eventAmount('world-stain');
    const haloIgnition = this.eventAmount('halo-ignition');
    const collapse = this.eventAmount('singularity-collapse');
    const aftermath = this.eventAmount('ghost-afterimage');
    const worldActivity = this.directorWorldActivity;
    const voidAct = this.actWeights['void-chamber'];
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const chromaWarp = this.directorColorWarp;
    const livingField = this.livingField;
    const gasMatter = this.atmosphereGas;
    const liquidMatter = this.atmosphereLiquid;
    const plasmaMatter = this.atmospherePlasma;
    const crystalMatter = this.atmosphereCrystal;
    const atmospherePressure = this.atmospherePressure;
    const atmosphereIonization = this.atmosphereIonization;
    const atmosphereResidue = this.atmosphereResidue;
    const atmosphereStructureReveal = this.atmosphereStructureReveal;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const paletteVoid = this.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = this.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = this.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = this.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = this.paletteState === 'ghost-white' ? 1 : 0;
    const cueGather = this.stageCuePlan.family === 'gather' ? 1 : 0;
    const cueRupture = this.stageCuePlan.family === 'rupture' ? 1 : 0;
    const cueReveal = this.stageCuePlan.family === 'reveal' ? 1 : 0;
    const cueRelease = this.stageCuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = this.stageCuePlan.family === 'haunt' ? 1 : 0;
    const cueReset = this.stageCuePlan.family === 'reset' ? 1 : 0;
    const apertureCage = this.stageCuePlan.worldMode === 'aperture-cage' ? 1 : 0;
    const fanSweep = this.stageCuePlan.worldMode === 'fan-sweep' ? 1 : 0;
    const cathedralFrame = this.stageCuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const collapseWell = this.stageCuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const ghostChamber = this.stageCuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const fieldBloom = this.stageCuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const cueScreen = this.stageCuePlan.screenWeight;
    const cueResidue = this.stageCuePlan.residueWeight;
    const cueWorld = this.stageCuePlan.worldWeight;
    const stageSubtractive = this.stageCuePlan.subtractiveAmount;
    const stageFlash = this.stageCuePlan.flashAmount;
    const stageWipe = this.stageCuePlan.wipeAmount;
    const washoutSuppression = this.stageCuePlan.washoutSuppression;
    const peakSpend = this.stageCuePlan.spendProfile === 'peak' ? 1 : 0;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure =
      this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const chamberEnvelope = this.stageCompositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(
      this.roomMusicVisualFloor,
      this.adaptiveMusicVisualFloor
    );
    const stageColorLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.34 +
        chamberPresenceFloor * 0.36 +
        chamberDominanceFloor * 0.3 +
        chamberWorldTakeoverBias * 0.28 +
        this.tuning.neonStageFloor * 0.22 +
        this.tuning.worldBootFloor * 0.16,
      0,
      1
    );
    const tempoDensity = this.stageAudioFeatures.tempo.density;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const musicPresence = this.stageAudioFeatures.presence.music;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const textureShimmer = this.stageAudioFeatures.texture.shimmer;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const restraint = this.stageAudioFeatures.stability.restraint;
    const chamberDrift = this.organicChamberDrift;
    const chamberMotion = this.chamberMotionState;
    const spectralPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 4 + elapsedSeconds * 0.24);
    const matrixPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 3 + elapsedSeconds * 0.16);
    const beatPulse = onsetPulse(this.beatPhase);
    const phrasePulse = phasePulse(this.phrasePhase, elapsedSeconds * 0.18);
    const barPulse = phasePulse(this.barPhase, elapsedSeconds * 0.42 + 0.8);
    const chromaDrive = THREE.MathUtils.clamp(
      this.directorRadiance * 0.56 +
        this.directorSpectacle * 0.34 +
        this.dropImpact * 0.28 +
        this.sectionChange * 0.22 +
        impactHit * 0.16 +
        textureShimmer * 0.12 +
        this.shimmer * 0.16,
      0,
      1.4
    );
    const gather = this.performanceIntent === 'ignite' || this.performanceIntent === 'gather' ? 1 : 0;
    const detonate = this.performanceIntent === 'detonate' ? 1 : 0;
    const haunt = this.performanceIntent === 'haunt' ? 1 : 0;
    const sceneVoid = sceneVariation.voidProfile;
    const sceneSpectral = sceneVariation.spectralProfile;
    const sceneStorm = sceneVariation.stormProfile;
    const sceneSolar = sceneVariation.solarProfile;
    const scenePrismatic = sceneVariation.prismaticProfile;
    const postContrast = sceneVariation.postContrastBoost;

    const background = this.worldSphereMaterial.color;
    background
      .copy(BASE_BACKGROUND)
      .lerp(
        TRON_BLUE,
        0.12 +
          coolBias * 0.18 +
          portal * 0.16 +
          fanSweep * 0.08 +
          chromaDrive * 0.08 +
          spatialPresence * 0.08 +
          laserAct * 0.12 +
          matrixAct * 0.08 +
          paletteVoid * 0.22 +
          paletteTron * 0.26 +
          paletteGhost * 0.06 +
          stageColorLift * 0.22
      )
      .lerp(
        LASER_CYAN,
        0.08 +
          phrasePulse * 0.14 +
          worldStain * 0.18 +
          gasMatter * 0.06 +
          liquidMatter * 0.04 +
          plasmaMatter * 0.05 +
          fieldBloom * 0.08 +
          memoryAfterglow * 0.1 +
          haunt * 0.1 +
          laserAct * 0.08 +
          ghostAct * 0.04 +
          paletteVoid * 0.16 +
          stageColorLift * 0.18 +
          shotWorldTakeover * 0.06
      )
      .lerp(
        HOT_MAGENTA,
        0.04 +
          this.sectionChange * 0.04 +
          impactHit * 0.04 +
          atmosphereIonization * 0.04 +
          eclipseAct * 0.08 +
          paletteSolar * 0.12
      )
      .lerp(
        VOLT_VIOLET,
        0.02 +
          phrasePulse * 0.08 +
          ghost * 0.04 +
          ghostAct * 0.1 +
          paletteTron * 0.14
      )
      .lerp(
        MATRIX_GREEN,
        0.04 +
          ghost * 0.08 +
          this.shimmer * 0.06 +
          liquidMatter * 0.04 +
          (1 - this.harmonicColor) * 0.04 +
          matrixAct * 0.1 +
          paletteAcid * 0.22
      )
      .lerp(
        ACID_LIME,
        0.02 +
          this.transientConfidence * 0.04 +
          beatPulse * 0.04 +
          paletteAcid * 0.18
      )
      .lerp(
        COOL_BACKGROUND,
        0.16 +
          plume * 0.28 +
          gasMatter * 0.22 +
          liquidMatter * 0.08 +
          atmosphereResidue * 0.08 +
          ghost * 0.18 +
          ghostChamber * 0.08 +
          portal * 0.12 +
          voidAct * 0.1 +
          ghostAct * 0.08 +
          coolBias * 0.24 +
          spatialPresence * 0.08 +
          worldActivity * 0.06 +
          haunt * 0.08 +
          paletteVoid * 0.16 +
          paletteGhost * 0.08 +
          stageColorLift * 0.32 +
          shotWorldTakeover * 0.12 +
          shotPressure * 0.06
      )
      .lerp(
        TOXIC_PINK,
        0.02 +
          scenePrismatic * 0.14 +
          sceneSolar * 0.08 +
          plasmaMatter * 0.04 +
          paletteSolar * 0.08
      )
      .lerp(
        SOLAR_ORANGE,
        0.01 +
          sceneSolar * 0.1 +
          plasmaMatter * 0.03 +
          detonate * 0.04 +
          haloIgnition * 0.04
      )
      .lerp(
        WARM_BACKGROUND,
        0.012 +
          liquid * 0.04 +
          haloIgnition * 0.04 +
          warmBias * 0.04 +
          detonate * 0.04 +
          paletteSolar * 0.06
      )
      .lerp(
        VOID_BACKGROUND,
        THREE.MathUtils.clamp(
          eclipse * 0.62 +
            collapse * 0.22 +
            collapseWell * 0.22 +
            apertureCage * 0.1 +
            stageSubtractive * 0.12 +
            voidAct * 0.12 +
            gasMatter * 0.06 +
            eclipseAct * 0.08 +
            aftermath * 0.08 +
            this.preDropTension * 0.1 +
            haunt * 0.1 +
            paletteVoid * 0.12 -
            sceneVoid * 0.06 +
            stageColorLift * 0.34 -
            musicStageFloor * 0.18 -
            shotWorldTakeover * 0.12 -
            shotPressure * 0.06,
          0,
          1
        )
      );

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(background);
    }

    this.fogColor
      .copy(background)
      .lerp(
        LASER_CYAN,
        plume * 0.12 +
          gasMatter * 0.12 +
          liquidMatter * 0.04 +
          this.air * 0.08 +
          fieldBloom * 0.06 +
          memoryAfterglow * 0.08 +
          coolBias * 0.12 +
          chromaDrive * 0.04 +
          laserAct * 0.1 +
          chromaWarp * 0.04 +
          paletteVoid * 0.16 +
          paletteGhost * 0.08
      )
      .lerp(
        TRON_BLUE,
        phrasePulse * 0.06 +
          plasmaMatter * 0.04 +
          laserAct * 0.08 +
          matrixAct * 0.06 +
          paletteTron * 0.18 +
          stageColorLift * 0.18
      )
      .lerp(
        HOT_MAGENTA,
        warmBias * 0.03 +
          plasmaMatter * 0.03 +
          this.dropImpact * 0.04 +
          eclipseAct * 0.08 +
          paletteSolar * 0.12
      )
      .lerp(
        CYBER_YELLOW,
        haloIgnition * 0.04 +
          atmosphereIonization * 0.04 +
          detonate * 0.03 +
          matrixPulse * 0.03 +
          paletteSolar * 0.06
      )
      .lerp(
        TOXIC_PINK,
        0.02 + scenePrismatic * 0.12 + sceneSolar * 0.06
      )
      .lerp(
        MATRIX_GREEN,
        matrixPulse * 0.06 +
          liquidMatter * 0.04 +
          (1 - this.harmonicColor) * 0.03 +
          paletteAcid * 0.18 +
          stageColorLift * 0.12
      )
      .lerp(
        VOID_BACKGROUND,
        THREE.MathUtils.clamp(
          collapse * 0.16 +
            atmospherePressure * 0.05 -
            stageColorLift * 0.14 -
            crystalMatter * 0.04,
          0,
          1
        )
      );
    this.fog.density =
      0.042 +
      this.tuning.atmosphere * 0.024 +
      gasMatter * 0.017 +
      liquidMatter * 0.012 +
      atmosphereResidue * 0.011 +
      worldActivity * 0.012 +
      plume * 0.01 +
      fieldBloom * 0.008 +
      spatialPresence * 0.008 +
      eclipse * 0.008 +
      collapseWell * 0.01 +
      aftermath * 0.01 +
      sceneSpectral * 0.008 +
      scenePrismatic * 0.004 +
      portalOpen * 0.006 +
      this.preDropTension * 0.01 +
      this.releaseTail * 0.012 +
      ambientGlow * 0.01 -
      plasmaMatter * 0.01 -
      crystalMatter * 0.008 -
      stageColorLift * 0.012 -
      postContrast * 0.01;

    this.worldSphere.scale.setScalar(
      1 +
        gasMatter * 0.04 +
        liquidMatter * 0.06 +
        plasmaMatter * 0.03 +
        atmospherePressure * 0.03
    );
    this.worldSphere.rotation.y =
      elapsedSeconds *
        (0.012 +
          gasMatter * 0.006 +
          liquidMatter * 0.01 +
          plasmaMatter * 0.008 +
          portal * 0.014 +
          fanSweep * 0.022 +
          cathedral * 0.008 +
          worldActivity * 0.012 +
          gather * 0.01 +
          detonate * 0.026 +
          scenePrismatic * 0.018 +
          sceneStorm * 0.01) +
      this.barPhase * (0.18 + this.preDropTension * 0.12) +
      chamberDrift.x * 0.18 +
      livingField * 0.04 +
      chamberMotion.euler.y * 0.6;
    this.worldSphere.rotation.x =
      Math.sin(elapsedSeconds * 0.08 + this.phrasePhase * Math.PI * 2) *
        (0.04 +
          gasMatter * 0.03 +
          liquidMatter * 0.02 +
          haunt * 0.03 +
          sceneSpectral * 0.04 +
          scenePrismatic * 0.02) +
      chamberDrift.y * 0.22 +
      chamberMotion.euler.x * 0.64;
    this.worldSphere.rotation.z =
      Math.sin(elapsedSeconds * 0.06 + this.barPhase * Math.PI * 2) *
        (0.03 +
          liquidMatter * 0.02 +
          plasmaMatter * 0.02 +
          scenePrismatic * 0.03 +
          sceneSolar * 0.02) +
      chamberMotion.euler.z * 0.54;

    const stainCoolMix = THREE.MathUtils.clamp(
      0.24 + this.harmonicColor * 0.66 + coolBias * 0.24 - warmBias * 0.12,
      0,
      1
    );
    this.worldStainMaterial.color
      .copy(HOT_MAGENTA)
      .lerp(LASER_CYAN, stainCoolMix * (0.5 + coolBias * 0.12 + paletteVoid * 0.18))
      .lerp(TRON_BLUE, phrasePulse * 0.12 + worldStain * 0.08 + laserAct * 0.1 + paletteTron * 0.22)
      .lerp(ACID_LIME, (this.shimmer + textureShimmer) * 0.06 + barPulse * 0.08 + matrixAct * 0.1 + paletteAcid * 0.18)
      .lerp(CYBER_YELLOW, haloIgnition * 0.08 + this.transientConfidence * 0.04 + paletteSolar * 0.06)
      .lerp(SOLAR_ORANGE, haloIgnition * 0.08 + warmBias * 0.06 + detonate * 0.02 + paletteSolar * 0.12)
      .lerp(TOXIC_PINK, scenePrismatic * 0.14 + sceneSolar * 0.06)
      .lerp(ELECTRIC_WHITE, paletteGhost * 0.16 + cueHaunt * 0.08 + cueRelease * 0.04);
    this.worldStainMaterial.opacity = THREE.MathUtils.clamp(
      (ambientGlow *
        (0.0028 +
          worldActivity * 0.0014 +
          fieldBloom * 0.0022 +
          cueResidue * 0.003 +
          cueWorld * 0.0016) +
        eventGlow *
          (worldStain * 0.08 +
            liquidMatter * 0.026 +
            plasmaMatter * 0.032 +
            cueResidue * 0.06 +
            ghostChamber * 0.06 +
            cueWorld * 0.022 +
            aftermath * 0.03 +
            this.releasePulse * 0.012 +
            memoryAfterglow * 0.032 +
            this.sectionChange * 0.04 +
            this.releaseTail * 0.024 +
            this.dropImpact * 0.04 +
            beatPulse * 0.014 +
            chromaWarp * 0.015 +
            scenePrismatic * 0.028 +
            sceneSpectral * 0.03)) *
        this.qualityProfile.auraOpacityMultiplier +
        stageColorLift *
          (0.016 +
            gasMatter * 0.008 +
            crystalMatter * 0.006 +
            chamberPresenceFloor * 0.012 +
            chamberDominanceFloor * 0.012 +
            shotWorldTakeover * 0.014 +
            shotPressure * 0.008),
      0,
      0.42 + scenePrismatic * 0.04
    );
    this.worldStainMaterial.opacity *= THREE.MathUtils.clamp(
      1 -
        shotPressure * 0.1 -
        Math.max(0, this.heroCoverageEstimateCurrent - 0.24) * 0.2 -
        Math.max(0, this.ringBeltPersistenceCurrent - 0.34) * 0.18,
      0.5,
      1
    );
    this.worldStainPlane.rotation.z =
      elapsedSeconds * 0.05 +
      portal * 0.26 +
      worldStain * 0.3 +
      detonate * 0.22 +
      this.sectionChange * 0.18 +
      chamberDrift.x * 0.14 +
      chamberMotion.euler.z * 0.42;
    this.worldStainPlane.position.set(
      chamberDrift.x * 0.36 + chamberMotion.position.x * 0.42,
      chamberDrift.y * 0.28 + chamberMotion.position.y * 0.34,
      -8 + chamberDrift.z * 0.42 + chamberMotion.position.z * 0.38
    );
    this.worldStainPlane.scale.set(
      1.2 +
        portal * 0.32 +
        worldStain * 0.6 +
        stageWipe * 0.22 +
        cueScreen * 0.18 +
        cueResidue * 0.28 +
        this.directorSpectacle * 0.18 +
        worldActivity * 0.22 +
        spatialPresence * 0.16 +
        scenePrismatic * 0.26 +
        this.dropImpact * 0.68,
      1.1 +
        plume * 0.3 +
        worldStain * 0.2 +
        apertureCage * 0.18 +
        cueResidue * 0.16 +
        collapse * 0.16 +
        worldActivity * 0.18 +
        sceneSpectral * 0.18 +
        this.sectionChange * 0.42,
      1
    );

    this.worldFlashMaterial.color
      .copy(ELECTRIC_WHITE)
      .lerp(LASER_CYAN, 0.18 + coolBias * 0.16 + this.shimmer * 0.08 + textureShimmer * 0.06 + paletteVoid * 0.18)
      .lerp(TRON_BLUE, laserAct * 0.14 + paletteTron * 0.2)
      .lerp(HOT_MAGENTA, 0.06 + warmBias * 0.08 + eclipseAct * 0.12 + paletteSolar * 0.14)
      .lerp(CYBER_YELLOW, haloIgnition * 0.1 + beatPulse * 0.04)
      .lerp(ACID_LIME, this.transientConfidence * 0.06 + matrixAct * 0.14 + beatPulse * 0.08 + paletteAcid * 0.16)
      .lerp(TOXIC_PINK, scenePrismatic * 0.12 + sceneSolar * 0.08)
      .lerp(ELECTRIC_WHITE, paletteGhost * 0.14 + cueRupture * 0.08 + cueReveal * 0.04);
    this.worldFlashMaterial.opacity =
      eventGlow *
      (haloIgnition * 0.06 +
        atmosphereIonization * 0.05 +
        atmosphereStructureReveal * 0.034 +
        fanSweep * 0.05 +
        cueScreen * 0.06 +
        cueRupture * 0.05 +
        cueReveal * 0.03 +
        stageFlash * 0.09 +
        impactHit * 0.09 +
        portalOpen * 0.02 +
        collapse * 0.04 +
        this.strikePulse * 0.022 +
        this.dropImpact * (0.1 + beatPulse * 0.05) +
        this.sectionChange * 0.04 +
        scenePrismatic * 0.036 +
        chromaWarp * 0.018 +
        spectralPulse * 0.012);
    this.worldFlashMaterial.opacity *=
      1 - washoutSuppression * 0.34 - peakSpend * 0.08 - restraint * 0.06;
    this.worldFlashMaterial.opacity *= THREE.MathUtils.clamp(
      1 -
        shotPressure * 0.12 -
        Math.max(0, this.heroCoverageEstimateCurrent - 0.24) * 0.18 -
        Math.max(0, this.ringBeltPersistenceCurrent - 0.34) * 0.14,
      0.46,
      1
    );
    this.worldFlashPlane.scale.setScalar(
      1.06 +
        gasMatter * 0.06 +
        liquidMatter * 0.08 +
        plasmaMatter * 0.06 +
        haloIgnition * 0.9 +
        stageWipe * 0.24 +
        cueScreen * 0.34 +
        cueRupture * 0.28 +
        cueWorld * 0.08 +
        collapse * 0.42 +
        idleBreath * 0.04 +
        worldActivity * 0.08 +
        musicPresence * 0.06 +
        this.dropImpact * 0.84 +
        this.sectionChange * 0.38
    );
    this.worldFlashPlane.position.set(
      -chamberDrift.x * 0.24 - chamberMotion.position.x * 0.28,
      chamberDrift.y * 0.18 + chamberMotion.position.y * 0.22,
      -7.8 + chamberDrift.z * 0.28 + chamberMotion.position.z * 0.24
    );

    this.updateAtmosphereLayers(
      elapsedSeconds,
      idleBreath,
      background,
      stageColorLift,
      sceneVariation
    );
  }

  private updateChamber(elapsedSeconds: number, idleBreath: number): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const voidAct = this.actWeights['void-chamber'];
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const ghost = this.familyWeights['ghost-lattice'];
    const storm = this.familyWeights['storm-crown'];
    const eclipse = this.familyWeights['eclipse-chamber'];
    const plume = this.familyWeights['spectral-plume'];
    const portalOpen = this.eventAmount('portal-open');
    const cathedralRise = this.eventAmount('cathedral-rise');
    const haloIgnition = this.eventAmount('halo-ignition');
    const worldActivity = this.directorWorldActivity;
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const chromaWarp = this.directorColorWarp;
    const laserDrive = this.directorLaserDrive;
    const geometryBias = this.directorGeometry;
    const radiance = this.directorRadiance;
    const spectacle = this.directorSpectacle;
    const shellTension = this.shellTension;
    const shellBloom = this.shellBloom;
    const shellOrbit = this.shellOrbit;
    const shellHalo = this.shellHalo;
    const glowOverdrive = this.glowOverdrive;
    const livingField = this.livingField;
    const gasMatter = this.atmosphereGas;
    const liquidMatter = this.atmosphereLiquid;
    const plasmaMatter = this.atmospherePlasma;
    const crystalMatter = this.atmosphereCrystal;
    const atmospherePressure = this.atmospherePressure;
    const atmosphereIonization = this.atmosphereIonization;
    const atmosphereStructureReveal = this.atmosphereStructureReveal;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const roomMusicVisualFloor = this.roomMusicVisualFloor;
    const adaptiveMusicVisualFloor = this.adaptiveMusicVisualFloor;
    const paletteVoid = this.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = this.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = this.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = this.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = this.paletteState === 'ghost-white' ? 1 : 0;
    const cueGather = this.stageCuePlan.family === 'gather' ? 1 : 0;
    const cueReveal = this.stageCuePlan.family === 'reveal' ? 1 : 0;
    const cueRupture = this.stageCuePlan.family === 'rupture' ? 1 : 0;
    const cueRelease = this.stageCuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = this.stageCuePlan.family === 'haunt' ? 1 : 0;
    const apertureCage = this.stageCuePlan.worldMode === 'aperture-cage' ? 1 : 0;
    const fanSweep = this.stageCuePlan.worldMode === 'fan-sweep' ? 1 : 0;
    const cathedralFrame = this.stageCuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const collapseWell = this.stageCuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const ghostChamber = this.stageCuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const fieldBloom = this.stageCuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const ringSuppression = sceneVariation.ringSuppression;
    const portalSuppression = sceneVariation.portalSuppression;
    const latticeBoost = sceneVariation.latticeBoost;
    const beamBoost = sceneVariation.beamBoost;
    const haloBoost = sceneVariation.haloBoost;
    const bladeBoost = sceneVariation.bladeBoost;
    const sweepBoost = sceneVariation.sweepBoost;
    const cueWorld = this.stageCuePlan.worldWeight;
    const cueScreen = this.stageCuePlan.screenWeight;
    const stageSubtractive = this.stageCuePlan.subtractiveAmount;
    const stageWipe = this.stageCuePlan.wipeAmount;
    const ringAuthorityMode = this.stageCuePlan.ringAuthority;
    const washoutSuppression = this.stageCuePlan.washoutSuppression;
    const peakSpend = this.stageCuePlan.spendProfile === 'peak' ? 1 : 0;
    const tempoLock = this.stageAudioFeatures.tempo.lock;
    const tempoDensity = this.stageAudioFeatures.tempo.density;
    const impactBuild = this.stageAudioFeatures.impact.build;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const textureShimmer = this.stageAudioFeatures.texture.shimmer;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const ringEventPlatform = ringAuthorityMode === 'event-platform' ? 1 : 0;
    const ringFrameArchitecture =
      ringAuthorityMode === 'framing-architecture' ? 1 : 0;
    const ringBackground = ringAuthorityMode === 'background-scaffold' ? 1 : 0;
    const shotAnchor = this.stageCompositionPlan.shotClass === 'anchor' ? 1 : 0;
    const shotPressure = this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotAftermath =
      this.stageCompositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate = this.stageCompositionPlan.shotClass === 'isolate' ? 1 : 0;
    const matrixRevealFlow = matrixAct * (cueReveal * 0.82 + cueGather * 0.48);
    const chamberEnvelope = this.stageCompositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberRingOpacityCap = chamberEnvelope.ringOpacityCap;
    const chamberWireDensityCap = chamberEnvelope.wireDensityCap;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(roomMusicVisualFloor, adaptiveMusicVisualFloor);
    const chamberStageLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.36 +
        gasMatter * 0.06 +
        liquidMatter * 0.08 +
        plasmaMatter * 0.08 +
        crystalMatter * 0.1 +
        chamberPresenceFloor * 0.42 +
        chamberDominanceFloor * 0.38 +
        chamberWorldTakeoverBias * 0.34 +
        this.tuning.neonStageFloor * 0.22 +
        this.tuning.worldBootFloor * 0.18,
      0,
      1
    );
    const chamberEmitterFloor =
      0.008 +
      gasMatter * 0.004 +
      liquidMatter * 0.006 +
      plasmaMatter * 0.008 +
      crystalMatter * 0.01 +
      atmosphereIonization * 0.004 +
      chamberPresenceFloor * 0.018 +
      chamberDominanceFloor * 0.016 +
      chamberWorldTakeoverBias * 0.014 +
      musicStageFloor * 0.018 +
      this.tuning.neonStageFloor * 0.012 +
      this.tuning.worldBootFloor * 0.01;
    const chamberDrift = this.organicChamberDrift;
    const shellDrift = this.organicShellDrift;
    const chamberMotion = this.chamberMotionState;
    const gazeX = this.organicGazeDrift.x + this.pointerCurrent.x * 0.18;
    const gazeY = this.organicGazeDrift.y + this.pointerCurrent.y * 0.18;
    const chromaPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 4 + elapsedSeconds * 0.2);
    const laserScan =
      0.5 + 0.5 * Math.sin(elapsedSeconds * (0.34 + laserDrive * 0.28) + this.barPhase * Math.PI * 2);
    const beatPulse = this.beatStrike;
    const phrasePulse = Math.max(
      this.phraseResolve,
      phasePulse(this.phrasePhase, elapsedSeconds * 0.18)
    );
    const barPulse = Math.max(
      this.barTurn,
      phasePulse(this.barPhase, elapsedSeconds * 0.32)
    );

    const chamberBaseYaw =
      elapsedSeconds *
        (0.05 +
          gasMatter * 0.02 +
          liquidMatter * 0.03 +
          plasmaMatter * 0.018 +
          portal * 0.08 +
          fanSweep * 0.12 +
          cathedral * 0.03 +
          shellOrbit * 0.06 +
          worldActivity * 0.07 +
          tempoDensity * 0.04 +
          this.preDropTension * 0.04 +
          this.dropImpact * 0.08) +
      chamberDrift.x * 0.22;
    const chamberBasePitch =
      Math.sin(elapsedSeconds * 0.14) * (0.06 + gasMatter * 0.03) +
      gazeY * 0.04 +
      Math.sin(elapsedSeconds * (0.08 + shellOrbit * 0.08)) * shellBloom * 0.06 +
      worldActivity * 0.04 +
      this.sectionChange * 0.12 +
      chamberDrift.y * 0.22;
    const chamberBaseRoll =
      Math.sin(elapsedSeconds * 0.09 + this.phrasePhase * Math.PI * 2) *
        (0.03 +
          livingField * 0.04 +
          liquidMatter * 0.02 +
          plasmaMatter * 0.02) +
      shellDrift.x * 0.12;
    this.motionBaseQuaternion.setFromEuler(
      this.motionEulerScratch.set(chamberBasePitch, chamberBaseYaw, chamberBaseRoll)
    );
    this.motionCompositeQuaternion
      .copy(this.motionBaseQuaternion)
      .multiply(chamberMotion.quaternion);
    this.chamberGroup.quaternion.copy(this.motionCompositeQuaternion);
    this.chamberGroup.position.x =
      chamberDrift.x * 0.9 + chamberMotion.position.x;
    this.chamberGroup.position.y =
      chamberDrift.y * 0.66 + shellDrift.y * 0.16 + chamberMotion.position.y;
    this.chamberGroup.position.z =
      -shellTension * 0.18 +
      atmospherePressure * -0.08 +
      apertureCage * 0.16 -
      collapseWell * 0.14 +
      shellBloom * 0.1 +
      fieldBloom * 0.08 +
      memoryAfterglow * 0.06 -
      impactHit * 0.04 +
      this.releaseTail * 0.08 -
      this.preDropTension * 0.06 +
      chamberDrift.z * 0.74 +
      chamberMotion.position.z;
    this.chamberGroup.scale.setScalar(
      1 +
        gasMatter * 0.04 +
        liquidMatter * 0.06 +
        plasmaMatter * 0.05 +
        crystalMatter * 0.08 +
        worldActivity * 0.14 +
        portal * 0.06 +
        apertureCage * 0.08 +
        cathedral * 0.08 +
        cathedralFrame * 0.12 +
        cueWorld * 0.08 +
        cueReveal * 0.06 +
        shellBloom * 0.08 +
        cathedralRise * 0.12 -
        stageSubtractive * 0.08 -
        eclipse * 0.04 +
      cueRupture * 0.06 +
      fieldBloom * 0.08 +
      atmosphereStructureReveal * 0.06 +
      this.dropImpact * 0.16 +
      this.sectionChange * 0.12 +
      spatialPresence * 0.08 +
      livingField * 0.04 +
      chamberPresenceFloor * 0.12 +
      chamberDominanceFloor * 0.1 +
      chamberWorldTakeoverBias * 0.08 +
      musicStageFloor * 0.1
    );

    this.chamberRings.forEach((ring, index) => {
      const architectural = portal * 0.42 + cathedral * 0.5 + eclipse * 0.28;
      const ringClock =
        elapsedSeconds *
          (0.12 + shellOrbit * 0.18 + index * 0.015 + this.beatConfidence * 0.04) +
        ring.offset * 1.7 +
        this.barPhase * Math.PI * 2 * (0.24 + index * 0.02);
      const ringPulse = 0.5 + 0.5 * Math.sin(ringClock);
      const motion =
        elapsedSeconds *
        ring.speed *
        (0.28 +
          architectural * 0.8 +
          shellOrbit * 0.2 +
          laserDrive * 0.14 +
          this.preBeatLift * 0.16 +
          this.interBeatFloat * 0.08 +
          this.dropImpact * 0.18);
      const scale =
        1 +
        architectural * (0.22 + index * 0.04) +
        apertureCage * (0.18 + index * 0.06) +
        cathedralFrame * (0.2 + index * 0.04) -
        collapseWell * (0.14 + index * 0.03) +
        shellBloom * (0.08 + index * 0.02) +
        portalOpen * 0.18 +
        cathedralRise * 0.2 +
        worldActivity * (0.08 + index * 0.02) +
        impactBuild * 0.08 +
        this.body * 0.05 +
        this.phraseTension * 0.08 +
        this.dropImpact * 0.14 +
        this.sectionChange * 0.08;
      const thicknessOpacity =
        0.0016 +
        this.roomness * 0.009 +
        worldActivity * 0.01 +
        portal * 0.014 +
        cathedral * 0.015 +
        haloIgnition * 0.024 +
        (this.shimmer + textureShimmer) * 0.008 +
        cathedralRise * 0.02 +
        this.sectionChange * 0.014 +
        tempoLock * 0.008 +
        ringFrameArchitecture * 0.004 +
        ringEventPlatform * 0.003 -
        ringBackground * 0.0024;

      ring.mesh.rotation.set(
        ring.baseRotation.x +
          motion +
          Math.sin(elapsedSeconds * 0.3 + ring.offset + this.barPhase * Math.PI * 2) * 0.08 +
          ringPulse * shellBloom * 0.08,
        ring.baseRotation.y -
          motion * (0.75 + this.dropImpact * 0.14) +
          Math.cos(ringClock * 0.72) * shellTension * 0.1,
        ring.baseRotation.z + motion * 0.52 + Math.sin(ringClock * 0.54) * shellOrbit * 0.12
      );
      ring.mesh.scale.set(
        scale * (1 + ringPulse * shellBloom * 0.06),
        scale * (0.92 + eclipse * 0.08 + shellTension * 0.08 + ringPulse * 0.03),
        1
      );
      ring.mesh.position.x = Math.sin(ringClock * 0.38) * shellOrbit * 0.18 * (0.6 + index * 0.08);
      ring.mesh.position.y = Math.cos(ringClock * 0.46) * shellBloom * 0.12 * (0.5 + index * 0.06);
      ring.mesh.position.z =
        -0.5 -
        index * 0.4 -
        portal * 0.45 -
        apertureCage * 0.24 -
        eclipse * 0.24 -
        collapseWell * 0.42 -
        shellTension * 0.12 +
        ringPulse * shellBloom * 0.08;
      ring.mesh.material.color
        .copy(LASER_CYAN)
        .lerp(TRON_BLUE, 0.16 + coolBias * 0.22 + portal * 0.12 + laserAct * 0.12 + matrixAct * 0.08 + paletteVoid * 0.16 + paletteTron * 0.18)
        .lerp(VOLT_VIOLET, 0.02 + cathedral * 0.03 + phrasePulse * 0.02 + ghostAct * 0.04)
        .lerp(HOT_MAGENTA, 0.02 + this.dropImpact * 0.05 + warmBias * 0.04 + eclipseAct * 0.08 + paletteSolar * 0.12)
        .lerp(ACID_LIME, 0.05 + paletteAcid * 0.22 + this.shimmer * 0.06 + matrixAct * 0.12)
        .lerp(CYBER_YELLOW, shellHalo * 0.06 + glowOverdrive * 0.04 + paletteSolar * 0.1)
        .lerp(ELECTRIC_WHITE, ghost * 0.08 + cathedral * 0.06 + beatPulse * 0.05 + voidAct * 0.06 + ghostAct * 0.08 + paletteGhost * 0.16);
      ring.mesh.material.opacity = THREE.MathUtils.clamp(
        (ambientGlow * thicknessOpacity * 0.92 +
          eventGlow * thicknessOpacity * (0.34 + this.dropImpact * 0.18 + this.sectionChange * 0.1)) *
        (1 +
          Math.max(roomMusicVisualFloor, this.adaptiveMusicVisualFloor) *
            (0.9 + cueGather * 0.2 + cueReveal * 0.3)) *
        (1 + shellHalo * 0.08 + glowOverdrive * 0.06) *
        this.qualityProfile.auraOpacityMultiplier +
        chamberEmitterFloor *
          (0.34 +
            ringFrameArchitecture * 0.14 +
            ringEventPlatform * 0.08 +
            shotWorldTakeover * 0.12 +
            cueReveal * 0.08 +
            cueGather * 0.04),
        0,
        Math.max(
          chamberRingOpacityCap,
          0.12 +
            chamberStageLift * 0.12 +
            shotWorldTakeover * 0.06 +
            ringEventPlatform * 0.04 +
            bladeBoost * 0.03
        )
      );
      ring.mesh.material.opacity *= 1 - ringSuppression * 0.54;
      ring.mesh.material.opacity *=
        1 -
        peakSpend * washoutSuppression * (0.36 + Math.max(0, this.heroScaleCurrent - 1.05) * 0.22);
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          shotPressure * 0.24 -
          shotWorldTakeover * 0.2 -
          shotIsolate * 0.04 -
          cueReveal * 0.08 -
          cueGather * 0.06 -
          matrixRevealFlow * 0.12 -
          Math.max(0, this.heroScaleCurrent - 0.92) * 0.22 -
          Math.max(0, this.ringBeltPersistenceCurrent - 0.24) * 0.44 -
          Math.max(0, this.heroCoverageEstimateCurrent - 0.2) * 0.38,
        0.18,
        1
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          Math.max(0, this.wirefieldDensityScoreCurrent - chamberWireDensityCap) * 0.34 -
          Math.max(0, this.ringBeltPersistenceCurrent - 0.24) * 0.34,
        0.48,
        1
      );
    });

    this.portalRings.forEach((ring, index) => {
      const irisClock =
        elapsedSeconds * (0.16 + shellOrbit * 0.22 + index * 0.03) +
        ring.offset * 1.6 +
        this.phrasePhase * Math.PI * 2;
      const irisPulse = 0.5 + 0.5 * Math.sin(irisClock);
      const open =
        portal * 0.34 +
        portalOpen * 0.7 +
        apertureCage * 0.22 +
        eclipse * 0.22 +
        worldActivity * 0.16 +
        shellBloom * 0.12 +
        this.peakConfidence * 0.08 +
        this.preDropTension * 0.16 +
        this.dropImpact * 0.22;
      const scale =
        ring.baseScale *
        (1 +
          open * (0.3 + index * 0.08) +
          spectacle * 0.08 +
          chromaWarp * 0.06 +
          irisPulse * shellBloom * 0.08);
      ring.mesh.scale.set(
        scale * (1 + shellTension * 0.05 + irisPulse * 0.04),
        scale *
          (0.76 +
            geometryBias * 0.28 +
            shellTension * 0.1 +
            irisPulse * 0.06 -
            apertureCage * 0.18 +
            fanSweep * 0.1),
        1
      );
      ring.mesh.rotation.z =
        elapsedSeconds * (0.08 + index * 0.02 + this.preDropTension * 0.05) +
        ring.offset +
        gazeX * 0.08 +
        this.barPhase * (0.26 + this.dropImpact * 0.18) +
        Math.sin(irisClock * 0.6) * shellOrbit * 0.18 +
        shellDrift.x * 0.16;
      ring.mesh.rotation.x = Math.cos(irisClock * 0.42) * shellTension * 0.1 + shellDrift.y * 0.08;
      ring.mesh.position.x =
        Math.sin(irisClock * 0.34) * shellOrbit * 0.16 * (0.7 + index * 0.12) +
        shellDrift.x * (0.24 + index * 0.05);
      ring.mesh.position.y =
        Math.cos(irisClock * 0.28) * shellBloom * 0.1 * (0.5 + index * 0.08) +
        shellDrift.y * (0.18 + index * 0.04);
      ring.mesh.material.color
        .copy(LASER_CYAN)
        .lerp(TRON_BLUE, coolBias * 0.18 + portal * 0.12 + laserAct * 0.14 + matrixAct * 0.1 + paletteVoid * 0.18 + paletteTron * 0.18)
        .lerp(HOT_MAGENTA, 0.03 + this.harmonicColor * 0.05 + portalOpen * 0.05 + warmBias * 0.05 + eclipseAct * 0.08 + paletteSolar * 0.14)
        .lerp(ACID_LIME, 0.05 + this.shimmer * 0.08 + barPulse * 0.08 + laserScan * 0.08 + irisPulse * 0.04 + matrixAct * 0.14 + paletteAcid * 0.22)
        .lerp(VOLT_VIOLET, phrasePulse * 0.02 + ghostAct * 0.04)
        .lerp(CYBER_YELLOW, shellHalo * 0.08 + glowOverdrive * 0.05 + paletteSolar * 0.1)
        .lerp(ELECTRIC_WHITE, ghost * 0.06 + chromaWarp * 0.04 + glowOverdrive * 0.05 + ghostAct * 0.08 + paletteGhost * 0.16)
        .lerp(MATRIX_GREEN, chromaPulse * 0.06 + paletteAcid * 0.18);
      ring.mesh.material.opacity = THREE.MathUtils.clamp(
        open *
        (ambientGlow * (0.01 + index * 0.004) +
          eventGlow *
            (0.075 +
              index * 0.01 +
              this.dropImpact * 0.06 +
              beatPulse * 0.03 +
              this.sectionChange * 0.03 +
              shellHalo * 0.024 +
              glowOverdrive * 0.026)) *
        this.qualityProfile.auraOpacityMultiplier +
        chamberEmitterFloor *
          (0.42 +
            chamberWorldTakeoverBias * 0.14 +
            cueReveal * 0.12 +
            shotWorldTakeover * 0.1),
        0,
        Math.max(
          chamberRingOpacityCap + 0.08,
          0.18 + chamberStageLift * 0.16 + shotWorldTakeover * 0.08 + haloBoost * 0.03
        )
      );
      ring.mesh.material.opacity *= 1 - (ringSuppression * 0.3 + portalSuppression * 0.38);
      ring.mesh.material.opacity *=
        1 -
        peakSpend * washoutSuppression * (0.42 + Math.max(0, this.heroScaleCurrent - 1) * 0.28);
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          shotPressure * 0.36 -
          shotWorldTakeover * 0.32 -
          shotAnchor * 0.08 -
          cueReveal * 0.12 -
          cueGather * 0.1 -
          fanSweep * 0.08 -
          matrixRevealFlow * 0.16 -
          Math.max(0, this.heroScaleCurrent - 0.88) * 0.3 -
          Math.max(0, this.ringBeltPersistenceCurrent - 0.24) * 0.48 -
          Math.max(0, this.heroCoverageEstimateCurrent - 0.2) * 0.36,
        0.08,
        1
      );
    });

    this.chromaHalos.forEach((halo, index) => {
      const widePulse = pulseShape((this.phrasePhase + index * 0.16) % 1);
      const haloClock =
        elapsedSeconds * (0.1 + shellOrbit * 0.12 + index * 0.02) +
        halo.offset * 1.9 +
        this.barPhase * Math.PI * 2;
      const haloBreath = 0.5 + 0.5 * Math.sin(haloClock);
      const open =
        portal * 0.26 +
        cathedral * 0.24 +
        fieldBloom * 0.18 +
        cathedralRise * 0.34 +
        haloIgnition * 0.38 +
        worldActivity * 0.2 +
        shellHalo * 0.2 +
        this.dropImpact * 0.32 +
        this.sectionChange * 0.22 +
        widePulse * 0.08;
      const scale =
        halo.baseScale *
        (1 +
          open * (0.24 + index * 0.06) +
          spectacle * 0.08 +
          this.preDropTension * 0.08 +
          haloBreath * shellBloom * 0.08);
      halo.mesh.scale.set(
        scale * (1 + haloBreath * shellHalo * 0.08),
        scale * (0.82 + geometryBias * 0.24 + shellTension * 0.08),
        1
      );
      halo.mesh.rotation.z =
        elapsedSeconds * (0.04 + index * 0.015 + this.preDropTension * 0.04) +
        halo.offset +
        this.barPhase * (0.34 + this.dropImpact * 0.18) +
        Math.sin(haloClock * 0.54) * shellOrbit * 0.16;
      halo.mesh.rotation.x =
        Math.sin(elapsedSeconds * 0.08 + halo.offset) * 0.08 +
        Math.cos(haloClock * 0.32) * shellHalo * 0.12;
      halo.mesh.position.z = -0.2 - index * 0.14 + haloBreath * shellBloom * 0.14;
      halo.mesh.material.color
        .copy(LASER_CYAN)
        .lerp(TRON_BLUE, coolBias * 0.2 + portal * 0.08 + laserAct * 0.12 + matrixAct * 0.1 + paletteVoid * 0.18 + paletteTron * 0.18)
        .lerp(VOLT_VIOLET, phrasePulse * 0.02 + cathedral * 0.02 + ghostAct * 0.04)
        .lerp(TOXIC_PINK, this.sectionChange * 0.03 + this.harmonicColor * 0.03 + eclipseAct * 0.08 + paletteSolar * 0.1)
        .lerp(HOT_MAGENTA, this.harmonicColor * 0.05 + warmBias * 0.08 + eclipseAct * 0.1 + paletteSolar * 0.16)
        .lerp(CYBER_YELLOW, haloIgnition * 0.12 + beatPulse * 0.04 + laserScan * 0.04 + glowOverdrive * 0.04 + paletteSolar * 0.06)
        .lerp(ELECTRIC_WHITE, ghost * 0.08 + cathedralRise * 0.06 + chromaWarp * 0.04 + shellHalo * 0.04 + paletteGhost * 0.18)
        .lerp(MATRIX_GREEN, chromaPulse * 0.08 + matrixAct * 0.14 + paletteAcid * 0.18);
      halo.mesh.material.opacity = THREE.MathUtils.clamp(
        open *
        (ambientGlow * (0.008 + index * 0.003 + radiance * 0.004) +
          eventGlow *
            (0.046 +
              this.dropImpact * 0.05 +
              this.sectionChange * 0.03 +
              chromaWarp * 0.018 +
              shellHalo * 0.03 +
              glowOverdrive * 0.022 +
              haloBoost * 0.03 +
              sweepBoost * 0.014)) *
        this.qualityProfile.auraOpacityMultiplier +
        chamberEmitterFloor *
          (0.38 +
            chamberWorldTakeoverBias * 0.12 +
            cueReveal * 0.1 +
            shotWorldTakeover * 0.1),
        0,
        0.16 + chamberStageLift * 0.14 + shotWorldTakeover * 0.06 + haloBoost * 0.04
      );
      halo.mesh.material.opacity *= 1 + haloBoost * 0.26;
      halo.mesh.material.opacity *=
        1 -
        peakSpend * washoutSuppression * (0.24 + Math.max(0, this.heroScaleCurrent - 1.08) * 0.18);
      halo.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          shotWorldTakeover * 0.12 -
          shotPressure * 0.08 -
          cueReveal * 0.06 -
          Math.max(0, this.heroScaleCurrent - 1.02) * 0.1 -
          Math.max(0, this.ringBeltPersistenceCurrent - 0.28) * 0.24 -
          Math.max(0, this.heroCoverageEstimateCurrent - 0.24) * 0.2,
        0.34,
        1
      );
    });

    this.ghostLattice.rotation.y = elapsedSeconds * (0.05 + ghost * 0.12);
    this.ghostLattice.rotation.x = Math.sin(elapsedSeconds * 0.11) * 0.18 + chamberDrift.y * 0.2;
    this.ghostLattice.position.set(
      chamberDrift.x * 0.42,
      chamberDrift.y * 0.26,
      chamberDrift.z * 0.32
    );
    this.ghostLattice.scale.setScalar(
      1 +
        ghost * 0.18 +
        ghostChamber * 0.28 +
        eclipse * 0.08 +
        this.releasePulse * 0.16 +
        worldActivity * 0.12 +
        this.releaseTail * 0.18
    );
    this.ghostLattice.children.forEach((child, index) => {
      child.rotation.y = elapsedSeconds * (0.08 + index * 0.03);
      child.rotation.z = elapsedSeconds * (0.05 + index * 0.02);
      child.position.z = -0.4 - index * 0.36 - eclipse * 0.3;
    });
    this.latticeMaterials.forEach((material, index) => {
      material.color
        .copy(ELECTRIC_WHITE)
        .lerp(LASER_CYAN, plume * 0.18 + index * 0.04 + coolBias * 0.14 + voidAct * 0.06 + paletteVoid * 0.16)
        .lerp(VOLT_VIOLET, phrasePulse * 0.02 + ghost * 0.04 + ghostAct * 0.06)
        .lerp(HOT_MAGENTA, warmBias * 0.04 + this.releaseTail * 0.03 + eclipseAct * 0.08 + paletteSolar * 0.08)
        .lerp(ACID_LIME, this.shimmer * 0.05 + this.transientConfidence * 0.04 + matrixAct * 0.08 + paletteAcid * 0.12);
      material.opacity =
        (ambientGlow *
          (ghost * 0.022 +
            ghostChamber * 0.024 +
            eclipse * 0.01 +
            plume * 0.008 +
            worldActivity * 0.008 +
            latticeBoost * 0.016) +
          eventGlow *
            (this.releasePulse * 0.038 +
              cueHaunt * 0.04 +
              this.sectionChange * 0.018 +
              this.releaseTail * 0.024 +
              latticeBoost * 0.032)) *
        (1 - index * 0.12);
      material.opacity *= 1 + latticeBoost * 0.48;
      material.opacity *= THREE.MathUtils.clamp(
        1 -
          laserAct * 0.12 -
          cueReveal * 0.16 -
          cueGather * 0.1 -
          shotPressure * 0.22 -
          shotWorldTakeover * 0.28 -
          shotAnchor * 0.06 -
          shotAftermath * 0.04,
        cueHaunt > 0.5 ? 0.46 : 0.18,
        1
      );
    });

    const laserPulse =
      beatPulse * 0.12 +
      this.transientConfidence * 0.06 +
      this.shimmer * 0.04 +
      this.dropImpact * 0.18 +
      this.sectionChange * 0.12 +
      portalOpen * 0.1 +
      haloIgnition * 0.08;
    this.laserGroup.rotation.z =
      Math.sin(elapsedSeconds * 0.1 + this.barPhase * Math.PI * 2) * 0.12 +
      gazeX * 0.05 +
      chamberDrift.x * 0.08;
    this.laserGroup.rotation.y =
      elapsedSeconds * (0.02 + portal * 0.04 + worldActivity * 0.05) +
      shellDrift.z * 0.14;

    this.laserBeams.forEach((beam, index) => {
      const beamActivation = THREE.MathUtils.clamp(
        cueReveal * 0.42 +
          cueRupture * 0.36 +
          fanSweep * 0.42 +
          shotWorldTakeover * 0.28 +
          shotPressure * 0.1 +
          portalOpen * 0.16 +
          this.dropImpact * 0.18 +
          this.sectionChange * 0.12 +
          laserAct * 0.16,
        0,
        1.4
      );
      const phase =
        elapsedSeconds * (0.22 + portal * 0.14 + laserDrive * 0.12 + chromaWarp * 0.06) +
        beam.offset +
        this.barPhase * Math.PI * 2;
      const sweep =
        Math.sin(phase) * (0.18 + portal * 0.24 + this.preDropTension * 0.08) +
        Math.sin(elapsedSeconds * 0.32 + beam.offset) * 0.08 +
        beam.side * fanSweep * (0.22 + index * 0.01);
      const lift =
        Math.sin(elapsedSeconds * 0.18 + beam.offset * 0.8) *
        (0.18 + worldActivity * 0.26 + cathedral * 0.08);
      const width =
        1 +
        laserPulse * (2.2 + index * 0.06) +
        fanSweep * 0.8 +
        radiance * 0.48 +
        shellHalo * 0.18 +
        portalOpen * 0.4 +
        this.dropImpact * 0.4 +
        chromaWarp * 0.3 +
        beamBoost * 0.72;
      const length =
        0.8 +
        worldActivity * 0.4 +
        portal * 0.4 +
        cathedral * 0.24 +
        shellOrbit * 0.18 +
        this.preDropTension * 0.24 +
        this.dropImpact * 0.42 +
        this.sectionChange * 0.18 +
        beamBoost * 0.34;

      beam.mesh.position.x =
        Math.sin(phase * 0.7) * beam.spread * (0.9 + worldActivity * 1.4 + portal * 0.9);
      beam.mesh.position.y = lift;
      beam.mesh.position.z = beam.depth - portal * 0.8 - cathedral * 0.3 - this.dropImpact * 0.4;
      beam.mesh.rotation.set(
        beam.baseRotation.x + lift * 0.06 + gazeY * 0.04 + shellDrift.y * 0.08,
        beam.baseRotation.y + sweep * 0.3 + beam.side * this.preDropTension * 0.12,
        beam.baseRotation.z + sweep + beam.side * this.sectionChange * 0.22
      );
      beam.mesh.scale.set(width, length, 1);
      beam.mesh.material.color
        .copy(index % 3 === 0 ? LASER_CYAN : index % 3 === 1 ? HOT_MAGENTA : ACID_LIME)
        .lerp(TRON_BLUE, coolBias * 0.18 + portal * 0.12 + laserAct * 0.14 + matrixAct * 0.1 + paletteVoid * 0.14 + paletteTron * 0.18)
        .lerp(VOLT_VIOLET, phrasePulse * 0.03 + cathedral * 0.02 + ghostAct * 0.04)
        .lerp(TOXIC_PINK, this.harmonicColor * 0.04 + warmBias * 0.05 + eclipseAct * 0.1 + paletteSolar * 0.12)
        .lerp(CYBER_YELLOW, haloIgnition * 0.14 + beatPulse * 0.08 + laserScan * 0.06 + paletteSolar * 0.06)
        .lerp(ELECTRIC_WHITE, this.dropImpact * 0.08 + this.sectionChange * 0.06 + chromaWarp * 0.06 + ghostAct * 0.08 + paletteGhost * 0.12)
        .lerp(MATRIX_GREEN, chromaPulse * 0.08 + matrixAct * 0.12 + paletteAcid * 0.18);
      beam.mesh.material.opacity = THREE.MathUtils.clamp(
        (ambientGlow * (0.0018 + worldActivity * 0.003 + radiance * 0.002) +
          eventGlow *
            beamActivation *
            (laserPulse * (0.11 + index * 0.005) +
              fanSweep * 0.06 +
              cueReveal * 0.08 +
              cueRupture * 0.06 +
              cueGather * 0.01 +
              beamBoost * 0.04 +
              chromaWarp * 0.02 +
              this.dropImpact * 0.04 +
              shotWorldTakeover * 0.08 +
              shotPressure * 0.02 +
              this.sectionChange * 0.02)) *
        (1 +
          Math.max(roomMusicVisualFloor, this.adaptiveMusicVisualFloor) *
            (1.12 + cueGather * 0.12 + cueReveal * 0.26 + fanSweep * 0.2)) *
        this.qualityProfile.auraOpacityMultiplier +
        chamberEmitterFloor *
          (0.42 +
            chamberWorldTakeoverBias * 0.14 +
            cueReveal * 0.16 +
            shotWorldTakeover * 0.18 +
            shotPressure * 0.04),
        0,
        0.18 +
          chamberStageLift * 0.16 +
          shotWorldTakeover * 0.1 +
          cueReveal * 0.08 +
          beamBoost * 0.04
      );
      beam.mesh.material.opacity *= 1 + beamBoost * 0.18;
      beam.mesh.material.opacity *= THREE.MathUtils.clamp(
        0.26 + beamActivation * 0.94,
        0.18,
        1
      );
      beam.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          Math.max(0, this.wirefieldDensityScoreCurrent - chamberWireDensityCap) * 0.22 -
          Math.max(0, this.ringBeltPersistenceCurrent - 0.24) * 0.26 -
          Math.max(0, this.heroCoverageEstimateCurrent - 0.2) * 0.18,
        0.42,
        1
      );
    });

    this.chamberGroup.position.x +=
      Math.sin(elapsedSeconds * (0.16 + sweepBoost * 0.08)) *
      (0.06 + bladeBoost * 0.08 + sweepBoost * 0.06);
    this.chamberGroup.position.y +=
      Math.sin(elapsedSeconds * (0.2 + sweepBoost * 0.06)) *
      (0.08 + haloBoost * 0.06) *
      idleBreath;
    this.chamberGroup.position.z +=
      -storm * 0.04 -
      apertureCage * 0.06 -
      eclipse * 0.05 -
      collapseWell * 0.08 +
      worldActivity * 0.04 -
      this.preDropTension * 0.06 +
      cueRelease * 0.03 +
      this.releaseTail * 0.04 -
      sceneVariation.postContrastBoost * 0.04;

    this.updateStageFrame(elapsedSeconds, idleBreath);
  }

  private updateStageFrame(elapsedSeconds: number, idleBreath: number): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const cueGather = this.stageCuePlan.family === 'gather' ? 1 : 0;
    const cueReveal = this.stageCuePlan.family === 'reveal' ? 1 : 0;
    const cueRupture = this.stageCuePlan.family === 'rupture' ? 1 : 0;
    const cueRelease = this.stageCuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = this.stageCuePlan.family === 'haunt' ? 1 : 0;
    const cueReset = this.stageCuePlan.family === 'reset' ? 1 : 0;
    const heroDominant = this.stageCuePlan.dominance === 'hero' ? 1 : 0;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure = this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotAftermath = this.stageCompositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate = this.stageCompositionPlan.shotClass === 'isolate' ? 1 : 0;
    const transitionCollapse =
      this.stageCompositionPlan.transitionClass === 'collapse' ? 1 : 0;
    const transitionWipe =
      this.stageCompositionPlan.transitionClass === 'wipe' ? 1 : 0;
    const transitionBlackout =
      this.stageCompositionPlan.transitionClass === 'blackoutCut' ? 1 : 0;
    const transitionResidue =
      this.stageCompositionPlan.transitionClass === 'residueDissolve' ? 1 : 0;
    const matrixAct = this.actWeights['matrix-storm'];
    const apertureCage = this.stageCuePlan.worldMode === 'aperture-cage' ? 1 : 0;
    const fanSweep = this.stageCuePlan.worldMode === 'fan-sweep' ? 1 : 0;
    const cathedralFrame = this.stageCuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const collapseWell = this.stageCuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const ghostChamber = this.stageCuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const fieldBloom = this.stageCuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const matrixRevealFlow = matrixAct * (cueReveal * 0.82 + cueGather * 0.48);
    const cueScreen = this.stageCuePlan.screenWeight;
    const cueResidue = this.stageCuePlan.residueWeight;
    const stageFlash = this.stageCuePlan.flashAmount;
    const stageWipe = this.stageCuePlan.wipeAmount;
    const stageSubtractive = this.stageCuePlan.subtractiveAmount;
    const subtractivePolicy = this.stageCompositionPlan.subtractivePolicy;
    const washoutSuppression = this.stageCuePlan.washoutSuppression;
    const peakSpend = this.stageCuePlan.spendProfile === 'peak' ? 1 : 0;
    const chamberEnvelope = this.stageCompositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(
      this.roomMusicVisualFloor,
      this.adaptiveMusicVisualFloor
    );
    const chamberStageLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.32 +
        chamberPresenceFloor * 0.34 +
        chamberDominanceFloor * 0.28 +
        chamberWorldTakeoverBias * 0.24 +
        this.tuning.neonStageFloor * 0.18,
      0,
      1
    );
    const tempoDensity = this.stageAudioFeatures.tempo.density;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const restraint = this.stageAudioFeatures.stability.restraint;
    const worldActivity = this.directorWorldActivity;
    const gazeX = this.organicGazeDrift.x + this.pointerCurrent.x * 0.12;
    const gazeY = this.organicGazeDrift.y + this.pointerCurrent.y * 0.12;
    const beatPulse = onsetPulse(this.beatPhase);
    const phrasePulse = Math.max(
      this.phraseResolve,
      phasePulse(this.phrasePhase, elapsedSeconds * 0.24)
    );
    const bladeBoost = sceneVariation.bladeBoost;
    const sweepBoost = sceneVariation.sweepBoost;
    const frameTint = new THREE.Color()
      .copy(BASE_BACKGROUND)
      .lerp(
        COOL_BACKGROUND,
        0.42 +
          fieldBloom * 0.12 +
          cueHaunt * 0.08 +
          spatialPresence * 0.08 +
          chamberStageLift * 0.16
      )
      .lerp(
        TRON_BLUE,
        0.04 +
          cueReveal * 0.08 +
          chamberStageLift * 0.18 +
          shotWorldTakeover * 0.08
      )
      .lerp(TOXIC_PINK, sceneVariation.prismaticProfile * 0.12)
      .lerp(
        VOID_BACKGROUND,
        THREE.MathUtils.clamp(
          0.28 + cueGather * 0.12 + collapseWell * 0.16 - chamberStageLift * 0.18,
          0,
          1
        )
      )
      .lerp(STAIN_VIOLET, cueHaunt * 0.08 + cueResidue * 0.06 + memoryAfterglow * 0.08);

    this.stageFrameGroup.rotation.z =
      Math.sin(elapsedSeconds * 0.08 + this.barPhase * Math.PI * 2) * 0.01 +
      cueReveal * 0.012 +
      spatialPresence * 0.008 +
      tempoDensity * 0.006 -
      cueGather * 0.01;

    this.stageBlades.forEach((blade, index) => {
      const axisBias = blade.axis === 'x' ? 1 : 0.82;
      const clampAmount =
        apertureCage * 1.26 +
        cueGather * 0.88 +
        collapseWell * 1.14 +
        cueRupture * 0.36 +
        stageSubtractive * 0.42 +
        subtractivePolicy.apertureClamp * 0.8 +
        transitionCollapse * 0.22 +
        transitionBlackout * 0.18 +
        shotWorldTakeover * 0.24 +
        shotIsolate * 0.18 -
        restraint * 0.16 -
        cueRelease * 0.38 -
        cueReset * 0.3;
      const sweepBias =
        fanSweep * 0.82 +
        cathedralFrame * 0.68 +
        cueReveal * 0.44 +
        transitionWipe * 0.2 +
        subtractivePolicy.wipeBias * 0.36 -
        cueHaunt * 0.18;
      const offset =
        blade.baseOffset -
        clampAmount * (blade.axis === 'x' ? 1.8 : 1.1) +
        sweepBias * (blade.axis === 'x' ? 0.6 : 0.4);
      const drift =
        Math.sin(elapsedSeconds * (0.16 + index * 0.03) + blade.side * 0.7) *
        (0.06 + cueResidue * 0.08 + cueHaunt * 0.04);

      blade.mesh.material.color
        .copy(frameTint)
        .lerp(COOL_BACKGROUND, cueReveal * 0.12 + fanSweep * 0.08 + chamberStageLift * 0.08)
        .lerp(LASER_CYAN, 0.03 + chamberStageLift * 0.14 + cueReveal * 0.12 + fanSweep * 0.1)
        .lerp(TOXIC_PINK, sceneVariation.prismaticProfile * 0.1 + sceneVariation.solarProfile * 0.04)
        .lerp(VOID_BACKGROUND, collapseWell * 0.2 + cueGather * 0.1 - chamberStageLift * 0.08);
      blade.mesh.material.opacity = THREE.MathUtils.clamp(
        0.008 +
          chamberPresenceFloor * 0.022 +
          chamberWorldTakeoverBias * 0.018 +
          axisBias *
            (apertureCage * 0.12 +
              cueGather * 0.09 +
              collapseWell * 0.1 +
              cueRupture * 0.04 +
              cueHaunt * 0.028 +
              cueScreen * 0.028 +
              cueResidue * 0.028 +
              impactHit * 0.02 +
              stageSubtractive * 0.04 +
              subtractivePolicy.blackoutBias * 0.04 +
              bladeBoost * 0.05 +
              shotWorldTakeover * 0.03 +
              shotIsolate * 0.02) -
          matrixRevealFlow * 0.04 -
          cueRelease * 0.05 -
          cueReset * 0.06 -
          shotAftermath * 0.02,
        0,
        0.18 +
          shotPressure * 0.02 +
          shotWorldTakeover * 0.04 -
          matrixRevealFlow * 0.04 -
          chamberStageLift * -0.04 -
          bladeBoost * 0.02 -
          peakSpend * washoutSuppression * 0.05
      );

      if (blade.axis === 'x') {
        blade.mesh.position.x = blade.side * offset + drift;
        blade.mesh.position.y = gazeY * 0.12;
      } else {
        blade.mesh.position.x = gazeX * 0.1;
        blade.mesh.position.y = blade.side * offset + drift * 0.6;
      }
      blade.mesh.position.z =
        -0.2 +
        cueGather * 0.08 -
        cueRelease * 0.04 +
        cueHaunt * 0.06 +
        ghostChamber * 0.08;
      blade.mesh.rotation.z =
        blade.side *
        (fanSweep * 0.08 +
          cathedralFrame * 0.05 +
          collapseWell * 0.1 -
          cueGather * 0.04 +
          drift * 0.08);
      blade.mesh.scale.set(
        1 +
          collapseWell * 0.12 +
        cueRupture * 0.08 +
        cueHaunt * 0.06 +
        memoryAfterglow * 0.08 +
        worldActivity * 0.04 +
        bladeBoost * 0.1 +
        shotWorldTakeover * 0.08,
      1 +
          cueGather * 0.08 +
          cueHaunt * 0.1 +
          spatialPresence * 0.08 +
          sweepBoost * 0.08 +
          idleBreath * 0.02,
        1
      );
    });

    this.stageSweepPlanes.forEach((plane, index) => {
      const sweepTravel =
        fanSweep * 3.6 +
        cueReveal * 2.2 +
        stageWipe * 1.8 +
        cueRupture * 0.4 +
        transitionWipe * 0.8 +
        subtractivePolicy.wipeBias * 1.4;
      const wave = Math.sin(
        elapsedSeconds * (0.32 + cueReveal * 0.12 + fanSweep * 0.18) +
          index * 1.7 +
          this.barPhase * Math.PI * 2
      );
      plane.mesh.material.color
        .copy(index === 0 ? LASER_CYAN : HOT_MAGENTA)
        .lerp(TRON_BLUE, fieldBloom * 0.18 + cueReveal * 0.1 + chamberStageLift * 0.14)
        .lerp(ACID_LIME, fanSweep * 0.18 + this.transientConfidence * 0.08 + chamberStageLift * 0.08)
        .lerp(TOXIC_PINK, sceneVariation.prismaticProfile * 0.14 + sceneVariation.solarProfile * 0.06)
        .lerp(ELECTRIC_WHITE, cueRupture * 0.05 + stageFlash * 0.04 + beatPulse * 0.03)
        .lerp(GHOST_PALE, cueHaunt * 0.12 + cueResidue * 0.08);
      plane.mesh.material.opacity = THREE.MathUtils.clamp(
        chamberPresenceFloor * 0.014 +
          chamberWorldTakeoverBias * 0.01 +
          cueReveal * 0.026 +
          fanSweep * 0.036 +
          stageWipe * 0.026 +
        cueRupture * 0.008 +
          cueHaunt * 0.01 +
          cueResidue * 0.014 +
          impactHit * 0.008 +
          sweepBoost * 0.012 +
          stageFlash * 0.012 -
        heroDominant * 0.02 -
        cueReset * 0.04 -
        shotWorldTakeover * 0.004 -
        shotAftermath * 0.01 +
        transitionResidue * 0.01,
        0,
        0.09 +
          shotWorldTakeover * 0.014 +
          shotPressure * 0.006 -
          sweepBoost * 0.024 -
          chamberStageLift * -0.028 -
          washoutSuppression * 0.03 -
          peakSpend * 0.016
      );
      plane.mesh.position.x =
        plane.side *
          (plane.baseOffset -
            sweepTravel -
            wave * (0.6 + fanSweep * 0.7 + cueReveal * 0.4)) +
        gazeX * 0.2;
      plane.mesh.position.y =
        gazeY * 0.18 +
        Math.cos(elapsedSeconds * 0.18 + index * 1.2) * (0.12 + cueHaunt * 0.18);
      plane.mesh.position.z = -0.4 + cueRupture * 0.08 + cueHaunt * 0.1;
      plane.mesh.rotation.z =
        plane.tilt +
        plane.side * (fanSweep * 0.14 + cueReveal * 0.08 + cueRupture * 0.06) +
        wave * 0.03;
      plane.mesh.rotation.x = cueHaunt * 0.08 - cueReveal * 0.04;
      plane.mesh.scale.set(
        1 +
          fanSweep * 0.14 +
          cueReveal * 0.1 +
          spatialPresence * 0.08 +
          sweepBoost * 0.12 +
          cueRupture * 0.04 +
          cueHaunt * 0.04,
      1 +
          cueHaunt * 0.1 +
          cueResidue * 0.08 +
          memoryAfterglow * 0.12 +
          sweepBoost * 0.08 +
          phrasePulse * 0.04,
        1
      );
    });
  }

  private updateHero(elapsedSeconds: number, idleBreath: number): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const voidAct = this.actWeights['void-chamber'];
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const liquid = this.familyWeights['liquid-pressure-core'];
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const ghost = this.familyWeights['ghost-lattice'];
    const storm = this.familyWeights['storm-crown'];
    const eclipse = this.familyWeights['eclipse-chamber'];
    const plume = this.familyWeights['spectral-plume'];
    const portalOpen = this.eventAmount('portal-open');
    const collapse = this.eventAmount('singularity-collapse');
    const twinSplit = this.eventAmount('twin-split');
    const haloIgnition = this.eventAmount('halo-ignition');
    const ghostAfterimage = this.eventAmount('ghost-afterimage');
    const worldActivity = this.directorWorldActivity;
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const geometryBias = this.directorGeometry;
    const radiance = this.directorRadiance;
    const chromaWarp = this.directorColorWarp;
    const shellTension = this.shellTension;
    const shellBloom = this.shellBloom;
    const shellOrbit = this.shellOrbit;
    const shellHalo = this.shellHalo;
    const glowOverdrive = this.glowOverdrive;
    const livingField = this.livingField;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const paletteTargets = this.stageCuePlan.paletteTargets;
    const paletteVoidTarget = paletteTargets['void-cyan'];
    const paletteTronTarget = paletteTargets['tron-blue'];
    const paletteAcidTarget = paletteTargets['acid-lime'];
    const paletteSolarTarget = paletteTargets['solar-magenta'];
    const paletteGhostTarget = paletteTargets['ghost-white'];
    const paletteTargetDominance = Math.max(
      paletteVoidTarget,
      paletteTronTarget,
      paletteAcidTarget,
      paletteSolarTarget,
      paletteGhostTarget
    );
    const paletteSpread = 1 - paletteTargetDominance;
    const paletteVoid = this.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = this.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = this.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = this.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = this.paletteState === 'ghost-white' ? 1 : 0;
    const sceneVoid = sceneVariation.voidProfile;
    const sceneSpectral = sceneVariation.spectralProfile;
    const sceneStorm = sceneVariation.stormProfile;
    const sceneSolar = sceneVariation.solarProfile;
    const scenePrismatic = sceneVariation.prismaticProfile;
    const heroRoamBoost = sceneVariation.heroRoamBoost;
    const shotAnchor = this.stageCompositionPlan.shotClass === 'anchor' ? 1 : 0;
    const shotPressure = this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotRupture = this.stageCompositionPlan.shotClass === 'rupture' ? 1 : 0;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotAftermath = this.stageCompositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate = this.stageCompositionPlan.shotClass === 'isolate' ? 1 : 0;
    const fallbackDemoteHero =
      this.stageCompositionPlan.fallbackDemoteHero ? 1 : 0;
    const fallbackForceWorldTakeover =
      this.stageCompositionPlan.fallbackForceWorldTakeover ? 1 : 0;
    const cadenceSurge =
      this.stageCompositionPlan.tempoCadenceMode === 'surge' ? 1 : 0;
    const cadenceDriving =
      this.stageCompositionPlan.tempoCadenceMode === 'driving' ? 1 : 0;
    const cadenceAftermath =
      this.stageCompositionPlan.tempoCadenceMode === 'aftermath' ? 1 : 0;
    const chamberDominance = this.stageCuePlan.dominance === 'chamber' ? 1 : 0;
    const worldDominance = this.stageCuePlan.dominance === 'world' ? 1 : 0;
    const hybridDominance = this.stageCuePlan.dominance === 'hybrid' ? 1 : 0;
    const broodFamily = this.stageCuePlan.family === 'brood' ? 1 : 0;
    const gatherFamily = this.stageCuePlan.family === 'gather' ? 1 : 0;
    const revealFamily = this.stageCuePlan.family === 'reveal' ? 1 : 0;
    const ruptureFamily = this.stageCuePlan.family === 'rupture' ? 1 : 0;
    const releaseFamily = this.stageCuePlan.family === 'release' ? 1 : 0;
    const hauntFamily = this.stageCuePlan.family === 'haunt' ? 1 : 0;
    const resetFamily = this.stageCuePlan.family === 'reset' ? 1 : 0;
    const compressIntent = this.stageCuePlan.transformIntent === 'compress' ? 1 : 0;
    const openIntent = this.stageCuePlan.transformIntent === 'open' ? 1 : 0;
    const collapseIntent = this.stageCuePlan.transformIntent === 'collapse' ? 1 : 0;
    const sweepIntent = this.stageCuePlan.transformIntent === 'sweep' ? 1 : 0;
    const exhaleIntent = this.stageCuePlan.transformIntent === 'exhale' ? 1 : 0;
    const clearIntent = this.stageCuePlan.transformIntent === 'clear' ? 1 : 0;
    const heroPlanWeight = this.stageCuePlan.heroWeight;
    const heroScaleBias = this.stageCuePlan.heroScaleBias;
    const heroAnchor = this.resolveHeroAnchorOffsets(
      this.stageCuePlan.heroAnchorLane,
      this.stageCuePlan.heroAnchorStrength
    );
    const heroStageX = THREE.MathUtils.clamp(
      this.stageCuePlan.heroStageX + heroAnchor.x,
      -1,
      1
    );
    const heroStageY = THREE.MathUtils.clamp(
      this.stageCuePlan.heroStageY + heroAnchor.y,
      -1,
      1
    );
    const heroDepthBias = this.stageCuePlan.heroDepthBias;
    const heroMotionBias = this.stageCuePlan.heroMotionBias;
    const heroMorphBias = this.stageCuePlan.heroMorphBias;
    const heroScaleMin = this.stageCuePlan.heroScaleMin;
    const heroScaleMax = this.stageCuePlan.heroScaleMax;
    const washoutSuppression = this.stageCuePlan.washoutSuppression;
    const heroEnvelope = this.stageCompositionPlan.heroEnvelope;
    const laneStageX = THREE.MathUtils.clamp(
      (heroEnvelope.laneTargetX - 0.5) * 2,
      -1,
      1
    );
    const laneStageY = THREE.MathUtils.clamp(
      (0.5 - heroEnvelope.laneTargetY) * 2,
      -1,
      1
    );
    const stageTourBlend = THREE.MathUtils.clamp(
      0.42 +
        heroMotionBias * 0.28 +
        heroEnvelope.driftAllowance * 0.86 +
        heroRoamBoost * 0.24 +
        (this.stageCompositionPlan.eventScale === 'stage'
          ? 0.12
          : this.stageCompositionPlan.eventScale === 'phrase'
            ? 0.06
            : 0),
      0.28,
      0.92
    );
    const heroTravelStageX = THREE.MathUtils.lerp(
      heroStageX,
      laneStageX,
      stageTourBlend
    ) * (1 + heroRoamBoost * 0.18);
    const heroTravelStageY = THREE.MathUtils.lerp(
      heroStageY,
      laneStageY,
      stageTourBlend
    ) * (1 + heroRoamBoost * 0.12);
    const withheldSpend = this.stageCuePlan.spendProfile === 'withheld' ? 1 : 0;
    const earnedSpend = this.stageCuePlan.spendProfile === 'earned' ? 1 : 0;
    const peakSpend = this.stageCuePlan.spendProfile === 'peak' ? 1 : 0;
    const tempoDensity = this.stageAudioFeatures.tempo.density;
    const impactBuild = this.stageAudioFeatures.impact.build;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const restraint = this.stageAudioFeatures.stability.restraint;
    const heroDrift = this.organicHeroDrift;
    const shellDrift = this.organicShellDrift;
    const heroMotion = this.heroMotionState;
    const gazeX = this.organicGazeDrift.x + this.pointerCurrent.x * 0.18;
    const gazeY = this.organicGazeDrift.y + this.pointerCurrent.y * 0.18;
    const chromaPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 4 + elapsedSeconds * 0.18);
    const beatPulse = this.beatStrike;
    const phrasePulse = Math.max(
      this.phraseResolve,
      phasePulse(this.phrasePhase, elapsedSeconds * 0.22 + 0.7)
    );
    const dropPulse = this.dropImpact * (0.58 + beatPulse * 0.22);
    const membraneClock =
      elapsedSeconds * (0.22 + shellOrbit * 0.24 + this.directorLaserDrive * 0.06) +
      this.phrasePhase * Math.PI * 2;
    const membranePulse = 0.5 + 0.5 * Math.sin(membraneClock);
    const crownClock =
      elapsedSeconds * (0.34 + shellOrbit * 0.28 + this.preDropTension * 0.08) +
      this.barPhase * Math.PI * 2;
    const crownPulse = 0.5 + 0.5 * Math.sin(crownClock);
    const ghostClock =
      elapsedSeconds * (0.16 + shellOrbit * 0.14) +
      this.releaseTail * Math.PI * 2;
    const ghostPulse = 0.5 + 0.5 * Math.sin(ghostClock);
    const prismaticDrive = THREE.MathUtils.clamp(
      paletteSpread * 1.08 +
        revealFamily * 0.16 +
        ruptureFamily * 0.12 +
        this.sectionChange * 0.18 +
        this.harmonicColor * 0.1 +
        heroMorphBias * 0.12 +
        geometryBias * 0.1,
      0,
      1.4
    );
    const plannedHeroForm = this.stageCuePlan.heroForm;
    const plannedHeroAccentForm = this.stageCuePlan.heroAccentForm;
    const heroFormScores: Record<StageHeroForm, number> = {
      orb:
        0.12 +
        broodFamily * 0.24 +
        voidAct * 0.18 +
        paletteVoidTarget * 0.2 +
        sceneVoid * 0.16 +
        sceneSpectral * 0.08 +
        worldDominance * 0.08 +
        restraint * 0.08 +
        (plannedHeroForm === 'orb' ? 0.42 : 0) +
        (plannedHeroAccentForm === 'orb' ? 0.12 : 0),
      cube:
        0.08 +
        matrixAct * 0.28 +
        paletteTronTarget * 0.22 +
        sceneStorm * 0.14 +
        compressIntent * 0.18 +
        gatherFamily * 0.08 +
        cadenceDriving * 0.08 +
        (plannedHeroForm === 'cube' ? 0.46 : 0) +
        (plannedHeroAccentForm === 'cube' ? 0.16 : 0),
      pyramid:
        0.04 +
        revealFamily * 0.12 +
        ruptureFamily * 0.06 +
        paletteSolarTarget * 0.18 +
        sceneSolar * 0.1 +
        laserAct * 0.08 +
        openIntent * 0.08 +
        (plannedHeroForm === 'pyramid' ? 0.42 : 0) +
        (plannedHeroAccentForm === 'pyramid' ? 0.16 : 0),
      diamond:
        0.06 +
        hauntFamily * 0.12 +
        releaseFamily * 0.16 +
        ghostAct * 0.18 +
        paletteGhostTarget * 0.18 +
        paletteVoidTarget * 0.08 +
        sceneSpectral * 0.14 +
        clearIntent * 0.08 +
        (plannedHeroForm === 'diamond' ? 0.44 : 0) +
        (plannedHeroAccentForm === 'diamond' ? 0.16 : 0),
      prism:
        0.08 +
        gatherFamily * 0.16 +
        revealFamily * 0.12 +
        portal * 0.1 +
        paletteAcidTarget * 0.18 +
        paletteSolarTarget * 0.1 +
        paletteSpread * 0.18 +
        scenePrismatic * 0.18 +
        openIntent * 0.06 +
        (plannedHeroForm === 'prism' ? 0.44 : 0) +
        (plannedHeroAccentForm === 'prism' ? 0.16 : 0),
      shard:
        0.04 +
        ruptureFamily * 0.16 +
        haloIgnition * 0.12 +
        dropPulse * 0.14 +
        this.sectionChange * 0.1 +
        paletteSolarTarget * 0.12 +
        paletteTronTarget * 0.04 +
        sceneSolar * 0.1 +
        scenePrismatic * 0.06 +
        sweepIntent * 0.08 +
        (plannedHeroForm === 'shard' ? 0.48 : 0) +
        (plannedHeroAccentForm === 'shard' ? 0.16 : 0),
      mushroom:
        broodFamily * 0.02 +
        hauntFamily * 0.14 +
        plume * 0.1 +
        paletteAcidTarget * 0.02 +
        paletteGhostTarget * 0.1 +
        sceneSpectral * 0.12 +
        exhaleIntent * 0.05 +
        (plannedHeroForm === 'mushroom' ? 0.24 : 0) +
        (plannedHeroAccentForm === 'mushroom' ? 0.08 : 0)
    };
    const rankedHeroForms = HERO_FORMS.map((form) => ({
      form,
      score: heroFormScores[form]
    })).sort((left, right) => right.score - left.score);
    const heroFormHoldSeconds = THREE.MathUtils.clamp(
      this.stageCuePlan.heroFormHoldSeconds *
        (withheldSpend ? 1.14 : peakSpend ? 0.82 : 1) *
        (this.stageCompositionPlan.eventScale === 'stage' ? 0.88 : 1.02) -
        sceneVariation.noveltyDrive * 1.08 -
        scenePrismatic * 0.56 -
        paletteSpread * 0.72,
      1.1,
      5.4
    );
    const secondsSinceHeroFormChange = elapsedSeconds - this.lastHeroFormChangeSeconds;
    const formVarietyPressure = THREE.MathUtils.clamp(
      sceneVariation.noveltyDrive * 0.84 +
        paletteSpread * 0.72 +
        heroMorphBias * 0.32 +
        prismaticDrive * 0.26 +
        this.sectionChange * 0.18 +
        this.dropImpact * 0.12,
      0,
      1.8
    );
    const currentHeroFormScore = heroFormScores[this.activeHeroForm] ?? 0;
    const topHeroFormScore = rankedHeroForms[0]?.score ?? currentHeroFormScore;
    const switchableHeroForms = rankedHeroForms.filter(
      (entry, index) =>
        index < (formVarietyPressure > 0.78 ? 6 : 5) &&
        entry.score >= topHeroFormScore - (0.12 + formVarietyPressure * 0.08)
    );
    const heroFormRotationKey = `${this.activeAct}:${this.paletteState}:${this.activeFamily}:${this.stageCuePlan.family}:${Math.floor(
      elapsedSeconds / Math.max(0.8, heroFormHoldSeconds * 0.72)
    )}`;
    const rotatedHeroForm =
      switchableHeroForms.length > 0
        ? switchableHeroForms[hashSignature(heroFormRotationKey) % switchableHeroForms.length]!
            .form
        : rankedHeroForms[0]?.form ?? this.activeHeroForm;
    const plannedHeroFormScore = heroFormScores[plannedHeroForm] ?? currentHeroFormScore;
    const nextHeroFormCandidate =
      plannedHeroForm !== this.activeHeroForm &&
      plannedHeroFormScore >= topHeroFormScore - (0.1 + formVarietyPressure * 0.14)
        ? plannedHeroForm
        : rotatedHeroForm;
    const nextHeroFormScore = heroFormScores[nextHeroFormCandidate] ?? currentHeroFormScore;
    const formRotationEligible =
      secondsSinceHeroFormChange >= heroFormHoldSeconds &&
      nextHeroFormCandidate !== this.activeHeroForm &&
      (nextHeroFormScore >= currentHeroFormScore - (0.02 + formVarietyPressure * 0.14) ||
        nextHeroFormCandidate === plannedHeroForm ||
        switchableHeroForms.length > 2);
    if (formRotationEligible) {
      this.previousHeroForm = this.activeHeroForm;
      this.activeHeroForm = nextHeroFormCandidate;
      this.lastHeroFormChangeSeconds = elapsedSeconds;
    }
    const accentHeroFormCandidate =
      rankedHeroForms.find(
        (entry) => entry.form !== this.activeHeroForm && entry.form === plannedHeroAccentForm
      )?.form ??
      rankedHeroForms.find((entry) => entry.form !== this.activeHeroForm)?.form ??
      plannedHeroAccentForm;
    this.activeHeroAccentForm = accentHeroFormCandidate;
    this.heroFormTransition = easeInOut(
      THREE.MathUtils.clamp(
        (elapsedSeconds - this.lastHeroFormChangeSeconds) /
          Math.max(0.42, heroFormHoldSeconds * 0.26),
        0,
        1
      )
    );
    const accentMix =
      this.activeHeroAccentForm === this.activeHeroForm
        ? 0
        : THREE.MathUtils.clamp(
            0.06 +
              heroMorphBias * 0.18 +
              prismaticDrive * 0.18 +
              scenePrismatic * 0.08 +
              this.sectionChange * 0.08 +
              (this.activeHeroAccentForm === plannedHeroAccentForm ? 0.04 : 0),
            0.06,
            0.34
          );
    const primaryFormMix = 1 - accentMix;
    const priorPrimaryMix = (1 - this.heroFormTransition) * primaryFormMix;
    const currentPrimaryMix = this.heroFormTransition * primaryFormMix;
    const formWeightFor = (form: StageHeroForm): number =>
      (this.previousHeroForm === form ? priorPrimaryMix : 0) +
      (this.activeHeroForm === form ? currentPrimaryMix : 0) +
      (this.activeHeroAccentForm === form ? accentMix : 0);
    const orbFormWeight = formWeightFor('orb');
    const cubeFormWeight = formWeightFor('cube');
    const pyramidFormWeight = formWeightFor('pyramid');
    const diamondFormWeight = formWeightFor('diamond');
    const octaFormWeight = diamondFormWeight;
    const prismFormWeight = formWeightFor('prism');
    const shardFormWeight = formWeightFor('shard');
    const mushroomFormWeight = formWeightFor('mushroom');
    const nonOrbFormPresence =
      cubeFormWeight +
      pyramidFormWeight +
      diamondFormWeight +
      prismFormWeight +
      shardFormWeight +
      mushroomFormWeight;
    const discreteFormBlend = THREE.MathUtils.clamp(
      geometryBias * 0.46 +
        heroMorphBias * 0.42 +
        prismaticDrive * 0.14 +
        dropPulse * 0.1 +
        this.sectionChange * 0.08 -
        orbFormWeight * 0.18 +
        shardFormWeight * 0.08 +
        mushroomFormWeight * 0.04,
      0,
      1
    );
    const heroWireShapeClamp = THREE.MathUtils.clamp(
      1 - discreteFormBlend * nonOrbFormPresence * 0.58,
      0.28,
      1
    );
    const position = this.heroGeometry.attributes.position as THREE.BufferAttribute;
    const positions = position.array as Float32Array;

    for (let index = 0; index < position.count; index += 1) {
      const baseIndex = index * 3;
      const baseX = this.formBasePositions[baseIndex];
      const baseY = this.formBasePositions[baseIndex + 1];
      const baseZ = this.formBasePositions[baseIndex + 2];
      const dirX = this.formDirections[baseIndex];
      const dirY = this.formDirections[baseIndex + 1];
      const dirZ = this.formDirections[baseIndex + 2];
      const seed = this.formSeeds[index];
      const signX = dirX >= 0 ? 1 : -1;
      const signZ = dirZ >= 0 ? 1 : -1;

      const phase = elapsedSeconds * (0.44 + this.directorLaserDrive * 0.46) + seed * 9.6;
      const morphWave =
        Math.sin(
          elapsedSeconds * (0.92 + heroMotionBias * 0.56) +
            seed * 27 +
            this.phrasePhase * Math.PI * 2
        ) * heroMorphBias;
      const stageAxisMorph =
        heroMorphBias *
        (heroTravelStageX *
          (0.08 + Math.abs(dirY) * 0.12) *
          Math.sin(phase * 0.86 + this.barPhase * Math.PI * 2) +
          heroTravelStageY *
            (0.08 + Math.abs(dirX) * 0.1) *
            Math.cos(phase * 0.74 + this.phrasePhase * Math.PI * 2) +
          heroDepthBias * (0.05 + Math.max(0, dirZ) * 0.08));
      const directionalMorph =
        compressIntent * (Math.abs(dirY) * 0.1 - Math.abs(dirX) * 0.08) +
        openIntent * (Math.abs(dirX) * 0.08 + Math.max(0, dirY) * 0.06) +
        collapseIntent * ((0.5 + Math.max(0, -dirZ)) * 0.14 - Math.abs(dirY) * 0.05) +
        sweepIntent * (dirX * 0.1) +
        exhaleIntent * (Math.abs(dirY) * 0.08 - Math.abs(dirZ) * 0.04) -
        clearIntent * 0.05;
      const radial =
        1 +
        this.body * 0.24 +
        this.bassBody * 0.18 +
        this.subPressure * 0.14 +
        liquid * 0.12 +
        portal * 0.07 +
        cathedral * 0.05 +
        this.phraseTension * 0.08 +
        shellTension * 0.1 +
        this.preDropTension * 0.12 +
        dropPulse * 0.18 +
        heroMorphBias * 0.12 +
        directionalMorph * 0.34;
      const breathing =
        Math.sin(phase + this.barPhase * Math.PI * 2) *
        (0.02 +
          this.air * 0.06 +
          idleBreath * 0.02 +
          this.preDropTension * 0.03 +
          heroMotionBias * 0.05 +
          heroMorphBias * 0.04);
      const shear =
        Math.sin(elapsedSeconds * (1.2 + this.directorLaserDrive * 2.1) + seed * 12.2) *
        this.accent *
        (0.04 +
          storm * 0.08 +
          dropPulse * 0.08 +
          heroMotionBias * 0.08 +
          sweepIntent * 0.06 +
          heroMorphBias * 0.08);
      const cavity =
        eclipse *
        (0.1 + 0.16 * (0.5 + 0.5 * Math.sin(seed * 18 + elapsedSeconds * 0.6))) *
        (0.5 + Math.max(0, -dirZ)) +
        collapseIntent * heroMorphBias * (0.06 + Math.max(0, -dirZ) * 0.08);
      const plumeLift =
        plume * (dirY > 0 ? 0.1 : -0.03) * (0.7 + this.air * 0.6) +
        exhaleIntent * heroMorphBias * (dirY > 0 ? 0.1 : -0.04);
      const geometry =
        geometryBias *
        (Math.abs(dirX) * 0.05 + Math.abs(dirY) * 0.04 + Math.abs(dirZ) * 0.03) +
        heroMorphBias * (Math.abs(dirX) * 0.03 + Math.abs(dirY) * 0.02);
      const fracture =
        haloIgnition * 0.08 * Math.sin(seed * 31 + elapsedSeconds * 4.6) +
        portalOpen * 0.05 * Math.cos(seed * 23 + elapsedSeconds * 2.8) +
        dropPulse * 0.12 * Math.sin(seed * 47 + this.beatPhase * Math.PI * 2) +
        shellBloom * 0.08 * Math.cos(seed * 41 + membraneClock) +
        morphWave * (0.08 + collapseIntent * 0.06 + gatherFamily * 0.04) +
        stageAxisMorph * 0.32;
      const lensing =
        shellOrbit * 0.06 * Math.sin(seed * 29 + crownClock) * (0.4 + Math.max(0, dirZ)) +
        openIntent * heroMorphBias * Math.max(0, dirX) * 0.04;
      const displacement =
        radial +
        breathing +
        plumeLift +
        geometry +
        fracture +
        lensing +
        stageAxisMorph * 0.28 -
        cavity;
      const organicX =
        baseX +
        dirX * displacement +
        dirY * shear * (0.4 + portal * 0.4) +
        directionalMorph * dirX * 0.18 +
        stageAxisMorph * dirX * 0.22;
      const organicY =
        baseY +
        dirY * displacement +
        dirX * shear * 0.3 +
        plumeLift * 0.4 +
        directionalMorph * dirY * 0.2 +
        stageAxisMorph * dirY * 0.18;
      const organicZ =
        baseZ +
        dirZ * displacement -
        collapse * 0.12 * (0.5 + seed) +
        portal * 0.08 * Math.sin(phase * 0.7) +
        directionalMorph * dirZ * 0.16 +
        stageAxisMorph * dirZ * 0.2;
      const formRadius = Math.max(
        0.72,
        0.94 + displacement * (0.74 + heroMorphBias * 0.08)
      );
      const cubeDenominator = Math.max(
        Math.abs(dirX),
        Math.abs(dirY),
        Math.abs(dirZ),
        0.0001
      );
      const cubeScale = formRadius * 0.78;
      const cubeX = (dirX / cubeDenominator) * cubeScale;
      const cubeY = (dirY / cubeDenominator) * cubeScale;
      const cubeZ = (dirZ / cubeDenominator) * cubeScale;
      const octaDenominator = Math.max(
        Math.abs(dirX) + Math.abs(dirY) + Math.abs(dirZ),
        0.0001
      );
      const octaScale = formRadius * 1.1;
      const octaX = (dirX / octaDenominator) * octaScale;
      const octaY = (dirY / octaDenominator) * octaScale;
      const octaZ = (dirZ / octaDenominator) * octaScale;
      const prismDenominator = Math.max(Math.abs(dirX), Math.abs(dirZ), 0.36);
      const prismScale = formRadius * 0.7;
      const prismX = (dirX / prismDenominator) * prismScale;
      const prismY = dirY * formRadius * 0.92;
      const prismZ = (dirZ / prismDenominator) * prismScale;
      const pyramidRise = Math.max(0, dirY);
      const pyramidPlane = THREE.MathUtils.clamp(1 - pyramidRise * 1.08, 0.16, 1);
      const pyramidScale = formRadius * 0.9;
      const pyramidBaseExtent = pyramidScale * (0.18 + pyramidPlane * 0.68);
      const pyramidX = signX * pyramidBaseExtent * (Math.abs(dirX) > 0.04 ? 1 : 0.32);
      const pyramidY =
        dirY > 0.12
          ? pyramidScale * 1.12
          : THREE.MathUtils.lerp(-pyramidScale * 0.82, pyramidScale * 0.12, (dirY + 1) * 0.5);
      const pyramidZ = signZ * pyramidBaseExtent * (Math.abs(dirZ) > 0.04 ? 1 : 0.32);
      const shardTipBias = THREE.MathUtils.clamp(
        0.38 + dirY * 0.54 + dirX * 0.18 - dirZ * 0.12,
        0,
        1
      );
      const shardLength = formRadius * (0.38 + shardTipBias * 0.9);
      const shardThickness =
        formRadius * (0.16 + Math.max(0, -dirY) * 0.24 + Math.abs(dirZ) * 0.12);
      const shardX = dirX * shardLength + signX * shardThickness * 0.22;
      const shardY = dirY * shardLength + shardTipBias * formRadius * 0.26;
      const shardZ = dirZ * shardThickness;
      const mushroomCapMask = THREE.MathUtils.clamp((dirY + 0.08) * 1.4, 0, 1);
      const mushroomStemMask = 1 - mushroomCapMask;
      const mushroomCapRadius = formRadius * (0.82 + mushroomCapMask * 0.24);
      const mushroomStemRadius = formRadius * (0.22 + Math.max(0, -dirY) * 0.08);
      const mushroomX =
        dirX * (mushroomCapRadius * mushroomCapMask + mushroomStemRadius * mushroomStemMask);
      const mushroomY =
        mushroomCapMask > 0
          ? formRadius * (0.12 + mushroomCapMask * 0.96)
          : -formRadius * (0.86 - mushroomStemMask * 0.14);
      const mushroomZ =
        dirZ * (mushroomCapRadius * mushroomCapMask + mushroomStemRadius * mushroomStemMask);
      const orbX = dirX * formRadius;
      const orbY = dirY * formRadius;
      const orbZ = dirZ * formRadius;
      const formTargetX =
        orbX * orbFormWeight +
        cubeX * cubeFormWeight +
        pyramidX * pyramidFormWeight +
        octaX * diamondFormWeight +
        prismX * prismFormWeight +
        shardX * shardFormWeight +
        mushroomX * mushroomFormWeight +
        dirY * shear * 0.16 +
        directionalMorph * dirX * 0.08 +
        stageAxisMorph * dirX * 0.12;
      const formTargetY =
        orbY * orbFormWeight +
        cubeY * cubeFormWeight +
        pyramidY * pyramidFormWeight +
        octaY * diamondFormWeight +
        prismY * prismFormWeight +
        shardY * shardFormWeight +
        mushroomY * mushroomFormWeight +
        dirX * shear * 0.12 +
        plumeLift * 0.18 +
        directionalMorph * dirY * 0.1 +
        stageAxisMorph * dirY * 0.1;
      const formTargetZ =
        orbZ * orbFormWeight +
        cubeZ * cubeFormWeight +
        pyramidZ * pyramidFormWeight +
        octaZ * diamondFormWeight +
        prismZ * prismFormWeight +
        shardZ * shardFormWeight +
        mushroomZ * mushroomFormWeight -
        collapse * 0.06 * (0.5 + seed) +
        portal * 0.05 * Math.sin(phase * 0.7) +
        directionalMorph * dirZ * 0.08 +
        stageAxisMorph * dirZ * 0.1;

      positions[baseIndex] = THREE.MathUtils.lerp(
        organicX,
        formTargetX,
        discreteFormBlend
      );
      positions[baseIndex + 1] = THREE.MathUtils.lerp(
        organicY,
        formTargetY,
        discreteFormBlend
      );
      positions[baseIndex + 2] = THREE.MathUtils.lerp(
        organicZ,
        formTargetZ,
        discreteFormBlend
      );
    }

    position.needsUpdate = true;
    this.heroGeometry.computeVertexNormals();

    const stageTravel =
      Math.sin(
        elapsedSeconds *
          (0.22 +
            heroMotionBias * 0.28 +
            cadenceDriving * 0.08 +
            cadenceSurge * 0.12 -
            cadenceAftermath * 0.06) +
          this.barPhase * Math.PI * 2 +
          heroTravelStageX * 1.6
      ) *
      ((0.18 + heroMotionBias * 0.86 + Math.max(0, heroScaleBias) * 0.18) *
        (0.72 +
          earnedSpend * 0.12 +
          peakSpend * 0.24 -
          withheldSpend * 0.18 +
          tempoDensity * 0.12 +
          spatialPresence * 0.08 -
          shotWorldTakeover * 0.12 -
          shotIsolate * 0.14));
    const stageLift =
      Math.cos(
        elapsedSeconds *
          (0.18 +
            heroMotionBias * 0.18 +
            cadenceDriving * 0.04 +
            cadenceSurge * 0.08 -
            cadenceAftermath * 0.05) +
          this.phrasePhase * Math.PI * 2 +
          heroTravelStageY * 1.8
      ) *
      ((0.08 + heroMotionBias * 0.28 + Math.max(0, heroScaleBias) * 0.06) *
        (0.78 +
          earnedSpend * 0.08 +
          peakSpend * 0.18 -
          withheldSpend * 0.14 +
          impactBuild * 0.1 -
          shotAftermath * 0.12 -
          shotIsolate * 0.16));
    const stageSwing =
      Math.sin(
        elapsedSeconds * (0.14 + heroMotionBias * 0.22) +
          this.releaseTail * Math.PI * 2
      ) *
      ((heroMotionBias + Math.max(0, heroScaleBias) * 0.1) *
        (0.76 + earnedSpend * 0.12 + peakSpend * 0.16 - withheldSpend * 0.14 + tempoDensity * 0.08));
    const dominanceShrink =
      chamberDominance * 0.02 +
      worldDominance * 0.02 -
      Math.max(0, heroScaleBias) * 0.06 +
      shotWorldTakeover * 0.12 +
      shotAftermath * 0.08 +
      shotIsolate * 0.16;
    const stageBaseScale = THREE.MathUtils.clamp(
      0.56 +
        heroScaleBias * 1.06 +
        heroPlanWeight * 0.1 -
        dominanceShrink -
        hauntFamily * 0.04 -
        resetFamily * 0.06 -
        gatherFamily * 0.02 +
        this.body * 0.08 +
        this.directorEnergy * 0.04 +
        this.liftPulse * 0.05 +
        portalOpen * 0.03 -
        restraint * 0.08 +
        collapse * 0.04 -
        worldActivity * 0.06 -
        eclipse * 0.03 +
        dropPulse * 0.18 +
        impactHit * 0.12 +
        this.sectionChange * 0.08 +
        memoryAfterglow * 0.06 +
        livingField * 0.02 +
        heroMotionBias * 0.08 -
        shotWorldTakeover * 0.22 -
        shotAftermath * 0.14 -
        shotIsolate * 0.24 +
        fallbackDemoteHero * 0.12 +
        fallbackForceWorldTakeover * 0.08 +
        shotRupture * 0.08 +
        shotPressure * 0.04 +
        shotAnchor * 0.02,
      heroScaleMin,
      heroScaleMax
    );
    let heroScaleX =
      stageBaseScale *
      (1 +
        sweepIntent * 0.18 +
        openIntent * 0.12 -
        compressIntent * 0.16 +
        heroMorphBias * 0.08 +
        stageSwing * 0.06);
    let heroScaleY =
      stageBaseScale *
      (1 +
        compressIntent * 0.22 +
        exhaleIntent * 0.14 +
        hauntFamily * 0.12 -
        collapseIntent * 0.08 +
        heroMorphBias * 0.12 +
        stageLift * 0.08);
    let heroScaleZ =
      stageBaseScale *
      (1 +
        collapseIntent * 0.26 +
        Math.max(0, heroDepthBias) * 0.14 -
        clearIntent * 0.12 +
        heroMorphBias * 0.16);
    const finalHeroScaleCeiling = Math.max(
      heroScaleMin + 0.08,
      Math.min(heroScaleMax, heroEnvelope.scaleCeiling)
    );
    const unclampedHeroMax = Math.max(heroScaleX, heroScaleY, heroScaleZ);
    if (unclampedHeroMax > finalHeroScaleCeiling) {
      const clampRatio = finalHeroScaleCeiling / unclampedHeroMax;
      heroScaleX *= clampRatio;
      heroScaleY *= clampRatio;
      heroScaleZ *= clampRatio;
    }
    const quietRoomReadableLift =
      this.currentListeningMode === 'room-mic' && this.roomMusicVisualFloor > 0
        ? 0.24 + this.roomMusicVisualFloor * 0.52
        : 0;
    const adaptiveReadableLift =
      this.adaptiveMusicVisualFloor > 0
        ? 0.12 + this.adaptiveMusicVisualFloor * 0.34
        : 0;
    const minReadableHeroScale = THREE.MathUtils.clamp(
      0.82 +
        heroEnvelope.coverageMin * 16 +
        quietRoomReadableLift +
        adaptiveReadableLift +
        this.tuning.readableHeroFloor * 0.32,
      heroScaleMin,
      finalHeroScaleCeiling
    );
    const currentHeroScaleMax = Math.max(heroScaleX, heroScaleY, heroScaleZ);
    if (
      heroEnvelope.coverageMin > 0 &&
      currentHeroScaleMax > 0 &&
      currentHeroScaleMax < minReadableHeroScale
    ) {
      const floorRatio = minReadableHeroScale / currentHeroScaleMax;
      heroScaleX *= floorRatio;
      heroScaleY *= floorRatio;
      heroScaleZ *= floorRatio;
    }
    const largeHeroFraction = THREE.MathUtils.clamp(
      (Math.max(heroScaleX, heroScaleY, heroScaleZ) - 1.1) /
        Math.max(finalHeroScaleCeiling - 1.1, 0.32),
      0,
      1
    );
    const coverageOverfill = THREE.MathUtils.clamp(
      (this.heroCoverageEstimateCurrent - this.stageCompositionPlan.heroEnvelope.coverageMax) /
        Math.max(this.stageCompositionPlan.heroEnvelope.coverageMax, 0.08),
      0,
      1
    );
    const ringBeltOverfill = THREE.MathUtils.clamp(
      (this.ringBeltPersistenceCurrent - 0.34) / 0.42,
      0,
      1
    );
    const wirefieldOverfill = THREE.MathUtils.clamp(
      (this.wirefieldDensityScoreCurrent - 0.28) / 0.5,
      0,
      1
    );
    const heroAdditiveClamp = THREE.MathUtils.clamp(
      1 -
        washoutSuppression * (0.34 + largeHeroFraction * 0.42 + peakSpend * 0.08) +
        peakSpend * 0.06 -
        fallbackDemoteHero * 0.08 -
        fallbackForceWorldTakeover * 0.06,
      0.38,
      1
    );
    const heroWirefieldClamp = THREE.MathUtils.clamp(
      1 -
        largeHeroFraction * 0.46 -
        shotPressure * 0.22 -
        shotWorldTakeover * 0.18 -
        openIntent * 0.1 -
        gatherFamily * 0.06 -
        ringBeltOverfill * 0.28 -
        wirefieldOverfill * 0.34 -
        coverageOverfill * 0.2 -
        laserAct * 0.08 +
        shotIsolate * 0.06,
      0.16,
      1
    );
    const heroOverfillClamp = THREE.MathUtils.clamp(
      1 -
        largeHeroFraction * 0.36 -
        ringBeltOverfill * 0.28 -
        wirefieldOverfill * 0.34 -
        coverageOverfill * 0.24 -
        shotPressure * 0.22 -
        laserAct * 0.08 +
        shotWorldTakeover * 0.04 +
        shotIsolate * 0.06,
      0.16,
      1
    );

    const heroBaseYaw =
      elapsedSeconds *
        (0.12 +
          this.directorEnergy * 0.12 +
          portal * 0.16 +
          this.preDropTension * 0.06 +
          heroMotionBias * 0.1) +
      gazeX * 0.08 +
      heroTravelStageX * 0.24 +
      stageTravel * 0.14 +
      heroDrift.x * 0.42;
    const heroBasePitch =
      Math.sin(elapsedSeconds * 0.16) * 0.08 +
      gazeY * 0.06 +
      storm * 0.06 +
      this.sectionChange * 0.12 +
      heroTravelStageY * 0.18 +
      stageLift * 0.18 +
      heroDrift.y * 0.36;
    const heroBaseRoll =
      Math.sin(elapsedSeconds * 0.12 + this.barPhase * Math.PI * 2) *
        (0.03 + shellOrbit * 0.04 + heroMotionBias * 0.04) +
      shellBloom * 0.04 +
      heroTravelStageX * 0.16 +
      stageSwing * 0.1 +
      shellDrift.x * 0.14;
    this.motionBaseQuaternion.setFromEuler(
      this.motionEulerScratch.set(heroBasePitch, heroBaseYaw, heroBaseRoll)
    );
    this.motionCompositeQuaternion
      .copy(this.motionBaseQuaternion)
      .multiply(heroMotion.quaternion);
    this.heroGroup.quaternion.copy(this.motionCompositeQuaternion);
    const stageLanePullX =
      heroTravelStageX *
      (1.72 +
        heroMotionBias * 1.38 +
        heroEnvelope.driftAllowance * 1.64 +
        heroRoamBoost * 0.94 +
        Math.max(0, heroScaleBias) * 0.42);
    const stageLanePullY =
      heroTravelStageY *
      (0.86 +
        heroMotionBias * 0.46 +
        heroEnvelope.driftAllowance * 0.92 +
        heroRoamBoost * 0.44);
    this.heroGroup.position.x =
      stageLanePullX +
      heroDrift.x * (0.88 + heroMotionBias * 0.18) +
      stageTravel * (0.58 + heroMotionBias * 0.34) +
      Math.sin(elapsedSeconds * 0.1 + this.phrasePhase * Math.PI * 2) *
        (0.04 + livingField * 0.03 + heroMotionBias * 0.08 + spatialPresence * 0.06) +
      heroMotion.position.x;
    this.heroGroup.position.y =
      stageLanePullY +
      Math.sin(elapsedSeconds * 0.22 + this.beatPhase * Math.PI * 2) *
        (0.12 + heroMotionBias * 0.1) *
        idleBreath +
      plume * 0.12 +
      this.dropImpact * (0.2 + heroScaleBias * 0.06) +
      impactBuild * 0.12 +
      stageLift * 0.46 +
      heroDrift.y +
      heroMotion.position.y;
    this.heroGroup.position.z =
      portal * 0.2 -
      eclipse * 0.14 -
      chamberDominance * 0.02 -
      worldDominance * 0.06 -
      shellTension * 0.12 +
      heroDepthBias * 1.1 +
      this.preDropTension * 0.22 +
      this.releaseTail * 0.12 +
      heroDrift.z +
      heroMotion.position.z;
    const laneDirectionX =
      Math.sign(heroTravelStageX) ||
      Math.sign(stageTravel) ||
      1;
    const laneDirectionY =
      Math.sign(heroTravelStageY) ||
      Math.sign(stageLift) ||
      -1;
    const minimumTravelX =
      heroEnvelope.travelMinX *
      ((this.currentListeningMode === 'room-mic' ? 1.28 : 0.94) +
        this.adaptiveMusicVisualFloor * 1.2 +
        heroEnvelope.driftAllowance * 2.4 +
        heroRoamBoost * 1.4);
    const minimumTravelY =
      heroEnvelope.travelMinY *
      ((this.currentListeningMode === 'room-mic' ? 1.08 : 0.84) +
        this.adaptiveMusicVisualFloor * 0.6 +
        heroEnvelope.driftAllowance * 2 +
        heroRoamBoost * 0.9);
    if (heroEnvelope.travelMinX > 0 && Math.abs(this.heroGroup.position.x) < minimumTravelX) {
      this.heroGroup.position.x = laneDirectionX * minimumTravelX;
    }
    if (heroEnvelope.travelMinY > 0 && Math.abs(this.heroGroup.position.y) < minimumTravelY) {
      this.heroGroup.position.y = laneDirectionY * minimumTravelY;
    }
    const maxTravelX =
      (this.currentListeningMode === 'room-mic' ? 0.56 : 0.44) +
      this.adaptiveMusicVisualFloor * 0.7 +
      heroEnvelope.driftAllowance * (this.currentListeningMode === 'room-mic' ? 6.2 : 5.2) +
      heroRoamBoost * (this.currentListeningMode === 'room-mic' ? 0.38 : 0.32);
    const maxTravelY =
      (this.currentListeningMode === 'room-mic' ? 0.34 : 0.28) +
      this.adaptiveMusicVisualFloor * 0.28 +
      heroEnvelope.driftAllowance * (this.currentListeningMode === 'room-mic' ? 3 : 2.4) +
      heroRoamBoost * 0.16;
    this.heroGroup.position.x = THREE.MathUtils.clamp(
      this.heroGroup.position.x,
      -maxTravelX,
      maxTravelX
    );
    this.heroGroup.position.y = THREE.MathUtils.clamp(
      this.heroGroup.position.y,
      -maxTravelY,
      maxTravelY
    );
    this.heroGroup.position.z = Math.min(
      this.heroGroup.position.z +
        heroEnvelope.coverageMin *
          (this.currentListeningMode === 'room-mic'
            ? 0.82 + this.roomMusicVisualFloor * 0.72
            : 0.18 + this.adaptiveMusicVisualFloor * 0.54),
      heroEnvelope.depthMax
    );
    this.heroGroup.scale.set(heroScaleX, heroScaleY, heroScaleZ);
    this.heroScaleCurrent = Math.max(heroScaleX, heroScaleY, heroScaleZ);
    let projectedCoverage = this.estimateHeroCoverage();
    if (heroEnvelope.coverageMin > 0 && projectedCoverage + 0.001 < heroEnvelope.coverageMin) {
      const desiredCoverage = heroEnvelope.coverageMin;
      const forwardCapacity = Math.max(0, heroEnvelope.depthMax - this.heroGroup.position.z);
      if (forwardCapacity > 0) {
        const forwardBoost = Math.min(
          forwardCapacity,
          (desiredCoverage - projectedCoverage) *
            (this.currentListeningMode === 'room-mic'
              ? 4.2 + this.roomMusicVisualFloor * 2.6
              : 2.4 + this.adaptiveMusicVisualFloor * 2)
        );
        this.heroGroup.position.z += forwardBoost;
        projectedCoverage = this.estimateHeroCoverage();
      }
      if (projectedCoverage + 0.001 < desiredCoverage) {
        const scaleRatio = Math.min(
          1.42,
          Math.sqrt(desiredCoverage / Math.max(projectedCoverage, 0.0001))
        );
        const targetHeroMax = Math.min(
          finalHeroScaleCeiling,
          Math.max(this.heroScaleCurrent, this.heroScaleCurrent * scaleRatio)
        );
        if (targetHeroMax > this.heroScaleCurrent + 0.001) {
          const inflateRatio = targetHeroMax / Math.max(this.heroScaleCurrent, 0.0001);
          heroScaleX *= inflateRatio;
          heroScaleY *= inflateRatio;
          heroScaleZ *= inflateRatio;
          this.heroGroup.scale.set(heroScaleX, heroScaleY, heroScaleZ);
          this.heroScaleCurrent = Math.max(heroScaleX, heroScaleY, heroScaleZ);
          projectedCoverage = this.estimateHeroCoverage();
        }
      }
      if (projectedCoverage + 0.001 < desiredCoverage) {
        const lastForwardCapacity = Math.max(0, heroEnvelope.depthMax - this.heroGroup.position.z);
        if (lastForwardCapacity > 0) {
          this.heroGroup.position.z += Math.min(
            lastForwardCapacity,
            (desiredCoverage - projectedCoverage) * 1.8
          );
          projectedCoverage = this.estimateHeroCoverage();
        }
      }
    }
    this.heroCoverageEstimateCurrent = projectedCoverage;

    const hueOrbit =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds * (0.18 + this.directorLaserDrive * 0.16) +
            this.phrasePhase * Math.PI * 2 * 0.7 +
            this.barPhase * Math.PI * 2 * 0.24
        );
    const neonOrbit =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds * (0.54 + chromaWarp * 0.28 + this.directorLaserDrive * 0.16) +
            this.beatPhase * Math.PI * 2 +
            this.harmonicColor * Math.PI * 2
        );
    const warmDrive = THREE.MathUtils.clamp(
      warmBias * 0.92 + this.harmonicColor * 0.58 + dropPulse * 0.34 + haloIgnition * 0.24,
      0,
      1.8
    );
    const coolDrive = THREE.MathUtils.clamp(
      coolBias * 0.92 + (1 - this.harmonicColor) * 0.58 + portal * 0.28 + this.shimmer * 0.18,
      0,
      1.8
    );
    const acidDrive = THREE.MathUtils.clamp(
      this.shimmer * 0.72 + chromaPulse * 0.42 + neonOrbit * 0.26 + glowOverdrive * 0.14,
      0,
      1.8
    );
    const solarDrive = THREE.MathUtils.clamp(
      warmDrive * 0.5 + dropPulse * 0.42 + haloIgnition * 0.18 + this.sectionChange * 0.08,
      0,
      1.8
    );
    const coolStyleDrive = THREE.MathUtils.clamp(
      paletteVoidTarget * 0.72 +
        paletteTronTarget * 0.68 +
        coolDrive * 0.18 +
        broodFamily * 0.08 +
        portal * 0.06,
      0,
      1.4
    );
    const solarStyleDrive = THREE.MathUtils.clamp(
      paletteSolarTarget * 0.96 +
        warmDrive * 0.22 +
        revealFamily * 0.08 +
        ruptureFamily * 0.08 +
        haloIgnition * 0.08,
      0,
      1.4
    );
    const acidStyleDrive = THREE.MathUtils.clamp(
      paletteAcidTarget * 0.94 +
        acidDrive * 0.2 +
        matrixAct * 0.08 +
        gatherFamily * 0.06,
      0,
      1.4
    );
    const ghostStyleDrive = THREE.MathUtils.clamp(
      paletteGhostTarget * 1.02 +
        ghostAct * 0.16 +
        releaseFamily * 0.08 +
        hauntFamily * 0.12 +
        coolDrive * 0.04,
      0,
      1.4
    );
    const heroVarietyDrive = THREE.MathUtils.clamp(
      paletteSpread * 0.52 +
        prismaticDrive * 0.44 +
        scenePrismatic * 0.22 +
        sceneSolar * 0.08 +
        sceneSpectral * 0.08 +
        this.sectionChange * 0.18 +
        (1 - this.heroFormTransition) * 0.08 +
        shardFormWeight * 0.22 +
        mushroomFormWeight * 0.16,
      0,
      1.8
    );
    const spectralStyleDrive = THREE.MathUtils.clamp(
      ghostStyleDrive * 0.74 +
        diamondFormWeight * 0.28 +
        mushroomFormWeight * 0.12 +
        sceneSpectral * 0.2 +
        this.releaseTail * 0.16,
      0,
      1.6
    );
    const hotStyleDrive = THREE.MathUtils.clamp(
      solarStyleDrive * 0.74 +
        shardFormWeight * 0.26 +
        pyramidFormWeight * 0.18 +
        sceneSolar * 0.18 +
        heroVarietyDrive * 0.14,
      0,
      1.8
    );
    const toxicStyleDrive = THREE.MathUtils.clamp(
      acidStyleDrive * 0.38 +
        solarStyleDrive * 0.44 +
        prismFormWeight * 0.18 +
        mushroomFormWeight * 0.18 +
        scenePrismatic * 0.16 +
        heroVarietyDrive * 0.18,
      0,
      1.8
    );
    const prismaticColorDrive = THREE.MathUtils.clamp(
      scenePrismatic * 0.74 +
        paletteSpread * 0.34 +
        prismFormWeight * 0.22 +
        shardFormWeight * 0.12 +
        this.sectionChange * 0.12 +
        chromaWarp * 0.08,
      0,
      1.8
    );
    const rankedPaletteTargets = (
      Object.entries(this.stageCuePlan.paletteTargets) as Array<[PaletteState, number]>
    ).sort((left, right) => right[1] - left[1]);
    const dominantPalette = rankedPaletteTargets[0]?.[0] ?? this.paletteState;
    const secondaryPalette =
      rankedPaletteTargets[1]?.[1] && rankedPaletteTargets[1]![1] > 0.08
        ? rankedPaletteTargets[1]![0]
        : dominantPalette;
    const tertiaryPalette =
      rankedPaletteTargets[2]?.[1] && rankedPaletteTargets[2]![1] > 0.06
        ? rankedPaletteTargets[2]![0]
        : secondaryPalette;
    const paletteSeed = `${this.activeAct}:${this.stageCuePlan.family}:${this.activeHeroForm}:${this.activeHeroAccentForm}`;
    copyPaletteCycleColor(
      this.heroPrimaryColor,
      dominantPalette,
      this.heroPrimaryColorCycle,
      `${paletteSeed}:primary`
    );
    copyPaletteCycleColor(
      this.heroAccentColor,
      secondaryPalette,
      this.heroAccentColorCycle,
      `${paletteSeed}:accent`
    );
    copyPaletteCycleColor(
      this.heroPulseColor,
      tertiaryPalette,
      this.heroPulseColorCycle,
      `${paletteSeed}:pulse`
    );
    const palettePrimaryAuthority = THREE.MathUtils.clamp(
      0.58 +
        rankedPaletteTargets[0]?.[1] * 0.28 -
        paletteSpread * 0.18 +
        this.sectionChange * 0.08,
      0.54,
      0.88
    );
    const paletteAccentMix = THREE.MathUtils.clamp(
      0.12 +
        paletteSpread * 0.42 +
        prismaticColorDrive * 0.18 +
        this.sectionChange * 0.1 +
        nonOrbFormPresence * 0.08,
      0.1,
      0.42
    );
    const palettePulseMix = THREE.MathUtils.clamp(
      0.04 +
        prismaticColorDrive * 0.12 +
        this.beatStrike * 0.08 +
        this.dropImpact * 0.08,
      0.03,
      0.24
    );
    const dominantPaletteTarget = Math.max(...Object.values(this.stageCuePlan.paletteTargets));
    const heroBodyColorAuthority = THREE.MathUtils.clamp(
      0.32 +
        paletteSpread * 0.76 +
        heroVarietyDrive * 0.34 +
        prismaticColorDrive * 0.28 +
        hotStyleDrive * 0.18 +
        spectralStyleDrive * 0.14 +
        nonOrbFormPresence * 0.18 +
        eventGlow * 0.14 +
        (this.stageCuePlan.paletteHoldSeconds < 3.6 ? 0.1 : 0) -
        (dominantPaletteTarget - 0.72) * 0.22 -
        hauntFamily * 0.12 -
        worldDominance * 0.08,
      0.18,
      1.48
    );
    const heroBodyNeonLift = THREE.MathUtils.clamp(
      0.02 +
        heroBodyColorAuthority * 0.06 +
        prismaticColorDrive * 0.04 +
        hotStyleDrive * 0.02 -
        spectralStyleDrive * 0.01,
      0.02,
      0.14
    );
    const heroBodyDarkLerp = THREE.MathUtils.clamp(
      0.42 -
        heroBodyColorAuthority * 0.22 -
        prismaticDrive * 0.08 -
        hotStyleDrive * 0.04 -
        acidStyleDrive * 0.03 +
        hauntFamily * 0.06 +
        worldDominance * 0.03,
      0.12,
      0.44
    );
    const heroLineSuppression = THREE.MathUtils.clamp(
      1 - heroBodyColorAuthority * 0.16 + hauntFamily * 0.06 + ghostAct * 0.04,
      0.78,
      1
    );

    applyWeightedColor(
      this.heroMaterial.color,
      [
        {
          color: TRON_BLUE,
          weight:
            0.04 +
            coolStyleDrive * 0.14 +
            plume * 0.08 +
            laserAct * 0.06 +
            matrixAct * 0.1 +
            (1 - hueOrbit) * 0.04 +
            paletteVoid * 0.04 +
            paletteTron * 0.12 +
            paletteTronTarget * 0.62 +
            cubeFormWeight * 0.18 +
            shardFormWeight * 0.06
        },
        {
          color: LASER_CYAN,
          weight:
            0.03 +
            coolStyleDrive * 0.12 +
            portal * 0.16 +
            acidDrive * 0.04 +
            laserAct * 0.06 +
            voidAct * 0.06 +
            paletteVoid * 0.04 +
            paletteGhost * 0.04 +
            paletteVoidTarget * 0.54 +
            orbFormWeight * 0.1 +
            diamondFormWeight * 0.08
        },
        {
          color: VOLT_VIOLET,
          weight:
            0.06 +
            phrasePulse * 0.06 +
            ghost * 0.04 +
            ghostAct * 0.04 +
            heroVarietyDrive * 0.16 +
            prismaticColorDrive * 0.18 +
            sceneSpectral * 0.08 +
            paletteTronTarget * 0.08 +
            diamondFormWeight * 0.16 +
            prismFormWeight * 0.14 +
            shardFormWeight * 0.08
        },
        {
          color: HOT_MAGENTA,
          weight:
            0.05 +
            hotStyleDrive * 0.18 +
            this.dropImpact * 0.08 +
            hueOrbit * 0.04 +
            eclipseAct * 0.08 +
            paletteSolar * 0.08 +
            paletteSolarTarget * 0.58 +
            pyramidFormWeight * 0.12 +
            shardFormWeight * 0.14
        },
        {
          color: TOXIC_PINK,
          weight:
            0.04 +
            toxicStyleDrive * 0.2 +
            prismaticColorDrive * 0.14 +
            this.sectionChange * 0.08 +
            hueOrbit * 0.06 +
            neonOrbit * 0.08 +
            eclipseAct * 0.06 +
            paletteSolar * 0.06 +
            paletteSolarTarget * 0.42 +
            prismFormWeight * 0.12 +
            mushroomFormWeight * 0.14 +
            prismaticDrive * 0.16
        },
        {
          color: SOLAR_ORANGE,
          weight:
            0.04 +
            hotStyleDrive * 0.12 +
            sceneSolar * 0.16 +
            hueOrbit * 0.04 +
            paletteSolarTarget * 0.32 +
            pyramidFormWeight * 0.12 +
            shardFormWeight * 0.12
        },
        {
          color: CYBER_YELLOW,
          weight:
            0.04 +
            haloIgnition * 0.1 +
            beatPulse * 0.08 +
            laserAct * 0.04 +
            hotStyleDrive * 0.12 +
            prismaticColorDrive * 0.12 +
            paletteSolar * 0.08 +
            paletteSolarTarget * 0.28 +
            prismFormWeight * 0.08 +
            shardFormWeight * 0.12 +
            prismaticDrive * 0.12
        },
        {
          color: ACID_LIME,
          weight:
            0.06 +
            acidStyleDrive * 0.16 +
            matrixAct * 0.08 +
            (1 - this.harmonicColor) * 0.04 +
            paletteAcid * 0.12 +
            paletteAcidTarget * 0.58 +
            prismFormWeight * 0.1 +
            mushroomFormWeight * 0.12
        },
        {
          color: MATRIX_GREEN,
          weight:
            0.04 +
            acidDrive * 0.1 +
            neonOrbit * 0.04 +
            matrixAct * 0.12 +
            paletteAcid * 0.06 +
            paletteAcidTarget * 0.32 +
            cubeFormWeight * 0.08 +
            mushroomFormWeight * 0.08
        },
        {
          color: ELECTRIC_WHITE,
          weight:
            0.02 +
            spectralStyleDrive * 0.08 +
            sceneVoid * 0.08 +
            sceneSpectral * 0.1 +
            ghostAct * 0.06 +
            paletteGhost * 0.08 +
            paletteGhostTarget * 0.42 +
            diamondFormWeight * 0.12
        }
      ],
      HERO_DARK,
      Math.max(0.1, 0.28 - heroBodyColorAuthority * 0.12 - eventGlow * 0.02)
    )
      .multiplyScalar(
        0.04 +
          heroBodyColorAuthority * 0.056 +
          eventGlow * 0.024 +
          this.dropImpact * 0.02 +
          laserAct * 0.01 +
          matrixAct * 0.01 +
          prismaticDrive * 0.016 +
          heroVarietyDrive * 0.012
      );
    saturateColor(
      this.heroMaterial.color,
      0.72 + heroBodyColorAuthority * 0.18,
      heroBodyNeonLift
    );
    this.heroMaterial.color.lerp(HERO_DARK, heroBodyDarkLerp);
    this.heroShadowTint
      .copy(HERO_DARK)
      .lerp(this.heroPrimaryColor, 0.12 + heroBodyColorAuthority * 0.12)
      .lerp(this.heroAccentColor, paletteAccentMix * 0.14);
    this.heroMaterial.color
      .copy(this.heroPrimaryColor)
      .lerp(this.heroAccentColor, paletteAccentMix * 0.72)
      .lerp(this.heroPulseColor, palettePulseMix * 0.64)
      .multiplyScalar(0.048 + heroBodyColorAuthority * 0.064)
      .lerp(this.heroShadowTint, 0.16 + (1 - palettePrimaryAuthority) * 0.14);
    saturateColor(
      this.heroMaterial.color,
      0.22 + heroBodyColorAuthority * 0.12,
      heroBodyNeonLift * 0.56
    );
    this.heroMaterial.color.lerp(
      HERO_DARK,
      THREE.MathUtils.clamp(
        0.1 +
          hauntFamily * 0.08 +
          worldDominance * 0.06 -
          heroBodyColorAuthority * 0.06,
        0.08,
        0.22
      )
    );

    applyWeightedColor(
      this.heroMaterial.emissive,
      [
        {
          color: LASER_CYAN,
          weight:
            0.06 +
            coolStyleDrive * 0.16 +
            portal * 0.14 +
            laserAct * 0.08 +
            paletteVoid * 0.04 +
            paletteVoidTarget * 0.56 +
            orbFormWeight * 0.06 +
            diamondFormWeight * 0.06
        },
        {
          color: TRON_BLUE,
          weight:
            0.06 +
            coolStyleDrive * 0.16 +
            plume * 0.08 +
            matrixAct * 0.08 +
            laserAct * 0.06 +
            paletteTron * 0.06 +
            paletteTronTarget * 0.54 +
            cubeFormWeight * 0.16 +
            shardFormWeight * 0.06
        },
        {
          color: HOT_MAGENTA,
          weight:
            0.05 +
            hotStyleDrive * 0.18 +
            this.sectionChange * 0.06 +
            hueOrbit * 0.04 +
            eclipseAct * 0.08 +
            paletteSolar * 0.08 +
            paletteSolarTarget * 0.52 +
            pyramidFormWeight * 0.12 +
            shardFormWeight * 0.12
        },
        {
          color: TOXIC_PINK,
          weight:
            0.05 +
            toxicStyleDrive * 0.18 +
            this.sectionChange * 0.08 +
            hueOrbit * 0.04 +
            eclipseAct * 0.06 +
            paletteSolarTarget * 0.38 +
            prismFormWeight * 0.16 +
            mushroomFormWeight * 0.16 +
            prismaticDrive * 0.12
        },
        {
          color: VOLT_VIOLET,
          weight:
            0.06 +
            phrasePulse * 0.06 +
            heroVarietyDrive * 0.18 +
            paletteTronTarget * 0.08 +
            diamondFormWeight * 0.12 +
            prismFormWeight * 0.14 +
            shardFormWeight * 0.08
        },
        {
          color: ACID_LIME,
          weight:
            0.08 +
            acidStyleDrive * 0.16 +
            matrixAct * 0.12 +
            this.transientConfidence * 0.08 +
            paletteAcid * 0.08 +
            paletteAcidTarget * 0.52 +
            prismFormWeight * 0.1 +
            mushroomFormWeight * 0.12
        },
        {
          color: CYBER_YELLOW,
          weight:
            0.06 +
            hotStyleDrive * 0.1 +
            haloIgnition * 0.12 +
            beatPulse * 0.08 +
            laserAct * 0.04 +
            paletteSolarTarget * 0.24 +
            shardFormWeight * 0.12 +
            prismaticDrive * 0.1
        },
        {
          color: SOLAR_ORANGE,
          weight:
            0.04 +
            hotStyleDrive * 0.12 +
            paletteSolarTarget * 0.24 +
            pyramidFormWeight * 0.08 +
            shardFormWeight * 0.1
        },
        {
          color: ELECTRIC_WHITE,
          weight:
            0.02 +
            spectralStyleDrive * 0.08 +
            haloIgnition * 0.08 +
            ghostAfterimage * 0.08 +
            ghostAct * 0.06 +
            paletteGhost * 0.06 +
            paletteGhostTarget * 0.36 +
            diamondFormWeight * 0.1
        }
      ]
    );
    this.heroMaterial.emissive
      .copy(this.heroPrimaryColor)
      .lerp(this.heroAccentColor, paletteAccentMix)
      .lerp(this.heroPulseColor, palettePulseMix);
    saturateColor(
      this.heroMaterial.emissive,
      0.18 + heroBodyColorAuthority * 0.12,
      0.06 + prismaticColorDrive * 0.04
    );
    this.heroMaterial.emissiveIntensity =
      0.024 +
      ambientGlow * 0.004 +
      this.body * 0.03 +
      this.resonance * 0.024 +
      portalOpen * 0.05 +
      haloIgnition * 0.14 +
      eventGlow *
        (0.16 +
          dropPulse * 0.22 +
          this.sectionChange * 0.1 +
          beatPulse * 0.06 +
          laserAct * 0.1 +
          matrixAct * 0.1) +
      glowOverdrive * 0.06 +
      prismaticDrive * 0.05 +
      hotStyleDrive * 0.03 +
      acidStyleDrive * 0.03 +
      spectralStyleDrive * 0.022 +
      heroVarietyDrive * 0.024 +
      heroBodyColorAuthority * 0.042;
    this.heroMaterial.emissiveIntensity *= heroAdditiveClamp;
    this.heroMaterial.opacity = THREE.MathUtils.clamp(
      0.28 +
        heroPlanWeight * 0.04 -
        chamberDominance * 0.04 -
        worldDominance * 0.05 -
        hauntFamily * 0.02 -
        resetFamily * 0.04 +
        this.body * 0.04 +
        radiance * 0.03 +
        eventGlow * 0.08 +
        laserAct * 0.02 +
        matrixAct * 0.02 +
        heroBodyColorAuthority * 0.08,
      0.24,
      0.58
    );
    this.heroMaterial.transmission = THREE.MathUtils.clamp(
      0.03 +
        radiance * 0.04 +
        plume * 0.03 +
        chromaWarp * 0.02 +
        eventGlow * 0.04 +
        laserAct * 0.03 -
        heroBodyColorAuthority * 0.026 -
        nonOrbFormPresence * 0.022,
      0.02,
      0.16
    );
    this.heroMaterial.thickness = THREE.MathUtils.clamp(
      0.96 + radiance * 0.2 + laserAct * 0.14 + matrixAct * 0.08,
      0.88,
      1.28
    );
    this.heroMaterial.roughness = THREE.MathUtils.clamp(
      0.2 +
        eclipse * 0.08 +
        (1 - this.brightness) * 0.06 +
        this.roughness * 0.04 -
        heroBodyColorAuthority * 0.04,
      0.14,
      0.4
    );
    this.heroMaterial.metalness = THREE.MathUtils.clamp(
      0.02 + geometryBias * 0.08 + cathedral * 0.04 + chromaWarp * 0.03,
      0.02,
      0.22
    );
    this.heroMaterial.clearcoat = THREE.MathUtils.clamp(
      0.34 + radiance * 0.16 + portal * 0.08 + laserAct * 0.08 + heroBodyColorAuthority * 0.08,
      0.3,
      0.72
    );
    this.heroMaterial.clearcoatRoughness = THREE.MathUtils.clamp(
      0.24 + eclipse * 0.08 + (1 - this.brightness) * 0.06,
      0.2,
      0.42
    );

    this.coreMesh.scale.setScalar(
      0.86 +
        this.body * 0.28 +
        this.musicConfidence * 0.18 +
        this.liftPulse * 0.12 +
        this.preDropTension * 0.08 +
        dropPulse * 0.22
    );
    applyWeightedColor(
      this.coreMaterial.emissive,
      [
        {
          color: SOLAR_ORANGE,
          weight: 0.08 + solarDrive * 0.1 + paletteSolarTarget * 0.34 + pyramidFormWeight * 0.08
        },
        {
          color: HOT_MAGENTA,
          weight:
            0.04 +
            solarStyleDrive * 0.1 +
            hueOrbit * 0.04 +
            eclipseAct * 0.08 +
            paletteSolarTarget * 0.42
        },
        {
          color: LASER_CYAN,
          weight:
            0.06 +
            coolStyleDrive * 0.16 +
            portal * 0.12 +
            laserAct * 0.08 +
            paletteVoidTarget * 0.42
        },
        {
          color: TRON_BLUE,
          weight:
            0.06 +
            coolStyleDrive * 0.1 +
            plume * 0.08 +
            matrixAct * 0.08 +
            paletteTron * 0.06 +
            paletteTronTarget * 0.36
        },
        {
          color: VOLT_VIOLET,
          weight:
            0.04 +
            phrasePulse * 0.04 +
            prismaticDrive * 0.14 +
            portal * 0.04 +
            ghostAct * 0.04
        },
        {
          color: ACID_LIME,
          weight:
            0.06 +
            acidStyleDrive * 0.12 +
            this.transientConfidence * 0.08 +
            matrixAct * 0.08 +
            paletteAcidTarget * 0.42
        },
        {
          color: CYBER_YELLOW,
          weight:
            0.06 +
            haloIgnition * 0.14 +
            solarDrive * 0.08 +
            paletteSolarTarget * 0.26 +
            prismaticDrive * 0.14
        },
        {
          color: ELECTRIC_WHITE,
          weight:
            0.06 +
            ghostAfterimage * 0.12 +
            haloIgnition * 0.12 +
            this.dropImpact * 0.08 +
            ghostAct * 0.08 +
            paletteGhostTarget * 0.4
        }
      ]
    );
    this.coreMaterial.color
      .copy(HERO_DARK)
      .lerp(this.heroAccentColor, 0.24 + heroBodyColorAuthority * 0.12)
      .lerp(this.heroPulseColor, palettePulseMix * 0.22);
    this.coreMaterial.emissive
      .copy(this.heroAccentColor)
      .lerp(this.heroPulseColor, 0.26 + palettePulseMix * 0.42)
      .lerp(this.heroPrimaryColor, 0.08 + (1 - palettePrimaryAuthority) * 0.08);
    saturateColor(this.coreMaterial.emissive, 0.24 + prismaticColorDrive * 0.12, 0.05);
    this.coreMaterial.emissiveIntensity =
      0.28 +
      ambientGlow * 0.08 +
      this.brightness * 0.26 +
      this.resonance * 0.22 +
      haloIgnition * 0.28 +
      eventGlow * (0.48 + dropPulse * 0.48 + this.sectionChange * 0.2) +
      glowOverdrive * 0.12 +
      prismaticDrive * 0.1;
    this.coreMaterial.emissiveIntensity += heroBodyColorAuthority * 0.14;
    this.coreMaterial.emissiveIntensity *= 0.8 + heroAdditiveClamp * 0.2;
    this.coreMaterial.opacity = THREE.MathUtils.clamp(
      0.52 + this.brightness * 0.08 + radiance * 0.06,
      0.5,
      0.78
    );
    this.coreMaterial.transmission = THREE.MathUtils.clamp(
      0.26 + radiance * 0.16 + plume * 0.06 + chromaWarp * 0.08,
      0.24,
      0.52
    );

    this.voidCoreMesh.scale.setScalar(
      0.8 +
        eclipse * 0.7 +
        collapse * 1.4 +
        this.releasePulse * 0.18 +
        this.preDropTension * 0.16 -
        dropPulse * 0.12
    );
    this.voidCoreMaterial.opacity = THREE.MathUtils.clamp(
      0.76 + eclipse * 0.12 + collapse * 0.14,
      0.72,
      1
    );

    this.membraneMesh.scale.setScalar(
      1.04 +
        this.air * 0.24 +
        portal * 0.14 +
        plume * 0.22 +
        this.resonance * 0.08 +
        shellBloom * 0.12 +
        membranePulse * 0.06
    );
    this.membraneMesh.scale.set(
      this.membraneMesh.scale.x * (1 + shellTension * 0.06 + membranePulse * 0.04),
      this.membraneMesh.scale.y * (1 - shellTension * 0.05 + shellBloom * 0.06),
      this.membraneMesh.scale.z * (1 + shellOrbit * 0.04)
    );
    this.membraneMesh.rotation.x = Math.PI * 0.06 * shellBloom + Math.sin(membraneClock * 0.42) * shellOrbit * 0.18;
    this.membraneMesh.rotation.y = Math.cos(membraneClock * 0.32) * shellOrbit * 0.22 + shellDrift.x * 0.2;
    this.membraneMesh.rotation.z = Math.sin(membraneClock * 0.26) * shellTension * 0.16 + shellDrift.y * 0.18;
    this.membraneMesh.position.set(
      Math.sin(membraneClock * 0.24) * shellOrbit * 0.12 + shellDrift.x * 0.42,
      Math.cos(membraneClock * 0.18) * shellBloom * 0.08 + shellDrift.y * 0.36,
      -shellTension * 0.08 + shellBloom * 0.06 + shellDrift.z * 0.4
    );
    applyWeightedColor(
      this.membraneMaterial.color,
      [
        {
          color: LASER_CYAN,
          weight:
            0.08 +
            coolStyleDrive * 0.16 +
            plume * 0.12 +
            portal * 0.12 +
            laserAct * 0.06 +
            paletteVoidTarget * 0.46
        },
        {
          color: TRON_BLUE,
          weight:
            0.06 +
            coolStyleDrive * 0.12 +
            portal * 0.08 +
            matrixAct * 0.08 +
            laserAct * 0.06 +
            paletteTronTarget * 0.34
        },
        {
          color: VOLT_VIOLET,
          weight:
            0.04 +
            phrasePulse * 0.03 +
            plume * 0.03 +
            ghostAct * 0.04 +
            prismaticDrive * 0.12
        },
        {
          color: TOXIC_PINK,
          weight:
            0.04 +
            this.sectionChange * 0.08 +
            solarStyleDrive * 0.06 +
            eclipseAct * 0.08 +
            paletteSolarTarget * 0.42
        },
        {
          color: HOT_MAGENTA,
          weight:
            0.04 +
            solarStyleDrive * 0.08 +
            hueOrbit * 0.04 +
            eclipseAct * 0.08 +
            paletteSolarTarget * 0.48
        },
        {
          color: ACID_LIME,
          weight:
            0.06 +
            acidStyleDrive * 0.14 +
            chromaPulse * 0.08 +
            matrixAct * 0.08 +
            paletteAcidTarget * 0.44
        },
        {
          color: CYBER_YELLOW,
          weight:
            0.04 +
            haloIgnition * 0.08 +
            beatPulse * 0.06 +
            solarDrive * 0.06 +
            paletteSolarTarget * 0.24 +
            prismaticDrive * 0.12
        },
        {
          color: ELECTRIC_WHITE,
          weight:
            0.06 +
            plume * 0.12 +
            this.dropImpact * 0.08 +
            chromaWarp * 0.1 +
            ghostAct * 0.06 +
            paletteGhostTarget * 0.34
        },
        {
          color: MATRIX_GREEN,
          weight:
            0.04 +
            acidDrive * 0.1 +
            chromaPulse * 0.08 +
            matrixAct * 0.08 +
            paletteAcidTarget * 0.28
        }
      ]
    );
    saturateColor(this.membraneMaterial.color, 0.38, 0.02);
    this.membraneMaterial.opacity =
      (ambientGlow *
        (0.024 +
          this.air * 0.05 +
          this.resonance * 0.024 +
          plume * 0.024 +
          shellHalo * 0.024) +
        eventGlow *
          (portalOpen * 0.06 +
            this.dropImpact * 0.08 +
            this.sectionChange * 0.04 +
            this.beatStrike * 0.02 +
            glowOverdrive * 0.028)) *
      this.qualityProfile.auraOpacityMultiplier;
    this.membraneMaterial.opacity *= (0.78 + heroAdditiveClamp * 0.22) * heroOverfillClamp;

    this.crownMesh.rotation.z =
      elapsedSeconds * (0.22 + portal * 0.14 + cathedral * 0.08 + this.preDropTension * 0.08) +
      gazeX * 0.04 +
      this.barPhase * 0.42 +
      Math.sin(crownClock * 0.44) * shellOrbit * 0.22 +
      shellDrift.x * 0.2;
    this.crownMesh.rotation.y = Math.cos(crownClock * 0.3) * shellTension * 0.18 + shellDrift.z * 0.12;
    this.crownMesh.position.set(
      Math.sin(crownClock * 0.28) * shellOrbit * 0.18 + shellDrift.x * 0.58,
      Math.cos(crownClock * 0.34) * shellBloom * 0.12 + shellDrift.y * 0.44,
      shellBloom * 0.06 - shellTension * 0.1 + shellDrift.z * 0.48
    );
    this.crownMesh.scale.set(
      1 + this.body * 0.06 + portalOpen * 0.34 + dropPulse * 0.24 + shellBloom * 0.18 + crownPulse * 0.08,
      0.86 + eclipse * 0.22 + collapse * 0.28 + shellTension * 0.22,
      1
    );
    applyWeightedColor(
      this.crownMaterial.color,
      [
        {
          color: LASER_CYAN,
          weight:
            0.06 +
            portal * 0.18 +
            coolStyleDrive * 0.12 +
            laserAct * 0.06 +
            paletteVoidTarget * 0.34
        },
        {
          color: TRON_BLUE,
          weight:
            0.06 +
            coolStyleDrive * 0.12 +
            portal * 0.12 +
            matrixAct * 0.06 +
            laserAct * 0.06 +
            paletteTronTarget * 0.3
        },
        {
          color: HOT_MAGENTA,
          weight:
            0.04 +
            solarStyleDrive * 0.06 +
            hueOrbit * 0.04 +
            paletteSolarTarget * 0.3
        },
        {
          color: ACID_LIME,
          weight:
            0.06 +
            acidStyleDrive * 0.12 +
            chromaPulse * 0.1 +
            matrixAct * 0.08 +
            paletteAcidTarget * 0.36
        },
        {
          color: VOLT_VIOLET,
          weight:
            0.04 +
            phrasePulse * 0.04 +
            cathedral * 0.03 +
            ghostAct * 0.04 +
            prismaticDrive * 0.12
        },
        {
          color: CYBER_YELLOW,
          weight:
            0.04 +
            haloIgnition * 0.12 +
            beatPulse * 0.08 +
            solarDrive * 0.06 +
            paletteSolarTarget * 0.22
        },
        {
          color: ELECTRIC_WHITE,
          weight:
            0.08 +
            ghost * 0.14 +
            haloIgnition * 0.14 +
            ghostAct * 0.08 +
            paletteGhostTarget * 0.34
        }
      ]
    );
    saturateColor(this.crownMaterial.color, 0.42, 0.04);
    this.crownMaterial.opacity =
      (ambientGlow *
        (0.02 +
          this.shimmer * 0.022 +
          cathedral * 0.018 +
          this.preDropTension * 0.014 +
          shellHalo * 0.024) +
        eventGlow *
          (haloIgnition * 0.1 +
            portalOpen * 0.03 +
            dropPulse * 0.09 +
            this.sectionChange * 0.03 +
            this.beatStrike * 0.03 +
            glowOverdrive * 0.028)) *
      this.qualityProfile.auraOpacityMultiplier;
    this.crownMaterial.opacity *= (0.82 + heroAdditiveClamp * 0.18) * heroOverfillClamp;

    this.heroAuraMesh.rotation.copy(this.heroGroup.rotation);
    this.heroAuraMesh.rotation.x += Math.sin(membraneClock * 0.28) * shellOrbit * 0.16;
    this.heroAuraMesh.rotation.y += Math.cos(crownClock * 0.26) * shellTension * 0.14;
    this.heroAuraMesh.position.copy(this.heroGroup.position);
    this.heroAuraMesh.position.z += shellHalo * 0.06 + shellDrift.z * 0.18;
    this.heroAuraMesh.scale.copy(this.heroGroup.scale).multiplyScalar(
      1.1 + shellBloom * 0.1 + dropPulse * 0.06 + shellHalo * 0.04
    );
    applyWeightedColor(
      this.heroAuraMaterial.color,
      [
        {
          color: LASER_CYAN,
          weight:
            0.08 +
            coolStyleDrive * 0.16 +
            portal * 0.14 +
            laserAct * 0.08 +
            paletteVoidTarget * 0.42
        },
        {
          color: TRON_BLUE,
          weight:
            0.06 +
            coolStyleDrive * 0.1 +
            plume * 0.08 +
            matrixAct * 0.08 +
            paletteTronTarget * 0.3
        },
        {
          color: ACID_LIME,
          weight:
            0.06 +
            acidStyleDrive * 0.12 +
            this.transientConfidence * 0.08 +
            matrixAct * 0.08 +
            paletteAcidTarget * 0.34
        },
        {
          color: HOT_MAGENTA,
          weight:
            0.04 +
            solarStyleDrive * 0.06 +
            this.sectionChange * 0.04 +
            eclipseAct * 0.08 +
            paletteSolarTarget * 0.36
        },
        {
          color: VOLT_VIOLET,
          weight: 0.04 + prismaticDrive * 0.14 + phrasePulse * 0.04
        },
        {
          color: CYBER_YELLOW,
          weight:
            0.04 +
            haloIgnition * 0.08 +
            beatPulse * 0.04 +
            paletteSolarTarget * 0.18 +
            prismaticDrive * 0.12
        },
        {
          color: ELECTRIC_WHITE,
          weight:
            0.08 +
            haloIgnition * 0.1 +
            ghostAfterimage * 0.12 +
            ghostAct * 0.08 +
            paletteGhostTarget * 0.34
        }
      ]
    );
    this.heroAuraMaterial.color
      .copy(this.heroAccentColor)
      .lerp(this.heroPrimaryColor, 0.22 + (1 - palettePrimaryAuthority) * 0.12)
      .lerp(this.heroPulseColor, palettePulseMix * 0.28);
    saturateColor(this.heroAuraMaterial.color, 0.24 + prismaticColorDrive * 0.12, 0.08);
    this.heroAuraMaterial.opacity =
      (0.006 +
        ambientGlow *
        (0.009 +
          this.air * 0.012 +
          this.resonance * 0.008 +
          shellHalo * 0.014 +
          this.interBeatFloat * 0.012) +
        eventGlow *
          (0.22 +
            portalOpen * 0.06 +
            this.dropImpact * 0.12 +
            this.sectionChange * 0.07 +
            this.beatStrike * 0.06 +
            glowOverdrive * 0.06 +
            laserAct * 0.1 +
            matrixAct * 0.08)) *
      this.qualityProfile.auraOpacityMultiplier;
    this.heroAuraMaterial.opacity *=
      heroAdditiveClamp * heroOverfillClamp * (0.92 + (1 - heroBodyColorAuthority) * 0.08);
    this.heroAuraMaterial.opacity *= THREE.MathUtils.clamp(
      1 -
        shotWorldTakeover * 0.16 -
        shotPressure * 0.08 -
        chamberDominance * 0.08 -
        worldDominance * 0.12 -
        releaseFamily * 0.06,
      0.48,
      1
    );

    this.heroFresnelMesh.rotation.copy(this.heroGroup.rotation);
    this.heroFresnelMesh.rotation.x += Math.sin(membraneClock * 0.24) * shellOrbit * 0.12;
    this.heroFresnelMesh.rotation.y += Math.cos(crownClock * 0.2) * shellTension * 0.1;
    this.heroFresnelMesh.position.copy(this.heroGroup.position);
    this.heroFresnelMesh.position.z += shellHalo * 0.02 + shellDrift.z * 0.08;
    this.heroFresnelMesh.scale.copy(this.heroGroup.scale).multiplyScalar(
      1.12 + shellBloom * 0.1 + dropPulse * 0.08 + shellHalo * 0.05
    );
    applyWeightedColor(
      this.heroFresnelUniforms.colorPrimary.value,
      [
        {
          color: LASER_CYAN,
          weight: 0.08 + coolStyleDrive * 0.16 + portal * 0.14 + laserAct * 0.12 + paletteVoidTarget * 0.42
        },
        {
          color: TRON_BLUE,
          weight: 0.06 + coolStyleDrive * 0.12 + matrixAct * 0.12 + paletteTronTarget * 0.34
        },
        {
          color: ACID_LIME,
          weight: 0.06 + acidStyleDrive * 0.12 + matrixAct * 0.1 + paletteAcidTarget * 0.32
        },
        {
          color: HOT_MAGENTA,
          weight: 0.04 + solarStyleDrive * 0.08 + eclipseAct * 0.08 + paletteSolarTarget * 0.34
        },
        {
          color: VOLT_VIOLET,
          weight: 0.04 + prismaticDrive * 0.12 + phrasePulse * 0.04
        },
        {
          color: ELECTRIC_WHITE,
          weight: 0.06 + ghostStyleDrive * 0.12 + paletteGhostTarget * 0.28
        }
      ]
    );
    applyWeightedColor(
      this.heroFresnelUniforms.colorSecondary.value,
      [
        {
          color: ELECTRIC_WHITE,
          weight: 0.14 + haloIgnition * 0.12 + ghostAct * 0.1 + paletteGhostTarget * 0.34
        },
        {
          color: CYBER_YELLOW,
          weight: 0.06 + haloIgnition * 0.12 + beatPulse * 0.06 + paletteSolarTarget * 0.2
        },
        {
          color: HOT_MAGENTA,
          weight: 0.04 + this.sectionChange * 0.06 + eclipseAct * 0.1 + paletteSolarTarget * 0.28
        },
        {
          color: TRON_BLUE,
          weight: 0.06 + laserAct * 0.08 + paletteTronTarget * 0.22
        },
        {
          color: ACID_LIME,
          weight: 0.06 + matrixAct * 0.08 + paletteAcidTarget * 0.22
        },
        {
          color: VOLT_VIOLET,
          weight: 0.04 + prismaticDrive * 0.1
        }
      ]
    );
    this.heroFresnelUniforms.colorPrimary.value
      .copy(this.heroPrimaryColor)
      .lerp(this.heroAccentColor, paletteAccentMix * 0.42);
    this.heroFresnelUniforms.colorSecondary.value
      .copy(this.heroPulseColor)
      .lerp(this.heroAccentColor, 0.18 + palettePulseMix * 0.38)
      .lerp(ELECTRIC_WHITE, ghostStyleDrive * 0.12);
    this.heroFresnelUniforms.intensity.value =
      THREE.MathUtils.clamp(
        0.05 +
          ambientGlow * 0.08 +
          this.interBeatFloat * 0.05 +
          this.preBeatLift * 0.04 +
          eventGlow *
            (0.22 +
              this.beatStrike * 0.08 +
              this.dropImpact * 0.14 +
              this.sectionChange * 0.1 +
              laserAct * 0.14 +
              ghostAct * 0.08) -
          chamberDominance * 0.04 -
          worldDominance * 0.06 +
          hybridDominance * 0.02,
        0,
        0.46
      ) * this.qualityProfile.auraOpacityMultiplier;
    this.heroFresnelUniforms.intensity.value *= heroAdditiveClamp;
    this.heroFresnelUniforms.power.value = THREE.MathUtils.clamp(
      2.9 - eventGlow * 0.8 - this.dropImpact * 0.4 - laserAct * 0.2,
      1.9,
      3.1
    );
    this.heroFresnelUniforms.bias.value = THREE.MathUtils.clamp(
      0.1 + shellHalo * 0.06 + this.interBeatFloat * 0.04 + laserAct * 0.03,
      0.08,
      0.24
    );

    this.heroEnergyShellMesh.rotation.copy(this.heroGroup.rotation);
    this.heroEnergyShellMesh.rotation.x += Math.sin(membraneClock * 0.3) * shellOrbit * 0.12;
    this.heroEnergyShellMesh.rotation.y += Math.cos(crownClock * 0.24) * shellTension * 0.12;
    this.heroEnergyShellMesh.rotation.z += Math.sin(ghostClock * 0.22) * shellBloom * 0.1;
    this.heroEnergyShellMesh.position.copy(this.heroGroup.position);
    this.heroEnergyShellMesh.position.z += shellHalo * 0.04 + shellDrift.z * 0.1;
    this.heroEnergyShellMesh.scale.copy(this.heroGroup.scale).multiplyScalar(
      1.08 + shellBloom * 0.08 + dropPulse * 0.06 + shellHalo * 0.05
    );
    applyWeightedColor(
      this.heroEnergyShellMaterial.color,
      [
        {
          color: LASER_CYAN,
          weight: 0.08 + coolStyleDrive * 0.16 + portal * 0.12 + laserAct * 0.12 + paletteVoidTarget * 0.4
        },
        {
          color: TRON_BLUE,
          weight: 0.06 + coolStyleDrive * 0.12 + matrixAct * 0.12 + laserAct * 0.06 + paletteTronTarget * 0.34
        },
        {
          color: ACID_LIME,
          weight: 0.06 + acidStyleDrive * 0.14 + matrixAct * 0.12 + paletteAcidTarget * 0.38
        },
        {
          color: HOT_MAGENTA,
          weight: 0.04 + solarStyleDrive * 0.08 + eclipseAct * 0.08 + paletteSolarTarget * 0.34
        },
        {
          color: VOLT_VIOLET,
          weight: 0.04 + prismaticDrive * 0.12
        },
        {
          color: CYBER_YELLOW,
          weight: 0.04 + haloIgnition * 0.08 + beatPulse * 0.05 + paletteSolarTarget * 0.18
        },
        {
          color: ELECTRIC_WHITE,
          weight: 0.06 + ghostStyleDrive * 0.12 + haloIgnition * 0.06 + paletteGhostTarget * 0.28
        }
      ]
    );
    this.heroEnergyShellMaterial.color
      .copy(this.heroAccentColor)
      .lerp(this.heroPrimaryColor, 0.24 + (1 - palettePrimaryAuthority) * 0.14)
      .lerp(this.heroPulseColor, palettePulseMix * 0.32);
    saturateColor(this.heroEnergyShellMaterial.color, 0.36 + prismaticColorDrive * 0.18, 0.12);
    this.heroEnergyShellMaterial.opacity =
      (0.007 +
        ambientGlow *
        (0.008 +
          this.air * 0.008 +
          shellHalo * 0.01 +
          this.interBeatFloat * 0.01) +
        eventGlow *
          (0.12 +
            this.beatStrike * 0.05 +
            this.dropImpact * 0.1 +
            this.sectionChange * 0.07 +
            laserAct * 0.1 +
            matrixAct * 0.1 +
            ghostAct * 0.08)) *
      this.qualityProfile.auraOpacityMultiplier;
    this.heroEnergyShellMaterial.opacity *=
      heroAdditiveClamp * heroOverfillClamp * (0.88 + (1 - heroBodyColorAuthority) * 0.12);
    this.heroEnergyShellMaterial.opacity *= THREE.MathUtils.clamp(
      1 -
        shotWorldTakeover * 0.18 -
        shotPressure * 0.1 -
        chamberDominance * 0.08 -
        worldDominance * 0.12 -
        releaseFamily * 0.06,
      0.46,
      1
    );

    this.heroSeamMesh.rotation.copy(this.heroGroup.rotation);
    this.heroSeamMesh.rotation.x += Math.sin(membraneClock * 0.32) * shellOrbit * 0.14;
    this.heroSeamMesh.rotation.y += Math.cos(crownClock * 0.28) * shellTension * 0.1;
    this.heroSeamMesh.position.copy(this.heroGroup.position);
    this.heroSeamMesh.position.z += shellDrift.z * 0.12;
    this.heroSeamMesh.scale.copy(this.heroGroup.scale).multiplyScalar(
      1.03 + shellBloom * 0.06 + dropPulse * 0.03 + shellHalo * 0.03
    );
    applyWeightedColor(
      this.heroSeamMaterial.color,
      [
        {
          color: LASER_CYAN,
          weight: 0.08 + coolStyleDrive * 0.16 + laserAct * 0.14 + paletteVoidTarget * 0.38
        },
        {
          color: TRON_BLUE,
          weight: 0.06 + coolStyleDrive * 0.1 + matrixAct * 0.14 + paletteTronTarget * 0.32
        },
        {
          color: ACID_LIME,
          weight: 0.06 + acidStyleDrive * 0.12 + matrixAct * 0.12 + paletteAcidTarget * 0.34
        },
        {
          color: HOT_MAGENTA,
          weight: 0.04 + solarStyleDrive * 0.06 + eclipseAct * 0.1 + paletteSolarTarget * 0.34
        },
        {
          color: VOLT_VIOLET,
          weight: 0.04 + prismaticDrive * 0.12
        },
        {
          color: CYBER_YELLOW,
          weight: 0.04 + haloIgnition * 0.1 + beatPulse * 0.06 + laserAct * 0.04 + paletteSolarTarget * 0.16
        },
        {
          color: ELECTRIC_WHITE,
          weight: 0.06 + ghostStyleDrive * 0.12 + ghostAfterimage * 0.1 + paletteGhostTarget * 0.3
        }
      ]
    );
    this.heroSeamMaterial.color
      .copy(this.heroPrimaryColor)
      .lerp(this.heroAccentColor, 0.18 + paletteAccentMix * 0.28)
      .lerp(this.heroPulseColor, palettePulseMix * 0.18);
    saturateColor(this.heroSeamMaterial.color, 0.28 + heroBodyColorAuthority * 0.12, 0.08);
    this.heroSeamMaterial.opacity =
      (0.014 +
        ambientGlow *
        (0.05 +
          this.air * 0.022 +
          shellHalo * 0.04 +
          laserAct * 0.016 +
          this.interBeatFloat * 0.02) +
        eventGlow *
          (0.34 +
            this.beatStrike * 0.1 +
            this.dropImpact * 0.16 +
            this.sectionChange * 0.1 +
            haloIgnition * 0.12 +
            laserAct * 0.12 +
            matrixAct * 0.08)) *
      this.qualityProfile.auraOpacityMultiplier;
    this.heroSeamMaterial.opacity *= 0.88 + heroAdditiveClamp * 0.12;
    this.heroSeamMaterial.opacity *= heroWirefieldClamp;
    this.heroSeamMaterial.opacity *= heroWireShapeClamp;
    this.heroSeamMaterial.opacity *= heroLineSuppression;

    this.heroEdgesMaterial.opacity =
      0.012 +
      ambientGlow *
        (0.04 +
          geometryBias * 0.03 +
          cathedral * 0.02 +
          shellHalo * 0.028 +
          laserAct * 0.018 +
          this.interBeatFloat * 0.02) +
      eventGlow *
        (ghostAfterimage * 0.1 +
          this.sectionChange * 0.16 +
          glowOverdrive * 0.08 +
          this.beatStrike * 0.14 +
          this.dropImpact * 0.14 +
          laserAct * 0.18 +
          matrixAct * 0.1);
    this.heroEdgesMaterial.opacity *= 0.86 + heroAdditiveClamp * 0.14;
    this.heroEdgesMaterial.opacity *= heroWirefieldClamp;
    this.heroEdgesMaterial.opacity *= heroWireShapeClamp;
    this.heroEdgesMaterial.opacity *= heroLineSuppression;
    this.heroEdgesMaterial.color
      .copy(this.heroPulseColor)
      .lerp(this.heroPrimaryColor, 0.26 + (1 - palettePrimaryAuthority) * 0.12)
      .lerp(this.heroAccentColor, 0.14 + paletteAccentMix * 0.22)
      .lerp(ELECTRIC_WHITE, ghostStyleDrive * 0.1);
    this.heroEdges.rotation.copy(this.heroGroup.rotation);
    this.heroEdges.rotation.x += Math.sin(crownClock * 0.26) * shellOrbit * 0.08;
    this.heroEdges.rotation.y += Math.cos(crownClock * 0.22) * shellTension * 0.08;
    this.heroEdges.scale.copy(this.heroGroup.scale).multiplyScalar(
      1.04 + shellHalo * 0.05 + dropPulse * 0.02
    );
    this.heroEdges.position.set(
      -Math.sin(crownClock * 0.2) * shellOrbit * 0.06 - shellDrift.x * 0.24,
      Math.cos(crownClock * 0.18) * shellBloom * 0.04 + shellDrift.y * 0.18,
      shellHalo * 0.04 + shellDrift.z * 0.2
    );

    this.ghostHeroMesh.scale.setScalar(
      1.02 + ghost * 0.16 + eclipse * 0.08 + ghostAfterimage * 0.34 + shellBloom * 0.08 + ghostPulse * 0.04
    );
    this.ghostHeroMesh.rotation.set(
      -this.heroGroup.rotation.x * 0.48 + Math.sin(ghostClock * 0.3) * shellOrbit * 0.1 + shellDrift.y * 0.1,
      -this.heroGroup.rotation.y * 0.42 + shellDrift.x * 0.12,
      Math.cos(ghostClock * 0.22) * shellHalo * 0.12 + shellDrift.z * 0.12
    );
    this.ghostHeroMesh.position.set(
      shellDrift.x * 0.34,
      shellDrift.y * 0.28,
      shellDrift.z * 0.3
    );
    this.ghostHeroMaterial.color
      .copy(this.heroAccentColor)
      .lerp(this.heroPulseColor, 0.24 + spectralStyleDrive * 0.24)
      .lerp(ELECTRIC_WHITE, 0.12 + ghostStyleDrive * 0.18);
    this.ghostHeroMaterial.opacity =
      ambientGlow * (ghost * 0.02 + eclipse * 0.01 + shellHalo * 0.012) +
      eventGlow *
        (ghostAfterimage * 0.07 +
          this.releasePulse * 0.03 +
          this.releaseTail * 0.04);
    this.ghostHeroMaterial.opacity *= 0.84 + heroAdditiveClamp * 0.16;
    this.ghostHeroMaterial.opacity *= 0.92 + heroWirefieldClamp * 0.08;

    const heroLightBudget =
      this.qualityProfile.tier === 'safe'
        ? 0.64
        : this.qualityProfile.tier === 'balanced'
          ? 0.82
          : 1;
    this.heroGlowLight.color.copy(this.heroMaterial.emissive);
    this.heroGlowLight.intensity =
      (0.12 +
        this.heroMaterial.emissiveIntensity * 2.8 +
        heroBodyColorAuthority * 0.44 +
        eventGlow * 0.18) *
      heroLightBudget;
    this.heroGlowLight.distance = 6.4 + heroBodyColorAuthority * 3.2 + this.dropImpact * 1.8;
    this.heroAccentLight.color.copy(this.coreMaterial.emissive);
    this.heroAccentLight.intensity =
      (0.08 +
        this.coreMaterial.emissiveIntensity * 1.04 +
        paletteAccentMix * 0.3 +
        palettePulseMix * 0.18) *
      heroLightBudget;
    this.heroAccentLight.distance = 4.8 + paletteAccentMix * 2.6 + this.liftPulse * 1.4;

    this.twinMeshes.forEach((mesh, index) => {
      const side = index === 0 ? -1 : 1;
      const split = twinSplit * (0.8 + index * 0.08);
      const twinLight = this.twinLights[index];
      const twinLeadColor =
        index === 0 ? this.heroAccentColor : this.heroPulseColor;
      const twinAccentColor =
        index === 0 ? this.heroPulseColor : this.heroPrimaryColor;
      mesh.visible = split > 0.02;
      mesh.position.set(
        side * split * (1 + this.directorGeometry * 0.44),
        Math.sin(elapsedSeconds * 0.5 + index * Math.PI) * 0.14 * split,
        -split * 0.4
      );
      mesh.rotation.y = this.heroGroup.rotation.y + side * split * 0.6;
      mesh.scale.setScalar(0.62 + split * 0.42 + this.liftPulse * 0.08);
      mesh.material.opacity = split * 0.44;
      mesh.material.color
        .copy(HERO_DARK)
        .lerp(twinLeadColor, 0.36 + split * 0.18 + paletteAccentMix * 0.18)
        .lerp(twinAccentColor, 0.12 + palettePulseMix * 0.16);
      mesh.material.emissive
        .copy(twinLeadColor)
        .lerp(twinAccentColor, 0.24 + split * 0.12 + palettePulseMix * 0.18)
        .lerp(ELECTRIC_WHITE, this.liftPulse * 0.08 + split * 0.06 + ghostStyleDrive * 0.08);
      mesh.material.emissiveIntensity =
        (0.16 + split * 0.34 + this.liftPulse * 0.12 + heroBodyColorAuthority * 0.08) *
        (0.82 + heroAdditiveClamp * 0.18);
      if (twinLight) {
        twinLight.color.copy(mesh.material.emissive);
        twinLight.intensity = mesh.visible
          ? (0.04 + mesh.material.emissiveIntensity * 0.7 + split * 0.18) * heroLightBudget
          : 0;
        twinLight.distance = 2.6 + split * 2.2;
      }
    });
  }

  private updateAccents(elapsedSeconds: number, deltaSeconds: number): void {
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const storm = this.familyWeights['storm-crown'];
    const ghost = this.familyWeights['ghost-lattice'];
    const haloIgnition = this.eventAmount('halo-ignition');
    const portalOpen = this.eventAmount('portal-open');
    const worldActivity = this.directorWorldActivity;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const paletteVoid = this.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = this.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = this.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = this.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = this.paletteState === 'ghost-white' ? 1 : 0;
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const chromaWarp = this.directorColorWarp;
    const chromaPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 4 + elapsedSeconds * 0.16);
    const beatPulse = onsetPulse(this.beatPhase);
    const phrasePulse = phasePulse(this.phrasePhase, elapsedSeconds * 0.44);

    this.satellites.forEach((satellite, index) => {
      const angle =
        elapsedSeconds *
          satellite.orbitSpeed *
          (0.5 +
            portal * 0.8 +
            cathedral * 0.26 +
            this.directorLaserDrive * 0.34 +
            worldActivity * 0.22 +
            this.preDropTension * 0.14 +
            this.dropImpact * 0.18) +
        satellite.offset;
      const orbitRadius =
        satellite.orbitRadius +
        portal * 0.6 +
        this.body * 0.18 +
        this.liftPulse * 0.22 +
        this.sectionChange * 0.16;
      satellite.mesh.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 1.14) * orbitRadius * 0.42,
        Math.sin(angle * 0.76) * 1.2 - portal * 0.6
      );
      satellite.mesh.rotation.set(angle * 0.7, angle * 0.6, angle * 0.4);
      satellite.mesh.material.color
        .copy(ELECTRIC_WHITE)
        .lerp(LASER_CYAN, portal * 0.34 + ghost * 0.12 + coolBias * 0.2 + laserAct * 0.12 + paletteVoid * 0.22)
        .lerp(TRON_BLUE, matrixAct * 0.12 + paletteTron * 0.18)
        .lerp(ACID_LIME, this.shimmer * 0.1 + beatPulse * 0.12 + matrixAct * 0.12 + paletteAcid * 0.24)
        .lerp(SOLAR_ORANGE, this.harmonicColor * 0.14 + haloIgnition * 0.12 + warmBias * 0.1 + paletteSolar * 0.18)
        .lerp(HOT_MAGENTA, phrasePulse * 0.04 + this.dropImpact * 0.05 + eclipseAct * 0.08 + paletteSolar * 0.06)
        .lerp(ELECTRIC_WHITE, ghostAct * 0.06 + paletteGhost * 0.18)
        .lerp(CYBER_YELLOW, haloIgnition * 0.1 + paletteSolar * 0.06);
      satellite.mesh.material.opacity =
        ambientGlow * (0.026 + portal * 0.02 + cathedral * 0.012 + worldActivity * 0.014) +
        eventGlow * (haloIgnition * 0.16 + this.shimmer * 0.1 + this.dropImpact * 0.14);
      satellite.mesh.material.emissiveIntensity =
        0.08 +
        ambientGlow * 0.08 +
        this.shimmer * 0.12 +
        haloIgnition * 0.24 +
        eventGlow * 0.18 +
        this.dropImpact * 0.14;
    });

    this.shards.forEach((shard) => {
      const angle =
        elapsedSeconds *
          shard.orbitSpeed *
          (0.54 +
            storm * 1.2 +
            this.directorLaserDrive * 0.46 +
            worldActivity * 0.28 +
            this.dropImpact * 0.24 +
            this.preDropTension * 0.16) +
        shard.offset;
      const orbitRadius =
        shard.orbitRadius +
        storm * 1.2 +
        this.accent * 0.3 +
        this.strikePulse * 0.36 +
        beatPulse * this.dropImpact * 0.42;
      shard.mesh.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 1.4 + shard.tilt) * orbitRadius * 0.34,
        Math.cos(angle * 0.7 + shard.tilt) * 0.9 - storm * 0.4
      );
      shard.mesh.rotation.set(angle * 1.2, angle * 0.7, angle * 1.4);
      shard.mesh.scale.setScalar(0.72 + storm * 0.3 + this.accent * 0.18);
      shard.mesh.material.color
        .copy(ELECTRIC_WHITE)
        .lerp(LASER_CYAN, (1 - this.harmonicColor) * 0.28 + storm * 0.18 + coolBias * 0.18 + laserAct * 0.12 + paletteVoid * 0.16)
        .lerp(TRON_BLUE, matrixAct * 0.12 + paletteTron * 0.16)
        .lerp(ACID_LIME, beatPulse * 0.08 + this.transientConfidence * 0.08 + matrixAct * 0.1 + paletteAcid * 0.22)
        .lerp(SOLAR_ORANGE, this.harmonicColor * 0.16 + storm * 0.08 + warmBias * 0.1 + paletteSolar * 0.18)
        .lerp(HOT_MAGENTA, phrasePulse * 0.04 + this.dropImpact * 0.05 + eclipseAct * 0.08 + paletteSolar * 0.06)
        .lerp(ELECTRIC_WHITE, ghost * 0.12 + beatPulse * 0.08 + paletteGhost * 0.18);
      shard.mesh.material.opacity =
        ambientGlow * (0.018 + storm * 0.02 + worldActivity * 0.014) +
        eventGlow * (this.accent * 0.14 + this.strikePulse * 0.16 + this.dropImpact * 0.18);
      shard.mesh.material.emissiveIntensity =
        0.06 +
        ambientGlow * 0.06 +
        storm * 0.18 +
        this.strikePulse * 0.22 +
        portalOpen * 0.08 +
        eventGlow * 0.16 +
        this.dropImpact * 0.16;
    });

    let strongestWaveLight = 0;
    let strongestWaveAccent = 0;
    let strongestWaveX = 0;
    let strongestWaveY = -0.12;
    let strongestWaveZ = -0.8;
    let strongestWaveBand: PressureWaveBand = 'mid';
    let strongestWaveCycle = 0;

    this.pressureWaves.forEach((wave, index) => {
      if (!wave.active) {
        return;
      }

      wave.age += deltaSeconds;

      const groundSwell = wave.style === 'ground-swell' ? 1 : 0;
      const torsionArc = wave.style === 'torsion-arc' ? 1 : 0;
      const ionCrown = wave.style === 'ion-crown' ? 1 : 0;
      const duration =
        0.86 +
        wave.intensity * (groundSwell * 0.72 + torsionArc * 0.56 + ionCrown * 0.46) +
        wave.haloBias * 0.18;
      const progress = wave.age / duration;
      if (progress >= 1) {
        wave.active = false;
        wave.group.visible = false;
        wave.waveMesh.material.opacity = 0;
        wave.torusMesh.material.opacity = 0;
        wave.haloMesh.material.opacity = 0;

        return;
      }

      const growth = THREE.MathUtils.smoothstep(progress, 0, 1);
      const pulse = pulseShape(progress);
      const frontPulse = pulseShape(THREE.MathUtils.clamp(progress * 1.08 + 0.02, 0, 1));
      const haloPulse = pulseShape(THREE.MathUtils.clamp(progress * 0.82 + 0.12, 0, 1));
      const residuePulse = Math.pow(1 - progress, 1.32);
      const baseScale = 1.02 + growth * wave.expansion;
      const driftBlend = growth * (groundSwell * 0.22 + torsionArc * 0.36 + ionCrown * 0.24);
      const verticalOrbit =
        Math.sin(progress * Math.PI * (groundSwell * 1.2 + torsionArc * 1.7 + ionCrown * 2.2) + index * 0.62) *
        (groundSwell * 0.02 + torsionArc * 0.05 + ionCrown * 0.08);
      const spinAmount =
        elapsedSeconds * wave.spin * (0.12 + pulse * 0.18 + ionCrown * 0.16) +
        growth * wave.spin * (groundSwell * 0.48 + torsionArc * 1.2 + ionCrown * 1.8);
      const groupX = wave.driftX * driftBlend;
      const groupY = wave.anchorY + wave.driftY * driftBlend + verticalOrbit;
      const groupZ =
        wave.anchorZ +
        wave.depthBias * (0.18 + growth * 0.2) -
        groundSwell * growth * 0.12 +
        ionCrown * growth * 0.14 -
        index * 0.012;
      wave.group.visible = true;
      wave.group.position.set(groupX, groupY, groupZ);
      wave.group.rotation.set(
        Math.PI / 2 +
          wave.tiltX * (groundSwell * 0.26 + torsionArc * 0.52 + ionCrown * 0.68),
        wave.tiltY * (groundSwell * 0.24 + torsionArc * 0.62 + ionCrown * 0.88),
        spinAmount * (groundSwell * 0.28 + torsionArc * 0.74 + ionCrown)
      );
      wave.waveMesh.scale.set(
        baseScale * (groundSwell * 1.22 + torsionArc * 0.96 + ionCrown * 0.78),
        baseScale *
          (groundSwell * 0.58 +
            torsionArc * 0.84 +
            ionCrown * 0.56 +
            Math.abs(wave.tiltX) * 0.08),
        1
      );
      wave.torusMesh.scale.setScalar(
        baseScale * (groundSwell * 0.94 + torsionArc * 0.78 + ionCrown * 0.64)
      );
      wave.torusMesh.rotation.set(
        wave.tiltX * (groundSwell * 0.22 + torsionArc * 0.48 + ionCrown * 0.42) +
          growth * wave.spin * (groundSwell * 0.08 + torsionArc * 0.22 + ionCrown * 0.18),
        wave.tiltY * (groundSwell * 0.28 + torsionArc * 0.62 + ionCrown * 0.5) +
          growth * wave.spin * (torsionArc * 0.12 + ionCrown * 0.18),
        -spinAmount * (groundSwell * 0.14 + torsionArc * 0.34 + ionCrown * 0.22)
      );
      wave.haloMesh.scale.set(
        baseScale * (groundSwell * 0.68 + torsionArc * 0.74 + ionCrown * 0.92),
        baseScale *
          (groundSwell * 0.28 +
            torsionArc * 0.46 +
            ionCrown * 0.9 +
            wave.haloBias * 0.04),
        1
      );
      wave.haloMesh.rotation.set(
        wave.tiltY * (groundSwell * 0.12 + torsionArc * 0.28 + ionCrown * 0.22),
        Math.PI / 2 + growth * wave.spin * (groundSwell * 0.22 + torsionArc * 0.44 + ionCrown * 0.82),
        wave.tiltX * (groundSwell * 0.08 + torsionArc * 0.18 + ionCrown * 0.16) -
          spinAmount * (groundSwell * 0.08 + torsionArc * 0.16 + ionCrown * 0.1)
      );
      copyPressureWaveColor(this.pressureWaveColorScratch, wave.band, wave.colorCycle);
      copyPressureWaveColor(this.pressureWaveColorScratchB, wave.band, wave.colorCycle, 1);
      wave.waveMesh.material.color
        .copy(this.pressureWaveColorScratch)
        .lerp(this.heroPrimaryColor, 0.08 + torsionArc * 0.06 + ionCrown * 0.08)
        .lerp(this.heroAccentColor, 0.04 + ionCrown * 0.06)
        .lerp(this.pressureWaveColorScratchB, 0.12 + wave.haloBias * 0.06)
        .lerp(ELECTRIC_WHITE, pulse * 0.02 + ionCrown * 0.04);
      copyPressureWaveColor(this.pressureWaveColorScratch, wave.band, wave.colorCycle, 1);
      wave.torusMesh.material.color
        .copy(this.pressureWaveColorScratch)
        .lerp(this.heroPulseColor, 0.1 + torsionArc * 0.08 + ionCrown * 0.12)
        .lerp(this.heroAccentColor, 0.06 + groundSwell * 0.04)
        .lerp(ELECTRIC_WHITE, frontPulse * 0.05 + beatPulse * 0.04 + ionCrown * 0.04);
      copyPressureWaveColor(this.pressureWaveColorScratch, wave.band, wave.colorCycle, 2);
      wave.haloMesh.material.color
        .copy(this.pressureWaveColorScratch)
        .lerp(this.heroAccentColor, 0.08 + wave.haloBias * 0.08)
        .lerp(this.heroPulseColor, 0.05 + torsionArc * 0.06)
        .lerp(ELECTRIC_WHITE, residuePulse * 0.04 + ghost * 0.04 + ghostAct * 0.06);
      wave.waveMesh.material.opacity =
        pulse *
        (0.028 +
          ambientGlow * 0.01 +
          wave.intensity * (groundSwell * 0.036 + torsionArc * 0.05 + ionCrown * 0.032) +
          eventGlow * (groundSwell * 0.02 + torsionArc * 0.024 + ionCrown * 0.018)) *
        wave.glowBias *
        this.qualityProfile.auraOpacityMultiplier;
      wave.torusMesh.material.opacity =
        frontPulse *
        (0.04 +
          wave.intensity * (groundSwell * 0.056 + torsionArc * 0.07 + ionCrown * 0.062) +
          this.dropImpact * 0.026 +
          eventGlow * 0.03) *
        (0.84 + wave.glowBias * 0.16) *
        this.qualityProfile.auraOpacityMultiplier;
      wave.haloMesh.material.opacity =
        (haloPulse * 0.7 + residuePulse * 0.46) *
        (0.018 +
          ambientGlow * 0.012 +
          wave.intensity * (groundSwell * 0.018 + torsionArc * 0.028 + ionCrown * 0.05) +
          ghost * 0.014 +
          ghostAct * 0.018) *
        wave.haloBias *
        this.qualityProfile.auraOpacityMultiplier;

      const waveLightAmount =
        (wave.torusMesh.material.opacity * 1.24 +
          wave.haloMesh.material.opacity * 0.96 +
          wave.waveMesh.material.opacity * 0.72) *
        (0.76 + wave.glowBias * 0.34);
      if (waveLightAmount > strongestWaveLight) {
        strongestWaveLight = waveLightAmount;
        strongestWaveAccent = wave.haloMesh.material.opacity * (0.72 + wave.haloBias * 0.24);
        strongestWaveX = groupX;
        strongestWaveY = groupY;
        strongestWaveZ = groupZ;
        strongestWaveBand = wave.band;
        strongestWaveCycle = wave.colorCycle;
      }
    });

    copyPressureWaveColor(
      this.pressureWaveLightColorScratch,
      strongestWaveBand,
      strongestWaveCycle
    );
    copyPressureWaveColor(
      this.pressureWaveLightColorScratchB,
      strongestWaveBand,
      strongestWaveCycle,
      1
    );
    this.pressureWaveLight.color
      .copy(this.pressureWaveLightColorScratch)
      .lerp(this.heroPrimaryColor, 0.1)
      .lerp(ELECTRIC_WHITE, strongestWaveLight * 0.08);
    this.pressureWaveAccentLight.color
      .copy(this.pressureWaveLightColorScratchB)
      .lerp(this.heroPulseColor, 0.12)
      .lerp(ELECTRIC_WHITE, strongestWaveAccent * 0.12);
    this.pressureWaveLight.position.set(strongestWaveX, strongestWaveY + 0.04, strongestWaveZ + 0.28);
    this.pressureWaveAccentLight.position.set(
      strongestWaveX * 0.72,
      strongestWaveY + 0.16,
      strongestWaveZ - 0.08
    );
    const pressureLightBudget =
      this.qualityProfile.tier === 'safe'
        ? 0.34
        : this.qualityProfile.tier === 'balanced'
          ? 0.46
          : 0.58;
    this.pressureWaveLight.intensity = this.smoothValue(
      this.pressureWaveLight.intensity,
      strongestWaveLight * pressureLightBudget,
      4.8,
      deltaSeconds
    );
    this.pressureWaveAccentLight.intensity = this.smoothValue(
      this.pressureWaveAccentLight.intensity,
      strongestWaveAccent * pressureLightBudget * 0.86,
      4.2,
      deltaSeconds
    );
    this.pressureWaveLight.distance = this.smoothValue(
      this.pressureWaveLight.distance,
      4.8 + strongestWaveLight * 3.6,
      3.6,
      deltaSeconds
    );
    this.pressureWaveAccentLight.distance = this.smoothValue(
      this.pressureWaveAccentLight.distance,
      4.2 + strongestWaveAccent * 3.2,
      3.2,
      deltaSeconds
    );
  }

  private updateParticles(elapsedSeconds: number): void {
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const ghost = this.familyWeights['ghost-lattice'];
    const storm = this.familyWeights['storm-crown'];
    const eclipse = this.familyWeights['eclipse-chamber'];
    const plume = this.familyWeights['spectral-plume'];
    const portalOpen = this.eventAmount('portal-open');
    const haloIgnition = this.eventAmount('halo-ignition');
    const worldStain = this.eventAmount('world-stain');
    const worldActivity = this.directorWorldActivity;
    const gasMatter = this.atmosphereGas;
    const liquidMatter = this.atmosphereLiquid;
    const plasmaMatter = this.atmospherePlasma;
    const crystalMatter = this.atmosphereCrystal;
    const atmospherePressure = this.atmospherePressure;
    const atmosphereIonization = this.atmosphereIonization;
    const atmosphereResidue = this.atmosphereResidue;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const paletteVoid = this.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = this.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = this.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = this.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = this.paletteState === 'ghost-white' ? 1 : 0;
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const chromaWarp = this.directorColorWarp;
    const chromaPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 4 + elapsedSeconds * 0.22);
    const phrasePulse = phasePulse(this.phrasePhase, elapsedSeconds * 0.36);
    const beatPulse = onsetPulse(this.beatPhase);

    const positions = this.particleGeometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const colors = this.particleGeometry.getAttribute(
      'color'
    ) as THREE.BufferAttribute;
    const positionArray = positions.array as Float32Array;
    const colorArray = colors.array as Float32Array;
    const count = Math.min(this.qualityProfile.particleDrawCount, this.particlePoints.length);

    for (let index = 0; index < count; index += 1) {
      const point = this.particlePoints[index];
      const orbit =
        point.theta +
        elapsedSeconds *
          point.drift *
          (0.4 +
            gasMatter * 0.28 +
            liquidMatter * 0.36 +
            plasmaMatter * 0.22 +
            portal * 0.7 +
            storm * 0.6 +
            this.directorEnergy * 0.22 +
            this.directorLaserDrive * 0.12 +
            worldActivity * 0.26);
      const lift =
        plume * (0.8 + point.bias * 0.4) +
        this.air * 0.12 +
        gasMatter * 0.2 +
        atmosphereResidue * 0.08;
      const radius =
        point.radius *
        (1 +
          gasMatter * 0.05 +
          liquidMatter * 0.08 +
          plasmaMatter * 0.04 +
          crystalMatter * 0.02 +
          this.resonance * 0.08 +
          worldActivity * 0.08 +
          portal * 0.12 +
          cathedral * 0.08 +
          portalOpen * 0.08 -
          eclipse * 0.05);
      const polar =
        point.phi +
        Math.sin(elapsedSeconds * 0.2 + point.bias * 4.2) *
          (0.04 +
            gasMatter * 0.08 +
            liquidMatter * 0.12 +
            plume * 0.12);

      this.particleScratch.setFromSphericalCoords(radius, polar, orbit);
      this.particleScratch.x +=
        Math.sin(elapsedSeconds * 0.8 + point.bias * 9) * storm * 0.2 +
        Math.cos(elapsedSeconds * 0.24 + point.radius * 0.6) *
          liquidMatter *
          0.34;
      this.particleScratch.y +=
        lift * radius * 0.12 +
        Math.sin(elapsedSeconds * 0.52 + point.theta) *
          plasmaMatter *
          0.22 +
        Math.sin(elapsedSeconds * 0.4 + point.radius) * this.roomness * 0.08;
      this.particleScratch.z +=
        Math.cos(elapsedSeconds * 0.3 + point.bias * 7) * ghost * 0.18 +
        Math.sin(elapsedSeconds * 0.18 + point.theta * 0.4) *
          gasMatter *
          0.3 -
        atmospherePressure * 0.04;

      const baseIndex = index * 3;
      positionArray[baseIndex] = this.particleScratch.x;
      positionArray[baseIndex + 1] = this.particleScratch.y;
      positionArray[baseIndex + 2] = this.particleScratch.z;

      const baseColor = this.particleColorScratch
        .copy(LASER_CYAN)
        .lerp(
          TRON_BLUE,
          coolBias * 0.18 +
            portal * 0.12 +
            laserAct * 0.12 +
            matrixAct * 0.14 +
            gasMatter * 0.08 +
            plasmaMatter * 0.08 +
            paletteVoid * 0.14 +
            paletteTron * 0.18
        )
        .lerp(
          ACID_LIME,
          this.shimmer * 0.1 +
            beatPulse * 0.08 +
            liquidMatter * 0.08 +
            matrixAct * 0.14 +
            paletteAcid * 0.2
        )
        .lerp(
          HOT_MAGENTA,
          this.harmonicColor * 0.08 +
            haloIgnition * 0.08 +
            warmBias * 0.08 +
            plasmaMatter * 0.08 +
            eclipseAct * 0.12 +
            paletteSolar * 0.06
        )
        .lerp(
          VOLT_VIOLET,
          phrasePulse * 0.03 +
            worldStain * 0.04 +
            atmosphereResidue * 0.06 +
            ghostAct * 0.06
        )
        .lerp(SOLAR_ORANGE, warmBias * 0.06 + paletteSolar * 0.12)
        .lerp(
          CYBER_YELLOW,
          beatPulse * 0.06 +
            this.transientConfidence * 0.04 +
            atmosphereIonization * 0.04 +
            chromaPulse * 0.04 +
            paletteSolar * 0.04
        )
        .lerp(
          ELECTRIC_WHITE,
          ghost * 0.14 +
            eclipse * 0.1 +
            crystalMatter * 0.12 +
            point.bias * 0.02 +
            chromaWarp * 0.06 +
            paletteGhost * 0.18
        )
        .lerp(
          MATRIX_GREEN,
          chromaPulse * 0.06 +
            liquidMatter * 0.04 +
            matrixAct * 0.14 +
            paletteAcid * 0.18
        );

      colorArray[baseIndex] = baseColor.r;
      colorArray[baseIndex + 1] = baseColor.g;
      colorArray[baseIndex + 2] = baseColor.b;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.particleGeometry.setDrawRange(0, count);
    this.particleMaterial.opacity =
      (ambientGlow *
        (0.036 +
          this.air * 0.06 +
          gasMatter * 0.04 +
          liquidMatter * 0.02 +
          atmosphereResidue * 0.04 +
          plume * 0.04 +
          ghost * 0.04 +
          worldActivity * 0.03 +
          this.resonance * 0.04) +
        eventGlow *
          (worldStain * 0.12 +
            plasmaMatter * 0.08 +
            crystalMatter * 0.04 +
            this.dropImpact * 0.14 +
            this.sectionChange * 0.09 +
            this.transientConfidence * 0.08)) *
      this.qualityProfile.particleOpacityMultiplier;
    this.particleMaterial.size =
      0.032 +
      this.directorSpectacle * 0.028 +
      gasMatter * 0.01 +
      liquidMatter * 0.014 +
      plasmaMatter * 0.012 +
      worldActivity * 0.012 +
      this.air * 0.016 +
      plume * 0.02 +
      portalOpen * 0.018 +
      this.dropImpact * 0.016 +
      chromaWarp * 0.014;
    this.particleCloud.rotation.y =
      elapsedSeconds *
      (0.03 +
        gasMatter * 0.02 +
        liquidMatter * 0.03 +
        portal * 0.05 +
        plume * 0.04 +
        worldActivity * 0.04);
    this.particleCloud.rotation.x =
      Math.sin(elapsedSeconds * 0.09) * (0.04 + gasMatter * 0.03);
    this.particleCloud.rotation.z =
      Math.sin(elapsedSeconds * 0.05 + this.phrasePhase * Math.PI * 2) *
      (0.02 + plasmaMatter * 0.05);
  }

  private updateLights(elapsedSeconds: number): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const voidAct = this.actWeights['void-chamber'];
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const ghost = this.familyWeights['ghost-lattice'];
    const eclipse = this.familyWeights['eclipse-chamber'];
    const haloIgnition = this.eventAmount('halo-ignition');
    const portalOpen = this.eventAmount('portal-open');
    const worldActivity = this.directorWorldActivity;
    const ambientGlow = this.ambientGlowBudget;
    const eventGlow = this.eventGlowBudget;
    const paletteVoid = this.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = this.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = this.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = this.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = this.paletteState === 'ghost-white' ? 1 : 0;
    const cameraDrift = this.organicCameraDrift;
    const gazeY = this.organicGazeDrift.y + this.pointerCurrent.y * 0.18;
    const warmBias = Math.max(0, (this.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - this.directorColorBias) * 2);
    const chromaWarp = this.directorColorWarp;
    const chromaPulse =
      0.5 + 0.5 * Math.sin(this.directorColorBias * Math.PI * 4 + elapsedSeconds * 0.2);
    const phrasePulse = phasePulse(this.phrasePhase, elapsedSeconds * 0.28);
    const beatPulse = onsetPulse(this.beatPhase);
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure = this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotAnchor = this.stageCompositionPlan.shotClass === 'anchor' ? 1 : 0;
    const chamberEnvelope = this.stageCompositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(
      this.roomMusicVisualFloor,
      this.adaptiveMusicVisualFloor
    );
    const stageColorLift = THREE.MathUtils.clamp(
      this.tuning.neonStageFloor * 0.34 +
        this.tuning.worldBootFloor * 0.24 +
        musicStageFloor * 0.42 +
        chamberPresenceFloor * 0.22 +
        chamberDominanceFloor * 0.16,
      0,
      1
    );
    const chamberStageLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.34 +
        chamberPresenceFloor * 0.46 +
        chamberDominanceFloor * 0.54 +
        chamberWorldTakeoverBias * 0.44 +
        shotWorldTakeover * 0.24 +
        shotPressure * 0.12,
      0,
      1.2
    );
    const sceneVoid = sceneVariation.voidProfile;
    const sceneSpectral = sceneVariation.spectralProfile;
    const sceneSolar = sceneVariation.solarProfile;
    const scenePrismatic = sceneVariation.prismaticProfile;
    const postContrast = sceneVariation.postContrastBoost;
    const stageLightFloor =
      chamberPresenceFloor * 0.06 +
      chamberDominanceFloor * 0.08 +
      chamberStageLift * 0.05 +
      musicStageFloor * 0.04;

    this.ambientLight.color
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        0.18 +
          this.air * 0.12 +
          coolBias * 0.16 +
          laserAct * 0.08 +
          matrixAct * 0.12 +
          voidAct * 0.04 +
          paletteVoid * 0.1 +
          paletteTron * 0.16 +
          stageColorLift * 0.22 +
          shotWorldTakeover * 0.08 +
          shotPressure * 0.04
      )
      .lerp(VOLT_VIOLET, phrasePulse * 0.02 + ghost * 0.03 + ghostAct * 0.06)
      .lerp(
        HOT_MAGENTA,
        this.harmonicColor * 0.02 +
          warmBias * 0.02 +
          eclipseAct * 0.06 +
          paletteSolar * 0.05 +
          chamberStageLift * 0.08
      )
      .lerp(TOXIC_PINK, scenePrismatic * 0.12 + sceneSolar * 0.06)
      .lerp(
        ACID_LIME,
        chromaWarp * 0.04 + matrixAct * 0.1 + paletteAcid * 0.14 + stageColorLift * 0.08
      )
      .lerp(
        ELECTRIC_WHITE,
        ghostAct * 0.06 + paletteGhost * 0.08 + shotWorldTakeover * 0.06
      );
    this.ambientLight.intensity =
      0.012 +
      ambientGlow * (0.052 + chamberStageLift * 0.018) +
      this.roomness * 0.012 +
      this.air * 0.012 +
      worldActivity * 0.008 +
      ghost * 0.006 +
      eclipse * 0.006 +
      stageLightFloor +
      shotPressure * 0.01 +
      shotWorldTakeover * 0.014 -
      postContrast * 0.012;

    this.fillLight.color
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        coolBias * 0.14 +
          portal * 0.08 +
          laserAct * 0.08 +
          matrixAct * 0.1 +
          paletteVoid * 0.08 +
          paletteTron * 0.14 +
          stageColorLift * 0.18 +
          shotWorldTakeover * 0.06
      )
      .lerp(VOLT_VIOLET, ghost * 0.03 + phrasePulse * 0.03 + ghostAct * 0.06)
      .lerp(
        ACID_LIME,
        this.shimmer * 0.06 +
          this.transientConfidence * 0.05 +
          chromaPulse * 0.04 +
          paletteAcid * 0.18 +
          stageColorLift * 0.08
      )
      .lerp(
        HOT_MAGENTA,
        this.harmonicColor * 0.02 +
          warmBias * 0.02 +
          eclipseAct * 0.06 +
          paletteSolar * 0.06 +
          chamberStageLift * 0.06
      )
      .lerp(TOXIC_PINK, scenePrismatic * 0.12 + sceneSolar * 0.08)
      .lerp(MATRIX_GREEN, chromaWarp * 0.06 + paletteAcid * 0.12)
      .lerp(
        ELECTRIC_WHITE,
        ghostAct * 0.06 + paletteGhost * 0.08 + shotWorldTakeover * 0.05
      );
    this.fillLight.intensity =
      0.074 +
      ambientGlow * (0.052 + chamberStageLift * 0.026) +
      this.air * 0.03 +
      worldActivity * 0.016 +
      cathedral * 0.02 +
      portal * 0.02 +
      eventGlow * (portalOpen * 0.04 + this.dropImpact * 0.06) +
      stageLightFloor * 1.32 +
      scenePrismatic * 0.028 +
      shotPressure * 0.026 +
      shotWorldTakeover * 0.04;

    this.warmLight.color
      .copy(HOT_MAGENTA)
      .lerp(
        TOXIC_PINK,
        this.harmonicColor * 0.14 +
          this.eventAmount('world-stain') * 0.1 +
          warmBias * 0.08 +
          paletteSolar * 0.16 +
          chamberStageLift * 0.08
      )
      .lerp(VOLT_VIOLET, phrasePulse * 0.03 + ghostAct * 0.06)
      .lerp(
        CYBER_YELLOW,
        haloIgnition * 0.12 +
          this.dropImpact * 0.06 +
          chromaPulse * 0.04 +
          laserAct * 0.04 +
          paletteSolar * 0.04 +
          stageColorLift * 0.06
      )
      .lerp(TOXIC_PINK, sceneSolar * 0.12 + scenePrismatic * 0.08)
      .lerp(
        ELECTRIC_WHITE,
        haloIgnition * 0.16 +
          chromaWarp * 0.05 +
          paletteGhost * 0.12 +
          shotWorldTakeover * 0.04
      )
      .lerp(MATRIX_GREEN, chromaWarp * 0.04 + paletteAcid * 0.1);
    this.warmLight.intensity =
      0.03 +
      ambientGlow * (0.02 + chamberStageLift * 0.008) +
      this.body * 0.028 +
      this.brightness * 0.024 +
      eventGlow *
        (haloIgnition * 0.18 +
          portalOpen * 0.06 +
          this.dropImpact * 0.14 +
          this.sectionChange * 0.1) +
      stageLightFloor * 0.92 +
      sceneSolar * 0.026 +
      shotPressure * 0.016 +
      shotAnchor * 0.006;
    this.warmLight.position.set(
      2.2 + Math.sin(elapsedSeconds * 0.32) * (0.4 + scenePrismatic * 0.3) + cameraDrift.x * 0.46,
      1.1 + this.liftPulse * 0.6 + cameraDrift.y * 0.34 + sceneSolar * 0.18,
      3.6 - portal * 0.5 + cameraDrift.z * 0.52 - sceneSpectral * 0.18
    );

    this.coolLight.color
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        coolBias * 0.16 +
          portal * 0.1 +
          laserAct * 0.08 +
          matrixAct * 0.14 +
          paletteVoid * 0.1 +
          paletteTron * 0.16 +
          stageColorLift * 0.2 +
          shotWorldTakeover * 0.06
      )
      .lerp(VOLT_VIOLET, ghost * 0.04 + phrasePulse * 0.03 + ghostAct * 0.06)
      .lerp(
        ACID_LIME,
        this.shimmer * 0.08 +
          this.transientConfidence * 0.06 +
          chromaPulse * 0.06 +
          paletteAcid * 0.18 +
          stageColorLift * 0.08
      )
      .lerp(
        CYBER_YELLOW,
        beatPulse * 0.05 +
          haloIgnition * 0.04 +
          chromaWarp * 0.03 +
          paletteSolar * 0.03 +
          chamberStageLift * 0.04
      )
      .lerp(TOXIC_PINK, scenePrismatic * 0.1 + sceneSolar * 0.04)
      .lerp(HOT_MAGENTA, this.harmonicColor * 0.02 + eclipseAct * 0.06 + paletteSolar * 0.04)
      .lerp(MATRIX_GREEN, chromaWarp * 0.08 + paletteAcid * 0.14)
      .lerp(
        ELECTRIC_WHITE,
        ghostAct * 0.06 + paletteGhost * 0.1 + shotWorldTakeover * 0.04
      );
    this.coolLight.intensity =
      0.062 +
      ambientGlow * (0.042 + chamberStageLift * 0.02) +
      this.air * 0.05 +
      worldActivity * 0.02 +
      portal * 0.05 +
      ghost * 0.018 +
      this.shimmer * 0.04 +
      this.preDropTension * 0.03 +
      eventGlow * this.dropImpact * 0.14 +
      stageLightFloor * 1.18 +
      sceneSpectral * 0.024 +
      shotPressure * 0.018 +
      shotWorldTakeover * 0.028;
    this.coolLight.position.set(
      -2.6 - Math.cos(elapsedSeconds * 0.28) * (0.44 + sceneSpectral * 0.24) - cameraDrift.x * 0.4,
      -1.2 + gazeY * 0.14 + cameraDrift.y * 0.28 - sceneVoid * 0.14,
      3.2 - cathedral * 0.3 - cameraDrift.z * 0.48 - postContrast * 0.18
    );
  }

  private updateCamera(
    elapsedSeconds: number,
    geometryBias: number,
    spectacle: number,
    beatDrive: number,
    deltaSeconds: number
  ): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const portal = this.familyWeights['portal-iris'];
    const cathedral = this.familyWeights['cathedral-rings'];
    const eclipse = this.familyWeights['eclipse-chamber'];
    const plume = this.familyWeights['spectral-plume'];
    const collapse = this.eventAmount('singularity-collapse');
    const portalOpen = this.eventAmount('portal-open');
    const worldActivity = this.directorWorldActivity;
    const cameraDrift = this.organicCameraDrift;
    const cameraMotion = this.cameraMotionState;
    const gazeX = this.organicGazeDrift.x + this.pointerCurrent.x * 0.18;
    const gazeY = this.organicGazeDrift.y + this.pointerCurrent.y * 0.18;
    const beatPulse = onsetPulse(this.beatPhase);
    const tempoLock = this.stageAudioFeatures.tempo.lock;
    const tempoDensity = this.stageAudioFeatures.tempo.density;
    const impactBuild = this.stageAudioFeatures.impact.build;
    const impactHit = this.stageAudioFeatures.impact.hit;
    const spatialPresence = this.stageAudioFeatures.presence.spatial;
    const memoryAfterglow = this.stageAudioFeatures.memory.afterglow;
    const heroScaleBias = this.stageCuePlan.heroScaleBias;
    const heroStageX = this.stageCuePlan.heroStageX;
    const heroStageY = this.stageCuePlan.heroStageY;
    const heroDepthBias = this.stageCuePlan.heroDepthBias;
    const heroMotionBias = this.stageCuePlan.heroMotionBias;
    const shotWorldTakeover =
      this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure = this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotAftermath = this.stageCompositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate = this.stageCompositionPlan.shotClass === 'isolate' ? 1 : 0;
    const cadenceSurge =
      this.stageCompositionPlan.tempoCadenceMode === 'surge' ? 1 : 0;
    const cadenceDriving =
      this.stageCompositionPlan.tempoCadenceMode === 'driving' ? 1 : 0;
    const cadenceAftermath =
      this.stageCompositionPlan.tempoCadenceMode === 'aftermath' ? 1 : 0;
    const fallbackDemoteHero =
      this.stageCompositionPlan.fallbackDemoteHero ? 1 : 0;
    const fallbackWidenShot =
      this.stageCompositionPlan.fallbackWidenShot ? 1 : 0;
    const cueRupture = this.stageCuePlan.family === 'rupture' ? 1 : 0;
    const cueReveal = this.stageCuePlan.family === 'reveal' ? 1 : 0;
    const cueHaunt = this.stageCuePlan.family === 'haunt' ? 1 : 0;
    const cueReset = this.stageCuePlan.family === 'reset' ? 1 : 0;
    const largeHeroBias = Math.max(0, heroScaleBias);
    const smallHeroBias = Math.max(0, -heroScaleBias);
    const framingLeadX = heroStageX * (0.9 + heroMotionBias * 0.3);
    const framingLeadY = heroStageY * (0.6 + heroMotionBias * 0.22);
    const offCenterTravelBias =
      cueReveal * 0.18 +
      shotPressure * 0.16 +
      shotWorldTakeover * 0.26 +
      shotIsolate * 0.22 +
      sceneVariation.cameraSpreadBoost * 0.24;

    const framing = this.directorFraming;
    const lowEnergyReadableFloorActive =
      this.stageCuePlan.family !== 'haunt' &&
      this.stageCuePlan.family !== 'reset' &&
      this.stageCuePlan.family !== 'release' &&
      this.stageCuePlan.spendProfile !== 'peak' &&
      (this.roomMusicVisualFloor > 0.08 || this.adaptiveMusicVisualFloor > 0.12);
    const coverageExcess = THREE.MathUtils.clamp(
      (this.heroCoverageEstimateCurrent - this.stageCompositionPlan.heroEnvelope.coverageMax) /
        Math.max(this.stageCompositionPlan.heroEnvelope.coverageMax, 0.08),
      0,
      1
    );
    const ringBeltExcess = THREE.MathUtils.clamp(
      (this.ringBeltPersistenceCurrent - 0.32) / 0.42,
      0,
      1
    );
    const wirefieldExcess = THREE.MathUtils.clamp(
      (this.wirefieldDensityScoreCurrent - 0.28) / 0.48,
      0,
      1
    );
    const overfillPressure = THREE.MathUtils.clamp(
      coverageExcess * 0.44 +
        ringBeltExcess * 0.26 +
        wirefieldExcess * 0.32 +
        shotPressure * 0.12 +
        cueReveal * 0.06,
      0,
      1
    );
    const coverageDeficit = lowEnergyReadableFloorActive
      ? THREE.MathUtils.clamp(
          (this.stageCompositionPlan.heroEnvelope.coverageMin - this.heroCoverageEstimateCurrent) /
            Math.max(this.stageCompositionPlan.heroEnvelope.coverageMin, 0.02),
          0,
          1
        )
      : 0;
    const targetFov = THREE.MathUtils.clamp(
      50 +
        framing * 14.5 +
        worldActivity * 0.8 +
        eclipse * 0.8 +
        this.preDropTension * 1.1 -
        spectacle * 1.4 -
        portalOpen * 0.5 -
        this.dropImpact * 2.6 -
        impactHit * 0.8 -
        this.sectionChange * 0.8 -
        largeHeroBias * 5.6 -
        heroDepthBias * 2.4 +
        smallHeroBias * 2.4 +
        overfillPressure * 4.8 +
        shotWorldTakeover * (lowEnergyReadableFloorActive ? 2.6 : 4.4) +
        shotAftermath * (lowEnergyReadableFloorActive ? 2.2 : 3.2) +
        shotIsolate * (lowEnergyReadableFloorActive ? 3 : 5) +
        fallbackWidenShot * 2.8 +
        cadenceAftermath * 1.4 -
        cadenceSurge * 1.2 -
        spatialPresence * 0.8 +
        cueReveal * 1.1 +
        cueHaunt * 1.4 +
        memoryAfterglow * 0.8 +
      cueReset * 1.8 -
      coverageDeficit * (4 + this.tuning.cameraNearFloor * 6 + this.tuning.readableHeroFloor * 4),
      38,
      68 + sceneVariation.cameraSpreadBoost * 3
    );
    this.camera.fov = this.smoothValue(
      this.camera.fov,
      targetFov,
      2.2,
      deltaSeconds
    );
    this.camera.updateProjectionMatrix();

    const targetX =
      framingLeadX * (1.24 + offCenterTravelBias - shotWorldTakeover * 0.42 - shotAftermath * 0.4) +
      this.adaptiveMusicVisualFloor * Math.sign(framingLeadX || heroStageX || 1) * 0.08 +
      gazeX * (0.08 + spectacle * 0.06 + worldActivity * 0.03) +
      Math.sin(elapsedSeconds * 0.18 + this.phrasePhase * Math.PI * 2) *
        0.18 *
        sceneVariation.cameraSpreadBoost +
      Math.sin(elapsedSeconds * 0.08 + this.barPhase * Math.PI * 2) *
        (0.18 +
          cathedral * 0.28 +
          this.preDropTension * 0.18 +
          heroMotionBias * 0.18 +
          tempoDensity * 0.14 +
          impactBuild * 0.08 +
          cadenceDriving * 0.08 +
          sceneVariation.cameraSpreadBoost * 0.22 +
          cadenceSurge * 0.1 -
          cadenceAftermath * 0.06) +
      cameraDrift.x * 1.4 +
      cameraMotion.position.x;
    const targetY =
      framingLeadY * (0.96 - shotWorldTakeover * 0.26 - shotAftermath * 0.18) +
      this.adaptiveMusicVisualFloor * Math.sign(framingLeadY || heroStageY || -1) * 0.04 +
      gazeY * (0.06 + geometryBias * 0.04 + worldActivity * 0.02) +
      Math.cos(elapsedSeconds * 0.16 + this.barPhase * Math.PI * 2) *
        0.1 *
        sceneVariation.cameraSpreadBoost +
      Math.sin(elapsedSeconds * 0.12 + 0.8 + this.phrasePhase * Math.PI * 2) *
        (0.12 +
          plume * 0.2 +
          this.sectionChange * 0.18 +
          heroMotionBias * 0.12 +
          spatialPresence * 0.12 +
          sceneVariation.cameraSpreadBoost * 0.12 +
          cadenceDriving * 0.04 -
          cadenceAftermath * 0.04) +
      cameraDrift.y * 1.26 +
      cameraMotion.position.y;
    const targetZ =
      9.8 +
      framing * 2.4 -
      spectacle * 0.24 -
      this.body * 0.1 -
      portal * 0.04 -
      portalOpen * 0.08 +
      worldActivity * 0.26 +
      tempoLock * 0.18 +
      cadenceDriving * 0.18 +
      cadenceAftermath * 0.24 +
      eclipse * 0.34 +
      collapse * 0.28 +
      this.preDropTension * 0.28 -
      this.dropImpact * (0.66 + beatPulse * 0.18) -
      this.sectionChange * 0.18 +
      memoryAfterglow * 0.18 +
      this.releaseTail * 0.18 +
      smallHeroBias * 1.2 -
      largeHeroBias * 3.4 -
      heroDepthBias * 2.4 -
      cueRupture * 0.72 -
      cueReveal * 0.42 +
      cueHaunt * 0.48 +
      shotWorldTakeover * (lowEnergyReadableFloorActive ? 0.88 : 1.44) +
      shotAftermath * (lowEnergyReadableFloorActive ? 0.6 : 0.96) +
      shotIsolate * (lowEnergyReadableFloorActive ? 1.1 : 1.78) +
      overfillPressure * 1.56 +
      fallbackWidenShot * 1.12 +
      sceneVariation.cameraSpreadBoost * 0.84 +
      fallbackDemoteHero * 0.56 -
      cadenceSurge * 0.22 -
      coverageDeficit * (1.4 + this.tuning.cameraNearFloor * 2.8 + this.tuning.readableHeroFloor * 1.8) +
      cameraDrift.z * 0.76 +
      cameraMotion.position.z;

    this.camera.position.x = this.smoothValue(this.camera.position.x, targetX, 1.8, deltaSeconds);
    this.camera.position.y = this.smoothValue(this.camera.position.y, targetY, 1.8, deltaSeconds);
    this.camera.position.z = this.smoothValue(
      this.camera.position.z,
      targetZ,
      this.dropImpact > 0.1 || largeHeroBias > 0.3 ? 4.2 : 1.9,
      deltaSeconds
    );
    const worldLedLookBias = THREE.MathUtils.clamp(
      shotWorldTakeover +
        shotPressure * 0.68 +
        cueReveal * 0.28 +
        cueRupture * 0.18 +
        sceneVariation.cameraSpreadBoost * 0.18,
      0,
      1.4
    );
    const lookHeroCoupling = THREE.MathUtils.clamp(
      0.11 -
        shotWorldTakeover * 0.05 -
        shotPressure * 0.03 -
        shotIsolate * 0.02 -
        overfillPressure * 0.04 -
        worldLedLookBias * 0.04,
      0.02,
      0.11
    );
    this.motionLookTarget.set(
      framingLeadX *
        (0.24 - shotWorldTakeover * 0.06 - shotAftermath * 0.08 + shotIsolate * 0.04) +
        gazeX * 0.08 +
        this.heroGroup.position.x * lookHeroCoupling +
        Math.sin(elapsedSeconds * 0.12) *
          (0.06 + worldLedLookBias * 0.04) *
          sceneVariation.cameraSpreadBoost +
        this.organicHeroDrift.x * 0.12 +
        this.chamberMotionState.position.x * (0.08 + worldLedLookBias * 0.12) +
        this.organicChamberDrift.x * (0.1 + worldLedLookBias * 0.14),
      framingLeadY *
        (0.26 - shotWorldTakeover * 0.02 - shotAftermath * 0.04 + shotIsolate * 0.03) +
        gazeY * 0.06 +
        this.heroGroup.position.y * (lookHeroCoupling + 0.02) +
        Math.cos(elapsedSeconds * 0.1) *
          (0.04 + worldLedLookBias * 0.03) *
          sceneVariation.cameraSpreadBoost +
        this.organicHeroDrift.y * 0.14 +
        this.sectionChange * 0.12 +
        this.chamberMotionState.position.y * (0.06 + worldLedLookBias * 0.1) +
        this.organicChamberDrift.y * (0.08 + worldLedLookBias * 0.12),
      -0.8 -
        beatDrive * 0.1 -
        portal * 0.3 -
        heroDepthBias * 0.36 -
        this.preDropTension * 0.24 +
        this.releaseTail * 0.1 +
        shotWorldTakeover * 0.12 +
        shotAftermath * 0.08 +
        this.organicGazeDrift.z +
        this.chamberMotionState.position.z * (0.08 + worldLedLookBias * 0.14) -
        worldLedLookBias * 0.16 +
        this.organicChamberDrift.z * (0.06 + worldLedLookBias * 0.1)
    );
    this.motionRotationMatrix.lookAt(
      this.camera.position,
      this.motionLookTarget,
      this.motionUp
    );
    this.motionBaseQuaternion.setFromRotationMatrix(this.motionRotationMatrix);
    this.motionCompositeQuaternion
      .copy(this.motionBaseQuaternion)
      .multiply(cameraMotion.quaternion);
    this.camera.quaternion.slerp(
      this.motionCompositeQuaternion,
      1 - Math.exp(-deltaSeconds * 3.2)
    );
  }

  private refreshVisualTelemetry(): void {
    const heroHsl = { h: 0, s: 0, l: 0 };
    const worldHsl = { h: 0, s: 0, l: 0 };
    const heroEuler = this.motionEulerScratch.setFromQuaternion(this.heroGroup.quaternion);
    const chamberEuler = this.chamberTelemetryEuler.setFromQuaternion(
      this.chamberGroup.quaternion
    );
    const cameraEuler = this.cameraTelemetryEuler.setFromQuaternion(
      this.camera.quaternion
    );

    this.heroTelemetryColor
      .copy(this.heroMaterial.color)
      .multiplyScalar(0.7)
      .add(
        this.particleColorScratch
          .copy(this.heroMaterial.emissive)
          .multiplyScalar(0.42 + this.heroMaterial.emissiveIntensity * 0.22)
      );
    this.heroTelemetryColor.getHSL(heroHsl);
    this.worldSphereMaterial.color.getHSL(worldHsl);

    this.heroHue = heroHsl.h;
    this.worldHue = worldHsl.h;
    this.heroTelemetryVector.copy(this.heroGroup.position).project(this.camera);
    this.heroScreenX = THREE.MathUtils.clamp(
      this.heroTelemetryVector.x * 0.5 + 0.5,
      0,
      1
    );
    this.heroScreenY = THREE.MathUtils.clamp(
      -this.heroTelemetryVector.y * 0.5 + 0.5,
      0,
      1
    );
    this.heroCoverageEstimateCurrent = this.estimateHeroCoverage();
    this.heroOffCenterPenaltyCurrent = this.measureHeroOffCenterPenalty();
    this.heroDepthPenaltyCurrent = this.measureHeroDepthPenalty();
    this.ringAuthorityCurrent = this.measureRingAuthority();
    this.ringBeltPersistenceCurrent = this.measureRingBeltPersistence();
    this.wirefieldDensityScoreCurrent = this.measureWirefieldDensity();
    const chamberRingAverage = this.averageMaterialOpacity(
      this.chamberRings.map(({ mesh }) => mesh)
    );
    const portalRingAverage = this.averageMaterialOpacity(
      this.portalRings.map(({ mesh }) => mesh)
    );
    const chromaHaloAverage = this.averageMaterialOpacity(
      this.chromaHalos.map(({ mesh }) => mesh)
    );
    const ghostLatticeAverage =
      this.latticeMaterials.length > 0
        ? this.latticeMaterials.reduce((sum, material) => sum + material.opacity, 0) /
          this.latticeMaterials.length
        : 0;
    const laserBeamAverage =
      this.laserBeams.length > 0
        ? this.laserBeams.reduce((sum, beam) => sum + beam.mesh.material.opacity, 0) /
          this.laserBeams.length
        : 0;
    const stageBladeAverage =
      this.stageBlades.length > 0
        ? this.stageBlades.reduce((sum, blade) => sum + blade.mesh.material.opacity, 0) /
          this.stageBlades.length
        : 0;
    const stageSweepAverage =
      this.stageSweepPlanes.length > 0
        ? this.stageSweepPlanes.reduce((sum, plane) => sum + plane.mesh.material.opacity, 0) /
          this.stageSweepPlanes.length
        : 0;
    const atmosphereVeilAverage =
      this.atmosphereVeils.length > 0
        ? this.atmosphereVeils.reduce((sum, veil) => sum + veil.mesh.material.opacity, 0) /
          this.atmosphereVeils.length
        : 0;
    const atmosphereColumnAverage =
      this.atmosphereColumns.length > 0
        ? this.atmosphereColumns.reduce(
            (sum, column) => sum + column.mesh.material.opacity,
            0
          ) / this.atmosphereColumns.length
        : 0;
    const satelliteActivity =
      this.satellites.length > 0
        ? this.satellites.reduce(
            (sum, satellite) =>
              sum +
              (satellite.mesh.visible
                ? satellite.mesh.material.emissiveIntensity * 0.08 +
                  satellite.mesh.material.opacity * 0.8
                : 0),
            0
          ) / this.satellites.length
        : 0;
    const pressureWaveAverage =
      this.pressureWaves.length > 0
        ? this.pressureWaves.reduce(
            (sum, wave) =>
              sum +
              (wave.group.visible
                ? (wave.waveMesh.material.opacity +
                    wave.torusMesh.material.opacity * 1.15 +
                    wave.haloMesh.material.opacity * 0.9) /
                  3.05
                : 0),
            0
          ) / this.pressureWaves.length
        : 0;
    const twinEmissiveMean =
      this.twinMeshes.length > 0
        ? this.twinMeshes.reduce(
            (sum, mesh) =>
              sum +
              (mesh.visible
                ? mesh.material.emissiveIntensity * 0.08 + mesh.material.opacity
                : 0),
            0
          ) / this.twinMeshes.length
        : 0;
    this.worldGlowSpend = THREE.MathUtils.clamp(
      this.worldStainMaterial.opacity * 2.2 +
        this.worldFlashMaterial.opacity * 1.8 +
        atmosphereVeilAverage * 1.4 +
        atmosphereColumnAverage * 1.6 +
        this.fillLight.intensity * 0.1 +
        this.ambientLight.intensity * 0.08,
      0,
      1.2
    );
    this.heroGlowSpend = THREE.MathUtils.clamp(
      this.heroMaterial.emissiveIntensity * 0.08 +
        this.coreMaterial.emissiveIntensity * 0.14 +
        this.heroAuraMaterial.opacity * 2.2 +
        this.heroFresnelUniforms.intensity.value * 1.8 +
        this.heroEnergyShellMaterial.opacity * 3.2 +
        this.heroSeamMaterial.opacity * 2.1 +
        this.membraneMaterial.opacity * 1.4 +
        this.crownMaterial.opacity * 1.2,
      0,
      1.2
    );
    this.shellGlowSpend = THREE.MathUtils.clamp(
      this.heroEdgesMaterial.opacity * 2.2 +
        this.heroSeamMaterial.opacity * 1.2 +
        (this.chamberRings[0]?.mesh.material.opacity ?? 0) * 6 +
        (this.portalRings[0]?.mesh.material.opacity ?? 0) * 6 +
        (this.chromaHalos[0]?.mesh.material.opacity ?? 0) * 6,
      0,
      1.2
    );
    this.chamberPresenceScoreCurrent = this.measureChamberPresenceScore();
    this.worldDominanceDeliveredCurrent = this.measureWorldDominanceDelivered();
    this.frameHierarchyScoreCurrent = this.measureFrameHierarchyScore();
    this.refreshCompositionSafetyState();
    const assetLayerActivity = this.telemetryRig.buildAssetLayerActivity({
      worldSphereLuminance: worldHsl.l,
      worldStainOpacity:
        this.worldStainMaterial.opacity +
        atmosphereVeilAverage * 0.2 +
        atmosphereColumnAverage * 0.16,
      worldFlashOpacity: this.worldFlashMaterial.opacity,
      fogDensity:
        this.fog.density +
        atmosphereVeilAverage * 0.016 +
        atmosphereColumnAverage * 0.012,
      heroShellEmissiveIntensity: this.heroMaterial.emissiveIntensity,
      heroAuraOpacity: this.heroAuraMaterial.opacity,
      heroFresnelIntensity: this.heroFresnelUniforms.intensity.value,
      heroEnergyShellOpacity: this.heroEnergyShellMaterial.opacity,
      heroSeamOpacity: this.heroSeamMaterial.opacity,
      ghostHeroOpacity: this.ghostHeroMaterial.opacity,
      heroCoreEmissiveIntensity: this.coreMaterial.emissiveIntensity,
      heroEdgesOpacity: this.heroEdgesMaterial.opacity,
      heroMembraneOpacity: this.membraneMaterial.opacity,
      heroCrownOpacity: this.crownMaterial.opacity,
      twinEmissiveMean,
      chamberRingOpacity: chamberRingAverage,
      portalRingOpacity: portalRingAverage,
      chromaHaloOpacity: chromaHaloAverage,
      ghostLatticeOpacity: ghostLatticeAverage,
      laserBeamOpacity: laserBeamAverage,
      stageBladeOpacity: stageBladeAverage,
      stageSweepOpacity: stageSweepAverage,
      satelliteActivity,
      pressureWaveOpacity: pressureWaveAverage,
      particleOpacity: this.particleMaterial.opacity,
      ambientLightIntensity: this.ambientLight.intensity,
      fillLightIntensity: this.fillLight.intensity,
      warmLightIntensity: this.warmLight.intensity,
      coolLightIntensity: this.coolLight.intensity,
      afterImageDamp:
        this.visualTelemetry.afterImageDamp ??
        DEFAULT_VISUAL_TELEMETRY.afterImageDamp ??
        0.78
    });

    this.visualTelemetry = {
      qualityTier: this.qualityProfile.tier,
      exposure: this.visualTelemetry.exposure,
      bloomStrength: this.visualTelemetry.bloomStrength,
      bloomThreshold: this.visualTelemetry.bloomThreshold,
      bloomRadius: this.visualTelemetry.bloomRadius,
      ambientGlowBudget: this.ambientGlowBudget,
      eventGlowBudget: this.eventGlowBudget,
      worldGlowSpend: this.worldGlowSpend,
      heroGlowSpend: this.heroGlowSpend,
      shellGlowSpend: this.shellGlowSpend,
      activeAct: this.activeAct,
      paletteState: this.paletteState,
      showFamily: this.activeFamily,
      macroEventsActive: this.activeEvents.map((event) => event.kind),
      heroHue: this.heroHue,
      worldHue: this.worldHue,
      cueClass: this.cueState.cueClass,
      cueIntensity: this.cueState.intensity,
      cueAttack: this.cueState.attack,
      cueSustain: this.cueState.sustain,
      cueDecay: this.cueState.decay,
      cueScreenWeight: this.cueState.screenWeight,
      cueResidueWeight: this.cueState.residueWeight,
      cueWorldWeight: this.cueState.worldWeight,
      cueHeroWeight: this.cueState.heroWeight,
      cueEventDensity: this.cueState.eventDensity,
      stageCueFamily: this.stageCuePlan.family,
      stageCueDominance: this.stageCuePlan.dominance,
      stageSpendProfile: this.stageCuePlan.spendProfile,
      stageWorldMode: this.stageCuePlan.worldMode,
      stageCompositorMode: this.stageCuePlan.compositorMode,
      stageResidueMode: this.stageCuePlan.residueMode,
      stageTransformIntent: this.stageCuePlan.transformIntent,
      stageHeroScaleMin: this.stageCuePlan.heroScaleMin,
      stageHeroScaleMax: this.stageCuePlan.heroScaleMax,
      stageHeroAnchorLane: this.stageCuePlan.heroAnchorLane,
      stageHeroAnchorStrength: this.stageCuePlan.heroAnchorStrength,
      stageExposureCeiling: this.stageCuePlan.exposureCeiling,
      stageBloomCeiling: this.stageCuePlan.bloomCeiling,
      stageRingAuthority: this.stageCuePlan.ringAuthority,
      stageWashoutSuppression: this.stageCuePlan.washoutSuppression,
      stageMotionPhrase: this.stageCuePlan.motionPhrase,
      stageCameraPhrase: this.stageCuePlan.cameraPhrase,
      stageHeroForm: this.activeHeroForm,
      stageHeroAccentForm: this.activeHeroAccentForm,
      stageHeroFormHoldSeconds: this.stageCuePlan.heroFormHoldSeconds,
      stagePaletteHoldSeconds: this.stageCuePlan.paletteHoldSeconds,
      stageScreenEffectFamily: this.stageCuePlan.screenEffectIntent.family,
      stageScreenEffectIntensity: this.stageCuePlan.screenEffectIntent.intensity,
      stageScreenEffectDirectionalBias:
        this.stageCuePlan.screenEffectIntent.directionalBias,
      stageScreenEffectMemoryBias: this.stageCuePlan.screenEffectIntent.memoryBias,
      stageScreenEffectCarveBias: this.stageCuePlan.screenEffectIntent.carveBias,
      stageHeroScaleBias: this.stageCuePlan.heroScaleBias,
      stageHeroStageX: this.stageCuePlan.heroStageX,
      stageHeroStageY: this.stageCuePlan.heroStageY,
      stageHeroDepthBias: this.stageCuePlan.heroDepthBias,
      stageHeroMotionBias: this.stageCuePlan.heroMotionBias,
      stageHeroMorphBias: this.stageCuePlan.heroMorphBias,
      stageShotClass: this.stageCompositionPlan.shotClass,
      stageTransitionClass: this.stageCompositionPlan.transitionClass,
      stageEventScale: this.stageCompositionPlan.eventScale,
      stageTempoCadenceMode: this.stageCompositionPlan.tempoCadenceMode,
      stageCompositionSafety: this.stageCompositionPlan.compositionSafety,
      stageFallbackDemoteHero: this.stageCompositionPlan.fallbackDemoteHero,
      stageFallbackWidenShot: this.stageCompositionPlan.fallbackWidenShot,
      stageFallbackForceWorldTakeover:
        this.stageCompositionPlan.fallbackForceWorldTakeover,
      heroScale: this.heroScaleCurrent,
      heroScreenX: this.heroScreenX,
      heroScreenY: this.heroScreenY,
      heroCoverageEstimate: this.heroCoverageEstimateCurrent,
      heroOffCenterPenalty: this.heroOffCenterPenaltyCurrent,
      heroDepthPenalty: this.heroDepthPenaltyCurrent,
      heroTranslateX: this.heroGroup.position.x,
      heroTranslateY: this.heroGroup.position.y,
      heroTranslateZ: this.heroGroup.position.z,
      heroRotationPitch: heroEuler.x,
      heroRotationYaw: heroEuler.y,
      heroRotationRoll: heroEuler.z,
      chamberTranslateX: this.chamberGroup.position.x,
      chamberTranslateY: this.chamberGroup.position.y,
      chamberTranslateZ: this.chamberGroup.position.z,
      chamberRotationPitch: chamberEuler.x,
      chamberRotationYaw: chamberEuler.y,
      chamberRotationRoll: chamberEuler.z,
      cameraTranslateX: this.camera.position.x,
      cameraTranslateY: this.camera.position.y,
      cameraTranslateZ: this.camera.position.z,
      cameraRotationPitch: cameraEuler.x,
      cameraRotationYaw: cameraEuler.y,
      cameraRotationRoll: cameraEuler.z,
      ringAuthority: this.ringAuthorityCurrent,
      chamberPresenceScore: this.chamberPresenceScoreCurrent,
      frameHierarchyScore: this.frameHierarchyScoreCurrent,
      compositionSafetyFlag: this.compositionSafetyFlagCurrent,
      compositionSafetyScore: this.compositionSafetyScoreCurrent,
      overbright: this.overbrightCurrent,
      ringBeltPersistence: this.ringBeltPersistenceCurrent,
      wirefieldDensityScore: this.wirefieldDensityScoreCurrent,
      worldDominanceDelivered: this.worldDominanceDeliveredCurrent,
      stageFallbackHeroOverreach: this.stageFallbackHeroOverreachCurrent,
      stageFallbackRingOverdraw: this.stageFallbackRingOverdrawCurrent,
      stageFallbackOverbrightRisk: this.stageFallbackOverbrightRiskCurrent,
      stageFallbackWashoutRisk: this.stageFallbackWashoutRiskCurrent,
      afterImageDamp: this.visualTelemetry.afterImageDamp,
      atmosphereMatterState: this.activeMatterState,
      atmosphereGas: this.atmosphereGas,
      atmosphereLiquid: this.atmosphereLiquid,
      atmospherePlasma: this.atmospherePlasma,
      atmosphereCrystal: this.atmosphereCrystal,
      atmospherePressure: this.atmospherePressure,
      atmosphereIonization: this.atmosphereIonization,
      atmosphereResidue: this.atmosphereResidue,
      atmosphereStructureReveal: this.atmosphereStructureReveal,
      assetLayerActivity,
      temporalWindows: {
        preBeatLift: this.preBeatLift,
        beatStrike: this.beatStrike,
        postBeatRelease: this.postBeatRelease,
        interBeatFloat: this.interBeatFloat,
        barTurn: this.barTurn,
        phraseResolve: this.phraseResolve
      }
    };
  }

  setPostTelemetry(input: {
    qualityTier: SceneQualityProfile['tier'];
    exposure: number;
    bloomStrength: number;
    bloomThreshold: number;
    bloomRadius: number;
    afterImageDamp?: number;
  }): void {
    this.overbrightCurrent = THREE.MathUtils.clamp(
      Math.max(0, input.exposure - this.stageCuePlan.exposureCeiling) * 4.2 +
        Math.max(0, input.bloomStrength - this.stageCuePlan.bloomCeiling) * 2.6 +
        Math.max(0, this.heroGlowSpend - 1.02) * 0.8 +
        Math.max(0, this.worldGlowSpend - 0.94) * 0.7,
      0,
      1.5
    );
    this.refreshCompositionSafetyState();
    this.visualTelemetry = {
      ...this.visualTelemetry,
      qualityTier: input.qualityTier,
      exposure: input.exposure,
      bloomStrength: input.bloomStrength,
      bloomThreshold: input.bloomThreshold,
      bloomRadius: input.bloomRadius,
      compositionSafetyFlag: this.compositionSafetyFlagCurrent,
      compositionSafetyScore: this.compositionSafetyScoreCurrent,
      overbright: this.overbrightCurrent,
      afterImageDamp: input.afterImageDamp ?? this.visualTelemetry.afterImageDamp
    };
  }

  private estimateHeroCoverage(): number {
    const baseRadius =
      (this.heroGeometry.boundingSphere?.radius ?? 1.04) *
      this.heroScaleCurrent *
      1.18;
    const projectedCenter = this.heroGroup.getWorldPosition(this.heroTelemetryVector).project(this.camera);
    const projectedX = this.heroGroup
      .localToWorld(this.heroTelemetryOffsetX.set(baseRadius, 0, 0))
      .project(this.camera);
    const projectedY = this.heroGroup
      .localToWorld(this.heroTelemetryOffsetY.set(0, baseRadius, 0))
      .project(this.camera);
    const radiusX = Math.abs(projectedX.x - projectedCenter.x) * 0.5;
    const radiusY = Math.abs(projectedY.y - projectedCenter.y) * 0.5;

    return THREE.MathUtils.clamp(
      Math.PI * radiusX * radiusY * 1.12,
      0,
      1
    );
  }

  private measureHeroOffCenterPenalty(): number {
    const { laneTargetX, laneTargetY, offCenterMax } =
      this.stageCompositionPlan.heroEnvelope;
    const deltaX = this.heroScreenX - laneTargetX;
    const deltaY = this.heroScreenY - laneTargetY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    return THREE.MathUtils.clamp(
      (distance - offCenterMax) / Math.max(0.18, 0.62 - offCenterMax),
      0,
      1
    );
  }

  private measureHeroDepthPenalty(): number {
    return THREE.MathUtils.clamp(
      Math.max(0, this.heroGroup.position.z - this.stageCompositionPlan.heroEnvelope.depthMax) /
        0.72,
      0,
      1
    );
  }

  private averageMaterialOpacity(
    values: Array<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>
  ): number {
    if (values.length === 0) {
      return 0;
    }

    return (
      values.reduce((sum, mesh) => sum + mesh.material.opacity, 0) /
      values.length
    );
  }

  private resolveSceneVariationProfile(): SceneVariationProfile {
    const paletteTargets = this.stageCuePlan.paletteTargets;
    const paletteTargetDominance = Math.max(
      paletteTargets['void-cyan'],
      paletteTargets['tron-blue'],
      paletteTargets['acid-lime'],
      paletteTargets['solar-magenta'],
      paletteTargets['ghost-white']
    );
    const paletteSpread = 1 - paletteTargetDominance;
    const cueFamily = this.stageCuePlan.family;
    const worldMode = this.stageCuePlan.worldMode;
    const screenEffectFamily = this.stageCuePlan.screenEffectIntent.family;
    const shotClass = this.stageCompositionPlan.shotClass;
    const voidProfile = THREE.MathUtils.clamp(
      this.actWeights['void-chamber'] * 0.42 +
        paletteTargets['void-cyan'] * 0.22 +
        paletteTargets['ghost-white'] * 0.12 +
        (cueFamily === 'brood' ? 0.14 : 0) +
        (cueFamily === 'haunt' ? 0.12 : 0) +
        (cueFamily === 'release' ? 0.08 : 0) +
        (worldMode === 'hold' ? 0.16 : 0) +
        (worldMode === 'ghost-chamber' ? 0.22 : 0),
      0,
      1
    );
    const spectralProfile = THREE.MathUtils.clamp(
      this.actWeights['ghost-afterimage'] * 0.34 +
        this.familyWeights['spectral-plume'] * 0.18 +
        this.releaseTail * 0.14 +
        this.resonance * 0.12 +
        (cueFamily === 'release' ? 0.16 : 0) +
        (cueFamily === 'haunt' ? 0.22 : 0) +
        (worldMode === 'ghost-chamber' ? 0.14 : 0) +
        (this.activeHeroForm === 'mushroom' ? 0.12 : 0) +
        (this.activeHeroForm === 'diamond' ? 0.08 : 0) +
        paletteTargets['ghost-white'] * 0.16,
      0,
      1
    );
    const stormProfile = THREE.MathUtils.clamp(
      this.actWeights['matrix-storm'] * 0.3 +
        this.familyWeights['storm-crown'] * 0.18 +
        this.stageCuePlan.heroMotionBias * 0.16 +
        (cueFamily === 'gather' ? 0.16 : 0) +
        (cueFamily === 'reveal' ? 0.14 : 0) +
        paletteTargets['tron-blue'] * 0.16 +
        paletteTargets['acid-lime'] * 0.14 +
        this.stageCuePlan.eventDensity * 0.08,
      0,
      1
    );
    const solarProfile = THREE.MathUtils.clamp(
      this.actWeights['laser-bloom'] * 0.28 +
        this.actWeights['eclipse-rupture'] * 0.14 +
        (cueFamily === 'reveal' ? 0.14 : 0) +
        (cueFamily === 'rupture' ? 0.14 : 0) +
        paletteTargets['solar-magenta'] * 0.24 +
        paletteTargets['acid-lime'] * 0.08 +
        this.sectionChange * 0.08,
      0,
      1
    );
    const eclipseProfile = THREE.MathUtils.clamp(
      this.actWeights['eclipse-rupture'] * 0.36 +
        (cueFamily === 'rupture' ? 0.2 : 0) +
        (worldMode === 'collapse-well' ? 0.22 : 0) +
        (screenEffectFamily === 'impact-memory' ? 0.16 : 0) +
        (screenEffectFamily === 'carve' ? 0.14 : 0) +
        (this.activeHeroForm === 'shard' ? 0.08 : 0),
      0,
      1
    );
    const prismaticProfile = THREE.MathUtils.clamp(
      paletteSpread * 0.42 +
        this.stageCuePlan.heroMorphBias * 0.18 +
        (cueFamily === 'gather' ? 0.08 : 0) +
        (cueFamily === 'reveal' ? 0.12 : 0) +
        (worldMode === 'fan-sweep' ? 0.14 : 0) +
        (worldMode === 'field-bloom' ? 0.08 : 0) +
        (this.activeHeroForm === 'prism' ? 0.18 : 0) +
        (this.activeHeroAccentForm === 'prism' ? 0.08 : 0) +
        (this.activeHeroForm === 'pyramid' ? 0.08 : 0) +
        (this.activeHeroForm === 'shard' ? 0.08 : 0),
      0,
      1.2
    );
    const noveltyDrive = THREE.MathUtils.clamp(
      paletteSpread * 0.36 +
        prismaticProfile * 0.22 +
        spectralProfile * 0.12 +
        solarProfile * 0.1 +
        this.stageCuePlan.eventDensity * 0.12 +
        this.stageCuePlan.heroMotionBias * 0.08 +
        this.stageCuePlan.screenEffectIntent.intensity * 0.08,
      0,
      1.4
    );

    return {
      voidProfile,
      spectralProfile,
      stormProfile,
      solarProfile,
      eclipseProfile,
      prismaticProfile,
      noveltyDrive,
      ringSuppression: THREE.MathUtils.clamp(
        prismaticProfile * 0.24 +
          spectralProfile * 0.18 +
          stormProfile * 0.12 +
          (cueFamily === 'reveal' ? 0.08 : 0) +
          (worldMode === 'field-bloom' ? 0.08 : 0),
        0,
        0.72
      ),
      portalSuppression: THREE.MathUtils.clamp(
        spectralProfile * 0.12 + voidProfile * 0.08 + eclipseProfile * 0.12,
        0,
        0.6
      ),
      latticeBoost: THREE.MathUtils.clamp(
        voidProfile * 0.18 + spectralProfile * 0.32 + prismaticProfile * 0.08,
        0,
        0.82
      ),
      beamBoost: THREE.MathUtils.clamp(
        stormProfile * 0.26 + solarProfile * 0.18 + prismaticProfile * 0.1,
        0,
        0.82
      ),
      haloBoost: THREE.MathUtils.clamp(
        solarProfile * 0.28 + prismaticProfile * 0.14 + voidProfile * 0.04,
        0,
        0.72
      ),
      bladeBoost: THREE.MathUtils.clamp(
        eclipseProfile * 0.22 + stormProfile * 0.1 + solarProfile * 0.12,
        0,
        0.72
      ),
      sweepBoost: THREE.MathUtils.clamp(
        prismaticProfile * 0.22 +
          stormProfile * 0.12 +
          spectralProfile * 0.08 +
          (worldMode === 'fan-sweep' ? 0.14 : 0),
        0,
        0.78
      ),
      heroRoamBoost: THREE.MathUtils.clamp(
        noveltyDrive * 0.22 +
          prismaticProfile * 0.1 +
          stormProfile * 0.08 +
          (shotClass !== 'anchor' ? 0.06 : 0),
        0,
        0.82
      ),
      cameraSpreadBoost: THREE.MathUtils.clamp(
        noveltyDrive * 0.18 +
          spectralProfile * 0.08 +
          prismaticProfile * 0.1 +
          (shotClass === 'worldTakeover' ? 0.14 : 0),
        0,
        0.8
      ),
      postContrastBoost: THREE.MathUtils.clamp(
        eclipseProfile * 0.26 + voidProfile * 0.12 + spectralProfile * 0.1,
        0,
        0.82
      )
    };
  }

  private measureRingBeltPersistence(): number {
    const portalAverage = this.averageMaterialOpacity(
      this.portalRings.map(({ mesh }) => mesh)
    );
    const haloAverage = this.averageMaterialOpacity(
      this.chromaHalos.map(({ mesh }) => mesh)
    );
    const chamberAverage = this.averageMaterialOpacity(
      this.chamberRings.map(({ mesh }) => mesh)
    );
    const midlineBias = THREE.MathUtils.clamp(
      1 - Math.abs(this.heroScreenY - 0.5) * 2.4,
      0,
      1
    );

    return THREE.MathUtils.clamp(
      portalAverage * 4.8 +
        haloAverage * 1.8 +
        chamberAverage * 1.3 +
        midlineBias * 0.08,
      0,
      1
    );
  }

  private measureWirefieldDensity(): number {
    const latticeAverage =
      this.latticeMaterials.length > 0
        ? this.latticeMaterials.reduce((sum, material) => sum + material.opacity, 0) /
          this.latticeMaterials.length
        : 0;

    return THREE.MathUtils.clamp(
      latticeAverage * 14 +
        this.heroSeamMaterial.opacity * 2.4 +
        this.heroEdgesMaterial.opacity * 2.6 +
        this.ghostHeroMaterial.opacity * 1.8,
      0,
      1
    );
  }

  private measureChamberPresenceScore(): number {
    const laserAverage =
      this.laserBeams.length > 0
        ? this.laserBeams.reduce((sum, beam) => sum + beam.mesh.material.opacity, 0) /
          this.laserBeams.length
        : 0;
    const chamberAverage = this.averageMaterialOpacity(
      this.chamberRings.map(({ mesh }) => mesh)
    );
    const portalAverage = this.averageMaterialOpacity(
      this.portalRings.map(({ mesh }) => mesh)
    );
    const haloAverage = this.averageMaterialOpacity(
      this.chromaHalos.map(({ mesh }) => mesh)
    );
    const atmosphereColumnAverage = this.averageMaterialOpacity(
      this.atmosphereColumns.map(({ mesh }) => mesh)
    );
    const latticeAverage =
      this.latticeMaterials.length > 0
        ? this.latticeMaterials.reduce((sum, material) => sum + material.opacity, 0) /
          this.latticeMaterials.length
        : 0;
    const stageBladeAverage =
      this.stageBlades.length > 0
        ? this.stageBlades.reduce((sum, blade) => sum + blade.mesh.material.opacity, 0) /
          this.stageBlades.length
        : 0;
    const stageSweepAverage =
      this.stageSweepPlanes.length > 0
        ? this.stageSweepPlanes.reduce((sum, plane) => sum + plane.mesh.material.opacity, 0) /
          this.stageSweepPlanes.length
        : 0;
    const heroAuraDominance =
      this.heroAuraMaterial.opacity * 1.8 + this.heroEnergyShellMaterial.opacity * 2.2;
    const slabLock =
      portalAverage * 1.8 +
      chamberAverage * 1.3 +
      Math.max(0, this.ringBeltPersistenceCurrent - 0.28) * 0.8;

    return THREE.MathUtils.clamp(
      this.ringAuthorityCurrent * 0.18 +
        this.worldGlowSpend * 0.16 +
        atmosphereColumnAverage * 2.8 +
        stageBladeAverage * 2.1 +
        stageSweepAverage * 1.8 +
        haloAverage * 1.2 +
        latticeAverage * 1.4 +
        laserAverage * 1.4 +
        chamberAverage * 0.9 +
        portalAverage * 0.7 -
        slabLock * 0.16 -
        heroAuraDominance * 0.18 -
        this.heroCoverageEstimateCurrent * 0.18,
      0,
      1
    );
  }

  private measureWorldDominanceDelivered(): number {
    const atmosphereVeilAverage = this.averageMaterialOpacity(
      this.atmosphereVeils.map(({ mesh }) => mesh)
    );
    const atmosphereColumnAverage = this.averageMaterialOpacity(
      this.atmosphereColumns.map(({ mesh }) => mesh)
    );
    const chamberAverage = this.averageMaterialOpacity(
      this.chamberRings.map(({ mesh }) => mesh)
    );
    const portalAverage = this.averageMaterialOpacity(
      this.portalRings.map(({ mesh }) => mesh)
    );
    const laserAverage =
      this.laserBeams.length > 0
        ? this.laserBeams.reduce((sum, beam) => sum + beam.mesh.material.opacity, 0) /
          this.laserBeams.length
        : 0;
    const heroAuraDominance =
      this.heroAuraMaterial.opacity * 1.8 + this.heroEnergyShellMaterial.opacity * 2.4;
    const dominanceTarget =
      this.stageCuePlan.dominance === 'world'
        ? 0.74
        : this.stageCuePlan.dominance === 'chamber'
          ? 0.62
          : this.stageCuePlan.dominance === 'hybrid'
            ? 0.48
            : 0.34;

    return THREE.MathUtils.clamp(
      this.chamberPresenceScoreCurrent * 0.56 +
        this.worldGlowSpend * 0.24 +
        atmosphereColumnAverage * 1.8 +
        atmosphereVeilAverage * 1.1 +
        chamberAverage * 0.6 +
        portalAverage * 0.4 +
        dominanceTarget * 0.16 -
        laserAverage * 0.3 -
        this.ringBeltPersistenceCurrent * 0.18 -
        heroAuraDominance * 0.16 -
        this.heroCoverageEstimateCurrent * 0.34 -
        this.heroDepthPenaltyCurrent * 0.12 +
        this.heroOffCenterPenaltyCurrent * 0.04,
      0,
      1
    );
  }

  private measureFrameHierarchyScore(): number {
    return THREE.MathUtils.clamp(
      0.78 +
        this.worldDominanceDeliveredCurrent * 0.18 +
        (1 - this.heroCoverageEstimateCurrent) * 0.08 -
        this.heroOffCenterPenaltyCurrent * 0.22 -
        this.heroDepthPenaltyCurrent * 0.16 -
        this.ringBeltPersistenceCurrent * 0.18 -
        this.wirefieldDensityScoreCurrent * 0.2 -
        this.overbrightCurrent * 0.24,
      0,
      1
    );
  }

  private refreshCompositionSafetyState(): void {
    const coverageOverflow = Math.max(
      0,
      this.heroCoverageEstimateCurrent -
        this.stageCompositionPlan.heroEnvelope.coverageMax
    );
    const dominancePenalty =
      this.stageCuePlan.dominance === 'world' ||
      this.stageCuePlan.dominance === 'chamber'
        ? Math.max(0, 0.56 - this.worldDominanceDeliveredCurrent)
        : 0;

    this.compositionSafetyScoreCurrent = THREE.MathUtils.clamp(
      1 -
        (coverageOverflow * 1.34 +
          this.heroOffCenterPenaltyCurrent * 0.28 +
          this.heroDepthPenaltyCurrent * 0.22 +
          this.ringBeltPersistenceCurrent * 0.18 +
          this.wirefieldDensityScoreCurrent * 0.16 +
          this.overbrightCurrent * 0.18 +
          dominancePenalty * 0.22) +
        this.frameHierarchyScoreCurrent * 0.14,
      0,
      1
    );
    this.compositionSafetyFlagCurrent =
      this.compositionSafetyScoreCurrent <
        this.stageCompositionPlan.compositionSafety ||
      coverageOverflow > 0.06;
  }

  private resolveHeroAnchorOffsets(
    lane: StageCuePlan['heroAnchorLane'],
    strength: number
  ): { x: number; y: number } {
    switch (lane) {
      case 'left':
        return { x: -0.44 * strength, y: 0 };
      case 'right':
        return { x: 0.44 * strength, y: 0 };
      case 'high':
        return { x: 0, y: 0.34 * strength };
      case 'low':
        return { x: 0, y: -0.26 * strength };
      default:
        return { x: 0, y: 0 };
    }
  }

  private measureRingAuthority(): number {
    const averageOpacity = (
      values: Array<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>
    ): number => {
      if (values.length === 0) {
        return 0;
      }

      return (
        values.reduce((sum, mesh) => sum + mesh.material.opacity, 0) /
        values.length
      );
    };

    const chamberAverage = averageOpacity(this.chamberRings.map(({ mesh }) => mesh));
    const portalAverage = averageOpacity(this.portalRings.map(({ mesh }) => mesh));
    const haloAverage = averageOpacity(this.chromaHalos.map(({ mesh }) => mesh));

    return THREE.MathUtils.clamp(
      chamberAverage * 8 + portalAverage * 6 + haloAverage * 5,
      0,
      1.5
    );
  }

  private selectPressureWaveBand(frame: ListeningFrame): PressureWaveBand {
    const lowScore =
      frame.subPressure * 1.32 +
      frame.bassBody * 1.08 +
      frame.body * 0.3 +
      frame.dropImpact * 0.22;
    const midScore =
      frame.lowMidBody * 1.04 +
      frame.presence * 0.34 +
      frame.resonance * 0.48 +
      frame.accent * 0.28;
    const highScore =
      frame.air * 1.04 +
      frame.shimmer * 1.16 +
      frame.brightness * 0.74 +
      frame.accent * 0.22;

    if (lowScore >= midScore && lowScore >= highScore) {
      return 'sub';
    }

    if (highScore > lowScore && highScore > midScore) {
      return 'high';
    }

    return 'mid';
  }

  private resolvePressureWaveStyle(
    frame: ListeningFrame,
    band: PressureWaveBand,
    triggerSource: PressureWaveTriggerSource
  ): PressureWaveStyle {
    if (band === 'sub') {
      return 'ground-swell';
    }

    if (
      band === 'high' ||
      (triggerSource === 'macro' &&
        (frame.showState === 'aftermath' || frame.releaseTail > 0.26))
    ) {
      return 'ion-crown';
    }

    return 'torsion-arc';
  }

  private triggerPressureWave(
    frame: ListeningFrame,
    elapsedSeconds: number,
    intensity: number,
    warmMix: number,
    triggerSource: PressureWaveTriggerSource = 'moment'
  ): void {
    const band = this.selectPressureWaveBand(frame);
    const style = this.resolvePressureWaveStyle(frame, band, triggerSource);
    const activeWaveCount = this.pressureWaves.reduce(
      (count, candidate) => count + (candidate.active ? 1 : 0),
      0
    );
    const baseCooldown =
      triggerSource === 'macro'
        ? 0.34
        : triggerSource === 'drop'
          ? 0.42
          : 0.56;
    const cooldown = THREE.MathUtils.clamp(
      baseCooldown -
        intensity * 0.06 -
        frame.sectionChange * 0.04 -
        frame.dropImpact * 0.03,
      0.28,
      0.68
    );
    const secondsSinceLast = elapsedSeconds - this.lastPressureWaveTriggerSeconds;
    const intensityOverride =
      intensity > (triggerSource === 'moment' ? 1.42 : 1.24) ||
      frame.sectionChange > 0.32;

    if (
      triggerSource === 'moment' &&
      frame.transientConfidence < 0.32 &&
      frame.accent < 0.34 &&
      frame.momentAmount < 0.3
    ) {
      return;
    }

    if (
      triggerSource === 'drop' &&
      frame.dropImpact < 0.34 &&
      frame.sectionChange < 0.24
    ) {
      return;
    }

    if (
      activeWaveCount >= 1 &&
      secondsSinceLast < cooldown * 1.15 &&
      !intensityOverride
    ) {
      return;
    }

    if (secondsSinceLast < cooldown && !intensityOverride) {
      return;
    }

    const wave =
      this.pressureWaves.find((candidate) => !candidate.active) ??
      this.pressureWaves.reduce((oldest, candidate) =>
        candidate.age > oldest.age ? candidate : oldest
      );
    const signature = hashSignature(
      [
        Math.floor(frame.timestampMs / 90),
        band,
        style,
        triggerSource,
        this.activeAct,
        this.activeFamily,
        this.paletteState,
        frame.momentKind,
        Math.round(frame.harmonicColor * 10),
        Math.round(intensity * 10),
        Math.round(warmMix * 10)
      ].join(':')
    );
    const spinNorm = ((signature >>> 1) % 1024) / 1023;
    const tiltXNorm = ((signature >>> 11) % 1024) / 1023;
    const tiltYNorm = ((signature >>> 21) % 1024) / 1023;
    const driftNorm = ((signature >>> 7) % 1024) / 1023;
    const liftNorm = ((signature >>> 17) % 1024) / 1023;
    const depthNorm = ((signature >>> 27) % 32) / 31;
    wave.age = 0;
    wave.active = true;
    wave.intensity = intensity;
    wave.warmMix = THREE.MathUtils.clamp(warmMix, 0, 1);
    wave.band = band;
    wave.style = style;
    wave.colorCycle = signature % PRESSURE_WAVE_COLOR_FAMILIES[band].length;
    switch (style) {
      case 'ground-swell':
        wave.spin =
          (signature % 2 === 0 ? 1 : -1) *
          THREE.MathUtils.lerp(0.08, 0.28, spinNorm) *
          (0.82 + intensity * 0.12);
        wave.tiltX = THREE.MathUtils.lerp(-0.08, 0.08, tiltXNorm);
        wave.tiltY = THREE.MathUtils.lerp(-0.12, 0.12, tiltYNorm);
        wave.driftX = THREE.MathUtils.lerp(-0.16, 0.16, driftNorm);
        wave.driftY = THREE.MathUtils.lerp(-0.08, 0.04, liftNorm);
        wave.depthBias = THREE.MathUtils.lerp(-0.18, 0.04, depthNorm);
        wave.expansion = 4.4 + intensity * 1.8;
        wave.anchorY = -0.22 - frame.body * 0.08;
        wave.anchorZ = -0.98 - frame.dropImpact * 0.16;
        wave.haloBias = 0.44;
        wave.glowBias = 0.78;
        break;
      case 'ion-crown':
        wave.spin =
          (signature % 2 === 0 ? 1 : -1) *
          THREE.MathUtils.lerp(0.32, 0.82, spinNorm) *
          (0.78 + intensity * 0.18);
        wave.tiltX = THREE.MathUtils.lerp(0.08, 0.24, tiltXNorm);
        wave.tiltY = THREE.MathUtils.lerp(-0.26, 0.26, tiltYNorm);
        wave.driftX = THREE.MathUtils.lerp(-0.18, 0.18, driftNorm);
        wave.driftY = THREE.MathUtils.lerp(0.02, 0.18, liftNorm);
        wave.depthBias = THREE.MathUtils.lerp(-0.04, 0.18, depthNorm);
        wave.expansion = 2.8 + intensity * 1.26;
        wave.anchorY = 0.02 + frame.air * 0.06;
        wave.anchorZ = -0.56 - frame.releaseTail * 0.08;
        wave.haloBias = 1.06;
        wave.glowBias = 0.52;
        break;
      default:
        wave.spin =
          (signature % 2 === 0 ? 1 : -1) *
          THREE.MathUtils.lerp(0.18, 0.52, spinNorm) *
          (0.74 + intensity * 0.18);
        wave.tiltX = THREE.MathUtils.lerp(-0.18, 0.18, tiltXNorm);
        wave.tiltY = THREE.MathUtils.lerp(-0.18, 0.18, tiltYNorm);
        wave.driftX = THREE.MathUtils.lerp(-0.24, 0.24, driftNorm);
        wave.driftY = THREE.MathUtils.lerp(-0.08, 0.12, liftNorm);
        wave.depthBias = THREE.MathUtils.lerp(-0.1, 0.12, depthNorm);
        wave.expansion = 3.5 + intensity * 1.58;
        wave.anchorY = -0.08 + (liftNorm - 0.5) * 0.08;
        wave.anchorZ = -0.76 - frame.dropImpact * 0.1;
        wave.haloBias = 0.76;
        wave.glowBias = 0.66;
        break;
    }
    wave.group.visible = true;
    wave.group.position.set(0, wave.anchorY, wave.anchorZ);
    wave.group.rotation.set(Math.PI / 2, 0, 0);
    wave.waveMesh.scale.setScalar(1);
    wave.torusMesh.scale.setScalar(0.92);
    wave.haloMesh.scale.setScalar(0.84);
    wave.waveMesh.material.opacity = 0;
    wave.torusMesh.material.opacity = 0;
    wave.haloMesh.material.opacity = 0;
    this.lastPressureWaveTriggerSeconds = elapsedSeconds;
  }

  private applyMotionPoseState(
    state: MotionPoseState,
    targetPosition: THREE.Vector3,
    targetEuler: THREE.Euler,
    positionRate: number,
    rotationRate: number,
    deltaSeconds: number
  ): void {
    const safeDelta = Math.max(deltaSeconds, 0.001);
    this.motionVelocityScratch.copy(targetPosition).sub(state.position);
    this.motionAngularScratch.set(
      targetEuler.x - state.euler.x,
      targetEuler.y - state.euler.y,
      targetEuler.z - state.euler.z
    );
    state.velocity.copy(this.motionVelocityScratch).multiplyScalar(1 / safeDelta);
    state.angularVelocity.copy(this.motionAngularScratch).multiplyScalar(1 / safeDelta);
    state.targetPosition.copy(targetPosition);
    state.targetEuler.copy(targetEuler);
    this.smoothVector(state.position, state.targetPosition, positionRate, deltaSeconds);
    state.targetQuaternion.setFromEuler(state.targetEuler);
    this.smoothQuaternion(
      state.quaternion,
      state.targetQuaternion,
      rotationRate,
      deltaSeconds
    );
    state.euler.setFromQuaternion(state.quaternion);
  }

  private smoothVector(
    current: THREE.Vector3,
    target: THREE.Vector3,
    rate: number,
    deltaSeconds: number
  ): void {
    current.lerp(target, 1 - Math.exp(-rate * deltaSeconds));
  }

  private smoothQuaternion(
    current: THREE.Quaternion,
    target: THREE.Quaternion,
    rate: number,
    deltaSeconds: number
  ): void {
    current.slerp(target, 1 - Math.exp(-rate * deltaSeconds));
  }

  private smoothValue(
    current: number,
    target: number,
    rate: number,
    deltaSeconds: number
  ): number {
    const mix = 1 - Math.exp(-rate * deltaSeconds);

    return current + (target - current) * mix;
  }
}
