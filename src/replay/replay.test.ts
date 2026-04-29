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
import { isTransientCaptureDirectoryWriteError } from './captureDirectory';
import {
  buildReplayProofInvalidation,
  buildReplayRunJournalSample,
  buildReplayRunPersistenceArtifacts,
  createReplayBuildInfo,
  createReplayRunJournal,
  deriveProofMissionEligibility,
  deriveReplayArtifactIntegrityFromJournal,
  deriveReplayProofValidity,
  deriveReplayScenarioAssessment,
  hasReplayProofInvalidation,
  isReplayBuildInfoValid,
  registerReplayRunClip,
  registerReplayRunStill,
  shouldApplyReplayProofInvalidation
} from './runJournal';
import {
  buildReplayProofMissionSnapshot,
  shouldSuppressProofKeyboardShortcut
} from './proofMission';

describe('replay workflow', () => {
  it('rejects proof build identity that is dev, dirty, or unverified', () => {
    const strictBuildInfo = {
      version: '1.0.0-test',
      commit: 'abc1234',
      branch: 'codex/full-version-foundation',
      builtAt: '2026-04-23T13:00:00.000Z',
      lane: 'stable' as const,
      proofStatus: 'proof-pack' as const,
      dirty: false
    };

    expect(isReplayBuildInfoValid(strictBuildInfo)).toBe(true);
    expect(isReplayBuildInfoValid({ ...strictBuildInfo, lane: 'dev' })).toBe(false);
    expect(
      isReplayBuildInfoValid({
        ...strictBuildInfo,
        proofStatus: 'unverified'
      })
    ).toBe(false);
    expect(isReplayBuildInfoValid({ ...strictBuildInfo, dirty: true })).toBe(false);
  });

  it('snapshots run journal persistence artifacts before async writes mutate state', () => {
    const buildInfo = createReplayBuildInfo({
      version: '1.0.0-test',
      commit: 'abc1234',
      branch: 'codex/full-version-foundation',
      builtAt: '2026-04-23T13:00:00.000Z',
      lane: 'stable',
      proofStatus: 'proof-pack',
      dirty: false
    });
    const proofMission = buildReplayProofMissionSnapshot('primary-benchmark', {
      lockedAt: '2026-04-23T13:00:59.000Z',
      autoCorrections: ['auto capture enabled']
    });
    const journal = createReplayRunJournal({
      buildInfo,
      runId: 'run-proof-snapshot',
      sourceMode: 'system-audio',
      sourceLabel: 'PC Audio',
      proofWaveArmed: true,
      proofScenarioKind: 'primary-benchmark',
      proofMission,
      sessionStartedAt: '2026-04-23T13:01:00.000Z',
      sessionElapsedMs: 0,
      interventionCount: 0,
      interventionReasons: [],
      noTouchWindowPassed: false
    });

    journal.clips.push({
      captureLabel: 'auto_authority-turn_2026-04-23_13-01-01',
      fileName: 'auto_authority-turn_2026-04-23_13-01-01.json',
      captureMode: 'auto',
      capturedAt: '2026-04-23T13:01:01.000Z',
      triggerKind: 'authority-turn',
      triggerTimestampMs: 1000
    });
    journal.checkpointStills.push({
      kind: 'authority',
      timestampMs: 1000,
      fileName: 'run-proof-snapshot__authority_1000.png'
    });

    const artifacts = buildReplayRunPersistenceArtifacts(journal, {
      journalFileName: 'run-proof-snapshot__run-journal.json'
    });

    journal.clips.push({
      captureLabel: 'late_clip',
      fileName: 'late_clip.json',
      captureMode: 'auto',
      capturedAt: '2026-04-23T13:01:02.000Z'
    });
    journal.checkpointStills[0]!.fileName = 'mutated-after-snapshot.png';

    expect(artifacts.journalSnapshot.clips).toHaveLength(1);
    expect(artifacts.journalSnapshot.checkpointStills[0]?.fileName).toBe(
      'run-proof-snapshot__authority_1000.png'
    );
    expect(artifacts.manifestSnapshot.clipFiles).toEqual([
      'clips/auto_authority-turn_2026-04-23_13-01-01.json'
    ]);
    expect(artifacts.manifestSnapshot.stillFiles).toEqual([
      'stills/run-proof-snapshot__authority_1000.png'
    ]);
    expect(artifacts.manifestSnapshot.metadata.proofMission?.kind).toBe(
      'primary-benchmark'
    );
    expect(artifacts.journalSnapshot.metadata.proofMission?.autoCorrections).toEqual([
      'auto capture enabled'
    ]);
  });

  it('records proof mission identity in run journal samples', () => {
    const proofMission = buildReplayProofMissionSnapshot('primary-benchmark', {
      lockedAt: '2026-04-23T13:00:59.000Z'
    });
    const sample = buildReplayRunJournalSample({
      diagnostics: DEFAULT_AUDIO_DIAGNOSTICS,
      renderer: {
        backend: 'webgpu',
        ready: true,
        qualityTier: 'balanced',
        devicePixelRatio: 1,
        cappedPixelRatio: 1,
        fps: 60,
        frameTimeMs: 16.7,
        warnings: [],
        visualTelemetry: DEFAULT_VISUAL_TELEMETRY
      },
      listeningFrame: DEFAULT_LISTENING_FRAME,
      showStartRoute: proofMission.expectedRoute,
      routePolicy: 'this-computer',
      resolvedRoute: 'this-computer',
      showCapabilityMode: 'full-autonomous',
      proofWaveArmed: true,
      proofScenarioKind: proofMission.scenarioKind,
      proofMission,
      interventionCount: 0,
      noTouchWindowPassed: false
    });

    expect(sample.autonomy.proofScenarioKind).toBe('primary-benchmark');
    expect(sample.autonomy.proofMissionKind).toBe('primary-benchmark');
    expect(sample.direction.showStartRoute).toBe('pc-audio');
    expect(sample.playableMotif.activePlayableMotifScene).toBe('none');
  });

  it('preserves an explicit mission scenario assessment on capture clips', () => {
    const proofMission = buildReplayProofMissionSnapshot('operator-trust', {
      lockedAt: '2026-04-23T13:00:59.000Z'
    });
    const capture = buildReplayCapture(
      [
        cloneReplayCaptureFrame(
          { ...DEFAULT_LISTENING_FRAME, timestampMs: 1000 },
          DEFAULT_ANALYSIS_FRAME,
          DEFAULT_AUDIO_DIAGNOSTICS,
          DEFAULT_VISUAL_TELEMETRY
        )
      ],
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
        visualTelemetry: DEFAULT_VISUAL_TELEMETRY
      },
      DEFAULT_USER_CONTROL_STATE,
      {
        captureMode: 'auto',
        sourceMode: 'system-audio',
        showStartRoute: proofMission.expectedRoute,
        proofScenarioKind: proofMission.scenarioKind,
        proofMission,
        noTouchWindowPassed: false,
        interventionCount: 0,
        scenarioAssessment: {
          declaredScenario: proofMission.scenarioKind,
          derivedScenario: proofMission.scenarioKind,
          confidence: 1,
          mismatchReasons: [],
          validated: true
        }
      }
    );

    expect(capture.metadata.proofScenarioKind).toBe('operator-trust');
    expect(capture.metadata.scenarioAssessment?.validated).toBe(true);
    expect(capture.metadata.scenarioAssessment?.derivedScenario).toBe(
      'operator-trust'
    );
  });

  it('detects replay proof invalidations and transient file-system write errors', () => {
    const buildInfo = createReplayBuildInfo({
      version: '1.0.0-test',
      commit: 'abc1234',
      branch: 'codex/full-version-foundation',
      builtAt: '2026-04-23T13:00:00.000Z',
      lane: 'stable',
      proofStatus: 'proof-pack',
      dirty: false
    });
    const journal = createReplayRunJournal({
      buildInfo,
      runId: 'run-proof-invalidated',
      sourceMode: 'system-audio',
      sourceLabel: 'PC Audio',
      proofWaveArmed: true,
      proofScenarioKind: 'primary-benchmark',
      sessionStartedAt: '2026-04-23T13:01:00.000Z',
      sessionElapsedMs: 0,
      interventionCount: 0,
      interventionReasons: [],
      noTouchWindowPassed: false
    });

    journal.metadata.proofValidity = deriveReplayProofValidity({
      proofWaveArmed: true,
      readiness: {
        seriousRun: true,
        ready: true,
        checkedAt: '2026-04-23T13:00:59.000Z',
        checks: []
      },
      startedReady: true,
      invalidations: [
        buildReplayProofInvalidation(
          'run-journal-save-failed',
          1200,
          'Run-journal persistence failed after retries.',
          'restart-run'
        )
      ]
    });

    expect(hasReplayProofInvalidation(journal, 'run-journal-save-failed')).toBe(true);
    expect(hasReplayProofInvalidation(journal, 'capture-save-failed')).toBe(false);
    expect(
      isTransientCaptureDirectoryWriteError(
        new DOMException(
          'An operation that depends on state cached in an interface object was made but the state had changed since it was read from disk.',
          'InvalidStateError'
        )
      )
    ).toBe(true);
  });

  it('derives final Proof Mission eligibility only after duration, no-touch, scenario, and artifact integrity pass', () => {
    const buildInfo = createReplayBuildInfo({
      version: '1.0.0-test',
      commit: 'abc1234',
      branch: 'codex/full-version-foundation',
      builtAt: '2026-04-23T13:00:00.000Z',
      lane: 'stable',
      proofStatus: 'proof-pack',
      dirty: false
    });
    const proofMission = buildReplayProofMissionSnapshot('primary-benchmark', {
      lockedAt: '2026-04-23T13:00:59.000Z'
    });
    const readiness = {
      seriousRun: true,
      ready: true,
      checkedAt: '2026-04-23T13:00:59.000Z',
      checks: []
    };
    const journal = createReplayRunJournal({
      buildInfo,
      runId: 'run-proof-eligible',
      sourceMode: 'system-audio',
      sourceLabel: 'PC Audio',
      showStartRoute: proofMission.expectedRoute,
      proofWaveArmed: true,
      proofScenarioKind: 'primary-benchmark',
      proofMission,
      proofReadiness: readiness,
      sessionStartedAt: '2026-04-23T13:01:00.000Z',
      sessionElapsedMs: 65_000,
      interventionCount: 0,
      interventionReasons: [],
      noTouchWindowPassed: true
    });

    registerReplayRunClip(journal, {
      captureLabel: 'auto_authority-turn_2026-04-23_13-01-30',
      fileName: 'auto_authority-turn_2026-04-23_13-01-30.json',
      captureMode: 'auto',
      capturedAt: '2026-04-23T13:01:30.000Z',
      triggerKind: 'authority-turn',
      triggerTimestampMs: 30_000
    });
    registerReplayRunStill(journal, {
      kind: 'authority',
      timestampMs: 30_000,
      fileName: 'run-proof-eligible__authority_30000.png'
    });

    const scenarioAssessment = deriveReplayScenarioAssessment({
      declaredScenario: 'primary-benchmark',
      sourceMode: 'system-audio',
      showStartRoute: 'pc-audio',
      noTouchWindowPassed: true,
      interventionCount: 0,
      interventionReasons: [],
      captureMode: 'auto',
      hasBuildIdentity: true
    });
    const artifactIntegrity = deriveReplayArtifactIntegrityFromJournal(journal);
    const eligibility = deriveProofMissionEligibility({
      proofWaveArmed: true,
      proofMission,
      sourceMode: 'system-audio',
      showStartRoute: 'pc-audio',
      proofReadiness: readiness,
      scenarioAssessment,
      invalidations: [],
      artifactIntegrity,
      noTouchWindowPassed: true,
      durationMs: 65_000,
      buildInfo
    });

    expect(artifactIntegrity.verdict).toBe('pass');
    expect(eligibility.verdict).toBe('eligible');
    expect(eligibility.currentProofEligible).toBe(true);

    const tooShort = deriveProofMissionEligibility({
      proofWaveArmed: true,
      proofMission,
      sourceMode: 'system-audio',
      showStartRoute: 'pc-audio',
      proofReadiness: readiness,
      scenarioAssessment,
      invalidations: [],
      artifactIntegrity,
      noTouchWindowPassed: true,
      durationMs: 20_000,
      buildInfo
    });

    expect(tooShort.verdict).toBe('ineligible');
    expect(
      tooShort.gates.find((gate) => gate.id === 'duration-minimum')?.status
    ).toBe('fail');
  });

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
      DEFAULT_USER_CONTROL_STATE,
      {
        routePolicy: 'auto',
        resolvedRoute: 'the-room',
        routeRecommendation: {
          recommendedRoute: 'hybrid',
          strength: 'soft',
          reason: 'room-feed-limited',
          headline: 'Hybrid could add a cleaner musical spine',
          detail: 'The room feed is alive but still soft.'
        },
        showWorldId: 'pressure-chamber',
        effectiveWorldId: 'storm-crown',
        lookId: 'machine-halo',
        effectiveLookId: 'acid-flare',
        worldPoolId: 'pressure-worlds',
        lookPoolId: 'electric-looks',
        stanceId: 'autonomous',
        launchSurfaceMode: 'launch',
        livePanelMode: null,
        interventionCount: 0,
        firstInterventionTimestampMs: null,
        noTouchWindowPassed: true,
        proofScenarioKind: 'primary-benchmark',
        proofMission: buildReplayProofMissionSnapshot('primary-benchmark', {
          lockedAt: '2026-04-23T13:00:59.000Z'
        }),
        buildInfo: {
          version: '1.0.0-test',
          commit: 'abc1234',
          branch: 'codex/full-version-foundation',
          builtAt: '2026-04-23T13:00:00.000Z',
          lane: 'stable',
          proofStatus: 'proof-pack',
          dirty: false
        },
        runId: 'run-proof-001',
        sessionStartedAt: '2026-04-23T13:01:00.000Z',
        sessionElapsedMs: 32000,
        proofReadiness: {
          seriousRun: true,
          ready: true,
          checkedAt: '2026-04-23T13:00:59.000Z',
          checks: [
            {
              id: 'capture-folder',
              label: 'Capture folder',
              passed: true,
              reason: 'Capture folder is writable and points at the inbox.',
              blocking: true
            }
          ]
        },
        proofValidity: {
          verdict: 'valid',
          currentProofEligible: true,
          startedReady: true,
          lastCheckedAt: '2026-04-23T13:01:32.000Z',
          invalidations: [],
          recoveryGuidance: null
        },
        runLifecycleState: 'reviewed-candidate',
        directorBiasSnapshot: {
          heroPresence: 0.44,
          worldTakeover: 0.74,
          scale: 0.82,
          depth: 0.78,
          motionAppetite: 0.72,
          cameraAppetite: 0.66,
          syncAppetite: 0.68,
          drift: 0.62,
          emission: 0.74,
          paletteHeat: 0.58,
          contrast: 0.72,
          saturation: 0.7,
          impactAppetite: 0.78,
          aftermath: 0.66,
          residueAppetite: 0.56,
          eventAppetite: 0.72,
          ritual: 0.46,
          machine: 0.62,
          elegance: 0.58,
          danger: 0.62
        }
      }
    );
    const parsed = parseReplayCapture(JSON.stringify(capture));

    expect(parsed.version).toBe(3);
    expect(parsed.frames).toHaveLength(2);
    expect(parsed.metadata.artifactType).toBe('replay-capture');
    expect(parsed.metadata.captureMode).toBe('manual');
    expect(parsed.metadata.sourceMode).toBe('room-mic');
    expect(parsed.metadata.controls.preset).toBe(DEFAULT_USER_CONTROL_STATE.preset);
    expect(parsed.metadata.bootSummary?.calibrationDurationMs).toBe(0);
    expect(parsed.metadata.sourceSummary?.sourceMode).toBe('room-mic');
    expect(parsed.metadata.inputDriftSummary?.noiseFloor.start).toBeCloseTo(
      DEFAULT_AUDIO_DIAGNOSTICS.noiseFloor
    );
    expect(parsed.metadata.routePolicy).toBe('auto');
    expect(parsed.metadata.resolvedRoute).toBe('the-room');
    expect(parsed.metadata.routeRecommendation?.recommendedRoute).toBe('hybrid');
    expect(parsed.metadata.effectiveWorldId).toBe('storm-crown');
    expect(parsed.metadata.lookPoolId).toBe('electric-looks');
    expect(parsed.metadata.noTouchWindowPassed).toBe(true);
    expect(parsed.metadata.proofScenarioKind).toBe('primary-benchmark');
    expect(parsed.metadata.proofMission?.kind).toBe('primary-benchmark');
    expect(parsed.metadata.proofMission?.scenarioKind).toBe('primary-benchmark');
    expect(parsed.metadata.buildInfo?.commit).toBe('abc1234');
    expect(parsed.metadata.runId).toBe('run-proof-001');
    expect(parsed.metadata.sessionElapsedMs).toBe(32000);
    expect(parsed.metadata.scenarioAssessment?.declaredScenario).toBe(
      'primary-benchmark'
    );
    expect(parsed.metadata.proofReadiness?.ready).toBe(true);
    expect(parsed.metadata.proofValidity?.currentProofEligible).toBe(true);
    expect(parsed.metadata.runLifecycleState).toBe('reviewed-candidate');
    expect(parsed.metadata.directorBiasSnapshot?.worldTakeover).toBeCloseTo(0.74);
    expect(parsed.frames[1]?.diagnostics.momentReason).toBe('Lift moment triggered.');
    expect(parsed.frames[1]?.diagnostics.beatIntervalMs).toBe(480);
    expect(parsed.frames[1]?.diagnostics.conductorReason).toBe('Drop tension is climbing.');
    expect(parsed.frames[1]?.listeningFrame.momentKind).toBe('lift');
  });

  it('suppresses the Advanced keyboard shortcut during live proof missions', () => {
    expect(
      shouldSuppressProofKeyboardShortcut({
        proofWaveArmed: true,
        runtimeActive: true,
        key: 'm'
      })
    ).toBe(true);
    expect(
      shouldSuppressProofKeyboardShortcut({
        proofWaveArmed: true,
        runtimeActive: false,
        key: 'm'
      })
    ).toBe(false);
    expect(
      shouldSuppressProofKeyboardShortcut({
        proofWaveArmed: false,
        runtimeActive: true,
        key: 'm'
      })
    ).toBe(false);
  });

  it('does not apply operator invalidations after a proof run is finalized', () => {
    expect(
      shouldApplyReplayProofInvalidation({
        proofWaveArmed: true,
        proofRunState: 'finalized',
        code: 'operator-intervention'
      })
    ).toBe(false);
    expect(
      shouldApplyReplayProofInvalidation({
        proofWaveArmed: true,
        proofRunState: 'finalized',
        code: 'run-finalize-failed'
      })
    ).toBe(true);
    expect(
      shouldApplyReplayProofInvalidation({
        proofWaveArmed: true,
        proofRunState: 'live',
        code: 'operator-intervention'
      })
    ).toBe(true);
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
