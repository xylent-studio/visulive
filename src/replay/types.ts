import type { AnalysisFrame, ListeningFrame } from '../types/audio';
import type { UserControlState } from '../types/tuning';
import type { ListeningMode } from '../types/audio';
import type { BuildInfo } from '../buildInfo';
import type {
  AftermathState,
  AnthologyGraduationStatus,
  CameraPhrase,
  ConsequenceMode,
  DirectorBiasState,
  DirectorStanceId,
  DirectorMusicPhase,
  HeroMutationVerb,
  HeroSpeciesId,
  InputRoutePolicy,
  LightingRigState,
  LookId,
  LookProfileId,
  LookPoolId,
  MixedMediaAssetId,
  MotifId,
  MusicSemanticRegime,
  ParticleFieldRole,
  ResolvedRouteId,
  ShowCapabilityMode,
  ShowConstraintState,
  ShowStartRoute,
  ShowWorldId,
  WorldFamilyId,
  WorldMutationVerb,
  WorldPoolId
} from '../types/director';
import type {
  CaptureQualityFlag,
  VisualAssetLayerSummary,
  VisualTelemetryFrame,
  VisualTelemetrySummary
} from '../types/visual';
import type { ProofStillKind } from './proofStills';

export type ReplayRouteRecommendation = {
  recommendedRoute: ResolvedRouteId;
  strength: 'soft' | 'strong';
  reason: string;
  headline: string;
  detail: string;
};

export type ReplayProofScenarioKind =
  | 'primary-benchmark'
  | 'room-floor'
  | 'coverage'
  | 'sparse-silence'
  | 'operator-trust'
  | 'steering';

export type ReplayProofMissionKind =
  | 'primary-benchmark'
  | 'operator-trust'
  | 'coverage'
  | 'acoustic-drums-stress'
  | 'room-floor'
  | 'sparse-silence'
  | 'governance-regression'
  | 'steering';

export type ReplayProofMissionSnapshot = {
  kind: ReplayProofMissionKind;
  label: string;
  scenarioKind: ReplayProofScenarioKind;
  expectedRoute: ShowStartRoute;
  expectedSourceMode: ListeningMode;
  strictNoTouch: boolean;
  lockAdvancedControls: boolean;
  expectedDurationSeconds: {
    min: number;
    max: number;
  };
  musicGuidance: string;
  operatorInstructions: string[];
  autoCorrections: string[];
  lockedAt: string;
};

export type ReplayBuildInfo = BuildInfo & {
  valid?: boolean;
};

export type ReplayScenarioAssessment = {
  declaredScenario: ReplayProofScenarioKind | null;
  derivedScenario: ReplayProofScenarioKind | null;
  confidence: number;
  mismatchReasons: string[];
  validated: boolean;
};

export type ReplayProofReadinessCheckId =
  | 'capture-folder'
  | 'build-identity'
  | 'scenario-tag'
  | 'replay-inactive'
  | 'route-coherence';

export type ReplayProofReadinessCheck = {
  id: ReplayProofReadinessCheckId;
  label: string;
  passed: boolean;
  reason: string;
  blocking: boolean;
};

export type ReplayProofReadiness = {
  seriousRun: boolean;
  ready: boolean;
  checkedAt: string;
  checks: ReplayProofReadinessCheck[];
};

export type ReplayProofInvalidationCode =
  | 'start-blocked'
  | 'capture-folder-permission-lost'
  | 'capture-save-failed'
  | 'run-journal-save-failed'
  | 'run-finalize-failed'
  | 'replay-entered'
  | 'operator-intervention'
  | 'explicit-exploratory-override'
  | 'route-integrity-break'
  | 'scenario-drift';

export type ReplayProofInvalidationDisposition =
  | 'continue-exploratory'
  | 'restart-run'
  | 'archive-run';

export type ReplayProofInvalidation = {
  code: ReplayProofInvalidationCode;
  timestampMs: number;
  reason: string;
  recommendedDisposition: ReplayProofInvalidationDisposition;
};

export type ReplayProofValidityVerdict = 'exploratory' | 'valid' | 'invalid';

export type ReplayProofValidity = {
  verdict: ReplayProofValidityVerdict;
  currentProofEligible: boolean;
  startedReady: boolean;
  lastCheckedAt: string;
  invalidations: ReplayProofInvalidation[];
  recoveryGuidance: string | null;
};

