import type { AnalysisFrame, ListeningFrame } from '../types/audio';
import type { UserControlState } from '../types/tuning';
import type { ListeningMode } from '../types/audio';
import type {
  CaptureQualityFlag,
  VisualAssetLayerSummary,
  VisualTelemetryFrame,
  VisualTelemetrySummary
} from '../types/visual';
import type { ProofStillKind } from './proofStills';

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
  version: 1 | 2;
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
