import type {
  AnalysisFrame,
  CalibrationQuality,
  CalibrationTrust,
  ListeningMode,
  SourceReadiness
} from '../types/audio';
import {
  type CalibrationSummary,
  percentile,
  summarizeCalibrationSamples
} from './audioMath';

export const CALIBRATION_DURATION_MS_BY_MODE: Record<ListeningMode, number> = {
  'room-mic': 2400,
  'system-audio': 4800,
  hybrid: 3600
};

const SOURCE_SIGNAL_RMS = 0.0045;
const SOURCE_SIGNAL_PEAK = 0.014;
const MUSIC_LOCK_RMS = 0.0085;
const MUSIC_LOCK_PEAK = 0.028;
const WEAK_SIGNAL_PEAK = 0.018;
const CLIP_PEAK = 0.985;
const LOUD_RMS_RISK = 0.085;

export const DEFAULT_SOURCE_READINESS: SourceReadiness = {
  trackGranted: false,
  signalPresent: false,
  musicLock: false,
  currentSignalPresent: false,
  currentMusicLock: false,
  clipped: false,
  sourceEnded: false,
  firstSourceHeardAtMs: null,
  firstMusicLockAtMs: null,
  lastSignalAtMs: null,
  lastMusicLockAtMs: null,
  timeSinceLastSignalMs: null,
  recentSignalFrameCount: 0,
  recentMusicLockFrameCount: 0,
  stableAtMs: null,
  sourcePresentScore: 0,
  proofReady: false
};

export function getCalibrationDurationMs(mode: ListeningMode): number {
  return CALIBRATION_DURATION_MS_BY_MODE[mode];
}

export function hasSourceSignal(frame: AnalysisFrame): boolean {
  return frame.rms >= SOURCE_SIGNAL_RMS || frame.peak >= SOURCE_SIGNAL_PEAK;
}

export function hasMusicLock(frame: AnalysisFrame): boolean {
  return (
    frame.rms >= MUSIC_LOCK_RMS ||
    frame.peak >= MUSIC_LOCK_PEAK ||
    (frame.modulation >= 0.035 && frame.peak >= WEAK_SIGNAL_PEAK)
  );
}

export function scoreSourcePresence(frame: AnalysisFrame): number {
  return Math.max(
    Math.min(1, frame.rms / Math.max(0.0001, MUSIC_LOCK_RMS)),
    Math.min(1, frame.peak / Math.max(0.0001, MUSIC_LOCK_PEAK))
  );
}

export function summarizeSourceAwareCalibration(
  mode: ListeningMode,
  rmsSamples: number[],
  peakSamples: number[],
  options: {
    displayAudioGranted: boolean;
    sourceEnded?: boolean;
  }
): CalibrationSummary & {
  calibrationTrust: CalibrationTrust;
  calibrationQuality: CalibrationQuality;
} {
  const sampleCount = Math.min(rmsSamples.length, peakSamples.length);
  const base = summarizeCalibrationSamples(rmsSamples, peakSamples);
  const rmsPercentile10 = percentile(rmsSamples, 0.1);
  const rmsPercentile75 = percentile(rmsSamples, 0.75);
  const peakPercentile95 = percentile(peakSamples, 0.95);
  const maxPeak = peakSamples.length > 0 ? Math.max(...peakSamples) : 0;
  const clipped = maxPeak >= CLIP_PEAK || peakPercentile95 >= 0.94;

  if (mode === 'room-mic') {
    return {
      ...base,
      calibrationTrust: clipped ? 'provisional' : 'stable',
      calibrationQuality: clipped ? 'clipped-startup' : 'clean'
    };
  }

  const displayAudioMissing = !options.displayAudioGranted;
  const sourceEnded = options.sourceEnded === true;
  const signalPresent =
    base.peakPercentile90 >= SOURCE_SIGNAL_PEAK ||
    rmsPercentile75 >= SOURCE_SIGNAL_RMS;
  const musicLock =
    base.peakPercentile90 >= MUSIC_LOCK_PEAK ||
    rmsPercentile75 >= MUSIC_LOCK_RMS;
  const silentSystemAudio =
    mode === 'system-audio' &&
    !signalPresent &&
    !sourceEnded &&
    !displayAudioMissing;
  const weakSignal =
    signalPresent &&
    !musicLock;
  const loudCalibrationRisk =
    rmsPercentile10 >= LOUD_RMS_RISK || base.rmsPercentile20 >= LOUD_RMS_RISK;
  const calibrationQuality: CalibrationQuality =
    sourceEnded || displayAudioMissing
      ? 'source-ended'
      : clipped
        ? 'clipped-startup'
        : silentSystemAudio
          ? 'silent-system-audio'
          : weakSignal
            ? 'weak-signal'
            : mode === 'hybrid'
              ? 'mixed-source-risk'
              : loudCalibrationRisk
                ? 'loud-calibration-risk'
                : 'clean';
  const calibrationTrust: CalibrationTrust =
    sourceEnded || displayAudioMissing
      ? 'blocked'
      : calibrationQuality === 'clean'
        ? 'stable'
        : 'provisional';

  if (mode === 'system-audio' || mode === 'hybrid') {
    const directNoiseFloor = Math.max(
      Math.min(base.noiseFloor, Math.max(rmsPercentile10 * 1.35, 0.0018), 0.018),
      0.0015
    );
    const directCeiling = Math.max(
      peakPercentile95 * 1.22,
      rmsPercentile75 * 3.4,
      directNoiseFloor + (mode === 'system-audio' ? 0.055 : 0.048),
      mode === 'system-audio' ? 0.08 : 0.072
    );

    return {
      ...base,
      noiseFloor: directNoiseFloor,
      ceiling: directCeiling,
      peak: Math.max(base.peak, Math.min(directCeiling, peakPercentile95)),
      sampleCount,
      calibrationTrust,
      calibrationQuality
    };
  }

  return {
    ...base,
    calibrationTrust,
    calibrationQuality
  };
}

