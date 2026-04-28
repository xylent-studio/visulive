import type { AudioDiagnostics, ListeningFrame } from '../types/audio';
import type { VisualTelemetryFrame, WorldAuthorityState } from '../types/visual';

export type AutoCaptureTriggerKind =
  | 'drop'
  | 'section'
  | 'release'
  | 'floor'
  | 'authority-turn'
  | 'governance-risk'
  | 'quiet-beauty'
  | 'operator-trust-clear'
  | 'quality-downgrade';

export type AutoCaptureTrigger = {
  kind: AutoCaptureTriggerKind;
  label: string;
  reason: string;
  timestampMs: number;
};

export type AutoCaptureTimingProfile = {
  preRollMs: number;
  postRollMs: number;
  maxDurationMs: number;
  extensionWindowMs: number;
  retriggerGapMs: number;
  cooldownMs: number;
  maxExtensions: number;
  maxTriggerCount: number;
  maxCapturesPerRun?: number;
};

export type AutoCaptureDetectionContext = {
  visualTelemetry?: VisualTelemetryFrame | null;
  noTouchWindowPassed?: boolean;
  previousNoTouchWindowPassed?: boolean;
  previousWorldAuthorityState?: WorldAuthorityState | null;
  previousQualityTier?: string | null;
};

export const AUTO_CAPTURE_TIMING_PROFILES: Record<
  AutoCaptureTriggerKind,
  AutoCaptureTimingProfile
> = {
  drop: {
    preRollMs: 2400,
    postRollMs: 2200,
    maxDurationMs: 7600,
    extensionWindowMs: 650,
    retriggerGapMs: 620,
    cooldownMs: 7200,
    maxExtensions: 1,
    maxTriggerCount: 3
  },
  section: {
    preRollMs: 2600,
    postRollMs: 3000,
    maxDurationMs: 9000,
    extensionWindowMs: 900,
    retriggerGapMs: 600,
    cooldownMs: 6500,
    maxExtensions: 2,
    maxTriggerCount: 4
  },
  release: {
    preRollMs: 2600,
    postRollMs: 3200,
    maxDurationMs: 9000,
    extensionWindowMs: 900,
    retriggerGapMs: 600,
    cooldownMs: 6500,
    maxExtensions: 2,
    maxTriggerCount: 4
  },
  floor: {
    preRollMs: 2500,
    postRollMs: 5500,
    maxDurationMs: 12000,
    extensionWindowMs: 1200,
    retriggerGapMs: 420,
    cooldownMs: 4000,
    maxExtensions: 2,
    maxTriggerCount: 4
  },
  'authority-turn': {
    preRollMs: 2200,
    postRollMs: 2600,
    maxDurationMs: 7200,
    extensionWindowMs: 800,
    retriggerGapMs: 520,
    cooldownMs: 5200,
    maxExtensions: 1,
    maxTriggerCount: 3
  },
  'governance-risk': {
    preRollMs: 1800,
    postRollMs: 2600,
    maxDurationMs: 6800,
    extensionWindowMs: 600,
    retriggerGapMs: 540,
    cooldownMs: 18000,
    maxExtensions: 1,
    maxTriggerCount: 2,
    maxCapturesPerRun: 3
  },
  'quiet-beauty': {
    preRollMs: 3200,
    postRollMs: 3600,
    maxDurationMs: 9800,
    extensionWindowMs: 1000,
    retriggerGapMs: 900,
    cooldownMs: 6800,
    maxExtensions: 1,
    maxTriggerCount: 2
  },
  'operator-trust-clear': {
    preRollMs: 2400,
    postRollMs: 2600,
    maxDurationMs: 7200,
    extensionWindowMs: 600,
    retriggerGapMs: 1200,
    cooldownMs: 12000,
    maxExtensions: 0,
    maxTriggerCount: 1
  },
  'quality-downgrade': {
    preRollMs: 1800,
    postRollMs: 2200,
    maxDurationMs: 6200,
    extensionWindowMs: 500,
    retriggerGapMs: 1200,
    cooldownMs: 8000,
    maxExtensions: 0,
    maxTriggerCount: 1
  }
};

