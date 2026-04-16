import type { QualityTier } from '../engine/VisualizerEngine';

export type PaletteState =
  | 'void-cyan'
  | 'tron-blue'
  | 'acid-lime'
  | 'solar-magenta'
  | 'ghost-white';

export type ShowAct =
  | 'void-chamber'
  | 'laser-bloom'
  | 'matrix-storm'
  | 'eclipse-rupture'
  | 'ghost-afterimage';

export const ATMOSPHERE_MATTER_STATES = [
  'gas',
  'liquid',
  'plasma',
  'crystal'
] as const;

export type AtmosphereMatterState = (typeof ATMOSPHERE_MATTER_STATES)[number];

export type VisualTemporalWindows = {
  preBeatLift: number;
  beatStrike: number;
  postBeatRelease: number;
  interBeatFloat: number;
  barTurn: number;
  phraseResolve: number;
};

export type VisualCueClass =
  | 'brood'
  | 'gather'
  | 'reveal'
  | 'rupture'
  | 'afterglow'
  | 'haunt';

export type VisualCueState = {
  cueClass: VisualCueClass;
  intensity: number;
  attack: number;
  sustain: number;
  decay: number;
  screenWeight: number;
  residueWeight: number;
  worldWeight: number;
  heroWeight: number;
  eventDensity: number;
};

export type StageCueFamily =
  | 'brood'
  | 'gather'
  | 'reveal'
  | 'rupture'
  | 'release'
  | 'haunt'
  | 'reset';

export type StageCueDominance = 'hero' | 'chamber' | 'world' | 'hybrid';

export type StageSpendProfile = 'withheld' | 'earned' | 'peak';

export type StageHeroAnchorLane =
  | 'center'
  | 'left'
  | 'right'
  | 'high'
  | 'low';

export type StageRingAuthority =
  | 'background-scaffold'
  | 'framing-architecture'
  | 'event-platform';

export type StageWorldMode =
  | 'hold'
  | 'aperture-cage'
  | 'fan-sweep'
  | 'cathedral-rise'
  | 'collapse-well'
  | 'ghost-chamber'
  | 'field-bloom';

export type StageCompositorMode =
  | 'none'
  | 'precharge'
  | 'wipe'
  | 'flash'
  | 'scar'
  | 'afterimage'
  | 'cut';

export type StageResidueMode =
  | 'none'
  | 'short'
  | 'afterglow'
  | 'ghost'
  | 'scar'
  | 'clear';

export type StageTransformIntent =
  | 'hold'
  | 'compress'
  | 'open'
  | 'collapse'
  | 'sweep'
  | 'exhale'
  | 'clear';

export type StageMotionPhrase =
  | 'drift-orbit'
  | 'bank-rise'
  | 'arc-handoff'
  | 'tumble-release'
  | 'recoil-dive'
  | 'cathedral-precession';

export type StageHeroForm =
  | 'orb'
  | 'cube'
  | 'pyramid'
  | 'diamond'
  | 'prism'
  | 'shard'
  | 'mushroom';

export type StageScreenEffectFamily =
  | 'none'
  | 'residue'
  | 'carve'
  | 'wipe'
  | 'stain'
  | 'directional-afterimage'
  | 'impact-memory';

export type StageScreenEffectIntent = {
  family: StageScreenEffectFamily;
  intensity: number;
  directionalBias: number;
  memoryBias: number;
  carveBias: number;
};

export type StagePaletteTargets = Record<PaletteState, number>;

export type StageShotClass =
  | 'anchor'
  | 'pressure'
  | 'rupture'
  | 'worldTakeover'
  | 'aftermath'
  | 'isolate';

export type StageTransitionClass =
  | 'hold'
  | 'wipe'
  | 'collapse'
  | 'iris'
  | 'blackoutCut'
  | 'residueDissolve'
  | 'vectorHandoff';

export type StageEventScale = 'micro' | 'phrase' | 'stage';

export type StageTempoCadenceMode =
  | 'float'
  | 'metered'
  | 'driving'
  | 'surge'
  | 'aftermath';

export type StageHeroEnvelope = {
  coverageMin: number;
  coverageMax: number;
  offCenterMax: number;
  depthMax: number;
  scaleCeiling: number;
  driftAllowance: number;
  travelMinX: number;
  travelMinY: number;
  laneTargetX: number;
  laneTargetY: number;
};

