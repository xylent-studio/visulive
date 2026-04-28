import * as THREE from 'three';
import type { StageAudioFeatures } from '../../../audio/stageAudioFeatures';
import type { PerformanceIntent } from '../../../types/audio';
import type { RuntimeTuning } from '../../../types/tuning';
import type {
  AtmosphereMatterState,
  PaletteState,
  StageCompositionPlan,
  StageCuePlan
} from '../../../types/visual';
import type { SceneQualityProfile } from '../../runtime';
import type { SceneVariationProfile } from '../../direction/sceneVariation';
import type { MotionPoseState } from '../motion/MotionSystem';

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

export type WorldSystemUpdateContext = {
  elapsedSeconds: number;
  idleBreath: number;
  qualityProfile: SceneQualityProfile;
  tuning: Pick<RuntimeTuning, 'atmosphere' | 'neonStageFloor' | 'worldBootFloor'>;
  paletteState: PaletteState;
  performanceIntent: PerformanceIntent;
  sceneVariation: SceneVariationProfile;
  actWeights: {
    void: number;
    laser: number;
    matrix: number;
    eclipse: number;
    ghost: number;
  };
  familyWeights: {
    liquid: number;
    portal: number;
    cathedral: number;
    ghost: number;
    storm: number;
    eclipse: number;
    plume: number;
  };
  events: {
    portalOpen: number;
    worldStain: number;
    haloIgnition: number;
    collapse: number;
    aftermath: number;
  };
  director: {
    worldActivity: number;
    radiance: number;
    spectacle: number;
    colorBias: number;
    colorWarp: number;
  };
  atmosphere: {
    activeMatterState: AtmosphereMatterState;
    gas: number;
    liquid: number;
    plasma: number;
    crystal: number;
    pressure: number;
    ionization: number;
    residue: number;
    structureReveal: number;
  };
  budgets: {
    ambientGlow: number;
    eventGlow: number;
    roomMusicVisualFloor: number;
    adaptiveMusicVisualFloor: number;
  };
  stage: {
    cuePlan: StageCuePlan;
    compositionPlan: StageCompositionPlan;
  };
  stageAudioFeatures: StageAudioFeatures;
  motion: {
    chamberDrift: THREE.Vector3;
    chamberMotion: MotionPoseState;
    livingField: number;
  };
  audio: {
    air: number;
    shimmer: number;
    harmonicColor: number;
    transientConfidence: number;
    phrasePhase: number;
    barPhase: number;
    beatPhase: number;
    preDropTension: number;
    dropImpact: number;
    sectionChange: number;
    releaseTail: number;
    releasePulse: number;
    strikePulse: number;
  };
  metrics: {
    heroCoverageEstimateCurrent: number;
    ringBeltPersistenceCurrent: number;
  };
};

export type WorldSystemTelemetry = {
  worldHue: number;
  worldSphereLuminance: number;
  worldStainOpacity: number;
  worldFlashOpacity: number;
  fogDensity: number;
  atmosphereVeilOpacityAverage: number;
  atmosphereColumnOpacityAverage: number;
};

const BASE_BACKGROUND = new THREE.Color('#040507');
const COOL_BACKGROUND = new THREE.Color('#06141a');
const WARM_BACKGROUND = new THREE.Color('#1d1008');
const VOID_BACKGROUND = new THREE.Color('#020305');
const GHOST_PALE = new THREE.Color('#f1e8d8');
const STAIN_VIOLET = new THREE.Color('#4f315a');
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

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
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
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      const radius = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx);
      const edge = THREE.MathUtils.clamp(1 - radius, 0, 1);
      const radialSoft = Math.pow(edge, 1.8);
      const radialHard = Math.pow(edge, 2.4);
      const waveA =
        0.5 +
        0.5 *
          Math.sin(
            nx * 8.4 + angle * 3.4 + Math.cos(ny * 6.2 + radius * 8.4) * 1.6
          );
      const waveB =
        0.5 +
        0.5 *
          Math.cos(
            ny * 10.6 - angle * 4.3 + Math.sin(nx * 7.6 - radius * 6.4) * 1.8
          );
      const waveC =
        0.5 +
        0.5 *
          Math.sin(
            (nx + ny) * 14.2 + angle * 5.8 + Math.cos(radius * 10.4) * 2.1
          );
      const ribbon =
        0.5 +
        0.5 *
          Math.sin(
            (nx - ny) * 17.2 + radius * 12.8 + Math.sin(angle * 5.6) * 2.4
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

function averageMaterialOpacity(
  values: Array<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((sum, mesh) => sum + mesh.material.opacity, 0) / values.length
  );
}

