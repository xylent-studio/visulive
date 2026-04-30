import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO_DIAGNOSTICS } from '../types/audio';
import { deriveReplayProofReadiness } from './runJournal';

const BUILD_INFO = {
  version: '1.0.0',
  commit: 'abcdef1',
  branch: 'codex/test',
  builtAt: '2026-04-30T00:00:00.000Z',
  lane: 'stable' as const,
  proofStatus: 'proof-pack' as const,
  dirty: false
};

describe('runJournal source readiness', () => {
  it('keeps pre-start proof readiness focused on setup gates', () => {
    const readiness = deriveReplayProofReadiness({
      proofWaveArmed: true,
      captureFolderLabel: 'captures/inbox',
      captureFolderReady: true,
      showStartRoute: 'pc-audio',
      sourceMode: 'system-audio',
      proofScenarioKind: 'primary-benchmark',
      buildInfo: BUILD_INFO,
      replayActive: false,
      routeCapabilities: {
        microphoneAvailable: true,
        displayAudioAvailable: true
      }
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.checks.find((check) => check.id === 'source-readiness')?.passed).toBe(true);
  });

  it('blocks serious proof when post-share PC audio is provisional', () => {
    const readiness = deriveReplayProofReadiness({
      proofWaveArmed: true,
      captureFolderLabel: 'captures/inbox',
      captureFolderReady: true,
      showStartRoute: 'pc-audio',
      sourceMode: 'system-audio',
      audioDiagnostics: {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        sourceMode: 'system-audio',
        displayAudioGranted: true,
        calibrationTrust: 'provisional',
        calibrationQuality: 'silent-system-audio',
        startupBlocker: 'silent-shared-source',
        listeningFrame: {
          ...DEFAULT_AUDIO_DIAGNOSTICS.listeningFrame,
          mode: 'system-audio',
          calibrated: true
        },
        sourceReadiness: {
          ...DEFAULT_AUDIO_DIAGNOSTICS.sourceReadiness,
          trackGranted: true,
          proofReady: false
        }
      },
      proofScenarioKind: 'primary-benchmark',
      buildInfo: BUILD_INFO,
      replayActive: false,
      routeCapabilities: {
        microphoneAvailable: true,
        displayAudioAvailable: true
      }
    });

    expect(readiness.ready).toBe(false);
    expect(
      readiness.checks.find((check) => check.id === 'calibration-trust')?.passed
    ).toBe(false);
    expect(
      readiness.checks.find((check) => check.id === 'source-readiness')?.passed
    ).toBe(false);
    expect(
      readiness.checks.find((check) => check.id === 'source-readiness')?.reason
    ).toContain('PC Audio is connected');
  });
});