export type ReplayRunGateOutcome = {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  rationale: string;
};

export type ReplayProofRunState =
  | 'idle'
  | 'setup'
  | 'armed'
  | 'launching'
  | 'live'
  | 'finishing'
  | 'finalized'
  | 'invalidated';

export type ReplayArtifactIntegrityIssue = {
  id: string;
  severity: 'warn' | 'fail';
  reason: string;
  fileName?: string;
};

export type ReplayArtifactIntegrity = {
  verdict: 'pass' | 'warn' | 'fail';
  checkedAt: string;
  clipReferenceCount: number;
  stillReferenceCount: number;
  manifestClipCount?: number;
  manifestStillCount?: number;
  issues: ReplayArtifactIntegrityIssue[];
};

export type ReplayProofMissionEligibilityVerdict =
  | 'eligible'
  | 'ineligible'
  | 'exploratory';

export type ReplayProofMissionEligibility = {
  verdict: ReplayProofMissionEligibilityVerdict;
  currentProofEligible: boolean;
  checkedAt: string;
  missionKind?: ReplayProofMissionKind;
  durationMs: number;
  gates: ReplayRunGateOutcome[];
  rationale: string[];
};

export type ReplaySuppressedIntervention = {
  reason: string;
  source: 'ui' | 'keyboard-shortcut' | 'system';
  timestampMs: number;
};

export type ReplayRunLifecycleState =
  | 'inbox'
  | 'reviewed-candidate'
  | 'canonical'
  | 'archive';

export type ReplayTuningRecommendationSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ReplayTuningOwnerLane =
  | 'evidence-capture-analyzer'
  | 'audio-conductor'
  | 'hero-render-materials'
  | 'chamber-environment-lighting'
  | 'show-direction-cue-logic'
  | 'motion-camera-events'
  | 'operator-ux-controls'
  | 'renderer-safe-tier'
  | 'runtime-governance';

export type ReplayTuningRecommendation = {
  issueId: string;
  severity: ReplayTuningRecommendationSeverity;
  title: string;
  ownerLane: ReplayTuningOwnerLane;
  subsystem: string;
  suspectedCause: string;
  impactedGates: string[];
  targetMetrics: string[];
  recommendedNextProofScenario: ReplayProofScenarioKind | null;
  confidence: number;
  evidence: {
    runId: string;
    clipFiles: string[];
    stillFiles: string[];
  };
};

export type ReplayFrameDiagnostics = {
  humRejection: number;
  musicTrend: number;
  silenceGate: number;
  beatIntervalMs: number;
  rawRms: number;
  rawPeak: number;
  adaptiveCeiling: number;
  noiseFloor: number;
  minimumCeiling: number;
  calibrationPeak: number;
  spectrumLow: number;
  spectrumMid: number;
  spectrumHigh: number;
  roomMusicFloorActive: boolean;
  roomMusicDrive: number;
  aftermathEntryEvidence: number;
  aftermathExitPressure: number;
  stateReason: string;
  showStateReason: string;
  momentReason: string;
  conductorReason: string;
  warnings: string[];
};

export type ReplayCaptureFrame = {
  timestampMs: number;
  listeningFrame: ListeningFrame;
  analysisFrame: AnalysisFrame;
  diagnostics: ReplayFrameDiagnostics;
  visualTelemetry: VisualTelemetryFrame;
};