export type StageChamberEnvelope = {
  presenceFloor: number;
  dominanceFloor: number;
  ringOpacityCap: number;
  wireDensityCap: number;
  worldTakeoverBias: number;
};

export type StageSubtractivePolicy = {
  apertureClamp: number;
  blackoutBias: number;
  wipeBias: number;
  residueBias: number;
};

export type StageCompositionPlan = {
  shotClass: StageShotClass;
  transitionClass: StageTransitionClass;
  eventScale: StageEventScale;
  tempoCadenceMode: StageTempoCadenceMode;
  heroEnvelope: StageHeroEnvelope;
  chamberEnvelope: StageChamberEnvelope;
  subtractivePolicy: StageSubtractivePolicy;
  compositionSafety: number;
  fallbackDemoteHero: boolean;
  fallbackWidenShot: boolean;
  fallbackForceWorldTakeover: boolean;
};

export type StageCuePlan = {
  family: StageCueFamily;
  dominance: StageCueDominance;
  spendProfile: StageSpendProfile;
  worldMode: StageWorldMode;
  compositorMode: StageCompositorMode;
  residueMode: StageResidueMode;
  transformIntent: StageTransformIntent;
  stageWeight: number;
  chamberWeight: number;
  heroWeight: number;
  worldWeight: number;
  screenWeight: number;
  residueWeight: number;
  eventDensity: number;
  subtractiveAmount: number;
  wipeAmount: number;
  flashAmount: number;
  heroScaleMin: number;
  heroScaleMax: number;
  heroAnchorLane: StageHeroAnchorLane;
  heroAnchorStrength: number;
  exposureCeiling: number;
  bloomCeiling: number;
  ringAuthority: StageRingAuthority;
  washoutSuppression: number;
  motionPhrase: StageMotionPhrase;
  cameraPhrase: StageMotionPhrase;
  heroForm: StageHeroForm;
  heroAccentForm: StageHeroForm;
  heroFormHoldSeconds: number;
  paletteTargets: StagePaletteTargets;
  paletteHoldSeconds: number;
  screenEffectIntent: StageScreenEffectIntent;
  heroScaleBias: number;
  heroStageX: number;
  heroStageY: number;
  heroDepthBias: number;
  heroMotionBias: number;
  heroMorphBias: number;
};

export const VISUAL_ASSET_LAYERS = [
  'worldSphere',
  'worldStain',
  'worldFlash',
  'fog',
  'heroShell',
  'heroAura',
  'heroFresnel',
  'heroEnergyShell',
  'heroSeam',
  'ghostHero',
  'heroCore',
  'heroEdges',
  'heroMembrane',
  'heroCrown',
  'heroTwins',
  'chamberRings',
  'portalRings',
  'chromaHalos',
  'ghostLattice',
  'laserBeams',
  'stageBlades',
  'stageSweeps',
  'satellites',
  'pressureWaves',
  'particles',
  'ambientLight',
  'fillLight',
  'warmLight',
  'coolLight',
  'afterImage'
] as const;

export type VisualAssetLayer = (typeof VISUAL_ASSET_LAYERS)[number];

export type VisualAssetLayerActivity = Record<VisualAssetLayer, number>;

export type VisualAssetLayerSummaryEntry = {
  mean: number;
  peak: number;
  activeFrameRate: number;
};

export type VisualAssetLayerSummary = Record<
  VisualAssetLayer,
  VisualAssetLayerSummaryEntry
>;

