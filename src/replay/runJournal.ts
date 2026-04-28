import type { AudioDiagnostics, ListeningFrame, ListeningMode } from '../types/audio';
import type { BuildInfo } from '../buildInfo';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import type { VisualTelemetrySummary } from '../types/visual';
import type {
  InputRoutePolicy,
  ResolvedRouteId,
  ShowCapabilityMode,
  ShowStartRoute,
  ShowWorldId,
  LookId,
  WorldPoolId,
  LookPoolId,
  DirectorStanceId
} from '../types/director';
import type {
  ReplayBuildInfo,
  ReplayProofInvalidation,
  ReplayProofInvalidationCode,
  ReplayProofInvalidationDisposition,
  ReplayProofMissionSnapshot,
  ReplayProofReadiness,
  ReplayProofReadinessCheck,
  ReplayProofReadinessCheckId,
  ReplayProofValidity,
  ReplayRunLifecycleState,
  ReplayProofScenarioKind,
  ReplayRunClipReference,
  ReplayRunEventMarker,
  ReplayRunEventMarkerKind,
  ReplayRunJournal,
  ReplayRunJournalSample,
  ReplayRunManifest,
  ReplayRunRecommendationArtifact,
  ReplayRunGateOutcome,
  ReplayRunStillDescriptor,
  ReplayScenarioAssessment,
  ReplayTuningRecommendation
} from './types';

type ScenarioAssessmentInput = {
  declaredScenario?: ReplayProofScenarioKind | null;
  sourceMode: ListeningMode;
  showStartRoute?: ShowStartRoute;
  noTouchWindowPassed?: boolean;
  interventionCount?: number;
  interventionReasons?: string[];
  visualSummary?: VisualTelemetrySummary | null;
  captureMode?: 'manual' | 'auto';
  hasBuildIdentity?: boolean;
};

type ReplayRunJournalContext = {
  buildInfo: ReplayBuildInfo;
  runId: string;
  sourceMode: ListeningMode;
  sourceLabel: string;
  showStartRoute?: ShowStartRoute;
  routePolicy?: InputRoutePolicy;
  resolvedRoute?: ResolvedRouteId;
  showCapabilityMode?: ShowCapabilityMode;
  proofWaveArmed: boolean;
  proofScenarioKind?: ReplayProofScenarioKind | null;
  proofMission?: ReplayProofMissionSnapshot;
  scenarioAssessment?: ReplayScenarioAssessment;
  proofReadiness?: ReplayProofReadiness;
  proofValidity?: ReplayProofValidity;
  lifecycleState?: ReplayRunLifecycleState;
  sessionStartedAt: string;
  sessionElapsedMs: number;
  interventionCount: number;
  interventionReasons: string[];
  noTouchWindowPassed: boolean;
};

type ReplayProofReadinessInput = {
  proofWaveArmed: boolean;
  captureFolderLabel?: string | null;
  captureFolderReady?: boolean;
  showStartRoute?: ShowStartRoute;
  sourceMode?: ListeningMode;
  proofScenarioKind?: ReplayProofScenarioKind | null;
  buildInfo?: Partial<ReplayBuildInfo> | BuildInfo | null;
  replayActive?: boolean;
  routeCapabilities?: {
    microphoneAvailable: boolean;
    displayAudioAvailable: boolean;
  };
};

type ReplayProofValidityInput = {
  proofWaveArmed: boolean;
  readiness?: ReplayProofReadiness | null;
  startedReady?: boolean;
  invalidations?: ReplayProofInvalidation[];
};

type ReplayRunJournalSampleInput = {
  diagnostics: AudioDiagnostics;
  renderer: RendererDiagnostics;
  listeningFrame: ListeningFrame;
  showStartRoute?: ShowStartRoute;
  routePolicy?: InputRoutePolicy;
  resolvedRoute?: ResolvedRouteId;
  showCapabilityMode?: ShowCapabilityMode;
  showWorldId?: ShowWorldId;
  effectiveWorldId?: ShowWorldId;
  lookId?: LookId;
  effectiveLookId?: LookId;
  worldPoolId?: WorldPoolId;
  lookPoolId?: LookPoolId;
  stanceId?: DirectorStanceId;
  proofWaveArmed: boolean;
  proofScenarioKind?: ReplayProofScenarioKind | null;
  proofMission?: ReplayProofMissionSnapshot;
  interventionCount: number;
  noTouchWindowPassed: boolean;
};

