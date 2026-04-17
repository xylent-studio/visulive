export type CalibrationProfile = {
  noiseFloor: number;
  ceiling: number;
  peak: number;
};

export type CalibrationSummary = CalibrationProfile & {
  sampleCount: number;
  rmsPercentile20: number;
  peakPercentile90: number;
};

export const CALIBRATION_RMS_PERCENTILE = 0.2;
export const CALIBRATION_PEAK_PERCENTILE = 0.9;

export function clamp01(value: number): number {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * clamp01(p);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);

  if (lower === upper) {
    return sorted[lower];
  }

  const mix = rank - lower;

  return sorted[lower] * (1 - mix) + sorted[upper] * mix;
}

export function estimateCalibration(
  rmsSamples: number[],
  peakSamples: number[]
): CalibrationProfile {
  const noiseFloor = Math.max(percentile(rmsSamples, CALIBRATION_RMS_PERCENTILE), 0.002);
  const peak = Math.max(percentile(peakSamples, CALIBRATION_PEAK_PERCENTILE), noiseFloor + 0.008);
  const ceiling = Math.max(peak * 1.15, noiseFloor + 0.03, 0.05);

  return {
    noiseFloor,
    ceiling,
    peak
  };
}

export function summarizeCalibrationSamples(
  rmsSamples: number[],
  peakSamples: number[]
): CalibrationSummary {
  const sampleCount = Math.min(rmsSamples.length, peakSamples.length);
  const rmsPercentile20 = percentile(rmsSamples, CALIBRATION_RMS_PERCENTILE);
  const peakPercentile90 = percentile(peakSamples, CALIBRATION_PEAK_PERCENTILE);
  const profile = estimateCalibration(rmsSamples, peakSamples);

  return {
    ...profile,
    sampleCount,
    rmsPercentile20,
    peakPercentile90
  };
}

export function normalizeLevel(
  value: number,
  noiseFloor: number,
  ceiling: number
): number {
  const floor = Math.max(noiseFloor * 1.02, 0);
  const range = Math.max(ceiling - floor, 0.0001);

  return clamp01((value - floor) / range);
}

export function updateAdaptiveCeiling(
  current: number,
  observedPeak: number,
  minimumCeiling: number
): number {
  const floor = Math.max(minimumCeiling, 0.05);

  if (observedPeak > current) {
    const liftedTarget = Math.max(observedPeak * 1.12, floor);

    return current + (liftedTarget - current) * 0.18;
  }

  return current + (floor - current) * 0.012;
}

export function updateAdaptiveNoiseFloor(
  current: number,
  observedRms: number,
  calibrationFloor: number,
  quietWindow: boolean
): number {
  const anchor = Math.max(calibrationFloor, 0.0025);
  const minimumFloor = Math.max(anchor * 0.55, 0.0015);
  const maximumFloor = Math.max(anchor * 1.6, minimumFloor + 0.001);
  const target = Math.min(maximumFloor, Math.max(minimumFloor, observedRms));

  if (quietWindow) {
    const rate = target < current ? 0.12 : 0.018;

    return current + (target - current) * rate;
  }

  return current + (anchor - current) * 0.004;
}
