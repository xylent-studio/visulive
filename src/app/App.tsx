import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { BUILD_INFO } from '../buildInfo';
import { DiagnosticsOverlay } from '../debug/DiagnosticsOverlay';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import {
  DEFAULT_AUDIO_DIAGNOSTICS,
  DEFAULT_AUDIO_STATUS,
  DEFAULT_LISTENING_FRAME,
  type AudioDiagnostics,
  type AudioEngineStatus,
  type AudioSnapshot,
  type ListeningFrame,
  type ListeningMode
} from '../types/audio';
import { ReplayController } from '../replay/ReplayController';
import {
  clearStoredCaptureDirectoryHandle,
  ensureCaptureDirectoryPermission,
  fileSystemAccessSupported,
  getCaptureDirectoryDisplayName,
  loadStoredCaptureDirectoryHandle,
  persistCaptureDirectoryHandle,
  pickCaptureDirectoryHandle,
  saveCaptureBlobsToDirectory,
  saveJsonArtifactToDirectory,
  saveReplayCaptureToDirectory
} from '../replay/captureDirectory';
import {
  AUTO_CAPTURE_TIMING_PROFILES,
  buildAutoCaptureLabel,
  clampAutoCaptureEndTimestamp,
  detectAutoCaptureTrigger,
  getAutoCaptureTriggerPriority,
  resolveAutoCaptureTimingProfile,
  type AutoCaptureTriggerKind,
  type AutoCaptureTimingProfile,
  type AutoCaptureTrigger
} from '../replay/autoCapture';
import {
  PROOF_STILL_SAMPLE_INTERVAL_MS,
  buildProofStillFileName,
  dedupeProofStillSelections,
  evaluateProofStillFrame,
  selectClosestProofStillSample,
  type ProofStillKind,
  type ProofStillSample
} from '../replay/proofStills';
import {
  buildReplayCapture,
  cloneReplayCaptureFrame,
  downloadReplayCapture,
  parseReplayCapture
} from '../replay/session';
import {
  buildReplayProofMissionSnapshot,
  getDefaultProofMissionKindForScenario,
  getReplayProofMissionProfile,
  isReplayProofMissionKind,
  shouldSuppressProofKeyboardShortcut
} from '../replay/proofMission';
import {
  buildReplayProofInvalidation,
  buildReplayRunPersistenceArtifacts,
  buildReplayRunEventMarker,
  buildReplayRunJournalSample,
  createReplayBuildInfo,
  createReplayRunId,
  createReplayRunJournal,
  deriveProofMissionEligibility,
  deriveReplayArtifactIntegrityFromJournal,
  deriveReplayProofReadiness,
  deriveReplayProofValidity,
  deriveReplayScenarioAssessment,
  hasReplayProofInvalidation,
  isAutonomyBreakingIntervention,
  isReplayBuildInfoValid,
  registerReplayRunClip,
  registerReplayRunStill,
  shouldApplyReplayProofInvalidation
} from '../replay/runJournal';
import type {
  ReplayCaptureFrame,
  ReplayArtifactIntegrity,
  ReplayProofMissionEligibility,
  ReplayProofInvalidationCode,
  ReplayProofMissionKind,
  ReplayProofMissionSnapshot,
  ReplayProofReadiness,
  ReplayProofRunState,
  ReplayProofReadinessCheck,
  ReplayProofValidity,
  ReplayProofScenarioKind,
  ReplayRunJournal,
  ReplayRunEventMarkerKind,
  ReplayRunLifecycleState,
  ReplayRunStillKind,
  ReplayScenarioAssessment,
  ReplayStatus
} from '../replay/types';
import {
  createSavedStance,
  DEFAULT_ADVANCED_CURATION_STATE,
  DEFAULT_ADVANCED_STEERING_STATE,
  detectRouteCapabilities,
  extractAdvancedSteeringFromBiasState,
  getCompatibilityQuickStartProfileIdFromShowStartRoute,
  LOOK_POOL_DEFINITIONS,
  parseStoredAdvancedCurationState,
  parseStoredAdvancedSteeringState,
  parseStoredSavedStances,
  resolveAutoRouteRecommendation,
  resolveAppliedShowIntent,
  resolveInputRoutePolicyFromShowStartRoute,
  resolveListeningModeFromShowStartRoute,
  resolveRouteIdFromListeningMode,
  sanitizeAdvancedCurationState,
  sanitizeAdvancedSteeringState,
  serializeAdvancedCurationState,
  serializeAdvancedSteeringState,
  serializeDirectorIntent,
  serializeSavedStances,
  WORLD_POOL_DEFINITIONS,
  type AdvancedCurationState,
  type AdvancedSteeringKey,
  type AdvancedSteeringState,
  type SavedStance,
  type ShowStartRoute
} from '../types/director';
import {
  DEFAULT_VISUAL_TELEMETRY,
  type SignatureMomentDevOverride,
  type SignatureMomentKind,
  type SignatureMomentPreviewProfile,
  type SignatureMomentStyle
} from '../types/visual';
import { BackstagePanel } from '../ui/BackstagePanel';
import { ShowHud } from '../ui/ShowHud';
import { ShowLaunchSurface } from '../ui/ShowLaunchSurface';
import {
  DEFAULT_USER_CONTROL_STATE,
  deriveRuntimeTuning,
  getActiveQuickStartProfile,
  QUICK_START_PROFILES,
  serializeUserControlState,
  type QuickStartProfileId,
  type RuntimeTuning,
  type UserControlState
} from '../types/tuning';

const INITIAL_RENDERER_STATE: RendererDiagnostics = {
  backend: 'unavailable',
  ready: false,
  qualityTier: 'balanced',
  devicePixelRatio: 1,
  cappedPixelRatio: 1,
  fps: 0,
  frameTimeMs: 0,
  warnings: [],
  visualTelemetry: {
    ...DEFAULT_VISUAL_TELEMETRY,
    qualityTier: 'balanced'
  }
};

type RendererHandle = {
  start(): Promise<RendererDiagnostics>;
  dispose(): void;
  getDiagnostics(): RendererDiagnostics;
  setTuning(tuning: RuntimeTuning): void;
  setSignatureMomentDevOverride(override: SignatureMomentDevOverride | null): void;
};

type MomentLabKind = Exclude<SignatureMomentKind, 'none'>;

type MomentLabState = {
  available: boolean;
  active: boolean;
  autoCycleActive: boolean;
  disabledReason: string | null;
  kind: MomentLabKind;
  style: SignatureMomentStyle;
  syntheticProfile: SignatureMomentPreviewProfile;
  durationSeconds: number;
  latestReceipt: string | null;
};

type PendingRunCheckpointStill = {
  runId: string;
  timestampMs: number;
  frame: ReplayCaptureFrame;
  kind: ReplayRunStillKind;
  exploratory: boolean;
};

const RUN_CHECKPOINT_STILL_PRIORITY: Record<ReplayRunStillKind, number> = {
  checkpoint: 1,
  quiet: 2,
  authority: 3,
  trust: 4,
  signature: 5,
  'signature-preview': 6
};

const cloneReplayCaptureFrameSnapshot = (
  frame: ReplayCaptureFrame
): ReplayCaptureFrame => ({
  timestampMs: frame.timestampMs,
  listeningFrame: { ...frame.listeningFrame },
  analysisFrame: { ...frame.analysisFrame },
  diagnostics: { ...frame.diagnostics },
  visualTelemetry: { ...frame.visualTelemetry }
});

const buildMissionLockedScenarioAssessment = (
  mission: ReplayProofMissionSnapshot
): ReplayScenarioAssessment => ({
  declaredScenario: mission.scenarioKind,
  derivedScenario: mission.scenarioKind,
  confidence: 1,
  mismatchReasons: [],
  validated: true
});

const CONTROL_STORAGE_KEY = 'visulive-user-controls';
const DIRECTOR_INTENT_STORAGE_KEY = 'visulive-director-intent-v1';
const SHOW_START_ROUTE_STORAGE_KEY = 'visulive-show-start-route-v1';
const ADVANCED_CURATION_STORAGE_KEY = 'visulive-advanced-curation-v1';
const ADVANCED_STEERING_STORAGE_KEY = 'visulive-advanced-steering-v1';
const SAVED_STANCES_STORAGE_KEY = 'visulive-saved-stances-v1';
const INPUT_STORAGE_KEY = 'visulive-audio-input';
const SOURCE_MODE_STORAGE_KEY = 'visulive-source-mode';
const CAPTURE_AUTO_SAVE_STORAGE_KEY = 'visulive-capture-auto-save';
const PROOF_STILLS_STORAGE_KEY = 'visulive-proof-stills';
const PROOF_SCENARIO_STORAGE_KEY = 'visulive-proof-scenario-v1';
const PROOF_MISSION_STORAGE_KEY = 'visulive-proof-mission-v1';
const PROOF_WAVE_STORAGE_KEY = 'visulive-proof-wave-v1';
const MOMENT_LAB_KINDS: MomentLabKind[] = [
  'collapse-scar',
  'cathedral-open',
  'ghost-residue',
  'silence-constellation'
];
const MOMENT_LAB_STYLES: SignatureMomentStyle[] = [
  'auto',
  'contrast-mythic',
  'maximal-neon',
  'ambient-premium'
];
const MOMENT_LAB_PROFILES: SignatureMomentPreviewProfile[] = [
  'natural',
  'drop',
  'reveal',
  'release',
  'quiet'
];
const MAX_CAPTURE_FRAMES = 36000;
const MAX_AUTO_CAPTURE_HISTORY = 32;
const RECENT_AUTO_CAPTURE_DISPLAY_LIMIT = 8;
const RUN_JOURNAL_SAMPLE_INTERVAL_MS = 250;
const RUN_JOURNAL_PERSIST_INTERVAL_MS = 3_000;
const RUN_JOURNAL_PERSIST_RETRY_ATTEMPTS = 3;
const RUN_JOURNAL_PERSIST_RETRY_DELAY_MS = 140;
const RUN_CHECKPOINT_STILL_INTERVAL_MS = 12_000;
const MAX_AUTO_CAPTURE_PRE_ROLL_MS = Math.max(
  ...Object.values(AUTO_CAPTURE_TIMING_PROFILES).map((profile) => profile.preRollMs)
);

type RecordingSummary = {
  active: boolean;
  frameCount: number;
  durationMs: number;
};

type CapturedProofStillSample = ProofStillSample & {
  blob: Blob;
};

type AutoCaptureSession = {
  trigger: AutoCaptureTrigger;
  timingProfile: AutoCaptureTimingProfile;
  frames: ReplayCaptureFrame[];
  proofStillSamples: CapturedProofStillSample[];
  firstTimestampMs: number;
  lastTimestampMs: number;
  lastTriggerTimestampMs: number;
  endTimestampMs: number;
  peakDropImpact: number;
  peakSectionChange: number;
  peakBeatConfidence: number;
  peakMusicConfidence: number;
  triggerCount: number;
  extensionCount: number;
};

type AutoCaptureSummary = {
  id: string;
  label: string;
  triggerLabel: string;
  triggerReason: string;
  capturedAt: string;
  frameCount: number;
  durationMs: number;
  peakDropImpact: number;
  peakSectionChange: number;
  peakBeatConfidence: number;
  peakMusicConfidence: number;
  capture: ReturnType<typeof buildReplayCapture>;
};

type AutoCaptureStatus = {
  enabled: boolean;
  autoDownload: boolean;
  pending: boolean;
  pendingLabel: string | null;
  captureCount: number;
  latestLabel: string | null;
  latestTriggerLabel: string | null;
  latestDurationMs: number;
  latestTriggerReason: string | null;
  currentTriggerProfile: string | null;
  latestTriggerProfile: string | null;
  latestProofStillCount: number;
  proofStillsEnabled: boolean;
};

type CaptureFolderStatus = {
  supported: boolean;
  autoSave: boolean;
  folderName: string | null;
  ready: boolean;
  error: string | null;
  lastSavedLabel: string | null;
};

type AdvancedDrawerTab = 'style' | 'steer' | 'backstage' | null;
type SessionInterventionSummary = {
  sessionStartedAtMs: number | null;
  interventionCount: number;
  firstInterventionTimestampMs: number | null;
  lastInterventionReason: string | null;
  interventionReasons: string[];
};

type RunJournalStatus = {
  active: boolean;
  proofWaveArmed: boolean;
  runId: string | null;
  proofMission: ReplayProofMissionSnapshot | null;
  proofRunState: ReplayProofRunState;
  sampleCount: number;
  markerCount: number;
  clipCount: number;
  checkpointStillCount: number;
  lastPersistedAt: string | null;
  buildIdentityValid: boolean;
  scenarioAssessment: ReplayScenarioAssessment | null;
  readiness: ReplayProofReadiness | null;
  proofValidity: ReplayProofValidity | null;
  proofMissionEligibility: ReplayProofMissionEligibility | null;
  artifactIntegrity: ReplayArtifactIntegrity | null;
  suppressedInterventionCount: number;
  lifecycleState: ReplayRunLifecycleState;
};

const INITIAL_SESSION_INTERVENTION_SUMMARY: SessionInterventionSummary = {
  sessionStartedAtMs: null,
  interventionCount: 0,
  firstInterventionTimestampMs: null,
  lastInterventionReason: null,
  interventionReasons: []
};

const INITIAL_RECORDING_SUMMARY: RecordingSummary = {
  active: false,
  frameCount: 0,
  durationMs: 0
};

const INITIAL_AUTO_CAPTURE_STATUS: AutoCaptureStatus = {
  enabled: false,
  autoDownload: false,
  pending: false,
  pendingLabel: null,
  captureCount: 0,
  latestLabel: null,
  latestTriggerLabel: null,
  latestDurationMs: 0,
  latestTriggerReason: null,
  currentTriggerProfile: null,
  latestTriggerProfile: null,
  latestProofStillCount: 0,
  proofStillsEnabled:
    typeof window !== 'undefined' &&
    window.localStorage.getItem(PROOF_STILLS_STORAGE_KEY) === '1'
};

const INITIAL_CAPTURE_FOLDER_STATUS: CaptureFolderStatus = {
  supported: typeof window !== 'undefined' ? fileSystemAccessSupported() : false,
  autoSave:
    typeof window !== 'undefined' &&
    window.localStorage.getItem(CAPTURE_AUTO_SAVE_STORAGE_KEY) === '1',
  folderName: null,
  ready: false,
  error: null,
  lastSavedLabel: null
};

const INITIAL_RUN_JOURNAL_STATUS: RunJournalStatus = {
  active: false,
  proofWaveArmed: false,
  runId: null,
  proofMission: null,
  proofRunState: 'idle',
  sampleCount: 0,
  markerCount: 0,
  clipCount: 0,
  checkpointStillCount: 0,
  lastPersistedAt: null,
  buildIdentityValid: isReplayBuildInfoValid(BUILD_INFO),
  scenarioAssessment: null,
  readiness: null,
  proofValidity: null,
  proofMissionEligibility: null,
  artifactIntegrity: null,
  suppressedInterventionCount: 0,
  lifecycleState: 'inbox'
};

function parseStoredProofScenarioKind(value: string | null): ReplayProofScenarioKind | null {
  return value === 'primary-benchmark' ||
    value === 'room-floor' ||
    value === 'coverage' ||
    value === 'sparse-silence' ||
    value === 'operator-trust' ||
    value === 'steering'
    ? value
    : null;
}

function readStoredProofMissionKind(): ReplayProofMissionKind {
  if (typeof window === 'undefined') {
    return 'primary-benchmark';
  }

  const storedMission = window.localStorage.getItem(PROOF_MISSION_STORAGE_KEY);
  if (isReplayProofMissionKind(storedMission)) {
    return storedMission;
  }

  return getDefaultProofMissionKindForScenario(
    parseStoredProofScenarioKind(
      window.localStorage.getItem(PROOF_SCENARIO_STORAGE_KEY)
    )
  );
}

const NO_TOUCH_PROOF_WINDOW_MS = 60_000;

