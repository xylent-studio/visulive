import { describe, expect, it } from 'vitest';
import {
  buildMicSupportWarnings,
  evaluateMicTruth,
  extractAppliedTrackSettings
} from './audioTruth';

describe('audioTruth', () => {
  it('flags unsupported raw-path constraints', () => {
    const warnings = buildMicSupportWarnings({
      echoCancellation: false,
      noiseSuppression: true,
      autoGainControl: false,
      channelCount: false
    });

    expect(warnings).toHaveLength(3);
    expect(warnings.join(' ')).toContain('echoCancellation');
    expect(warnings.join(' ')).toContain('autoGainControl');
    expect(warnings.join(' ')).toContain('channelCount');
  });

  it('marks the mic path compromised when applied settings ignore raw requests', () => {
    const result = evaluateMicTruth(
      {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: true
      },
      {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 2,
        sampleRate: 48000,
        sampleSize: 16,
        latency: 0.01
      }
    );

    expect(result.rawPathGranted).toBe(false);
    expect(result.warnings.some((warning) => warning.includes('echoCancellation'))).toBe(
      true
    );
    expect(result.warnings.some((warning) => warning.includes('noiseSuppression'))).toBe(
      true
    );
    expect(result.warnings.some((warning) => warning.includes('channelCount'))).toBe(
      false
    );
  });

  it('normalizes inspected track settings into nullable fields', () => {
    const applied = extractAppliedTrackSettings({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
      sampleRate: 44100
    });

    expect(applied.echoCancellation).toBe(false);
    expect(applied.channelCount).toBe(1);
    expect(applied.sampleRate).toBe(44100);
    expect(applied.sampleSize).toBeNull();
    expect(applied.latency).toBeNull();
  });

  it('does not treat multi-channel input as a channel-count mismatch when channel count is not requested', () => {
    const result = evaluateMicTruth(
      {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: true
      },
      {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2,
        sampleRate: 48000,
        sampleSize: 16,
        latency: 0.01
      }
    );

    expect(result.rawPathGranted).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('channelCount'))).toBe(
      false
    );
  });
});