const AUTONOMY_BREAKING_PREFIXES = [
  'advanced:',
  'bias:',
  'world:',
  'world-pool:',
  'look:',
  'look-pool:',
  'stance:',
  'save-stance',
  'load-stance:',
  'replay:',
  'manual-capture:',
  'input-device:',
  'capture-folder:',
  'start-route:'
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeStringArray(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function countPositiveValues(record: Record<string, number> | undefined, minimum = 0.1): number {
  if (!record) {
    return 0;
  }

  return Object.values(record).filter(
    (value) => typeof value === 'number' && Number.isFinite(value) && value >= minimum
  ).length;
}

export function isReplayBuildInfoValid(
  buildInfo: Partial<ReplayBuildInfo> | BuildInfo | null | undefined
): boolean {
  const builtAtTime =
    typeof buildInfo?.builtAt === 'string' ? Date.parse(buildInfo.builtAt) : NaN;

  return Boolean(
    buildInfo &&
      typeof buildInfo.version === 'string' &&
      buildInfo.version.trim().length > 0 &&
      typeof buildInfo.commit === 'string' &&
      buildInfo.commit.trim().length > 0 &&
      buildInfo.commit !== 'dev' &&
      buildInfo.commit !== 'unknown' &&
      typeof buildInfo.branch === 'string' &&
      buildInfo.branch.trim().length > 0 &&
      buildInfo.branch !== 'dev' &&
      buildInfo.branch !== 'unknown' &&
      typeof buildInfo.builtAt === 'string' &&
      buildInfo.builtAt.trim().length > 0 &&
      Number.isFinite(builtAtTime) &&
      (buildInfo.lane === 'stable' ||
        buildInfo.lane === 'frontier') &&
      (buildInfo.proofStatus === 'proof-pack' ||
        buildInfo.proofStatus === 'promoted') &&
      buildInfo.dirty === false
  );
}

export function createReplayBuildInfo(buildInfo: BuildInfo): ReplayBuildInfo {
  return {
    ...buildInfo,
    valid: isReplayBuildInfoValid(buildInfo)
  };
}

export function createReplayRunId(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8);

  return `run_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}${pad(date.getSeconds())}_${random}`;
}

export function isAutonomyBreakingIntervention(reason: string | null | undefined): boolean {
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return false;
  }

  return AUTONOMY_BREAKING_PREFIXES.some((prefix) => reason.startsWith(prefix));
}