export type VisualTelemetryFrame = {
  qualityTier: QualityTier | 'unknown';
  exposure: number;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  ambientGlowBudget: number;
  eventGlowBudget: number;
  worldGlowSpend: number;
  heroGlowSpend: number;
  shellGlowSpend: number;
  activeAct: ShowAct;
  paletteState: PaletteState;
  showFamily: string;
  macroEventsActive: string[];
  heroHue: number;
  worldHue: number;
  temporalWindows: VisualTemporalWindows;
  cueClass?: VisualCueClass;
  cueIntensity?: number;
  cueAttack?: number;
  cueSustain?: number;
  cueDecay?: number;
  cueScreenWeight?: number;
  cueResidueWeight?: number;
  cueWorldWeight?: number;
  cueHeroWeight?: number;
  cueEventDensity?: number;
  stageCueFamily?: StageCueFamily;
  stageCueDominance?: StageCueDominance;
  stageSpendProfile?: StageSpendProfile;
  stageWorldMode?: StageWorldMode;
  stageCompositorMode?: StageCompositorMode;
  stageResidueMode?: StageResidueMode;
  stageTransformIntent?: StageTransformIntent;
  stageHeroScaleMin?: number;
  stageHeroScaleMax?: number;
  stageHeroAnchorLane?: StageHeroAnchorLane;
  stageHeroAnchorStrength?: number;
  stageExposureCeiling?: number;
  stageBloomCeiling?: number;
  stageRingAuthority?: StageRingAuthority;
  stageWashoutSuppression?: number;
  stageMotionPhrase?: StageMotionPhrase;
  stageCameraPhrase?: StageMotionPhrase;
  stageHeroForm?: StageHeroForm;
  stageHeroAccentForm?: StageHeroForm;
  stageHeroFormHoldSeconds?: number;
  stagePaletteHoldSeconds?: number;
  stageScreenEffectFamily?: StageScreenEffectFamily;
  stageScreenEffectIntensity?: number;
  stageScreenEffectDirectionalBias?: number;
  stageScreenEffectMemoryBias?: number;
  stageScreenEffectCarveBias?: number;
  stageHeroScaleBias?: number;
  stageHeroStageX?: number;
  stageHeroStageY?: number;
  stageHeroDepthBias?: number;
  stageHeroMotionBias?: number;
  stageHeroMorphBias?: number;
  stageShotClass?: StageShotClass;
  stageTransitionClass?: StageTransitionClass;
  stageEventScale?: StageEventScale;
  stageTempoCadenceMode?: StageTempoCadenceMode;
  stageCompositionSafety?: number;
  stageFallbackDemoteHero?: boolean;
  stageFallbackWidenShot?: boolean;
  stageFallbackForceWorldTakeover?: boolean;
  heroScale?: number;
  heroScreenX?: number;
  heroScreenY?: number;
  heroCoverageEstimate?: number;
  heroOffCenterPenalty?: number;
  heroDepthPenalty?: number;
  heroTranslateX?: number;
  heroTranslateY?: number;
  heroTranslateZ?: number;
  heroRotationPitch?: number;
  heroRotationYaw?: number;
  heroRotationRoll?: number;
  chamberTranslateX?: number;
  chamberTranslateY?: number;
  chamberTranslateZ?: number;
  chamberRotationPitch?: number;
  chamberRotationYaw?: number;
  chamberRotationRoll?: number;
  cameraTranslateX?: number;
  cameraTranslateY?: number;
  cameraTranslateZ?: number;
  cameraRotationPitch?: number;
  cameraRotationYaw?: number;
  cameraRotationRoll?: number;
  ringAuthority?: number;
  chamberPresenceScore?: number;
  frameHierarchyScore?: number;
  compositionSafetyFlag?: boolean;
  compositionSafetyScore?: number;
  overbright?: number;
  ringBeltPersistence?: number;
  wirefieldDensityScore?: number;
  worldDominanceDelivered?: number;
  stageFallbackHeroOverreach?: boolean;
  stageFallbackRingOverdraw?: boolean;
  stageFallbackOverbrightRisk?: boolean;
  stageFallbackWashoutRisk?: boolean;
  afterImageDamp?: number;
  atmosphereMatterState: AtmosphereMatterState;
  atmosphereGas: number;
  atmosphereLiquid: number;
  atmospherePlasma: number;
  atmosphereCrystal: number;
  atmospherePressure: number;
  atmosphereIonization: number;
  atmosphereResidue: number;
  atmosphereStructureReveal: number;
  assetLayerActivity: VisualAssetLayerActivity;
};

