import { DEFAULT_STAGE_COMPOSITION_PLAN } from '../../types/visual';
import type {
  EventFrameContext,
  FramingGovernorSnapshot,
  StageCompositionPlan,
  StageCompositionTelemetry,
  StageFrameContext,
  StageIdleContext
} from './types';
import {
  cloneStageCompositionPlan,
  cloneStageCompositionTelemetry,
  deriveFramingGovernorSnapshot,
  normalizeStageCompositionTelemetry
} from './framing-governor';

export type FramingRigBindings = {
  updateCamera: (context: EventFrameContext) => void;
  updateCompositionPlan?: (plan: StageCompositionPlan) => void;
  dispose?: () => void;
};

function cloneSnapshot(snapshot: FramingGovernorSnapshot): FramingGovernorSnapshot {
  return {
    plan: cloneStageCompositionPlan(snapshot.plan),
    telemetry: cloneStageCompositionTelemetry(snapshot.telemetry),
    overbrightRisk: snapshot.overbrightRisk,
    fallbacks: snapshot.fallbacks.map((fallback) => ({
      ...fallback,
      adjustments: {
        ...fallback.adjustments,
        heroEnvelope: fallback.adjustments.heroEnvelope
          ? { ...fallback.adjustments.heroEnvelope }
          : undefined,
        chamberEnvelope: fallback.adjustments.chamberEnvelope
          ? { ...fallback.adjustments.chamberEnvelope }
          : undefined
      }
    }))
  };
}

function readOverbrightLevel(value: number | boolean | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return value === true ? 1 : 0;
}

export class FramingRig {
  private readonly bindings: FramingRigBindings;
  private snapshot: FramingGovernorSnapshot = {
    plan: cloneStageCompositionPlan(),
    telemetry: undefined,
    overbrightRisk: 0,
    fallbacks: []
  };
  private shotSeconds = 0;
  private lastShotClass: StageCompositionPlan['shotClass'] = this.snapshot.plan.shotClass;

  constructor(bindings: FramingRigBindings) {
    this.bindings = bindings;
  }

  build(): void {
    this.bindings.updateCompositionPlan?.(this.snapshot.plan);
  }

  hold(
    plan: StageCompositionPlan,
    telemetry?: StageCompositionTelemetry
  ): StageCompositionPlan {
    this.snapshot = {
      plan: cloneStageCompositionPlan(plan),
      telemetry: normalizeStageCompositionTelemetry(telemetry),
      overbrightRisk: 0,
      fallbacks: []
    };
    this.shotSeconds = 0;
    this.lastShotClass = this.snapshot.plan.shotClass;
    this.bindings.updateCompositionPlan?.(this.snapshot.plan);
    return this.getPlan();
  }

  updatePlan(
    context: StageFrameContext,
    previousTelemetry?: StageCompositionTelemetry
  ): StageCompositionPlan {
    const normalizedPrevious = normalizeStageCompositionTelemetry(
      previousTelemetry ?? this.snapshot.telemetry
    );
    const nextSnapshot = deriveFramingGovernorSnapshot(
      context,
      normalizedPrevious,
      this.shotSeconds
    );

    this.shotSeconds =
      nextSnapshot.plan.shotClass === this.lastShotClass
        ? this.shotSeconds + context.deltaSeconds
        : 0;
    this.lastShotClass = nextSnapshot.plan.shotClass;
    this.snapshot = nextSnapshot;
    this.bindings.updateCompositionPlan?.(nextSnapshot.plan);

    return this.getPlan();
  }

  getPlan(): StageCompositionPlan {
    return cloneStageCompositionPlan(this.snapshot.plan);
  }

  getSnapshot(): FramingGovernorSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  getTelemetry(): StageCompositionTelemetry | undefined {
    return cloneStageCompositionTelemetry(this.snapshot.telemetry);
  }

  updateCamera(context: EventFrameContext): StageCompositionPlan {
    return this.applyCamera(context);
  }

  applyCamera(context: EventFrameContext): StageCompositionPlan {
    this.bindings.updateCamera(context);
    return this.getPlan();
  }

  dispose(): void {
    this.bindings.dispose?.();
    this.snapshot = {
      plan: cloneStageCompositionPlan(),
      telemetry: undefined,
      overbrightRisk: 0,
      fallbacks: []
    };
    this.shotSeconds = 0;
    this.lastShotClass = this.snapshot.plan.shotClass;
  }
}

export type FramingTelemetryInput = Pick<
  StageCompositionTelemetry,
  | 'heroCoverageEstimate'
  | 'heroOffCenterPenalty'
  | 'heroDepthPenalty'
  | 'chamberPresenceScore'
  | 'frameHierarchyScore'
  | 'compositionSafetyFlag'
  | 'ringBeltPersistence'
  | 'wirefieldDensityScore'
  | 'worldDominanceDelivered'
  | 'overbright'
>;

export function resolveStageCompositionPlan(input: {
  context: StageIdleContext;
  previousTelemetry?: FramingTelemetryInput;
  shotSeconds?: number;
}): StageCompositionPlan {
  const snapshot = deriveFramingGovernorSnapshot(
    input.context,
    normalizeStageCompositionTelemetry(
      input.previousTelemetry as StageCompositionTelemetry | undefined
    ),
    Math.max(0, input.shotSeconds ?? 0)
  );

  return cloneStageCompositionPlan(snapshot.plan);
}
