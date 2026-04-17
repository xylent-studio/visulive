import {
  REQUESTED_MIC_CONSTRAINTS,
  type AppliedMicTrackSettings,
  type SupportedMicConstraints
} from '../types/audio';

export function buildMicSupportWarnings(
  supported: SupportedMicConstraints
): string[] {
  const warnings: string[] = [];

  if (!supported.echoCancellation) {
    warnings.push(
      'echoCancellation support is unavailable; raw ambient path is not guaranteed.'
    );
  }

  if (!supported.noiseSuppression) {
    warnings.push(
      'noiseSuppression support is unavailable; raw ambient path is not guaranteed.'
    );
  }

  if (!supported.autoGainControl) {
    warnings.push(
      'autoGainControl support is unavailable; raw ambient path is not guaranteed.'
    );
  }

  if (!supported.channelCount) {
    warnings.push(
      'channelCount support is unavailable; native multi-channel capture cannot be requested explicitly.'
    );
  }

  return warnings;
}

export function evaluateMicTruth(
  supported: SupportedMicConstraints,
  applied: AppliedMicTrackSettings | null
): { rawPathGranted: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let rawPathGranted = true;

  if (!applied) {
    return {
      rawPathGranted: false,
      warnings: ['Applied microphone settings could not be inspected.']
    };
  }

  if (
    supported.echoCancellation &&
    applied.echoCancellation !== null &&
    applied.echoCancellation !== REQUESTED_MIC_CONSTRAINTS.echoCancellation
  ) {
    warnings.push(
      `echoCancellation requested ${REQUESTED_MIC_CONSTRAINTS.echoCancellation} but applied ${applied.echoCancellation}.`
    );
    rawPathGranted = false;
  }

  if (
    supported.noiseSuppression &&
    applied.noiseSuppression !== null &&
    applied.noiseSuppression !== REQUESTED_MIC_CONSTRAINTS.noiseSuppression
  ) {
    warnings.push(
      `noiseSuppression requested ${REQUESTED_MIC_CONSTRAINTS.noiseSuppression} but applied ${applied.noiseSuppression}.`
    );
    rawPathGranted = false;
  }

  if (
    supported.autoGainControl &&
    applied.autoGainControl !== null &&
    applied.autoGainControl !== REQUESTED_MIC_CONSTRAINTS.autoGainControl
  ) {
    warnings.push(
      `autoGainControl requested ${REQUESTED_MIC_CONSTRAINTS.autoGainControl} but applied ${applied.autoGainControl}.`
    );
    rawPathGranted = false;
  }

  if (
    supported.channelCount &&
    REQUESTED_MIC_CONSTRAINTS.channelCount !== null &&
    applied.channelCount !== null &&
    applied.channelCount !== REQUESTED_MIC_CONSTRAINTS.channelCount
  ) {
    warnings.push(
      `channelCount requested ${REQUESTED_MIC_CONSTRAINTS.channelCount} but applied ${applied.channelCount}.`
    );
  }

  return {
    rawPathGranted,
    warnings
  };
}

export function extractAppliedTrackSettings(
  settings: MediaTrackSettings & { latency?: number }
): AppliedMicTrackSettings {
  return {
    echoCancellation:
      typeof settings.echoCancellation === 'boolean'
        ? settings.echoCancellation
        : null,
    noiseSuppression:
      typeof settings.noiseSuppression === 'boolean'
        ? settings.noiseSuppression
        : null,
    autoGainControl:
      typeof settings.autoGainControl === 'boolean'
        ? settings.autoGainControl
        : null,
    channelCount:
      typeof settings.channelCount === 'number' ? settings.channelCount : null,
    sampleRate:
      typeof settings.sampleRate === 'number' ? settings.sampleRate : null,
    sampleSize:
      typeof settings.sampleSize === 'number' ? settings.sampleSize : null,
    latency: typeof settings.latency === 'number' ? settings.latency : null
  };
}
