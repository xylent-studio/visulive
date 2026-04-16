import type { ListeningFrame } from '../../types/audio';
import type { StageAudioFeatures } from '../../audio/stageAudioFeatures';
import type { RuntimeTuning } from '../../types/tuning';
import type {
  PaletteState,
  ShowAct,
  StageChamberEnvelope as VisualStageChamberEnvelope,
  StageCompositionPlan as VisualStageCompositionPlan,
  StageEventScale as VisualStageEventScale,
  StageHeroEnvelope as VisualStageHeroEnvelope,
  StageCuePlan,
  StageHeroAnchorLane,
  StageShotClass as VisualStageShotClass,
  StageRingAuthority,
  StageSpendProfile,
  StageSubtractivePolicy as VisualStageSubtractivePolicy,
  StageTempoCadenceMode as VisualStageTempoCadenceMode,
  StageTransitionClass as VisualStageTransitionClass,
  VisualCueState,
  VisualTemporalWindows
} from '../../types/visual';

export type StageFrameContext = {
  frame: ListeningFrame;
  elapsedSeconds: number;
  deltaSeconds: number;
  idleBreath: number;
  activeAct: ShowAct;
  paletteState: PaletteState;
  cueState: VisualCueState;
  cuePlan: StageCuePlan;
  audioFeatures: StageAudioFeatures;
  temporalWindows: VisualTemporalWindows;
  qualityTier: 'safe' | 'balanced' | 'premium';
  pointer: {
    x: number;
    y: number;
  };
  budgets: {
    ambientGlow: number;
    eventGlow: number;
  };
  director: {
    worldActivity: number;
    spectacle: number;
    geometry: number;
    radiance: number;
    atmosphere: number;
    framing: number;
    colorBias: number;
    colorWarp: number;
    laserDrive: number;
  };
  tuning?: RuntimeTuning;
};

export type StageIdleContext = StageFrameContext;

export type EventRoutingContext = StageFrameContext;

export type EventFrameContext = StageFrameContext & {
  beatDrive: number;
};

export type FramingShotClass = VisualStageShotClass;

export type FramingTransitionClass = VisualStageTransitionClass;

export type FramingEventScale = VisualStageEventScale;

export type FramingGovernorState = 'stable' | 'guarded' | 'fallback';

export type FramingHeroEnvelope = VisualStageHeroEnvelope;

export type FramingChamberEnvelope = VisualStageChamberEnvelope;

export type FramingFallbackReason =
  | 'missing-previous-telemetry'
  | 'hero-overreach'
  | 'overbright-risk'
  | 'washout-risk'
  | 'ring-overdraw';

export type FramingFallbackAdjustments = {
  shotClass?: FramingShotClass;
  transitionClass?: FramingTransitionClass;
  eventScale?: FramingEventScale;
  heroEnvelope?: Partial<FramingHeroEnvelope>;
  chamberEnvelope?: Partial<FramingChamberEnvelope>;
};

export type FramingFallbackRule = {
  id: string;
  reason: FramingFallbackReason;
  priority: number;
  applied: boolean;
  adjustments: FramingFallbackAdjustments;
};

export type StageCompositionTelemetry = {
  shotClass?: FramingShotClass;
  transitionClass?: FramingTransitionClass;
  eventScale?: FramingEventScale;
  tempoCadenceMode?: FramingTempoCadenceMode;
  compositionSafety?: number;
  fallbackDemoteHero?: boolean;
  fallbackWidenShot?: boolean;
  fallbackForceWorldTakeover?: boolean;
  stageShotClass?: FramingShotClass;
  stageTransitionClass?: FramingTransitionClass;
  stageEventScale?: FramingEventScale;
  stageTempoCadenceMode?: FramingTempoCadenceMode;
  stageCompositionSafety?: number;
  stageFallbackDemoteHero?: boolean;
  stageFallbackWidenShot?: boolean;
  stageFallbackForceWorldTakeover?: boolean;
  governorState?: FramingGovernorState;
  spendProfile?: StageSpendProfile;
  heroScale?: number;
  heroScreenX?: number;
  heroScreenY?: number;
  ringAuthority?: number;
  overbright?: number | boolean;
  heroCoverageEstimate?: number;
  heroOffCenterPenalty?: number;
  heroDepthPenalty?: number;
  chamberPresenceScore?: number;
  frameHierarchyScore?: number;
  compositionSafetyFlag?: boolean;
  ringBeltPersistence?: number;
  wirefieldDensityScore?: number;
  worldDominanceDelivered?: number;
  stageHeroScaleMin?: number;
  stageHeroScaleMax?: number;
  stageHeroAnchorLane?: StageHeroAnchorLane;
  stageHeroAnchorStrength?: number;
  stageExposureCeiling?: number;
  stageBloomCeiling?: number;
  stageRingAuthority?: StageRingAuthority;
  stageWashoutSuppression?: number;
};

export type StageCompositionPlan = VisualStageCompositionPlan;

export type FramingSubtractivePolicy = VisualStageSubtractivePolicy;

export type FramingTempoCadenceMode = VisualStageTempoCadenceMode;

export type FramingGovernorSnapshot = {
  plan: StageCompositionPlan;
  telemetry?: StageCompositionTelemetry;
  overbrightRisk: number;
  fallbacks: FramingFallbackRule[];
};
