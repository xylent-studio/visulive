import type { AudioDiagnostics, ListeningFrame } from '../types/audio';

export type AutoCaptureTriggerKind = 'drop' | 'section' | 'release' | 'floor';

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

export function detectAutoCaptureTrigger(
  frame: ListeningFrame,
  diagnostics: Pick<
    AudioDiagnostics,
    'roomMusicFloorActive' | 'roomMusicDrive'
  >
): AutoCaptureTrigger | null {
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

  return detectFloorTrigger(frame, diagnostics);
}