export function buildSourceReadiness(input: {
  mode: ListeningMode;
  displayAudioGranted: boolean;
  calibrationTrust: CalibrationTrust;
  calibrationQuality: CalibrationQuality;
  frame: AnalysisFrame;
  sourceEnded: boolean;
  firstSourceHeardAtMs: number | null;
  firstMusicLockAtMs: number | null;
  lastSignalAtMs?: number | null;
  lastMusicLockAtMs?: number | null;
  timeSinceLastSignalMs?: number | null;
  recentSignalFrameCount?: number;
  recentMusicLockFrameCount?: number;
  stableAtMs: number | null;
}): SourceReadiness {
  const trackGranted =
    input.mode === 'room-mic' ? true : input.displayAudioGranted === true;
  const currentSignalPresent = hasSourceSignal(input.frame);
  const currentMusicLock = hasMusicLock(input.frame);
  const recentSignalFrameCount = Math.max(
    0,
    input.recentSignalFrameCount ?? (currentSignalPresent ? 1 : 0)
  );
  const recentMusicLockFrameCount = Math.max(
    0,
    input.recentMusicLockFrameCount ?? (currentMusicLock ? 1 : 0)
  );
  const lastSignalAtMs =
    input.lastSignalAtMs ?? (currentSignalPresent ? input.firstSourceHeardAtMs : null);
  const lastMusicLockAtMs =
    input.lastMusicLockAtMs ??
    (currentMusicLock ? input.firstMusicLockAtMs : null);
  const recentSignalPresent = currentSignalPresent || recentSignalFrameCount > 0;
  const recentMusicLock = currentMusicLock || recentMusicLockFrameCount > 0;
  const clipped = input.frame.clipped || input.calibrationQuality === 'clipped-startup';
  const proofReady =
    input.calibrationTrust === 'stable' &&
    trackGranted &&
    !clipped &&
    input.sourceEnded !== true &&
    (input.mode === 'room-mic' || recentMusicLock);

  return {
    trackGranted,
    signalPresent: recentSignalPresent,
    musicLock: recentMusicLock,
    currentSignalPresent,
    currentMusicLock,
    clipped,
    sourceEnded: input.sourceEnded,
    firstSourceHeardAtMs: input.firstSourceHeardAtMs,
    firstMusicLockAtMs: input.firstMusicLockAtMs,
    lastSignalAtMs,
    lastMusicLockAtMs,
    timeSinceLastSignalMs: input.timeSinceLastSignalMs ?? null,
    recentSignalFrameCount,
    recentMusicLockFrameCount,
    stableAtMs: input.stableAtMs,
    sourcePresentScore: scoreSourcePresence(input.frame),
    proofReady
  };
}
