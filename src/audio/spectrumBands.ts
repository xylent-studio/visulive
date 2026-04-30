import type {
  SpectrumBand,
  SpectrumBandId,
  SpectrumFrame
} from '../types/audio';
import { clamp01, percentile } from './audioMath';

export type SpectrumBandDefinition = {
  id: SpectrumBandId;
  hzLow: number;
  hzHigh: number;
};

export type SpectrumBaseline = Partial<Record<SpectrumBandId, number>>;

export type SpectrumFrameInput = {
  timestampMs: number;
  sampleRate: number;
  fftSize: number;
  frequencyData: ArrayLike<number>;
  previousFrame?: SpectrumFrame | null;
  baseline?: SpectrumBaseline;
  minDecibels?: number;
  maxDecibels?: number;
};

export const SPECTRUM_BAND_DEFINITIONS: SpectrumBandDefinition[] = [
  { id: 'sub', hzLow: 20, hzHigh: 45 },
  { id: 'kick', hzLow: 45, hzHigh: 90 },
  { id: 'punch', hzLow: 90, hzHigh: 150 },
  { id: 'bass', hzLow: 150, hzHigh: 250 },
  { id: 'lowMid', hzLow: 250, hzHigh: 500 },
  { id: 'body', hzLow: 500, hzHigh: 900 },
  { id: 'presence', hzLow: 900, hzHigh: 1800 },
  { id: 'snap', hzLow: 1800, hzHigh: 3200 },
  { id: 'crack', hzLow: 3200, hzHigh: 5500 },
  { id: 'sheen', hzLow: 5500, hzHigh: 8500 },
  { id: 'air', hzLow: 8500, hzHigh: 12000 },
  { id: 'fizz', hzLow: 12000, hzHigh: 18000 }
];

export function createSilentSpectrumFrame(
  timestampMs = 0,
  sampleRate = 48000,
  fftSize = 2048
): SpectrumFrame {
  const binWidth = sampleRate / 2 / Math.max(1, fftSize / 2);
  const bands = SPECTRUM_BAND_DEFINITIONS.map((definition) => ({
    ...definition,
    energy: 0,
    peak: 0,
    flux: 0,
    onset: 0,
    sustain: 0,
    noise: 0,
    tonal: 0,
    confidence: 0,
    reliability: 0,
    binCount: 0
  }));

  return {
    schemaVersion: 1,
    timestampMs,
    sampleRate,
    fftSize,
    binWidth,
    bands,
    legacyLow: 0,
    legacyMid: 0,
    legacyHigh: 0,
    coverageConfidence: 0
  };
}

export function deriveSpectrumFrame(input: SpectrumFrameInput): SpectrumFrame {
  const minDecibels = input.minDecibels ?? -90;
  const maxDecibels = input.maxDecibels ?? -10;
  const nyquist = input.sampleRate / 2;
  const binWidth = nyquist / Math.max(1, input.frequencyData.length);
  const bands = SPECTRUM_BAND_DEFINITIONS.map((definition) =>
    deriveBand({
      definition,
      frequencyData: input.frequencyData,
      binWidth,
      minDecibels,
      maxDecibels,
      previousBand: input.previousFrame?.bands.find(
        (band) => band.id === definition.id
      ),
      baseline: input.baseline?.[definition.id] ?? 0
    })
  );

  const legacyLow = averageBands(bands, ['kick', 'punch', 'bass']);
  const legacyMid = averageBands(bands, ['lowMid', 'body', 'presence', 'snap']);
  const legacyHigh = averageBands(bands, ['crack', 'sheen', 'air']);
  const coverageConfidence =
    bands.length > 0
      ? bands.reduce((sum, band) => sum + band.confidence, 0) / bands.length
      : 0;

  return {
    schemaVersion: 1,
    timestampMs: input.timestampMs,
    sampleRate: input.sampleRate,
    fftSize: input.fftSize,
    binWidth,
    bands,
    legacyLow,
    legacyMid,
    legacyHigh,
    coverageConfidence
  };
}

export function deriveSpectrumBaseline(
  frames: SpectrumFrame[],
  p = 0.2,
  scale = 1
): SpectrumBaseline {
  const baseline: SpectrumBaseline = {};

  for (const definition of SPECTRUM_BAND_DEFINITIONS) {
    const values = frames
      .map((frame) => frame.bands.find((band) => band.id === definition.id)?.energy)
      .filter((value): value is number => typeof value === 'number');

    baseline[definition.id] = clamp01(percentile(values, p) * scale);
  }

  return baseline;
}

export function getSpectrumBand(
  frame: SpectrumFrame | null | undefined,
  id: SpectrumBandId
): SpectrumBand {
  return (
    frame?.bands.find((band) => band.id === id) ??
    createSilentSpectrumFrame().bands.find((band) => band.id === id)!
  );
}

function deriveBand(input: {
  definition: SpectrumBandDefinition;
  frequencyData: ArrayLike<number>;
  binWidth: number;
  minDecibels: number;
  maxDecibels: number;
  previousBand?: SpectrumBand;
  baseline: number;
}): SpectrumBand {
  const binValues: number[] = [];
  let peak = 0;

  for (let index = 0; index < input.frequencyData.length; index += 1) {
    const frequency = (index + 0.5) * input.binWidth;

    if (
      frequency < input.definition.hzLow ||
      frequency >= input.definition.hzHigh
    ) {
      continue;
    }

    const normalized = normalizeDecibelToLinear(
      input.frequencyData[index],
      input.minDecibels,
      input.maxDecibels
    );
    binValues.push(normalized);
    peak = Math.max(peak, normalized);
  }

  const energy =
    binValues.length > 0
      ? binValues.reduce((sum, value) => sum + value, 0) / binValues.length
      : 0;
  const previousEnergy = input.previousBand?.energy ?? energy;
  const flux = Math.abs(energy - previousEnergy);
  const onset = clamp01(Math.max(0, energy - previousEnergy) * 4.2 + peak * 0.08);
  const sustain = clamp01(energy * (1 - Math.min(0.82, flux * 2.6)));
  const mean = energy;
  const variance =
    binValues.length > 1
      ? binValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        binValues.length
      : 0;
  const noise = clamp01(Math.sqrt(variance) * 3.4 + flux * 0.28);
  const tonal = clamp01(sustain * (1 - noise * 0.72));
  const reliability = clamp01((binValues.length - 0.5) / 5);
  const baselineLift = Math.max(input.baseline, 0);
  const confidence = clamp01(
    ((energy - baselineLift * 0.72) / Math.max(0.08, 1 - baselineLift)) *
      (0.42 + reliability * 0.58)
  );

  return {
    ...input.definition,
    energy,
    peak,
    flux,
    onset,
    sustain,
    noise,
    tonal,
    confidence,
    reliability,
    binCount: binValues.length
  };
}

function normalizeDecibelToLinear(
  value: number,
  minDecibels: number,
  maxDecibels: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const minAmplitude = 10 ** (minDecibels / 20);
  const maxAmplitude = 10 ** (maxDecibels / 20);
  const amplitude = 10 ** (Math.min(maxDecibels, Math.max(minDecibels, value)) / 20);

  return clamp01((amplitude - minAmplitude) / Math.max(0.000001, maxAmplitude - minAmplitude));
}

function averageBands(bands: SpectrumBand[], ids: SpectrumBandId[]): number {
  const selected = ids
    .map((id) => bands.find((band) => band.id === id)?.energy)
    .filter((value): value is number => typeof value === 'number');

  return selected.length > 0
    ? selected.reduce((sum, value) => sum + value, 0) / selected.length
    : 0;
}