function buildReplayAudioDiagnostics(
  liveDiagnostics: AudioDiagnostics,
  replay: ReplayController
): AudioDiagnostics {
  const capture = replay.getCapture();
  const diagnostics = replay.getCurrentDiagnostics();

  if (!capture || !diagnostics) {
    return liveDiagnostics;
  }

  const replayStatus = replay.getStatus();
  const replayFrame = replay.getCurrentFrame();

  return {
    ...liveDiagnostics,
    source: {
      id: 'replay-capture',
      kind: replayFrame.mode,
      label: `Replay: ${capture.metadata.sourceLabel}`,
      available: true
    },
    sourceMode: replayFrame.mode,
    selectedInputId: 'replay-capture',
    sampleRate: capture.metadata.sampleRate,
    deviceLabel: `Replay: ${capture.metadata.sourceLabel}`,
    bootStep: `replay-${replayStatus.mode}`,
    rawPathGranted: capture.metadata.rawPathGranted,
    appliedDisplayTrackSettings: liveDiagnostics.appliedDisplayTrackSettings,
    displayTrackLabel: liveDiagnostics.displayTrackLabel,
    displayAudioGranted: liveDiagnostics.displayAudioGranted,
    rawRms: diagnostics.rawRms,
    rawPeak: diagnostics.rawPeak,
    adaptiveCeiling: diagnostics.adaptiveCeiling,
    spectrumLow: diagnostics.spectrumLow,
    spectrumMid: diagnostics.spectrumMid,
    spectrumHigh: diagnostics.spectrumHigh,
    humRejection: diagnostics.humRejection,
    musicTrend: diagnostics.musicTrend,
    silenceGate: diagnostics.silenceGate,
    beatIntervalMs: diagnostics.beatIntervalMs,
    stateReason: diagnostics.stateReason,
    showStateReason: diagnostics.showStateReason,
    momentReason: diagnostics.momentReason,
    conductorReason: diagnostics.conductorReason,
    analysisFrame: replay.getCurrentAnalysisFrame(),
    listeningFrame: replay.getCurrentFrame(),
    warnings: [
      `Replay mode is active. Rendering is driven by "${capture.metadata.label}".`,
      ...diagnostics.warnings
    ]
  };
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const replayFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const rendererRef = useRef<RendererHandle | null>(null);
  const replayRef = useRef(new ReplayController());
  const captureDirectoryRef = useRef<FileSystemDirectoryHandle | null>(null);
  const controlsRef = useRef<UserControlState>(DEFAULT_USER_CONTROL_STATE);
  const momentLabCycleIndexRef = useRef(0);
  const sessionInterventionRef = useRef<SessionInterventionSummary>(
    INITIAL_SESSION_INTERVENTION_SUMMARY
  );
  const runJournalRef = useRef<{
    journal: ReplayRunJournal | null;
    lastSampleTimestampMs: number;
    lastPersistedAtMs: number;
    persistInFlight: Promise<boolean> | null;
    persistQueued: boolean;
    lastCheckpointStillTimestampMs: number;
    checkpointStillCaptureInFlight: boolean;
    queuedCheckpointStill: PendingRunCheckpointStill | null;
    lastWorldAuthorityState: string | null;
    lastQualityTier: string | null;
    lastShowState: string | null;
    lastCueFamily: string | null;
    lastSignatureMomentKey: string | null;
    lastStageIntent: string | null;
    lastRouteId: string | null;
    lastNoTouchWindowPassed: boolean;
    lastGovernanceRisk: boolean;
    lastQuietBeauty: boolean;
    proofMissionCorrections: string[];
  }>({
    journal: null,
    lastSampleTimestampMs: Number.NEGATIVE_INFINITY,
    lastPersistedAtMs: 0,
    persistInFlight: null,
    persistQueued: false,
    lastCheckpointStillTimestampMs: Number.NEGATIVE_INFINITY,
    checkpointStillCaptureInFlight: false,
    queuedCheckpointStill: null,
    lastWorldAuthorityState: null,
    lastQualityTier: null,
    lastShowState: null,
    lastCueFamily: null,
    lastSignatureMomentKey: null,
    lastStageIntent: null,
    lastRouteId: null,
    lastNoTouchWindowPassed: false,
    lastGovernanceRisk: false,
    lastQuietBeauty: false,
    proofMissionCorrections: []
  });
  const recordingRef = useRef<{
    active: boolean;
    frames: ReplayCaptureFrame[];
    firstTimestampMs: number;
    lastTimestampMs: number;
  }>({
    active: false,
    frames: [],
    firstTimestampMs: 0,
    lastTimestampMs: 0
  });
  const autoCaptureRef = useRef<{
    ring: ReplayCaptureFrame[];
    proofStillRing: CapturedProofStillSample[];
    pending: AutoCaptureSession | null;
    cooldownUntilMs: number;
    lastProofStillSampleMs: number;
    proofStillCaptureInFlight: boolean;
    captureCountsByKind: Partial<Record<AutoCaptureTriggerKind, number>>;
  }>({
    ring: [],
    proofStillRing: [],
    pending: null,
    cooldownUntilMs: 0,
    lastProofStillSampleMs: Number.NEGATIVE_INFINITY,
    proofStillCaptureInFlight: false,
    captureCountsByKind: {}
  });
  const [status, setStatus] = useState<AudioEngineStatus>(DEFAULT_AUDIO_STATUS);
  const [frame, setFrame] = useState<ListeningFrame>(DEFAULT_LISTENING_FRAME);
  const [audioDiagnostics, setAudioDiagnostics] =
    useState<AudioDiagnostics>(DEFAULT_AUDIO_DIAGNOSTICS);
  const [rendererDiagnostics, setRendererDiagnostics] =
    useState<RendererDiagnostics>(INITIAL_RENDERER_STATE);
  const [replayStatus, setReplayStatus] = useState<ReplayStatus>(() =>
    replayRef.current.getStatus()
  );
  const [recordingSummary, setRecordingSummary] = useState<RecordingSummary>(
    INITIAL_RECORDING_SUMMARY
  );
  const [sessionInterventionSummary, setSessionInterventionSummary] =
    useState<SessionInterventionSummary>(INITIAL_SESSION_INTERVENTION_SUMMARY);
  const [autoCaptureStatus, setAutoCaptureStatus] = useState<AutoCaptureStatus>(
    INITIAL_AUTO_CAPTURE_STATUS
  );
  const [autoCaptures, setAutoCaptures] = useState<AutoCaptureSummary[]>([]);
  const autoCaptureStatusRef = useRef(INITIAL_AUTO_CAPTURE_STATUS);
  const launchQuickStartIdRef = useRef<QuickStartProfileId | null>(null);
  const [captureFolderStatus, setCaptureFolderStatus] =
    useState<CaptureFolderStatus>(INITIAL_CAPTURE_FOLDER_STATUS);
  const captureFolderStatusRef = useRef(INITIAL_CAPTURE_FOLDER_STATUS);
  const [proofWaveArmed, setProofWaveArmed] = useState<boolean>(false);
  const proofWaveArmedRef = useRef(false);
  const [runJournalStatus, setRunJournalStatus] =
    useState<RunJournalStatus>(INITIAL_RUN_JOURNAL_STATUS);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [advancedDrawerTab, setAdvancedDrawerTab] =
    useState<AdvancedDrawerTab>(null);
  const [sourceMode, setSourceMode] = useState<ListeningMode>(() => {
    if (typeof window === 'undefined') {
      return 'room-mic';
    }

    const stored = window.localStorage.getItem(SOURCE_MODE_STORAGE_KEY);

    return stored === 'system-audio' || stored === 'hybrid'
      ? stored
      : 'room-mic';
  });
  const [preferredInputId, setPreferredInputId] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.localStorage.getItem(INPUT_STORAGE_KEY) ?? '';
  });
  const [showStartRoute, setShowStartRoute] = useState<ShowStartRoute>(() => {
    if (typeof window === 'undefined') {
      return 'pc-audio';
    }

    const stored = window.localStorage.getItem(SHOW_START_ROUTE_STORAGE_KEY);

    if (stored === 'pc-audio' || stored === 'microphone' || stored === 'combo') {
      return stored;
    }

    const storedMode = window.localStorage.getItem(SOURCE_MODE_STORAGE_KEY);

    return storedMode === 'hybrid'
      ? 'combo'
      : storedMode === 'room-mic'
        ? 'microphone'
        : 'pc-audio';
  });
  const [proofMissionKind, setProofMissionKind] =
    useState<ReplayProofMissionKind>(() => readStoredProofMissionKind());
  const [proofScenarioKind, setProofScenarioKind] =
    useState<ReplayProofScenarioKind | null>(() => {
      const mission = getReplayProofMissionProfile(readStoredProofMissionKind());
      return mission.scenarioKind;
    });
  const isMomentLabAvailable =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');
  const [momentLabKind, setMomentLabKind] =
    useState<MomentLabKind>('collapse-scar');
  const [momentLabStyle, setMomentLabStyle] =
    useState<SignatureMomentStyle>('contrast-mythic');
  const [momentLabSyntheticProfile, setMomentLabSyntheticProfile] =
    useState<SignatureMomentPreviewProfile>('drop');
  const [momentLabDurationSeconds, setMomentLabDurationSeconds] = useState(4.8);
  const [momentLabAutoCycleActive, setMomentLabAutoCycleActive] = useState(false);
  const [momentLabLatestReceipt, setMomentLabLatestReceipt] = useState<string | null>(
    null
  );
  const [advancedCuration, setAdvancedCuration] = useState<AdvancedCurationState>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_ADVANCED_CURATION_STATE;
    }

    return parseStoredAdvancedCurationState(
      window.localStorage.getItem(ADVANCED_CURATION_STORAGE_KEY)
    );
  });
  const [advancedSteering, setAdvancedSteering] = useState<AdvancedSteeringState>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_ADVANCED_STEERING_STATE;
    }

    return parseStoredAdvancedSteeringState(
      window.localStorage.getItem(ADVANCED_STEERING_STORAGE_KEY)
    );
  });
  const [savedStances, setSavedStances] = useState<SavedStance[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    return parseStoredSavedStances(
      window.localStorage.getItem(SAVED_STANCES_STORAGE_KEY)
    );
  });
  const routeCapabilities = detectRouteCapabilities();
  const appliedShowIntent = resolveAppliedShowIntent(
    showStartRoute,
    advancedCuration,
    advancedSteering,
    frame,
    sourceMode
  );
  const directorBase = appliedShowIntent.base;
  const directorRuntime = appliedShowIntent.resolution;
  const compatibilityIntent = appliedShowIntent.compatibilityIntent;
  const routeRecommendation = resolveAutoRouteRecommendation({
    routePolicy: resolveInputRoutePolicyFromShowStartRoute(showStartRoute),
    currentMode: sourceMode,
    statusPhase: status.phase,
    diagnostics: {
      rawRms: audioDiagnostics.rawRms,
      noiseFloor: audioDiagnostics.noiseFloor,
      roomMusicFloorActive: audioDiagnostics.roomMusicFloorActive
    },
    frame,
    capabilities: routeCapabilities
  });
  const controls: UserControlState = directorBase.baseControls;
  const audioTuning = deriveRuntimeTuning(controls);
  const runtimeTuning = directorRuntime.runtimeTuning;
  const activeQuickStart = getActiveQuickStartProfile(
    controls,
    sourceMode
  );
  const proofMissionProfile = getReplayProofMissionProfile(proofMissionKind);
  const [launchQuickStartId, setLaunchQuickStartId] =
    useState<QuickStartProfileId | null>(null);
  const replayActive = replayStatus.mode !== 'idle';
  const runtimeActive = status.phase === 'live' || replayActive;
  const activationVisible = status.phase !== 'live' && !replayActive;
  const currentProofReadiness = deriveReplayProofReadiness({
    proofWaveArmed,
    captureFolderLabel: captureFolderStatus.folderName,
    captureFolderReady: captureFolderStatus.ready && captureFolderStatus.autoSave,
    showStartRoute,
    sourceMode,
    proofScenarioKind: proofMissionProfile.scenarioKind,
    buildInfo: BUILD_INFO,
    replayActive,
    routeCapabilities
  });
  const currentProofValidity = deriveReplayProofValidity({
    proofWaveArmed,
    readiness: currentProofReadiness,
    startedReady: currentProofReadiness.ready,
    invalidations: []
  });

  const queueProofStillSample = (
    timestampMs: number,
    frameForStill: ReplayCaptureFrame
  ) => {
    const canvas = canvasRef.current;
    const autoCaptureState = autoCaptureRef.current;
    const proofStillsArmed =
      autoCaptureStatusRef.current.proofStillsEnabled &&
      captureFolderStatusRef.current.autoSave &&
      captureFolderStatusRef.current.ready &&
      captureDirectoryRef.current !== null;

    if (!proofStillsArmed || !canvas || autoCaptureState.proofStillCaptureInFlight) {
      return;
    }

    if (
      timestampMs - autoCaptureState.lastProofStillSampleMs <
      PROOF_STILL_SAMPLE_INTERVAL_MS
    ) {
      return;
    }

    autoCaptureState.proofStillCaptureInFlight = true;
    autoCaptureState.lastProofStillSampleMs = timestampMs;

    canvas.toBlob((blob) => {
      autoCaptureState.proofStillCaptureInFlight = false;

      if (!blob) {
        return;
      }

      const nextSample: CapturedProofStillSample = {
        timestampMs,
        blob,
        ...evaluateProofStillFrame(frameForStill)
      };

      autoCaptureState.proofStillRing.push(nextSample);
      const minimumSampleTimestamp = timestampMs - MAX_AUTO_CAPTURE_PRE_ROLL_MS;

      while (
        autoCaptureState.proofStillRing.length > 0 &&
        autoCaptureState.proofStillRing[0]!.timestampMs < minimumSampleTimestamp
      ) {
        autoCaptureState.proofStillRing.shift();
      }

      if (autoCaptureState.pending) {
        autoCaptureState.pending.proofStillSamples.push(nextSample);
      }
    }, 'image/png');
  };

  const buildProofStillBundle = (
    label: string,
    triggerTimestampMs: number,
    samples: CapturedProofStillSample[]
  ): {
    proofStillSummary: NonNullable<ReturnType<typeof buildReplayCapture>['metadata']['proofStills']>;
    files: Array<{ fileName: string; blob: Blob }>;
  } => {
    const proofStillsArmed =
      autoCaptureStatusRef.current.proofStillsEnabled &&
      captureFolderStatusRef.current.autoSave &&
      captureFolderStatusRef.current.ready &&
      captureDirectoryRef.current !== null;

    if (!proofStillsArmed) {
      return {
        proofStillSummary: {
          requested: autoCaptureStatusRef.current.proofStillsEnabled,
          sampleIntervalMs: PROOF_STILL_SAMPLE_INTERVAL_MS,
          saved: [],
          warning: autoCaptureStatusRef.current.proofStillsEnabled
            ? 'Proof stills were requested but auto-save-to-folder was not armed with a writable capture folder.'
            : undefined
        },
        files: []
      };
    }

    if (samples.length === 0) {
      return {
        proofStillSummary: {
          requested: true,
          sampleIntervalMs: PROOF_STILL_SAMPLE_INTERVAL_MS,
          saved: [],
          warning: 'Proof still sampling was enabled, but no still samples were captured during this window.'
        },
        files: []
      };
    }

    const preSelection = selectClosestProofStillSample(
      samples,
      Math.max(samples[0]!.timestampMs, triggerTimestampMs - 1000)
    );
    const peakSelection =
      [...samples].sort((left, right) => right.eventScore - left.eventScore)[0] ?? null;
    const authoritySelection =
      [...samples].sort(
        (left, right) => right.authorityScore - left.authorityScore
      )[0] ?? null;
    const quietSelection =
      [...samples].sort((left, right) => right.quietScore - left.quietScore)[0] ?? null;
    const safetySelection =
      [...samples].sort((left, right) => {
        if (left.safetyScore === right.safetyScore) {
          return right.riskScore - left.riskScore;
        }

        return left.safetyScore - right.safetyScore;
      })[0] ?? null;
    const outroSelection = samples[samples.length - 1] ?? null;
    const selections = dedupeProofStillSelections(
      [
        preSelection
          ? { kind: 'pre', sample: preSelection }
          : null,
        peakSelection
          ? { kind: 'peak', sample: peakSelection }
          : null,
        authoritySelection
          ? { kind: 'authority', sample: authoritySelection }
          : null,
        quietSelection
          ? { kind: 'quiet', sample: quietSelection }
          : null,
        safetySelection
          ? { kind: 'safety', sample: safetySelection }
          : null,
        outroSelection
          ? { kind: 'outro', sample: outroSelection }
          : null
      ].filter(
        (
          selection
        ): selection is {
          kind: ProofStillKind;
          sample: ProofStillSample;
        } => selection !== null
      )
    );

    return {
      proofStillSummary: {
        requested: true,
        sampleIntervalMs: PROOF_STILL_SAMPLE_INTERVAL_MS,
        saved: selections.map(({ kind, sample }) => ({
          kind,
          timestampMs: sample.timestampMs,
          fileName: buildProofStillFileName(label, kind)
        }))
      },
      files: selections
        .map(({ kind, sample }) => {
          const blob = samples.find(
            (candidate) => candidate.timestampMs === sample.timestampMs
          )?.blob;

          if (!blob) {
            return null;
          }

          return {
            fileName: buildProofStillFileName(label, kind),
            blob
          };
        })
        .filter((entry): entry is { fileName: string; blob: Blob } => entry !== null)
    };
  };

  const clearAutoCapturePending = () => {
    autoCaptureRef.current.pending = null;
    setAutoCaptureStatus((current) => {
      const nextStatus = {
        ...current,
        pending: false,
        pendingLabel: null,
        currentTriggerProfile: null
      };

      autoCaptureStatusRef.current = nextStatus;

      return nextStatus;
    });
  };

  const updateSessionInterventionSummary = (
    nextSummary: SessionInterventionSummary
  ) => {
    sessionInterventionRef.current = nextSummary;
    setSessionInterventionSummary(nextSummary);
  };

  const updateRunJournalStatusFromJournal = (
    journal: ReplayRunJournal | null,
    nextScenarioAssessment?: ReplayScenarioAssessment | null
  ) => {
    const proofRunState = journal?.metadata.proofRunState ?? (proofWaveArmedRef.current ? 'armed' : 'idle');
    const active =
      journal !== null &&
      proofRunState !== 'finalized';

    setRunJournalStatus({
      active,
      proofWaveArmed:
        journal?.metadata.proofWaveArmed ?? proofWaveArmedRef.current,
      runId: journal?.metadata.runId ?? null,
      proofMission: journal?.metadata.proofMission ?? null,
      proofRunState,
      sampleCount: journal?.samples.length ?? 0,
      markerCount: journal?.markers.length ?? 0,
      clipCount: journal?.clips.length ?? 0,
      checkpointStillCount: journal?.checkpointStills.length ?? 0,
      lastPersistedAt:
        runJournalRef.current.lastPersistedAtMs > 0
          ? new Date(runJournalRef.current.lastPersistedAtMs).toISOString()
          : null,
      buildIdentityValid:
        journal?.metadata.buildInfo.valid === true ||
        (journal === null && isReplayBuildInfoValid(BUILD_INFO)),
      scenarioAssessment:
        nextScenarioAssessment ?? journal?.metadata.scenarioAssessment ?? null,
      readiness: journal?.metadata.proofReadiness ?? currentProofReadiness,
      proofValidity: journal?.metadata.proofValidity ?? currentProofValidity,
      proofMissionEligibility:
        journal?.metadata.proofMissionEligibility ?? null,
      artifactIntegrity: journal?.metadata.artifactIntegrity ?? null,
      suppressedInterventionCount:
        journal?.metadata.suppressedInterventions?.length ?? 0,
      lifecycleState: journal?.metadata.lifecycleState ?? 'inbox'
    });
  };

  const getRunSubdirectories = (suffix: string[] = []): string[] | undefined => {
    const runId = runJournalRef.current.journal?.metadata.runId;
    return runId ? ['runs', runId, ...suffix] : undefined;
  };

  const persistRunJournalArtifacts = async (force = false): Promise<boolean> => {
    if (runJournalRef.current.persistInFlight) {
      if (force) {
        runJournalRef.current.persistQueued = true;
      }
      return runJournalRef.current.persistInFlight;
    }

    const persistTask = (async (): Promise<boolean> => {
      const journal = runJournalRef.current.journal;
      const handle = captureDirectoryRef.current;

      if (
        !journal ||
        !handle ||
        !captureFolderStatusRef.current.autoSave ||
        !captureFolderStatusRef.current.ready
      ) {
        return false;
      }

      const now = Date.now();
      if (
        !force &&
        now - runJournalRef.current.lastPersistedAtMs < RUN_JOURNAL_PERSIST_INTERVAL_MS
      ) {
        return false;
      }

      const ready = await ensureCaptureDirectoryPermission(handle, false);
      if (!ready) {
        invalidateActiveProofRun(
          'run-journal-save-failed',
          journal.samples[journal.samples.length - 1]?.timestampMs ?? 0,
          'Run-journal persistence lost write access to the capture folder.',
          'restart-run'
        );
        return false;
      }

      const journalFileName = `${journal.metadata.runId}__run-journal.json`;
      const manifestFileName = `${journal.metadata.runId}__run-manifest.json`;
      const runSubdirectories = getRunSubdirectories();
      const { journalSnapshot, manifestSnapshot } = buildReplayRunPersistenceArtifacts(
        journal,
        {
          journalFileName
        }
      );
      const persistenceOptions = {
        subdirectories: runSubdirectories,
        retry: {
          attempts: RUN_JOURNAL_PERSIST_RETRY_ATTEMPTS,
          delayMs: RUN_JOURNAL_PERSIST_RETRY_DELAY_MS
        }
      };

      try {
        await saveJsonArtifactToDirectory(
          handle,
          journalFileName,
          journalSnapshot,
          persistenceOptions
        );
        await saveJsonArtifactToDirectory(
          handle,
          manifestFileName,
          manifestSnapshot,
          persistenceOptions
        );
      } catch (error) {
        if (!hasReplayProofInvalidation(journal, 'run-journal-save-failed')) {
          invalidateActiveProofRun(
            'run-journal-save-failed',
            journal.samples[journal.samples.length - 1]?.timestampMs ?? 0,
            error instanceof Error
              ? `Run-journal persistence failed after ${RUN_JOURNAL_PERSIST_RETRY_ATTEMPTS} attempts: ${error.message}`
              : `Run-journal persistence failed after ${RUN_JOURNAL_PERSIST_RETRY_ATTEMPTS} attempts.`,
            'restart-run'
          );
        } else {
          updateRunJournalStatusFromJournal(journal);
        }
        return false;
      }

      runJournalRef.current.lastPersistedAtMs = now;
      updateRunJournalStatusFromJournal(journal);
      return true;
    })();

    runJournalRef.current.persistInFlight = persistTask;

    let persisted = false;
    try {
      persisted = await persistTask;
    } finally {
      if (runJournalRef.current.persistInFlight === persistTask) {
        runJournalRef.current.persistInFlight = null;
      }
    }

    if (runJournalRef.current.persistQueued) {
      runJournalRef.current.persistQueued = false;
      const queuedPersisted = await persistRunJournalArtifacts(true);
      return queuedPersisted || persisted;
    }

    return persisted;
  };

  const appendRunJournalMarker = (
    kind: ReplayRunEventMarkerKind,
    timestampMs: number,
    reason: string,
    metadata?: Record<string, string | number | boolean | null | undefined>
  ) => {
    const journal = runJournalRef.current.journal;

    if (!journal) {
      return;
    }

    const sanitizedMetadata = metadata
      ? (Object.fromEntries(
          Object.entries(metadata).filter(([, value]) => value !== undefined)
        ) as Record<string, string | number | boolean | null>)
      : undefined;

    journal.markers.push(
      buildReplayRunEventMarker(kind, timestampMs, reason, sanitizedMetadata)
    );
    journal.metadata.updatedAt = new Date().toISOString();
    updateRunJournalStatusFromJournal(journal);
  };

  const refreshRunJournalProofState = (
    journal: ReplayRunJournal,
    options?: {
      sourceMode?: ListeningMode;
      replayActive?: boolean;
    }
  ) => {
    const lockedScenarioKind =
      journal.metadata.proofMission?.scenarioKind ??
      journal.metadata.proofScenarioKind ??
      null;
    const readiness = deriveReplayProofReadiness({
      proofWaveArmed: journal.metadata.proofWaveArmed,
      captureFolderLabel: captureFolderStatusRef.current.folderName,
      captureFolderReady:
        captureFolderStatusRef.current.ready && captureFolderStatusRef.current.autoSave,
      showStartRoute: journal.metadata.showStartRoute,
      sourceMode: options?.sourceMode ?? journal.metadata.sourceMode,
      proofScenarioKind: lockedScenarioKind,
      buildInfo: journal.metadata.buildInfo,
      replayActive: options?.replayActive ?? replayRef.current.hasCapture(),
      routeCapabilities
    });

    journal.metadata.proofReadiness = readiness;
    journal.metadata.proofValidity = deriveReplayProofValidity({
      proofWaveArmed: journal.metadata.proofWaveArmed,
      readiness,
      startedReady:
        journal.metadata.proofValidity?.startedReady ?? readiness.ready,
      invalidations: journal.metadata.proofValidity?.invalidations ?? [],
      missionEligibility: journal.metadata.proofMissionEligibility
    });
    journal.metadata.updatedAt = new Date().toISOString();
  };

  const invalidateActiveProofRun = (
    code: ReplayProofInvalidationCode,
    timestampMs: number,
    reason: string,
    recommendedDisposition: 'continue-exploratory' | 'restart-run' | 'archive-run'
  ) => {
    const journal = runJournalRef.current.journal;

    if (
      !journal ||
      !shouldApplyReplayProofInvalidation({
        proofWaveArmed: journal.metadata.proofWaveArmed,
        proofRunState: journal.metadata.proofRunState,
        code
      })
    ) {
      return false;
    }

    const existingInvalidation = journal.metadata.proofValidity?.invalidations.find(
      (invalidation) => invalidation.code === code
    );

    if (existingInvalidation) {
      return false;
    }

    const invalidations = [
      ...(journal.metadata.proofValidity?.invalidations ?? []),
      buildReplayProofInvalidation(code, timestampMs, reason, recommendedDisposition)
    ];

    journal.metadata.proofMissionEligibility = undefined;
    journal.metadata.proofValidity = deriveReplayProofValidity({
      proofWaveArmed: true,
      readiness: journal.metadata.proofReadiness ?? currentProofReadiness,
      startedReady:
        journal.metadata.proofValidity?.startedReady ??
        journal.metadata.proofReadiness?.ready === true,
      invalidations,
      missionEligibility: journal.metadata.proofMissionEligibility
    });
    journal.metadata.proofRunState = 'invalidated';
    journal.metadata.updatedAt = new Date().toISOString();
    appendRunJournalMarker('proof-invalidated', timestampMs, reason, {
      code,
      recommendedDisposition
    });
    updateRunJournalStatusFromJournal(journal);
    return true;
  };

  const proofRunLocksControls = () =>
    proofWaveArmedRef.current &&
    status.phase === 'live' &&
    (runJournalRef.current.journal?.metadata.proofMission?.lockAdvancedControls ??
      proofMissionProfile.lockAdvancedControls);

  const recordSuppressedProofIntervention = (
    reason: string,
    source: 'ui' | 'keyboard-shortcut' | 'system' = 'ui'
  ) => {
    const journal = runJournalRef.current.journal;
    const session = sessionInterventionRef.current;
    const timestampMs =
      session.sessionStartedAtMs === null
        ? journal?.samples[journal.samples.length - 1]?.timestampMs ?? 0
        : Math.max(0, Date.now() - session.sessionStartedAtMs);

    setStartError(
      'Proof Mission blocked that control. Use Finish Proof Run, then rerun if setup was wrong.'
    );

    if (!journal) {
      return;
    }

    if (journal.metadata.proofRunState === 'finalized') {
      return;
    }

    journal.metadata.suppressedInterventions = [
      ...(journal.metadata.suppressedInterventions ?? []),
      {
        reason,
        source,
        timestampMs
      }
    ];
    appendRunJournalMarker('suppressed-intervention', timestampMs, reason, {
      source
    });
    journal.metadata.updatedAt = new Date().toISOString();
    updateRunJournalStatusFromJournal(journal);
    void persistRunJournalArtifacts(true);
  };

  const overrideProofRunToExploratory = (reason: string) => {
    const journal = runJournalRef.current.journal;
    const timestampMs =
      journal?.samples[journal.samples.length - 1]?.timestampMs ??
      Math.max(
        0,
        Date.now() - (sessionInterventionRef.current.sessionStartedAtMs ?? Date.now())
      );

    if (journal) {
      appendRunJournalMarker('exploratory-override', timestampMs, reason, {
        source: 'ui'
      });
    }

    markSessionIntervention('explicit-exploratory-override', 'ui');
    invalidateActiveProofRun(
      'explicit-exploratory-override',
      timestampMs,
      reason,
      'continue-exploratory'
    );
    if (journal) {
      journal.metadata.proofWaveArmed = false;
      refreshRunJournalProofState(journal);
      updateRunJournalStatusFromJournal(journal);
      void persistRunJournalArtifacts(true);
    }
    setProofWaveArmed(false);
    setStartError('This run is now exploratory only.');
  };

  const queueRunCheckpointStill = (
    journal: ReplayRunJournal,
    timestampMs: number,
    frameForStill: ReplayCaptureFrame,
    kind: ReplayRunStillKind,
    exploratory: boolean
  ) => {
    const nextQueuedStill: PendingRunCheckpointStill = {
      runId: journal.metadata.runId,
      timestampMs,
      frame: cloneReplayCaptureFrameSnapshot(frameForStill),
      kind,
      exploratory
    };
    const currentQueuedStill = runJournalRef.current.queuedCheckpointStill;

    if (
      !currentQueuedStill ||
      RUN_CHECKPOINT_STILL_PRIORITY[kind] >
        RUN_CHECKPOINT_STILL_PRIORITY[currentQueuedStill.kind] ||
      (RUN_CHECKPOINT_STILL_PRIORITY[kind] ===
        RUN_CHECKPOINT_STILL_PRIORITY[currentQueuedStill.kind] &&
        timestampMs >= currentQueuedStill.timestampMs)
    ) {
      runJournalRef.current.queuedCheckpointStill = nextQueuedStill;
    }
  };

  const flushQueuedRunCheckpointStill = () => {
    const queuedStill = runJournalRef.current.queuedCheckpointStill;

    if (!queuedStill) {
      return;
    }

    const activeJournal = runJournalRef.current.journal;
    runJournalRef.current.queuedCheckpointStill = null;

    if (
      !activeJournal ||
      activeJournal.metadata.runId !== queuedStill.runId ||
      (!proofWaveArmedRef.current && !queuedStill.exploratory)
    ) {
      return;
    }

    window.setTimeout(() => {
      captureRunCheckpointStill(
        queuedStill.timestampMs,
        queuedStill.frame,
        queuedStill.kind,
        { exploratory: queuedStill.exploratory }
      );
    }, 0);
  };

  const finishRunCheckpointStillCapture = () => {
    runJournalRef.current.checkpointStillCaptureInFlight = false;
    flushQueuedRunCheckpointStill();
  };

  const captureRunCheckpointStill = (
    timestampMs: number,
    frameForStill: ReplayCaptureFrame,
    kind: ReplayRunStillKind,
    options?: { exploratory?: boolean }
  ) => {
    const journal = runJournalRef.current.journal;
    const canvas = canvasRef.current;
    const exploratoryReceipt =
      options?.exploratory === true && kind === 'signature-preview';
    const seriousProofStill =
      journal?.metadata.proofWaveArmed === true || proofWaveArmedRef.current;

    if (
      !journal ||
      (!seriousProofStill && !exploratoryReceipt) ||
      !canvas
    ) {
      return;
    }

    if (runJournalRef.current.checkpointStillCaptureInFlight) {
      queueRunCheckpointStill(
        journal,
        timestampMs,
        frameForStill,
        kind,
        exploratoryReceipt
      );
      return;
    }

    runJournalRef.current.checkpointStillCaptureInFlight = true;

    canvas.toBlob((blob) => {
      if (!blob) {
        if (seriousProofStill) {
          invalidateActiveProofRun(
            'capture-save-failed',
            timestampMs,
            `Checkpoint still capture returned no image data for ${kind}.`,
            'restart-run'
          );
        } else {
          setMomentLabLatestReceipt(
            `Exploratory receipt failed: no image data for ${kind}.`
          );
        }
        void persistRunJournalArtifacts(true).finally(finishRunCheckpointStillCapture);
        return;
      }

      if (!runJournalRef.current.journal) {
        finishRunCheckpointStillCapture();
        return;
      }

      const activeJournal = runJournalRef.current.journal;
      const stillFileName = `${activeJournal.metadata.runId}__${kind}_${Math.round(
        timestampMs
      )}.png`;

      void (async () => {
        try {
          const handle = captureDirectoryRef.current;
          const folderReady =
            handle !== null &&
            captureFolderStatusRef.current.autoSave &&
            captureFolderStatusRef.current.ready &&
            (await ensureCaptureDirectoryPermission(handle, false));

          if (!handle || !folderReady) {
            if (seriousProofStill) {
              invalidateActiveProofRun(
                'capture-save-failed',
                timestampMs,
                `Checkpoint still ${stillFileName} could not save because the proof capture folder is not writable.`,
                'restart-run'
              );
            } else {
              setMomentLabLatestReceipt(
                `Exploratory receipt failed: capture folder is not writable.`
              );
            }
            await persistRunJournalArtifacts(true);
            return;
          }

          const stillSaveResult = await saveCaptureBlobsToDirectory(
            handle,
            [{ fileName: stillFileName, blob }],
            {
              subdirectories: getRunSubdirectories(['stills'])
            }
          );

          if (!stillSaveResult.savedFileNames.includes(stillFileName)) {
            if (seriousProofStill) {
              invalidateActiveProofRun(
                'capture-save-failed',
                timestampMs,
                stillSaveResult.warning ??
                  `Checkpoint still ${stillFileName} failed to save into the run package.`,
                'restart-run'
              );
            } else {
              setMomentLabLatestReceipt(
                stillSaveResult.warning ??
                  `Exploratory receipt ${stillFileName} failed to save.`
              );
            }
            await persistRunJournalArtifacts(true);
            return;
          }

          registerReplayRunStill(activeJournal, {
            kind,
            timestampMs,
            fileName: stillFileName
          });
          updateRunJournalStatusFromJournal(activeJournal);
          await persistRunJournalArtifacts(true);
          if (exploratoryReceipt) {
            setMomentLabLatestReceipt(
              `Exploratory receipt saved in ${activeJournal.metadata.runId}: ${stillFileName}.`
            );
          }
        } finally {
          finishRunCheckpointStillCapture();
        }
      })();
    }, 'image/png');
  };

  const startRunJournal = (
    nextSourceMode: ListeningMode,
    diagnostics: AudioDiagnostics
  ) => {
    const sessionStartedAtMs = Date.now();
    const runId = createReplayRunId(new Date(sessionStartedAtMs));
    const proofMission = proofWaveArmedRef.current
      ? buildReplayProofMissionSnapshot(proofMissionKind, {
          lockedAt: new Date(sessionStartedAtMs).toISOString(),
          autoCorrections: runJournalRef.current.proofMissionCorrections
        })
      : undefined;
    const journalRoute = proofMission?.expectedRoute ?? showStartRoute;
    const journalScenarioKind = proofMission?.scenarioKind ?? null;
    const autoCaptureState = autoCaptureRef.current;
    autoCaptureState.ring = [];
    autoCaptureState.proofStillRing = [];
    autoCaptureState.pending = null;
    autoCaptureState.cooldownUntilMs = 0;
    autoCaptureState.lastProofStillSampleMs = Number.NEGATIVE_INFINITY;
    autoCaptureState.proofStillCaptureInFlight = false;
    autoCaptureState.captureCountsByKind = {};
    runJournalRef.current.queuedCheckpointStill = null;
    const proofReadiness = deriveReplayProofReadiness({
      proofWaveArmed: proofWaveArmedRef.current,
      captureFolderLabel: captureFolderStatusRef.current.folderName,
      captureFolderReady:
        captureFolderStatusRef.current.ready && captureFolderStatusRef.current.autoSave,
      showStartRoute: journalRoute,
      sourceMode: nextSourceMode,
      proofScenarioKind: journalScenarioKind,
      buildInfo: BUILD_INFO,
      replayActive: false,
      routeCapabilities
    });
    const scenarioAssessment = deriveReplayScenarioAssessment({
      declaredScenario: journalScenarioKind,
      sourceMode: nextSourceMode,
      showStartRoute: journalRoute,
      noTouchWindowPassed: false,
      interventionCount: 0,
      interventionReasons: [],
      captureMode: proofWaveArmedRef.current ? 'auto' : 'manual',
      hasBuildIdentity: isReplayBuildInfoValid(BUILD_INFO)
    });
    const proofValidity = deriveReplayProofValidity({
      proofWaveArmed: proofWaveArmedRef.current,
      readiness: proofReadiness,
      startedReady: proofReadiness.ready,
      invalidations: []
    });
    const journal = createReplayRunJournal({
      buildInfo: createReplayBuildInfo(BUILD_INFO),
      runId,
      sourceMode: nextSourceMode,
      sourceLabel: diagnostics.deviceLabel || 'Unknown source',
      showStartRoute: journalRoute,
      routePolicy: resolveInputRoutePolicyFromShowStartRoute(journalRoute),
      resolvedRoute: resolveRouteIdFromListeningMode(nextSourceMode),
      showCapabilityMode: appliedShowIntent.showCapabilityMode,
      proofWaveArmed: proofWaveArmedRef.current,
      proofScenarioKind: journalScenarioKind,
      proofMission,
      scenarioAssessment,
      proofReadiness,
      proofValidity,
      lifecycleState: 'inbox',
      sessionStartedAt: new Date(sessionStartedAtMs).toISOString(),
      sessionElapsedMs: 0,
      interventionCount: 0,
      interventionReasons: [],
      noTouchWindowPassed: false
    });

    runJournalRef.current = {
      journal,
      lastSampleTimestampMs: Number.NEGATIVE_INFINITY,
      lastPersistedAtMs: 0,
      persistInFlight: null,
      persistQueued: false,
      lastCheckpointStillTimestampMs: Number.NEGATIVE_INFINITY,
      checkpointStillCaptureInFlight: false,
      queuedCheckpointStill: null,
      lastWorldAuthorityState: null,
      lastQualityTier: null,
      lastShowState: null,
      lastCueFamily: null,
      lastSignatureMomentKey: null,
      lastStageIntent: null,
      lastRouteId: resolveRouteIdFromListeningMode(nextSourceMode),
      lastNoTouchWindowPassed: false,
      lastGovernanceRisk: false,
      lastQuietBeauty: false,
      proofMissionCorrections: []
    };

    appendRunJournalMarker(
      'run-start',
      0,
      `Start Show via ${journalRoute}`,
      {
        route: journalRoute,
        proofMission: proofMission?.kind ?? null,
        proofScenario: journalScenarioKind,
        sourceMode: nextSourceMode,
        proofWaveArmed: proofWaveArmedRef.current
      }
    );
    updateRunJournalStatusFromJournal(journal, scenarioAssessment);
    void persistRunJournalArtifacts(true);
  };

  const beginNoTouchSession = () => {
    updateSessionInterventionSummary({
      sessionStartedAtMs: Date.now(),
      interventionCount: 0,
      firstInterventionTimestampMs: null,
      lastInterventionReason: null,
      interventionReasons: []
    });
  };

  const markSessionIntervention = (
    reason: string,
    source: 'ui' | 'keyboard-shortcut' | 'system' = 'ui'
  ) => {
    const current = sessionInterventionRef.current;
    const journal = runJournalRef.current.journal;

    if (current.sessionStartedAtMs === null) {
      return;
    }

    if (journal?.metadata.proofRunState === 'finalized') {
      return;
    }

    const elapsedMs = Math.max(0, Date.now() - current.sessionStartedAtMs);

    const nextSummary = {
      sessionStartedAtMs: current.sessionStartedAtMs,
      interventionCount: current.interventionCount + 1,
      firstInterventionTimestampMs:
        current.firstInterventionTimestampMs ?? elapsedMs,
      lastInterventionReason: reason,
      interventionReasons: [...current.interventionReasons, reason]
    };

    updateSessionInterventionSummary(nextSummary);

    if (journal) {
      const autonomyBreaking = isAutonomyBreakingIntervention(reason);
      journal.metadata.interventionCount = nextSummary.interventionCount;
      journal.metadata.interventionReasons = [...nextSummary.interventionReasons];
      journal.metadata.sessionElapsedMs = elapsedMs;
      appendRunJournalMarker(
        'intervention',
        elapsedMs,
        reason,
        {
          interventionCount: nextSummary.interventionCount,
          source,
          autonomyBreaking
        }
      );
      refreshRunJournalProofState(journal, {
        sourceMode: journal.metadata.sourceMode
      });
      if (
        shouldApplyReplayProofInvalidation({
          proofWaveArmed: journal.metadata.proofWaveArmed,
          proofRunState: journal.metadata.proofRunState,
          code: 'operator-intervention'
        }) &&
        autonomyBreaking
      ) {
        invalidateActiveProofRun(
          'operator-intervention',
          elapsedMs,
          `Serious proof was touched by ${source}: ${reason}.`,
          'restart-run'
        );
      }
      void persistRunJournalArtifacts(true);
    }
  };

  const applyMomentLabPreview = (
    kind: MomentLabKind,
    style: SignatureMomentStyle,
    syntheticProfile: SignatureMomentPreviewProfile,
    receiptRequested: boolean
  ) => {
    if (!isMomentLabAvailable) {
      setStartError('Moment Lab is only available on localhost/dev proof builds.');
      return;
    }

    if (proofWaveArmedRef.current || proofRunLocksControls()) {
      recordSuppressedProofIntervention(`signature-preview:${kind}`, 'ui');
      setStartError(
        'Moment Lab is disabled while Proof Wave is armed or a serious proof run is live.'
      );
      return;
    }

    const startedAtSeconds = performance.now() * 0.001;
    const durationSeconds = Math.min(9, Math.max(2.2, momentLabDurationSeconds));
    const override: SignatureMomentDevOverride = {
      kind,
      style,
      syntheticProfile,
      startedAtSeconds,
      durationSeconds,
      intensity: 1,
      receiptRequested
    };

    rendererRef.current?.setSignatureMomentDevOverride(override);
    setMomentLabKind(kind);
    setMomentLabStyle(style);
    setMomentLabSyntheticProfile(syntheticProfile);
    setMomentLabDurationSeconds(durationSeconds);
    markSessionIntervention(`signature-preview:${kind}:${style}:${syntheticProfile}`);

    const journal = runJournalRef.current.journal;
    const elapsedMs =
      sessionInterventionRef.current.sessionStartedAtMs === null
        ? 0
        : Math.max(0, Date.now() - sessionInterventionRef.current.sessionStartedAtMs);

    if (journal) {
      appendRunJournalMarker('signature-preview', elapsedMs, 'Moment Lab preview forced.', {
        kind,
        style,
        syntheticProfile,
        durationSeconds,
        receiptRequested
      });
    }

    if (receiptRequested) {
      const latestFrame =
        autoCaptureRef.current.ring[autoCaptureRef.current.ring.length - 1];
      if (latestFrame) {
        captureRunCheckpointStill(
          latestFrame.timestampMs,
          latestFrame,
          'signature-preview',
          { exploratory: true }
        );
      }
      setMomentLabLatestReceipt(
        journal
          ? `Exploratory receipt requested in ${journal.metadata.runId}.`
          : 'Preview applied. Start an exploratory run to save journal/still receipts.'
      );
    } else {
      setMomentLabLatestReceipt(`Previewing ${kind} as ${style}.`);
    }

    window.setTimeout(() => {
      rendererRef.current?.setSignatureMomentDevOverride(null);
    }, durationSeconds * 1000);
  };

  const handleMomentLabPreview = () => {
    applyMomentLabPreview(
      momentLabKind,
      momentLabStyle,
      momentLabSyntheticProfile,
      true
    );
  };

  const handleMomentLabAutoCycle = () => {
    if (proofWaveArmedRef.current || proofRunLocksControls()) {
      recordSuppressedProofIntervention('signature-preview:auto-cycle', 'ui');
      return;
    }

    momentLabCycleIndexRef.current = 0;
    setMomentLabAutoCycleActive((current) => !current);
  };

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

  useEffect(() => {
    if (!momentLabAutoCycleActive || !isMomentLabAvailable || proofWaveArmed) {
      rendererRef.current?.setSignatureMomentDevOverride(null);
      return undefined;
    }

    const cycle = () => {
      const variantIndex = momentLabCycleIndexRef.current;
      const kind = MOMENT_LAB_KINDS[variantIndex % MOMENT_LAB_KINDS.length];
      const style =
        MOMENT_LAB_STYLES[
          1 + Math.floor(variantIndex / MOMENT_LAB_KINDS.length) %
            (MOMENT_LAB_STYLES.length - 1)
        ] ?? 'contrast-mythic';
      const profile =
        kind === 'collapse-scar'
          ? 'drop'
          : kind === 'cathedral-open'
            ? 'reveal'
            : kind === 'ghost-residue'
              ? 'release'
              : 'quiet';

      momentLabCycleIndexRef.current =
        (variantIndex + 1) % (MOMENT_LAB_KINDS.length * 3);
      applyMomentLabPreview(kind, style, profile, true);
    };

    cycle();
    const intervalId = window.setInterval(
      cycle,
      Math.max(2600, momentLabDurationSeconds * 1000 + 600)
    );

    return () => {
      window.clearInterval(intervalId);
      rendererRef.current?.setSignatureMomentDevOverride(null);
    };
  }, [
    isMomentLabAvailable,
    momentLabAutoCycleActive,
    momentLabDurationSeconds,
    proofWaveArmed
  ]);

  useEffect(() => {
    if (!launchQuickStartId && activeQuickStart) {
      setLaunchQuickStartId(activeQuickStart.id);
    }
  }, [launchQuickStartId, activeQuickStart]);

  useEffect(() => {
    launchQuickStartIdRef.current = launchQuickStartId;
  }, [launchQuickStartId]);

  useEffect(() => {
    autoCaptureStatusRef.current = autoCaptureStatus;
  }, [autoCaptureStatus]);

  const clearMomentLabPreview = (message?: string) => {
    momentLabCycleIndexRef.current = 0;
    rendererRef.current?.setSignatureMomentDevOverride(null);
    setMomentLabAutoCycleActive(false);
    if (message) {
      setMomentLabLatestReceipt(message);
    }
  };

  useEffect(() => {
    proofWaveArmedRef.current = proofWaveArmed;

    if (proofWaveArmed) {
      clearMomentLabPreview('Moment Lab stopped because Proof Wave is armed.');
    }

    if (runJournalRef.current.journal) {
      const journal = runJournalRef.current.journal;
      const mutableRun =
        journal.metadata.proofRunState !== 'finalized' &&
        journal.metadata.proofRunState !== 'invalidated';

      if (mutableRun) {
        journal.metadata.proofWaveArmed = proofWaveArmed;
        refreshRunJournalProofState(journal);
        updateRunJournalStatusFromJournal(journal);
        void persistRunJournalArtifacts(true);
      } else {
        updateRunJournalStatusFromJournal(journal);
      }
    } else {
      setRunJournalStatus((current) => ({
        ...current,
        proofWaveArmed,
        proofRunState: proofWaveArmed ? 'armed' : 'idle',
        readiness: currentProofReadiness,
        proofValidity: currentProofValidity
      }));
    }

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(PROOF_WAVE_STORAGE_KEY, proofWaveArmed ? '1' : '0');
  }, [proofWaveArmed]);

  useEffect(() => {
    captureFolderStatusRef.current = captureFolderStatus;
  }, [captureFolderStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      CAPTURE_AUTO_SAVE_STORAGE_KEY,
      captureFolderStatus.autoSave ? '1' : '0'
    );
  }, [captureFolderStatus.autoSave]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      PROOF_STILLS_STORAGE_KEY,
      autoCaptureStatus.proofStillsEnabled ? '1' : '0'
    );
  }, [autoCaptureStatus.proofStillsEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(PROOF_MISSION_STORAGE_KEY, proofMissionKind);
  }, [proofMissionKind]);

  useEffect(() => {
    if (proofScenarioKind !== proofMissionProfile.scenarioKind) {
      setProofScenarioKind(proofMissionProfile.scenarioKind);
    }
  }, [proofMissionProfile.scenarioKind, proofScenarioKind]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (proofScenarioKind === null) {
      window.localStorage.removeItem(PROOF_SCENARIO_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(PROOF_SCENARIO_STORAGE_KEY, proofScenarioKind);
  }, [proofScenarioKind]);

  useEffect(() => {
    const journal = runJournalRef.current.journal;
    if (!journal) {
      return;
    }

    if (journal.metadata.proofRunState === 'finalized') {
      updateRunJournalStatusFromJournal(journal);
      return;
    }

    if (journal.metadata.proofMission) {
      const lockedScenario = journal.metadata.proofMission.scenarioKind;
      if (proofScenarioKind !== lockedScenario) {
        invalidateActiveProofRun(
          'scenario-drift',
          journal.samples[journal.samples.length - 1]?.timestampMs ?? 0,
          `Proof scenario changed after mission lock (${lockedScenario} -> ${proofScenarioKind ?? 'unassigned'}).`,
          'restart-run'
        );
      }
      return;
    }

    journal.metadata.proofScenarioKind = proofMissionProfile.scenarioKind;
    journal.metadata.scenarioAssessment = deriveReplayScenarioAssessment({
      declaredScenario: proofMissionProfile.scenarioKind,
      sourceMode: journal.metadata.sourceMode,
      showStartRoute: journal.metadata.showStartRoute,
      noTouchWindowPassed: journal.metadata.noTouchWindowPassed,
      interventionCount: journal.metadata.interventionCount,
      interventionReasons: journal.metadata.interventionReasons,
      captureMode: proofWaveArmedRef.current ? 'auto' : 'manual',
      hasBuildIdentity: journal.metadata.buildInfo.valid === true
    });
    refreshRunJournalProofState(journal);
    updateRunJournalStatusFromJournal(
      journal,
      journal.metadata.scenarioAssessment ?? null
    );
    void persistRunJournalArtifacts(true);
  }, [proofMissionProfile.scenarioKind, proofScenarioKind]);

  useEffect(() => {
    const journal = runJournalRef.current.journal;

    if (journal) {
      if (journal.metadata.proofRunState === 'finalized') {
        updateRunJournalStatusFromJournal(journal);
        return;
      }

      refreshRunJournalProofState(journal, {
        sourceMode: journal.metadata.sourceMode,
        replayActive
      });
      updateRunJournalStatusFromJournal(journal);
      void persistRunJournalArtifacts(true);
      return;
    }

    setRunJournalStatus((current) => ({
      ...current,
      proofWaveArmed,
      proofRunState: proofWaveArmed ? 'armed' : 'idle',
      readiness: currentProofReadiness,
      proofValidity: currentProofValidity,
      buildIdentityValid: isReplayBuildInfoValid(BUILD_INFO)
    }));
  }, [
    captureFolderStatus.autoSave,
    captureFolderStatus.folderName,
    captureFolderStatus.ready,
    proofWaveArmed,
    replayActive,
    proofScenarioKind,
    showStartRoute,
    sourceMode
  ]);

  useEffect(() => {
    if (startError && (!proofWaveArmed || currentProofReadiness.ready)) {
      setStartError(null);
    }
  }, [currentProofReadiness.ready, proofWaveArmed, startError]);

  useEffect(() => {
    if (!fileSystemAccessSupported()) {
      return undefined;
    }

    let disposed = false;

    void loadStoredCaptureDirectoryHandle()
      .then(async (handle) => {
        if (!handle || disposed) {
          return;
        }

        captureDirectoryRef.current = handle;
        const ready = await ensureCaptureDirectoryPermission(handle, false);

        if (disposed) {
          return;
        }

        setCaptureFolderStatus((current) => ({
          ...current,
          folderName: getCaptureDirectoryDisplayName(handle),
          ready,
          autoSave: ready ? current.autoSave : false,
          error: ready
            ? null
            : 'Capture folder access needs to be armed again before auto save can run.'
        }));
      })
      .catch((error) => {
        if (disposed) {
          return;
        }

        setCaptureFolderStatus((current) => ({
          ...current,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to restore the stored capture folder.'
        }));
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!runtimeActive && advancedDrawerTab === 'steer') {
      setAdvancedDrawerTab(null);
    }
  }, [advancedDrawerTab, runtimeActive]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA';

      if (event.key.toLowerCase() === 'd' && event.shiftKey) {
        event.preventDefault();
        setDiagnosticsVisible((current) => !current);
        return;
      }

      if (isTypingTarget) {
        return;
      }

      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (
          shouldSuppressProofKeyboardShortcut({
            proofWaveArmed: proofWaveArmedRef.current,
            runtimeActive: status.phase === 'live',
            key: event.key
          })
        ) {
          recordSuppressedProofIntervention('advanced:keyboard-shortcut', 'keyboard-shortcut');
          setStartError(
            'Proof Wave suppressed the Advanced shortcut. Serious proof requires no steering after Start Show.'
          );
          return;
        }
        if (activationVisible) {
          setAdvancedDrawerTab((current) => {
            const nextMode = current === 'style' ? null : 'style';

            if (nextMode === 'style') {
              markSessionIntervention('advanced:style', 'keyboard-shortcut');
            }

            return nextMode;
          });
        } else {
          setAdvancedDrawerTab((current) => {
            const nextMode = current === 'steer' ? null : 'steer';

            if (nextMode === 'steer') {
              markSessionIntervention('advanced:steer', 'keyboard-shortcut');
            }

            return nextMode;
          });
        }
        return;
      }

      if (event.key === 'Escape') {
        setAdvancedDrawerTab(null);
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activationVisible, status.phase]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const audio = new AudioEngine();
    audioRef.current = audio;
    void audio.setSourceMode(sourceMode);
    audio.setTuning(audioTuning);
    if (preferredInputId) {
      void audio.setInputDevice(preferredInputId);
    }
    const unsubscribe = audio.subscribe((nextStatus) => {
      setStatus(nextStatus);
    });
    const unsubscribeFrames = audio.subscribeFrames((snapshot: AudioSnapshot) => {
      if (!snapshot.listeningFrame.calibrated) {
        return;
      }

      const nextFrame = cloneReplayCaptureFrame(
        snapshot.listeningFrame,
        snapshot.analysisFrame,
        snapshot.diagnostics,
        rendererRef.current?.getDiagnostics().visualTelemetry
      );
      const nextTimestampMs = nextFrame.timestampMs;
      const replayActiveNow = replayRef.current.hasCapture();
      const recording = recordingRef.current;

      if (
        !replayActiveNow &&
        recording.active &&
        nextTimestampMs > recording.lastTimestampMs
      ) {
        if (recording.frames.length >= MAX_CAPTURE_FRAMES) {
          recording.active = false;
          setRecordingSummary({
            active: false,
            frameCount: recording.frames.length,
            durationMs: Math.max(
              0,
              recording.lastTimestampMs - recording.firstTimestampMs
            )
          });
          setReplayError(
            'Capture reached the current frame limit. Stop and save or start a new capture.'
          );
        } else {
          recording.frames.push(nextFrame);
          if (recording.firstTimestampMs === 0) {
            recording.firstTimestampMs = nextTimestampMs;
          }
          recording.lastTimestampMs = nextTimestampMs;

          if (
            recording.frames.length === 1 ||
            recording.frames.length % 8 === 0
          ) {
            setRecordingSummary({
              active: true,
              frameCount: recording.frames.length,
              durationMs: Math.max(
                0,
                recording.lastTimestampMs - recording.firstTimestampMs
              )
            });
          }
        }
      }

      const autoCaptureState = autoCaptureRef.current;
      const lastBufferedTimestampMs =
        autoCaptureState.ring[autoCaptureState.ring.length - 1]?.timestampMs ??
        Number.NEGATIVE_INFINITY;

      if (nextTimestampMs < lastBufferedTimestampMs) {
        autoCaptureState.ring = [];
        autoCaptureState.proofStillRing = [];
        autoCaptureState.cooldownUntilMs = 0;
        autoCaptureState.lastProofStillSampleMs = Number.NEGATIVE_INFINITY;
        autoCaptureState.proofStillCaptureInFlight = false;
        autoCaptureState.captureCountsByKind = {};

        if (autoCaptureState.pending) {
          clearAutoCapturePending();
        }
      }

      autoCaptureState.ring.push(nextFrame);
      queueProofStillSample(nextTimestampMs, nextFrame);
      const minimumRingTimestamp = nextTimestampMs - MAX_AUTO_CAPTURE_PRE_ROLL_MS;
      while (
        autoCaptureState.ring.length > 0 &&
        autoCaptureState.ring[0]!.timestampMs < minimumRingTimestamp
      ) {
        autoCaptureState.ring.shift();
      }

      const liveSession = sessionInterventionRef.current;
      const sessionElapsedMs =
        liveSession.sessionStartedAtMs === null
          ? 0
          : Math.max(0, Date.now() - liveSession.sessionStartedAtMs);
      const noTouchWindowPassed =
        liveSession.sessionStartedAtMs !== null &&
        liveSession.interventionCount === 0 &&
        sessionElapsedMs >= NO_TOUCH_PROOF_WINDOW_MS;
      const runJournalState = runJournalRef.current;
      const runJournal = runJournalState.journal;
      const previousWorldAuthorityState = runJournalState.lastWorldAuthorityState;
      const previousQualityTier = runJournalState.lastQualityTier;
      const previousNoTouchWindowPassed = runJournalState.lastNoTouchWindowPassed;

      if (!replayActiveNow && runJournal) {
        const resolvedRouteId = resolveRouteIdFromListeningMode(
          snapshot.diagnostics.sourceMode
        );

        runJournal.metadata.updatedAt = new Date().toISOString();
        runJournal.metadata.sourceMode = snapshot.diagnostics.sourceMode;
        runJournal.metadata.sourceLabel =
          snapshot.diagnostics.deviceLabel || 'Unknown source';
        runJournal.metadata.resolvedRoute = resolvedRouteId;
        runJournal.metadata.sessionElapsedMs = sessionElapsedMs;
        runJournal.metadata.interventionCount = liveSession.interventionCount;
        runJournal.metadata.interventionReasons = [
          ...liveSession.interventionReasons
        ];
        runJournal.metadata.noTouchWindowPassed = noTouchWindowPassed;
        refreshRunJournalProofState(runJournal, {
          sourceMode: snapshot.diagnostics.sourceMode,
          replayActive: false
        });

        const routeCoherenceCheck = runJournal.metadata.proofReadiness?.checks.find(
          (check) => check.id === 'route-coherence'
        );
        if (routeCoherenceCheck && !routeCoherenceCheck.passed) {
          invalidateActiveProofRun(
            'route-integrity-break',
            nextTimestampMs,
            routeCoherenceCheck.reason,
            'restart-run'
          );
        }

        const captureFolderCheck = runJournal.metadata.proofReadiness?.checks.find(
          (check) => check.id === 'capture-folder'
        );
        if (
          captureFolderCheck &&
          !captureFolderCheck.passed &&
          runJournal.metadata.proofValidity?.startedReady
        ) {
          invalidateActiveProofRun(
            'capture-folder-permission-lost',
            nextTimestampMs,
            captureFolderCheck.reason,
            'restart-run'
          );
        }

      if (
        nextTimestampMs - runJournalState.lastSampleTimestampMs >=
        RUN_JOURNAL_SAMPLE_INTERVAL_MS
      ) {
        const lockedMission = runJournal.metadata.proofMission;
        runJournal.samples.push(
          buildReplayRunJournalSample({
            diagnostics: snapshot.diagnostics,
            renderer: rendererRef.current?.getDiagnostics() ?? INITIAL_RENDERER_STATE,
            listeningFrame: snapshot.listeningFrame,
              showStartRoute:
                lockedMission?.expectedRoute ?? runJournal.metadata.showStartRoute,
              routePolicy: resolveInputRoutePolicyFromShowStartRoute(
                lockedMission?.expectedRoute ??
                  runJournal.metadata.showStartRoute ??
                  showStartRoute
              ),
              resolvedRoute: resolvedRouteId,
              showCapabilityMode: appliedShowIntent.showCapabilityMode,
              showWorldId: appliedShowIntent.compatibilityIntent.showWorldId ?? undefined,
              effectiveWorldId: directorRuntime.effectiveWorldId ?? undefined,
              lookId: appliedShowIntent.compatibilityIntent.lookId ?? undefined,
              effectiveLookId: directorRuntime.effectiveLookId ?? undefined,
              worldPoolId:
                appliedShowIntent.compatibilityIntent.worldPoolId ?? undefined,
              lookPoolId:
                appliedShowIntent.compatibilityIntent.lookPoolId ?? undefined,
              stanceId: appliedShowIntent.compatibilityIntent.stanceId ?? undefined,
              proofWaveArmed: proofWaveArmedRef.current,
              proofScenarioKind:
                lockedMission?.scenarioKind ??
                runJournal.metadata.proofScenarioKind ??
                proofMissionProfile.scenarioKind,
              proofMission: lockedMission,
              interventionCount: liveSession.interventionCount,
              noTouchWindowPassed
            })
          );
          runJournalState.lastSampleTimestampMs = nextTimestampMs;
          updateRunJournalStatusFromJournal(runJournal);
          void persistRunJournalArtifacts();
        }

        if (snapshot.listeningFrame.showState !== runJournalState.lastShowState) {
          appendRunJournalMarker(
            'show-state-change',
            nextTimestampMs,
            `showState=${snapshot.listeningFrame.showState}`,
            {
              showState: snapshot.listeningFrame.showState
            }
          );
          runJournalState.lastShowState = snapshot.listeningFrame.showState;
        }

        if (
          nextFrame.visualTelemetry.stageCueFamily &&
          nextFrame.visualTelemetry.stageCueFamily !== runJournalState.lastCueFamily
        ) {
          appendRunJournalMarker(
            'cue-change',
            nextTimestampMs,
            `cueFamily=${nextFrame.visualTelemetry.stageCueFamily}`,
            {
              cueFamily: nextFrame.visualTelemetry.stageCueFamily
            }
          );
          runJournalState.lastCueFamily = nextFrame.visualTelemetry.stageCueFamily;
        }

        const signatureMomentKey =
          nextFrame.visualTelemetry.activeSignatureMoment &&
          nextFrame.visualTelemetry.activeSignatureMoment !== 'none'
            ? `${nextFrame.visualTelemetry.activeSignatureMoment}:${nextFrame.visualTelemetry.signatureMomentPhase}:${nextFrame.visualTelemetry.signatureMomentStyle ?? 'contrast-mythic'}`
            : null;
        if (
          signatureMomentKey &&
          signatureMomentKey !== runJournalState.lastSignatureMomentKey
        ) {
          const phase = nextFrame.visualTelemetry.signatureMomentPhase;
          const markerKind =
            phase === 'armed' || phase === 'eligible' || phase === 'precharge'
              ? 'signature-moment-precharge'
              : phase === 'strike' || phase === 'hold'
                ? 'signature-moment-peak'
                : 'signature-moment-residue';

          appendRunJournalMarker(
            markerKind,
            nextTimestampMs,
            `signature=${nextFrame.visualTelemetry.activeSignatureMoment} style=${nextFrame.visualTelemetry.signatureMomentStyle ?? 'contrast-mythic'} phase=${phase}`,
            {
              kind: nextFrame.visualTelemetry.activeSignatureMoment,
              style: nextFrame.visualTelemetry.signatureMomentStyle ?? 'contrast-mythic',
              phase: phase ?? null,
              intensity: nextFrame.visualTelemetry.signatureMomentIntensity ?? 0,
              washout: nextFrame.visualTelemetry.perceptualWashoutRisk ?? 0
            }
          );
          if (
            markerKind === 'signature-moment-peak' ||
            markerKind === 'signature-moment-residue'
          ) {
            captureRunCheckpointStill(nextTimestampMs, nextFrame, 'signature');
          }
          runJournalState.lastSignatureMomentKey = signatureMomentKey;
        } else if (!signatureMomentKey) {
          runJournalState.lastSignatureMomentKey = null;
        }

        if (
          nextFrame.visualTelemetry.worldAuthorityState &&
          nextFrame.visualTelemetry.worldAuthorityState !==
            previousWorldAuthorityState
        ) {
          const authorityReason = `world=${nextFrame.visualTelemetry.worldAuthorityState} delivered=${(
            nextFrame.visualTelemetry.worldDominanceDelivered ?? 0
          ).toFixed(3)}`;

          if (
            nextFrame.visualTelemetry.worldAuthorityState === 'shared' ||
            nextFrame.visualTelemetry.worldAuthorityState === 'dominant'
          ) {
            appendRunJournalMarker('authority-turn', nextTimestampMs, authorityReason, {
              worldAuthorityState: nextFrame.visualTelemetry.worldAuthorityState
            });
            captureRunCheckpointStill(nextTimestampMs, nextFrame, 'authority');
          } else {
            appendRunJournalMarker('cue-change', nextTimestampMs, authorityReason, {
              worldAuthorityState: nextFrame.visualTelemetry.worldAuthorityState
            });
          }

          runJournalState.lastWorldAuthorityState =
            nextFrame.visualTelemetry.worldAuthorityState;
        }

        if (
          runJournalState.lastQualityTier === null &&
          nextFrame.visualTelemetry.qualityTier
        ) {
          runJournalState.lastQualityTier = nextFrame.visualTelemetry.qualityTier;
        }

        if (
          previousQualityTier !== null &&
          nextFrame.visualTelemetry.qualityTier &&
          nextFrame.visualTelemetry.qualityTier !== previousQualityTier
        ) {
          appendRunJournalMarker(
            'quality-downgrade',
            nextTimestampMs,
            `quality=${previousQualityTier ?? 'unknown'} -> ${nextFrame.visualTelemetry.qualityTier}`,
            {
              qualityTier: nextFrame.visualTelemetry.qualityTier
            }
          );
          runJournalState.lastQualityTier = nextFrame.visualTelemetry.qualityTier;
        }

        if (resolvedRouteId !== runJournalState.lastRouteId) {
          appendRunJournalMarker(
            'route-change',
            nextTimestampMs,
            `route=${resolvedRouteId}`,
            {
              route: resolvedRouteId
            }
          );
          runJournalState.lastRouteId = resolvedRouteId;
        }

        const governanceRisk =
          nextFrame.visualTelemetry.compositionSafetyFlag === true ||
          (nextFrame.visualTelemetry.overbright ?? 0) >= 0.22 ||
          nextFrame.visualTelemetry.stageFallbackHeroOverreach === true ||
          nextFrame.visualTelemetry.stageFallbackRingOverdraw === true;
        if (governanceRisk && !runJournalState.lastGovernanceRisk) {
          appendRunJournalMarker(
            'governance-risk',
            nextTimestampMs,
            `safety=${nextFrame.visualTelemetry.compositionSafetyFlag === true ? 'risk' : 'ok'} overbright=${(nextFrame.visualTelemetry.overbright ?? 0).toFixed(3)}`,
            {
              overbright: nextFrame.visualTelemetry.overbright ?? 0,
              compositionSafetyFlag:
                nextFrame.visualTelemetry.compositionSafetyFlag === true
            }
          );
        }
        runJournalState.lastGovernanceRisk = governanceRisk;

        const quietBeauty =
          snapshot.listeningFrame.ambienceConfidence >= 0.42 &&
          (nextFrame.visualTelemetry.chamberPresenceScore ?? 0) >= 0.18 &&
          (nextFrame.visualTelemetry.worldDominanceDelivered ?? 0) >= 0.16 &&
          (nextFrame.visualTelemetry.compositionSafetyScore ?? 0.8) >= 0.72;
        if (quietBeauty && !runJournalState.lastQuietBeauty) {
          appendRunJournalMarker(
            'quiet-beauty',
            nextTimestampMs,
            `ambience=${snapshot.listeningFrame.ambienceConfidence.toFixed(3)} chamber=${(nextFrame.visualTelemetry.chamberPresenceScore ?? 0).toFixed(3)}`,
            {
              ambienceConfidence: snapshot.listeningFrame.ambienceConfidence
            }
          );
          captureRunCheckpointStill(nextTimestampMs, nextFrame, 'quiet');
        }
        runJournalState.lastQuietBeauty = quietBeauty;

        if (noTouchWindowPassed && !previousNoTouchWindowPassed) {
          appendRunJournalMarker(
            'operator-trust-clear',
            nextTimestampMs,
            'No-touch proof window cleared.',
            {
              noTouchWindowPassed: true
            }
          );
          captureRunCheckpointStill(nextTimestampMs, nextFrame, 'trust');
        }
        runJournalState.lastNoTouchWindowPassed = noTouchWindowPassed;

        if (
          proofWaveArmedRef.current &&
          nextTimestampMs - runJournalState.lastCheckpointStillTimestampMs >=
            RUN_CHECKPOINT_STILL_INTERVAL_MS
        ) {
          captureRunCheckpointStill(nextTimestampMs, nextFrame, 'checkpoint');
          runJournalState.lastCheckpointStillTimestampMs = nextTimestampMs;
        }
      }

      if (replayActiveNow) {
        invalidateActiveProofRun(
          'replay-entered',
          nextTimestampMs,
          'Replay mode was entered during an armed proof run.',
          'continue-exploratory'
        );
        if (autoCaptureState.pending) {
          clearAutoCapturePending();
        }

        return;
      }

      const liveAutoCaptureStatus = autoCaptureStatusRef.current;
      const trigger = detectAutoCaptureTrigger(
        snapshot.listeningFrame,
        snapshot.diagnostics,
        {
          visualTelemetry: nextFrame.visualTelemetry,
          noTouchWindowPassed,
          previousNoTouchWindowPassed,
          previousWorldAuthorityState: previousWorldAuthorityState as
              | 'background'
              | 'support'
              | 'shared'
              | 'dominant'
              | null,
          previousQualityTier
        }
      );

      if (
        liveAutoCaptureStatus.enabled &&
        !autoCaptureState.pending &&
        trigger
      ) {
        const timingProfile = resolveAutoCaptureTimingProfile(trigger.kind);
        const currentRunTriggerCount =
          autoCaptureState.captureCountsByKind[trigger.kind] ?? 0;
        const firstOperatorTrustClear =
          trigger.kind === 'operator-trust-clear' && currentRunTriggerCount === 0;
        const cooldownReady =
          nextTimestampMs >= autoCaptureState.cooldownUntilMs ||
          firstOperatorTrustClear;
        const underRunCaptureLimit =
          timingProfile.maxCapturesPerRun === undefined ||
          currentRunTriggerCount < timingProfile.maxCapturesPerRun;

        if (!cooldownReady) {
          return;
        }

        if (!underRunCaptureLimit) {
          autoCaptureState.cooldownUntilMs =
            nextTimestampMs + timingProfile.cooldownMs;
          return;
        }

        const preRollFrames = autoCaptureState.ring.filter(
          (frameItem) =>
            frameItem.timestampMs >= nextTimestampMs - timingProfile.preRollMs
        );
        const preRollProofStillSamples = autoCaptureState.proofStillRing.filter(
          (sample) => sample.timestampMs >= nextTimestampMs - timingProfile.preRollMs
        );

        autoCaptureState.pending = {
          trigger,
          timingProfile,
          frames: [...preRollFrames],
          proofStillSamples: [...preRollProofStillSamples],
          firstTimestampMs: preRollFrames[0]?.timestampMs ?? nextTimestampMs,
          lastTimestampMs:
            preRollFrames[preRollFrames.length - 1]?.timestampMs ?? nextTimestampMs,
          lastTriggerTimestampMs: trigger.timestampMs,
          endTimestampMs: clampAutoCaptureEndTimestamp(
            preRollFrames[0]?.timestampMs ?? nextTimestampMs,
            trigger.timestampMs + timingProfile.postRollMs,
            timingProfile
          ),
          peakDropImpact: snapshot.listeningFrame.dropImpact,
          peakSectionChange: snapshot.listeningFrame.sectionChange,
          peakBeatConfidence: snapshot.listeningFrame.beatConfidence,
          peakMusicConfidence: snapshot.listeningFrame.musicConfidence,
          triggerCount: 1,
          extensionCount: 0
        };
        autoCaptureState.captureCountsByKind[trigger.kind] =
          currentRunTriggerCount + 1;
        setAutoCaptureStatus((current) => ({
          ...current,
          pending: true,
          pendingLabel: trigger.label,
          currentTriggerProfile: trigger.kind
        }));
      }

      const pendingCapture = autoCaptureState.pending;

      if (!pendingCapture) {
        return;
      }

      if (trigger) {
        const triggerGap =
          trigger.timestampMs - pendingCapture.lastTriggerTimestampMs;
        const triggerUpgrades =
          getAutoCaptureTriggerPriority(trigger.kind) >
          getAutoCaptureTriggerPriority(pendingCapture.trigger.kind);
        const nextTimingProfile = triggerUpgrades
          ? resolveAutoCaptureTimingProfile(trigger.kind)
          : pendingCapture.timingProfile;
        const distinctTrigger =
          triggerUpgrades ||
          triggerGap >= pendingCapture.timingProfile.retriggerGapMs;

        if (distinctTrigger) {
          pendingCapture.triggerCount += 1;
        }

        const canExtendWindow =
          distinctTrigger &&
          pendingCapture.triggerCount <= nextTimingProfile.maxTriggerCount &&
          pendingCapture.extensionCount < nextTimingProfile.maxExtensions &&
          (triggerGap <= nextTimingProfile.extensionWindowMs || triggerUpgrades);

        if (canExtendWindow) {
          const nextEndTimestampMs = clampAutoCaptureEndTimestamp(
            pendingCapture.firstTimestampMs,
            Math.max(
              pendingCapture.endTimestampMs,
              trigger.timestampMs + nextTimingProfile.postRollMs
            ),
            nextTimingProfile
          );

          if (nextEndTimestampMs > pendingCapture.endTimestampMs) {
            pendingCapture.endTimestampMs = nextEndTimestampMs;
            pendingCapture.extensionCount += 1;
          }

          pendingCapture.lastTriggerTimestampMs = trigger.timestampMs;
        }

        if (
          triggerUpgrades ||
          (distinctTrigger &&
            trigger.kind === 'section' &&
            (pendingCapture.trigger.kind === 'release' ||
              pendingCapture.trigger.kind === 'floor'))
        ) {
          pendingCapture.trigger = trigger;
          pendingCapture.timingProfile = nextTimingProfile;
          setAutoCaptureStatus((current) => ({
            ...current,
            pendingLabel: trigger.label,
            currentTriggerProfile: trigger.kind
          }));
        }

        if (distinctTrigger) {
          pendingCapture.lastTriggerTimestampMs = trigger.timestampMs;
        }
      }

      if (nextTimestampMs > pendingCapture.lastTimestampMs) {
        pendingCapture.frames.push(nextFrame);
        pendingCapture.lastTimestampMs = nextTimestampMs;
      }

      pendingCapture.peakDropImpact = Math.max(
        pendingCapture.peakDropImpact,
        snapshot.listeningFrame.dropImpact
      );
      pendingCapture.peakSectionChange = Math.max(
        pendingCapture.peakSectionChange,
        snapshot.listeningFrame.sectionChange
      );
      pendingCapture.peakBeatConfidence = Math.max(
        pendingCapture.peakBeatConfidence,
        snapshot.listeningFrame.beatConfidence
      );
      pendingCapture.peakMusicConfidence = Math.max(
        pendingCapture.peakMusicConfidence,
        snapshot.listeningFrame.musicConfidence
      );

      if (nextTimestampMs < pendingCapture.endTimestampMs) {
        return;
      }

      autoCaptureState.cooldownUntilMs =
        nextTimestampMs + pendingCapture.timingProfile.cooldownMs;
      autoCaptureState.pending = null;
      setAutoCaptureStatus((current) => ({
        ...current,
        pending: false,
        pendingLabel: null,
        currentTriggerProfile: null
      }));

      const capturedAt = new Date();
      const finalizedDiagnostics = audio.getDiagnostics();
      const finalizedSourceMode = finalizedDiagnostics.sourceMode;
      const activeQuickStartProfile = getActiveQuickStartProfile(
        controlsRef.current,
        finalizedSourceMode
      );
      const launchQuickStartProfile = launchQuickStartIdRef.current
        ? QUICK_START_PROFILES[launchQuickStartIdRef.current]
        : activeQuickStartProfile;
      const label = buildAutoCaptureLabel(pendingCapture.trigger.kind, capturedAt);

      void (async () => {
        const proofStillBundle = buildProofStillBundle(
          label,
          pendingCapture.trigger.timestampMs,
          pendingCapture.proofStillSamples
        );
        let proofStillSummary = proofStillBundle.proofStillSummary;
        const proofStillFiles = proofStillBundle.files;

        if (
          captureFolderStatusRef.current.autoSave &&
          proofStillFiles.length > 0 &&
          captureDirectoryRef.current
        ) {
          const permissionGranted = await ensureCaptureDirectoryPermission(
            captureDirectoryRef.current,
            false
          );

          if (permissionGranted) {
            const proofSaveResult = await saveCaptureBlobsToDirectory(
              captureDirectoryRef.current,
              proofStillFiles,
              {
                subdirectories: pendingCapture.trigger.kind
                  ? getRunSubdirectories(['stills'])
                  : undefined
              }
            );

            proofStillSummary = {
              ...proofStillSummary,
              saved: proofStillSummary.saved.filter((entry) =>
                proofSaveResult.savedFileNames.includes(entry.fileName)
              )
            };

            if (proofSaveResult.warning) {
              proofStillSummary = {
                ...proofStillSummary,
                warning: proofSaveResult.warning
              };
            }
          } else {
            proofStillSummary = {
              ...proofStillSummary,
              saved: [],
              warning:
                'Proof stills were requested, but the capture folder is no longer writable.'
            };
          }
        }

        const capture = buildReplayCapture(
          pendingCapture.frames,
          finalizedDiagnostics,
          rendererRef.current?.getDiagnostics() ?? INITIAL_RENDERER_STATE,
          controlsRef.current,
          {
            label,
            captureMode: 'auto',
            triggerKind: pendingCapture.trigger.kind,
            triggerReason: pendingCapture.trigger.reason,
            sourceMode: finalizedSourceMode,
            launchQuickStartProfileId: launchQuickStartProfile?.id ?? null,
            launchQuickStartProfileLabel: launchQuickStartProfile?.label ?? null,
            quickStartProfileId: activeQuickStartProfile?.id ?? null,
            quickStartProfileLabel: activeQuickStartProfile?.label ?? null,
            triggerCount: pendingCapture.triggerCount,
            extensionCount: pendingCapture.extensionCount,
            triggerTimestampMs: pendingCapture.trigger.timestampMs,
            proofStills: proofStillSummary,
            ...buildDirectorCaptureContext(
              finalizedDiagnostics,
              finalizedSourceMode,
              finalizedDiagnostics.listeningFrame
            )
          }
        );
        const summary: AutoCaptureSummary = {
          id: `${capture.metadata.label}_${capture.metadata.capturedAt}`,
          label: capture.metadata.label,
          triggerLabel: pendingCapture.trigger.label,
          triggerReason: pendingCapture.trigger.reason,
          capturedAt: capture.metadata.capturedAt,
          frameCount: pendingCapture.frames.length,
          durationMs: Math.max(
            0,
            pendingCapture.lastTimestampMs - pendingCapture.firstTimestampMs
          ),
          peakDropImpact: pendingCapture.peakDropImpact,
          peakSectionChange: pendingCapture.peakSectionChange,
          peakBeatConfidence: pendingCapture.peakBeatConfidence,
          peakMusicConfidence: pendingCapture.peakMusicConfidence,
          capture
        };

        const savedForEvidence = await saveRunCaptureAndRegister(
          capture,
          capture.metadata.triggerTimestampMs ?? pendingCapture.trigger.timestampMs,
          `${pendingCapture.trigger.kind} clip saved`,
          {
            triggerKind: pendingCapture.trigger.kind
          }
        );

        setAutoCaptures((current) =>
          [summary, ...current].slice(0, MAX_AUTO_CAPTURE_HISTORY)
        );
        setAutoCaptureStatus((current) => ({
          ...current,
          latestLabel: summary.label,
          latestTriggerLabel: summary.triggerLabel,
          latestDurationMs: summary.durationMs,
          latestTriggerReason: summary.triggerReason,
          latestTriggerProfile: pendingCapture.trigger.kind,
          latestProofStillCount: proofStillSummary.saved.length,
          captureCount: current.captureCount + 1
        }));

        if (!savedForEvidence && capture.metadata.runId) {
          return;
        }

        if (liveAutoCaptureStatus.autoDownload) {
          downloadReplayCapture(capture);
        }
      })();
    });

    let disposed = false;
    void import('../engine/VisualizerEngine').then(async ({ VisualizerEngine }) => {
      if (disposed) {
        return;
      }

      const renderer = new VisualizerEngine(canvas, () => {
        const replay = replayRef.current;

        if (replay.hasCapture()) {
          replay.update(performance.now());

          return replay.getCurrentFrame();
        }

        return audio.getLatestFrame();
      });
      rendererRef.current = renderer;
      renderer.setTuning(runtimeTuning);

      const nextDiagnostics = await renderer.start();

      if (!disposed) {
        setRendererDiagnostics(nextDiagnostics);
      }
    });

    const diagnosticsInterval = window.setInterval(() => {
      if (disposed) {
        return;
      }

      const liveDiagnostics = audio.getDiagnostics();
      const replay = replayRef.current;
      const nextReplayStatus = replay.getStatus();
      const nextAudioDiagnostics = replay.hasCapture()
        ? buildReplayAudioDiagnostics(liveDiagnostics, replay)
        : liveDiagnostics;

      setReplayStatus(nextReplayStatus);
      setFrame(nextAudioDiagnostics.listeningFrame);
      setAudioDiagnostics(nextAudioDiagnostics);
      if (rendererRef.current) {
        setRendererDiagnostics(rendererRef.current.getDiagnostics());
      }
    }, 120);

    return () => {
      disposed = true;
      unsubscribe();
      unsubscribeFrames();
      window.clearInterval(diagnosticsInterval);
      void audio.dispose();
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        DIRECTOR_INTENT_STORAGE_KEY,
        serializeDirectorIntent(compatibilityIntent)
      );
      window.localStorage.setItem(SHOW_START_ROUTE_STORAGE_KEY, showStartRoute);
      window.localStorage.setItem(
        ADVANCED_CURATION_STORAGE_KEY,
        serializeAdvancedCurationState(advancedCuration)
      );
      window.localStorage.setItem(
        ADVANCED_STEERING_STORAGE_KEY,
        serializeAdvancedSteeringState(advancedSteering)
      );
      window.localStorage.setItem(
        SAVED_STANCES_STORAGE_KEY,
        serializeSavedStances(savedStances)
      );
      window.localStorage.setItem(
        CONTROL_STORAGE_KEY,
        serializeUserControlState(controls)
      );
      window.localStorage.setItem(SOURCE_MODE_STORAGE_KEY, sourceMode);
      if (preferredInputId) {
        window.localStorage.setItem(INPUT_STORAGE_KEY, preferredInputId);
      } else {
        window.localStorage.removeItem(INPUT_STORAGE_KEY);
      }
    }
  }, [
    advancedCuration,
    advancedSteering,
    compatibilityIntent,
    controls,
    preferredInputId,
    savedStances,
    showStartRoute,
    sourceMode
  ]);

  useEffect(() => {
    audioRef.current?.setTuning(audioTuning);
    rendererRef.current?.setTuning(runtimeTuning);
  }, [audioTuning, runtimeTuning]);

  const handleStart = async () => {
    const activeMission = getReplayProofMissionProfile(proofMissionKind);
    const startRoute = proofWaveArmed ? activeMission.expectedRoute : showStartRoute;
    const nextSourceMode = resolveListeningModeFromShowStartRoute(startRoute);
    const diagnostics = audioRef.current?.getDiagnostics() ?? audioDiagnostics;
    const proofStartReadiness = deriveReplayProofReadiness({
      proofWaveArmed,
      captureFolderLabel: captureFolderStatus.folderName,
      captureFolderReady: captureFolderStatus.ready && captureFolderStatus.autoSave,
      showStartRoute: startRoute,
      sourceMode: nextSourceMode,
      proofScenarioKind: activeMission.scenarioKind,
      buildInfo: BUILD_INFO,
      replayActive,
      routeCapabilities
    });

    if (proofWaveArmed && !proofStartReadiness.ready) {
      const blockingReasons = proofStartReadiness.checks
        .filter((check) => check.blocking && !check.passed)
        .map((check) => check.reason);
      const nextError =
        blockingReasons.length > 0
          ? `Proof Wave is armed, but this run is not ready: ${blockingReasons.join(' ')}`
          : 'Proof Wave is armed, but the serious-run readiness contract is not satisfied.';

      setStartError(nextError);
      setReplayError(nextError);
      setAdvancedDrawerTab('backstage');
      return;
    }

    setLaunchQuickStartId(
      getCompatibilityQuickStartProfileIdFromShowStartRoute(startRoute)
    );
    setStartError(null);
    if (proofWaveArmed) {
      const corrections = [...runJournalRef.current.proofMissionCorrections];
      const addCorrection = (message: string) => {
        if (!corrections.includes(message)) {
          corrections.push(message);
        }
      };

      if (showStartRoute !== startRoute) {
        addCorrection(`route set to ${startRoute} at Start Show`);
      }
      if (sourceMode !== nextSourceMode) {
        addCorrection(`source mode set to ${nextSourceMode} at Start Show`);
      }
      if (proofScenarioKind !== activeMission.scenarioKind) {
        addCorrection(`proof scenario set to ${activeMission.scenarioKind} at Start Show`);
      }
      if (activeMission.lockAdvancedControls) {
        if (
          serializeAdvancedCurationState(advancedCuration) !==
          serializeAdvancedCurationState(DEFAULT_ADVANCED_CURATION_STATE)
        ) {
          addCorrection('advanced curation reset at Start Show');
        }
        if (
          serializeAdvancedSteeringState(advancedSteering) !==
          serializeAdvancedSteeringState(DEFAULT_ADVANCED_STEERING_STATE)
        ) {
          addCorrection('advanced steering reset at Start Show');
        }
        setAdvancedCuration(DEFAULT_ADVANCED_CURATION_STATE);
        setAdvancedSteering(DEFAULT_ADVANCED_STEERING_STATE);
      }
      runJournalRef.current.proofMissionCorrections = corrections;
      setProofScenarioKind(activeMission.scenarioKind);
    }
    setShowStartRoute(startRoute);
    setSourceMode(nextSourceMode);
    setAdvancedDrawerTab(null);
    setReplayError(null);
    beginNoTouchSession();
    try {
      await audioRef.current?.setSourceMode(nextSourceMode);
      audioRef.current?.setTuning(audioTuning);
      await audioRef.current?.start();
      const startedStatus = audioRef.current?.getStatus();

      if (startedStatus?.phase === 'error') {
        throw new Error(startedStatus.error ?? 'Audio engine failed to start.');
      }

      startRunJournal(
        nextSourceMode,
        audioRef.current?.getDiagnostics() ?? diagnostics
      );
    } catch (error) {
      updateSessionInterventionSummary(INITIAL_SESSION_INTERVENTION_SUMMARY);
      const message =
        error instanceof Error
          ? error.message
          : 'Audio engine failed to start.';
      setStartError(message);
      setReplayError(message);
    }
  };

  const buildDirectorCaptureContext = (
    captureDiagnostics: AudioDiagnostics,
    captureSourceMode: ListeningMode,
    captureFrame: ListeningFrame
  ) => {
    const activeJournal = runJournalRef.current.journal;
    const lockedMission = activeJournal?.metadata.proofMission ?? null;
    const lockedScenarioKind =
      lockedMission?.scenarioKind ??
      activeJournal?.metadata.proofScenarioKind ??
      proofMissionProfile.scenarioKind;
    const lockedRoute = lockedMission?.expectedRoute ?? showStartRoute;
    const appliedAtCapture = resolveAppliedShowIntent(
      lockedRoute,
      advancedCuration,
      advancedSteering,
      captureFrame,
      captureSourceMode
    );
    const runtimeAtCapture = appliedAtCapture.resolution;
    const routeRecommendationAtCapture = resolveAutoRouteRecommendation({
      routePolicy: resolveInputRoutePolicyFromShowStartRoute(lockedRoute),
      currentMode: captureSourceMode,
      statusPhase: status.phase,
      diagnostics: {
        rawRms: captureDiagnostics.rawRms,
        noiseFloor: captureDiagnostics.noiseFloor,
        roomMusicFloorActive: captureDiagnostics.roomMusicFloorActive
      },
      frame: captureFrame,
      capabilities: routeCapabilities
    });
    const session = sessionInterventionRef.current;
    const elapsedSinceStartMs =
      session.sessionStartedAtMs === null
        ? 0
        : Math.max(0, Date.now() - session.sessionStartedAtMs);

    return {
      routePolicy: appliedAtCapture.compatibilityIntent.routePolicy,
      resolvedRoute: resolveRouteIdFromListeningMode(captureSourceMode),
      showStartRoute: lockedRoute,
      showCapabilityMode: appliedAtCapture.showCapabilityMode,
      showConstraintState: appliedAtCapture.constraintState,
      routeRecommendation: routeRecommendationAtCapture
        ? {
            recommendedRoute: routeRecommendationAtCapture.recommendedRoute,
            strength: routeRecommendationAtCapture.strength,
            reason: routeRecommendationAtCapture.reason,
            headline: routeRecommendationAtCapture.headline,
            detail: routeRecommendationAtCapture.detail
          }
        : undefined,
      showWorldId: appliedAtCapture.compatibilityIntent.showWorldId,
      effectiveWorldId: runtimeAtCapture.effectiveWorldId,
      lookId: appliedAtCapture.compatibilityIntent.lookId,
      effectiveLookId: runtimeAtCapture.effectiveLookId,
      worldPoolId: appliedAtCapture.compatibilityIntent.worldPoolId,
      lookPoolId: appliedAtCapture.compatibilityIntent.lookPoolId,
      stanceId: appliedAtCapture.compatibilityIntent.stanceId,
      anthologyWorldFamilyId: appliedAtCapture.anthologyDirectorState.worldFamilyId,
      anthologyLookProfileId: appliedAtCapture.anthologyDirectorState.lookProfileId,
      anthologyHeroSpeciesId: appliedAtCapture.anthologyDirectorState.heroSpeciesId,
      anthologyHeroMutationVerb:
        appliedAtCapture.anthologyDirectorState.heroMutationVerb,
      anthologyWorldMutationVerb:
        appliedAtCapture.anthologyDirectorState.worldMutationVerb,
      anthologyConsequenceMode:
        appliedAtCapture.anthologyDirectorState.consequenceMode,
      anthologyAftermathState: appliedAtCapture.anthologyDirectorState.aftermathState,
      anthologyLightingRigState:
        appliedAtCapture.anthologyDirectorState.lightingRigState,
      anthologyCameraPhrase: appliedAtCapture.anthologyDirectorState.cameraPhrase,
      anthologyParticleFieldRole:
        appliedAtCapture.anthologyDirectorState.particleFieldRole,
      anthologyMixedMediaAssetId:
        appliedAtCapture.anthologyDirectorState.mixedMediaAssetId,
      anthologyMotifId: appliedAtCapture.anthologyDirectorState.motifId,
      anthologyGraduationStatus:
        appliedAtCapture.anthologyDirectorState.graduationStatus,
      anthologyMusicPhase: appliedAtCapture.anthologyDirectorState.music.phase,
      anthologyMusicRegime: appliedAtCapture.anthologyDirectorState.music.regime,
      launchSurfaceMode: 'launch' as const,
      livePanelMode:
        advancedDrawerTab === 'backstage'
          ? ('backstage' as const)
          : advancedDrawerTab === null
            ? null
            : ('deck' as const),
      advancedDrawerTab,
      buildInfo: BUILD_INFO,
      runId: runJournalRef.current.journal?.metadata.runId ?? null,
      sessionStartedAt:
        session.sessionStartedAtMs === null
          ? null
          : new Date(session.sessionStartedAtMs).toISOString(),
      sessionElapsedMs: elapsedSinceStartMs,
      interventionCount: session.interventionCount,
      interventionReasons: session.interventionReasons,
      firstInterventionTimestampMs: session.firstInterventionTimestampMs,
      noTouchWindowPassed:
        session.interventionCount === 0 &&
        session.sessionStartedAtMs !== null &&
        elapsedSinceStartMs >= NO_TOUCH_PROOF_WINDOW_MS,
      proofScenarioKind: lockedScenarioKind,
      proofMission: lockedMission ?? undefined,
      scenarioAssessment: lockedMission
        ? buildMissionLockedScenarioAssessment(lockedMission)
        : activeJournal?.metadata.scenarioAssessment ?? undefined,
      proofReadiness:
        activeJournal?.metadata.proofReadiness ?? currentProofReadiness,
      proofValidity:
        activeJournal?.metadata.proofValidity ?? currentProofValidity,
      proofRunState:
        activeJournal?.metadata.proofRunState ??
        (proofWaveArmedRef.current ? 'armed' : 'idle'),
      finishedAt: activeJournal?.metadata.finishedAt,
      finalizedAt: activeJournal?.metadata.finalizedAt,
      proofMissionEligibility:
        activeJournal?.metadata.proofMissionEligibility,
      suppressedInterventions:
        activeJournal?.metadata.suppressedInterventions,
      artifactIntegrity:
        activeJournal?.metadata.artifactIntegrity,
      runLifecycleState:
        activeJournal?.metadata.lifecycleState ?? 'inbox',
      directorBiasSnapshot: appliedAtCapture.compatibilityIntent.biases
    };
  };

  const saveCaptureToConfiguredFolder = async (
    capture: ReturnType<typeof buildReplayCapture>
  ): Promise<boolean> => {
    const handle = captureDirectoryRef.current;

    if (!handle) {
      setCaptureFolderStatus((current) => ({
        ...current,
        ready: false,
        autoSave: false,
        error:
          'Choose a writable capture folder first. The recommended target is the repo captures/inbox folder.'
      }));
      return false;
    }

    try {
      const ready = await ensureCaptureDirectoryPermission(handle, false);

      if (!ready) {
        setCaptureFolderStatus((current) => ({
          ...current,
          ready: false,
          autoSave: false,
          error:
            'Capture folder access is no longer granted. Choose the folder again before auto save can continue. The recommended target is the repo captures/inbox folder.'
        }));
        return false;
      }

      const { fileName, folderLabel } = await saveReplayCaptureToDirectory(handle, capture, {
        subdirectories: capture.metadata.runId
          ? ['runs', capture.metadata.runId, 'clips']
          : undefined
      });

      setCaptureFolderStatus((current) => ({
        ...current,
        folderName: folderLabel,
        ready: true,
        error: null,
        lastSavedLabel: fileName
      }));

      return true;
    } catch (error) {
      setCaptureFolderStatus((current) => ({
        ...current,
        ready: false,
        autoSave: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save the capture into the selected folder.'
      }));
      return false;
    }
  };

  const saveRunCaptureAndRegister = async (
    capture: ReturnType<typeof buildReplayCapture>,
    markerTimestampMs: number,
    markerReason: string,
    markerMetadata?: Record<string, string | number | boolean | null | undefined>
  ): Promise<boolean> => {
    const activeRunJournal = runJournalRef.current.journal;
    const captureBelongsToActiveRun =
      Boolean(activeRunJournal && capture.metadata.runId) &&
      activeRunJournal?.metadata.runId === capture.metadata.runId;
    const captureFileName = `${capture.metadata.label}.json`;

    if (!captureBelongsToActiveRun) {
      if (captureFolderStatusRef.current.autoSave) {
        return saveCaptureToConfiguredFolder(capture);
      }

      return true;
    }

    if (!captureFolderStatusRef.current.autoSave) {
      invalidateActiveProofRun(
        'capture-save-failed',
        markerTimestampMs,
        `Capture ${capture.metadata.label} could not be saved because auto-save-to-folder is off.`,
        'restart-run'
      );
      await persistRunJournalArtifacts(true);
      return false;
    }

    const saved = await saveCaptureToConfiguredFolder(capture);

    if (!saved) {
      invalidateActiveProofRun(
        'capture-save-failed',
        markerTimestampMs,
        `Capture ${capture.metadata.label} failed to save into the run package.`,
        'restart-run'
      );
      await persistRunJournalArtifacts(true);
      return false;
    }

    if (!activeRunJournal) {
      return true;
    }

    registerReplayRunClip(activeRunJournal, {
      captureLabel: capture.metadata.label,
      fileName: captureFileName,
      captureMode: capture.metadata.captureMode,
      capturedAt: capture.metadata.capturedAt,
      triggerKind: capture.metadata.triggerKind,
      triggerTimestampMs: capture.metadata.triggerTimestampMs,
      qualityFlags: capture.metadata.qualityFlags,
      scenarioAssessment: capture.metadata.scenarioAssessment
    });
    activeRunJournal.metadata.scenarioAssessment =
      capture.metadata.scenarioAssessment ?? activeRunJournal.metadata.scenarioAssessment;
    appendRunJournalMarker('clip-saved', markerTimestampMs, markerReason, {
      ...markerMetadata,
      captureLabel: capture.metadata.label
    });
    updateRunJournalStatusFromJournal(
      activeRunJournal,
      capture.metadata.scenarioAssessment ?? null
    );

    const lockedMissionClip =
      Boolean(activeRunJournal.metadata.proofMission) &&
      capture.metadata.proofMission?.kind ===
        activeRunJournal.metadata.proofMission?.kind &&
      capture.metadata.proofScenarioKind ===
        activeRunJournal.metadata.proofMission?.scenarioKind;

    if (
      capture.metadata.scenarioAssessment?.validated !== true &&
      !lockedMissionClip
    ) {
      invalidateActiveProofRun(
        'scenario-drift',
        markerTimestampMs,
        `Declared proof scenario no longer matches the saved clip evidence for ${capture.metadata.label}.`,
        'restart-run'
      );
    }

    await persistRunJournalArtifacts(true);
    return true;
  };

  const finalizePendingAutoCaptureWindow = async (
    reason = 'finish-proof-run'
  ): Promise<boolean> => {
    const pendingCapture = autoCaptureRef.current.pending;

    if (!pendingCapture || pendingCapture.frames.length === 0) {
      return true;
    }

    autoCaptureRef.current.pending = null;
    setAutoCaptureStatus((current) => {
      const nextStatus = {
        ...current,
        pending: false,
        pendingLabel: null,
        currentTriggerProfile: null
      };

      autoCaptureStatusRef.current = nextStatus;
      return nextStatus;
    });

    const capturedAt = new Date();
    const finalizedDiagnostics = audioRef.current?.getDiagnostics() ?? audioDiagnostics;
    const finalizedSourceMode = finalizedDiagnostics.sourceMode;
    const activeQuickStartProfile = getActiveQuickStartProfile(
      controlsRef.current,
      finalizedSourceMode
    );
    const launchQuickStartProfile = launchQuickStartIdRef.current
      ? QUICK_START_PROFILES[launchQuickStartIdRef.current]
      : activeQuickStartProfile;
    const label = buildAutoCaptureLabel(pendingCapture.trigger.kind, capturedAt);
    const proofStillBundle = buildProofStillBundle(
      label,
      pendingCapture.trigger.timestampMs,
      pendingCapture.proofStillSamples
    );
    let proofStillSummary = proofStillBundle.proofStillSummary;
    const proofStillFiles = proofStillBundle.files;

    if (
      captureFolderStatusRef.current.autoSave &&
      proofStillFiles.length > 0 &&
      captureDirectoryRef.current
    ) {
      const permissionGranted = await ensureCaptureDirectoryPermission(
        captureDirectoryRef.current,
        false
      );

      if (permissionGranted) {
        const proofSaveResult = await saveCaptureBlobsToDirectory(
          captureDirectoryRef.current,
          proofStillFiles,
          {
            subdirectories: getRunSubdirectories(['stills'])
          }
        );

        proofStillSummary = {
          ...proofStillSummary,
          saved: proofStillSummary.saved.filter((entry) =>
            proofSaveResult.savedFileNames.includes(entry.fileName)
          )
        };

        if (proofSaveResult.warning) {
          proofStillSummary = {
            ...proofStillSummary,
            warning: proofSaveResult.warning
          };
        }
      } else {
        proofStillSummary = {
          ...proofStillSummary,
          saved: [],
          warning:
            'Proof stills were requested, but the capture folder is no longer writable.'
        };
      }
    }

    const capture = buildReplayCapture(
      pendingCapture.frames,
      finalizedDiagnostics,
      rendererRef.current?.getDiagnostics() ?? INITIAL_RENDERER_STATE,
      controlsRef.current,
      {
        label,
        captureMode: 'auto',
        triggerKind: pendingCapture.trigger.kind,
        triggerReason: `${pendingCapture.trigger.reason} (${reason})`,
        sourceMode: finalizedSourceMode,
        launchQuickStartProfileId: launchQuickStartProfile?.id ?? null,
        launchQuickStartProfileLabel: launchQuickStartProfile?.label ?? null,
        quickStartProfileId: activeQuickStartProfile?.id ?? null,
        quickStartProfileLabel: activeQuickStartProfile?.label ?? null,
        triggerCount: pendingCapture.triggerCount,
        extensionCount: pendingCapture.extensionCount,
        triggerTimestampMs: pendingCapture.trigger.timestampMs,
        proofStills: proofStillSummary,
        ...buildDirectorCaptureContext(
          finalizedDiagnostics,
          finalizedSourceMode,
          finalizedDiagnostics.listeningFrame
        )
      }
    );
    const summary: AutoCaptureSummary = {
      id: `${capture.metadata.label}_${capture.metadata.capturedAt}`,
      label: capture.metadata.label,
      triggerLabel: pendingCapture.trigger.label,
      triggerReason: pendingCapture.trigger.reason,
      capturedAt: capture.metadata.capturedAt,
      frameCount: pendingCapture.frames.length,
      durationMs: Math.max(
        0,
        pendingCapture.lastTimestampMs - pendingCapture.firstTimestampMs
      ),
      peakDropImpact: pendingCapture.peakDropImpact,
      peakSectionChange: pendingCapture.peakSectionChange,
      peakBeatConfidence: pendingCapture.peakBeatConfidence,
      peakMusicConfidence: pendingCapture.peakMusicConfidence,
      capture
    };
    const saved = await saveRunCaptureAndRegister(
      capture,
      capture.metadata.triggerTimestampMs ?? pendingCapture.trigger.timestampMs,
      `${pendingCapture.trigger.kind} clip saved during finish`,
      {
        triggerKind: pendingCapture.trigger.kind
      }
    );

    if (saved) {
      setAutoCaptures((current) =>
        [summary, ...current].slice(0, MAX_AUTO_CAPTURE_HISTORY)
      );
      setAutoCaptureStatus((current) => {
        const nextStatus = {
          ...current,
          latestLabel: summary.label,
          latestTriggerLabel: summary.triggerLabel,
          latestDurationMs: summary.durationMs,
          latestTriggerReason: summary.triggerReason,
          latestTriggerProfile: pendingCapture.trigger.kind,
          latestProofStillCount: proofStillSummary.saved.length,
          captureCount: current.captureCount + 1
        };

        autoCaptureStatusRef.current = nextStatus;
        return nextStatus;
      });
    }

    return saved;
  };

  const handleFinishProofRun = async () => {
    const journal = runJournalRef.current.journal;

    if (!journal) {
      await audioRef.current?.stop();
      setProofWaveArmed(false);
      return;
    }

    journal.metadata.proofRunState = 'finishing';
    updateRunJournalStatusFromJournal(journal);
    const session = sessionInterventionRef.current;
    const elapsedMs =
      session.sessionStartedAtMs === null
        ? journal.metadata.sessionElapsedMs
        : Math.max(0, Date.now() - session.sessionStartedAtMs);
    const finalNoTouchPassed =
      session.sessionStartedAtMs !== null &&
      session.interventionCount === 0 &&
      elapsedMs >= NO_TOUCH_PROOF_WINDOW_MS;

    appendRunJournalMarker('run-finish', elapsedMs, 'Finish Proof Run requested.', {
      runId: journal.metadata.runId
    });

    const pendingSaved = await finalizePendingAutoCaptureWindow();
    await audioRef.current?.stop();

    journal.metadata.finishedAt = new Date().toISOString();
    journal.metadata.sessionElapsedMs = elapsedMs;
    journal.metadata.interventionCount = session.interventionCount;
    journal.metadata.interventionReasons = [...session.interventionReasons];
    journal.metadata.noTouchWindowPassed = finalNoTouchPassed;
    journal.metadata.scenarioAssessment = deriveReplayScenarioAssessment({
      declaredScenario:
        journal.metadata.proofMission?.scenarioKind ??
        journal.metadata.proofScenarioKind ??
        null,
      sourceMode: journal.metadata.sourceMode,
      showStartRoute: journal.metadata.showStartRoute,
      noTouchWindowPassed: finalNoTouchPassed,
      interventionCount: session.interventionCount,
      interventionReasons: session.interventionReasons,
      captureMode: 'auto',
      hasBuildIdentity: journal.metadata.buildInfo.valid === true
    });
    refreshRunJournalProofState(journal, {
      sourceMode: journal.metadata.sourceMode,
      replayActive: false
    });

    if (!pendingSaved) {
      invalidateActiveProofRun(
        'capture-save-failed',
        elapsedMs,
        'Pending auto-capture could not be closed and saved during Finish Proof Run.',
        'restart-run'
      );
    }

    const artifactIntegrity = deriveReplayArtifactIntegrityFromJournal(journal);
    journal.metadata.artifactIntegrity = artifactIntegrity;
    const invalidations = journal.metadata.proofValidity?.invalidations ?? [];
    const eligibility = deriveProofMissionEligibility({
      proofWaveArmed: journal.metadata.proofWaveArmed,
      proofMission: journal.metadata.proofMission,
      sourceMode: journal.metadata.sourceMode,
      showStartRoute: journal.metadata.showStartRoute,
      proofReadiness: journal.metadata.proofReadiness,
      scenarioAssessment: journal.metadata.scenarioAssessment,
      invalidations,
      artifactIntegrity,
      noTouchWindowPassed: finalNoTouchPassed,
      durationMs: elapsedMs,
      buildInfo: journal.metadata.buildInfo
    });

    journal.metadata.proofMissionEligibility = eligibility;
    journal.metadata.proofValidity = deriveReplayProofValidity({
      proofWaveArmed: journal.metadata.proofWaveArmed,
      readiness: journal.metadata.proofReadiness,
      startedReady:
        journal.metadata.proofValidity?.startedReady ??
        journal.metadata.proofReadiness?.ready === true,
      invalidations,
      missionEligibility: eligibility
    });
    journal.metadata.finalizedAt = new Date().toISOString();
    journal.metadata.proofRunState = 'finalized';
    appendRunJournalMarker(
      'run-finalized',
      elapsedMs,
      `Finish verdict: ${eligibility.verdict}`,
      {
        currentProofEligible: eligibility.currentProofEligible,
        artifactIntegrity: artifactIntegrity.verdict
      }
    );
    journal.metadata.updatedAt = new Date().toISOString();
    updateRunJournalStatusFromJournal(journal);
    const persisted = await persistRunJournalArtifacts(true);

    if (!persisted) {
      invalidateActiveProofRun(
        'run-finalize-failed',
        elapsedMs,
        'Finish Proof Run could not persist the finalized journal/manifest.',
        'restart-run'
      );
      updateRunJournalStatusFromJournal(journal);
    }

    updateSessionInterventionSummary(INITIAL_SESSION_INTERVENTION_SUMMARY);
    setProofWaveArmed(false);
    setStartError(
      `Proof run ${journal.metadata.runId} finalized as ${eligibility.verdict}. Review: npm run proof:current && npm run evidence:index && npm run run:review -- --run-id ${journal.metadata.runId}`
    );
  };

  const handleRecalibrate = async () => {
    await audioRef.current?.restart();
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  };

  const handleShowStartRouteChange = (nextRoute: ShowStartRoute) => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention(`start-route:${nextRoute}`, 'ui');
      setStartError(
        'Proof Mission locks the route during serious proof. Use Finish Proof Run, then rerun if the route was wrong.'
      );
      return;
    }

    markSessionIntervention(`start-route:${nextRoute}`);
    setShowStartRoute(nextRoute);
    const nextMode = resolveListeningModeFromShowStartRoute(nextRoute);
    setSourceMode(nextMode);
    void audioRef.current?.setSourceMode(nextMode);
  };

  const handleWorldPoolChange = (worldPoolId: AdvancedCurationState['worldPoolId']) => {
    markSessionIntervention(`world-pool:${worldPoolId}`);
    setAdvancedCuration((current) => {
      const pool = WORLD_POOL_DEFINITIONS[worldPoolId];
      const nextWorldId =
        current.showWorldId === null
          ? null
          : pool.worldIds.includes(current.showWorldId)
            ? current.showWorldId
            : pool.defaultWorldId;
      return {
        ...current,
        worldPoolId,
        showWorldId: nextWorldId
      };
    });
  };

  const handleWorldChange = (showWorldId: AdvancedCurationState['showWorldId']) => {
    markSessionIntervention(`world:${showWorldId ?? 'auto'}`);
    setAdvancedCuration((current) => ({
      ...current,
      showWorldId
    }));
  };

  const handleLookPoolChange = (lookPoolId: AdvancedCurationState['lookPoolId']) => {
    markSessionIntervention(`look-pool:${lookPoolId}`);
    setAdvancedCuration((current) => {
      const pool = LOOK_POOL_DEFINITIONS[lookPoolId];
      const nextLookId =
        current.lookId === null
          ? null
          : pool.lookIds.includes(current.lookId)
            ? current.lookId
            : pool.defaultLookId;
      return {
        ...current,
        lookPoolId,
        lookId: nextLookId
      };
    });
  };

  const handleLookChange = (lookId: AdvancedCurationState['lookId']) => {
    markSessionIntervention(`look:${lookId ?? 'auto'}`);
    setAdvancedCuration((current) => ({
      ...current,
      lookId
    }));
  };

  const handleStanceChange = (stanceId: AdvancedCurationState['stanceId']) => {
    markSessionIntervention(`stance:${stanceId ?? 'auto'}`);
    setAdvancedCuration((current) => ({
      ...current,
      stanceId
    }));
  };

  const handleDirectorBiasChange = (
    key: AdvancedSteeringKey,
    value: number
  ) => {
    const nextValue = Math.max(0, Math.min(1, value));
    markSessionIntervention(`bias:${key}`);

    setAdvancedSteering((current) => ({
      ...current,
      [key]: nextValue
    }));
  };

  const handleResetAdvanced = () => {
    markSessionIntervention('advanced:reset');
    setAdvancedCuration(DEFAULT_ADVANCED_CURATION_STATE);
    setAdvancedSteering(DEFAULT_ADVANCED_STEERING_STATE);
  };

  const handleResetAdvancedSteering = () => {
    markSessionIntervention('advanced:reset-steering');
    setAdvancedSteering(DEFAULT_ADVANCED_STEERING_STATE);
  };

  const handleSaveCurrentStance = (name: string) => {
    markSessionIntervention('save-stance');
    const nextStance = createSavedStance(name, compatibilityIntent);

    setSavedStances((current) =>
      [nextStance, ...current.filter((stance) => stance.id !== nextStance.id)].slice(0, 24)
    );
  };

  const handleLoadSavedStance = (stanceId: string) => {
    const saved = savedStances.find((stance) => stance.id === stanceId);

    if (!saved) {
      return;
    }

    markSessionIntervention(`load-stance:${stanceId}`);
    setAdvancedCuration(
      sanitizeAdvancedCurationState({
        worldPoolId: saved.worldPoolId,
        lookPoolId: saved.lookPoolId,
        showWorldId: saved.showWorldId,
        lookId: saved.lookId,
        stanceId: saved.stanceId
      })
    );
    setAdvancedSteering(extractAdvancedSteeringFromBiasState(saved.biases));
    setAdvancedDrawerTab('style');
  };

  const handleDeleteSavedStance = (stanceId: string) => {
    setSavedStances((current) =>
      current.filter((stance) => stance.id !== stanceId)
    );
  };

  const applyRouteRecommendation = () => {
    if (!routeRecommendation) {
      return;
    }

    const recommendedStartRoute: ShowStartRoute =
      routeRecommendation.recommendedRoute === 'hybrid'
        ? 'combo'
        : routeRecommendation.recommendedRoute === 'the-room'
          ? 'microphone'
          : 'pc-audio';
    handleShowStartRouteChange(recommendedStartRoute);
  };

  const openAdvancedDrawer = (tab: Exclude<AdvancedDrawerTab, null>) => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention(`advanced:${tab}`, 'ui');
      setStartError(
        'Proof Mission locks Advanced controls during serious proof. Use Finish Proof Run, then rerun if steering was needed.'
      );
      return;
    }

    markSessionIntervention(`advanced:${tab}`);
    setAdvancedDrawerTab(tab);
  };

  const closeAdvancedDrawer = () => {
    setAdvancedDrawerTab(null);
  };

  const handleApplyStyleAnchorFromAuto = () => {
    markSessionIntervention('advanced:anchor-auto-state');
    setAdvancedCuration((current) => ({
      ...current,
      showWorldId: directorRuntime.effectiveWorldId,
      lookId: directorRuntime.effectiveLookId
    }));
  };
  const handleInputDeviceChange = (deviceId: string) => {
    markSessionIntervention(deviceId ? `input-device:${deviceId}` : 'input-device:default');
    setPreferredInputId(deviceId);
    void audioRef.current?.setInputDevice(deviceId || null);
  };

  const handleStartCapture = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('manual-capture:start', 'ui');
      return;
    }

    if (replayRef.current.hasCapture()) {
      setReplayError(
        'Return to live mode before starting a new capture.'
      );
      return;
    }

    markSessionIntervention('manual-capture:start');
    recordingRef.current = {
      active: true,
      frames: [],
      firstTimestampMs: 0,
      lastTimestampMs: 0
    };
    setReplayError(null);
    setRecordingSummary({
      active: true,
      frameCount: 0,
      durationMs: 0
    });
  };

  const handleToggleAutoCapture = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('auto-capture:toggle', 'ui');
      return;
    }

    setAutoCaptureStatus((current) => {
      const enabled = !current.enabled;

      if (!enabled) {
        autoCaptureRef.current.pending = null;
      }

      const nextStatus = {
        ...current,
        enabled,
        pending: enabled ? current.pending : false,
        pendingLabel: enabled ? current.pendingLabel : null,
        currentTriggerProfile: enabled ? current.currentTriggerProfile : null
      };

      autoCaptureStatusRef.current = nextStatus;

      return nextStatus;
    });
  };

  const handleToggleAutoDownload = () => {
    setAutoCaptureStatus((current) => {
      const nextStatus = {
        ...current,
        autoDownload: !current.autoDownload
      };

      autoCaptureStatusRef.current = nextStatus;

      return nextStatus;
    });
  };

  const handleToggleProofStills = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('proof-stills:toggle', 'ui');
      return;
    }

    setAutoCaptureStatus((current) => {
      const proofStillsEnabled = !current.proofStillsEnabled;
      const nextStatus = {
        ...current,
        proofStillsEnabled
      };

      autoCaptureStatusRef.current = nextStatus;

      return nextStatus;
    });
  };

  const handleProofMissionChange = (nextMission: ReplayProofMissionKind) => {
    const mission = getReplayProofMissionProfile(nextMission);
    const activeJournal = runJournalRef.current.journal;
    if (
      activeJournal?.metadata.proofWaveArmed &&
      activeJournal.metadata.proofRunState !== 'finalized'
    ) {
      setStartError(
        'Proof mission is locked for the active run. Stop and start a new run to change missions.'
      );
      return;
    }

    setStartError(null);
    setProofMissionKind(nextMission);
    setProofScenarioKind(mission.scenarioKind);
    if (proofWaveArmedRef.current) {
      runJournalRef.current.proofMissionCorrections = [
        `proof mission changed to ${mission.label} before Start Show`
      ];
      setShowStartRoute(mission.expectedRoute);
      setSourceMode(mission.expectedSourceMode);
      void audioRef.current?.setSourceMode(mission.expectedSourceMode);
      if (mission.lockAdvancedControls) {
        setAdvancedDrawerTab(null);
        setAdvancedCuration(DEFAULT_ADVANCED_CURATION_STATE);
        setAdvancedSteering(DEFAULT_ADVANCED_STEERING_STATE);
      }
    }
  };

  const handleArmProofWave = async () => {
    try {
      clearMomentLabPreview('Moment Lab stopped before arming Proof Wave.');
      const mission = getReplayProofMissionProfile(proofMissionKind);
      const corrections: string[] = [];

      let handle = captureDirectoryRef.current;

      if (!handle) {
        handle = await pickCaptureDirectoryHandle();
      }

      const ready = await ensureCaptureDirectoryPermission(handle, true);
      if (!ready) {
        setCaptureFolderStatus((current) => ({
          ...current,
          ready: false,
          autoSave: false,
          error:
            'Proof Wave requires a writable capture folder. Grant write access to continue.'
        }));
        return;
      }

      captureDirectoryRef.current = handle;
      await persistCaptureDirectoryHandle(handle);
      if (proofScenarioKind !== mission.scenarioKind) {
        corrections.push(
          `proof scenario set to ${mission.scenarioKind} for ${mission.label}`
        );
      }
      if (showStartRoute !== mission.expectedRoute) {
        corrections.push(`route set to ${mission.expectedRoute} for ${mission.label}`);
      }
      if (sourceMode !== mission.expectedSourceMode) {
        corrections.push(
          `source mode set to ${mission.expectedSourceMode} for ${mission.label}`
        );
      }
      if (!autoCaptureStatusRef.current.enabled) {
        corrections.push('auto capture enabled');
      }
      if (!captureFolderStatusRef.current.autoSave) {
        corrections.push('auto save to folder enabled');
      }
      if (!autoCaptureStatusRef.current.proofStillsEnabled) {
        corrections.push('proof stills enabled');
      }
      if (mission.lockAdvancedControls) {
        if (advancedDrawerTab !== null) {
          corrections.push('advanced panel closed for serious proof');
        }
        if (
          serializeAdvancedCurationState(advancedCuration) !==
          serializeAdvancedCurationState(DEFAULT_ADVANCED_CURATION_STATE)
        ) {
          corrections.push('advanced curation reset for serious proof');
        }
        if (
          serializeAdvancedSteeringState(advancedSteering) !==
          serializeAdvancedSteeringState(DEFAULT_ADVANCED_STEERING_STATE)
        ) {
          corrections.push('advanced steering reset for serious proof');
        }
        setAdvancedDrawerTab(null);
        setAdvancedCuration(DEFAULT_ADVANCED_CURATION_STATE);
        setAdvancedSteering(DEFAULT_ADVANCED_STEERING_STATE);
      }
      runJournalRef.current.proofMissionCorrections = corrections;
      setProofScenarioKind(mission.scenarioKind);
      setShowStartRoute(mission.expectedRoute);
      setSourceMode(mission.expectedSourceMode);
      void audioRef.current?.setSourceMode(mission.expectedSourceMode);
      setCaptureFolderStatus((current) => ({
        ...current,
        folderName: getCaptureDirectoryDisplayName(handle),
        ready: true,
        autoSave: true,
        error: null
      }));
      setAutoCaptureStatus((current) => {
        const nextStatus = {
          ...current,
          enabled: true,
          proofStillsEnabled: true
        };

        autoCaptureStatusRef.current = nextStatus;
        return nextStatus;
      });
      setProofWaveArmed(true);
      setStartError(null);
      setReplayError(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setCaptureFolderStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to arm the proof wave.'
      }));
    }
  };

  const handleChooseCaptureFolder = async () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('capture-folder:choose', 'ui');
      return;
    }

    markSessionIntervention('capture-folder:choose');
    try {
      const handle = await pickCaptureDirectoryHandle();
      const ready = await ensureCaptureDirectoryPermission(handle, true);

      if (!ready) {
        setCaptureFolderStatus((current) => ({
          ...current,
          ready: false,
          autoSave: false,
          error: 'Write access to the selected folder was not granted.'
        }));
        return;
      }

      captureDirectoryRef.current = handle;
      await persistCaptureDirectoryHandle(handle);
      setStartError(null);
      setCaptureFolderStatus((current) => ({
        ...current,
        folderName: getCaptureDirectoryDisplayName(handle),
        ready: true,
        autoSave: true,
        error: null
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setCaptureFolderStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to choose a capture folder.'
      }));
    }
  };

  const handleToggleAutoSaveToFolder = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('auto-save:toggle', 'ui');
      return;
    }

    setCaptureFolderStatus((current) => {
      if (!current.supported) {
        return {
          ...current,
          error: 'Capture folder saving is not supported in this browser.'
        };
      }

      if (!current.ready) {
        return {
          ...current,
          autoSave: false,
          error:
            'Choose a writable capture folder first. The recommended target is the repo captures/inbox folder.'
        };
      }

      const nextAutoSave = !current.autoSave;
      const latestRunTimestamp =
        runJournalRef.current.journal?.samples[
          Math.max(0, (runJournalRef.current.journal?.samples.length ?? 1) - 1)
        ]?.timestampMs ?? 0;

      if (!nextAutoSave) {
        invalidateActiveProofRun(
          'capture-folder-permission-lost',
          latestRunTimestamp,
          'Auto-save-to-folder was turned off during an armed proof run.',
          'restart-run'
        );
      }

      return {
        ...current,
        autoSave: nextAutoSave,
        error: null
      };
    });
  };

  const handleForgetCaptureFolder = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('capture-folder:forget', 'ui');
      return;
    }

    const latestRunTimestamp =
      runJournalRef.current.journal?.samples[
        Math.max(0, (runJournalRef.current.journal?.samples.length ?? 1) - 1)
      ]?.timestampMs ?? 0;
    invalidateActiveProofRun(
      'capture-folder-permission-lost',
      latestRunTimestamp,
      'The capture folder was forgotten during an armed proof run.',
      'restart-run'
    );
    captureDirectoryRef.current = null;
    void clearStoredCaptureDirectoryHandle();
    setCaptureFolderStatus((current) => ({
      ...current,
      autoSave: false,
      folderName: null,
      ready: false,
      error: null,
      lastSavedLabel: null
    }));
  };

  const handleStopCapture = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('manual-capture:stop', 'ui');
      return;
    }

    markSessionIntervention('manual-capture:stop');
    const recording = recordingRef.current;

    recording.active = false;

    if (recording.frames.length === 0) {
      setRecordingSummary(INITIAL_RECORDING_SUMMARY);
      setReplayError(
        'No live frames were captured. Start recording after the listening engine is live.'
      );

      return;
    }

    const capture = buildReplayCapture(
      recording.frames,
      audioRef.current?.getDiagnostics() ?? audioDiagnostics,
      rendererRef.current?.getDiagnostics() ?? rendererDiagnostics,
      controls,
      {
        sourceMode,
        launchQuickStartProfileId: launchQuickStartIdRef.current ?? activeQuickStart?.id ?? null,
        launchQuickStartProfileLabel: launchQuickStartIdRef.current
          ? QUICK_START_PROFILES[launchQuickStartIdRef.current]?.label ?? null
          : activeQuickStart?.label ?? null,
        quickStartProfileId: activeQuickStart?.id ?? null,
        quickStartProfileLabel: activeQuickStart?.label ?? null,
        ...buildDirectorCaptureContext(
          audioRef.current?.getDiagnostics() ?? audioDiagnostics,
          sourceMode,
          frame
        )
      }
    );

    const replay = replayRef.current;
    replay.load(capture);
    setReplayStatus(replay.getStatus());
    setRecordingSummary({
      active: false,
      frameCount: recording.frames.length,
      durationMs: Math.max(
        0,
        recording.lastTimestampMs - recording.firstTimestampMs
      )
    });
    setReplayError(null);
    recordingRef.current = {
      active: false,
      frames: [],
      firstTimestampMs: 0,
      lastTimestampMs: 0
    };
    if (captureFolderStatusRef.current.autoSave) {
      void saveRunCaptureAndRegister(
        capture,
        capture.frames[capture.frames.length - 1]?.timestampMs ?? 0,
        'manual clip saved',
        {
          captureMode: capture.metadata.captureMode
        }
      ).then((saved) => {
        if (!saved) {
          downloadReplayCapture(capture);
        }
      });
      return;
    }

    downloadReplayCapture(capture);
  };

  const handleOpenReplayFile = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('replay:open-file', 'ui');
      return;
    }

    markSessionIntervention('replay:open-file');
    replayFileInputRef.current?.click();
  };

  const handleReplayFileSelected = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const capture = parseReplayCapture(raw);

      invalidateActiveProofRun(
        'replay-entered',
        runJournalRef.current.journal?.samples[
          Math.max(0, (runJournalRef.current.journal?.samples.length ?? 1) - 1)
        ]?.timestampMs ?? 0,
        'A replay capture was loaded during an armed proof run.',
        'continue-exploratory'
      );
      clearAutoCapturePending();
      replayRef.current.load(capture);
      setReplayStatus(replayRef.current.getStatus());
      setReplayError(null);
    } catch (error) {
      setReplayError(
        error instanceof Error ? error.message : 'Replay capture could not be loaded.'
      );
    }
  };

  const handleToggleReplayPlayback = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('replay:toggle-playback', 'ui');
      return;
    }

    markSessionIntervention('replay:toggle-playback');
    const replay = replayRef.current;
    const nextStatus = replay.getStatus();

    if (nextStatus.mode === 'playing') {
      replay.pause();
    } else {
      replay.play(performance.now());
    }

    setReplayStatus(replay.getStatus());
  };

  const handleStopReplay = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('replay:stop', 'ui');
      return;
    }

    markSessionIntervention('replay:stop');
    replayRef.current.stop();
    setReplayStatus(replayRef.current.getStatus());
  };

  const handleClearReplay = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('replay:clear', 'ui');
      return;
    }

    markSessionIntervention('replay:clear');
    replayRef.current.clear();
    setReplayStatus(replayRef.current.getStatus());
    setReplayError(null);
  };

  const handleLoadLatestAutoCapture = () => {
    if (proofRunLocksControls()) {
      recordSuppressedProofIntervention('replay:load-latest-auto', 'ui');
      return;
    }

    markSessionIntervention('replay:load-latest-auto');
    const latestCapture = autoCaptures[0];

    if (!latestCapture) {
      return;
    }

    invalidateActiveProofRun(
      'replay-entered',
      latestCapture.capture.metadata.triggerTimestampMs ?? 0,
      'A saved auto capture was loaded during an armed proof run.',
      'continue-exploratory'
    );
    clearAutoCapturePending();
    replayRef.current.load(latestCapture.capture);
    setReplayStatus(replayRef.current.getStatus());
    setReplayError(null);
  };

  const handleDownloadLatestAutoCapture = () => {
    const latestCapture = autoCaptures[0];

    if (!latestCapture) {
      return;
    }

    downloadReplayCapture(latestCapture.capture);
  };

  const handleSaveLatestAutoCaptureToFolder = () => {
    const latestCapture = autoCaptures[0];

    if (!latestCapture) {
      return;
    }

    void saveCaptureToConfiguredFolder(latestCapture.capture);
  };

  const handleLoadAutoCapture = (captureId: string) => {
    markSessionIntervention(`replay:load-auto:${captureId}`);
    const selectedCapture = autoCaptures.find((capture) => capture.id === captureId);

    if (!selectedCapture) {
      return;
    }

    invalidateActiveProofRun(
      'replay-entered',
      selectedCapture.capture.metadata.triggerTimestampMs ?? 0,
      'A saved auto capture was loaded during an armed proof run.',
      'continue-exploratory'
    );
    clearAutoCapturePending();
    replayRef.current.load(selectedCapture.capture);
    setReplayStatus(replayRef.current.getStatus());
    setReplayError(null);
  };

  const handleDownloadAutoCapture = (captureId: string) => {
    const selectedCapture = autoCaptures.find((capture) => capture.id === captureId);

    if (!selectedCapture) {
      return;
    }

    downloadReplayCapture(selectedCapture.capture);
  };

  const handleClearAutoCaptures = () => {
    autoCaptureRef.current.pending = null;
    autoCaptureRef.current.proofStillRing = [];
    setAutoCaptures([]);
    setAutoCaptureStatus((current) => {
      const nextStatus = {
        ...current,
        pending: false,
        pendingLabel: null,
        captureCount: 0,
        latestLabel: null,
        latestTriggerLabel: null,
        latestDurationMs: 0,
        latestTriggerReason: null,
        currentTriggerProfile: null,
        latestTriggerProfile: null,
        latestProofStillCount: 0
      };

      autoCaptureStatusRef.current = nextStatus;

      return nextStatus;
    });
  };

  const handleSeekReplay = (ratio: number) => {
    replayRef.current.seekRatio(ratio);
    setReplayStatus(replayRef.current.getStatus());
  };

  const latestAutoCapture = autoCaptures[0] ?? null;
  const liveAutoCaptureStatus: AutoCaptureStatus = {
    ...autoCaptureStatus,
    latestLabel: latestAutoCapture?.label ?? autoCaptureStatus.latestLabel,
    latestTriggerLabel:
      latestAutoCapture?.triggerLabel ?? autoCaptureStatus.latestTriggerLabel,
    latestDurationMs:
      latestAutoCapture?.durationMs ?? autoCaptureStatus.latestDurationMs,
    latestTriggerReason:
      latestAutoCapture?.triggerReason ?? autoCaptureStatus.latestTriggerReason
  };
  const advancedDrawerOpen = advancedDrawerTab !== null;
  const immersiveView =
    fullscreen &&
    runtimeActive &&
    !advancedDrawerOpen &&
    !diagnosticsVisible;
  const launchSurfaceVisible = activationVisible;
  const backstagePanelOpen = advancedDrawerOpen;
  const topStatusLabel = replayActive
    ? `replay ${replayStatus.mode}`
    : status.phase === 'live'
      ? frame.showState
      : status.message;
  const proofElapsedMs =
    sessionInterventionSummary.sessionStartedAtMs === null
      ? runJournalStatus.proofMissionEligibility?.durationMs ?? 0
      : Math.max(0, Date.now() - sessionInterventionSummary.sessionStartedAtMs);
  const proofHudStatus = runJournalStatus.active
    ? {
        active: true,
        missionLabel:
          runJournalStatus.proofMission?.label ?? proofMissionProfile.label ?? null,
        runId: runJournalStatus.runId,
        elapsedSeconds: proofElapsedMs / 1000,
        targetSeconds:
          runJournalStatus.proofMission?.expectedDurationSeconds.min ?? null,
        noTouchPassed:
          sessionInterventionSummary.sessionStartedAtMs !== null &&
          sessionInterventionSummary.interventionCount === 0 &&
          proofElapsedMs >= NO_TOUCH_PROOF_WINDOW_MS,
        clipCount: runJournalStatus.clipCount,
        stillCount: runJournalStatus.checkpointStillCount,
        lastPersistedAt: runJournalStatus.lastPersistedAt,
        validityLabel:
          runJournalStatus.proofMissionEligibility?.verdict ??
          runJournalStatus.proofValidity?.verdict ??
          runJournalStatus.proofRunState
      }
    : undefined;
  const momentLabDisabledReason = !isMomentLabAvailable
    ? 'Localhost/dev only'
    : proofWaveArmed || proofRunLocksControls()
      ? 'Disabled during armed or live serious proof'
      : null;
  const momentLabState: MomentLabState = {
    available: isMomentLabAvailable,
    active: momentLabDisabledReason === null,
    autoCycleActive: momentLabAutoCycleActive,
    disabledReason: momentLabDisabledReason,
    kind: momentLabKind,
    style: momentLabStyle,
    syntheticProfile: momentLabSyntheticProfile,
    durationSeconds: momentLabDurationSeconds,
    latestReceipt: momentLabLatestReceipt
  };

  return (
    <main
      className={`app-shell ${immersiveView ? 'app-shell--immersive' : ''}`}
    >
      <input
        accept="application/json,.json"
        hidden
        onChange={handleReplayFileSelected}
        ref={replayFileInputRef}
        type="file"
      />

      <canvas
        aria-label="VisuLive scene"
        className="scene-canvas"
        ref={canvasRef}
      />

      <ShowHud
        currentRouteId={resolveRouteIdFromListeningMode(sourceMode)}
        onApplyRouteRecommendation={applyRouteRecommendation}
        onFinishProofRun={() => {
          void handleFinishProofRun();
        }}
        onOpenAdvanced={() => {
          openAdvancedDrawer('steer');
        }}
        proofStatus={proofHudStatus}
        routeRecommendation={routeRecommendation}
        showCapabilityMode={appliedShowIntent.showCapabilityMode}
        statusLabel={topStatusLabel}
        visible={runtimeActive && !activationVisible && !immersiveView}
      />

      <ShowLaunchSurface
        onOpenAdvanced={() => {
          openAdvancedDrawer('style');
        }}
        onStartRouteChange={handleShowStartRouteChange}
        onStart={() => {
          void handleStart();
        }}
        renderer={rendererDiagnostics}
        proofReadiness={currentProofReadiness}
        proofAdvancedLocked={proofRunLocksControls()}
        proofMissionLabel={proofMissionProfile.label}
        proofScenarioKind={proofScenarioKind}
        proofWaveArmed={proofWaveArmed}
        startError={startError}
        startRoute={showStartRoute}
        status={status}
        visible={launchSurfaceVisible}
      />

      <BackstagePanel
        activeAdvancedTab={advancedDrawerTab ?? 'style'}
        activeInputLabel={audioDiagnostics.deviceLabel}
        curation={advancedCuration}
        audio={audioDiagnostics}
        audioInputs={audioDiagnostics.availableInputs}
        autoCaptureStatus={liveAutoCaptureStatus}
        capabilityMode={appliedShowIntent.showCapabilityMode}
        captureFolder={captureFolderStatus}
        diagnosticsVisible={diagnosticsVisible}
        effectiveLookId={directorRuntime.effectiveLookId}
        effectiveWorldId={directorRuntime.effectiveWorldId}
        isFullscreen={fullscreen}
        proofWaveArmed={proofWaveArmed}
        proofMissionKind={proofMissionKind}
        onAdvancedTabChange={(tab) => {
          if (tab !== 'backstage' && proofRunLocksControls()) {
            recordSuppressedProofIntervention(`advanced-tab:${tab}`, 'ui');
            return;
          }
          setAdvancedDrawerTab(tab);
        }}
        onApplyCurrentDriftAnchors={handleApplyStyleAnchorFromAuto}
        onArmProofWave={() => {
          void handleArmProofWave();
        }}
        onChooseCaptureFolder={() => {
          void handleChooseCaptureFolder();
        }}
        onClearReplay={handleClearReplay}
        onClose={closeAdvancedDrawer}
        onDeleteSavedStance={handleDeleteSavedStance}
        onForgetCaptureFolder={handleForgetCaptureFolder}
        onFinishProofRun={() => {
          void handleFinishProofRun();
        }}
        onOverrideProofToExploratory={() => {
          overrideProofRunToExploratory(
            'Operator explicitly overrode the serious proof run to exploratory.'
          );
        }}
        onApplyRouteRecommendation={applyRouteRecommendation}
        onBiasChange={handleDirectorBiasChange}
        onInputDeviceChange={handleInputDeviceChange}
        onLoadSavedStance={handleLoadSavedStance}
        onLoadReplay={handleOpenReplayFile}
        onLookChange={handleLookChange}
        onLookPoolChange={handleLookPoolChange}
        momentLab={momentLabState}
        momentLabKinds={MOMENT_LAB_KINDS}
        momentLabProfiles={MOMENT_LAB_PROFILES}
        momentLabStyles={MOMENT_LAB_STYLES}
        onProofMissionChange={handleProofMissionChange}
        onMomentLabAutoCycle={handleMomentLabAutoCycle}
        onMomentLabDurationChange={setMomentLabDurationSeconds}
        onMomentLabKindChange={setMomentLabKind}
        onMomentLabPreview={handleMomentLabPreview}
        onMomentLabProfileChange={setMomentLabSyntheticProfile}
        onMomentLabStyleChange={setMomentLabStyle}
        onRecalibrate={() => {
          void handleRecalibrate();
        }}
        onResetAdvanced={handleResetAdvanced}
        onResetSteering={handleResetAdvancedSteering}
        onSaveCurrentStance={handleSaveCurrentStance}
        onShowStartRouteChange={handleShowStartRouteChange}
        onStartCapture={handleStartCapture}
        onStanceChange={handleStanceChange}
        onStopCapture={handleStopCapture}
        onStopReplay={handleStopReplay}
        onToggleAutoCapture={handleToggleAutoCapture}
        onToggleAutoDownload={handleToggleAutoDownload}
        onToggleAutoSaveToFolder={handleToggleAutoSaveToFolder}
        onToggleDiagnostics={() => {
          setDiagnosticsVisible((current) => !current);
        }}
        onToggleFullscreen={() => {
          void toggleFullscreen();
        }}
        onToggleProofStills={handleToggleProofStills}
        onToggleReplayPlayback={handleToggleReplayPlayback}
        onWorldChange={handleWorldChange}
        onWorldPoolChange={handleWorldPoolChange}
        open={backstagePanelOpen}
        routeId={resolveRouteIdFromListeningMode(sourceMode)}
        recording={recordingSummary}
        renderer={rendererDiagnostics}
        replay={replayStatus}
        replayError={replayError}
        runJournalStatus={runJournalStatus}
        routeRecommendation={routeRecommendation}
        savedStances={savedStances}
        selectedInputId={(audioDiagnostics.selectedInputId ?? preferredInputId) || null}
        showStartRoute={showStartRoute}
        stanceId={compatibilityIntent.stanceId}
        sourceMode={sourceMode}
        status={status}
        steering={advancedSteering}
        lookId={compatibilityIntent.lookId}
        worldId={compatibilityIntent.showWorldId}
      />

      <DiagnosticsOverlay
        audio={audioDiagnostics}
        autoCaptureStatus={liveAutoCaptureStatus}
        captureFolder={captureFolderStatus}
        latestAutoCapture={latestAutoCapture}
        launchQuickStartLabel={
          launchQuickStartId
            ? QUICK_START_PROFILES[launchQuickStartId]?.label ?? null
            : null
        }
        noTouchProofWindowMs={NO_TOUCH_PROOF_WINDOW_MS}
        recentAutoCaptures={autoCaptures.slice(0, RECENT_AUTO_CAPTURE_DISPLAY_LIMIT)}
        controls={controls}
        onChooseCaptureFolder={handleChooseCaptureFolder}
        onDownloadAutoCapture={handleDownloadAutoCapture}
        onClearAutoCaptures={handleClearAutoCaptures}
        onClearReplay={handleClearReplay}
        onDownloadLatestAutoCapture={handleDownloadLatestAutoCapture}
        onForgetCaptureFolder={handleForgetCaptureFolder}
        onLoadAutoCapture={handleLoadAutoCapture}
        onLoadReplay={handleOpenReplayFile}
        onLoadLatestAutoCapture={handleLoadLatestAutoCapture}
        onSaveLatestAutoCaptureToFolder={handleSaveLatestAutoCaptureToFolder}
        onSeekReplay={handleSeekReplay}
        onStartCapture={handleStartCapture}
        onStopCapture={handleStopCapture}
        onStopReplay={handleStopReplay}
        onToggleAutoCapture={handleToggleAutoCapture}
        onToggleAutoDownload={handleToggleAutoDownload}
        onToggleProofStills={handleToggleProofStills}
        onToggleAutoSaveToFolder={handleToggleAutoSaveToFolder}
        onToggleReplayPlayback={handleToggleReplayPlayback}
        proofMissionLabel={proofMissionProfile.label}
        proofScenarioKind={proofScenarioKind}
        replay={replayStatus}
        replayError={replayError}
        recording={recordingSummary}
        renderer={rendererDiagnostics}
        runJournalStatus={runJournalStatus}
        sessionInterventionSummary={sessionInterventionSummary}
        status={status}
        visible={diagnosticsVisible && import.meta.env.DEV}
      />
    </main>
  );
}