export function deriveReplayScenarioAssessment(
  input: ScenarioAssessmentInput
): ReplayScenarioAssessment {
  const declaredScenario = input.declaredScenario ?? null;
  const interventionReasons = normalizeStringArray(input.interventionReasons);
  const visualSummary = input.visualSummary ?? null;
  const hasBuildIdentity = input.hasBuildIdentity === true;
  const interventionCount = input.interventionCount ?? 0;
  const noTouchWindowPassed = input.noTouchWindowPassed === true;
  const quietRegime =
    visualSummary?.dominantPerformanceRegime === 'silence-beauty' ||
    visualSummary?.dominantPerformanceRegime === 'room-floor' ||
    visualSummary?.dominantPerformanceRegime === 'suspense' ||
    visualSummary?.dominantSilenceState === 'room-floor' ||
    visualSummary?.dominantSilenceState === 'beauty' ||
    visualSummary?.dominantSilenceState === 'suspense';
  const lowEvent =
    (visualSummary?.eventGlowMean ?? 1) <= 0.14 &&
    (visualSummary?.overbrightPeak ?? 0) <= 0.18;
  const meaningfulChamberRead =
    (visualSummary?.chamberPresenceMean ?? 0) >= 0.18 ||
    (visualSummary?.worldDominanceDeliveredMean ?? 0) >= 0.22;
  const cueDiversity =
    countPositiveValues(visualSummary?.canonicalCueClassSpread) >= 3 ||
    countPositiveValues(visualSummary?.stageCueFamilySpread) >= 3;
  const familyDiversity =
    countPositiveValues(visualSummary?.showFamilySpread, 0.08) >= 3;
  const worldMovement =
    countPositiveValues(visualSummary?.worldAuthorityStateSpread, 0.08) >= 2 ||
    (visualSummary?.stageWorldModeEntropy ?? 0) >= 1;
  const steeringIntervention = interventionReasons.some((reason) =>
    ['bias:', 'world:', 'world-pool:', 'look:', 'look-pool:', 'stance:', 'advanced:'].some(
      (prefix) => reason.startsWith(prefix)
    )
  );
  const autonomyContamination = interventionReasons.some((reason) =>
    isAutonomyBreakingIntervention(reason)
  );
  const routeMatchesPrimary =
    input.showStartRoute === 'pc-audio' || input.sourceMode === 'system-audio';
  const routeMatchesRoom =
    input.showStartRoute === 'microphone' || input.sourceMode === 'room-mic';

  const scores: Array<{
    kind: ReplayProofScenarioKind;
    score: number;
    reasons: string[];
  }> = [
    {
      kind: 'primary-benchmark',
      score:
        (routeMatchesPrimary ? 0.35 : 0) +
        (noTouchWindowPassed ? 0.3 : 0) +
        (hasBuildIdentity ? 0.2 : 0) +
        (interventionCount === 0 ? 0.1 : 0) +
        (!autonomyContamination ? 0.05 : 0),
      reasons: [
        ...(routeMatchesPrimary ? [] : ['primary benchmark should use the PC-audio route']),
        ...(noTouchWindowPassed ? [] : ['primary benchmark needs a cleared no-touch window']),
        ...(hasBuildIdentity ? [] : ['primary benchmark needs recorded build identity']),
        ...(!autonomyContamination
          ? []
          : ['primary benchmark should remain free of autonomy-breaking interventions'])
      ]
    },
    {
      kind: 'room-floor',
      score:
        (routeMatchesRoom ? 0.35 : 0) +
        (quietRegime ? 0.3 : 0) +
        (lowEvent ? 0.15 : 0) +
        (meaningfulChamberRead ? 0.2 : 0),
      reasons: [
        ...(routeMatchesRoom ? [] : ['room-floor should lean on the room-mic path']),
        ...(quietRegime ? [] : ['room-floor needs quiet-state regime evidence'])
      ]
    },
    {
      kind: 'coverage',
      score:
        (cueDiversity ? 0.35 : 0) +
        (familyDiversity ? 0.25 : 0) +
        (worldMovement ? 0.2 : 0) +
        ((visualSummary?.actEntropy ?? 0) >= 1 ? 0.2 : 0),
      reasons: [
        ...(cueDiversity ? [] : ['coverage needs broader cue/cue-family variation']),
        ...(familyDiversity ? [] : ['coverage needs multiple visible family lanes']),
        ...(worldMovement ? [] : ['coverage needs authority/world movement, not one pose'])
      ]
    },
    {
      kind: 'sparse-silence',
      score:
        (quietRegime ? 0.4 : 0) +
        (lowEvent ? 0.25 : 0) +
        (meaningfulChamberRead ? 0.2 : 0) +
        ((visualSummary?.heroCoverageMean ?? 1) <= 0.2 ? 0.15 : 0),
      reasons: [
        ...(quietRegime ? [] : ['sparse/silence needs sustained quiet-state evidence']),
        ...(lowEvent ? [] : ['sparse/silence should stay low-event visually']),
        ...(meaningfulChamberRead ? [] : ['sparse/silence should still read chamber/world'])
      ]
    },
    {
      kind: 'operator-trust',
      score:
        (noTouchWindowPassed ? 0.4 : 0) +
        (interventionCount === 0 ? 0.2 : 0) +
        (!autonomyContamination ? 0.25 : 0) +
        (input.captureMode === 'auto' ? 0.1 : 0) +
        (hasBuildIdentity ? 0.05 : 0),
      reasons: [
        ...(noTouchWindowPassed ? [] : ['operator-trust needs a cleared no-touch window']),
        ...(interventionCount === 0 ? [] : ['operator-trust should not include interventions']),
        ...(!autonomyContamination ? [] : ['operator-trust is contaminated by operator actions']),
        ...(hasBuildIdentity ? [] : ['operator-trust needs recorded build identity'])
      ]
    },
    {
      kind: 'steering',
      score:
        (steeringIntervention ? 0.45 : 0) +
        (declaredScenario === 'steering' ? 0.2 : 0) +
        (interventionCount > 0 ? 0.2 : 0) +
        (!noTouchWindowPassed ? 0.15 : 0),
      reasons: [
        ...(steeringIntervention ? [] : ['steering should include explicit operator steering']),
        ...(interventionCount > 0 ? [] : ['steering needs recorded interventions'])
      ]
    }
  ];

  const ranked = [...scores].sort((left, right) => right.score - left.score);
  const best = ranked[0] ?? null;
  const derivedScenario =
    best && best.score >= 0.45 ? best.kind : declaredScenario === 'coverage' ? 'coverage' : null;
  const mismatchReasons = [];

  if (declaredScenario && derivedScenario && declaredScenario !== derivedScenario) {
    mismatchReasons.push(
      `declared scenario ${declaredScenario} does not match derived scenario ${derivedScenario}`
    );
  } else if (declaredScenario && !derivedScenario) {
    mismatchReasons.push(`declared scenario ${declaredScenario} could not be validated`);
  }

  if (declaredScenario === 'primary-benchmark' && !hasBuildIdentity) {
    mismatchReasons.push('primary-benchmark evidence is missing valid build identity');
  }

  if (declaredScenario === 'operator-trust' && autonomyContamination) {
    mismatchReasons.push('operator-trust evidence includes autonomy-breaking interventions');
  }

  return {
    declaredScenario,
    derivedScenario,
    confidence: clamp01(best?.score ?? 0),
    mismatchReasons,
    validated:
      mismatchReasons.length === 0 &&
      (!declaredScenario || declaredScenario === derivedScenario || derivedScenario !== null)
  };
}

