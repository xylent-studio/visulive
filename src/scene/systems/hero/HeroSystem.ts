import * as THREE from 'three';
import type { ListeningFrame, ListeningMode } from '../../../types/audio';
import {
  DEFAULT_STAGE_AUDIO_FEATURES,
  type StageAudioFeatures
} from '../../../audio/stageAudioFeatures';
import type { SceneQualityProfile } from '../../runtime';
import type { SceneVariationProfile } from '../../direction/sceneVariation';
import type { MotionPoseState } from '../motion/MotionSystem';
import {
  DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
  DEFAULT_STAGE_COMPOSITION_PLAN,
  DEFAULT_STAGE_CUE_PLAN,
  type PaletteState,
  type SignatureMomentSnapshot,
  type ShowAct,
  type StageCompositionPlan,
  type StageCuePlan,
  type StageHeroForm
} from '../../../types/visual';
import {
  HERO_COLOR_TRIGGER_OFFSETS,
  copyPaletteCycleColor,
  hashSignature,
  saturateColor,
  selectHeroPaletteCycle,
  type HeroColorToneBand,
  type HeroColorWarmth
} from './heroColorRouting';
import {
  estimateHeroCoverage,
  measureHeroDepthPenalty,
  measureHeroOffCenterPenalty,
  resolveHeroAnchorOffsets,
  type HeroCoverageContext
} from './heroTelemetry';

const HERO_DARK = new THREE.Color('#0a0e12');
const HERO_GOLD = new THREE.Color('#b67c3e');
const HERO_TEAL = new THREE.Color('#1e7a77');
const GHOST_PALE = new THREE.Color('#f1e8d8');
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


const HERO_FORMS: StageHeroForm[] = [
  'orb',
  'cube',
  'pyramid',
  'diamond',
  'prism',
  'shard',
  'mushroom'
];

type WeightedColorStop = {
  color: THREE.Color;
  weight: number;
};

