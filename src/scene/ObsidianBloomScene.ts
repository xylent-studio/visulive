import * as THREE from 'three';
import {
  DEFAULT_LISTENING_FRAME,
  type ListeningFrame,
  type ListeningMode,
  type PerformanceIntent,
  type ShowState
} from '../types/audio';
import {
  DEFAULT_STAGE_AUDIO_FEATURES,
  deriveStageAudioFeatures,
  type StageAudioFeatures
} from '../audio/stageAudioFeatures';
import type {
  ScenePostTelemetry,
  SceneQualityProfile
} from './runtime';
import { DEFAULT_RUNTIME_TUNING, type RuntimeTuning } from '../types/tuning';
import { ChamberRig } from './rigs/ChamberRig';
import { DirectorStateRig } from './rigs/DirectorStateRig';
import { EventRig } from './rigs/EventRig';
import { FramingRig } from './rigs/FramingRig';
import {
  deriveCanonicalCueClass,
  deriveHeroAuthorityState,
  derivePerformanceRegime,
  derivePhraseConfidence,
  derivePostSpendIntent,
  deriveSectionIntent,
  deriveSilenceState,
  deriveStageIntent,
  deriveWorldAuthorityState
} from './direction/cueGrammar';
import {
  resolveSceneVariationProfile as resolveSceneVariationProfileFromDirection,
  type SceneVariationProfile
} from './direction/sceneVariation';
import {
  buildShowActScores,
  buildPaletteStateScores,
  chooseShowAct,
  choosePaletteState,
  derivePaletteTransitionReason,
  deriveStageCuePlan,
  deriveVisualCue,
  deriveVisualMotifKind,
  deriveVisualMotifSnapshot,
  deriveTemporalWindows
} from './direction/showDirection';
import {
  AccentOrbitSystem,
  type AccentOrbitUpdateContext
} from './systems/events/AccentOrbitSystem';
import {
  HeroSystem,
  type HeroSystemTelemetry,
  type HeroSystemUpdateContext
} from './systems/hero/HeroSystem';
import {
  ChamberSystem,
  type ChamberSystemTelemetry,
  type ChamberSystemUpdateContext
} from './systems/chamber/ChamberSystem';
import {
  LightingSystem,
  type LightingSystemIntensities,
  type LightingSystemUpdateContext
} from './systems/world/LightingSystem';
import {
  MotionSystem,
  type MotionCameraContext,
  type MotionLocomotionContext,
  type MotionOrganicContext,
  type MotionSceneVariation
} from './systems/motion/MotionSystem';
import {
  ParticleSystem,
  type ParticleSystemUpdateContext
} from './systems/world/ParticleSystem';
import {
  updateWorldAtmosphereState,
  type WorldAtmosphereState
} from './systems/world/WorldAtmosphereSystem';
import {
  WorldSystem,
  type WorldSystemTelemetry,
  type WorldSystemUpdateContext
} from './systems/world/WorldSystem';
import { PressureWaveSystem } from './systems/events/PressureWaveSystem';
import {
  StageFrameSystem,
  type StageFrameUpdateContext
} from './systems/stage/StageFrameSystem';
import {
  PostSystem,
  type PostSystemTelemetry,
  type PostSystemUpdateContext
} from './systems/post/PostSystem';
import {
  CompositorSystem,
  type CompositorSystemTelemetry,
  type CompositorSystemUpdateContext
} from './systems/compositor/CompositorSystem';
import {
  PlayableMotifSystem,
  type PlayableMotifSystemTelemetry,
  type PlayableMotifSystemUpdateContext
} from './systems/motif/PlayableMotifSystem';
import {
  MacroEventDirector,
  type MacroEventKind
} from './governors/MacroEventDirector';
import {
  AuthorityGovernor,
  type AuthorityGovernorFrameContext
} from './governors/AuthorityGovernor';
import {
  SignatureMomentGovernor,
  type SignatureMomentGovernorInput
} from './governors/SignatureMomentGovernor';
import {
  type StageRuntimeFallbackState,
  type StageRuntimeUpdateInput
} from './rigs/StageRuntimeRig';
import { TelemetryRig } from './governors/TelemetryRig';
import type { StageIdleContext } from './rigs/types';
import {
  DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
  DEFAULT_PALETTE_FRAME,
  DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
  DEFAULT_STAGE_COMPOSITION_PLAN,
  DEFAULT_STAGE_CUE_PLAN,
  DEFAULT_VISUAL_CUE_STATE,
  DEFAULT_VISUAL_MOTIF_SNAPSHOT,
  DEFAULT_VISUAL_TELEMETRY,
  type AuthorityFrameSnapshot,
  type AtmosphereMatterState,
  type SignatureMomentDevOverride,
  type CueClass,
  type PaletteFrame,
  type PaletteState,
  type PaletteTransitionReason,
  type PerformanceRegime,
  type PhraseConfidence,
  type PostSpendIntent,
  type SectionIntent,
  type ShowAct,
  type SilenceState,
  type SignatureMomentSnapshot,
  type StageCompositionPlan,
  type StageCuePlan,
  type StageHeroForm,
  type StageIntent,
  type VisualCueState,
  type VisualMotifSnapshot,
  type VisualTelemetryFrame,
  type WorldAuthorityState,
  type HeroAuthorityState
} from '../types/visual';

export type PreparedFlagshipFrameState = Omit<
  StageRuntimeUpdateInput,
  'frame' | 'elapsedSeconds' | 'deltaSeconds'
>;
type ShowFamily = 'liquid-pressure-core' | 'portal-iris' | 'cathedral-rings' | 'ghost-lattice' | 'storm-crown' | 'eclipse-chamber' | 'spectral-plume';
type ShowStateProfile = {
  supportStrength: number;
  dwellBase: number;
  dwellVariance: number;
  transitionRate: number;
};
type CollectedFrameTelemetry = {
  heroTelemetry: HeroSystemTelemetry;
  chamberTelemetry: ChamberSystemTelemetry;
  worldTelemetry: WorldSystemTelemetry;
  stageBladeAverage: number;
  stageSweepAverage: number;
  lightingIntensities: LightingSystemIntensities;
  particleOpacity: number;
  postTelemetry: PostSystemTelemetry;
  playableMotifTelemetry: PlayableMotifSystemTelemetry;
  compositorTelemetry: CompositorSystemTelemetry;
  satelliteActivity: number;
  pressureWaveAverage: number;
};