function buildProofReadinessCheck(
  id: ReplayProofReadinessCheckId,
  passed: boolean,
  reason: string,
  blocking = true
): ReplayProofReadinessCheck {
  return {
    id,
    label:
      id === 'capture-folder'
        ? 'Capture folder'
        : id === 'build-identity'
          ? 'Build identity'
          : id === 'scenario-tag'
            ? 'Scenario tag'
            : id === 'replay-inactive'
              ? 'Replay inactive'
              : 'Route coherence',
    passed,
    reason,
    blocking
  };
}

export function deriveReplayProofReadiness(
  input: ReplayProofReadinessInput
): ReplayProofReadiness {
  if (!input.proofWaveArmed) {
    return {
      seriousRun: false,
      ready: false,
      checkedAt: new Date().toISOString(),
      checks: []
    };
  }

  const folderLabel =
    typeof input.captureFolderLabel === 'string' ? input.captureFolderLabel : null;
  const folderReady = input.captureFolderReady === true;
  const folderLooksLikeInbox =
    typeof folderLabel === 'string' &&
    (folderLabel === 'captures/inbox' ||
      folderLabel === 'inbox' ||
      folderLabel.startsWith('inbox/') ||
      folderLabel.startsWith('captures/inbox/') ||
      folderLabel.includes('/inbox/'));
  const scenarioChosen = input.proofScenarioKind != null;
  const buildInfoValid = isReplayBuildInfoValid(input.buildInfo);
  const replayInactive = input.replayActive !== true;
  const routeCapabilities = input.routeCapabilities ?? {
    microphoneAvailable: true,
    displayAudioAvailable: true
  };
  const resolvedSourceMode =
    input.sourceMode ??
    (input.showStartRoute === 'pc-audio'
      ? 'system-audio'
      : input.showStartRoute === 'combo'
        ? 'hybrid'
        : 'room-mic');

  const routeCoherent =
    input.proofScenarioKind === 'primary-benchmark'
      ? input.showStartRoute === 'pc-audio' &&
        resolvedSourceMode === 'system-audio' &&
        routeCapabilities.displayAudioAvailable
      : input.proofScenarioKind === 'room-floor'
        ? input.showStartRoute === 'microphone' &&
          resolvedSourceMode === 'room-mic' &&
          routeCapabilities.microphoneAvailable
        : input.showStartRoute === 'combo'
          ? routeCapabilities.microphoneAvailable &&
            routeCapabilities.displayAudioAvailable
          : input.showStartRoute === 'pc-audio'
            ? routeCapabilities.displayAudioAvailable
            : routeCapabilities.microphoneAvailable;

  const checks = [
    buildProofReadinessCheck(
      'capture-folder',
      folderReady && folderLooksLikeInbox,
      folderReady
        ? folderLooksLikeInbox
          ? `Capture folder "${folderLabel}" is writable and points at the inbox.`
          : `Capture folder "${folderLabel}" is writable, but serious proof requires the repo inbox.`
        : 'Choose a writable captures/inbox folder before starting a serious proof run.'
    ),
    buildProofReadinessCheck(
      'build-identity',
      buildInfoValid,
      buildInfoValid
        ? 'Build identity is recorded and non-dev.'
        : 'Build identity is missing, invalid, or still points at a dev build.'
    ),
    buildProofReadinessCheck(
      'scenario-tag',
      scenarioChosen,
      scenarioChosen
        ? `Scenario "${input.proofScenarioKind}" is selected.`
        : 'Select a proof mission before starting a serious proof run.'
    ),
    buildProofReadinessCheck(
      'replay-inactive',
      replayInactive,
      replayInactive
        ? 'Replay is inactive.'
        : 'Return to live mode before starting a serious proof run.'
    ),
    buildProofReadinessCheck(
      'route-coherence',
      routeCoherent,
      input.proofScenarioKind === 'primary-benchmark'
        ? 'Primary benchmark must start from the PC Audio route with display-audio support.'
        : input.proofScenarioKind === 'room-floor'
          ? 'Room-floor proof must start from the Microphone route with room-mic support.'
          : 'Route and input capabilities are coherent enough for this proof mission.'
    )
  ];

  return {
    seriousRun: true,
    ready: checks.every((check) => !check.blocking || check.passed),
    checkedAt: new Date().toISOString(),
    checks
  };
}