type HeroEventKind =
  | 'portal-open'
  | 'singularity-collapse'
  | 'twin-split'
  | 'halo-ignition'
  | 'ghost-afterimage';

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function easeInOut(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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

export type HeroSystemTelemetryContext = {
  camera: THREE.PerspectiveCamera;
  stageCompositionPlan: StageCompositionPlan;
};


export type HeroSystemPaletteColors = Readonly<{
  primary: THREE.Color;
  accent: THREE.Color;
  pulse: THREE.Color;
}>;

export type HeroSystemUpdateContext = {
  timing: {
    elapsedSeconds: number;
    idleBreath: number;
  };
  quality: {
    profile: SceneQualityProfile;
  };
  stage: {
    activeAct: ShowAct;
    activeFamily: string;
    cuePlan: StageCuePlan;
    compositionPlan: StageCompositionPlan;
    audioFeatures: StageAudioFeatures;
    camera: THREE.PerspectiveCamera;
    budgets: {
      ambientGlow: number;
      eventGlow: number;
    };
  };
  palette: {
    state: PaletteState;
  };
  sceneVariation: SceneVariationProfile;
  weights: {
    act: Record<ShowAct, number>;
    family: {
      liquid: number;
      portal: number;
      cathedral: number;
      ghost: number;
      storm: number;
      eclipse: number;
      plume: number;
    };
  };
  events: {
    portalOpen: number;
    collapse: number;
    twinSplit: number;
    haloIgnition: number;
    ghostAfterimage: number;
  };
  director: {
    energy: number;
    worldActivity: number;
    colorBias: number;
    geometry: number;
    radiance: number;
    colorWarp: number;
    laserDrive: number;
  };
  shell: {
    tension: number;
    bloom: number;
    orbit: number;
    halo: number;
    glowOverdrive: number;
  };
  audio: {
    frame: ListeningFrame;
    listeningMode: ListeningMode;
    roomMusicVisualFloor: number;
    adaptiveMusicVisualFloor: number;
    subPressure: number;
    bassBody: number;
    body: number;
    air: number;
    shimmer: number;
    accent: number;
    brightness: number;
    roughness: number;
    harmonicColor: number;
    phraseTension: number;
    resonance: number;
    musicConfidence: number;
    transientConfidence: number;
    dropImpact: number;
    preDropTension: number;
    sectionChange: number;
    releaseTail: number;
  };
  temporal: {
    beatPhase: number;
    barPhase: number;
    phrasePhase: number;
    beatStrike: number;
    preBeatLift: number;
    interBeatFloat: number;
    phraseResolve: number;
    barTurn: number;
    releasePulse: number;
    liftPulse: number;
  };
  motion: {
    organicHeroDrift: THREE.Vector3;
    organicShellDrift: THREE.Vector3;
    organicGazeDrift: THREE.Vector3;
    pointerCurrent: THREE.Vector2;
    heroMotionState: MotionPoseState;
    livingField: number;
  };
  metrics: {
    heroCoverageEstimateCurrent: number;
    ringBeltPersistenceCurrent: number;
    wirefieldDensityScoreCurrent: number;
  };
  signatureMoment: SignatureMomentSnapshot;
  tuning: {
    readableHeroFloor: number;
  };
};

export type HeroSystemUpdateResult = {
  heroCoverageEstimate: number;
  heroScaleCurrent: number;
  activeHeroForm: StageHeroForm;
  activeHeroAccentForm: StageHeroForm;
};

export type HeroSystemTelemetry = {
  heroHue: number;
  heroScreenX: number;
  heroScreenY: number;
  heroCoverageEstimate: number;
  heroOffCenterPenalty: number;
  heroDepthPenalty: number;
  heroScale: number;
  heroTranslateX: number;
  heroTranslateY: number;
  heroTranslateZ: number;
  heroRotationPitch: number;
  heroRotationYaw: number;
  heroRotationRoll: number;
  heroShellEmissiveIntensity: number;
  heroAuraOpacity: number;
  heroFresnelIntensity: number;
  heroEnergyShellOpacity: number;
  heroSeamOpacity: number;
  ghostHeroOpacity: number;
  heroCoreEmissiveIntensity: number;
  heroEdgesOpacity: number;
  heroMembraneOpacity: number;
  heroCrownOpacity: number;
  twinEmissiveMean: number;
  activeHeroForm: StageHeroForm;
  activeHeroAccentForm: StageHeroForm;
};

export class HeroSystem {
  readonly heroGroup = new THREE.Group();
  readonly heroGeometry = new THREE.IcosahedronGeometry(0.96, 3);
  readonly heroMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#04070b'),
    emissive: LASER_CYAN.clone(),
    emissiveIntensity: 0.1,
    metalness: 0.04,
    roughness: 0.36,
    transmission: 0.22,
    transparent: true,
    opacity: 0.72,
    thickness: 0.84,
    ior: 1.14,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3
  });
  readonly heroMesh = new THREE.Mesh(this.heroGeometry, this.heroMaterial);
  readonly heroAuraMaterial = new THREE.MeshBasicMaterial({
    color: LASER_CYAN.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.BackSide
  });
  readonly heroAuraMesh = new THREE.Mesh(this.heroGeometry, this.heroAuraMaterial);
  readonly heroFresnelUniforms = {
    colorPrimary: { value: LASER_CYAN.clone() },
    colorSecondary: { value: ELECTRIC_WHITE.clone() },
    intensity: { value: 0 },
    power: { value: 2.6 },
    bias: { value: 0.12 }
  };
  readonly heroFresnelMaterial = new THREE.ShaderMaterial({
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
  readonly heroFresnelMesh = new THREE.Mesh(
    this.heroGeometry,
    this.heroFresnelMaterial
  );
  readonly heroEnergyShellMaterial = new THREE.MeshBasicMaterial({
    color: TRON_BLUE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.BackSide
  });
  readonly heroEnergyShellMesh = new THREE.Mesh(
    this.heroGeometry,
    this.heroEnergyShellMaterial
  );
  readonly heroSeamMaterial = new THREE.MeshBasicMaterial({
    color: LASER_CYAN.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    wireframe: true
  });
  readonly heroSeamMesh = new THREE.Mesh(this.heroGeometry, this.heroSeamMaterial);
  readonly ghostHeroMaterial = new THREE.MeshBasicMaterial({
    color: GHOST_PALE.clone(),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    wireframe: true
  });
  readonly ghostHeroMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.04, 2),
    this.ghostHeroMaterial
  );
  readonly coreMaterial = new THREE.MeshPhysicalMaterial({
    color: '#090d12',
    emissive: TRON_BLUE.clone(),
    emissiveIntensity: 0.08,
    metalness: 0.02,
    roughness: 0.18,
    transmission: 0.08,
    transparent: true,
    opacity: 0.74,
    thickness: 0.42,
    ior: 1.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2
  });
  readonly coreMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.46, 2),
    this.coreMaterial
  );
  readonly voidCoreMaterial = new THREE.MeshBasicMaterial({
    color: '#030405',
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });
  readonly voidCoreMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    this.voidCoreMaterial
  );
  readonly membraneMaterial = new THREE.MeshBasicMaterial({
    color: HERO_TEAL.clone(),
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  readonly membraneMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.28, 2),
    this.membraneMaterial
  );
  readonly crownMaterial = new THREE.MeshBasicMaterial({
    color: HERO_GOLD.clone(),
    transparent: true,
    opacity: 0.05,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false
  });
  readonly crownMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.56, 0.03, 24, 160),
    this.crownMaterial
  );
  readonly heroEdgesMaterial = new THREE.LineBasicMaterial({
    color: GHOST_PALE.clone(),
    transparent: true,
    opacity: 0.03,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false
  });
  readonly heroEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.94, 2)),
    this.heroEdgesMaterial
  );
  readonly twinMeshes: Array<
    THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshPhysicalMaterial>
  > = [];
  readonly twinLights: THREE.PointLight[] = [];
  readonly heroGlowLight = new THREE.PointLight('#35f4ff', 0, 8, 2);
  readonly heroAccentLight = new THREE.PointLight('#ff3bc9', 0, 6, 2);
  readonly formBasePositions = this.heroGeometry.attributes.position.array.slice() as Float32Array;
  readonly formDirections = new Float32Array(
    this.heroGeometry.attributes.position.array.length
  );
  readonly formSeeds = new Float32Array(this.heroGeometry.attributes.position.count);

  activeHeroForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroForm;
  previousHeroForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroForm;
  activeHeroAccentForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroAccentForm;
  heroFormTransition = 1;
  heroScaleCurrent = 0.56;


  private readonly heroPrimaryColor = new THREE.Color();
  private readonly heroAccentColor = new THREE.Color();
  private readonly heroPulseColor = new THREE.Color();
  private readonly heroShadowTint = new THREE.Color();
  private readonly motionBaseQuaternion = new THREE.Quaternion();
  private readonly motionCompositeQuaternion = new THREE.Quaternion();
  private readonly motionEulerScratch = new THREE.Euler();
  private readonly organicHeroDrift = new THREE.Vector3();
  private readonly organicShellDrift = new THREE.Vector3();
  private readonly organicGazeDrift = new THREE.Vector3();
  private readonly pointerCurrent = new THREE.Vector2();
  private readonly heroPaletteColors: HeroSystemPaletteColors = {
    primary: this.heroPrimaryColor,
    accent: this.heroAccentColor,
    pulse: this.heroPulseColor
  };

  private qualityProfile!: SceneQualityProfile;
  private currentCamera!: THREE.PerspectiveCamera;
  private ambientGlowBudget = 0;
  private eventGlowBudget = 0;
  private currentListeningMode: ListeningMode = 'room-mic';
  private roomMusicVisualFloor = 0;
  private adaptiveMusicVisualFloor = 0;
  private subPressure = 0;
  private bassBody = 0;
  private body = 0;
  private air = 0;
  private shimmer = 0;
  private accent = 0;
  private brightness = 0;
  private roughness = 0;
  private harmonicColor = 0.5;
  private phraseTension = 0;
  private resonance = 0;
  private musicConfidence = 0;
  private transientConfidence = 0;
  private dropImpact = 0;
  private preDropTension = 0;
  private sectionChange = 0;
  private releaseTail = 0;
  private activeAct: ShowAct = 'void-chamber';
  private activeFamily = 'eclipse-chamber';
  private paletteState: PaletteState = 'void-cyan';
  private readonly actWeights: Record<ShowAct, number> = {
    'void-chamber': 1,
    'laser-bloom': 0,
    'matrix-storm': 0,
    'eclipse-rupture': 0,
    'ghost-afterimage': 0
  };
  private readonly familyWeights = {
    liquid: 0,
    portal: 0,
    cathedral: 0,
    ghost: 0,
    storm: 0,
    eclipse: 1,
    plume: 0
  };
  private directorEnergy = 0;
  private directorWorldActivity = 0;
  private directorColorBias = 0.5;
  private directorGeometry = 0;
  private directorRadiance = 0;
  private directorColorWarp = 0;
  private directorLaserDrive = 0;
  private shellTension = 0;
  private shellBloom = 0;
  private shellOrbit = 0;
  private shellHalo = 0;
  private glowOverdrive = 0;
  private beatPhase = 0;
  private barPhase = 0;
  private phrasePhase = 0;
  private beatStrike = 0;
  private preBeatLift = 0;
  private interBeatFloat = 0;
  private phraseResolve = 0;
  private barTurn = 0;
  private releasePulse = 0;
  private liftPulse = 0;
  private heroCoverageEstimateCurrent = 0.12;
  private ringBeltPersistenceCurrent = 0.08;
  private wirefieldDensityScoreCurrent = 0.16;
  private signatureMoment: SignatureMomentSnapshot = {
    ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT
  };
  private stageCuePlan: StageCuePlan = { ...DEFAULT_STAGE_CUE_PLAN };
  private stageCompositionPlan: StageCompositionPlan = {
    ...DEFAULT_STAGE_COMPOSITION_PLAN,
    heroEnvelope: { ...DEFAULT_STAGE_COMPOSITION_PLAN.heroEnvelope },
    chamberEnvelope: { ...DEFAULT_STAGE_COMPOSITION_PLAN.chamberEnvelope },
    subtractivePolicy: { ...DEFAULT_STAGE_COMPOSITION_PLAN.subtractivePolicy }
  };
  private stageAudioFeatures: StageAudioFeatures = {
    ...DEFAULT_STAGE_AUDIO_FEATURES
  };
  private sceneVariation: SceneVariationProfile = {
    voidProfile: 0,
    spectralProfile: 0,
    stormProfile: 0,
    solarProfile: 0,
    eclipseProfile: 0,
    prismaticProfile: 0,
    noveltyDrive: 0,
    ringSuppression: 0,
    portalSuppression: 0,
    latticeBoost: 0,
    beamBoost: 0,
    haloBoost: 0,
    bladeBoost: 0,
    sweepBoost: 0,
    heroRoamBoost: 0,
    cameraSpreadBoost: 0,
    postContrastBoost: 0
  };
  private readonly tuning = {
    readableHeroFloor: 0
  };
  private livingField = 0;
  private heroMotionState!: MotionPoseState;
  private readonly eventAmounts: Record<HeroEventKind, number> = {
    'portal-open': 0,
    'singularity-collapse': 0,
    'twin-split': 0,
    'halo-ignition': 0,
    'ghost-afterimage': 0
  };
  private heroPrimaryColorCycle = 0;
  private heroAccentColorCycle = 1;
  private heroPulseColorCycle = 2;
  private lastHeroColorChangeSeconds = -999;
  private lastHeroColorTriggerSignature = '';
  private lastHeroColorRouteSignature = '';
  private lastHeroColorToneSignature = '';
  private lastHeroFormChangeSeconds = 0;

  private readonly heroTelemetryColor = new THREE.Color();
  private readonly heroTelemetryScratch = new THREE.Color();
  private readonly heroTelemetryVector = new THREE.Vector3();
  private readonly heroTelemetryOffsetX = new THREE.Vector3();
  private readonly heroTelemetryOffsetY = new THREE.Vector3();
  private readonly heroTelemetryEuler = new THREE.Euler();
  private readonly heroTelemetryHsl = { h: 0, s: 0, l: 0 };

  build(): void {
    this.seedHeroGeometry();
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

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.membraneMaterial.opacity = 0.04 * profile.auraOpacityMultiplier;
    this.crownMaterial.opacity = 0.05 * profile.auraOpacityMultiplier;
    this.heroAuraMaterial.opacity = 0;
    this.heroFresnelUniforms.intensity.value = 0;
    this.heroEnergyShellMaterial.opacity = 0;
    this.heroSeamMaterial.opacity = 0;
    this.ghostHeroMaterial.opacity = 0;
    this.twinMeshes.forEach((mesh, index) => {
      mesh.visible = false;
      mesh.material.opacity = 0;
      if (this.twinLights[index]) {
        this.twinLights[index]!.intensity = 0;
      }
    });
  }

  estimateCoverage(camera: THREE.PerspectiveCamera): number {
    return estimateHeroCoverage({
      camera,
      heroGroup: this.heroGroup,
      heroGeometry: this.heroGeometry,
      heroScaleCurrent: this.heroScaleCurrent,
      heroTelemetryVector: this.heroTelemetryVector,
      heroTelemetryOffsetX: this.heroTelemetryOffsetX,
      heroTelemetryOffsetY: this.heroTelemetryOffsetY
    });
  }

  collectTelemetryInputs(
    context: HeroSystemTelemetryContext
  ): HeroSystemTelemetry {
    this.heroTelemetryColor
      .copy(this.heroMaterial.color)
      .multiplyScalar(0.7)
      .add(
        this.heroTelemetryScratch
          .copy(this.heroMaterial.emissive)
          .multiplyScalar(0.42 + this.heroMaterial.emissiveIntensity * 0.22)
      );
    this.heroTelemetryColor.getHSL(this.heroTelemetryHsl);
    this.heroTelemetryVector.copy(this.heroGroup.position).project(context.camera);
    const heroScreenX = THREE.MathUtils.clamp(
      this.heroTelemetryVector.x * 0.5 + 0.5,
      0,
      1
    );
    const heroScreenY = THREE.MathUtils.clamp(
      -this.heroTelemetryVector.y * 0.5 + 0.5,
      0,
      1
    );
    const heroCoverageEstimate = this.estimateCoverage(context.camera);
    const { laneTargetX, laneTargetY, offCenterMax, depthMax } =
      context.stageCompositionPlan.heroEnvelope;
    const heroOffCenterPenalty = measureHeroOffCenterPenalty({
      heroScreenX,
      heroScreenY,
      laneTargetX,
      laneTargetY,
      offCenterMax
    });
    const heroDepthPenalty = measureHeroDepthPenalty({
      heroDepth: this.heroGroup.position.z,
      depthMax
    });
    const heroEuler = this.heroTelemetryEuler.setFromQuaternion(
      this.heroGroup.quaternion
    );
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

    return {
      heroHue: this.heroTelemetryHsl.h,
      heroScreenX,
      heroScreenY,
      heroCoverageEstimate,
      heroOffCenterPenalty,
      heroDepthPenalty,
      heroScale: this.heroScaleCurrent,
      heroTranslateX: this.heroGroup.position.x,
      heroTranslateY: this.heroGroup.position.y,
      heroTranslateZ: this.heroGroup.position.z,
      heroRotationPitch: heroEuler.x,
      heroRotationYaw: heroEuler.y,
      heroRotationRoll: heroEuler.z,
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
      activeHeroForm: this.activeHeroForm,
      activeHeroAccentForm: this.activeHeroAccentForm
    };
  }


  getPaletteColors(): HeroSystemPaletteColors {
    return this.heroPaletteColors;
  }

  update(context: HeroSystemUpdateContext): HeroSystemUpdateResult {
    this.qualityProfile = context.quality.profile;
    this.currentCamera = context.stage.camera;
    this.ambientGlowBudget = context.stage.budgets.ambientGlow;
    this.eventGlowBudget = context.stage.budgets.eventGlow;
    this.currentListeningMode = context.audio.listeningMode;
    this.roomMusicVisualFloor = context.audio.roomMusicVisualFloor;
    this.adaptiveMusicVisualFloor = context.audio.adaptiveMusicVisualFloor;
    this.subPressure = context.audio.subPressure;
    this.bassBody = context.audio.bassBody;
    this.body = context.audio.body;
    this.air = context.audio.air;
    this.shimmer = context.audio.shimmer;
    this.accent = context.audio.accent;
    this.brightness = context.audio.brightness;
    this.roughness = context.audio.roughness;
    this.harmonicColor = context.audio.harmonicColor;
    this.phraseTension = context.audio.phraseTension;
    this.resonance = context.audio.resonance;
    this.musicConfidence = context.audio.musicConfidence;
    this.transientConfidence = context.audio.transientConfidence;
    this.dropImpact = context.audio.dropImpact;
    this.preDropTension = context.audio.preDropTension;
    this.sectionChange = context.audio.sectionChange;
    this.releaseTail = context.audio.releaseTail;
    this.activeAct = context.stage.activeAct;
    this.activeFamily = context.stage.activeFamily;
    this.paletteState = context.palette.state;
    Object.assign(this.actWeights, context.weights.act);
    Object.assign(this.familyWeights, context.weights.family);
    this.eventAmounts['portal-open'] = context.events.portalOpen;
    this.eventAmounts['singularity-collapse'] = context.events.collapse;
    this.eventAmounts['twin-split'] = context.events.twinSplit;
    this.eventAmounts['halo-ignition'] = context.events.haloIgnition;
    this.eventAmounts['ghost-afterimage'] = context.events.ghostAfterimage;
    this.directorEnergy = context.director.energy;
    this.directorWorldActivity = context.director.worldActivity;
    this.directorColorBias = context.director.colorBias;
    this.directorGeometry = context.director.geometry;
    this.directorRadiance = context.director.radiance;
    this.directorColorWarp = context.director.colorWarp;
    this.directorLaserDrive = context.director.laserDrive;
    this.shellTension = context.shell.tension;
    this.shellBloom = context.shell.bloom;
    this.shellOrbit = context.shell.orbit;
    this.shellHalo = context.shell.halo;
    this.glowOverdrive = context.shell.glowOverdrive;
    this.beatPhase = context.temporal.beatPhase;
    this.barPhase = context.temporal.barPhase;
    this.phrasePhase = context.temporal.phrasePhase;
    this.beatStrike = context.temporal.beatStrike;
    this.preBeatLift = context.temporal.preBeatLift;
    this.interBeatFloat = context.temporal.interBeatFloat;
    this.phraseResolve = context.temporal.phraseResolve;
    this.barTurn = context.temporal.barTurn;
    this.releasePulse = context.temporal.releasePulse;
    this.liftPulse = context.temporal.liftPulse;
    this.heroCoverageEstimateCurrent = context.metrics.heroCoverageEstimateCurrent;
    this.ringBeltPersistenceCurrent = context.metrics.ringBeltPersistenceCurrent;
    this.wirefieldDensityScoreCurrent = context.metrics.wirefieldDensityScoreCurrent;
    this.signatureMoment = context.signatureMoment;
    this.stageCuePlan = context.stage.cuePlan;
    this.stageCompositionPlan = context.stage.compositionPlan;
    this.stageAudioFeatures = context.stage.audioFeatures;
    this.sceneVariation = context.sceneVariation;
    this.tuning.readableHeroFloor = context.tuning.readableHeroFloor;
    this.organicHeroDrift.copy(context.motion.organicHeroDrift);
    this.organicShellDrift.copy(context.motion.organicShellDrift);
    this.organicGazeDrift.copy(context.motion.organicGazeDrift);
    this.pointerCurrent.copy(context.motion.pointerCurrent);
    this.livingField = context.motion.livingField;
    this.heroMotionState = context.motion.heroMotionState;

    this.updateHeroColorHandoff(
      context.audio.frame,
      context.timing.elapsedSeconds,
      this.stageCuePlan
    );
    this.updateHero(context.timing.elapsedSeconds, context.timing.idleBreath);

    return {
      heroCoverageEstimate: this.heroCoverageEstimateCurrent,
      heroScaleCurrent: this.heroScaleCurrent,
      activeHeroForm: this.activeHeroForm,
      activeHeroAccentForm: this.activeHeroAccentForm
    };
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
    return selectHeroPaletteCycle(
      palette,
      toneBand,
      warmth,
      role,
      triggerKind,
      seed
    );
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

  private updateHero(elapsedSeconds: number, idleBreath: number): void {
    const sceneVariation = this.resolveSceneVariationProfile();
    const voidAct = this.actWeights['void-chamber'];
    const laserAct = this.actWeights['laser-bloom'];
    const matrixAct = this.actWeights['matrix-storm'];
    const eclipseAct = this.actWeights['eclipse-rupture'];
    const ghostAct = this.actWeights['ghost-afterimage'];
    const liquid = this.familyWeights.liquid;
    const portal = this.familyWeights.portal;
    const cathedral = this.familyWeights.cathedral;
    const ghost = this.familyWeights.ghost;
    const storm = this.familyWeights.storm;
    const eclipse = this.familyWeights.eclipse;
    const plume = this.familyWeights.plume;
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
    const signatureHeroSuppression = this.signatureMoment.heroSuppression;
    const signatureWorldLead = this.signatureMoment.worldLead;
    const signatureMemoryStrength = this.signatureMoment.memoryStrength;
    const signatureCollapse =
      this.signatureMoment.kind === 'collapse-scar' ? this.signatureMoment.postConsequence : 0;
    const signatureCathedral =
      this.signatureMoment.kind === 'cathedral-open'
        ? this.signatureMoment.chamberArchitecture
        : 0;
    const signatureSilence =
      this.signatureMoment.kind === 'silence-constellation'
        ? this.signatureMoment.intensity
        : 0;
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
      Math.min(heroScaleMax, heroEnvelope.scaleCeiling) *
        (1 -
          signatureHeroSuppression * 0.18 -
          signatureWorldLead * 0.08 +
          signatureCollapse * 0.06 -
          signatureCathedral * 0.04 +
          signatureSilence * 0.04)
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
        fallbackForceWorldTakeover * 0.06 -
        signatureHeroSuppression * 0.16 -
        signatureWorldLead * 0.08 +
        signatureMemoryStrength * 0.04,
      0.38,
      1
    );
    const heroWirefieldClamp = THREE.MathUtils.clamp(
      1 -
        largeHeroFraction * 0.46 -
        shotPressure * 0.22 -
        shotWorldTakeover * 0.18 -
        signatureWorldLead * 0.18 -
        signatureHeroSuppression * 0.12 -
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
        signatureHeroSuppression * 0.14 -
        signatureWorldLead * 0.12 -
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

  private eventAmount(kind: HeroEventKind): number {
    return this.eventAmounts[kind];
  }

  private resolveSceneVariationProfile(): SceneVariationProfile {
    return this.sceneVariation;
  }

  private estimateHeroCoverage(): number {
    return this.estimateCoverage(this.currentCamera);
  }

  private resolveHeroAnchorOffsets(
    lane: StageCuePlan['heroAnchorLane'],
    strength: number
  ): { x: number; y: number } {
    return resolveHeroAnchorOffsets(lane, strength);
  }


  dispose(): void {
    this.heroGroup.removeFromParent();
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
    this.twinMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
  }

  private seedHeroGeometry(): void {
    const positions = this.heroGeometry.attributes.position.array as Float32Array;
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
}

export {
  HERO_COLOR_TRIGGER_OFFSETS,
  copyPaletteCycleColor,
  hashSignature,
  saturateColor,
  selectHeroPaletteCycle
};
export type { HeroColorToneBand, HeroColorWarmth, HeroCoverageContext };
export {
  estimateHeroCoverage,
  measureHeroDepthPenalty,
  measureHeroOffCenterPenalty,
  resolveHeroAnchorOffsets
};
