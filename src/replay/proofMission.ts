import type {
  ReplayProofMissionKind,
  ReplayProofMissionSnapshot,
  ReplayProofScenarioKind
} from './types';
import type { ListeningMode } from '../types/audio';
import type { ShowStartRoute } from '../types/director';

export type ReplayProofMissionProfile = Omit<
  ReplayProofMissionSnapshot,
  'autoCorrections' | 'lockedAt'
>;

export const PROOF_MISSION_PROFILES: Record<
  ReplayProofMissionKind,
  ReplayProofMissionProfile
> = {
  'primary-benchmark': {
    kind: 'primary-benchmark',
    label: 'Primary benchmark',
    scenarioKind: 'primary-benchmark',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 60, max: 480 },
    musicGuidance:
      'Use PC Audio with electronic or EDM-style music that has clear quiet/build/drop/release sections.',
    operatorInstructions: [
      'Do not touch controls after Start Show.',
      'Use a 60-90 second canary first, then a 6-8 minute continuous run.'
    ]
  },
  'operator-trust': {
    kind: 'operator-trust',
    label: 'Operator trust',
    scenarioKind: 'operator-trust',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 360, max: 480 },
    musicGuidance:
      'Use a normal PC Audio show run that a non-developer operator can start and leave alone.',
    operatorInstructions: [
      'Do not use replay, manual capture, Advanced, route changes, or steering.',
      'The run should prove the default operator path is trustworthy.'
    ]
  },
  coverage: {
    kind: 'coverage',
    label: 'Coverage',
    scenarioKind: 'coverage',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 360, max: 600 },
    musicGuidance:
      'Use a broader playlist or track sequence with multiple cue families and authority states.',
    operatorInstructions: [
      'Keep one route and one mission for the whole run.',
      'Do not use manual steering to force variety.'
    ]
  },
  'acoustic-drums-stress': {
    kind: 'acoustic-drums-stress',
    label: 'Acoustic/drums stress',
    scenarioKind: 'coverage',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 240, max: 480 },
    musicGuidance:
      'Use acoustic or live-feeling music with drums, hits, and transients after primary proof is valid.',
    operatorInstructions: [
      'This is a stress/coverage run, not the first canonical primary benchmark.',
      'Do not mix it with room-floor or operator-trust proof.'
    ]
  },
  'room-floor': {
    kind: 'room-floor',
    label: 'Room floor',
    scenarioKind: 'room-floor',
    expectedRoute: 'microphone',
    expectedSourceMode: 'room-mic',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 240, max: 480 },
    musicGuidance:
      'Use quiet room audio through the microphone path with low-energy music present in the room.',
    operatorInstructions: [
      'Use Microphone, not PC Audio.',
      'Do not change routes once the run starts.'
    ]
  },
  'sparse-silence': {
    kind: 'sparse-silence',
    label: 'Sparse/silence',
    scenarioKind: 'sparse-silence',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 180, max: 360 },
    musicGuidance:
      'Use sparse, low-event, or near-silent passages that should still produce authored chamber/world presence.',
    operatorInstructions: [
      'Do not rescue the run with manual steering.',
      'The point is to prove dignity at low input intensity.'
    ]
  },
  'governance-regression': {
    kind: 'governance-regression',
    label: 'Governance regression',
    scenarioKind: 'primary-benchmark',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: true,
    lockAdvancedControls: true,
    expectedDurationSeconds: { min: 180, max: 480 },
    musicGuidance:
      'Use the track or section most likely to reproduce overbright, ring persistence, or weak authority behavior.',
    operatorInstructions: [
      'Keep the route and controls locked.',
      'Use this after a governance code change to verify regression risk.'
    ]
  },
  steering: {
    kind: 'steering',
    label: 'Steering / exploratory',
    scenarioKind: 'steering',
    expectedRoute: 'pc-audio',
    expectedSourceMode: 'system-audio',
    strictNoTouch: false,
    lockAdvancedControls: false,
    expectedDurationSeconds: { min: 60, max: 600 },
    musicGuidance:
      'Use this only for exploratory steering and debugging; it is not no-touch proof.',
    operatorInstructions: [
      'Manual steering is allowed.',
      'Do not promote steering runs as current proof.'
    ]
  }
};

export function isReplayProofMissionKind(
  value: string | null | undefined
): value is ReplayProofMissionKind {
  return Boolean(value && value in PROOF_MISSION_PROFILES);
}

export function getReplayProofMissionProfile(
  kind: ReplayProofMissionKind
): ReplayProofMissionProfile {
  return PROOF_MISSION_PROFILES[kind];
}

export function getDefaultProofMissionKindForScenario(
  scenario: ReplayProofScenarioKind | null | undefined
): ReplayProofMissionKind {
  switch (scenario) {
    case 'room-floor':
      return 'room-floor';
    case 'coverage':
      return 'coverage';
    case 'sparse-silence':
      return 'sparse-silence';
    case 'operator-trust':
      return 'operator-trust';
    case 'steering':
      return 'steering';
    case 'primary-benchmark':
    default:
      return 'primary-benchmark';
  }
}

export function buildReplayProofMissionSnapshot(
  kind: ReplayProofMissionKind,
  options?: {
    lockedAt?: string;
    autoCorrections?: string[];
  }
): ReplayProofMissionSnapshot {
  const profile = getReplayProofMissionProfile(kind);

  return {
    ...profile,
    lockedAt: options?.lockedAt ?? new Date().toISOString(),
    autoCorrections: [...(options?.autoCorrections ?? [])]
  };
}

export function isRouteCompatibleWithProofMission(
  mission: ReplayProofMissionSnapshot,
  route: ShowStartRoute | undefined,
  sourceMode: ListeningMode | undefined
): boolean {
  return route === mission.expectedRoute && sourceMode === mission.expectedSourceMode;
}

export function shouldSuppressProofKeyboardShortcut(input: {
  proofWaveArmed: boolean;
  runtimeActive: boolean;
  key: string;
}): boolean {
  return (
    input.proofWaveArmed &&
    input.runtimeActive &&
    input.key.toLowerCase() === 'm'
  );
}