function resolveRecoveryGuidance(
  invalidations: ReplayProofInvalidation[],
  readiness: ReplayProofReadiness | null | undefined
): string | null {
  if (invalidations.length === 0) {
    if (readiness?.seriousRun && readiness.ready !== true) {
      return 'Fix the blocking proof-readiness checks, then restart the serious run.';
    }

    return null;
  }

  const latest = invalidations[invalidations.length - 1];

  switch (latest.recommendedDisposition) {
    case 'archive-run':
      return 'This run should be archived as exploratory only. Do not treat it as current proof.';
    case 'continue-exploratory':
      return 'You can continue exploring, but this run no longer counts as serious proof.';
    case 'restart-run':
    default:
      return 'Restart the serious run after fixing the invalidation cause.';
  }
}

export function buildReplayProofInvalidation(
  code: ReplayProofInvalidationCode,
  timestampMs: number,
  reason: string,
  recommendedDisposition: ReplayProofInvalidationDisposition
): ReplayProofInvalidation {
  return {
    code,
    timestampMs,
    reason,
    recommendedDisposition
  };
}

export function deriveReplayProofValidity(
  input: ReplayProofValidityInput
): ReplayProofValidity {
  const readiness = input.readiness ?? null;
  const invalidations = Array.isArray(input.invalidations) ? input.invalidations : [];
  const startedReady = input.startedReady ?? readiness?.ready === true;
  const seriousRun = input.proofWaveArmed === true;

  let verdict: ReplayProofValidity['verdict'] = 'exploratory';
  let currentProofEligible = false;

  if (seriousRun) {
    if (!startedReady || readiness?.ready !== true || invalidations.length > 0) {
      verdict = 'invalid';
      currentProofEligible = false;
    } else {
      verdict = 'valid';
      currentProofEligible = true;
    }
  }

  return {
    verdict,
    currentProofEligible,
    startedReady,
    lastCheckedAt: new Date().toISOString(),
    invalidations: [...invalidations],
    recoveryGuidance: resolveRecoveryGuidance(invalidations, readiness)
  };
}