export type VisualTelemetrySummary = {
  dominantQualityTier: QualityTier | 'unknown';
  exposureMean: number;
  exposurePeak: number;
  bloomStrengthMean: number;
  bloomStrengthPeak: number;
  bloomThresholdMean: number;
  bloomRadiusMean?: number;
  bloomRadiusPeak?: number;
  afterImageDampMean?: number;
  afterImageDampPeak?: number;
  ambientGlowMean: number;
  ambientGlowPeak: number;
  eventGlowMean: number;
  eventGlowPeak: number;
  worldGlowMean: number;
  heroGlowMean: number;
  shellGlowMean: number;
  atmosphereMatterStateSpread?: Record<AtmosphereMatterState, number>;
  dominantAtmosphereMatterState?: AtmosphereMatterState;
  atmosphereGasMean?: number;
  atmosphereLiquidMean?: number;
  atmospherePlasmaMean?: number;
  atmosphereCrystalMean?: number;
  atmospherePressureMean?: number;
  atmospherePressurePeak?: number;
  atmosphereIonizationMean?: number;
  atmosphereIonizationPeak?: number;
  atmosphereResidueMean?: number;
  atmosphereResiduePeak?: number;
  atmosphereStructureRevealMean?: number;
  atmosphereStructureRevealPeak?: number;
  dominantShowFamily: string;
  showFamilySpread: Record<string, number>;
  actSpread: Record<ShowAct, number>;
  dominantAct: ShowAct;
  paletteStateSpread: Record<PaletteState, number>;
  paletteStateSpreadByAct?: Record<ShowAct, Record<PaletteState, number>>;
  paletteStateSpreadByFamily?: Record<StageCueFamily, Record<PaletteState, number>>;
  dominantPaletteState: PaletteState;
  stageCueFamilySpread: Record<StageCueFamily, number>;
  dominantStageCueFamily: StageCueFamily;
  stageWorldModeSpread?: Record<StageWorldMode, number>;
  stageWorldModeSpreadByFamily?: Record<StageCueFamily, Record<StageWorldMode, number>>;
  dominantStageWorldMode?: StageWorldMode;
  macroEventSpread: Record<string, number>;
  dominantMacroEvent: string;
  heroHueRange: number;
  worldHueRange: number;
  temporalWindowMeans: VisualTemporalWindows;
  spendProfileSpread?: Record<StageSpendProfile, number>;
  dominantSpendProfile?: StageSpendProfile;
  overbrightRate?: number;
  overbrightPeak?: number;
  heroScaleMean?: number;
  heroScalePeak?: number;
  heroScreenXMean?: number;
  heroScreenYMean?: number;
  ringAuthorityMean?: number;
  stageExposureCeilingMean?: number;
  stageBloomCeilingMean?: number;
  stageWashoutSuppressionMean?: number;
  stageHeroScaleMinMean?: number;
  stageHeroScaleMaxMean?: number;
  stageRingAuthoritySpread?: Record<StageRingAuthority, number>;
  dominantStageRingAuthority?: StageRingAuthority;
  stageShotClassSpread?: Record<StageShotClass, number>;
  stageShotClassSpreadByFamily?: Record<StageCueFamily, Record<StageShotClass, number>>;
  dominantStageShotClass?: StageShotClass;
  stageTransitionClassSpread?: Record<StageTransitionClass, number>;
  dominantStageTransitionClass?: StageTransitionClass;
  stageTempoCadenceModeSpread?: Record<StageTempoCadenceMode, number>;
  dominantStageTempoCadenceMode?: StageTempoCadenceMode;
  actEntropy?: number;
  paletteEntropy?: number;
  stageShotClassEntropy?: number;
  stageWorldModeEntropy?: number;
  actLongestRunMs?: number;
  paletteStateLongestRunMs?: number;
  stageShotClassLongestRunMs?: number;
  stageWorldModeLongestRunMs?: number;
  stageCompositionSafetyMean?: number;
  compositionSafetyRate?: number;
  heroCoverageMean?: number;
  heroCoveragePeak?: number;
  heroOffCenterPenaltyMean?: number;
  heroOffCenterPenaltyPeak?: number;
  heroDepthPenaltyMean?: number;
  heroDepthPenaltyPeak?: number;
  chamberPresenceMean?: number;
  frameHierarchyMean?: number;
  ringBeltPersistenceMean?: number;
  ringBeltPersistencePeak?: number;
  wirefieldDensityMean?: number;
  wirefieldDensityPeak?: number;
  worldDominanceDeliveredMean?: number;
  heroTravelRangeX?: number;
  heroTravelRangeY?: number;
  heroTravelRangeZ?: number;
  heroRotationVariancePitch?: number;
  heroRotationVarianceYaw?: number;
  heroRotationVarianceRoll?: number;
  chamberTravelRangeX?: number;
  chamberTravelRangeY?: number;
  chamberTravelRangeZ?: number;
  chamberRotationVariancePitch?: number;
  chamberRotationVarianceYaw?: number;
  chamberRotationVarianceRoll?: number;
  cameraTravelRangeX?: number;
  cameraTravelRangeY?: number;
  cameraTravelRangeZ?: number;
  cameraRotationVariancePitch?: number;
  cameraRotationVarianceYaw?: number;
  cameraRotationVarianceRoll?: number;
  heroOverreachFallbackRate?: number;
  ringOverdrawFallbackRate?: number;
  overbrightFallbackRate?: number;
  washoutFallbackRate?: number;
  qualityTransitionCount?: number;
  firstQualityDowngradeMs?: number;
  assetLayerSummary: VisualAssetLayerSummary;
};

