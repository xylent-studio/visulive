export type ListeningMode = 'room-mic' | 'system-audio' | 'hybrid';

export type ListeningState =
  | 'dormant'
  | 'aware'
  | 'entrained'
  | 'blooming'
  | 'settling';

export type MomentKind = 'none' | 'lift' | 'strike' | 'release';

export type PerformanceIntent =
  | 'hold'
  | 'gather'
  | 'ignite'
  | 'detonate'
  | 'haunt';

export type ShowState =
  | 'void'
  | 'atmosphere'
  | 'cadence'
  | 'tactile'
  | 'generative'
  | 'surge'
  | 'aftermath';

export type AnalysisFrame = {
  timestampMs: number;
  rms: number;
  peak: number;
  envelopeFast: number;
  envelopeSlow: number;
  transient: number;
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  brightness: number;
  lowFlux: number;
  midFlux: number;
  highFlux: number;
  crestFactor: number;
  lowStability: number;
  modulation: number;
  clipped: boolean;
};

export type ListeningFrame = {
  timestampMs: number;
  mode: ListeningMode;
  calibrated: boolean;
  confidence: number;
  clipped: boolean;
  subPressure: number;
  bassBody: number;
  lowMidBody: number;
  presence: number;
  body: number;
  air: number;
  shimmer: number;
  accent: number;
  brightness: number;
  roughness: number;
  tonalStability: number;
  harmonicColor: number;
  phraseTension: number;
  resonance: number;
  speech: number;
  roomness: number;
  ambienceConfidence: number;
  speechConfidence: number;
  transientConfidence: number;
  musicConfidence: number;
  peakConfidence: number;
  momentum: number;
  beatConfidence: number;
  beatIntervalMs: number;
  beatStability: number;
  beatPhase: number;
  barPhase: number;
  phrasePhase: number;
  preDropTension: number;
  dropImpact: number;
  sectionChange: number;
  releaseTail: number;
  state: ListeningState;
  showState: ShowState;
  momentKind: MomentKind;
  momentAmount: number;
  performanceIntent: PerformanceIntent;
};

export type SourceDescriptor = {
  id: string;
  kind: 'room-mic' | 'system-audio' | 'hybrid';
  label: string;
  available: boolean;
};

export type AudioEnginePhase =
  | 'idle'
  | 'requesting-permission'
  | 'booting'
  | 'calibrating'
  | 'live'
  | 'error';

export type AudioEngineStatus = {
  phase: AudioEnginePhase;
  message: string;
  error?: string;
};

export type RequestedMicConstraints = {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  channelCount: number;
};

export type SupportedMicConstraints = {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  channelCount: boolean;
};

export type AppliedMicTrackSettings = {
  echoCancellation: boolean | null;
  noiseSuppression: boolean | null;
  autoGainControl: boolean | null;
  channelCount: number | null;
  sampleRate: number | null;
  sampleSize: number | null;
  latency: number | null;
};

export type AppliedDisplayTrackSettings = {
  displaySurface: string | null;
  suppressLocalAudioPlayback: boolean | null;
  restrictOwnAudio: boolean | null;
};

export type SourceDiagnostics = {
  source: SourceDescriptor;
  sourceMode: ListeningMode;
  availableInputs: SourceDescriptor[];
  selectedInputId: string | null;
  sampleRate: number | null;
  fftSize: number;
  deviceLabel: string;
  bootStep: string;
  requestedConstraints: RequestedMicConstraints;
  supportedConstraints: SupportedMicConstraints;
  appliedTrackSettings: AppliedMicTrackSettings | null;
  appliedDisplayTrackSettings: AppliedDisplayTrackSettings | null;
  displayTrackLabel: string | null;
  displayAudioGranted: boolean;
  rawPathGranted: boolean;
  calibrationDurationMs: number;
  calibrationSampleCount: number;
  calibrationRmsPercentile20: number;
  calibrationPeakPercentile90: number;
  rawRms: number;
  rawPeak: number;
  adaptiveCeiling: number;
  noiseFloor: number;
  minimumCeiling: number;
  calibrationPeak: number;
  spectrumLow: number;
  spectrumMid: number;
  spectrumHigh: number;
  humRejection: number;
  musicTrend: number;
  silenceGate: number;
  beatIntervalMs: number;
  roomMusicFloorActive: boolean;
  roomMusicDrive: number;
  aftermathEntryEvidence: number;
  aftermathExitPressure: number;
  stateReason: string;
  showStateReason: string;
  momentReason: string;
  conductorReason: string;
  analysisFrame: AnalysisFrame;
  listeningFrame: ListeningFrame;
  warnings: string[];
};