const SHOW_ACTS: ShowAct[] = [
  'void-chamber',
  'laser-bloom',
  'matrix-storm',
  'eclipse-rupture',
  'ghost-afterimage'
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

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

export class ObsidianBloomScene {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;

  private readonly root = new THREE.Group();
  private readonly chamberGroup = new THREE.Group();
  private readonly accentGroup = new THREE.Group();
  private readonly heroSystem = new HeroSystem();
  private readonly chamberSystem: ChamberSystem;
  private readonly stageFrameSystem = new StageFrameSystem();
  private readonly accentOrbitSystem = new AccentOrbitSystem({
    accentGroup: this.accentGroup
  });
  private readonly pointerTarget = new THREE.Vector2();
  private readonly pointerCurrent = new THREE.Vector2();
  private readonly particleSystem = new ParticleSystem();
  private readonly lightingSystem = new LightingSystem();
  private readonly worldSystem: WorldSystem;
  private readonly motionSystem = new MotionSystem();
  private readonly chamberTelemetryEuler = new THREE.Euler();
  private readonly cameraTelemetryEuler = new THREE.Euler();

  private qualityProfile: SceneQualityProfile;
  private tuning = DEFAULT_RUNTIME_TUNING;
  private lastListeningFrame: ListeningFrame = DEFAULT_LISTENING_FRAME;
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
  private readonly directorStateRig = new DirectorStateRig();
  private readonly macroEventDirector = new MacroEventDirector();
  private shellTension = 0.18;
  private shellBloom = 0.18;
  private shellOrbit = 0.22;
  private shellHalo = 0.24;
  private glowOverdrive = 0.2;
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
  private authorityFrameSnapshot: AuthorityFrameSnapshot = {
    ...DEFAULT_AUTHORITY_FRAME_SNAPSHOT
  };
  private paletteState: PaletteState = 'void-cyan';
  private lastPaletteChangeSeconds = 0;
  private paletteTransitionReason: PaletteTransitionReason = 'hold';
  private paletteFrame: PaletteFrame = { ...DEFAULT_PALETTE_FRAME };
  private semanticEpisodeId = DEFAULT_VISUAL_MOTIF_SNAPSHOT.semanticEpisodeId;
  private lastSemanticEpisodeChangeSeconds = 0;
  private visualMotifSnapshot: VisualMotifSnapshot = {
    ...DEFAULT_VISUAL_MOTIF_SNAPSHOT,
    paletteFrame: { ...DEFAULT_PALETTE_FRAME }
  };
  private heroFormSwitchCount = 0;
  private lastActiveHeroForm: StageHeroForm = DEFAULT_STAGE_CUE_PLAN.heroForm;
  private lastPreparedElapsedSeconds = 0;
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
  private heroScreenX = 0.5;
  private heroScreenY = 0.5;
  private heroCoverageEstimateCurrent = 0.12;
  private heroScaleCurrentMetric = 0.56;
  private heroOffCenterPenaltyCurrent = 0;
  private heroDepthPenaltyCurrent = 0;
  private stageFallbackHeroOverreachCurrent = false;
  private stageFallbackRingOverdrawCurrent = false;
  private stageFallbackOverbrightRiskCurrent = false;
  private stageFallbackWashoutRiskCurrent = false;
  private stageAudioFeatures: StageAudioFeatures = {
    ...DEFAULT_STAGE_AUDIO_FEATURES
  };
  private visualTelemetry: VisualTelemetryFrame = { ...DEFAULT_VISUAL_TELEMETRY };
  private readonly chamberRig: ChamberRig;
  private readonly eventRig: EventRig;
  private readonly framingRig: FramingRig;
  private readonly pressureWaveSystem: PressureWaveSystem;
  private readonly telemetryRig = new TelemetryRig();
  private readonly authorityGovernor = new AuthorityGovernor();
  private readonly signatureMomentGovernor = new SignatureMomentGovernor();
  private readonly postSystem = new PostSystem();
  private readonly playableMotifSystem = new PlayableMotifSystem();
  private readonly compositorSystem = new CompositorSystem();
  private lastAuthorityFrameContext: AuthorityGovernorFrameContext | null = null;
  private signatureMomentSnapshot: SignatureMomentSnapshot = {
    ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT
  };
  private signatureMomentDevOverride: SignatureMomentDevOverride | null = null;

  private get directorEnergy(): number { return this.directorStateRig.energy; }
  private set directorEnergy(value: number) { this.directorStateRig.energy = value; }
  private get directorWorldActivity(): number { return this.directorStateRig.worldActivity; }
  private set directorWorldActivity(value: number) { this.directorStateRig.worldActivity = value; }
  private get directorSpectacle(): number { return this.directorStateRig.spectacle; }
  private set directorSpectacle(value: number) { this.directorStateRig.spectacle = value; }
  private get directorRadiance(): number { return this.directorStateRig.radiance; }
  private set directorRadiance(value: number) { this.directorStateRig.radiance = value; }
  private get directorGeometry(): number { return this.directorStateRig.geometry; }
  private set directorGeometry(value: number) { this.directorStateRig.geometry = value; }
  private get directorAtmosphere(): number { return this.directorStateRig.atmosphere; }
  private set directorAtmosphere(value: number) { this.directorStateRig.atmosphere = value; }
  private get directorFraming(): number { return this.directorStateRig.framing; }
  private set directorFraming(value: number) { this.directorStateRig.framing = value; }
  private get directorColorBias(): number { return this.directorStateRig.colorBias; }
  private set directorColorBias(value: number) { this.directorStateRig.colorBias = value; }
  private get directorColorWarp(): number { return this.directorStateRig.colorWarp; }
  private set directorColorWarp(value: number) { this.directorStateRig.colorWarp = value; }
  private get directorLaserDrive(): number { return this.directorStateRig.laserDrive; }
  private set directorLaserDrive(value: number) { this.directorStateRig.laserDrive = value; }
  private get liftPulse(): number { return this.macroEventDirector.getLiftPulse(); }
  private get strikePulse(): number { return this.macroEventDirector.getStrikePulse(); }
  private get releasePulse(): number { return this.macroEventDirector.getReleasePulse(); }
  private get heroGroup(): THREE.Group { return this.heroSystem.heroGroup; }
  private get organicChamberDrift(): THREE.Vector3 {
    return this.motionSystem.getOrganicChamberDrift();
  }
  private get organicHeroDrift(): THREE.Vector3 {
    return this.motionSystem.getOrganicHeroDrift();
  }
  private get organicShellDrift(): THREE.Vector3 {
    return this.motionSystem.getOrganicShellDrift();
  }
  private get organicCameraDrift(): THREE.Vector3 {
    return this.motionSystem.getOrganicCameraDrift();
  }
  private get organicGazeDrift(): THREE.Vector3 {
    return this.motionSystem.getOrganicGazeDrift();
  }
  private get livingField(): number {
    return this.motionSystem.getLivingField();
  }

  constructor(profile: SceneQualityProfile) {
    this.qualityProfile = profile;
    this.visualTelemetry.qualityTier = profile.tier;
    this.scene = new THREE.Scene();
    this.scene.background = BASE_BACKGROUND.clone();
    this.camera = new THREE.PerspectiveCamera(54, 1, 0.1, 48);
    this.camera.position.set(0, 0.02, 10.4);
    this.chamberSystem = new ChamberSystem({
      chamberGroup: this.chamberGroup
    });
    this.worldSystem = new WorldSystem({
      scene: this.scene,
      root: this.root
    });
    this.motionSystem.initializeCamera(this.camera);
    this.stageFrameSystem.group.position.z = -6.4;
    this.camera.add(this.stageFrameSystem.group);
    this.camera.add(this.postSystem.group);
    this.camera.add(this.playableMotifSystem.group);
    this.camera.add(this.compositorSystem.group);
    this.chamberRig = new ChamberRig({
      system: this.chamberSystem,
      updateLights: (context) => {
        this.lightingSystem.update(
          this.createLightingUpdateContext(context.elapsedSeconds)
        );
      }
    });
    this.pressureWaveSystem = new PressureWaveSystem({
      accentGroup: this.accentGroup
    });
    this.eventRig = new EventRig({
      build: () => {
        this.accentOrbitSystem.build();
        this.pressureWaveSystem.build();
      },
      updateRouting: (context) => {
        this.macroEventDirector.update({
          frame: context.frame,
          elapsedSeconds: context.elapsedSeconds,
          deltaSeconds: context.deltaSeconds,
          cueState: this.cueState,
          tuning: this.tuning,
          directorEnergy: this.directorEnergy,
          directorSpectacle: this.directorSpectacle,
          performanceIntent: this.performanceIntent,
          beatJustHit: this.beatJustHit,
          dropImpact: this.dropImpact,
          barPhase: this.barPhase,
          activeAct: this.activeAct,
          activeFamily: this.activeFamily,
          paletteState: this.paletteFrame.roles.accentTransient,
          triggerPressureWave: (input) => {
            this.pressureWaveSystem.trigger(input);
          }
        });
      },
      updateAccents: (context) => {
        this.accentOrbitSystem.update(
          this.createAccentOrbitUpdateContext(context.elapsedSeconds)
        );
        this.pressureWaveSystem.update({
          elapsedSeconds: context.elapsedSeconds,
          deltaSeconds: context.deltaSeconds,
          ambientGlow: this.ambientGlowBudget,
          eventGlow: this.eventGlowBudget,
          beatPhase: this.beatPhase,
          dropImpact: this.dropImpact,
          ghostWeight: this.familyWeights['ghost-lattice'],
          ghostActWeight: this.actWeights['ghost-afterimage'],
          qualityTier: this.qualityProfile.tier,
          auraOpacityMultiplier: this.qualityProfile.auraOpacityMultiplier,
          heroPrimaryColor: this.heroSystem.getPaletteColors().primary,
          heroAccentColor: this.heroSystem.getPaletteColors().accent,
          heroPulseColor: this.heroSystem.getPaletteColors().pulse,
          smoothValue: (current, target, smoothing, frameDeltaSeconds) =>
            this.smoothValue(current, target, smoothing, frameDeltaSeconds)
        });
      },
      updateParticles: (context) => {
        this.particleSystem.update(
          this.createParticleUpdateContext(context.elapsedSeconds)
        );
      }
    });
    this.framingRig = new FramingRig({
      updateCamera: (context) => {
        this.motionSystem.updateCamera(
          this.camera,
          this.createMotionCameraContext(
            context.elapsedSeconds,
            context.director.geometry,
            context.director.spectacle,
            context.beatDrive,
            context.deltaSeconds
          )
        );
      }
    });
    this.heroSystem.build();
    this.worldSystem.build();
    this.chamberRig.build();
    this.eventRig.build();
    this.stageFrameSystem.build();
    this.postSystem.build();
    this.playableMotifSystem.build();
    this.compositorSystem.build();
    this.framingRig.build();
    this.particleSystem.build();
    this.scene.add(this.camera);
    this.root.add(this.chamberGroup);
    this.root.add(this.heroGroup);
    this.root.add(this.accentGroup);
    this.root.add(this.particleSystem.getObject());
    this.scene.add(this.root);
    this.lightingSystem.addToScene(this.scene);
    this.applyQualityProfile(profile);
  }

  resize(width: number, height: number): void { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
  setQualityProfile(profile: SceneQualityProfile): void { this.qualityProfile = profile; this.applyQualityProfile(profile); }
  getEventRig(): EventRig { return this.eventRig; }
  getFramingRig(): FramingRig { return this.framingRig; }
  setTuning(tuning: RuntimeTuning): void {
    this.tuning = tuning;
    if (!this.directorStateRig.isInitialized()) {
      this.directorStateRig.initializeFromTuning(tuning);
    }
  }
  setPointerInfluence(x: number, y: number): void { this.pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1)); }
  getVisualTelemetry(): VisualTelemetryFrame { return { ...this.visualTelemetry, macroEventsActive: [...this.visualTelemetry.macroEventsActive], temporalWindows: { ...this.visualTelemetry.temporalWindows } }; }
  setSignatureMomentDevOverride(override: SignatureMomentDevOverride | null): void {
    this.signatureMomentDevOverride = override;
  }

  prepareFrame(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): PreparedFlagshipFrameState {
    this.lastListeningFrame = frame;
    this.lastPreparedElapsedSeconds = elapsedSeconds;
    const smooth = (current: number, target: number, rate: number) =>
      this.smoothValue(current, target, rate, deltaSeconds);

    this.pointerCurrent.lerp(
      this.pointerTarget,
      1 - Math.exp(-deltaSeconds * 2.8)
    );

    this.directorStateRig.update({
      frame,
      tuning: this.tuning,
      elapsedSeconds,
      deltaSeconds
    });

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
    this.updatePerformanceChoreography(elapsedSeconds, deltaSeconds);
    this.motionSystem.updateOrganicSpatialLife(
      this.createMotionOrganicContext(elapsedSeconds, deltaSeconds)
    );

    this.macroEventDirector.registerMoment(frame);

    this.updateFamilyRouting(frame, elapsedSeconds, deltaSeconds);
    this.updateAtmosphereState(deltaSeconds);

    const idleBreath =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds * (0.26 + this.roomness * 0.06 + this.ambienceConfidence * 0.04)
        );

    return {
      idleBreath,
      beatDrive,
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
      director: this.directorStateRig.getStageDirectorSnapshot(),
      tuning: this.tuning,
      previousVisualTelemetry: this.visualTelemetry
    };
  }

  updateWorldSystem(elapsedSeconds: number, idleBreath: number): void {
    this.worldSystem.update(
      this.createWorldSystemUpdateContext(elapsedSeconds, idleBreath)
    );
  }

  updateChamberSystem(elapsedSeconds: number, idleBreath: number): void {
    this.chamberSystem.update(
      this.createChamberSystemUpdateContext(elapsedSeconds, idleBreath)
    );
  }

  resolveSignatureMoment(elapsedSeconds: number, deltaSeconds: number): void {
    this.signatureMomentSnapshot = this.signatureMomentGovernor.resolveFrame(
      this.createSignatureMomentGovernorInput(elapsedSeconds, deltaSeconds)
    );
  }

  updateHeroSystem(context: StageIdleContext): void {
    const heroUpdate = this.heroSystem.update(
      this.createHeroSystemUpdateContext(context)
    );
    this.heroCoverageEstimateCurrent = heroUpdate.heroCoverageEstimate;
    this.heroScaleCurrentMetric = heroUpdate.heroScaleCurrent;
    if (heroUpdate.activeHeroForm !== this.lastActiveHeroForm) {
      this.heroFormSwitchCount += 1;
      this.lastActiveHeroForm = heroUpdate.activeHeroForm;
    }
  }

  resolveAuthorityFrame(): void {
    const frameTelemetry = this.collectFrameTelemetry();
    const authorityContext = this.createAuthorityFrameContext(
      frameTelemetry,
      this.authorityFrameSnapshot.overbright
    );

    this.lastAuthorityFrameContext = authorityContext;
    this.authorityFrameSnapshot =
      this.authorityGovernor.resolveFrame(authorityContext);
  }

  finalizeFrame(): void {
    const frameTelemetry = this.collectFrameTelemetry();
    const authorityContext = this.createAuthorityFrameContext(
      frameTelemetry,
      this.authorityFrameSnapshot.overbright
    );

    this.lastAuthorityFrameContext = authorityContext;
    this.authorityFrameSnapshot =
      this.authorityGovernor.resolveFrame(authorityContext);
    this.refreshVisualTelemetry(frameTelemetry);
  }

  applyResolvedStageComposition(
    plan: StageCompositionPlan,
    fallbackState: StageRuntimeFallbackState
  ): void {
    this.stageCompositionPlan = plan;
    this.stageFallbackHeroOverreachCurrent = fallbackState.heroOverreach;
    this.stageFallbackRingOverdrawCurrent = fallbackState.ringOverdraw;
    this.stageFallbackOverbrightRiskCurrent = fallbackState.overbrightRisk;
    this.stageFallbackWashoutRiskCurrent = fallbackState.washoutRisk;
  }

  updateLocomotion(context: StageIdleContext): void {
    this.motionSystem.updateLocomotion(
      this.createMotionLocomotionContext(context)
    );
  }

  updateStageFrame(context: StageIdleContext): void {
    this.stageFrameSystem.update(
      this.createStageFrameUpdateContext(
        context.elapsedSeconds,
        context.idleBreath
      )
    );
  }

  updateLighting(context: StageIdleContext): void {
    this.chamberRig.updateLighting(context);
  }

  updatePostSystem(elapsedSeconds: number, deltaSeconds: number): void {
    this.postSystem.update(
      this.createPostSystemUpdateContext(elapsedSeconds, deltaSeconds)
    );
  }

  updatePlayableMotifSystem(elapsedSeconds: number, deltaSeconds: number): void {
    this.playableMotifSystem.update(
      this.createPlayableMotifSystemUpdateContext(elapsedSeconds, deltaSeconds)
    );
  }

  updateCompositorSystem(elapsedSeconds: number, deltaSeconds: number): void {
    this.compositorSystem.update(
      this.createCompositorSystemUpdateContext(elapsedSeconds, deltaSeconds)
    );
  }

  dispose(): void {
    this.framingRig.dispose();
    this.eventRig.dispose();
    this.heroSystem.dispose();
    this.chamberRig.dispose();
    this.scene.remove(this.root);
    this.particleSystem.dispose();
    this.lightingSystem.dispose();
    this.worldSystem.dispose();
    this.stageFrameSystem.dispose();
    this.postSystem.dispose();
    this.playableMotifSystem.dispose();
    this.compositorSystem.dispose();
    this.accentOrbitSystem.dispose();
    this.pressureWaveSystem.dispose();
  }

  private applyQualityProfile(profile: SceneQualityProfile): void {
    this.visualTelemetry.qualityTier = profile.tier;
    this.particleSystem.applyQualityProfile(profile);
    this.worldSystem.applyQualityProfile(profile);
    this.chamberRig.applyQualityProfile(profile);
    this.heroSystem.applyQualityProfile(profile);
    this.postSystem.applyQualityProfile(profile);
    this.playableMotifSystem.applyQualityProfile(profile);
    this.compositorSystem.applyQualityProfile(profile);
  }

  private createWorldSystemUpdateContext(
    elapsedSeconds: number,
    idleBreath: number
  ): WorldSystemUpdateContext {
    return {
      elapsedSeconds,
      idleBreath,
      qualityProfile: this.qualityProfile,
      tuning: {
        atmosphere: this.tuning.atmosphere,
        neonStageFloor: this.tuning.neonStageFloor,
        worldBootFloor: this.tuning.worldBootFloor
      },
      paletteState: this.paletteState,
      performanceIntent: this.performanceIntent,
      sceneVariation: this.resolveSceneVariationProfile(),
      actWeights: {
        void: this.actWeights['void-chamber'],
        laser: this.actWeights['laser-bloom'],
        matrix: this.actWeights['matrix-storm'],
        eclipse: this.actWeights['eclipse-rupture'],
        ghost: this.actWeights['ghost-afterimage']
      },
      familyWeights: {
        liquid: this.familyWeights['liquid-pressure-core'],
        portal: this.familyWeights['portal-iris'],
        cathedral: this.familyWeights['cathedral-rings'],
        ghost: this.familyWeights['ghost-lattice'],
        storm: this.familyWeights['storm-crown'],
        eclipse: this.familyWeights['eclipse-chamber'],
        plume: this.familyWeights['spectral-plume']
      },
      events: {
        portalOpen: this.eventAmount('portal-open'),
        worldStain: this.eventAmount('world-stain'),
        haloIgnition: this.eventAmount('halo-ignition'),
        collapse: this.eventAmount('singularity-collapse'),
        aftermath: this.eventAmount('ghost-afterimage')
      },
      director: {
        worldActivity: this.directorWorldActivity,
        radiance: this.directorRadiance,
        spectacle: this.directorSpectacle,
        colorBias: this.directorColorBias,
        colorWarp: this.directorColorWarp
      },
      atmosphere: {
        activeMatterState: this.activeMatterState,
        gas: this.atmosphereGas,
        liquid: this.atmosphereLiquid,
        plasma: this.atmospherePlasma,
        crystal: this.atmosphereCrystal,
        pressure: this.atmospherePressure,
        ionization: this.atmosphereIonization,
        residue: this.atmosphereResidue,
        structureReveal: this.atmosphereStructureReveal
      },
      budgets: {
        ambientGlow: this.ambientGlowBudget,
        eventGlow: this.eventGlowBudget,
        roomMusicVisualFloor: this.roomMusicVisualFloor,
        adaptiveMusicVisualFloor: this.adaptiveMusicVisualFloor
      },
      stage: {
        cuePlan: this.stageCuePlan,
        compositionPlan: this.stageCompositionPlan
      },
      signatureMoment: this.signatureMomentSnapshot,
      stageAudioFeatures: this.stageAudioFeatures,
      motion: {
        chamberDrift: this.organicChamberDrift,
        chamberMotion: this.motionSystem.getChamberMotionState(),
        livingField: this.livingField
      },
      audio: {
        air: this.air,
        shimmer: this.shimmer,
        harmonicColor: this.harmonicColor,
        transientConfidence: this.transientConfidence,
        phrasePhase: this.phrasePhase,
        barPhase: this.barPhase,
        beatPhase: this.beatPhase,
        preDropTension: this.preDropTension,
        dropImpact: this.dropImpact,
        sectionChange: this.sectionChange,
        releaseTail: this.releaseTail,
        releasePulse: this.releasePulse,
        strikePulse: this.strikePulse
      },
      metrics: {
        heroCoverageEstimateCurrent: this.heroCoverageEstimateCurrent,
        ringBeltPersistenceCurrent:
          this.authorityFrameSnapshot.ringBeltPersistence
      }
    };
  }

  private createChamberSystemUpdateContext(
    elapsedSeconds: number,
    idleBreath: number
  ): ChamberSystemUpdateContext {
    const sceneVariation = this.resolveSceneVariationProfile();

    return {
      elapsedSeconds,
      idleBreath,
      qualityProfile: this.qualityProfile,
      tuning: {
        neonStageFloor: this.tuning.neonStageFloor,
        worldBootFloor: this.tuning.worldBootFloor
      },
      paletteState: this.paletteState,
      sceneVariation: {
        ringSuppression: sceneVariation.ringSuppression,
        portalSuppression: sceneVariation.portalSuppression,
        latticeBoost: sceneVariation.latticeBoost,
        beamBoost: sceneVariation.beamBoost,
        haloBoost: sceneVariation.haloBoost,
        bladeBoost: sceneVariation.bladeBoost,
        sweepBoost: sceneVariation.sweepBoost,
        postContrastBoost: sceneVariation.postContrastBoost
      },
      actWeights: {
        void: this.actWeights['void-chamber'],
        laser: this.actWeights['laser-bloom'],
        matrix: this.actWeights['matrix-storm'],
        eclipse: this.actWeights['eclipse-rupture'],
        ghost: this.actWeights['ghost-afterimage']
      },
      familyWeights: {
        portal: this.familyWeights['portal-iris'],
        cathedral: this.familyWeights['cathedral-rings'],
        ghost: this.familyWeights['ghost-lattice'],
        storm: this.familyWeights['storm-crown'],
        eclipse: this.familyWeights['eclipse-chamber'],
        plume: this.familyWeights['spectral-plume']
      },
      events: {
        portalOpen: this.eventAmount('portal-open'),
        cathedralRise: this.eventAmount('cathedral-rise'),
        haloIgnition: this.eventAmount('halo-ignition')
      },
      director: {
        worldActivity: this.directorWorldActivity,
        colorBias: this.directorColorBias,
        colorWarp: this.directorColorWarp,
        laserDrive: this.directorLaserDrive,
        geometry: this.directorGeometry,
        radiance: this.directorRadiance,
        spectacle: this.directorSpectacle
      },
      shell: {
        tension: this.shellTension,
        bloom: this.shellBloom,
        orbit: this.shellOrbit,
        halo: this.shellHalo,
        glowOverdrive: this.glowOverdrive
      },
      atmosphere: {
        gas: this.atmosphereGas,
        liquid: this.atmosphereLiquid,
        plasma: this.atmospherePlasma,
        crystal: this.atmosphereCrystal,
        pressure: this.atmospherePressure,
        ionization: this.atmosphereIonization,
        structureReveal: this.atmosphereStructureReveal
      },
      budgets: {
        ambientGlow: this.ambientGlowBudget,
        eventGlow: this.eventGlowBudget,
        roomMusicVisualFloor: this.roomMusicVisualFloor,
        adaptiveMusicVisualFloor: this.adaptiveMusicVisualFloor
      },
      stage: {
        cuePlan: this.stageCuePlan,
        compositionPlan: this.stageCompositionPlan,
        ringPosture: this.visualMotifSnapshot.ringPosture
      },
      signatureMoment: this.signatureMomentSnapshot,
      stageAudioFeatures: this.stageAudioFeatures,
      motion: {
        chamberDrift: this.organicChamberDrift,
        shellDrift: this.organicShellDrift,
        chamberMotion: this.motionSystem.getChamberMotionState(),
        gazeX: this.organicGazeDrift.x + this.pointerCurrent.x * 0.18,
        gazeY: this.organicGazeDrift.y + this.pointerCurrent.y * 0.18,
        livingField: this.livingField
      },
      audio: {
        beatConfidence: this.beatConfidence,
        barPhase: this.barPhase,
        phrasePhase: this.phrasePhase,
        roomness: this.roomness,
        body: this.body,
        shimmer: this.shimmer,
        harmonicColor: this.harmonicColor,
        transientConfidence: this.transientConfidence,
        peakConfidence: this.peakConfidence,
        phraseTension: this.phraseTension,
        preDropTension: this.preDropTension,
        dropImpact: this.dropImpact,
        sectionChange: this.sectionChange,
        releaseTail: this.releaseTail,
        preBeatLift: this.preBeatLift,
        interBeatFloat: this.interBeatFloat,
        beatPulse: this.beatStrike,
        phraseResolve: this.phraseResolve,
        barTurn: this.barTurn,
        releasePulse: this.releasePulse
      },
      metrics: {
        heroScaleCurrent: this.heroScaleCurrentMetric,
        heroCoverageEstimateCurrent: this.heroCoverageEstimateCurrent,
        ringBeltPersistenceCurrent:
          this.authorityFrameSnapshot.ringBeltPersistence,
        wirefieldDensityScoreCurrent:
          this.authorityFrameSnapshot.wirefieldDensityScore
      }
    };
  }


  private createHeroSystemUpdateContext(
    context: StageIdleContext
  ): HeroSystemUpdateContext {
    return {
      timing: {
        elapsedSeconds: context.elapsedSeconds,
        idleBreath: context.idleBreath
      },
      quality: {
        profile: this.qualityProfile
      },
      stage: {
        activeAct: this.activeAct,
        activeFamily: this.activeFamily,
        cuePlan: this.stageCuePlan,
        compositionPlan: this.stageCompositionPlan,
        audioFeatures: this.stageAudioFeatures,
        camera: this.camera,
        budgets: {
          ambientGlow: this.ambientGlowBudget,
          eventGlow: this.eventGlowBudget
        }
      },
      palette: {
        state: this.paletteState,
        frame: this.paletteFrame,
        motif: this.visualMotifSnapshot
      },
      sceneVariation: this.resolveSceneVariationProfile(),
      weights: {
        act: this.actWeights,
        family: {
          liquid: this.familyWeights['liquid-pressure-core'],
          portal: this.familyWeights['portal-iris'],
          cathedral: this.familyWeights['cathedral-rings'],
          ghost: this.familyWeights['ghost-lattice'],
          storm: this.familyWeights['storm-crown'],
          eclipse: this.familyWeights['eclipse-chamber'],
          plume: this.familyWeights['spectral-plume']
        }
      },
      events: {
        portalOpen: this.eventAmount('portal-open'),
        collapse: this.eventAmount('singularity-collapse'),
        twinSplit: this.eventAmount('twin-split'),
        haloIgnition: this.eventAmount('halo-ignition'),
        ghostAfterimage: this.eventAmount('ghost-afterimage')
      },
      director: {
        energy: this.directorEnergy,
        worldActivity: this.directorWorldActivity,
        colorBias: this.directorColorBias,
        geometry: this.directorGeometry,
        radiance: this.directorRadiance,
        colorWarp: this.directorColorWarp,
        laserDrive: this.directorLaserDrive
      },
      shell: {
        tension: this.shellTension,
        bloom: this.shellBloom,
        orbit: this.shellOrbit,
        halo: this.shellHalo,
        glowOverdrive: this.glowOverdrive
      },
      audio: {
        frame: this.lastListeningFrame,
        listeningMode: this.currentListeningMode,
        roomMusicVisualFloor: this.roomMusicVisualFloor,
        adaptiveMusicVisualFloor: this.adaptiveMusicVisualFloor,
        subPressure: this.subPressure,
        bassBody: this.bassBody,
        body: this.body,
        air: this.air,
        shimmer: this.shimmer,
        accent: this.accent,
        brightness: this.brightness,
        roughness: this.roughness,
        harmonicColor: this.harmonicColor,
        phraseTension: this.phraseTension,
        resonance: this.resonance,
        musicConfidence: this.musicConfidence,
        transientConfidence: this.transientConfidence,
        dropImpact: this.dropImpact,
        preDropTension: this.preDropTension,
        sectionChange: this.sectionChange,
        releaseTail: this.releaseTail
      },
      temporal: {
        beatPhase: this.beatPhase,
        barPhase: this.barPhase,
        phrasePhase: this.phrasePhase,
        beatStrike: this.beatStrike,
        preBeatLift: this.preBeatLift,
        interBeatFloat: this.interBeatFloat,
        phraseResolve: this.phraseResolve,
        barTurn: this.barTurn,
        releasePulse: this.releasePulse,
        liftPulse: this.liftPulse
      },
      motion: {
        organicHeroDrift: this.organicHeroDrift,
        organicShellDrift: this.organicShellDrift,
        organicGazeDrift: this.organicGazeDrift,
        pointerCurrent: this.pointerCurrent,
        heroMotionState: this.motionSystem.getHeroMotionState(),
        livingField: this.livingField
      },
      metrics: {
        heroCoverageEstimateCurrent: this.heroCoverageEstimateCurrent,
        ringBeltPersistenceCurrent:
          this.authorityFrameSnapshot.ringBeltPersistence,
        wirefieldDensityScoreCurrent:
          this.authorityFrameSnapshot.wirefieldDensityScore
      },
      signatureMoment: this.signatureMomentSnapshot,
      tuning: {
        readableHeroFloor: this.tuning.readableHeroFloor
      }
    };
  }

  private createParticleUpdateContext(
    elapsedSeconds: number
  ): ParticleSystemUpdateContext {
    return {
      elapsedSeconds,
      qualityProfile: this.qualityProfile,
      authority: this.authorityFrameSnapshot,
      signatureMoment: this.signatureMomentSnapshot,
      paletteState: this.paletteState,
      actWeights: {
        laser: this.actWeights['laser-bloom'],
        matrix: this.actWeights['matrix-storm'],
        eclipse: this.actWeights['eclipse-rupture'],
        ghost: this.actWeights['ghost-afterimage']
      },
      familyWeights: {
        portal: this.familyWeights['portal-iris'],
        cathedral: this.familyWeights['cathedral-rings'],
        ghost: this.familyWeights['ghost-lattice'],
        storm: this.familyWeights['storm-crown'],
        eclipse: this.familyWeights['eclipse-chamber'],
        plume: this.familyWeights['spectral-plume']
      },
      events: {
        portalOpen: this.eventAmount('portal-open'),
        haloIgnition: this.eventAmount('halo-ignition'),
        worldStain: this.eventAmount('world-stain')
      },
      director: {
        energy: this.directorEnergy,
        spectacle: this.directorSpectacle,
        laserDrive: this.directorLaserDrive,
        worldActivity: this.directorWorldActivity,
        colorBias: this.directorColorBias,
        colorWarp: this.directorColorWarp
      },
      atmosphere: {
        gas: this.atmosphereGas,
        liquid: this.atmosphereLiquid,
        plasma: this.atmospherePlasma,
        crystal: this.atmosphereCrystal,
        pressure: this.atmospherePressure,
        ionization: this.atmosphereIonization,
        residue: this.atmosphereResidue
      },
      budgets: {
        ambientGlow: this.ambientGlowBudget,
        eventGlow: this.eventGlowBudget
      },
      audio: {
        air: this.air,
        shimmer: this.shimmer,
        resonance: this.resonance,
        dropImpact: this.dropImpact,
        sectionChange: this.sectionChange,
        transientConfidence: this.transientConfidence,
        roomness: this.roomness,
        harmonicColor: this.harmonicColor,
        phrasePhase: this.phrasePhase,
        beatPhase: this.beatPhase
      }
    };
  }

  private createLightingUpdateContext(
    elapsedSeconds: number
  ): LightingSystemUpdateContext {
    const sceneVariation = this.resolveSceneVariationProfile();
    const chamberEnvelope = this.stageCompositionPlan.chamberEnvelope;

    return {
      elapsedSeconds,
      authority: this.authorityFrameSnapshot,
      signatureMoment: this.signatureMomentSnapshot,
      paletteState: this.paletteState,
      sceneVariation: {
        voidProfile: sceneVariation.voidProfile,
        spectralProfile: sceneVariation.spectralProfile,
        solarProfile: sceneVariation.solarProfile,
        prismaticProfile: sceneVariation.prismaticProfile,
        postContrastBoost: sceneVariation.postContrastBoost
      },
      actWeights: {
        void: this.actWeights['void-chamber'],
        laser: this.actWeights['laser-bloom'],
        matrix: this.actWeights['matrix-storm'],
        eclipse: this.actWeights['eclipse-rupture'],
        ghost: this.actWeights['ghost-afterimage']
      },
      familyWeights: {
        portal: this.familyWeights['portal-iris'],
        cathedral: this.familyWeights['cathedral-rings'],
        ghost: this.familyWeights['ghost-lattice'],
        eclipse: this.familyWeights['eclipse-chamber']
      },
      events: {
        haloIgnition: this.eventAmount('halo-ignition'),
        portalOpen: this.eventAmount('portal-open'),
        worldStain: this.eventAmount('world-stain')
      },
      director: {
        worldActivity: this.directorWorldActivity,
        colorBias: this.directorColorBias,
        colorWarp: this.directorColorWarp
      },
      budgets: {
        ambientGlow: this.ambientGlowBudget,
        eventGlow: this.eventGlowBudget
      },
      audio: {
        air: this.air,
        roomness: this.roomness,
        body: this.body,
        brightness: this.brightness,
        shimmer: this.shimmer,
        harmonicColor: this.harmonicColor,
        transientConfidence: this.transientConfidence,
        preDropTension: this.preDropTension,
        dropImpact: this.dropImpact,
        sectionChange: this.sectionChange,
        phrasePhase: this.phrasePhase,
        beatPhase: this.beatPhase
      },
      liftPulse: this.liftPulse,
      stage: {
        shotWorldTakeover:
          this.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0,
        shotPressure: this.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0,
        shotAnchor: this.stageCompositionPlan.shotClass === 'anchor' ? 1 : 0,
        chamberPresenceFloor: chamberEnvelope.presenceFloor,
        chamberDominanceFloor: chamberEnvelope.dominanceFloor,
        chamberWorldTakeoverBias: chamberEnvelope.worldTakeoverBias,
        roomMusicVisualFloor: this.roomMusicVisualFloor,
        adaptiveMusicVisualFloor: this.adaptiveMusicVisualFloor,
        tuningNeonStageFloor: this.tuning.neonStageFloor,
        tuningWorldBootFloor: this.tuning.worldBootFloor
      },
      motion: {
        cameraDrift: this.organicCameraDrift,
        gazeY: this.organicGazeDrift.y + this.pointerCurrent.y * 0.18
      }
    };
  }

  private createSignatureMomentGovernorInput(
    elapsedSeconds: number,
    deltaSeconds: number
  ): SignatureMomentGovernorInput {
    return {
      frame: this.lastListeningFrame,
      elapsedSeconds,
      deltaSeconds,
      stageCuePlan: this.stageCuePlan,
      stageCompositionPlan: this.stageCompositionPlan,
      authority: this.authorityFrameSnapshot,
      qualityTier: this.qualityProfile.tier,
      devOverride: this.signatureMomentDevOverride
    };
  }

  private createPostSystemUpdateContext(
    elapsedSeconds: number,
    deltaSeconds: number
  ): PostSystemUpdateContext {
    return {
      elapsedSeconds,
      deltaSeconds,
      qualityProfile: this.qualityProfile,
      signatureMoment: this.signatureMomentSnapshot,
      authority: this.authorityFrameSnapshot,
      paletteState: this.paletteState,
      stageCuePlan: this.stageCuePlan,
      audio: {
        beatPhase: this.beatPhase,
        phrasePhase: this.phrasePhase,
        dropImpact: this.dropImpact,
        releaseTail: this.releaseTail,
        shimmer: this.shimmer,
        air: this.air,
        musicConfidence: this.musicConfidence
      }
    };
  }

  private createPlayableMotifSystemUpdateContext(
    elapsedSeconds: number,
    deltaSeconds: number
  ): PlayableMotifSystemUpdateContext {
    return {
      elapsedSeconds,
      deltaSeconds,
      qualityProfile: this.qualityProfile,
      signatureMoment: this.signatureMomentSnapshot,
      authority: this.authorityFrameSnapshot,
      visualMotif: this.visualMotifSnapshot.kind,
      paletteFrame: this.paletteFrame,
      stageCuePlan: this.stageCuePlan,
      postTelemetry: this.postSystem.collectTelemetryInputs(),
      audio: {
        preDropTension: this.preDropTension,
        dropImpact: this.dropImpact,
        sectionChange: this.sectionChange,
        releaseTail: this.releaseTail,
        musicConfidence: this.musicConfidence,
        beatPhase: this.beatPhase,
        phrasePhase: this.phrasePhase,
        shimmer: this.shimmer
      }
    };
  }

  private createCompositorSystemUpdateContext(
    elapsedSeconds: number,
    deltaSeconds: number
  ): CompositorSystemUpdateContext {
    return {
      elapsedSeconds,
      deltaSeconds,
      qualityProfile: this.qualityProfile,
      signatureMoment: this.signatureMomentSnapshot,
      postTelemetry: this.postSystem.collectTelemetryInputs(),
      playableMotif: this.playableMotifSystem.collectTelemetryInputs(),
      authority: this.authorityFrameSnapshot,
      paletteState: this.paletteState
    };
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
    const nextState: WorldAtmosphereState = updateWorldAtmosphereState(
      {
        activeMatterState: this.activeMatterState,
        atmosphereGas: this.atmosphereGas,
        atmosphereLiquid: this.atmosphereLiquid,
        atmospherePlasma: this.atmospherePlasma,
        atmosphereCrystal: this.atmosphereCrystal,
        atmospherePressure: this.atmospherePressure,
        atmosphereIonization: this.atmosphereIonization,
        atmosphereResidue: this.atmosphereResidue,
        atmosphereStructureReveal: this.atmosphereStructureReveal
      },
      {
        deltaSeconds,
        cueFamily: this.stageCuePlan.family,
        worldMode: this.stageCuePlan.worldMode,
        shotClass: this.stageCompositionPlan.shotClass,
        familyWeights: {
          liquidPressureCore: this.familyWeights['liquid-pressure-core'],
          cathedralRings: this.familyWeights['cathedral-rings'],
          stormCrown: this.familyWeights['storm-crown'],
          spectralPlume: this.familyWeights['spectral-plume'],
          ghostLattice: this.familyWeights['ghost-lattice']
        },
        actWeights: {
          laserBloom: this.actWeights['laser-bloom'],
          matrixStorm: this.actWeights['matrix-storm']
        },
        directors: {
          atmosphere: this.directorAtmosphere,
          worldActivity: this.directorWorldActivity,
          radiance: this.directorRadiance,
          laserDrive: this.directorLaserDrive,
          spectacle: this.directorSpectacle,
          geometry: this.directorGeometry,
          colorWarp: this.directorColorWarp
        },
        audio: {
          air: this.air,
          roomness: this.roomness,
          resonance: this.resonance,
          subPressure: this.subPressure,
          tonalStability: this.tonalStability,
          beatStrike: this.beatStrike,
          releaseTail: this.releaseTail,
          phraseTension: this.phraseTension,
          sectionChange: this.sectionChange,
          dropImpact: this.dropImpact,
          preDropTension: this.preDropTension
        },
        stageAudioFeatures: {
          memoryAfterglow: this.stageAudioFeatures.memory.afterglow,
          impactBuild: this.stageAudioFeatures.impact.build,
          impactHit: this.stageAudioFeatures.impact.hit,
          impactSection: this.stageAudioFeatures.impact.section,
          presenceSpatial: this.stageAudioFeatures.presence.spatial,
          textureRoughness: this.stageAudioFeatures.texture.roughness,
          stabilityRestraint: this.stageAudioFeatures.stability.restraint,
          tempoLock: this.stageAudioFeatures.tempo.lock
        },
        chamberWorldTakeoverBias:
          this.stageCompositionPlan.chamberEnvelope.worldTakeoverBias
      }
    );

    this.activeMatterState = nextState.activeMatterState;
    this.atmosphereGas = nextState.atmosphereGas;
    this.atmosphereLiquid = nextState.atmosphereLiquid;
    this.atmospherePlasma = nextState.atmospherePlasma;
    this.atmosphereCrystal = nextState.atmosphereCrystal;
    this.atmospherePressure = nextState.atmospherePressure;
    this.atmosphereIonization = nextState.atmosphereIonization;
    this.atmosphereResidue = nextState.atmosphereResidue;
    this.atmosphereStructureReveal = nextState.atmosphereStructureReveal;
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

  private eventAmount(kind: MacroEventKind): number {
    return this.macroEventDirector.getEventAmount(kind);
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
    const motifKind = deriveVisualMotifKind({
      frame,
      cuePlan
    });
    const paletteVarietyPressure = THREE.MathUtils.clamp(
      paletteSpread * 0.48 +
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
    const motifBaseState = cuePlan.paletteBaseState ?? this.paletteState;
    scores[motifBaseState] = Math.min(1, scores[motifBaseState] + 0.18);
    const nextPaletteState = choosePaletteState({
      currentState: this.paletteState,
      secondsSinceLastChange: elapsedSeconds - this.lastPaletteChangeSeconds,
      scores,
      minimumHoldSeconds: Math.max(
        4.8,
        cuePlan.paletteHoldSeconds +
          (frame.showState === 'surge'
            ? -0.45
            : frame.showState === 'aftermath'
              ? 0.6
              : frame.showState === 'generative'
              ? 0.2
              : 0) -
          paletteEscapePressure * 0.42
      ),
      switchThreshold: THREE.MathUtils.clamp(
        0.08 -
          frame.sectionChange * 0.035 -
          frame.dropImpact * 0.05 -
          frame.releaseTail * 0.025 +
          cuePlan.paletteHoldSeconds * 0.004 -
          paletteEscapePressure * 0.018,
        0.045,
        0.11
      )
    });

    this.paletteTransitionReason = derivePaletteTransitionReason({
      frame,
      cuePlan,
      motif: motifKind,
      currentBaseState: this.paletteState,
      nextBaseState: nextPaletteState,
      signatureMomentKind: this.signatureMomentSnapshot.kind
    });

    if (nextPaletteState !== this.paletteState) {
      this.paletteState = nextPaletteState;
      this.lastPaletteChangeSeconds = elapsedSeconds;
    }
    this.visualMotifSnapshot = deriveVisualMotifSnapshot({
      frame,
      cuePlan,
      paletteBaseState: this.paletteState,
      paletteTransitionReason: this.paletteTransitionReason,
      signatureMomentKind: this.signatureMomentSnapshot.kind,
      signatureMomentPhase: this.signatureMomentSnapshot.phase,
      currentEpisodeId: this.semanticEpisodeId,
      elapsedSeconds,
      lastEpisodeChangeSeconds: this.lastSemanticEpisodeChangeSeconds
    });
    if (this.visualMotifSnapshot.semanticEpisodeId !== this.semanticEpisodeId) {
      this.semanticEpisodeId = this.visualMotifSnapshot.semanticEpisodeId;
      this.lastSemanticEpisodeChangeSeconds = elapsedSeconds;
      this.visualMotifSnapshot.semanticEpisodeAgeSeconds = 0;
    }
    this.paletteFrame = this.visualMotifSnapshot.paletteFrame;
    cuePlan.visualMotif = this.visualMotifSnapshot.kind;
    cuePlan.visualMotifConfidence = this.visualMotifSnapshot.confidence;
    cuePlan.visualMotifReason = this.visualMotifSnapshot.reason;
    cuePlan.paletteBaseState = this.paletteFrame.baseState;
    cuePlan.paletteTransitionReason = this.paletteTransitionReason;
    cuePlan.paletteModulationAmount = this.paletteFrame.modulationAmount;
    cuePlan.paletteTargetDominance = this.paletteFrame.targetDominance;
    cuePlan.paletteTargetSpread = this.paletteFrame.targetSpread;
    cuePlan.heroRole = this.visualMotifSnapshot.heroRole;
    cuePlan.heroFormReason = this.visualMotifSnapshot.heroFormReason;
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

  private createStageFrameUpdateContext(
    elapsedSeconds: number,
    idleBreath: number
  ): StageFrameUpdateContext {
    const sceneVariation = this.resolveSceneVariationProfile();

    return {
      elapsedSeconds,
      idleBreath,
      barPhase: this.barPhase,
      phrasePhase: this.phrasePhase,
      beatPhase: this.beatPhase,
      stageCuePlan: this.stageCuePlan,
      stageCompositionPlan: this.stageCompositionPlan,
      signatureMoment: this.signatureMomentSnapshot,
      matrixAct: this.actWeights['matrix-storm'],
      roomMusicVisualFloor: this.roomMusicVisualFloor,
      adaptiveMusicVisualFloor: this.adaptiveMusicVisualFloor,
      tuningNeonStageFloor: this.tuning.neonStageFloor,
      stageAudioFeatures: this.stageAudioFeatures,
      directorWorldActivity: this.directorWorldActivity,
      gazeX: this.organicGazeDrift.x + this.pointerCurrent.x * 0.12,
      gazeY: this.organicGazeDrift.y + this.pointerCurrent.y * 0.12,
      phraseResolve: this.phraseResolve,
      transientConfidence: this.transientConfidence,
      sceneVariation: {
        prismaticProfile: sceneVariation.prismaticProfile,
        solarProfile: sceneVariation.solarProfile,
        bladeBoost: sceneVariation.bladeBoost,
        sweepBoost: sceneVariation.sweepBoost
      }
    };
  }

  private createMotionSceneVariation(
    sceneVariation: SceneVariationProfile
  ): MotionSceneVariation {
    return {
      beamBoost: sceneVariation.beamBoost,
      cameraSpreadBoost: sceneVariation.cameraSpreadBoost,
      heroRoamBoost: sceneVariation.heroRoamBoost,
      latticeBoost: sceneVariation.latticeBoost,
      noveltyDrive: sceneVariation.noveltyDrive,
      postContrastBoost: sceneVariation.postContrastBoost,
      prismaticProfile: sceneVariation.prismaticProfile,
      spectralProfile: sceneVariation.spectralProfile
    };
  }

  private createMotionOrganicContext(
    elapsedSeconds: number,
    deltaSeconds: number
  ): MotionOrganicContext {
    return {
      elapsedSeconds,
      deltaSeconds,
      barPhase: this.barPhase,
      phrasePhase: this.phrasePhase,
      ambienceConfidence: this.ambienceConfidence,
      directorAtmosphere: this.directorAtmosphere,
      directorEnergy: this.directorEnergy,
      directorFraming: this.directorFraming,
      directorGeometry: this.directorGeometry,
      directorSpectacle: this.directorSpectacle,
      directorWorldActivity: this.directorWorldActivity,
      dropImpact: this.dropImpact,
      ghostLatticeWeight: this.familyWeights['ghost-lattice'],
      harmonicColor: this.harmonicColor,
      musicConfidence: this.musicConfidence,
      phraseTension: this.phraseTension,
      preDropTension: this.preDropTension,
      releasePulse: this.releasePulse,
      releaseTail: this.releaseTail,
      resonance: this.resonance,
      roomness: this.roomness,
      sectionChange: this.sectionChange,
      shellBloom: this.shellBloom,
      shellOrbit: this.shellOrbit,
      shellTension: this.shellTension,
      speechConfidence: this.speechConfidence,
      stageAudioFeatures: this.stageAudioFeatures
    };
  }

  private createMotionLocomotionContext(
    context: StageIdleContext
  ): MotionLocomotionContext {
    return {
      elapsedSeconds: context.elapsedSeconds,
      deltaSeconds: context.deltaSeconds,
      barPhase: this.barPhase,
      phrasePhase: this.phrasePhase,
      directorFraming: this.directorFraming,
      directorWorldActivity: this.directorWorldActivity,
      stageCuePlan: this.stageCuePlan,
      stageCompositionPlan: this.stageCompositionPlan,
      sceneVariation: this.createMotionSceneVariation(
        this.resolveSceneVariationProfile()
      )
    };
  }

  private createMotionCameraContext(
    elapsedSeconds: number,
    geometryBias: number,
    spectacle: number,
    beatDrive: number,
    deltaSeconds: number
  ): MotionCameraContext {
    return {
      elapsedSeconds,
      deltaSeconds,
      beatDrive,
      barPhase: this.barPhase,
      beatPhase: this.beatPhase,
      phrasePhase: this.phrasePhase,
      geometryBias,
      spectacle,
      directorFraming: this.directorFraming,
      directorWorldActivity: this.directorWorldActivity,
      roomMusicVisualFloor: this.roomMusicVisualFloor,
      adaptiveMusicVisualFloor: this.adaptiveMusicVisualFloor,
      body: this.body,
      preDropTension: this.preDropTension,
      dropImpact: this.dropImpact,
      sectionChange: this.sectionChange,
      releaseTail: this.releaseTail,
      heroCoverageEstimateCurrent: this.heroCoverageEstimateCurrent,
      ringBeltPersistenceCurrent:
        this.authorityFrameSnapshot.ringBeltPersistence,
      wirefieldDensityScoreCurrent:
        this.authorityFrameSnapshot.wirefieldDensityScore,
      tuningCameraNearFloor: this.tuning.cameraNearFloor,
      tuningReadableHeroFloor: this.tuning.readableHeroFloor,
      portalWeight: this.familyWeights['portal-iris'],
      cathedralWeight: this.familyWeights['cathedral-rings'],
      eclipseWeight: this.familyWeights['eclipse-chamber'],
      plumeWeight: this.familyWeights['spectral-plume'],
      collapseAmount: this.eventAmount('singularity-collapse'),
      portalOpenAmount: this.eventAmount('portal-open'),
      gazeX: this.organicGazeDrift.x + this.pointerCurrent.x * 0.18,
      gazeY: this.organicGazeDrift.y + this.pointerCurrent.y * 0.18,
      gazeZ: this.organicGazeDrift.z,
      cameraDrift: this.organicCameraDrift,
      heroDrift: this.organicHeroDrift,
      chamberDrift: this.organicChamberDrift,
      heroPosition: this.heroGroup.position,
      stageAudioFeatures: this.stageAudioFeatures,
      stageCuePlan: this.stageCuePlan,
      stageCompositionPlan: this.stageCompositionPlan,
      signatureMoment: this.signatureMomentSnapshot,
      sceneVariation: this.createMotionSceneVariation(
        this.resolveSceneVariationProfile()
      )
    };
  }

  private createAccentOrbitUpdateContext(
    elapsedSeconds: number
  ): AccentOrbitUpdateContext {
    return {
      elapsedSeconds,
      paletteState: this.paletteState,
      laserActWeight: this.actWeights['laser-bloom'],
      matrixActWeight: this.actWeights['matrix-storm'],
      eclipseActWeight: this.actWeights['eclipse-rupture'],
      ghostActWeight: this.actWeights['ghost-afterimage'],
      portalWeight: this.familyWeights['portal-iris'],
      cathedralWeight: this.familyWeights['cathedral-rings'],
      stormWeight: this.familyWeights['storm-crown'],
      ghostWeight: this.familyWeights['ghost-lattice'],
      haloIgnition: this.eventAmount('halo-ignition'),
      portalOpen: this.eventAmount('portal-open'),
      directorWorldActivity: this.directorWorldActivity,
      directorLaserDrive: this.directorLaserDrive,
      directorColorBias: this.directorColorBias,
      ambientGlow: this.ambientGlowBudget,
      eventGlow: this.eventGlowBudget,
      beatPhase: this.beatPhase,
      phrasePhase: this.phrasePhase,
      body: this.body,
      liftPulse: this.liftPulse,
      sectionChange: this.sectionChange,
      shimmer: this.shimmer,
      harmonicColor: this.harmonicColor,
      accent: this.accent,
      strikePulse: this.strikePulse,
      transientConfidence: this.transientConfidence,
      preDropTension: this.preDropTension,
      dropImpact: this.dropImpact
    };
  }

  private refreshVisualTelemetry(frameTelemetry: CollectedFrameTelemetry): void {
    const {
      heroTelemetry,
      chamberTelemetry,
      worldTelemetry,
      stageBladeAverage,
      stageSweepAverage,
      lightingIntensities,
      particleOpacity,
      postTelemetry,
      playableMotifTelemetry,
      compositorTelemetry,
      satelliteActivity,
      pressureWaveAverage
    } = frameTelemetry;
    const chamberEuler = this.chamberTelemetryEuler.setFromQuaternion(
      this.chamberGroup.quaternion
    );
    const cameraEuler = this.cameraTelemetryEuler.setFromQuaternion(
      this.camera.quaternion
    );

    this.heroHue = heroTelemetry.heroHue;
    this.worldHue = worldTelemetry.worldHue;
    this.heroScreenX = heroTelemetry.heroScreenX;
    this.heroScreenY = heroTelemetry.heroScreenY;
    this.heroCoverageEstimateCurrent = heroTelemetry.heroCoverageEstimate;
    this.heroOffCenterPenaltyCurrent = heroTelemetry.heroOffCenterPenalty;
    this.heroDepthPenaltyCurrent = heroTelemetry.heroDepthPenalty;
    const paletteBaseAgeSeconds = Math.max(
      0,
      this.lastPreparedElapsedSeconds - this.lastPaletteChangeSeconds
    );
    const hueDistance = Math.abs(this.heroHue - this.worldHue);
    const heroWorldHueDivergence = Math.min(hueDistance, 1 - hueDistance);
    const plannedActiveHeroFormMatch =
      heroTelemetry.plannedActiveHeroFormMatch ??
      this.stageCuePlan.heroForm === heroTelemetry.activeHeroForm;
    const unearnedChangeRisk = THREE.MathUtils.clamp(
      (this.paletteTransitionReason === 'hold' && paletteBaseAgeSeconds < 2.4 ? 0.34 : 0) +
        (!plannedActiveHeroFormMatch && heroTelemetry.heroFormReason === 'hold' ? 0.42 : 0) +
        (heroWorldHueDivergence > 0.34 ? (heroWorldHueDivergence - 0.34) * 1.2 : 0) +
        (1 - this.visualMotifSnapshot.confidence) * 0.18,
      0,
      1
    );

    const cueGrammarInput = {
      frame: this.lastListeningFrame,
      activeAct: this.activeAct,
      cueFamily: this.stageCuePlan.family,
      cueDominance: this.stageCuePlan.dominance,
      compositorMode: this.stageCuePlan.compositorMode,
      residueMode: this.stageCuePlan.residueMode,
      screenEffectFamily: this.stageCuePlan.screenEffectIntent.family,
      worldWeight: this.stageCuePlan.worldWeight,
      heroWeight: this.stageCuePlan.heroWeight,
      shotClass: this.stageCompositionPlan.shotClass,
      transformIntent: this.stageCuePlan.transformIntent,
      worldMode: this.stageCuePlan.worldMode
    };
    const canonicalCueClass = deriveCanonicalCueClass(cueGrammarInput);
    const performanceRegime = derivePerformanceRegime(this.lastListeningFrame);
    const silenceState = deriveSilenceState(this.lastListeningFrame);
    const phraseConfidence = derivePhraseConfidence(this.lastListeningFrame);
    const sectionIntent = deriveSectionIntent(this.lastListeningFrame);
    const postSpendIntent = derivePostSpendIntent(cueGrammarInput);
    const stageIntent = deriveStageIntent(cueGrammarInput);
    const worldAuthorityState = deriveWorldAuthorityState(cueGrammarInput);
    const heroAuthorityState = deriveHeroAuthorityState(cueGrammarInput);
    const twinEmissiveMean = heroTelemetry.twinEmissiveMean;
    const atmosphereVeilAverage = worldTelemetry.atmosphereVeilOpacityAverage;
    const atmosphereColumnAverage = worldTelemetry.atmosphereColumnOpacityAverage;
    const assetLayerActivity = this.telemetryRig.buildAssetLayerActivity({
      worldSphereLuminance: worldTelemetry.worldSphereLuminance,
      worldStainOpacity:
        worldTelemetry.worldStainOpacity +
        atmosphereVeilAverage * 0.2 +
        atmosphereColumnAverage * 0.16,
      worldFlashOpacity: worldTelemetry.worldFlashOpacity,
      fogDensity:
        worldTelemetry.fogDensity +
        atmosphereVeilAverage * 0.016 +
        atmosphereColumnAverage * 0.012,
      heroShellEmissiveIntensity: heroTelemetry.heroShellEmissiveIntensity,
      heroAuraOpacity: heroTelemetry.heroAuraOpacity,
      heroFresnelIntensity: heroTelemetry.heroFresnelIntensity,
      heroEnergyShellOpacity: heroTelemetry.heroEnergyShellOpacity,
      heroSeamOpacity: heroTelemetry.heroSeamOpacity,
      ghostHeroOpacity: heroTelemetry.ghostHeroOpacity,
      heroCoreEmissiveIntensity: heroTelemetry.heroCoreEmissiveIntensity,
      heroEdgesOpacity: heroTelemetry.heroEdgesOpacity,
      heroMembraneOpacity: heroTelemetry.heroMembraneOpacity,
      heroCrownOpacity: heroTelemetry.heroCrownOpacity,
      twinEmissiveMean,
      chamberRingOpacity: chamberTelemetry.chamberRingOpacityAverage,
      portalRingOpacity: chamberTelemetry.portalRingOpacityAverage,
      chromaHaloOpacity: chamberTelemetry.chromaHaloOpacityAverage,
      ghostLatticeOpacity: chamberTelemetry.ghostLatticeOpacityAverage,
      laserBeamOpacity: chamberTelemetry.laserBeamOpacityAverage,
      stageBladeOpacity: stageBladeAverage,
      stageSweepOpacity: stageSweepAverage,
      satelliteActivity,
      pressureWaveOpacity: pressureWaveAverage,
      particleOpacity,
      ambientLightIntensity: lightingIntensities.ambient,
      fillLightIntensity: lightingIntensities.fill,
      warmLightIntensity: lightingIntensities.warm,
      coolLightIntensity: lightingIntensities.cool,
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
      worldGlowSpend: this.authorityFrameSnapshot.worldGlowSpend,
      heroGlowSpend: this.authorityFrameSnapshot.heroGlowSpend,
      shellGlowSpend: this.authorityFrameSnapshot.shellGlowSpend,
      activeAct: this.activeAct,
      paletteState: this.paletteState,
      showFamily: this.activeFamily,
      macroEventsActive: this.macroEventDirector.getActiveEventKinds(),
      heroHue: this.heroHue,
      worldHue: this.worldHue,
      cueClass: this.cueState.cueClass,
      canonicalCueClass,
      performanceRegime,
      stageIntent,
      worldAuthorityState,
      heroAuthorityState,
      postSpendIntent,
      silenceState,
      phraseConfidence,
      sectionIntent,
      visualMotif: this.visualMotifSnapshot.kind,
      semanticEpisodeId: this.visualMotifSnapshot.semanticEpisodeId,
      episodeAgeSeconds: this.visualMotifSnapshot.semanticEpisodeAgeSeconds,
      episodeTransitionReason:
        this.visualMotifSnapshot.semanticEpisodeTransitionReason,
      visualMotifConfidence: this.visualMotifSnapshot.confidence,
      visualMotifReason: this.visualMotifSnapshot.reason,
      paletteBaseState: this.paletteFrame.baseState,
      paletteBaseAgeSeconds,
      paletteTransitionReason: this.paletteTransitionReason,
      paletteBaseHoldReason: this.visualMotifSnapshot.paletteBaseHoldReason,
      paletteModulationAmount: this.paletteFrame.modulationAmount,
      paletteTargetDominance: this.paletteFrame.targetDominance,
      paletteTargetSpread: this.paletteFrame.targetSpread,
      heroRole: heroTelemetry.heroRole,
      heroFormReason: heroTelemetry.heroFormReason,
      plannedHeroForm: heroTelemetry.plannedHeroForm,
      activeHeroForm: heroTelemetry.activeHeroForm,
      pendingHeroForm: heroTelemetry.pendingHeroForm,
      plannedActiveHeroFormMatch,
      heroFormHoldElapsedSeconds: heroTelemetry.heroFormHoldElapsedSeconds,
      heroFormSwitchCount: this.heroFormSwitchCount,
      semanticConfidence: this.visualMotifSnapshot.confidence,
      heroWorldHueDivergence,
      unearnedChangeRisk,
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
      ringPosture: this.visualMotifSnapshot.ringPosture,
      stageWashoutSuppression: this.stageCuePlan.washoutSuppression,
      stageMotionPhrase: this.stageCuePlan.motionPhrase,
      stageCameraPhrase: this.stageCuePlan.cameraPhrase,
      stageHeroForm: heroTelemetry.activeHeroForm,
      stageHeroAccentForm: heroTelemetry.activeHeroAccentForm,
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
      heroScale: heroTelemetry.heroScale,
      heroScreenX: this.heroScreenX,
      heroScreenY: this.heroScreenY,
      heroCoverageEstimate: this.heroCoverageEstimateCurrent,
      heroOffCenterPenalty: this.heroOffCenterPenaltyCurrent,
      heroDepthPenalty: this.heroDepthPenaltyCurrent,
      heroTranslateX: heroTelemetry.heroTranslateX,
      heroTranslateY: heroTelemetry.heroTranslateY,
      heroTranslateZ: heroTelemetry.heroTranslateZ,
      heroRotationPitch: heroTelemetry.heroRotationPitch,
      heroRotationYaw: heroTelemetry.heroRotationYaw,
      heroRotationRoll: heroTelemetry.heroRotationRoll,
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
      ringAuthority: this.authorityFrameSnapshot.ringAuthority,
      chamberPresenceScore: this.authorityFrameSnapshot.chamberPresenceScore,
      frameHierarchyScore: this.authorityFrameSnapshot.frameHierarchyScore,
      compositionSafetyFlag: this.authorityFrameSnapshot.compositionSafetyFlag,
      compositionSafetyScore: this.authorityFrameSnapshot.compositionSafetyScore,
      overbright: this.authorityFrameSnapshot.overbright,
      ringBeltPersistence: this.authorityFrameSnapshot.ringBeltPersistence,
      wirefieldDensityScore: this.authorityFrameSnapshot.wirefieldDensityScore,
      worldDominanceDelivered:
        this.authorityFrameSnapshot.worldDominanceDelivered,
      stageFallbackHeroOverreach: this.stageFallbackHeroOverreachCurrent,
      stageFallbackRingOverdraw: this.stageFallbackRingOverdrawCurrent,
      stageFallbackOverbrightRisk: this.stageFallbackOverbrightRiskCurrent,
      stageFallbackWashoutRisk: this.stageFallbackWashoutRiskCurrent,
      afterImageDamp: this.visualTelemetry.afterImageDamp,
      activeSignatureMoment: postTelemetry.activeSignatureMoment,
      signatureMomentPhase: postTelemetry.signatureMomentPhase,
      signatureMomentStyle: postTelemetry.signatureMomentStyle,
      signatureMomentIntensity: postTelemetry.signatureMomentIntensity,
      signatureMomentAgeSeconds: postTelemetry.signatureMomentAgeSeconds,
      signatureMomentSuppressionReason:
        postTelemetry.signatureMomentSuppressionReason,
      signatureMomentTriggerConfidence:
        postTelemetry.signatureMomentTriggerConfidence,
      signatureMomentPrechargeProgress:
        postTelemetry.signatureMomentPrechargeProgress,
      signatureMomentRarityBudget: postTelemetry.signatureMomentRarityBudget,
      signatureMomentForcedPreview: postTelemetry.signatureMomentForcedPreview,
      signatureMomentDistinctnessHint:
        postTelemetry.signatureMomentDistinctnessHint,
      collapseScarAmount: postTelemetry.collapseScarAmount,
      cathedralOpenAmount: postTelemetry.cathedralOpenAmount,
      ghostResidueAmount: postTelemetry.ghostResidueAmount,
      silenceConstellationAmount: postTelemetry.silenceConstellationAmount,
      memoryTraceCount: postTelemetry.memoryTraceCount,
      aftermathClearance: postTelemetry.aftermathClearance,
      postConsequenceIntensity: postTelemetry.postConsequenceIntensity,
      postOverprocessRisk: postTelemetry.postOverprocessRisk,
      compositorMaskFamily: compositorTelemetry.compositorMaskFamily,
      compositorSignatureMask: compositorTelemetry.compositorSignatureMask,
      compositorCutAmount: compositorTelemetry.compositorCutAmount,
      compositorVignetteAmount: compositorTelemetry.compositorVignetteAmount,
      compositorChromaticAmount: compositorTelemetry.compositorChromaticAmount,
      compositorEdgeWindowAmount: compositorTelemetry.compositorEdgeWindowAmount,
      compositorContrastLift: compositorTelemetry.compositorContrastLift,
      compositorSaturationLift: compositorTelemetry.compositorSaturationLift,
      compositorExposureBias: compositorTelemetry.compositorExposureBias,
      compositorBloomBias: compositorTelemetry.compositorBloomBias,
      compositorAfterImageBias: compositorTelemetry.compositorAfterImageBias,
      compositorOverprocessRisk: compositorTelemetry.compositorOverprocessRisk,
      perceptualContrastScore: compositorTelemetry.perceptualContrastScore,
      perceptualColorfulnessScore: compositorTelemetry.perceptualColorfulnessScore,
      perceptualWashoutRisk: compositorTelemetry.perceptualWashoutRisk,
      activePlayableMotifScene:
        playableMotifTelemetry.activePlayableMotifScene,
      playableMotifSceneProfileId:
        playableMotifTelemetry.playableMotifSceneProfileId,
      playableMotifSceneAssetPackIds:
        playableMotifTelemetry.playableMotifSceneAssetPackIds,
      playableMotifSceneSilhouetteFamily:
        playableMotifTelemetry.playableMotifSceneSilhouetteFamily,
      playableMotifSceneSurfaceRole:
        playableMotifTelemetry.playableMotifSceneSurfaceRole,
      playableMotifSceneProfileMatch:
        playableMotifTelemetry.playableMotifSceneProfileMatch,
      particleFieldJob: playableMotifTelemetry.particleFieldJob,
      playableMotifSceneDriver:
        playableMotifTelemetry.playableMotifSceneDriver,
      playableMotifSceneIntentMatch:
        playableMotifTelemetry.playableMotifSceneIntentMatch,
      playableMotifSceneAgeSeconds:
        playableMotifTelemetry.playableMotifSceneAgeSeconds,
      playableMotifSceneTransitionReason:
        playableMotifTelemetry.playableMotifSceneTransitionReason,
      playableMotifSceneIntensity:
        playableMotifTelemetry.playableMotifSceneIntensity,
      playableMotifSceneMotifMatch:
        playableMotifTelemetry.playableMotifSceneMotifMatch,
      playableMotifScenePaletteMatch:
        playableMotifTelemetry.playableMotifScenePaletteMatch,
      playableMotifSceneDistinctness:
        playableMotifTelemetry.playableMotifSceneDistinctness,
      playableMotifSceneSilhouetteConfidence:
        playableMotifTelemetry.playableMotifSceneSilhouetteConfidence,
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

  setPostTelemetry(input: ScenePostTelemetry): void {
    if (this.lastAuthorityFrameContext) {
      this.authorityFrameSnapshot = this.authorityGovernor.applyPostTelemetry(
        this.lastAuthorityFrameContext,
        input
      );
    }

    this.visualTelemetry = {
      ...this.visualTelemetry,
      qualityTier: input.qualityTier,
      exposure: input.exposure,
      bloomStrength: input.bloomStrength,
      bloomThreshold: input.bloomThreshold,
      bloomRadius: input.bloomRadius,
      worldGlowSpend: this.authorityFrameSnapshot.worldGlowSpend,
      heroGlowSpend: this.authorityFrameSnapshot.heroGlowSpend,
      shellGlowSpend: this.authorityFrameSnapshot.shellGlowSpend,
      ringAuthority: this.authorityFrameSnapshot.ringAuthority,
      chamberPresenceScore: this.authorityFrameSnapshot.chamberPresenceScore,
      frameHierarchyScore: this.authorityFrameSnapshot.frameHierarchyScore,
      compositionSafetyFlag: this.authorityFrameSnapshot.compositionSafetyFlag,
      compositionSafetyScore: this.authorityFrameSnapshot.compositionSafetyScore,
      overbright: this.authorityFrameSnapshot.overbright,
      ringBeltPersistence: this.authorityFrameSnapshot.ringBeltPersistence,
      wirefieldDensityScore: this.authorityFrameSnapshot.wirefieldDensityScore,
      worldDominanceDelivered:
        this.authorityFrameSnapshot.worldDominanceDelivered,
      afterImageDamp: input.afterImageDamp ?? this.visualTelemetry.afterImageDamp
    };
  }

  private collectFrameTelemetry(): CollectedFrameTelemetry {
    const heroTelemetry = this.heroSystem.collectTelemetryInputs({
      camera: this.camera,
      stageCompositionPlan: this.stageCompositionPlan
    });

    return {
      heroTelemetry,
      chamberTelemetry: this.chamberRig.collectTelemetryInputs(),
      worldTelemetry: this.worldSystem.collectTelemetryInputs(),
      stageBladeAverage: this.stageFrameSystem.getBladeAverageOpacity(),
      stageSweepAverage: this.stageFrameSystem.getSweepAverageOpacity(),
      lightingIntensities: this.lightingSystem.getIntensities(),
      particleOpacity: this.particleSystem.getOpacity(),
      postTelemetry: this.postSystem.collectTelemetryInputs(),
      playableMotifTelemetry: this.playableMotifSystem.collectTelemetryInputs(),
      compositorTelemetry: this.compositorSystem.collectTelemetryInputs(),
      satelliteActivity: this.accentOrbitSystem.getSatelliteActivity(),
      pressureWaveAverage: this.pressureWaveSystem.getAverageOpacity()
    };
  }

  private createAuthorityFrameContext(
    frameTelemetry: CollectedFrameTelemetry,
    overbright: number
  ): AuthorityGovernorFrameContext {
    return {
      heroTelemetry: frameTelemetry.heroTelemetry,
      chamberTelemetry: frameTelemetry.chamberTelemetry,
      worldTelemetry: frameTelemetry.worldTelemetry,
      stage: {
        bladeAverage: frameTelemetry.stageBladeAverage,
        sweepAverage: frameTelemetry.stageSweepAverage,
        dominance: this.stageCuePlan.dominance,
        compositionSafetyThreshold: this.stageCompositionPlan.compositionSafety,
        heroCoverageMax: this.stageCompositionPlan.heroEnvelope.coverageMax,
        exposureCeiling: this.stageCuePlan.exposureCeiling,
        bloomCeiling: this.stageCuePlan.bloomCeiling
      },
      overbright
    };
  }

  private resolveSceneVariationProfile(): SceneVariationProfile {
    return resolveSceneVariationProfileFromDirection({
      stageCuePlan: this.stageCuePlan,
      stageCompositionPlan: this.stageCompositionPlan,
      actWeights: this.actWeights,
      familyWeights: {
        portalIris: this.familyWeights['portal-iris'],
        cathedralRings: this.familyWeights['cathedral-rings'],
        ghostLattice: this.familyWeights['ghost-lattice'],
        stormCrown: this.familyWeights['storm-crown'],
        eclipseChamber: this.familyWeights['eclipse-chamber'],
        spectralPlume: this.familyWeights['spectral-plume']
      },
      activeHeroForm: this.heroSystem.activeHeroForm,
      activeHeroAccentForm: this.heroSystem.activeHeroAccentForm
    });
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
