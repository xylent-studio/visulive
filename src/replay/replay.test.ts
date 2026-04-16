import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ANALYSIS_FRAME,
  DEFAULT_AUDIO_DIAGNOSTICS,
  DEFAULT_LISTENING_FRAME
} from '../types/audio';
import { DEFAULT_USER_CONTROL_STATE } from '../types/tuning';
import { DEFAULT_VISUAL_TELEMETRY } from '../types/visual';
import { ReplayController } from './ReplayController';
import {
  buildReplayCapture,
  cloneReplayCaptureFrame,
  parseReplayCapture
} from './session';

describe('replay workflow', () => {
  it('builds and parses replay captures with diagnostics', () => {
    const firstFrame = cloneReplayCaptureFrame(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1000,
        calibrated: true,
        confidence: 0.82,
        showState: 'generative',
        state: 'entrained'
      },
      {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs: 1000,
        rms: 0.12,
        peak: 0.24
      },
      {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        rawRms: 0.12,
        rawPeak: 0.24,
        beatIntervalMs: 480,
        stateReason: 'Music confidence is rising.',
        showStateReason: 'Generative posture is active.',
        momentReason: 'No active moment.',
        conductorReason: 'Beat tracking is warming up.'
      }
    );
    const secondFrame = cloneReplayCaptureFrame(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1160,
        calibrated: true,
        confidence: 0.86,
        momentKind: 'lift',
        momentAmount: 0.4,
        showState: 'surge',
        state: 'blooming'
      },
      {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs: 1160,
        rms: 0.18,
        peak: 0.34
      },
      {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        rawRms: 0.18,
        rawPeak: 0.34,
        humRejection: 0.12,
        musicTrend: 0.44,
        silenceGate: 0.33,
        beatIntervalMs: 480,
        stateReason: 'Phrase tension is lifting.',
        showStateReason: 'Surge posture is active.',
        momentReason: 'Lift moment triggered.',
        conductorReason: 'Drop tension is climbing.'
      }
    );

    const capture = buildReplayCapture(
      [firstFrame, secondFrame],
      DEFAULT_AUDIO_DIAGNOSTICS,
      {
        backend: 'webgpu',
        ready: true,
        qualityTier: 'balanced',
        devicePixelRatio: 1,
        cappedPixelRatio: 1,
        fps: 60,
        frameTimeMs: 16.7,
        warnings: [],
        visualTelemetry: {
          ...DEFAULT_VISUAL_TELEMETRY,
          qualityTier: 'balanced'
        }
      },
      DEFAULT_USER_CONTROL_STATE
    );
    const parsed = parseReplayCapture(JSON.stringify(capture));

    expect(parsed.version).toBe(2);
    expect(parsed.frames).toHaveLength(2);
    expect(parsed.metadata.captureMode).toBe('manual');
    expect(parsed.metadata.sourceMode).toBe('room-mic');
    expect(parsed.metadata.controls.preset).toBe(DEFAULT_USER_CONTROL_STATE.preset);
    expect(parsed.metadata.bootSummary?.calibrationDurationMs).toBe(0);
    expect(parsed.metadata.sourceSummary?.sourceMode).toBe('room-mic');
    expect(parsed.metadata.inputDriftSummary?.noiseFloor.start).toBeCloseTo(
      DEFAULT_AUDIO_DIAGNOSTICS.noiseFloor
    );
    expect(parsed.frames[1]?.diagnostics.momentReason).toBe('Lift moment triggered.');
    expect(parsed.frames[1]?.diagnostics.beatIntervalMs).toBe(480);
    expect(parsed.frames[1]?.diagnostics.conductorReason).toBe('Drop tension is climbing.');
    expect(parsed.frames[1]?.listeningFrame.momentKind).toBe('lift');
  });

  it('plays captures forward and supports seeking', () => {
    const capture = parseReplayCapture(
      JSON.stringify({
        version: 1,
        metadata: {
          app: 'visulive',
          label: 'test-capture',
          capturedAt: new Date().toISOString(),
          captureMode: 'manual',
          sourceLabel: 'Built-in microphone',
          sourceMode: 'room-mic',
          selectedInputId: null,
          rawPathGranted: true,
          sampleRate: 48000,
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          controls: DEFAULT_USER_CONTROL_STATE
        },
        frames: [
          {
            timestampMs: 1000,
            listeningFrame: {
              ...DEFAULT_LISTENING_FRAME,
              timestampMs: 1000,
              calibrated: true,
              presence: 0.1
            },
            analysisFrame: {
              ...DEFAULT_ANALYSIS_FRAME,
              timestampMs: 1000
            },
            diagnostics: {
              humRejection: 0,
              musicTrend: 0,
              silenceGate: 0,
              beatIntervalMs: 0,
              rawRms: 0,
              rawPeak: 0,
              adaptiveCeiling: 0.06,
              spectrumLow: 0,
              spectrumMid: 0,
              spectrumHigh: 0,
              stateReason: 'start',
              showStateReason: 'start',
              momentReason: 'none',
              conductorReason: 'none',
              warnings: []
            }
          },
          {
            timestampMs: 1200,
            listeningFrame: {
              ...DEFAULT_LISTENING_FRAME,
              timestampMs: 1200,
              calibrated: true,
              presence: 0.7,
              showState: 'surge'
            },
            analysisFrame: {
              ...DEFAULT_ANALYSIS_FRAME,
              timestampMs: 1200
            },
            diagnostics: {
              humRejection: 0,
              musicTrend: 0.5,
              silenceGate: 0.2,
              beatIntervalMs: 500,
              rawRms: 0.2,
              rawPeak: 0.3,
              adaptiveCeiling: 0.08,
              spectrumLow: 0.1,
              spectrumMid: 0.2,
              spectrumHigh: 0.3,
              stateReason: 'end',
              showStateReason: 'end',
              momentReason: 'lift',
              conductorReason: 'drop',
              warnings: []
            }
          }
        ]
      })
    );
    const replay = new ReplayController();

    replay.load(capture);
    replay.play(100);
    replay.update(300);

    expect(replay.getCurrentFrame().showState).toBe('surge');

    replay.seekRatio(0);
    expect(replay.getCurrentFrame().presence).toBeCloseTo(0.1);

    replay.clear();
    expect(replay.getStatus().mode).toBe('idle');
  });

  it('normalizes wrapped frame chronology around the active trigger', () => {
    const stalePreRoll = cloneReplayCaptureFrame(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1400,
        calibrated: true
      },
      {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs: 1400
      },
      DEFAULT_AUDIO_DIAGNOSTICS
    );
    const stalePreRollTail = cloneReplayCaptureFrame(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1500,
        calibrated: true
      },
      {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs: 1500
      },
      DEFAULT_AUDIO_DIAGNOSTICS
    );
    const activeFrame = cloneReplayCaptureFrame(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 500,
        calibrated: true,
        showState: 'surge'
      },
      {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs: 500
      },
      DEFAULT_AUDIO_DIAGNOSTICS
    );
    const activeTail = cloneReplayCaptureFrame(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 620,
        calibrated: true,
        showState: 'generative'
      },
      {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs: 620
      },
      DEFAULT_AUDIO_DIAGNOSTICS
    );

    const capture = buildReplayCapture(
      [stalePreRoll, stalePreRollTail, activeFrame, activeTail],
      DEFAULT_AUDIO_DIAGNOSTICS,
      {
        backend: 'webgpu',
        ready: true,
        qualityTier: 'safe',
        devicePixelRatio: 1,
        cappedPixelRatio: 1,
        fps: 60,
        frameTimeMs: 16.7,
        warnings: [],
        visualTelemetry: DEFAULT_VISUAL_TELEMETRY
      },
      DEFAULT_USER_CONTROL_STATE,
      {
        label: 'wrapped-frames',
        captureMode: 'auto',
        sourceMode: 'system-audio',
        triggerKind: 'drop',
        triggerReason: 'wrapped',
        triggerTimestampMs: 540
      }
    );
    const reparsed = parseReplayCapture(JSON.stringify(capture));
    const replay = new ReplayController();

    expect(capture.frames.map((frame) => frame.timestampMs)).toEqual([500, 620]);
    expect(reparsed.frames.map((frame) => frame.timestampMs)).toEqual([500, 620]);

    replay.load(reparsed);

    expect(replay.getStatus().durationMs).toBe(120);
    expect(replay.getCurrentFrame().showState).toBe('surge');
  });
});