export type AudioDiagnostics = SourceDiagnostics;

export type AudioSnapshot = {
  analysisFrame: AnalysisFrame;
  listeningFrame: ListeningFrame;
  diagnostics: AudioDiagnostics;
};

export interface ListeningSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  getAnalysisFrame(): AnalysisFrame;
  getDiagnostics(): SourceDiagnostics;
}

export const REQUESTED_MIC_CONSTRAINTS: RequestedMicConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1
};

export const DEFAULT_SUPPORTED_MIC_CONSTRAINTS: SupportedMicConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: false
};

export const DEFAULT_SOURCE_DESCRIPTOR: SourceDescriptor = {
  id: 'room-mic',
  kind: 'room-mic',
  label: 'Built-in microphone',
  available: true
};

export const DEFAULT_ANALYSIS_FRAME: AnalysisFrame = {
  timestampMs: 0,
  rms: 0,
  peak: 0,
  envelopeFast: 0,
  envelopeSlow: 0,
  transient: 0,
  lowEnergy: 0,
  midEnergy: 0,
  highEnergy: 0,
  brightness: 0,
  lowFlux: 0,
  midFlux: 0,
  highFlux: 0,
  crestFactor: 1,
  lowStability: 1,
  modulation: 0,
  clipped: false
};

export const DEFAULT_LISTENING_FRAME: ListeningFrame = {
  timestampMs: 0,
  mode: 'room-mic',
  calibrated: false,
  confidence: 0,
  clipped: false,
  subPressure: 0,
  bassBody: 0,
  lowMidBody: 0,
  presence: 0,
  body: 0,
  air: 0,
  shimmer: 0,
  accent: 0,
  brightness: 0,
  roughness: 0,
  tonalStability: 0,
  harmonicColor: 0.5,
  phraseTension: 0,
  resonance: 0,
  speech: 0,
  roomness: 0,
  ambienceConfidence: 0,
  speechConfidence: 0,
  transientConfidence: 0,
  musicConfidence: 0,
  peakConfidence: 0,
  momentum: 0,
  beatConfidence: 0,
  beatIntervalMs: 0,
  beatStability: 0,
  beatPhase: 0,
  barPhase: 0,
  phrasePhase: 0,
  preDropTension: 0,
  dropImpact: 0,
  sectionChange: 0,
  releaseTail: 0,
  state: 'dormant',
  showState: 'void',
  momentKind: 'none',
  momentAmount: 0,
  performanceIntent: 'hold'
};

export const DEFAULT_AUDIO_STATUS: AudioEngineStatus = {
  phase: 'idle',
  message: 'Ready to listen.'
};

export const DEFAULT_AUDIO_DIAGNOSTICS: AudioDiagnostics = {
  source: DEFAULT_SOURCE_DESCRIPTOR,
  availableInputs: [DEFAULT_SOURCE_DESCRIPTOR],
  selectedInputId: null,
  sampleRate: null,
  fftSize: 2048,
  deviceLabel: 'Built-in microphone',
  bootStep: 'idle',
  requestedConstraints: REQUESTED_MIC_CONSTRAINTS,
  supportedConstraints: DEFAULT_SUPPORTED_MIC_CONSTRAINTS,
  appliedTrackSettings: null,
  appliedDisplayTrackSettings: null,
  displayTrackLabel: null,
  displayAudioGranted: false,
  sourceMode: 'room-mic',
  rawPathGranted: false,
  calibrationDurationMs: 0,
  calibrationSampleCount: 0,
  calibrationRmsPercentile20: 0,
  calibrationPeakPercentile90: 0,
  rawRms: 0,
  rawPeak: 0,
  adaptiveCeiling: 0.06,
  noiseFloor: 0.02,
  minimumCeiling: 0.06,
  calibrationPeak: 0.06,
  spectrumLow: 0,
  spectrumMid: 0,
  spectrumHigh: 0,
  humRejection: 0,
  musicTrend: 0,
  silenceGate: 0,
  beatIntervalMs: 0,
  roomMusicFloorActive: false,
  roomMusicDrive: 0,
  aftermathEntryEvidence: 0,
  aftermathExitPressure: 0,
  stateReason: 'Waiting for calibration.',
  showStateReason: 'Waiting for calibration.',
  momentReason: 'No active moment.',
  conductorReason: 'Waiting for calibration.',
  analysisFrame: DEFAULT_ANALYSIS_FRAME,
  listeningFrame: DEFAULT_LISTENING_FRAME,
  warnings: []
};
