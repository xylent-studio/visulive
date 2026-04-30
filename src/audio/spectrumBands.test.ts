import { describe, expect, it } from 'vitest';
import {
  deriveSpectrumBaseline,
  deriveSpectrumFrame,
  getSpectrumBand
} from './spectrumBands';

function spectrumWithPeaks(
  sampleRate: number,
  fftSize: number,
  peaks: Record<number, number>
): Float32Array {
  const data = new Float32Array(fftSize / 2);
  data.fill(-90);
  const binWidth = sampleRate / 2 / data.length;

  for (const [frequencyText, db] of Object.entries(peaks)) {
    const frequency = Number(frequencyText);
    const index = Math.max(0, Math.min(data.length - 1, Math.floor(frequency / binWidth)));
    data[index] = db;
  }

  return data;
}

describe('deriveSpectrumFrame', () => {
  it('maps bins into named bands at 48 kHz and 2048 fft size', () => {
    const frame = deriveSpectrumFrame({
      timestampMs: 100,
      sampleRate: 48000,
      fftSize: 2048,
      frequencyData: spectrumWithPeaks(48000, 2048, {
        62: -12,
        2100: -22,
        9300: -18
      })
    });

    expect(frame.binWidth).toBeCloseTo(23.4375, 4);
    expect(getSpectrumBand(frame, 'kick').energy).toBeGreaterThan(
      getSpectrumBand(frame, 'bass').energy
    );
    expect(getSpectrumBand(frame, 'snap').energy).toBeGreaterThan(0);
    expect(getSpectrumBand(frame, 'air').energy).toBeGreaterThan(0);
  });

  it('keeps low-band reliability lower than wide mid/high bands', () => {
    const frame = deriveSpectrumFrame({
      timestampMs: 100,
      sampleRate: 44100,
      fftSize: 2048,
      frequencyData: spectrumWithPeaks(44100, 2048, { 32: -16, 1200: -16 })
    });

    expect(getSpectrumBand(frame, 'sub').reliability).toBeLessThan(
      getSpectrumBand(frame, 'presence').reliability
    );
  });

  it('reports silence as zero-energy bands', () => {
    const frame = deriveSpectrumFrame({
      timestampMs: 100,
      sampleRate: 48000,
      fftSize: 2048,
      frequencyData: spectrumWithPeaks(48000, 2048, {})
    });

    expect(frame.coverageConfidence).toBe(0);
    expect(frame.legacyLow).toBe(0);
    expect(getSpectrumBand(frame, 'air').energy).toBe(0);
  });

  it('computes flux and onset from a previous frame', () => {
    const quiet = deriveSpectrumFrame({
      timestampMs: 100,
      sampleRate: 48000,
      fftSize: 2048,
      frequencyData: spectrumWithPeaks(48000, 2048, { 62: -80 })
    });
    const hit = deriveSpectrumFrame({
      timestampMs: 150,
      sampleRate: 48000,
      fftSize: 2048,
      frequencyData: spectrumWithPeaks(48000, 2048, { 62: -14 }),
      previousFrame: quiet
    });

    expect(getSpectrumBand(hit, 'kick').flux).toBeGreaterThan(0.2);
    expect(getSpectrumBand(hit, 'kick').onset).toBeGreaterThan(0.5);
  });

  it('derives per-band baselines from calibration frames', () => {
    const frames = [0, 1, 2, 3].map((index) =>
      deriveSpectrumFrame({
        timestampMs: index * 50,
        sampleRate: 48000,
        fftSize: 2048,
        frequencyData: spectrumWithPeaks(48000, 2048, { 1000: -60 + index })
      })
    );
    const baseline = deriveSpectrumBaseline(frames);

    expect(baseline.presence).toBeGreaterThanOrEqual(0);
    expect(baseline.presence).toBeLessThan(0.1);
  });
});
