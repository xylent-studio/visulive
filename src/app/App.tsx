import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
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
  saveReplayCaptureToDirectory
} from '../replay/captureDirectory';
import {
  AUTO_CAPTURE_TIMING_PROFILES,
  buildAutoCaptureLabel,
  clampAutoCaptureEndTimestamp,
  detectAutoCaptureTrigger,
  getAutoCaptureTriggerPriority,
  resolveAutoCaptureTimingProfile,
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
import type { ReplayCaptureFrame, ReplayStatus } from '../replay/types';
import { DEFAULT_VISUAL_TELEMETRY } from '../types/visual';
import { ActivationOverlay } from '../ui/ActivationOverlay';
import { SettingsPanel } from '../ui/SettingsPanel';
import {
  DEFAULT_USER_CONTROL_STATE,
  applyPresetToControlState,
  applyQuickStartToControlState,
  getActiveQuickStartProfile,
  getRecommendedQuickStartProfileId,
  QUICK_START_PROFILES,
  deriveRuntimeTuning,
  parseStoredUserControlState,
  sanitizeUserControlState,
  serializeUserControlState,
  type AccentBias,
  type QuickStartProfileId,
  type RuntimeTuning,
  type UserControlState,
  type UserTuningPreset
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
};

const CONTROL_STORAGE_KEY = 'visulive-user-controls';
const INPUT_STORAGE_KEY = 'visulive-audio-input';
const SOURCE_MODE_STORAGE_KEY = 'visulive-source-mode';
const CAPTURE_AUTO_SAVE_STORAGE_KEY = 'visulive-capture-auto-save';
const PROOF_STILLS_STORAGE_KEY = 'visulive-proof-stills';
const MAX_CAPTURE_FRAMES = 36000;
const MAX_AUTO_CAPTURE_HISTORY = 32;
const RECENT_AUTO_CAPTURE_DISPLAY_LIMIT = 8;
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
  }>({
    ring: [],
    proofStillRing: [],
    pending: null,
    cooldownUntilMs: 0,
    lastProofStillSampleMs: Number.NEGATIVE_INFINITY,
    proofStillCaptureInFlight: false
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
  const [autoCaptureStatus, setAutoCaptureStatus] = useState<AutoCaptureStatus>(
    INITIAL_AUTO_CAPTURE_STATUS
  );
  const [autoCaptures, setAutoCaptures] = useState<AutoCaptureSummary[]>([]);
  const autoCaptureStatusRef = useRef(INITIAL_AUTO_CAPTURE_STATUS);
  const launchQuickStartIdRef = useRef<QuickStartProfileId | null>(null);
  const [captureFolderStatus, setCaptureFolderStatus] =
    useState<CaptureFolderStatus>(INITIAL_CAPTURE_FOLDER_STATUS);
  const captureFolderStatusRef = useRef(INITIAL_CAPTURE_FOLDER_STATUS);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
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
  const [controls, setControls] = useState<UserControlState>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_USER_CONTROL_STATE;
    }

    return parseStoredUserControlState(
      window.localStorage.getItem(CONTROL_STORAGE_KEY)
    );
  });
  const runtimeTuning = deriveRuntimeTuning(controls);
  const activeQuickStart = getActiveQuickStartProfile(controls, sourceMode);
  const [launchQuickStartId, setLaunchQuickStartId] =
    useState<QuickStartProfileId | null>(null);

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

  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);

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
        setControlsOpen((current) => !current);
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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const audio = new AudioEngine();
    audioRef.current = audio;
    void audio.setSourceMode(sourceMode);
    audio.setTuning(runtimeTuning);
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

      if (replayActiveNow) {
        if (autoCaptureState.pending) {
          clearAutoCapturePending();
        }

        return;
      }

      const liveAutoCaptureStatus = autoCaptureStatusRef.current;
      const trigger = detectAutoCaptureTrigger(
        snapshot.listeningFrame,
        snapshot.diagnostics
      );

      if (
        liveAutoCaptureStatus.enabled &&
        !autoCaptureState.pending &&
        trigger &&
        nextTimestampMs >= autoCaptureState.cooldownUntilMs
      ) {
        const timingProfile = resolveAutoCaptureTimingProfile(trigger.kind);
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
              proofStillFiles
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
            proofStills: proofStillSummary
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

        if (captureFolderStatusRef.current.autoSave) {
          await saveCaptureToConfiguredFolder(capture);
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

    audioRef.current?.setTuning(runtimeTuning);
    rendererRef.current?.setTuning(runtimeTuning);
  }, [controls, preferredInputId, runtimeTuning, sourceMode]);

  const handleStart = async () => {
    audioRef.current?.setTuning(runtimeTuning);
    await audioRef.current?.start();
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

      const { fileName, folderLabel } = await saveReplayCaptureToDirectory(
        handle,
        capture
      );

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

  const updateControls = (patch: Partial<UserControlState>) => {
    setControls((current) =>
      sanitizeUserControlState({
        ...current,
        ...patch
      })
    );
  };

  const applyPreset = (preset: UserTuningPreset) => {
    setControls((current) => applyPresetToControlState(current, preset));
  };

  const applyQuickStart = (quickStartId: QuickStartProfileId) => {
    const profile = QUICK_START_PROFILES[quickStartId];

    setLaunchQuickStartId(quickStartId);
    setSourceMode(profile.sourceMode);
    void audioRef.current?.setSourceMode(profile.sourceMode);
    setControls((current) => applyQuickStartToControlState(current, quickStartId));
  };

  const handleSensitivityChange = (value: number) => {
    updateControls({ sensitivity: value });
  };

  const handleEnergyChange = (value: number) => {
    updateControls({ energy: value });
  };

  const handleFramingChange = (value: number) => {
    updateControls({ framing: value });
  };

  const handleWorldActivityChange = (value: number) => {
    updateControls({ worldActivity: value });
  };

  const handleInputGainChange = (value: number) => {
    updateControls({ inputGain: value });
  };

  const handleEqLowChange = (value: number) => {
    updateControls({ eqLow: value });
  };

  const handleEqMidChange = (value: number) => {
    updateControls({ eqMid: value });
  };

  const handleEqHighChange = (value: number) => {
    updateControls({ eqHigh: value });
  };

  const handleSpectacleChange = (value: number) => {
    updateControls({ spectacle: value });
  };

  const handleGeometryChange = (value: number) => {
    updateControls({ geometry: value });
  };

  const handleRadianceChange = (value: number) => {
    updateControls({ radiance: value });
  };

  const handleBeatDriveChange = (value: number) => {
    updateControls({ beatDrive: value });
  };

  const handleEventfulnessChange = (value: number) => {
    updateControls({ eventfulness: value });
  };

  const handleAtmosphereChange = (value: number) => {
    updateControls({ atmosphere: value });
  };

  const handleColorBiasChange = (value: number) => {
    updateControls({ colorBias: value });
  };

  const handleAccentBiasChange = (accentBias: AccentBias) => {
    updateControls({ accentBias });
  };

  const handleInputDeviceChange = (deviceId: string) => {
    setPreferredInputId(deviceId);
    void audioRef.current?.setInputDevice(deviceId || null);
  };

  const handleSourceModeChange = (mode: ListeningMode) => {
    setLaunchQuickStartId(null);
    setSourceMode(mode);
    void audioRef.current?.setSourceMode(mode);
  };

  const handleStartCapture = () => {
    if (replayRef.current.hasCapture()) {
      setReplayError(
        'Return to live mode before starting a new capture.'
      );
      return;
    }

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

  const handleChooseCaptureFolder = async () => {
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

      return {
        ...current,
        autoSave: !current.autoSave,
        error: null
      };
    });
  };

  const handleForgetCaptureFolder = () => {
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
        quickStartProfileLabel: activeQuickStart?.label ?? null
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
      void saveCaptureToConfiguredFolder(capture).then((saved) => {
        if (!saved) {
          downloadReplayCapture(capture);
        }
      });
      return;
    }

    downloadReplayCapture(capture);
  };

  const handleOpenReplayFile = () => {
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
    replayRef.current.stop();
    setReplayStatus(replayRef.current.getStatus());
  };

  const handleClearReplay = () => {
    replayRef.current.clear();
    setReplayStatus(replayRef.current.getStatus());
    setReplayError(null);
  };

  const handleLoadLatestAutoCapture = () => {
    const latestCapture = autoCaptures[0];

    if (!latestCapture) {
      return;
    }

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
    const selectedCapture = autoCaptures.find((capture) => capture.id === captureId);

    if (!selectedCapture) {
      return;
    }

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

  const rendererLabel =
    rendererDiagnostics.backend === 'webgl2-fallback'
      ? 'WebGL2 fallback'
      : rendererDiagnostics.backend;
  const replayActive = replayStatus.mode !== 'idle';
  const runtimeActive = status.phase === 'live' || replayActive;
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
  const immersiveView =
    fullscreen &&
    runtimeActive &&
    !controlsOpen &&
    !diagnosticsVisible;
  const activationVisible = status.phase !== 'live' && !replayActive;
  const topStatusLabel = replayActive
    ? `replay ${replayStatus.mode}`
    : status.phase === 'live'
      ? frame.showState
      : status.message;

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

      {runtimeActive && !immersiveView && !activationVisible ? (
        <div className="top-chrome">
          <div className="status-pill">
            <span className="status-label">Status</span>
            <strong>{topStatusLabel}</strong>
          </div>
          <div className="status-pill">
            <span className="status-label">Renderer</span>
            <strong>{rendererLabel}</strong>
          </div>
        </div>
      ) : null}

      <SettingsPanel
        activeInputLabel={audioDiagnostics.deviceLabel}
        audio={audioDiagnostics}
        audioInputs={audioDiagnostics.availableInputs}
        controls={controls}
        immersive={immersiveView}
        isFullscreen={fullscreen}
        live={runtimeActive}
        onSourceModeChange={handleSourceModeChange}
        onAccentBiasChange={handleAccentBiasChange}
        onApplyPreset={applyPreset}
        onApplyQuickStart={applyQuickStart}
        onAtmosphereChange={handleAtmosphereChange}
        onBeatDriveChange={handleBeatDriveChange}
        onColorBiasChange={handleColorBiasChange}
        onEnergyChange={handleEnergyChange}
        onFramingChange={handleFramingChange}
        onEqHighChange={handleEqHighChange}
        onEqLowChange={handleEqLowChange}
        onEqMidChange={handleEqMidChange}
        onEventfulnessChange={handleEventfulnessChange}
        onGeometryChange={handleGeometryChange}
        onInputDeviceChange={handleInputDeviceChange}
        onInputGainChange={handleInputGainChange}
        onRadianceChange={handleRadianceChange}
        onRecalibrate={() => {
          void handleRecalibrate();
        }}
        onSpectacleChange={handleSpectacleChange}
        onToggleFullscreen={() => {
          void toggleFullscreen();
        }}
        onWorldActivityChange={handleWorldActivityChange}
        onReset={() => {
          const recommendedQuickStartId =
            getRecommendedQuickStartProfileId(sourceMode);
          setLaunchQuickStartId(recommendedQuickStartId);
          setControls((current) =>
            applyQuickStartToControlState(
              current,
              recommendedQuickStartId
            )
          );
        }}
        onSensitivityChange={handleSensitivityChange}
        open={controlsOpen}
        qualityTier={rendererDiagnostics.qualityTier}
        selectedInputId={(audioDiagnostics.selectedInputId ?? preferredInputId) || null}
        setOpen={setControlsOpen}
        sourceMode={sourceMode}
      />

      <ActivationOverlay
        bootStep={audioDiagnostics.bootStep}
        onStart={() => {
          void handleStart();
        }}
        activeQuickStartId={activeQuickStart?.id ?? null}
        onApplyQuickStart={applyQuickStart}
        preset={controls.preset}
        onSourceModeChange={handleSourceModeChange}
        renderer={rendererDiagnostics}
        suppressed={replayActive}
        sourceMode={sourceMode}
        status={status}
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
        replay={replayStatus}
        replayError={replayError}
        recording={recordingSummary}
        renderer={rendererDiagnostics}
        status={status}
        visible={diagnosticsVisible && import.meta.env.DEV}
      />
    </main>
  );
}