export type ReplayCaptureMetadata = {
  app: 'visulive';
  artifactType?: 'replay-capture';
  label: string;
  captureMode: 'manual' | 'auto';
  capturedAt: string;
  sourceLabel: string;
  sourceMode: ListeningMode;
  selectedInputId: string | null;
  rawPathGranted: boolean;
  sampleRate: number | null;
  rendererBackend: string;
  qualityTier: string;
  controls: UserControlState;
  launchQuickStartProfileId?: string;
  launchQuickStartProfileLabel?: string;
  quickStartProfileId?: string;
  quickStartProfileLabel?: string;
  showStartRoute?: ShowStartRoute;
  showCapabilityMode?: ShowCapabilityMode;
  showConstraintState?: ShowConstraintState;
  routePolicy?: InputRoutePolicy;
  resolvedRoute?: ResolvedRouteId;
  routeRecommendation?: ReplayRouteRecommendation;
  showWorldId?: ShowWorldId;
  effectiveWorldId?: ShowWorldId;
  lookId?: LookId;
  effectiveLookId?: LookId;
  worldPoolId?: WorldPoolId;
  lookPoolId?: LookPoolId;
  stanceId?: DirectorStanceId;
  anthologyWorldFamilyId?: WorldFamilyId;
  anthologyLookProfileId?: LookProfileId;
  anthologyHeroSpeciesId?: HeroSpeciesId;
  anthologyHeroMutationVerb?: HeroMutationVerb;
  anthologyWorldMutationVerb?: WorldMutationVerb;
  anthologyConsequenceMode?: ConsequenceMode;
  anthologyAftermathState?: AftermathState;
  anthologyLightingRigState?: LightingRigState;
  anthologyCameraPhrase?: CameraPhrase;
  anthologyParticleFieldRole?: ParticleFieldRole;
  anthologyMixedMediaAssetId?: MixedMediaAssetId;
  anthologyMotifId?: MotifId;
  anthologyGraduationStatus?: AnthologyGraduationStatus;
  anthologyMusicPhase?: DirectorMusicPhase;
  anthologyMusicRegime?: MusicSemanticRegime;
  launchSurfaceMode?: 'launch' | 'explore';
  livePanelMode?: 'deck' | 'backstage' | null;
  advancedDrawerTab?: 'style' | 'steer' | 'backstage' | null;
  buildInfo?: ReplayBuildInfo;
  runId?: string;
  sessionStartedAt?: string;
  sessionElapsedMs?: number;
  interventionCount?: number;
  interventionReasons?: string[];
  firstInterventionTimestampMs?: number | null;
  noTouchWindowPassed?: boolean;
  proofScenarioKind?: ReplayProofScenarioKind;
  proofMission?: ReplayProofMissionSnapshot;
  scenarioAssessment?: ReplayScenarioAssessment;
  proofReadiness?: ReplayProofReadiness;
  proofValidity?: ReplayProofValidity;
  proofRunState?: ReplayProofRunState;
  finishedAt?: string;
  finalizedAt?: string;
  proofMissionEligibility?: ReplayProofMissionEligibility;
  suppressedInterventions?: ReplaySuppressedIntervention[];
  artifactIntegrity?: ReplayArtifactIntegrity;
  runLifecycleState?: ReplayRunLifecycleState;
  directorBiasSnapshot?: DirectorBiasState;
  triggerKind?: string;
  triggerReason?: string;
  triggerCount?: number;
  extensionCount?: number;
  startedFromQuickStart?: boolean;
  driftedFromLaunchQuickStart?: boolean;
  triggerTimestampMs?: number;
  bootSummary?: ReplayBootSummary;
  sourceSummary?: ReplaySourceSummary;
  decisionSummary?: ReplayDecisionSummary;
  inputDriftSummary?: ReplayInputDriftSummary;
  proofStills?: ReplayProofStillSummary;
  visualSummary?: VisualTelemetrySummary;
  qualityFlags?: CaptureQualityFlag[];
  eventTimingDisposition?: ReplayEventTimingDisposition;
  eventLatencyMs?: number | null;
};

export type ReplayCapture = {
  version: 1 | 2 | 3;
  metadata: ReplayCaptureMetadata;
  frames: ReplayCaptureFrame[];
};

export type ReplayBootSummary = {
  calibrationDurationMs: number;
  calibrationSampleCount: number;
  calibrationRmsPercentile20: number;
  calibrationPeakPercentile90: number;
  noiseFloor: number;
  minimumCeiling: number;
  calibrationPeak: number;
  adaptiveCeiling: number;
};

export type ReplaySourceSummary = {
  sourceMode: ListeningMode;
  sourceLabel: string;
  selectedInputId: string | null;
  displayAudioGranted: boolean;
  displayTrackLabel: string | null;
  rawPathGranted: boolean;
  provenanceMismatch: boolean;
  provenanceNote?: string;
};

export type ReplayDecisionBucketSummary = {
  dominantReason: string | null;
  transitionCount: number;
  topReasons: Array<{
    value: string;
    count: number;
  }>;
};