export function buildAutoCaptureLabel(
  kind: AutoCaptureTriggerKind,
  date = new Date()
): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `auto_${kind}_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export function getAutoCaptureTriggerPriority(
  kind: AutoCaptureTriggerKind
): number {
  switch (kind) {
    case 'drop':
      return 4;
    case 'section':
      return 3;
    case 'release':
      return 2;
    case 'floor':
      return 1;
    case 'authority-turn':
      return 5;
    case 'governance-risk':
      return 2;
    case 'quality-downgrade':
      return 5;
    case 'operator-trust-clear':
      return 2;
    case 'quiet-beauty':
      return 1;
    default:
      return 0;
  }
}

export function resolveAutoCaptureTimingProfile(
  kind: AutoCaptureTriggerKind
): AutoCaptureTimingProfile {
  return AUTO_CAPTURE_TIMING_PROFILES[kind];
}

export function clampAutoCaptureEndTimestamp(
  firstTimestampMs: number,
  proposedEndTimestampMs: number,
  profile: AutoCaptureTimingProfile
): number {
  return Math.min(firstTimestampMs + profile.maxDurationMs, proposedEndTimestampMs);
}

function detectFloorTrigger(
  frame: ListeningFrame,
  diagnostics: Pick<
    AudioDiagnostics,
    'roomMusicFloorActive' | 'roomMusicDrive'
  >
): AutoCaptureTrigger | null {
  if (
    frame.mode !== 'room-mic' ||
    !diagnostics.roomMusicFloorActive ||
    diagnostics.roomMusicDrive < 0.16 ||
    frame.musicConfidence < 0.28 ||
    frame.speechConfidence > 0.18 ||
    frame.dropImpact > 0.22 ||
    frame.sectionChange > 0.2 ||
    frame.releaseTail > 0.24
  ) {
    return null;
  }

  return {
    kind: 'floor',
    label: 'Quiet Music Floor',
    reason: `roomFloor=${diagnostics.roomMusicDrive.toFixed(3)} music=${frame.musicConfidence.toFixed(3)} speech=${frame.speechConfidence.toFixed(3)}`,
    timestampMs: frame.timestampMs
  };
}

function detectAuthorityTurnTrigger(
  frame: ListeningFrame,
  visual: VisualTelemetryFrame | null | undefined,
  previousWorldAuthorityState: WorldAuthorityState | null | undefined
): AutoCaptureTrigger | null {
  if (!visual) {
    return null;
  }

  const currentWorldAuthority = visual.worldAuthorityState;
  if (
    (currentWorldAuthority !== 'shared' && currentWorldAuthority !== 'dominant') ||
    currentWorldAuthority === previousWorldAuthorityState
  ) {
    return null;
  }

  if (
    (visual.worldDominanceDelivered ?? 0) < 0.22 &&
    (visual.chamberPresenceScore ?? 0) < 0.18
  ) {
    return null;
  }

  return {
    kind: 'authority-turn',
    label: 'Authority Turn',
    reason: `world=${currentWorldAuthority} dominance=${(visual.worldDominanceDelivered ?? 0).toFixed(3)} chamber=${(visual.chamberPresenceScore ?? 0).toFixed(3)}`,
    timestampMs: frame.timestampMs
  };
}

function detectGovernanceRiskTrigger(
  frame: ListeningFrame,
  visual: VisualTelemetryFrame | null | undefined
): AutoCaptureTrigger | null {
  if (!visual) {
    return null;
  }

  const compositionRisk = visual.compositionSafetyFlag === true;
  const overbrightRisk = (visual.overbright ?? 0) >= 0.22;
  const heroRisk =
    (visual.heroCoverageEstimate ?? 0) >= 0.28 &&
    (visual.worldDominanceDelivered ?? 0) <= 0.16;
  const ringRisk =
    (visual.ringBeltPersistence ?? 0) >= 0.28 ||
    visual.stageFallbackRingOverdraw === true;

  if (!compositionRisk && !overbrightRisk && !heroRisk && !ringRisk) {
    return null;
  }

  return {
    kind: 'governance-risk',
    label: 'Governance Risk',
    reason: `safety=${visual.compositionSafetyFlag === true ? 'risk' : 'ok'} overbright=${(visual.overbright ?? 0).toFixed(3)} hero=${(visual.heroCoverageEstimate ?? 0).toFixed(3)} rings=${(visual.ringBeltPersistence ?? 0).toFixed(3)}`,
    timestampMs: frame.timestampMs
  };
}

function detectQuietBeautyTrigger(
  frame: ListeningFrame,
  visual: VisualTelemetryFrame | null | undefined
): AutoCaptureTrigger | null {
  if (!visual) {
    return null;
  }

  if (
    frame.ambienceConfidence < 0.42 ||
    frame.dropImpact > 0.14 ||
    frame.sectionChange > 0.12 ||
    frame.releaseTail > 0.18 ||
    (visual.chamberPresenceScore ?? 0) < 0.18 ||
    (visual.worldDominanceDelivered ?? 0) < 0.16 ||
    (visual.compositionSafetyScore ?? 0.8) < 0.72
  ) {
    return null;
  }

  return {
    kind: 'quiet-beauty',
    label: 'Quiet Beauty',
    reason: `ambience=${frame.ambienceConfidence.toFixed(3)} chamber=${(visual.chamberPresenceScore ?? 0).toFixed(3)} world=${(visual.worldDominanceDelivered ?? 0).toFixed(3)}`,
    timestampMs: frame.timestampMs
  };
}

function detectOperatorTrustClearTrigger(
  frame: ListeningFrame,
  visual: VisualTelemetryFrame | null | undefined,
  noTouchWindowPassed: boolean,
  previousNoTouchWindowPassed: boolean
): AutoCaptureTrigger | null {
  if (
    !noTouchWindowPassed ||
    previousNoTouchWindowPassed ||
    !visual ||
    (visual.compositionSafetyScore ?? 0.8) < 0.74 ||
    (visual.overbright ?? 0) > 0.18
  ) {
    return null;
  }

  return {
    kind: 'operator-trust-clear',
    label: 'Operator Trust Cleared',
    reason: `no-touch cleared with safety=${(visual.compositionSafetyScore ?? 0).toFixed(3)} overbright=${(visual.overbright ?? 0).toFixed(3)}`,
    timestampMs: frame.timestampMs
  };
}

function detectQualityDowngradeTrigger(
  frame: ListeningFrame,
  visual: VisualTelemetryFrame | null | undefined,
  previousQualityTier: string | null | undefined
): AutoCaptureTrigger | null {
  const currentQualityTier = visual?.qualityTier ?? null;
  if (
    !currentQualityTier ||
    !previousQualityTier ||
    currentQualityTier === previousQualityTier
  ) {
    return null;
  }

  const downgraded =
    (previousQualityTier === 'premium' &&
      (currentQualityTier === 'balanced' || currentQualityTier === 'safe')) ||
    (previousQualityTier === 'balanced' && currentQualityTier === 'safe');

  if (!downgraded) {
    return null;
  }

  return {
    kind: 'quality-downgrade',
    label: 'Quality Downgrade',
    reason: `quality ${previousQualityTier} -> ${currentQualityTier}`,
    timestampMs: frame.timestampMs
  };
}

export function detectAutoCaptureTrigger(
  frame: ListeningFrame,
  diagnostics: Pick<
    AudioDiagnostics,
    'roomMusicFloorActive' | 'roomMusicDrive'
  >,
  context?: AutoCaptureDetectionContext
): AutoCaptureTrigger | null {
  const visual = context?.visualTelemetry ?? null;

  const qualityDowngradeTrigger = detectQualityDowngradeTrigger(
    frame,
    visual,
    context?.previousQualityTier
  );
  if (qualityDowngradeTrigger) {
    return qualityDowngradeTrigger;
  }

  const authorityTurnTrigger = detectAuthorityTurnTrigger(
    frame,
    visual,
    context?.previousWorldAuthorityState
  );
  if (authorityTurnTrigger) {
    return authorityTurnTrigger;
  }

  if (
    frame.dropImpact > 0.34 &&
    frame.beatConfidence > 0.22 &&
    (frame.performanceIntent === 'detonate' || frame.sectionChange > 0.24)
  ) {
    return {
      kind: 'drop',
      label: 'Drop Impact',
      reason: `drop=${frame.dropImpact.toFixed(3)} section=${frame.sectionChange.toFixed(3)} intent=${frame.performanceIntent}`,
      timestampMs: frame.timestampMs
    };
  }

  if (
    frame.sectionChange > 0.4 &&
    (frame.showState === 'surge' ||
      frame.showState === 'generative' ||
      frame.performanceIntent === 'ignite' ||
      frame.performanceIntent === 'detonate')
  ) {
    return {
      kind: 'section',
      label: 'Section Change',
      reason: `section=${frame.sectionChange.toFixed(3)} show=${frame.showState}`,
      timestampMs: frame.timestampMs
    };
  }

  if (
    frame.releaseTail > 0.28 &&
    (frame.showState === 'aftermath' || frame.momentKind === 'release')
  ) {
    return {
      kind: 'release',
      label: 'Release Tail',
      reason: `release=${frame.releaseTail.toFixed(3)} resonance=${frame.resonance.toFixed(3)}`,
      timestampMs: frame.timestampMs
    };
  }

  const operatorTrustTrigger = detectOperatorTrustClearTrigger(
    frame,
    visual,
    context?.noTouchWindowPassed === true,
    context?.previousNoTouchWindowPassed === true
  );
  if (operatorTrustTrigger) {
    return operatorTrustTrigger;
  }

  const quietBeautyTrigger = detectQuietBeautyTrigger(frame, visual);
  if (quietBeautyTrigger) {
    return quietBeautyTrigger;
  }

  const floorTrigger = detectFloorTrigger(frame, diagnostics);
  if (floorTrigger) {
    return floorTrigger;
  }

  return detectGovernanceRiskTrigger(frame, visual);
}