export function createReplayRunJournal(context: ReplayRunJournalContext): ReplayRunJournal {
  const now = new Date().toISOString();

  return {
    version: 1,
    metadata: {
      app: 'visulive',
      artifactType: 'run-journal',
      runId: context.runId,
      createdAt: now,
      updatedAt: now,
      buildInfo: context.buildInfo,
      showStartRoute: context.showStartRoute,
      routePolicy: context.routePolicy,
      resolvedRoute: context.resolvedRoute,
      showCapabilityMode: context.showCapabilityMode,
      sourceLabel: context.sourceLabel,
      sourceMode: context.sourceMode,
      proofWaveArmed: context.proofWaveArmed,
      proofScenarioKind: context.proofScenarioKind ?? null,
      proofMission: context.proofMission,
      scenarioAssessment: context.scenarioAssessment,
      proofReadiness: context.proofReadiness,
      proofValidity: context.proofValidity,
      lifecycleState: context.lifecycleState ?? 'inbox',
      sessionStartedAt: context.sessionStartedAt,
      sessionElapsedMs: context.sessionElapsedMs,
      interventionCount: context.interventionCount,
      interventionReasons: [...context.interventionReasons],
      noTouchWindowPassed: context.noTouchWindowPassed,
      clipCount: 0,
      checkpointStillCount: 0
    },
    samples: [],
    markers: [],
    checkpointStills: [],
    clips: []
  };
}

export function buildReplayRunJournalSample(
  input: ReplayRunJournalSampleInput
): ReplayRunJournalSample {
  const telemetry = input.renderer.visualTelemetry;

  return {
    timestampMs: input.listeningFrame.timestampMs,
    source: {
      sourceMode: input.diagnostics.sourceMode,
      sourceLabel: input.diagnostics.deviceLabel || 'Unknown source',
      selectedInputId: input.diagnostics.selectedInputId,
      rawPathGranted: input.diagnostics.rawPathGranted,
      displayAudioGranted: input.diagnostics.displayAudioGranted
    },
    audio: {
      showState: input.listeningFrame.showState,
      state: input.listeningFrame.state,
      momentKind: input.listeningFrame.momentKind,
      performanceIntent: input.listeningFrame.performanceIntent,
      confidence: input.listeningFrame.confidence,
      beatConfidence: input.listeningFrame.beatConfidence,
      musicConfidence: input.listeningFrame.musicConfidence,
      dropImpact: input.listeningFrame.dropImpact,
      sectionChange: input.listeningFrame.sectionChange,
      releaseTail: input.listeningFrame.releaseTail,
      speechConfidence: input.listeningFrame.speechConfidence,
      ambienceConfidence: input.listeningFrame.ambienceConfidence
    },
    renderer: {
      backend: input.renderer.backend,
      qualityTier: input.renderer.qualityTier,
      fps: input.renderer.fps,
      frameTimeMs: input.renderer.frameTimeMs,
      warnings: [...input.renderer.warnings]
    },
    direction: {
      showStartRoute: input.showStartRoute,
      routePolicy: input.routePolicy,
      resolvedRoute: input.resolvedRoute,
      showCapabilityMode: input.showCapabilityMode,
      showWorldId: input.showWorldId,
      effectiveWorldId: input.effectiveWorldId,
      lookId: input.lookId,
      effectiveLookId: input.effectiveLookId,
      worldPoolId: input.worldPoolId,
      lookPoolId: input.lookPoolId,
      stanceId: input.stanceId
    },
    stage: {
      canonicalCueClass: telemetry.canonicalCueClass,
      stageCueFamily: telemetry.stageCueFamily,
      stageIntent: telemetry.stageIntent,
      worldAuthorityState: telemetry.worldAuthorityState,
      silenceState: telemetry.silenceState,
      performanceRegime: telemetry.performanceRegime,
      stageWorldMode: telemetry.stageWorldMode
    },
    authority: {
      heroCoverageEstimate: telemetry.heroCoverageEstimate,
      ringAuthority: telemetry.ringAuthority,
      chamberPresenceScore: telemetry.chamberPresenceScore,
      worldDominanceDelivered: telemetry.worldDominanceDelivered,
      compositionSafetyScore: telemetry.compositionSafetyScore,
      compositionSafetyFlag: telemetry.compositionSafetyFlag,
      overbright: telemetry.overbright,
      ringBeltPersistence: telemetry.ringBeltPersistence,
      wirefieldDensityScore: telemetry.wirefieldDensityScore
    },
    autonomy: {
      interventionCount: input.interventionCount,
      noTouchWindowPassed: input.noTouchWindowPassed,
      proofScenarioKind: input.proofScenarioKind ?? null,
      proofMissionKind: input.proofMission?.kind,
      proofWaveArmed: input.proofWaveArmed
    }
  };
}