export type CaptureQualityFlag =
  | 'manualCustom'
  | 'oversizedWindow'
  | 'multiEventWindow'
  | 'safeTierActive'
  | 'highAmbientGlow'
  | 'lowPaletteVariation'
  | 'undercommittedDrop'
  | 'weakPhraseRelease';

export const DEFAULT_VISUAL_TEMPORAL_WINDOWS: VisualTemporalWindows = {
  preBeatLift: 0,
  beatStrike: 0,
  postBeatRelease: 0,
  interBeatFloat: 0,
  barTurn: 0,
  phraseResolve: 0
};

export const DEFAULT_VISUAL_CUE_STATE: VisualCueState = {
  cueClass: 'brood',
  intensity: 0,
  attack: 0,
  sustain: 0,
  decay: 0,
  screenWeight: 0,
  residueWeight: 0,
  worldWeight: 0.5,
  heroWeight: 0.65,
  eventDensity: 0.12
};

export const DEFAULT_STAGE_CUE_PLAN: StageCuePlan = {
  family: 'brood',
  dominance: 'hero',
  spendProfile: 'withheld',
  worldMode: 'hold',
  compositorMode: 'none',
  residueMode: 'none',
  transformIntent: 'hold',
  stageWeight: 0.18,
  chamberWeight: 0.3,
  heroWeight: 0.7,
  worldWeight: 0.48,
  screenWeight: 0.08,
  residueWeight: 0.04,
  eventDensity: 0.12,
  subtractiveAmount: 0.06,
  wipeAmount: 0,
  flashAmount: 0,
  heroScaleMin: 0.34,
  heroScaleMax: 0.82,
  heroAnchorLane: 'center',
  heroAnchorStrength: 0.18,
  exposureCeiling: 0.8,
  bloomCeiling: 0.5,
  ringAuthority: 'background-scaffold',
  washoutSuppression: 0.18,
  motionPhrase: 'drift-orbit',
  cameraPhrase: 'drift-orbit',
  heroForm: 'orb',
  heroAccentForm: 'diamond',
  heroFormHoldSeconds: 4.2,
  paletteTargets: {
    'void-cyan': 0.52,
    'tron-blue': 0.2,
    'acid-lime': 0.08,
    'solar-magenta': 0.12,
    'ghost-white': 0.08
  },
  paletteHoldSeconds: 4.4,
  screenEffectIntent: {
    family: 'residue',
    intensity: 0.1,
    directionalBias: 0.08,
    memoryBias: 0.12,
    carveBias: 0.06
  },
  heroScaleBias: -0.12,
  heroStageX: 0,
  heroStageY: -0.04,
  heroDepthBias: -0.08,
  heroMotionBias: 0.18,
  heroMorphBias: 0.24
};

export const DEFAULT_STAGE_COMPOSITION_PLAN: StageCompositionPlan = {
  shotClass: 'anchor',
  transitionClass: 'hold',
  eventScale: 'micro',
  tempoCadenceMode: 'float',
  heroEnvelope: {
    coverageMin: 0,
    coverageMax: 0.18,
    offCenterMax: 0.2,
    depthMax: 0.18,
    scaleCeiling: 0.82,
    driftAllowance: 0.18,
    travelMinX: 0,
    travelMinY: 0,
    laneTargetX: 0.5,
    laneTargetY: 0.5
  },
  chamberEnvelope: {
    presenceFloor: 0.22,
    dominanceFloor: 0.18,
    ringOpacityCap: 0.18,
    wireDensityCap: 0.22,
    worldTakeoverBias: 0.08
  },
  subtractivePolicy: {
    apertureClamp: 0.08,
    blackoutBias: 0.04,
    wipeBias: 0,
    residueBias: 0.04
  },
  compositionSafety: 0.74,
  fallbackDemoteHero: false,
  fallbackWidenShot: false,
  fallbackForceWorldTakeover: false
};