export class WorldSystem {
  private readonly scene: THREE.Scene;
  private readonly root: THREE.Group;
  private readonly atmosphereGroup = new THREE.Group();
  private readonly worldSphereMaterial = new THREE.MeshBasicMaterial({
    color: BASE_BACKGROUND.clone(),
    side: THREE.BackSide
  });
  private readonly worldSphere = new THREE.Mesh(
    new THREE.SphereGeometry(24, 48, 32),
    this.worldSphereMaterial
  );
  private readonly worldStainMaterial = new THREE.MeshBasicMaterial({
    color: STAIN_VIOLET.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  private readonly worldStainPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    this.worldStainMaterial
  );
  private readonly worldFlashMaterial = new THREE.MeshBasicMaterial({
    color: GHOST_PALE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  private readonly worldFlashPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    this.worldFlashMaterial
  );
  private readonly fogColor = BASE_BACKGROUND.clone();
  private readonly fog = new THREE.FogExp2(this.fogColor, 0.078);
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
  private readonly atmosphereColorScratch = new THREE.Color();
  private readonly atmosphereColorScratchB = new THREE.Color();
  private readonly atmosphereColorScratchC = new THREE.Color();
  private readonly worldHsl = { h: 0, s: 0, l: 0 };

  constructor(input: { scene: THREE.Scene; root: THREE.Group }) {
    this.scene = input.scene;
    this.root = input.root;
  }

  build(): void {
    this.scene.fog = this.fog;
    this.scene.add(this.worldSphere);
    this.worldStainPlane.position.z = -8;
    this.worldFlashPlane.position.z = -7.8;
    this.scene.add(this.worldStainPlane);
    this.scene.add(this.worldFlashPlane);
    this.atmosphereGroup.renderOrder = -1;
    this.root.add(this.atmosphereGroup);

    const veilSpecs: Omit<AtmosphereVeil, 'mesh'>[] = [
      {
        baseWidth: 25.4,
        baseHeight: 16.4,
        depth: -7.2,
        offset: 0.2,
        side: -1,
        mode: 'mist'
      },
      {
        baseWidth: 30.8,
        baseHeight: 19.4,
        depth: -9.6,
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
          spec.mode === 'charge' ? THREE.AdditiveBlending : THREE.NormalBlending,
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
      mesh.position.set(spec.side * (3.6 + spec.offset * 1.4), 0.3, spec.depth);
      mesh.rotation.y = spec.side * (0.22 + spec.offset * 0.08);
      mesh.renderOrder = -1;
      this.atmosphereColumns.push({
        mesh,
        ...spec
      });
      this.atmosphereGroup.add(mesh);
    }
  }

  applyQualityProfile(_profile: SceneQualityProfile): void {
    this.atmosphereVeils.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.atmosphereColumns.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
  }

  update(context: WorldSystemUpdateContext): void {
    const warmBias = Math.max(0, (context.director.colorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - context.director.colorBias) * 2);
    const paletteVoid = context.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = context.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = context.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = context.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = context.paletteState === 'ghost-white' ? 1 : 0;
    const cueGather = context.stage.cuePlan.family === 'gather' ? 1 : 0;
    const cueRupture = context.stage.cuePlan.family === 'rupture' ? 1 : 0;
    const cueReveal = context.stage.cuePlan.family === 'reveal' ? 1 : 0;
    const cueRelease = context.stage.cuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = context.stage.cuePlan.family === 'haunt' ? 1 : 0;
    const cueReset = context.stage.cuePlan.family === 'reset' ? 1 : 0;
    const apertureCage =
      context.stage.cuePlan.worldMode === 'aperture-cage' ? 1 : 0;
    const fanSweep = context.stage.cuePlan.worldMode === 'fan-sweep' ? 1 : 0;
    const cathedralFrame =
      context.stage.cuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const collapseWell =
      context.stage.cuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const ghostChamber =
      context.stage.cuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const fieldBloom = context.stage.cuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const cueScreen = context.stage.cuePlan.screenWeight;
    const cueResidue = context.stage.cuePlan.residueWeight;
    const cueWorld = context.stage.cuePlan.worldWeight;
    const stageSubtractive = context.stage.cuePlan.subtractiveAmount;
    const stageFlash = context.stage.cuePlan.flashAmount;
    const stageWipe = context.stage.cuePlan.wipeAmount;
    const washoutSuppression = context.stage.cuePlan.washoutSuppression;
    const peakSpend = context.stage.cuePlan.spendProfile === 'peak' ? 1 : 0;
    const shotWorldTakeover =
      context.stage.compositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure =
      context.stage.compositionPlan.shotClass === 'pressure' ? 1 : 0;
    const chamberEnvelope = context.stage.compositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(
      context.budgets.roomMusicVisualFloor,
      context.budgets.adaptiveMusicVisualFloor
    );
    const stageColorLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.34 +
        chamberPresenceFloor * 0.36 +
        chamberDominanceFloor * 0.3 +
        chamberWorldTakeoverBias * 0.28 +
        context.tuning.neonStageFloor * 0.22 +
        context.tuning.worldBootFloor * 0.16,
      0,
      1
    );
    const tempoDensity = context.stageAudioFeatures.tempo.density;
    const impactHit = context.stageAudioFeatures.impact.hit;
    const musicPresence = context.stageAudioFeatures.presence.music;
    const spatialPresence = context.stageAudioFeatures.presence.spatial;
    const textureShimmer = context.stageAudioFeatures.texture.shimmer;
    const memoryAfterglow = context.stageAudioFeatures.memory.afterglow;
    const restraint = context.stageAudioFeatures.stability.restraint;
    const chamberDrift = context.motion.chamberDrift;
    const chamberMotion = context.motion.chamberMotion;
    const spectralPulse =
      0.5 +
      0.5 *
        Math.sin(
          context.director.colorBias * Math.PI * 4 + context.elapsedSeconds * 0.24
        );
    const matrixPulse =
      0.5 +
      0.5 *
        Math.sin(
          context.director.colorBias * Math.PI * 3 + context.elapsedSeconds * 0.16
        );
    const beatPulse = onsetPulse(context.audio.beatPhase);
    const phrasePulse = phasePulse(
      context.audio.phrasePhase,
      context.elapsedSeconds * 0.18
    );
    const barPulse = phasePulse(
      context.audio.barPhase,
      context.elapsedSeconds * 0.42 + 0.8
    );
    const chromaDrive = THREE.MathUtils.clamp(
      context.director.radiance * 0.56 +
        context.director.spectacle * 0.34 +
        context.audio.dropImpact * 0.28 +
        context.audio.sectionChange * 0.22 +
        impactHit * 0.16 +
        textureShimmer * 0.12 +
        context.audio.shimmer * 0.16,
      0,
      1.4
    );
    const gather =
      context.performanceIntent === 'ignite' ||
      context.performanceIntent === 'gather'
        ? 1
        : 0;
    const detonate = context.performanceIntent === 'detonate' ? 1 : 0;
    const haunt = context.performanceIntent === 'haunt' ? 1 : 0;

    const background = this.worldSphereMaterial.color;
    background
      .copy(BASE_BACKGROUND)
      .lerp(
        TRON_BLUE,
        0.12 +
          coolBias * 0.18 +
          context.familyWeights.portal * 0.16 +
          fanSweep * 0.08 +
          chromaDrive * 0.08 +
          spatialPresence * 0.08 +
          context.actWeights.laser * 0.12 +
          context.actWeights.matrix * 0.08 +
          paletteVoid * 0.22 +
          paletteTron * 0.26 +
          paletteGhost * 0.06 +
          stageColorLift * 0.22
      )
      .lerp(
        LASER_CYAN,
        0.08 +
          phrasePulse * 0.14 +
          context.events.worldStain * 0.18 +
          context.atmosphere.gas * 0.06 +
          context.atmosphere.liquid * 0.04 +
          context.atmosphere.plasma * 0.05 +
          fieldBloom * 0.08 +
          memoryAfterglow * 0.1 +
          haunt * 0.1 +
          context.actWeights.laser * 0.08 +
          context.actWeights.ghost * 0.04 +
          paletteVoid * 0.16 +
          stageColorLift * 0.18 +
          shotWorldTakeover * 0.06
      )
      .lerp(
        HOT_MAGENTA,
        0.04 +
          context.audio.sectionChange * 0.04 +
          impactHit * 0.04 +
          context.atmosphere.ionization * 0.04 +
          context.actWeights.eclipse * 0.08 +
          paletteSolar * 0.12
      )
      .lerp(
        VOLT_VIOLET,
        0.02 +
          phrasePulse * 0.08 +
          context.familyWeights.ghost * 0.04 +
          context.actWeights.ghost * 0.1 +
          paletteTron * 0.14
      )
      .lerp(
        MATRIX_GREEN,
        0.04 +
          context.familyWeights.ghost * 0.08 +
          context.audio.shimmer * 0.06 +
          context.atmosphere.liquid * 0.04 +
          (1 - context.audio.harmonicColor) * 0.04 +
          context.actWeights.matrix * 0.1 +
          paletteAcid * 0.22
      )
      .lerp(
        ACID_LIME,
        0.02 +
          context.audio.transientConfidence * 0.04 +
          beatPulse * 0.04 +
          paletteAcid * 0.18
      )
      .lerp(
        COOL_BACKGROUND,
        0.16 +
          context.familyWeights.plume * 0.28 +
          context.atmosphere.gas * 0.22 +
          context.atmosphere.liquid * 0.08 +
          context.atmosphere.residue * 0.08 +
          context.familyWeights.ghost * 0.18 +
          ghostChamber * 0.08 +
          context.familyWeights.portal * 0.12 +
          context.actWeights.void * 0.1 +
          context.actWeights.ghost * 0.08 +
          coolBias * 0.24 +
          spatialPresence * 0.08 +
          context.director.worldActivity * 0.06 +
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
          context.sceneVariation.prismaticProfile * 0.14 +
          context.sceneVariation.solarProfile * 0.08 +
          context.atmosphere.plasma * 0.04 +
          paletteSolar * 0.08
      )
      .lerp(
        SOLAR_ORANGE,
        0.01 +
          context.sceneVariation.solarProfile * 0.1 +
          context.atmosphere.plasma * 0.03 +
          detonate * 0.04 +
          context.events.haloIgnition * 0.04
      )
      .lerp(
        WARM_BACKGROUND,
        0.012 +
          context.familyWeights.liquid * 0.04 +
          context.events.haloIgnition * 0.04 +
          warmBias * 0.04 +
          detonate * 0.04 +
          paletteSolar * 0.06
      )
      .lerp(
        VOID_BACKGROUND,
        THREE.MathUtils.clamp(
          context.familyWeights.eclipse * 0.62 +
            context.events.collapse * 0.22 +
            collapseWell * 0.22 +
            apertureCage * 0.1 +
            stageSubtractive * 0.12 +
            context.actWeights.void * 0.12 +
            context.atmosphere.gas * 0.06 +
            context.actWeights.eclipse * 0.08 +
            context.events.aftermath * 0.08 +
            context.audio.preDropTension * 0.1 +
            haunt * 0.1 +
            paletteVoid * 0.12 -
            context.sceneVariation.voidProfile * 0.06 +
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
        context.familyWeights.plume * 0.12 +
          context.atmosphere.gas * 0.12 +
          context.atmosphere.liquid * 0.04 +
          context.audio.air * 0.08 +
          fieldBloom * 0.06 +
          memoryAfterglow * 0.08 +
          coolBias * 0.12 +
          chromaDrive * 0.04 +
          context.actWeights.laser * 0.1 +
          context.director.colorWarp * 0.04 +
          paletteVoid * 0.16 +
          paletteGhost * 0.08
      )
      .lerp(
        TRON_BLUE,
        phrasePulse * 0.06 +
          context.atmosphere.plasma * 0.04 +
          context.actWeights.laser * 0.08 +
          context.actWeights.matrix * 0.06 +
          paletteTron * 0.18 +
          stageColorLift * 0.18
      )
      .lerp(
        HOT_MAGENTA,
        warmBias * 0.03 +
          context.atmosphere.plasma * 0.03 +
          context.audio.dropImpact * 0.04 +
          context.actWeights.eclipse * 0.08 +
          paletteSolar * 0.12
      )
      .lerp(
        CYBER_YELLOW,
        context.events.haloIgnition * 0.04 +
          context.atmosphere.ionization * 0.04 +
          detonate * 0.03 +
          matrixPulse * 0.03 +
          paletteSolar * 0.06
      )
      .lerp(
        TOXIC_PINK,
        0.02 +
          context.sceneVariation.prismaticProfile * 0.12 +
          context.sceneVariation.solarProfile * 0.06
      )
      .lerp(
        MATRIX_GREEN,
        matrixPulse * 0.06 +
          context.atmosphere.liquid * 0.04 +
          (1 - context.audio.harmonicColor) * 0.03 +
          paletteAcid * 0.18 +
          stageColorLift * 0.12
      )
      .lerp(
        VOID_BACKGROUND,
        THREE.MathUtils.clamp(
          context.events.collapse * 0.16 +
            context.atmosphere.pressure * 0.05 -
            stageColorLift * 0.14 -
            context.atmosphere.crystal * 0.04,
          0,
          1
        )
      );
    this.fog.density =
      0.042 +
      context.tuning.atmosphere * 0.024 +
      context.atmosphere.gas * 0.017 +
      context.atmosphere.liquid * 0.012 +
      context.atmosphere.residue * 0.011 +
      context.director.worldActivity * 0.012 +
      context.familyWeights.plume * 0.01 +
      fieldBloom * 0.008 +
      spatialPresence * 0.008 +
      context.familyWeights.eclipse * 0.008 +
      collapseWell * 0.01 +
      context.events.aftermath * 0.01 +
      context.sceneVariation.spectralProfile * 0.008 +
      context.sceneVariation.prismaticProfile * 0.004 +
      context.events.portalOpen * 0.006 +
      context.audio.preDropTension * 0.01 +
      context.audio.releaseTail * 0.012 +
      context.budgets.ambientGlow * 0.01 -
      context.atmosphere.plasma * 0.01 -
      context.atmosphere.crystal * 0.008 -
      stageColorLift * 0.012 -
      context.sceneVariation.postContrastBoost * 0.01;

    this.worldSphere.scale.setScalar(
      1 +
        context.atmosphere.gas * 0.04 +
        context.atmosphere.liquid * 0.06 +
        context.atmosphere.plasma * 0.03 +
        context.atmosphere.pressure * 0.03
    );
    this.worldSphere.rotation.y =
      context.elapsedSeconds *
        (0.012 +
          context.atmosphere.gas * 0.006 +
          context.atmosphere.liquid * 0.01 +
          context.atmosphere.plasma * 0.008 +
          context.familyWeights.portal * 0.014 +
          fanSweep * 0.022 +
          context.familyWeights.cathedral * 0.008 +
          context.director.worldActivity * 0.012 +
          gather * 0.01 +
          detonate * 0.026 +
          context.sceneVariation.prismaticProfile * 0.018 +
          context.sceneVariation.stormProfile * 0.01) +
      context.audio.barPhase * (0.18 + context.audio.preDropTension * 0.12) +
      chamberDrift.x * 0.18 +
      context.motion.livingField * 0.04 +
      chamberMotion.euler.y * 0.6;
    this.worldSphere.rotation.x =
      Math.sin(context.elapsedSeconds * 0.08 + context.audio.phrasePhase * Math.PI * 2) *
        (0.04 +
          context.atmosphere.gas * 0.03 +
          context.atmosphere.liquid * 0.02 +
          haunt * 0.03 +
          context.sceneVariation.spectralProfile * 0.04 +
          context.sceneVariation.prismaticProfile * 0.02) +
      chamberDrift.y * 0.22 +
      chamberMotion.euler.x * 0.64;
    this.worldSphere.rotation.z =
      Math.sin(context.elapsedSeconds * 0.06 + context.audio.barPhase * Math.PI * 2) *
        (0.03 +
          context.atmosphere.liquid * 0.02 +
          context.atmosphere.plasma * 0.02 +
          context.sceneVariation.prismaticProfile * 0.03 +
          context.sceneVariation.solarProfile * 0.02) +
      chamberMotion.euler.z * 0.54;

    const stainCoolMix = THREE.MathUtils.clamp(
      0.24 +
        context.audio.harmonicColor * 0.66 +
        coolBias * 0.24 -
        warmBias * 0.12,
      0,
      1
    );
    this.worldStainMaterial.color
      .copy(HOT_MAGENTA)
      .lerp(
        LASER_CYAN,
        stainCoolMix * (0.5 + coolBias * 0.12 + paletteVoid * 0.18)
      )
      .lerp(
        TRON_BLUE,
        phrasePulse * 0.12 +
          context.events.worldStain * 0.08 +
          context.actWeights.laser * 0.1 +
          paletteTron * 0.22
      )
      .lerp(
        ACID_LIME,
        (context.audio.shimmer + textureShimmer) * 0.06 +
          barPulse * 0.08 +
          context.actWeights.matrix * 0.1 +
          paletteAcid * 0.18
      )
      .lerp(
        CYBER_YELLOW,
        context.events.haloIgnition * 0.08 +
          context.audio.transientConfidence * 0.04 +
          paletteSolar * 0.06
      )
      .lerp(
        SOLAR_ORANGE,
        context.events.haloIgnition * 0.08 +
          warmBias * 0.06 +
          detonate * 0.02 +
          paletteSolar * 0.12
      )
      .lerp(
        TOXIC_PINK,
        context.sceneVariation.prismaticProfile * 0.14 +
          context.sceneVariation.solarProfile * 0.06
      )
      .lerp(ELECTRIC_WHITE, paletteGhost * 0.16 + cueHaunt * 0.08 + cueRelease * 0.04);
    this.worldStainMaterial.opacity = THREE.MathUtils.clamp(
      (context.budgets.ambientGlow *
        (0.0028 +
          context.director.worldActivity * 0.0014 +
          fieldBloom * 0.0022 +
          cueResidue * 0.003 +
          cueWorld * 0.0016) +
        context.budgets.eventGlow *
          (context.events.worldStain * 0.08 +
            context.atmosphere.liquid * 0.026 +
            context.atmosphere.plasma * 0.032 +
            cueResidue * 0.06 +
            ghostChamber * 0.06 +
            cueWorld * 0.022 +
            context.events.aftermath * 0.03 +
            context.audio.releasePulse * 0.012 +
            memoryAfterglow * 0.032 +
            context.audio.sectionChange * 0.04 +
            context.audio.releaseTail * 0.024 +
            context.audio.dropImpact * 0.04 +
            beatPulse * 0.014 +
            context.director.colorWarp * 0.015 +
            context.sceneVariation.prismaticProfile * 0.028 +
            context.sceneVariation.spectralProfile * 0.03)) *
        context.qualityProfile.auraOpacityMultiplier +
        stageColorLift *
          (0.016 +
            context.atmosphere.gas * 0.008 +
            context.atmosphere.crystal * 0.006 +
            chamberPresenceFloor * 0.012 +
            chamberDominanceFloor * 0.012 +
            shotWorldTakeover * 0.014 +
            shotPressure * 0.008),
      0,
      0.42 + context.sceneVariation.prismaticProfile * 0.04
    );
    this.worldStainMaterial.opacity *= THREE.MathUtils.clamp(
      1 -
        shotPressure * 0.1 -
        Math.max(0, context.metrics.heroCoverageEstimateCurrent - 0.24) * 0.2 -
        Math.max(0, context.metrics.ringBeltPersistenceCurrent - 0.34) * 0.18,
      0.5,
      1
    );
    this.worldStainPlane.rotation.z =
      context.elapsedSeconds * 0.05 +
      context.familyWeights.portal * 0.26 +
      context.events.worldStain * 0.3 +
      detonate * 0.22 +
      context.audio.sectionChange * 0.18 +
      chamberDrift.x * 0.14 +
      chamberMotion.euler.z * 0.42;
    this.worldStainPlane.position.set(
      chamberDrift.x * 0.36 + chamberMotion.position.x * 0.42,
      chamberDrift.y * 0.28 + chamberMotion.position.y * 0.34,
      -8 + chamberDrift.z * 0.42 + chamberMotion.position.z * 0.38
    );
    this.worldStainPlane.scale.set(
      1.2 +
        context.familyWeights.portal * 0.32 +
        context.events.worldStain * 0.6 +
        stageWipe * 0.22 +
        cueScreen * 0.18 +
        cueResidue * 0.28 +
        context.director.spectacle * 0.18 +
        context.director.worldActivity * 0.22 +
        spatialPresence * 0.16 +
        context.sceneVariation.prismaticProfile * 0.26 +
        context.audio.dropImpact * 0.68,
      1.1 +
        context.familyWeights.plume * 0.3 +
        context.events.worldStain * 0.2 +
        apertureCage * 0.18 +
        cueResidue * 0.16 +
        context.events.collapse * 0.16 +
        context.director.worldActivity * 0.18 +
        context.sceneVariation.spectralProfile * 0.18 +
        context.audio.sectionChange * 0.42,
      1
    );

    this.worldFlashMaterial.color
      .copy(ELECTRIC_WHITE)
      .lerp(
        LASER_CYAN,
        0.18 +
          coolBias * 0.16 +
          context.audio.shimmer * 0.08 +
          textureShimmer * 0.06 +
          paletteVoid * 0.18
      )
      .lerp(TRON_BLUE, context.actWeights.laser * 0.14 + paletteTron * 0.2)
      .lerp(
        HOT_MAGENTA,
        0.06 + warmBias * 0.08 + context.actWeights.eclipse * 0.12 + paletteSolar * 0.14
      )
      .lerp(CYBER_YELLOW, context.events.haloIgnition * 0.1 + beatPulse * 0.04)
      .lerp(
        ACID_LIME,
        context.audio.transientConfidence * 0.06 +
          context.actWeights.matrix * 0.14 +
          beatPulse * 0.08 +
          paletteAcid * 0.16
      )
      .lerp(
        TOXIC_PINK,
        context.sceneVariation.prismaticProfile * 0.12 +
          context.sceneVariation.solarProfile * 0.08
      )
      .lerp(ELECTRIC_WHITE, paletteGhost * 0.14 + cueRupture * 0.08 + cueReveal * 0.04);
    this.worldFlashMaterial.opacity =
      context.budgets.eventGlow *
      (context.events.haloIgnition * 0.06 +
        context.atmosphere.ionization * 0.05 +
        context.atmosphere.structureReveal * 0.034 +
        fanSweep * 0.05 +
        cueScreen * 0.06 +
        cueRupture * 0.05 +
        cueReveal * 0.03 +
        stageFlash * 0.09 +
        impactHit * 0.09 +
        context.events.portalOpen * 0.02 +
        context.events.collapse * 0.04 +
        context.audio.strikePulse * 0.022 +
        context.audio.dropImpact * (0.1 + beatPulse * 0.05) +
        context.audio.sectionChange * 0.04 +
        context.sceneVariation.prismaticProfile * 0.036 +
        context.director.colorWarp * 0.018 +
        spectralPulse * 0.012);
    this.worldFlashMaterial.opacity *=
      1 - washoutSuppression * 0.34 - peakSpend * 0.08 - restraint * 0.06;
    this.worldFlashMaterial.opacity *= THREE.MathUtils.clamp(
      1 -
        shotPressure * 0.12 -
        Math.max(0, context.metrics.heroCoverageEstimateCurrent - 0.24) * 0.18 -
        Math.max(0, context.metrics.ringBeltPersistenceCurrent - 0.34) * 0.14,
      0.46,
      1
    );
    this.worldFlashPlane.scale.setScalar(
      1.06 +
        context.atmosphere.gas * 0.06 +
        context.atmosphere.liquid * 0.08 +
        context.atmosphere.plasma * 0.06 +
        context.events.haloIgnition * 0.9 +
        stageWipe * 0.24 +
        cueScreen * 0.34 +
        cueRupture * 0.28 +
        cueWorld * 0.08 +
        context.events.collapse * 0.42 +
        context.idleBreath * 0.04 +
        context.director.worldActivity * 0.08 +
        musicPresence * 0.06 +
        context.audio.dropImpact * 0.84 +
        context.audio.sectionChange * 0.38
    );
    this.worldFlashPlane.position.set(
      -chamberDrift.x * 0.24 - chamberMotion.position.x * 0.28,
      chamberDrift.y * 0.18 + chamberMotion.position.y * 0.22,
      -7.8 + chamberDrift.z * 0.28 + chamberMotion.position.z * 0.24
    );

    this.updateAtmosphereLayers(context, background, stageColorLift);
  }

  collectTelemetryInputs(): WorldSystemTelemetry {
    this.worldSphereMaterial.color.getHSL(this.worldHsl);

    return {
      worldHue: this.worldHsl.h,
      worldSphereLuminance: this.worldHsl.l,
      worldStainOpacity: this.worldStainMaterial.opacity,
      worldFlashOpacity: this.worldFlashMaterial.opacity,
      fogDensity: this.fog.density,
      atmosphereVeilOpacityAverage: averageMaterialOpacity(
        this.atmosphereVeils.map(({ mesh }) => mesh)
      ),
      atmosphereColumnOpacityAverage: averageMaterialOpacity(
        this.atmosphereColumns.map(({ mesh }) => mesh)
      )
    };
  }

  dispose(): void {
    this.worldSphere.removeFromParent();
    this.worldStainPlane.removeFromParent();
    this.worldFlashPlane.removeFromParent();
    this.atmosphereGroup.removeFromParent();

    this.worldSphere.geometry.dispose();
    this.worldSphereMaterial.dispose();
    this.worldStainPlane.geometry.dispose();
    this.worldStainMaterial.dispose();
    this.worldFlashPlane.geometry.dispose();
    this.worldFlashMaterial.dispose();

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

  private updateAtmosphereLayers(
    context: WorldSystemUpdateContext,
    background: THREE.Color,
    stageColorLift: number
  ): void {
    const cueReveal = context.stage.cuePlan.family === 'reveal' ? 1 : 0;
    const cueRupture = context.stage.cuePlan.family === 'rupture' ? 1 : 0;
    const cueRelease = context.stage.cuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = context.stage.cuePlan.family === 'haunt' ? 1 : 0;
    const cueWorld = context.stage.cuePlan.worldWeight;
    const cueScreen = context.stage.cuePlan.screenWeight;
    const cueResidue = context.stage.cuePlan.residueWeight;
    const fieldBloom = context.stage.cuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const cathedralFrame =
      context.stage.cuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const ghostChamber =
      context.stage.cuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const collapseWell =
      context.stage.cuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const shotWorldTakeover =
      context.stage.compositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure =
      context.stage.compositionPlan.shotClass === 'pressure' ? 1 : 0;
    const stateGas = context.atmosphere.activeMatterState === 'gas' ? 1 : 0;
    const stateLiquid = context.atmosphere.activeMatterState === 'liquid' ? 1 : 0;
    const statePlasma = context.atmosphere.activeMatterState === 'plasma' ? 1 : 0;
    const stateCrystal = context.atmosphere.activeMatterState === 'crystal' ? 1 : 0;
    const musicStageFloor = Math.max(
      context.budgets.roomMusicVisualFloor,
      context.budgets.adaptiveMusicVisualFloor
    );
    const chamberDrift = context.motion.chamberDrift;
    const chamberMotion = context.motion.chamberMotion;
    const memoryAfterglow = context.stageAudioFeatures.memory.afterglow;
    const impactHit = context.stageAudioFeatures.impact.hit;
    const spatialPresence = context.stageAudioFeatures.presence.spatial;
    const musicPresence = context.stageAudioFeatures.presence.music;
    const restraint = context.stageAudioFeatures.stability.restraint;
    const phasePulseA = phasePulse(
      context.audio.phrasePhase,
      context.elapsedSeconds * (0.16 + context.atmosphere.gas * 0.04)
    );
    const phasePulseB = phasePulse(
      context.audio.barPhase,
      context.elapsedSeconds * (0.3 + context.atmosphere.plasma * 0.08)
    );

    this.atmosphereGroup.position.set(
      chamberDrift.x * 0.46 + chamberMotion.position.x * 0.22,
      chamberDrift.y * 0.36 + chamberMotion.position.y * 0.12,
      -0.5 +
        chamberDrift.z * 0.44 +
        chamberMotion.position.z * 0.14 -
        context.atmosphere.pressure * 0.18
    );
    this.atmosphereGroup.rotation.y =
      context.elapsedSeconds * (0.01 + context.atmosphere.liquid * 0.014) +
      chamberDrift.x * 0.18;
    this.atmosphereGroup.rotation.x =
      Math.sin(context.elapsedSeconds * (0.05 + context.atmosphere.gas * 0.02)) *
        (0.03 + context.atmosphere.gas * 0.04) +
      chamberDrift.y * 0.14;
    this.atmosphereGroup.rotation.z =
      Math.sin(
        context.elapsedSeconds * (0.04 + context.atmosphere.crystal * 0.02)
      ) *
      (0.02 + context.atmosphere.residue * 0.04);

    const bedColor = this.atmosphereColorScratch
      .copy(background)
      .lerp(
        COOL_BACKGROUND,
        0.24 +
          context.atmosphere.gas * 0.32 +
          stateGas * 0.08 +
          context.atmosphere.liquid * 0.12 +
          stateLiquid * 0.04 +
          cueWorld * 0.08 +
          musicStageFloor * 0.08
      )
      .lerp(
        LASER_CYAN,
        context.atmosphere.gas * 0.08 +
          context.atmosphere.ionization * 0.08 +
          statePlasma * 0.04 +
          context.sceneVariation.spectralProfile * 0.04
      )
      .lerp(
        HOT_MAGENTA,
        context.sceneVariation.prismaticProfile * 0.06 +
          context.sceneVariation.solarProfile * 0.04
      )
      .lerp(
        VOID_BACKGROUND,
        collapseWell * 0.12 + context.atmosphere.pressure * 0.08
      );
    const currentColor = this.atmosphereColorScratchB
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        0.18 + context.atmosphere.liquid * 0.14 + stateLiquid * 0.06
      )
      .lerp(MATRIX_GREEN, context.atmosphere.liquid * 0.1)
      .lerp(TOXIC_PINK, context.sceneVariation.prismaticProfile * 0.08)
      .lerp(ELECTRIC_WHITE, context.atmosphere.residue * 0.08);
    const chargeColor = this.atmosphereColorScratchC
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        0.18 + context.atmosphere.plasma * 0.16 + statePlasma * 0.08
      )
      .lerp(HOT_MAGENTA, context.atmosphere.ionization * 0.12)
      .lerp(ACID_LIME, context.sceneVariation.stormProfile * 0.08)
      .lerp(
        ELECTRIC_WHITE,
        context.atmosphere.crystal * 0.12 + stateCrystal * 0.08 + cueReveal * 0.06
      );

    this.atmosphereVeils.forEach((veil, index) => {
      const layerClock =
        context.elapsedSeconds *
          (0.024 +
            index * 0.008 +
            context.atmosphere.gas * 0.018 +
            context.atmosphere.liquid * 0.02 +
            context.atmosphere.plasma * 0.022) +
        veil.offset * 2.4;
      const wave = Math.sin(layerClock + context.audio.barPhase * Math.PI * 2);
      const tide = Math.cos(
        layerClock * 0.74 + context.audio.phrasePhase * Math.PI * 2
      );
      const material = veil.mesh.material;
      const mistBias = veil.mode === 'mist' ? 1 : 0;
      const currentBias = veil.mode === 'current' ? 1 : 0;
      const chargeBias = veil.mode === 'charge' ? 1 : 0;
      const veilBias = veil.mode === 'veil' ? 1 : 0;

      material.color
        .copy(bedColor)
        .lerp(
          currentColor,
          currentBias * (0.34 + context.atmosphere.liquid * 0.22)
        )
        .lerp(
          chargeColor,
          chargeBias * (0.42 + context.atmosphere.plasma * 0.28)
        )
        .lerp(ELECTRIC_WHITE, veilBias * context.atmosphere.residue * 0.08);
      material.opacity = THREE.MathUtils.clamp(
        context.budgets.ambientGlow *
          (0.018 +
            mistBias *
              (context.atmosphere.gas * 0.1 + context.atmosphere.residue * 0.04) +
            currentBias *
              (context.atmosphere.liquid * 0.08 +
                context.director.worldActivity * 0.04) +
            veilBias * (cueWorld * 0.06 + cueResidue * 0.06)) +
          context.budgets.eventGlow *
            (chargeBias *
              (context.atmosphere.ionization * 0.09 +
                cueScreen * 0.04 +
                impactHit * 0.04) +
              veilBias * (cueReveal * 0.04 + context.audio.sectionChange * 0.03)) +
          stageColorLift *
            (0.022 +
              musicStageFloor * 0.02 +
              context.atmosphere.gas * 0.014 +
              cueWorld * 0.018) +
          context.atmosphere.residue * 0.018 -
          restraint * 0.012,
        0,
        chargeBias > 0 ? 0.18 : 0.14
      );
      veil.mesh.position.set(
        veil.side *
          (0.5 +
            index * 0.26 +
            wave * (0.8 + context.atmosphere.liquid * 0.8) +
            context.atmosphere.pressure * 0.18),
        tide * (0.4 + mistBias * 0.5 + veilBias * 0.32) +
          chamberDrift.y * 0.24 +
          (musicPresence - 0.5) * 0.24,
        veil.depth +
          context.atmosphere.pressure * index * -0.22 +
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
        wave * (0.04 + chargeBias * 0.08) + tide * 0.02 + phasePulseB * 0.04;
      veil.mesh.scale.set(
        1 +
          context.atmosphere.gas * 0.12 +
          context.atmosphere.liquid * 0.08 +
          context.atmosphere.pressure * 0.08 +
          stageColorLift * 0.08 +
          cueReveal * 0.04 +
          context.idleBreath * 0.03,
        1 +
          mistBias * context.atmosphere.gas * 0.16 +
          currentBias * context.atmosphere.liquid * 0.22 +
          context.atmosphere.residue * 0.08 +
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
            context.elapsedSeconds *
              (0.16 +
                context.atmosphere.crystal * 0.12 +
                context.atmosphere.plasma * 0.06) +
              column.offset * 2.2 +
              context.audio.barPhase * Math.PI * 2
          );
      material.color
        .copy(ELECTRIC_WHITE)
        .lerp(LASER_CYAN, 0.18 + context.atmosphere.plasma * 0.18)
        .lerp(TRON_BLUE, context.atmosphere.crystal * 0.16 + cathedralFrame * 0.08)
        .lerp(HOT_MAGENTA, context.sceneVariation.prismaticProfile * 0.08)
        .lerp(GHOST_PALE, context.atmosphere.residue * 0.08 + cueRelease * 0.04);
      material.opacity = THREE.MathUtils.clamp(
        stageColorLift * 0.01 +
          context.atmosphere.structureReveal *
            (0.1 +
              cathedralFrame * 0.18 +
              shotWorldTakeover * 0.16 +
              cueReveal * 0.24) +
          context.budgets.eventGlow *
            (context.atmosphere.crystal * 0.09 +
              context.atmosphere.ionization * 0.05 +
              cueReveal * 0.08 +
              cueRupture * 0.04) +
          context.budgets.ambientGlow *
            (context.atmosphere.residue * 0.018 +
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
            context.atmosphere.pressure * 0.26),
        0.24 +
          Math.sin(context.elapsedSeconds * 0.14 + column.offset * 2.8) *
            (0.28 + spatialPresence * 0.22) +
          cueReveal * 0.26,
        column.depth -
          context.atmosphere.pressure * 0.3 +
          cueReveal * 0.2 +
          cueRelease * 0.08
      );
      column.mesh.rotation.y =
        column.side *
        (0.22 +
          column.offset * 0.08 +
          context.atmosphere.crystal * 0.08 -
          context.atmosphere.gas * 0.04);
      column.mesh.rotation.z =
        column.side * columnPulse * (0.04 + context.atmosphere.ionization * 0.06);
      column.mesh.scale.set(
        1 +
          context.atmosphere.crystal * 0.18 +
          cueReveal * 0.12 +
          shotWorldTakeover * 0.08,
        1 +
          context.atmosphere.pressure * 0.14 +
          context.atmosphere.residue * 0.08 +
          memoryAfterglow * 0.1 +
          fieldBloom * 0.06,
        1
      );
    });
  }
}