export function buildReplayRunEventMarker(
  kind: ReplayRunEventMarkerKind,
  timestampMs: number,
  reason: string,
  metadata?: Record<string, string | number | boolean | null>
): ReplayRunEventMarker {
  return {
    id: `${kind}_${timestampMs}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    timestampMs,
    reason,
    metadata
  };
}

export function buildReplayRunManifest(
  journal: ReplayRunJournal,
  options: {
    journalFileName: string;
    clipFiles: string[];
    stillFiles: string[];
    reviewNoteFileName?: string;
  }
): ReplayRunManifest {
  return {
    version: 1,
    metadata: {
      app: 'visulive',
      artifactType: 'run-manifest',
      runId: journal.metadata.runId,
      updatedAt: journal.metadata.updatedAt,
      buildInfo: journal.metadata.buildInfo,
      proofScenarioKind: journal.metadata.proofScenarioKind ?? null,
      proofMission: journal.metadata.proofMission,
      scenarioAssessment: journal.metadata.scenarioAssessment,
      proofReadiness: journal.metadata.proofReadiness,
      proofValidity: journal.metadata.proofValidity,
      lifecycleState: journal.metadata.lifecycleState,
      clipCount: options.clipFiles.length,
      stillCount: options.stillFiles.length,
      sampleCount: journal.samples.length,
      markerCount: journal.markers.length
    },
    journalFileName: options.journalFileName,
    clipFiles: [...options.clipFiles],
    stillFiles: [...options.stillFiles],
    reviewNoteFileName:
      options.reviewNoteFileName ?? journal.metadata.reviewNoteFileName,
    recommendationFileName: journal.metadata.recommendationFileName
  };
}

export function cloneReplayRunJournalForPersistence(
  journal: ReplayRunJournal
): ReplayRunJournal {
  return JSON.parse(JSON.stringify(journal)) as ReplayRunJournal;
}

export function hasReplayProofInvalidation(
  journal: ReplayRunJournal,
  code: ReplayProofInvalidationCode
): boolean {
  return (
    journal.metadata.proofValidity?.invalidations.some(
      (invalidation) => invalidation.code === code
    ) ?? false
  );
}

export function buildReplayRunPersistenceArtifacts(
  journal: ReplayRunJournal,
  options: {
    journalFileName: string;
    reviewNoteFileName?: string;
  }
): {
  journalSnapshot: ReplayRunJournal;
  manifestSnapshot: ReplayRunManifest;
} {
  const journalSnapshot = cloneReplayRunJournalForPersistence(journal);
  const clipFiles = journalSnapshot.clips.map((clip) => `clips/${clip.fileName}`);
  const stillFiles = journalSnapshot.checkpointStills.map(
    (still) => `stills/${still.fileName}`
  );

  return {
    journalSnapshot,
    manifestSnapshot: buildReplayRunManifest(journalSnapshot, {
      journalFileName: options.journalFileName,
      clipFiles,
      stillFiles,
      reviewNoteFileName: options.reviewNoteFileName
    })
  };
}

export function registerReplayRunStill(
  journal: ReplayRunJournal,
  still: ReplayRunStillDescriptor
): void {
  journal.checkpointStills.push(still);
  journal.metadata.updatedAt = new Date().toISOString();
  journal.metadata.checkpointStillCount = journal.checkpointStills.length;
}

export function registerReplayRunClip(
  journal: ReplayRunJournal,
  clip: ReplayRunClipReference
): void {
  journal.clips.push(clip);
  journal.metadata.updatedAt = new Date().toISOString();
  journal.metadata.clipCount = journal.clips.length;
}

export function buildReplayRunRecommendationArtifact(options: {
  runId: string;
  lifecycleState: ReplayRunLifecycleState;
  proofValidity?: ReplayProofValidity;
  gateOutcomes: ReplayRunGateOutcome[];
  recommendations: ReplayTuningRecommendation[];
}): ReplayRunRecommendationArtifact {
  return {
    version: 1,
    metadata: {
      app: 'visulive',
      artifactType: 'run-recommendations',
      runId: options.runId,
      generatedAt: new Date().toISOString(),
      lifecycleState: options.lifecycleState,
      proofValidity: options.proofValidity,
      gateOutcomes: [...options.gateOutcomes]
    },
    recommendations: [...options.recommendations]
  };
}