export const DEFAULT_VISUAL_TELEMETRY: VisualTelemetryFrame = {
  qualityTier: 'unknown',
  exposure: 1,
  bloomStrength: 0,
  bloomThreshold: 0.2,
  bloomRadius: 0.1,
  ambientGlowBudget: 0,
  eventGlowBudget: 0,
  worldGlowSpend: 0,
  heroGlowSpend: 0,
  shellGlowSpend: 0,
  activeAct: 'void-chamber',
  paletteState: 'void-cyan',
  showFamily: 'eclipse-chamber',
  macroEventsActive: [],
  heroHue: 0,
  worldHue: 0,
  temporalWindows: { ...DEFAULT_VISUAL_TEMPORAL_WINDOWS },
  cueClass: DEFAULT_VISUAL_CUE_STATE.cueClass,
  cueIntensity: DEFAULT_VISUAL_CUE_STATE.intensity,
  cueAttack: DEFAULT_VISUAL_CUE_STATE.attack,
  cueSustain: DEFAULT_VISUAL_CUE_STATE.sustain,
  cueDecay: DEFAULT_VISUAL_CUE_STATE.decay,
  cueScreenWeight: DEFAULT_VISUAL_CUE_STATE.screenWeight,
  cueResidueWeight: DEFAULT_VISUAL_CUE_STATE.residueWeight,
  cueWorldWeight: DEFAULT_VISUAL_CUE_STATE.worldWeight,
  cueHeroWeight: DEFAULT_VISUAL_CUE_STATE.heroWeight,
  cueEventDensity: DEFAULT_VISUAL_CUE_STATE.eventDensity,
  stageCueFamily: DEFAULT_STAGE_CUE_PLAN.family,
  stageCueDominance: DEFAULT_STAGE_CUE_PLAN.dominance,
  stageSpendProfile: DEFAULT_STAGE_CUE_PLAN.spendProfile,
  stageWorldMode: DEFAULT_STAGE_CUE_PLAN.worldMode,
  stageCompositorMode: DEFAULT_STAGE_CUE_PLAN.compositorMode,
  stageResidueMode: DEFAULT_STAGE_CUE_PLAN.residueMode,
  stageTransformIntent: DEFAULT_STAGE_CUE_PLAN.transformIntent,
  stageHeroScaleMin: DEFAULT_STAGE_CUE_PLAN.heroScaleMin,
  stageHeroScaleMax: DEFAULT_STAGE_CUE_PLAN.heroScaleMax,
  stageHeroAnchorLane: DEFAULT_STAGE_CUE_PLAN.heroAnchorLane,
  stageHeroAnchorStrength: DEFAULT_STAGE_CUE_PLAN.heroAnchorStrength,
  stageExposureCeiling: DEFAULT_STAGE_CUE_PLAN.exposureCeiling,
  stageBloomCeiling: DEFAULT_STAGE_CUE_PLAN.bloomCeiling,
  stageRingAuthority: DEFAULT_STAGE_CUE_PLAN.ringAuthority,
  stageWashoutSuppression: DEFAULT_STAGE_CUE_PLAN.washoutSuppression,
  stageMotionPhrase: DEFAULT_STAGE_CUE_PLAN.motionPhrase,
  stageCameraPhrase: DEFAULT_STAGE_CUE_PLAN.cameraPhrase,
  stageHeroForm: DEFAULT_STAGE_CUE_PLAN.heroForm,
  stageHeroAccentForm: DEFAULT_STAGE_CUE_PLAN.heroAccentForm,
  stageHeroFormHoldSeconds: DEFAULT_STAGE_CUE_PLAN.heroFormHoldSeconds,
  stagePaletteHoldSeconds: DEFAULT_STAGE_CUE_PLAN.paletteHoldSeconds,
  stageScreenEffectFamily: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.family,
  stageScreenEffectIntensity: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.intensity,
  stageScreenEffectDirectionalBias:
    DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.directionalBias,
  stageScreenEffectMemoryBias: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.memoryBias,
  stageScreenEffectCarveBias: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.carveBias,
  stageHeroScaleBias: DEFAULT_STAGE_CUE_PLAN.heroScaleBias,
  stageHeroStageX: DEFAULT_STAGE_CUE_PLAN.heroStageX,
  stageHeroStageY: DEFAULT_STAGE_CUE_PLAN.heroStageY,
  stageHeroDepthBias: DEFAULT_STAGE_CUE_PLAN.heroDepthBias,
  stageHeroMotionBias: DEFAULT_STAGE_CUE_PLAN.heroMotionBias,
  stageHeroMorphBias: DEFAULT_STAGE_CUE_PLAN.heroMorphBias,
  stageShotClass: DEFAULT_STAGE_COMPOSITION_PLAN.shotClass,
  stageTransitionClass: DEFAULT_STAGE_COMPOSITION_PLAN.transitionClass,
  stageEventScale: DEFAULT_STAGE_COMPOSITION_PLAN.eventScale,
  stageTempoCadenceMode: DEFAULT_STAGE_COMPOSITION_PLAN.tempoCadenceMode,
  stageCompositionSafety: DEFAULT_STAGE_COMPOSITION_PLAN.compositionSafety,
  stageFallbackDemoteHero: DEFAULT_STAGE_COMPOSITION_PLAN.fallbackDemoteHero,
  stageFallbackWidenShot: DEFAULT_STAGE_COMPOSITION_PLAN.fallbackWidenShot,
  stageFallbackForceWorldTakeover:
    DEFAULT_STAGE_COMPOSITION_PLAN.fallbackForceWorldTakeover,
  heroScale: 0.56,
  heroScreenX: 0.5,
  heroScreenY: 0.5,
  heroCoverageEstimate: 0.12,
  heroOffCenterPenalty: 0,
  heroDepthPenalty: 0,
  heroTranslateX: 0,
  heroTranslateY: 0,
  heroTranslateZ: 0,
  heroRotationPitch: 0,
  heroRotationYaw: 0,
  heroRotationRoll: 0,
  chamberTranslateX: 0,
  chamberTranslateY: 0,
  chamberTranslateZ: 0,
  chamberRotationPitch: 0,
  chamberRotationYaw: 0,
  chamberRotationRoll: 0,
  cameraTranslateX: 0,
  cameraTranslateY: 0,
  cameraTranslateZ: 10.4,
  cameraRotationPitch: 0,
  cameraRotationYaw: 0,
  cameraRotationRoll: 0,
  ringAuthority: 0,
  chamberPresenceScore: 0.18,
  frameHierarchyScore: 0.72,
  compositionSafetyFlag: false,
  compositionSafetyScore: 0.82,
  overbright: 0,
  ringBeltPersistence: 0.08,
  wirefieldDensityScore: 0.16,
  worldDominanceDelivered: 0.18,
  stageFallbackHeroOverreach: false,
  stageFallbackRingOverdraw: false,
  stageFallbackOverbrightRisk: false,
  stageFallbackWashoutRisk: false,
  afterImageDamp: 0.78,
  atmosphereMatterState: 'gas',
  atmosphereGas: 1,
  atmosphereLiquid: 0,
  atmospherePlasma: 0,
  atmosphereCrystal: 0,
  atmospherePressure: 0,
  atmosphereIonization: 0,
  atmosphereResidue: 0,
  atmosphereStructureReveal: 0,
  assetLayerActivity: Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  ) as VisualAssetLayerActivity
};