export type ReplayDecisionSummary = {
  state: ReplayDecisionBucketSummary;
  showState: ReplayDecisionBucketSummary;
  moment: ReplayDecisionBucketSummary;
  conductor: ReplayDecisionBucketSummary;
};

export type ReplayInputDriftSummary = {
  noiseFloor: ReplayMetricWindowSummary;
  adaptiveCeiling: ReplayMetricWindowSummary;
  silenceGate: ReplayMetricWindowSummary;
  rawRms: ReplayMetricWindowSummary;
  rawPeak: ReplayMetricWindowSummary;
  roomMusicFloorActiveRate: number;
};

export type ReplayMetricWindowSummary = {
  start: number;
  end: number;
  min: number;
  max: number;
};

export type ReplayProofStillDescriptor = {
  kind: ProofStillKind;
  timestampMs: number;
  fileName: string;
};

export type ReplayProofStillSummary = {
  requested: boolean;
  sampleIntervalMs: number;
  saved: ReplayProofStillDescriptor[];
  warning?: string;
};

export type ReplayRunStillKind =
  | 'checkpoint'
  | 'authority'
  | 'quiet'
  | 'trust';

export type ReplayRunStillDescriptor = {
  kind: ReplayRunStillKind;
  timestampMs: number;
  fileName: string;
};

export type ReplayRunJournalSample = {
  timestampMs: number;
  source: {
    sourceMode: ListeningMode;
    sourceLabel: string;
    selectedInputId: string | null;
    rawPathGranted: boolean;
    displayAudioGranted: boolean;
  };
  audio: {
    showState: ListeningFrame['showState'];
    state: ListeningFrame['state'];
    momentKind: ListeningFrame['momentKind'];
    performanceIntent: ListeningFrame['performanceIntent'];
    confidence: number;
    beatConfidence: number;
    musicConfidence: number;
    dropImpact: number;
    sectionChange: number;
    releaseTail: number;
    speechConfidence: number;
    ambienceConfidence: number;
  };
  renderer: {
    backend: string;
    qualityTier: string;
    fps: number;
    frameTimeMs: number;
    warnings: string[];
  };
  direction: {
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
  };
  stage: {
    canonicalCueClass?: VisualTelemetryFrame['canonicalCueClass'];
    stageCueFamily?: VisualTelemetryFrame['stageCueFamily'];
    stageIntent?: VisualTelemetryFrame['stageIntent'];
    worldAuthorityState?: VisualTelemetryFrame['worldAuthorityState'];
    silenceState?: VisualTelemetryFrame['silenceState'];
    performanceRegime?: VisualTelemetryFrame['performanceRegime'];
    stageWorldMode?: VisualTelemetryFrame['stageWorldMode'];
  };
  signatureMoment: {
    activeSignatureMoment?: VisualTelemetryFrame['activeSignatureMoment'];
    signatureMomentPhase?: VisualTelemetryFrame['signatureMomentPhase'];
    signatureMomentIntensity?: number;
    collapseScarAmount?: number;
    cathedralOpenAmount?: number;
    ghostResidueAmount?: number;
    silenceConstellationAmount?: number;
    postConsequenceIntensity?: number;
    postOverprocessRisk?: number;
  };
  authority: {
    heroCoverageEstimate?: number;
    ringAuthority?: number;
    chamberPresenceScore?: number;
    worldDominanceDelivered?: number;
    compositionSafetyScore?: number;
    compositionSafetyFlag?: boolean;
    overbright?: number;
    ringBeltPersistence?: number;
    wirefieldDensityScore?: number;
  };
  autonomy: {
    interventionCount: number;
    noTouchWindowPassed: boolean;
    proofScenarioKind: ReplayProofScenarioKind | null;
    proofMissionKind?: ReplayProofMissionKind;
    proofWaveArmed: boolean;
  };
};

export type ReplayRunEventMarkerKind =
  | 'run-start'
  | 'run-finish'
  | 'run-finalized'
  | 'show-state-change'
  | 'cue-change'
  | 'authority-turn'
  | 'governance-risk'
  | 'quiet-beauty'
  | 'operator-trust-clear'
  | 'quality-downgrade'
  | 'proof-invalidated'
  | 'intervention'
  | 'suppressed-intervention'
  | 'exploratory-override'
  | 'route-change'
  | 'clip-saved';

