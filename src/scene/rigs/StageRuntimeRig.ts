import type { StageAudioFeatures } from '../../audio/stageAudioFeatures';
import type { ListeningFrame } from '../../types/audio';
import type { RuntimeTuning } from '../../types/tuning';
import type {
  PaletteState,
  ShowAct,
  StageCuePlan,
  VisualCueState,
  VisualTelemetryFrame,
  VisualTemporalWindows
} from '../../types/visual';
import { EventRig } from './EventRig';
import { FramingRig } from './FramingRig';
import type {
  EventFrameContext,
  FramingGovernorSnapshot,
  StageCompositionPlan,
  StageCompositionTelemetry,
  StageIdleContext
} from './types';

export type StageRuntimeFallbackState = {
  heroOverreach: boolean;
  ringOverdraw: boolean;
  overbrightRisk: boolean;
  washoutRisk: boolean;
};

export type StageRuntimeUpdateInput = {
  frame: ListeningFrame;
  elapsedSeconds: number;
  deltaSeconds: number;
  idleBreath: number;
  beatDrive: number;
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
  director: StageIdleContext['director'];
  tuning?: RuntimeTuning;
  previousVisualTelemetry: VisualTelemetryFrame;
};

export type StageRuntimeRigBindings = {
  applyResolvedStage: (
    plan: StageCompositionPlan,
    fallbackState: StageRuntimeFallbackState
  ) => void;
  updateLocomotion: (context: StageIdleContext) => void;
  updateStageFrame: (context: StageIdleContext) => void;
  updateLighting: (context: StageIdleContext) => void;
};

export function createStageIdleContext(
  input: StageRuntimeUpdateInput
): StageIdleContext {
  return {
    frame: input.frame,
    elapsedSeconds: input.elapsedSeconds,
    deltaSeconds: input.deltaSeconds,
    idleBreath: input.idleBreath,
    activeAct: input.activeAct,
    paletteState: input.paletteState,
    cueState: input.cueState,
    cuePlan: input.cuePlan,
    audioFeatures: input.audioFeatures,
    temporalWindows: { ...input.temporalWindows },
    qualityTier: input.qualityTier,
    pointer: { ...input.pointer },
    budgets: { ...input.budgets },
    director: { ...input.director },
    tuning: input.tuning
  };
}

export function createEventFrameContext(
  context: StageIdleContext,
  beatDrive: number
): EventFrameContext {
  return {
    ...context,
    temporalWindows: { ...context.temporalWindows },
    pointer: { ...context.pointer },
    budgets: { ...context.budgets },
    director: { ...context.director },
    beatDrive
  };
}

export function extractPreviousCompositionTelemetry(
  visualTelemetry: VisualTelemetryFrame
): StageCompositionTelemetry {
  return {
    heroCoverageEstimate: visualTelemetry.heroCoverageEstimate,
    heroOffCenterPenalty: visualTelemetry.heroOffCenterPenalty,
    heroDepthPenalty: visualTelemetry.heroDepthPenalty,
    chamberPresenceScore: visualTelemetry.chamberPresenceScore,
    frameHierarchyScore: visualTelemetry.frameHierarchyScore,
    compositionSafetyFlag: visualTelemetry.compositionSafetyFlag,
    ringBeltPersistence: visualTelemetry.ringBeltPersistence,
    wirefieldDensityScore: visualTelemetry.wirefieldDensityScore,
    worldDominanceDelivered: visualTelemetry.worldDominanceDelivered,
    overbright: visualTelemetry.overbright
  };
}

export function readFramingFallbackState(
  snapshot: FramingGovernorSnapshot
): StageRuntimeFallbackState {
  const appliedFallbacks = snapshot.fallbacks.filter((fallback) => fallback.applied);

  return {
    heroOverreach: appliedFallbacks.some(
      (fallback) => fallback.reason === 'hero-overreach'
    ),
    ringOverdraw: appliedFallbacks.some(
      (fallback) => fallback.reason === 'ring-overdraw'
    ),
    overbrightRisk: appliedFallbacks.some(
      (fallback) => fallback.reason === 'overbright-risk'
    ),
    washoutRisk: appliedFallbacks.some(
      (fallback) => fallback.reason === 'washout-risk'
    )
  };
}

export class StageRuntimeRig {
  private readonly eventRig: EventRig;
  private readonly framingRig: FramingRig;
  private readonly bindings: StageRuntimeRigBindings;

  constructor(input: {
    eventRig: EventRig;
    framingRig: FramingRig;
    bindings: StageRuntimeRigBindings;
  }) {
    this.eventRig = input.eventRig;
    this.framingRig = input.framingRig;
    this.bindings = input.bindings;
  }

  prepareStage(input: StageRuntimeUpdateInput): StageIdleContext {
    const stageIdleContext = createStageIdleContext(input);
    const plan = this.framingRig.updatePlan(
      stageIdleContext,
      extractPreviousCompositionTelemetry(input.previousVisualTelemetry)
    );

    this.bindings.applyResolvedStage(
      plan,
      readFramingFallbackState(this.framingRig.getSnapshot())
    );
    this.bindings.updateLocomotion(stageIdleContext);

    return stageIdleContext;
  }

  runStageFrame(stageIdleContext: StageIdleContext, beatDrive: number): void {
    const eventFrameContext = createEventFrameContext(
      stageIdleContext,
      beatDrive
    );

    this.eventRig.updateRouting(stageIdleContext);
    this.bindings.updateStageFrame(stageIdleContext);
    this.eventRig.updateFrame(eventFrameContext);
    this.bindings.updateLighting(stageIdleContext);
    this.framingRig.applyCamera(eventFrameContext);
  }
}