export const DEFAULT_VISUAL_TELEMETRY_SUMMARY: VisualTelemetrySummary = {
  dominantQualityTier: 'unknown',
  exposureMean: 0,
  exposurePeak: 0,
  bloomStrengthMean: 0,
  bloomStrengthPeak: 0,
  bloomThresholdMean: 0,
  bloomRadiusMean: 0,
  bloomRadiusPeak: 0,
  afterImageDampMean: 0,
  afterImageDampPeak: 0,
  ambientGlowMean: 0,
  ambientGlowPeak: 0,
  eventGlowMean: 0,
  eventGlowPeak: 0,
  worldGlowMean: 0,
  heroGlowMean: 0,
  shellGlowMean: 0,
  atmosphereMatterStateSpread: {
    gas: 0,
    liquid: 0,
    plasma: 0,
    crystal: 0
  },
  dominantAtmosphereMatterState: 'gas',
  atmosphereGasMean: 0,
  atmosphereLiquidMean: 0,
  atmospherePlasmaMean: 0,
  atmosphereCrystalMean: 0,
  atmospherePressureMean: 0,
  atmospherePressurePeak: 0,
  atmosphereIonizationMean: 0,
  atmosphereIonizationPeak: 0,
  atmosphereResidueMean: 0,
  atmosphereResiduePeak: 0,
  atmosphereStructureRevealMean: 0,
  atmosphereStructureRevealPeak: 0,
  dominantShowFamily: 'unknown',
  showFamilySpread: {},
  actSpread: {
    'void-chamber': 0,
    'laser-bloom': 0,
    'matrix-storm': 0,
    'eclipse-rupture': 0,
    'ghost-afterimage': 0
  },
  dominantAct: 'void-chamber',
  paletteStateSpread: {
    'void-cyan': 0,
    'tron-blue': 0,
    'acid-lime': 0,
    'solar-magenta': 0,
    'ghost-white': 0
  },
  paletteStateSpreadByAct: {
    'void-chamber': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'laser-bloom': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'matrix-storm': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'eclipse-rupture': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'ghost-afterimage': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    }
  },
  paletteStateSpreadByFamily: {
    brood: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    gather: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    reveal: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    rupture: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    release: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    haunt: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    reset: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    }
  },
  dominantPaletteState: 'void-cyan',
  stageCueFamilySpread: {
    brood: 0,
    gather: 0,
    reveal: 0,
    rupture: 0,
    release: 0,
    haunt: 0,
    reset: 0
  },
  dominantStageCueFamily: 'brood',
  stageWorldModeSpread: {
    hold: 0,
    'aperture-cage': 0,
    'fan-sweep': 0,
    'cathedral-rise': 0,
    'collapse-well': 0,
    'ghost-chamber': 0,
    'field-bloom': 0
  },
  stageWorldModeSpreadByFamily: {
    brood: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    gather: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    reveal: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    rupture: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    release: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    haunt: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    reset: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    }
  },
  dominantStageWorldMode: 'hold',
  stageShotClassSpread: {
    anchor: 0,
    pressure: 0,
    rupture: 0,
    worldTakeover: 0,
    aftermath: 0,
    isolate: 0
  },
  stageShotClassSpreadByFamily: {
    brood: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    gather: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    reveal: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    rupture: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    release: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    haunt: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    reset: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    }
  },
  dominantStageShotClass: 'anchor',
  stageTransitionClassSpread: {
    hold: 0,
    wipe: 0,
    collapse: 0,
    iris: 0,
    blackoutCut: 0,
    residueDissolve: 0,
    vectorHandoff: 0
  },
  dominantStageTransitionClass: 'hold',
  stageTempoCadenceModeSpread: {
    float: 0,
    metered: 0,
    driving: 0,
    surge: 0,
    aftermath: 0
  },
  dominantStageTempoCadenceMode: 'float',
  actEntropy: 0,
  paletteEntropy: 0,
  stageShotClassEntropy: 0,
  stageWorldModeEntropy: 0,
  actLongestRunMs: 0,
  paletteStateLongestRunMs: 0,
  stageShotClassLongestRunMs: 0,
  stageWorldModeLongestRunMs: 0,
  macroEventSpread: {},
  dominantMacroEvent: 'unknown',
  heroHueRange: 0,
  worldHueRange: 0,
  temporalWindowMeans: { ...DEFAULT_VISUAL_TEMPORAL_WINDOWS },
  stageCompositionSafetyMean: 0,
  compositionSafetyRate: 0,
  heroCoverageMean: 0,
  heroCoveragePeak: 0,
  heroOffCenterPenaltyMean: 0,
  heroOffCenterPenaltyPeak: 0,
  heroDepthPenaltyMean: 0,
  heroDepthPenaltyPeak: 0,
  chamberPresenceMean: 0,
  frameHierarchyMean: 0,
  ringBeltPersistenceMean: 0,
  ringBeltPersistencePeak: 0,
  wirefieldDensityMean: 0,
  wirefieldDensityPeak: 0,
  worldDominanceDeliveredMean: 0,
  heroTravelRangeX: 0,
  heroTravelRangeY: 0,
  heroTravelRangeZ: 0,
  heroRotationVariancePitch: 0,
  heroRotationVarianceYaw: 0,
  heroRotationVarianceRoll: 0,
  chamberTravelRangeX: 0,
  chamberTravelRangeY: 0,
  chamberTravelRangeZ: 0,
  chamberRotationVariancePitch: 0,
  chamberRotationVarianceYaw: 0,
  chamberRotationVarianceRoll: 0,
  cameraTravelRangeX: 0,
  cameraTravelRangeY: 0,
  cameraTravelRangeZ: 0,
  cameraRotationVariancePitch: 0,
  cameraRotationVarianceYaw: 0,
  cameraRotationVarianceRoll: 0,
  heroOverreachFallbackRate: 0,
  ringOverdrawFallbackRate: 0,
  overbrightFallbackRate: 0,
  washoutFallbackRate: 0,
  qualityTransitionCount: 0,
  firstQualityDowngradeMs: undefined,
  assetLayerSummary: Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [
      layer,
      {
        mean: 0,
        peak: 0,
        activeFrameRate: 0
      }
    ])
  ) as VisualAssetLayerSummary
};