export type ReplayRunEventMarker = {
  id: string;
  kind: ReplayRunEventMarkerKind;
  timestampMs: number;
  reason: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ReplayRunClipReference = {
  captureLabel: string;
  fileName: string;
  captureMode: 'manual' | 'auto';
  capturedAt: string;
  triggerKind?: string;
  triggerTimestampMs?: number;
  qualityFlags?: CaptureQualityFlag[];
  scenarioAssessment?: ReplayScenarioAssessment;
};

export type ReplayRunJournalMetadata = {
  app: 'visulive';
  artifactType: 'run-journal';
  runId: string;
  createdAt: string;
  updatedAt: string;
  buildInfo: ReplayBuildInfo;
  showStartRoute?: ShowStartRoute;
  routePolicy?: InputRoutePolicy;
  resolvedRoute?: ResolvedRouteId;
  showCapabilityMode?: ShowCapabilityMode;
  sourceLabel: string;
  sourceMode: ListeningMode;
  proofWaveArmed: boolean;
  proofScenarioKind?: ReplayProofScenarioKind | null;
  proofMission?: ReplayProofMissionSnapshot;
  scenarioAssessment?: ReplayScenarioAssessment;
  proofReadiness?: ReplayProofReadiness;
  proofValidity?: ReplayProofValidity;
  proofRunState?: ReplayProofRunState;
  finishedAt?: string;
  finalizedAt?: string;
  proofMissionEligibility?: ReplayProofMissionEligibility;
  suppressedInterventions?: ReplaySuppressedIntervention[];
  artifactIntegrity?: ReplayArtifactIntegrity;
  lifecycleState: ReplayRunLifecycleState;
  sessionStartedAt: string;
  sessionElapsedMs: number;
  interventionCount: number;
  interventionReasons: string[];
  noTouchWindowPassed: boolean;
  clipCount: number;
  checkpointStillCount: number;
  reviewNoteFileName?: string;
  recommendationFileName?: string;
};

export type ReplayRunJournal = {
  version: 1;
  metadata: ReplayRunJournalMetadata;
  samples: ReplayRunJournalSample[];
  markers: ReplayRunEventMarker[];
  checkpointStills: ReplayRunStillDescriptor[];
  clips: ReplayRunClipReference[];
};

export type ReplayRunManifestMetadata = {
  app: 'visulive';
  artifactType: 'run-manifest';
  runId: string;
  updatedAt: string;
  buildInfo: ReplayBuildInfo;
  proofScenarioKind?: ReplayProofScenarioKind | null;
  proofMission?: ReplayProofMissionSnapshot;
  scenarioAssessment?: ReplayScenarioAssessment;
  proofReadiness?: ReplayProofReadiness;
  proofValidity?: ReplayProofValidity;
  proofRunState?: ReplayProofRunState;
  finishedAt?: string;
  finalizedAt?: string;
  proofMissionEligibility?: ReplayProofMissionEligibility;
  suppressedInterventions?: ReplaySuppressedIntervention[];
  artifactIntegrity?: ReplayArtifactIntegrity;
  lifecycleState: ReplayRunLifecycleState;
  clipCount: number;
  stillCount: number;
  sampleCount: number;
  markerCount: number;
};

export type ReplayRunManifest = {
  version: 1;
  metadata: ReplayRunManifestMetadata;
  journalFileName: string;
  clipFiles: string[];
  stillFiles: string[];
  reviewNoteFileName?: string;
  recommendationFileName?: string;
};

export type ReplayRunRecommendationArtifact = {
  version: 1;
  metadata: {
    app: 'visulive';
    artifactType: 'run-recommendations';
    runId: string;
    generatedAt: string;
    lifecycleState: ReplayRunLifecycleState;
    proofValidity?: ReplayProofValidity;
    gateOutcomes: ReplayRunGateOutcome[];
  };
  recommendations: ReplayTuningRecommendation[];
};

export type ReplayAssetLayerSummary = VisualAssetLayerSummary;

export type ReplayEventTimingDisposition =
  | 'aligned'
  | 'lagging'
  | 'precharged'
  | 'unknown';

export type ReplayMode =
  | 'idle'
  | 'recording'
  | 'loaded'
  | 'playing'
  | 'paused';

export type ReplayStatus = {
  mode: ReplayMode;
  captureName: string;
  frameCount: number;
  durationMs: number;
  currentTimeMs: number;
};
