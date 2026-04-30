import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildAggregateSection,
  buildCaptureSection,
  resolveEventArchetype,
  summarizeCapture
} from '../../scripts/capture-analysis-core.mjs';
import {
  buildEmptyCaptureReportMarkdown,
  collectJsonFiles,
  loadManifestBenchmarkSummaries
} from '../../scripts/capture-reporting.mjs';
import {
  DEFAULT_ANALYSIS_FRAME,
  DEFAULT_AUDIO_DIAGNOSTICS,
  DEFAULT_LISTENING_FRAME
} from '../types/audio';
import {
  DEFAULT_VISUAL_TELEMETRY,
  DEFAULT_VISUAL_TELEMETRY_SUMMARY,
  type VisualTelemetryFrame
} from '../types/visual';
import { DEFAULT_USER_CONTROL_STATE } from '../types/tuning';
import {
  buildReplayCapture,
  cloneReplayCaptureFrame,
  parseReplayCapture
} from './session';

function createCaptureFrame({
  timestampMs,
  showState = 'surge',
  performanceIntent = 'detonate',
  momentKind = 'strike',
  subPressure = 0.66,
  body = 0.58,
  accent = 0.44,
  phraseTension = 0.74,
  resonance = 0.34,
  musicConfidence = 0.8,
  peakConfidence = 0.72,
  beatConfidence = 0.75,
  dropImpact = 0.82,
  sectionChange = 0.42,
  releaseTail = 0.08,
  speechConfidence = 0.03,
  ambienceConfidence = 0.08,
  beatIntervalMs = 500,
  visualTelemetry = {}
}: {
  timestampMs: number;
  showState?: typeof DEFAULT_LISTENING_FRAME.showState;
  performanceIntent?: typeof DEFAULT_LISTENING_FRAME.performanceIntent;
  momentKind?: typeof DEFAULT_LISTENING_FRAME.momentKind;
  subPressure?: number;
  body?: number;
  accent?: number;
  phraseTension?: number;
  resonance?: number;
  musicConfidence?: number;
  peakConfidence?: number;
  beatConfidence?: number;
  dropImpact?: number;
  sectionChange?: number;
  releaseTail?: number;
  speechConfidence?: number;
  ambienceConfidence?: number;
  beatIntervalMs?: number;
  visualTelemetry?: Partial<VisualTelemetryFrame> & {
    temporalWindows?: Partial<VisualTelemetryFrame['temporalWindows']>;
  };
}) {
  const mergedVisualTelemetry: VisualTelemetryFrame = {
    ...DEFAULT_VISUAL_TELEMETRY,
    ...visualTelemetry,
    macroEventsActive: visualTelemetry.macroEventsActive ?? DEFAULT_VISUAL_TELEMETRY.macroEventsActive,
    temporalWindows: {
      ...DEFAULT_VISUAL_TELEMETRY.temporalWindows,
      ...visualTelemetry.temporalWindows
    }
  };

  return cloneReplayCaptureFrame(
    {
      ...DEFAULT_LISTENING_FRAME,
      timestampMs,
      calibrated: true,
      showState,
      performanceIntent,
      momentKind,
      confidence: 0.88,
      subPressure,
      bassBody: body,
      lowMidBody: body * 0.9,
      presence: 0.62,
      body,
      air: 0.28,
      shimmer: 0.24,
      accent,
      brightness: 0.4,
      roughness: 0.22,
      tonalStability: 0.58,
      harmonicColor: 0.46,
      phraseTension,
      resonance,
      speechConfidence,
      ambienceConfidence,
      transientConfidence: accent,
      musicConfidence,
      peakConfidence,
      momentum: 0.76,
      beatConfidence,
      beatPhase: 0.04,
      barPhase: 0.12,
      phrasePhase: 0.24,
      preDropTension: 0.78,
      dropImpact,
      sectionChange,
      releaseTail,
      momentAmount: 0.7
    },
    {
      ...DEFAULT_ANALYSIS_FRAME,
      timestampMs,
      rms: 0.28,
      peak: 0.54
    },
    {
      ...DEFAULT_AUDIO_DIAGNOSTICS,
      beatIntervalMs,
      rawRms: 0.28,
      rawPeak: 0.54,
      stateReason: 'sample',
      showStateReason: 'sample',
      momentReason: 'sample',
      conductorReason: 'sample'
    },
    mergedVisualTelemetry
  );
}

describe('capture analysis', () => {
  it('resolves collapse archetypes for heavy drop captures', () => {
    const archetype = resolveEventArchetype(
      {
        subPressure: 0.72,
        dropImpact: 0.84,
        sectionChange: 0.3,
        peakConfidence: 0.76,
        accent: 0.42,
        beatConfidence: 0.74,
        musicConfidence: 0.82,
        phraseTension: 0.78,
        releaseTail: 0.08
      },
      'surge'
    );

    expect(archetype).toBe('collapse');
  });

  it('summarizes captures with consistency-oriented findings', () => {
    const capture = {
      metadata: {
        label: 'drop-test',
        captureMode: 'auto',
        triggerKind: 'drop',
        triggerReason: 'test',
        sourceLabel: 'PC Audio',
        sourceMode: 'system-audio',
        rendererBackend: 'webgpu',
        qualityTier: 'balanced',
        rawPathGranted: true,
        controls: DEFAULT_USER_CONTROL_STATE,
        quickStartProfileId: 'pc-music',
        quickStartProfileLabel: 'Music On This PC',
        triggerCount: 1,
        extensionCount: 0
      },
      frames: [
        createCaptureFrame({ timestampMs: 1000 }),
        createCaptureFrame({ timestampMs: 1520, dropImpact: 0.86, sectionChange: 0.44 })
      ]
    };

    const summary = summarizeCapture(capture, 'C:/dev/GitHub/visulive/captures/drop-test.json');

    expect(summary.eventArchetype).toBe('collapse');
    expect(summary.dominantState).toBe('surge');
    expect((summary.peaks as { dropImpact: number }).dropImpact).toBeCloseTo(0.86);
    expect(summary.longestRuns?.showState?.value).toBe('surge');
    expect(summary.longestRuns?.performanceIntent?.value).toBe('detonate');
    expect(summary.findings.some((finding: string) => finding.includes('under-committing'))).toBe(false);
  });

  it('normalizes wrapped capture chronology around the active trigger before reporting', () => {
    const capture = {
      metadata: {
        label: 'wrapped-capture',
        captureMode: 'auto',
        triggerKind: 'drop',
        triggerReason: 'wrapped',
        triggerTimestampMs: 540,
        sourceLabel: 'PC Audio',
        sourceMode: 'system-audio',
        rendererBackend: 'webgpu',
        qualityTier: 'safe',
        rawPathGranted: true,
        controls: DEFAULT_USER_CONTROL_STATE,
        quickStartProfileId: 'pc-music',
        quickStartProfileLabel: 'Music On This PC'
      },
      frames: [
        createCaptureFrame({ timestampMs: 1400, showState: 'void' }),
        createCaptureFrame({ timestampMs: 1500, showState: 'void' }),
        createCaptureFrame({ timestampMs: 500, showState: 'surge' }),
        createCaptureFrame({ timestampMs: 620, showState: 'generative' })
      ]
    };

    const summary = summarizeCapture(
      capture,
      'C:/dev/GitHub/visulive/captures/wrapped-capture.json'
    );

    expect(summary.durationMs).toBe(120);
    expect(summary.frameCount).toBe(2);
    expect(summary.dominantState).toBe('surge');
    expect(
      summary.findings.some((finding: string) =>
        finding.includes('discarded stale pre-roll frames')
      )
    ).toBe(true);
  });

  it('surfaces compositor and chamber telemetry from frames', () => {
    const capture = {
      metadata: {
        label: 'visual-telemetry',
        captureMode: 'auto',
        triggerKind: 'section',
        triggerReason: 'telemetry',
        sourceLabel: 'PC Audio',
        sourceMode: 'system-audio',
        rendererBackend: 'webgpu',
        qualityTier: 'safe',
        rawPathGranted: true,
        controls: DEFAULT_USER_CONTROL_STATE,
        quickStartProfileId: 'pc-music',
        quickStartProfileLabel: 'Music On This PC'
      },
      frames: [
        createCaptureFrame({
          timestampMs: 1000,
          visualTelemetry: {
            exposure: 0.84,
            bloomStrength: 0.16,
            bloomThreshold: 0.21,
            bloomRadius: 0.14,
            afterImageDamp: 0.82,
            showFamily: 'chamber-ring',
            macroEventsActive: ['flare', 'ghost-residue'],
            atmosphereMatterState: 'gas',
            atmosphereGas: 0.74,
            atmosphereLiquid: 0.18,
            atmospherePlasma: 0.08,
            atmosphereCrystal: 0,
            atmospherePressure: 0.22,
            atmosphereIonization: 0.16,
            atmosphereResidue: 0.28,
            atmosphereStructureReveal: 0.04
          }
        }),
        createCaptureFrame({
          timestampMs: 1500,
          visualTelemetry: {
            exposure: 1.08,
            bloomStrength: 0.42,
            bloomThreshold: 0.18,
            bloomRadius: 0.09,
            afterImageDamp: 0.79,
            showFamily: 'chamber-ring',
            macroEventsActive: ['flare'],
            atmosphereMatterState: 'plasma',
            atmosphereGas: 0.22,
            atmosphereLiquid: 0.18,
            atmospherePlasma: 0.46,
            atmosphereCrystal: 0.14,
            atmospherePressure: 0.48,
            atmosphereIonization: 0.52,
            atmosphereResidue: 0.34,
            atmosphereStructureReveal: 0.18
          }
        })
      ]
    };

    const summary = summarizeCapture(capture, 'C:/dev/GitHub/visulive/captures/visual-telemetry.json');
    const visualSummary = (summary.visualSummary ?? DEFAULT_VISUAL_TELEMETRY_SUMMARY) as any;
    const section = buildCaptureSection(summary, 'C:/dev/GitHub/visulive');

    expect(visualSummary.exposureMean).toBeCloseTo(0.96);
    expect(visualSummary.exposurePeak).toBeCloseTo(1.08);
    expect(visualSummary.bloomStrengthPeak).toBeCloseTo(0.42);
    expect(visualSummary.bloomRadiusMean).toBeCloseTo(0.115);
    expect(visualSummary.afterImageDampMean).toBeCloseTo(0.805);
    expect(visualSummary.atmosphereMatterStateSpread.gas).toBeCloseTo(0.5);
    expect(visualSummary.atmosphereMatterStateSpread.plasma).toBeCloseTo(0.5);
    expect(visualSummary.atmospherePressurePeak).toBeCloseTo(0.48);
    expect(visualSummary.atmosphereIonizationPeak).toBeCloseTo(0.52);
    expect(visualSummary.dominantShowFamily).toBe('chamber-ring');
    expect(visualSummary.dominantMacroEvent).toBe('flare');
    expect(visualSummary.showFamilySpread['chamber-ring']).toBeCloseTo(1);
    expect(visualSummary.macroEventSpread.flare).toBeCloseTo(1);
    expect(section).toContain('### Compositor summary');
    expect(section).toContain('### Atmosphere summary');
    expect(section).toContain('### Chamber summary');
    expect(section).toContain('Dominant atmosphere matter state: gas');
    expect(section).toContain('Dominant show family: chamber-ring');
  });

  it('preserves spend-governor telemetry in replay summaries and parses legacy captures safely', () => {
    const capture = buildReplayCapture(
      [
        createCaptureFrame({
          timestampMs: 1000,
          visualTelemetry: {
            stageSpendProfile: 'peak',
            stageCueFamily: 'reveal',
            stageShotClass: 'worldTakeover',
            stageTransitionClass: 'wipe',
            stageTempoCadenceMode: 'surge',
            stageCompositionSafety: 0.62,
            stageHeroScaleMin: 0.56,
            stageHeroScaleMax: 1.86,
            stageHeroAnchorLane: 'right',
            stageHeroAnchorStrength: 0.82,
            stageExposureCeiling: 0.92,
            stageBloomCeiling: 0.88,
            stageRingAuthority: 'event-platform',
            stageWashoutSuppression: 0.28,
            heroScale: 1.42,
            heroScreenX: 0.72,
            heroScreenY: 0.44,
            heroCoverageEstimate: 0.36,
            heroOffCenterPenalty: 0.18,
            heroDepthPenalty: 0.14,
            ringAuthority: 0.86,
            chamberPresenceScore: 0.34,
            frameHierarchyScore: 0.46,
            compositionSafetyFlag: true,
            overbright: 0.22
            ,
            ringBeltPersistence: 0.42,
            wirefieldDensityScore: 0.28,
            worldDominanceDelivered: 0.24
          }
        }),
        createCaptureFrame({
          timestampMs: 1500,
          visualTelemetry: {
            stageSpendProfile: 'earned',
            stageCueFamily: 'release',
            stageShotClass: 'aftermath',
            stageTransitionClass: 'residueDissolve',
            stageTempoCadenceMode: 'aftermath',
            stageCompositionSafety: 0.78,
            stageHeroScaleMin: 0.42,
            stageHeroScaleMax: 1.28,
            stageHeroAnchorLane: 'left',
            stageHeroAnchorStrength: 0.74,
            stageExposureCeiling: 0.88,
            stageBloomCeiling: 0.72,
            stageRingAuthority: 'framing-architecture',
            stageWashoutSuppression: 0.5,
            heroScale: 0.84,
            heroScreenX: 0.32,
            heroScreenY: 0.58,
            heroCoverageEstimate: 0.18,
            heroOffCenterPenalty: 0.06,
            heroDepthPenalty: 0.04,
            ringAuthority: 0.38,
            chamberPresenceScore: 0.52,
            frameHierarchyScore: 0.72,
            compositionSafetyFlag: false,
            overbright: 0.02,
            ringBeltPersistence: 0.18,
            wirefieldDensityScore: 0.16,
            worldDominanceDelivered: 0.58
          }
        })
      ],
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
        label: 'spend-governor',
        captureMode: 'auto',
        sourceMode: 'system-audio',
        quickStartProfileId: 'pc-music',
        quickStartProfileLabel: 'Music On This PC'
      }
    );
    const earnedOnlyCapture = buildReplayCapture(
      [
        createCaptureFrame({
          timestampMs: 2200,
          visualTelemetry: {
            stageSpendProfile: 'earned',
            stageHeroScaleMin: 0.44,
            stageHeroScaleMax: 1.24,
            stageHeroAnchorLane: 'left',
            stageHeroAnchorStrength: 0.71,
            stageExposureCeiling: 0.89,
            stageBloomCeiling: 0.74,
            stageRingAuthority: 'framing-architecture',
            stageWashoutSuppression: 0.46,
            heroScale: 0.86,
            heroScreenX: 0.38,
            heroScreenY: 0.57,
            ringAuthority: 0.34,
            overbright: 0.03
          }
        })
      ],
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
        label: 'spend-governor-earned',
        captureMode: 'auto',
        sourceMode: 'system-audio',
        quickStartProfileId: 'pc-music',
        quickStartProfileLabel: 'Music On This PC'
      }
    );
    const summary = summarizeCapture(capture, 'C:/dev/GitHub/visulive/captures/spend-governor.json');
    const earnedSummary = summarizeCapture(
      earnedOnlyCapture,
      'C:/dev/GitHub/visulive/captures/spend-governor-earned.json'
    );
    const section = buildCaptureSection(summary, 'C:/dev/GitHub/visulive');
    const visualSummary = summary.visualSummary as any;

    expect(capture.metadata.visualSummary?.heroScalePeak).toBeCloseTo(1.42);
    expect(capture.metadata.visualSummary?.overbrightRate).toBeCloseTo(0.5);
    expect(capture.metadata.visualSummary?.ringAuthorityMean).toBeCloseTo(0.62);
    expect(capture.metadata.visualSummary?.dominantSpendProfile).toBe('peak');
    expect(visualSummary?.spendProfileSpread.peak).toBeCloseTo(0.5);
    expect(visualSummary?.spendProfileSpread.earned).toBeCloseTo(0.5);
    expect(visualSummary?.stageCueFamilySpread?.reveal).toBeCloseTo(0.5);
    expect(visualSummary?.stageCueFamilySpread?.release).toBeCloseTo(0.5);
    expect(visualSummary?.stageRingAuthoritySpread['event-platform']).toBeCloseTo(0.5);
    expect(visualSummary?.stageRingAuthoritySpread['framing-architecture']).toBeCloseTo(0.5);
    expect(visualSummary?.stageShotClassSpread?.worldTakeover).toBeCloseTo(0.5);
    expect(visualSummary?.stageTransitionClassSpread?.wipe).toBeCloseTo(0.5);
    expect(visualSummary?.stageTempoCadenceModeSpread?.surge).toBeCloseTo(0.5);
    expect(visualSummary?.stageCompositionSafetyMean).toBeCloseTo(0.7);
    expect(visualSummary?.heroCoveragePeak).toBeCloseTo(0.36);
    expect(visualSummary?.worldDominanceDeliveredMean).toBeCloseTo(0.41);
    expect(section).toContain('### Governance summary');
    expect(section).toContain('### Longest runs');
    expect(section).toContain('Dominant spend profile: peak');
    expect(section).toContain('Spend profile spread: peak=50.0%, earned=50.0%');
    expect(section).toContain('Stage cue-family spread: reveal=50.0%, release=50.0%');
    expect(section).toContain(
      'Stage ring authority spread: event-platform=50.0%, framing-architecture=50.0%'
    );
    expect(section).toContain('Stage shot-class spread: worldTakeover=50.0%, aftermath=50.0%');
    expect(section).toContain('Stage transition spread: wipe=50.0%, residueDissolve=50.0%');
    expect(section).toContain('Composition safety mean / unsafe rate: 0.700 / 0.500');
    expect(section).toContain('World dominance delivered mean: 0.410');
    expect(section).toContain('Hero scale mean / peak: 1.130 / 1.420');
    expect(section).toContain('Overbright rate / peak: 0.500 / 0.220');
    expect(section).toContain('Dominant stage ring authority: event-platform');
    const benchmarkSummary = {
      ...summary,
      benchmark: {
      id: 'afqr-aftermath-lock-2026-04-09',
      label: 'AFQR aftermath-lock correction benchmark',
      active: true
      }
    };
    const benchmarkAggregate = buildAggregateSection([benchmarkSummary, earnedSummary]);
    expect(benchmarkAggregate).toContain('### Governance spread');
    expect(benchmarkAggregate).toContain('### Active benchmark read');
    expect(benchmarkAggregate).toContain('Active benchmark label: AFQR aftermath-lock correction benchmark');
    expect(benchmarkAggregate).toContain('- peak (1)');
    expect(benchmarkAggregate).toContain('- earned (1)');
    expect(benchmarkAggregate).toContain('- event-platform (1)');
    expect(benchmarkAggregate).toContain('- framing-architecture (1)');

    const reparsed = parseReplayCapture(JSON.stringify(capture));

    expect(reparsed.metadata.visualSummary?.heroScalePeak).toBeCloseTo(1.42);
    expect(reparsed.metadata.visualSummary?.dominantSpendProfile).toBe('peak');
    expect(reparsed.frames[0]?.visualTelemetry.stageHeroAnchorLane).toBe('right');
    expect(reparsed.frames[0]?.visualTelemetry.overbright).toBeCloseTo(0.22);

    const legacy = parseReplayCapture(
      JSON.stringify({
        version: 1,
        metadata: {
          label: 'legacy-capture',
          capturedAt: new Date().toISOString(),
          captureMode: 'manual',
          sourceLabel: 'Legacy Input',
          sourceMode: 'room-mic',
          rendererBackend: 'webgpu',
          qualityTier: 'safe',
          controls: DEFAULT_USER_CONTROL_STATE
        },
        frames: [
          {
            timestampMs: 1000,
            listeningFrame: { ...DEFAULT_LISTENING_FRAME, timestampMs: 1000 },
            analysisFrame: { ...DEFAULT_ANALYSIS_FRAME, timestampMs: 1000 },
            diagnostics: {
              humRejection: 0,
              musicTrend: 0,
              silenceGate: 0,
              beatIntervalMs: 0,
              rawRms: 0,
              rawPeak: 0,
              adaptiveCeiling: 0,
              spectrumLow: 0,
              spectrumMid: 0,
              spectrumHigh: 0,
              stateReason: 'legacy',
              showStateReason: 'legacy',
              momentReason: 'legacy',
              conductorReason: 'legacy',
              warnings: []
            },
            visualTelemetry: {
              qualityTier: 'safe',
              exposure: 0.82,
              bloomStrength: 0.12,
              bloomThreshold: 0.2,
              ambientGlowBudget: 0.08,
              eventGlowBudget: 0.1,
              worldGlowSpend: 0.12,
              heroGlowSpend: 0.18,
              shellGlowSpend: 0.08,
              activeAct: 'void-chamber',
              paletteState: 'void-cyan',
              showFamily: 'legacy-shell',
              macroEventsActive: [],
              heroHue: 0.4,
              worldHue: 0.36,
              temporalWindows: DEFAULT_VISUAL_TELEMETRY.temporalWindows
            }
          }
        ]
      })
    );

    expect(legacy.frames[0]?.visualTelemetry.heroScale).toBeUndefined();
    expect(legacy.frames[0]?.visualTelemetry.overbright).toBeUndefined();
    expect(legacy.metadata.visualSummary).toBeUndefined();
  });

  it('reports longest contiguous stage runs for aftermath-style captures', () => {
    const capture = {
      metadata: {
        label: 'aftermath-run',
        captureMode: 'auto',
        triggerKind: 'section',
        triggerReason: 'aftermath-lock',
        sourceLabel: 'PC Audio',
        sourceMode: 'system-audio',
        rendererBackend: 'webgpu',
        qualityTier: 'safe',
        rawPathGranted: true,
        controls: DEFAULT_USER_CONTROL_STATE,
        quickStartProfileId: 'pc-music',
        quickStartProfileLabel: 'Music On This PC'
      },
      frames: [
        createCaptureFrame({
          timestampMs: 0,
          showState: 'aftermath',
          performanceIntent: 'haunt',
          momentKind: 'none',
          releaseTail: 0.34,
          visualTelemetry: {
            stageCueFamily: 'haunt',
            stageShotClass: 'aftermath',
            stageTransitionClass: 'residueDissolve',
            stageTempoCadenceMode: 'aftermath'
          }
        }),
        createCaptureFrame({
          timestampMs: 1000,
          showState: 'aftermath',
          performanceIntent: 'haunt',
          momentKind: 'none',
          releaseTail: 0.36,
          visualTelemetry: {
            stageCueFamily: 'haunt',
            stageShotClass: 'aftermath',
            stageTransitionClass: 'residueDissolve',
            stageTempoCadenceMode: 'aftermath'
          }
        }),
        createCaptureFrame({
          timestampMs: 2200,
          showState: 'generative',
          performanceIntent: 'ignite',
          momentKind: 'strike',
          releaseTail: 0.08,
          visualTelemetry: {
            stageCueFamily: 'reveal',
            stageShotClass: 'pressure',
            stageTransitionClass: 'wipe',
            stageTempoCadenceMode: 'metered'
          }
        })
      ]
    };

    const summary = summarizeCapture(capture, 'C:/dev/GitHub/visulive/captures/aftermath-run.json');
    const section = buildCaptureSection(summary, 'C:/dev/GitHub/visulive');

    expect(summary.longestRuns?.showState?.value).toBe('aftermath');
    expect(summary.longestRuns?.showState?.frameCount).toBe(2);
    expect(summary.longestRuns?.stageCueFamily?.value).toBe('haunt');
    expect(section).toContain('Stage cue family');
    expect(section).toContain('`haunt`');
  });

  it('counts oversized and multi-event windows from trigger-kind-aware flag rules', () => {
    const oversizedOnly = summarizeCapture(
      {
        metadata: {
          label: 'oversized-only',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'oversized',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC',
          triggerCount: 1,
          extensionCount: 0
        },
        frames: [
          createCaptureFrame({ timestampMs: 1000 }),
          createCaptureFrame({ timestampMs: 18050 })
        ]
      },
      'C:/dev/GitHub/visulive/captures/oversized-only.json'
    );
    const multiEventExtension = summarizeCapture(
      {
        metadata: {
          label: 'multi-extension',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'multi-extension',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC',
          triggerCount: 2,
          extensionCount: 3
        },
        frames: [
          createCaptureFrame({ timestampMs: 2000 }),
          createCaptureFrame({ timestampMs: 2600 })
        ]
      },
      'C:/dev/GitHub/visulive/captures/multi-extension.json'
    );
    const multiEventTriggers = summarizeCapture(
      {
        metadata: {
          label: 'multi-triggers',
          captureMode: 'auto',
          triggerKind: 'release',
          triggerReason: 'multi-triggers',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC',
          triggerCount: 9,
          extensionCount: 0
        },
        frames: [
          createCaptureFrame({ timestampMs: 3000 }),
          createCaptureFrame({ timestampMs: 3600 })
        ]
      },
      'C:/dev/GitHub/visulive/captures/multi-triggers.json'
    );

    expect(oversizedOnly.qualityFlags).toContain('oversizedWindow');
    expect(oversizedOnly.qualityFlags).not.toContain('multiEventWindow');
    expect(multiEventExtension.qualityFlags).toContain('oversizedWindow');
    expect(multiEventExtension.qualityFlags).toContain('multiEventWindow');
    expect(multiEventTriggers.qualityFlags).toContain('oversizedWindow');
    expect(multiEventTriggers.qualityFlags).toContain('multiEventWindow');

    const aggregate = buildAggregateSection([
      oversizedOnly,
      multiEventExtension,
      multiEventTriggers
    ]);

    expect(aggregate).toContain('Oversized windows: 3');
    expect(aggregate).toContain('Multi-event windows: 2');
  });

  it('flags semantic palette and hero-form churn separately from low variation', () => {
    const summary = summarizeCapture(
      {
        metadata: {
          label: 'semantic-churn',
          captureMode: 'auto',
          triggerKind: 'section',
          triggerReason: 'semantic regression',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1000,
            visualTelemetry: {
              activeHeroForm: 'orb',
              plannedHeroForm: 'shard',
              plannedActiveHeroFormMatch: false,
              heroFormSwitchCount: 1,
              unearnedChangeRisk: 0.36,
              heroWorldHueDivergence: 0.42,
              paletteBaseState: 'void-cyan',
              paletteTransitionReason: 'hold'
            }
          }),
          createCaptureFrame({
            timestampMs: 4000,
            visualTelemetry: {
              activeHeroForm: 'cube',
              plannedHeroForm: 'shard',
              plannedActiveHeroFormMatch: false,
              heroFormSwitchCount: 2,
              unearnedChangeRisk: 0.32,
              heroWorldHueDivergence: 0.38,
              paletteBaseState: 'acid-lime',
              paletteTransitionReason: 'hold'
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/semantic-churn.json'
    );

    expect(summary.qualityFlags).toContain('randomFeelingPaletteChurn');
    expect(summary.qualityFlags).toContain('unearnedHeroFormSwitch');
    expect(summary.qualityFlags).toContain('heroWorldHueDivergence');
    expect(summary.visualSummary?.plannedActiveHeroFormMatchRate).toBe(0);
    expect(summary.visualSummary?.heroFormSwitchesPerMinute).toBeCloseTo(20, 3);
  });

  it('separates legacy glow spend from perceptual washout', () => {
    const legacyGlow = summarizeCapture(
      {
        metadata: {
          label: 'legacy-glow-spend',
          captureMode: 'auto',
          triggerKind: 'authority-turn',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'safe',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1000,
            visualTelemetry: {
              ambientGlowBudget: 0.42,
              perceptualWashoutRisk: 0.02
            }
          }),
          createCaptureFrame({
            timestampMs: 3000,
            visualTelemetry: {
              ambientGlowBudget: 0.38,
              perceptualWashoutRisk: 0.03
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/legacy-glow-spend.json'
    );
    const washedOut = summarizeCapture(
      {
        metadata: {
          label: 'washed-out-glow',
          captureMode: 'auto',
          triggerKind: 'authority-turn',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'safe',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1000,
            visualTelemetry: {
              ambientGlowBudget: 0.42,
              perceptualWashoutRisk: 0.16
            }
          }),
          createCaptureFrame({
            timestampMs: 3000,
            visualTelemetry: {
              ambientGlowBudget: 0.38,
              perceptualWashoutRisk: 0.17
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/washed-out-glow.json'
    );
    const section = buildCaptureSection(legacyGlow, 'C:/dev/GitHub/visulive');

    expect(legacyGlow.qualityFlags).toContain('legacyGlowSpend');
    expect(legacyGlow.qualityFlags).not.toContain('highAmbientGlow');
    expect(washedOut.qualityFlags).toContain('highAmbientGlow');
    expect(section).toContain('Legacy glow spend stayed elevated');
  });

  it('reports playable motif scene coherence separately from signature moments', () => {
    const summary = summarizeCapture(
      {
        metadata: {
          label: 'scene-coherence',
          captureMode: 'auto',
          triggerKind: 'signature-moment-peak',
          triggerReason: 'scene mismatch',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1000,
            visualTelemetry: {
              activePlayableMotifScene: 'neon-cathedral',
              playableMotifSceneTransitionReason: 'signature-moment',
              playableMotifSceneMotifMatch: false,
              playableMotifScenePaletteMatch: true,
              playableMotifSceneDistinctness: 0.84,
              playableMotifSceneSilhouetteConfidence: 0.38,
              visualMotif: 'rupture-scar',
              activeSignatureMoment: 'cathedral-open',
              signatureMomentStyle: 'maximal-neon'
            }
          }),
          createCaptureFrame({
            timestampMs: 3000,
            visualTelemetry: {
              activePlayableMotifScene: 'collapse-scar',
              playableMotifSceneTransitionReason: 'drop-rupture',
              playableMotifSceneMotifMatch: true,
              playableMotifScenePaletteMatch: true,
              playableMotifSceneDistinctness: 0.9,
              playableMotifSceneSilhouetteConfidence: 0.52,
              visualMotif: 'rupture-scar',
              activeSignatureMoment: 'collapse-scar',
              signatureMomentStyle: 'contrast-mythic'
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/scene-coherence.json'
    );

    expect(summary.visualSummary?.dominantPlayableMotifScene).toBe('neon-cathedral');
    expect(summary.visualSummary?.playableMotifSceneMotifMatchRate).toBe(0.5);
    expect(summary.visualSummary?.playableMotifSceneLongestRunMs).toBe(0);
    expect(summary.qualityFlags).toContain('sceneMotifMismatch');
    expect(summary.qualityFlags).toContain('sameySceneSilhouette');
  });

  it('flags playable scene intent mismatch and reports scene drivers', () => {
    const summary = summarizeCapture(
      {
        metadata: {
          label: 'scene-intent-mismatch',
          captureMode: 'auto',
          triggerKind: 'section',
          triggerReason: 'scene intent mismatch',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1000,
            visualTelemetry: {
              activePlayableMotifScene: 'machine-tunnel',
              playableMotifSceneDriver: 'motif',
              playableMotifSceneIntentMatch: false,
              playableMotifSceneTransitionReason: 'hold',
              playableMotifSceneMotifMatch: false,
              playableMotifScenePaletteMatch: true,
              playableMotifSceneDistinctness: 0.78,
              playableMotifSceneSilhouetteConfidence: 0.42,
              visualMotif: 'neon-portal'
            }
          }),
          createCaptureFrame({
            timestampMs: 3000,
            visualTelemetry: {
              activePlayableMotifScene: 'machine-tunnel',
              playableMotifSceneDriver: 'motif',
              playableMotifSceneIntentMatch: false,
              playableMotifSceneTransitionReason: 'hold',
              playableMotifSceneMotifMatch: false,
              playableMotifScenePaletteMatch: true,
              playableMotifSceneDistinctness: 0.78,
              playableMotifSceneSilhouetteConfidence: 0.42,
              visualMotif: 'neon-portal'
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/scene-intent-mismatch.json'
    );
    const section = buildCaptureSection(
      summary,
      'C:/dev/GitHub/visulive'
    );

    expect(summary.visualSummary?.playableMotifSceneIntentMatchRate).toBe(0);
    expect(summary.visualSummary?.dominantPlayableMotifSceneDriver).toBe('motif');
    expect(summary.qualityFlags).toContain('sceneIntentMismatch');
    expect(section).toContain('Scene intent/motif/palette/profile match / silhouette');
    expect(section).toContain('Playable scene driver spread: motif=100.0%');
  });

  it('flags scene profile mismatch and decorative particle activity', () => {
    const summary = summarizeCapture(
      {
        metadata: {
          label: 'scene-profile-mismatch',
          captureMode: 'auto',
          triggerKind: 'signature-moment-peak',
          triggerReason: 'same label different image',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1000,
            visualTelemetry: {
              activePlayableMotifScene: 'neon-cathedral',
              playableMotifSceneProfileId: 'machine-tunnel',
              playableMotifSceneSilhouetteFamily: 'perspective-tunnel',
              playableMotifSceneSurfaceRole: 'shutter-lanes',
              playableMotifSceneProfileMatch: false,
              compositorMaskFamily: 'shutter',
              particleFieldJob: 'none',
              playableMotifSceneSilhouetteConfidence: 0.5,
              assetLayerActivity: {
                ...DEFAULT_VISUAL_TELEMETRY.assetLayerActivity,
                particles: 0.9
              }
            }
          }),
          createCaptureFrame({
            timestampMs: 3000,
            visualTelemetry: {
              activePlayableMotifScene: 'neon-cathedral',
              playableMotifSceneProfileId: 'machine-tunnel',
              playableMotifSceneSilhouetteFamily: 'perspective-tunnel',
              playableMotifSceneSurfaceRole: 'shutter-lanes',
              playableMotifSceneProfileMatch: false,
              compositorMaskFamily: 'shutter',
              particleFieldJob: 'none',
              playableMotifSceneSilhouetteConfidence: 0.5,
              assetLayerActivity: {
                ...DEFAULT_VISUAL_TELEMETRY.assetLayerActivity,
                particles: 0.9
              }
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/scene-profile-mismatch.json'
    );

    expect(summary.visualSummary?.playableMotifSceneProfileMatchRate).toBe(0);
    expect(summary.visualSummary?.dominantPlayableMotifSceneProfile).toBe('machine-tunnel');
    expect(summary.visualSummary?.dominantParticleFieldJob).toBe('none');
    expect(summary.qualityFlags).toContain('sceneProfileMismatch');
    expect(summary.qualityFlags).toContain('decorativeParticleActivity');
  });

  it('classifies precharged timing separately and excludes it from lag averages', () => {
    const precharged = summarizeCapture(
      {
        metadata: {
          label: 'precharged-drop',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'precharged',
          triggerTimestampMs: 1400,
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 1200,
            dropImpact: 0.72,
            visualTelemetry: {
              eventGlowBudget: 0.28
            }
          }),
          createCaptureFrame({
            timestampMs: 1640,
            dropImpact: 0.16,
            sectionChange: 0.08,
            visualTelemetry: {
              eventGlowBudget: 0.1,
              temporalWindows: {
                ...DEFAULT_VISUAL_TELEMETRY.temporalWindows,
                beatStrike: 0.14
              }
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/precharged-drop.json'
    );
    const lagging = summarizeCapture(
      {
        metadata: {
          label: 'lagging-drop',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'lagging',
          triggerTimestampMs: 1000,
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 900,
            dropImpact: 0.16,
            sectionChange: 0.06,
            visualTelemetry: {
              eventGlowBudget: 0.1,
              temporalWindows: {
                ...DEFAULT_VISUAL_TELEMETRY.temporalWindows,
                beatStrike: 0.12
              }
            }
          }),
          createCaptureFrame({
            timestampMs: 1360,
            dropImpact: 0.74,
            visualTelemetry: {
              eventGlowBudget: 0.3
            }
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/lagging-drop.json'
    );

    expect(precharged.eventTimingDisposition).toBe('precharged');
    expect(precharged.eventLatencyMs).toBe(-200);
    expect(lagging.eventTimingDisposition).toBe('lagging');
    expect(lagging.eventLatencyMs).toBe(360);

    const prechargedSection = buildCaptureSection(
      precharged,
      'C:/dev/GitHub/visulive'
    );
    const aggregate = buildAggregateSection([precharged, lagging]);

    expect(prechargedSection).toContain('Event timing: precharged (200ms lead)');
    expect(aggregate).toContain('Average event latency (non-precharged): 360ms');
    expect(aggregate).toContain('### Event timing spread');
    expect(aggregate).toContain('- precharged (1)');
    expect(aggregate).toContain('- lagging (1)');
  });

  it('builds reports with trigger and archetype spread', () => {
    const dropSummary = summarizeCapture(
      {
        metadata: {
          label: 'drop-a',
          captureMode: 'auto',
          proofScenarioKind: 'primary-benchmark',
          triggerKind: 'drop',
          triggerReason: 'drop-a',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({ timestampMs: 1000 }),
          createCaptureFrame({ timestampMs: 1520, dropImpact: 0.86 })
        ]
      },
      'C:/dev/GitHub/visulive/captures/drop-a.json'
    );
    const aftermathSummary = summarizeCapture(
      {
        metadata: {
          label: 'release-a',
          captureMode: 'auto',
          proofScenarioKind: 'coverage',
          triggerKind: 'release',
          triggerReason: 'release-a',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [
          createCaptureFrame({
            timestampMs: 2000,
            showState: 'aftermath',
            performanceIntent: 'haunt',
            momentKind: 'release',
            dropImpact: 0.12,
            sectionChange: 0.18,
            releaseTail: 0.52,
            resonance: 0.48,
            musicConfidence: 0.44,
            peakConfidence: 0.38
          }),
          createCaptureFrame({
            timestampMs: 2520,
            showState: 'aftermath',
            performanceIntent: 'haunt',
            momentKind: 'release',
            dropImpact: 0.08,
            sectionChange: 0.12,
            releaseTail: 0.56,
            resonance: 0.5,
            musicConfidence: 0.38,
            peakConfidence: 0.3
          })
        ]
      },
      'C:/dev/GitHub/visulive/captures/release-a.json'
    );

    const aggregate = buildAggregateSection([dropSummary, aftermathSummary]);
    const section = buildCaptureSection(dropSummary, 'C:/dev/GitHub/visulive');

    expect(aggregate).toContain('drop:collapse');
    expect(aggregate).toContain('release:ghost-trace');
    expect(aggregate).toContain('### Source mode spread');
    expect(aggregate).toContain('### Proof scenario spread');
    expect(aggregate).toContain('Primary benchmark (1)');
    expect(aggregate).toContain('Coverage (1)');
    expect(aggregate).toContain('### Launch profile spread');
    expect(aggregate).toContain('### Active launch profile spread');
    expect(aggregate).toContain('### Act spread');
    expect(aggregate).not.toContain('dropImpact=x');
    expect(section).toContain('Event archetype: `collapse`');
    expect(section).toContain('Dominant state: `surge`');
    expect(section).toContain('Proof scenario: Primary benchmark');
    expect(section).toContain('Active launch profile: Music On This PC');
    expect(section).toContain('Dominant act:');
  });

  it('separates fresh captures from legacy pre-wall-clock captures', () => {
    const legacySummary = summarizeCapture(
      {
        metadata: {
          label: 'auto_drop_1969-12-31_19-00-37',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'legacy',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE
        },
        frames: [
          createCaptureFrame({ timestampMs: 1000, dropImpact: 0.32, sectionChange: 0.22 }),
          createCaptureFrame({ timestampMs: 1520, dropImpact: 0.34, sectionChange: 0.24 })
        ]
      },
      'C:/dev/GitHub/visulive/captures/auto_drop_1969-12-31_19-00-37.json'
    );
    const freshSummary = summarizeCapture(
      {
        metadata: {
          label: 'auto_drop_2026-04-07_21-50-53',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'fresh',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE
        },
        frames: [
          createCaptureFrame({ timestampMs: 2000, dropImpact: 0.48, sectionChange: 0.38 }),
          createCaptureFrame({ timestampMs: 2520, dropImpact: 0.52, sectionChange: 0.42 })
        ]
      },
      'C:/dev/GitHub/visulive/captures/auto_drop_2026-04-07_21-50-53.json'
    );

    const aggregate = buildAggregateSection([legacySummary, freshSummary]);

    expect(aggregate).toContain('Fresh non-legacy captures: 1');
    expect(aggregate).toContain('Legacy pre-wall-clock captures: 1');
    expect(aggregate).toContain('## Fresh capture read');
  });

  it('ignores archive and canonical folders when analyzing inbox by default', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'visulive-capture-test-'));
    const inbox = path.join(root, 'inbox');
    const canonical = path.join(root, 'canonical');
    const archive = path.join(root, 'archive');
    const reports = path.join(root, 'reports');

    await fs.mkdir(inbox, { recursive: true });
    await fs.mkdir(canonical, { recursive: true });
    await fs.mkdir(path.join(archive, 'legacy'), { recursive: true });
    await fs.mkdir(reports, { recursive: true });
    await fs.writeFile(path.join(inbox, 'inbox.json'), '{}', 'utf8');
    await fs.writeFile(path.join(canonical, 'canonical.json'), '{}', 'utf8');
    await fs.writeFile(path.join(archive, 'legacy', 'legacy.json'), '{}', 'utf8');
    await fs.writeFile(path.join(reports, 'report.json'), '{}', 'utf8');

    const files = await collectJsonFiles(root, {
      ignoreReports: true,
      ignoreArchive: true,
      ignoreCanonical: true
    });

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(path.join('inbox', 'inbox.json'));
  });

  it('loads active benchmark truth from manifest capture paths outside the current batch', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'visulive-benchmark-read-'));
    const benchmarkCapturePath = path.join(root, 'manifest-benchmark.json');
    const benchmarkCapture = buildReplayCapture(
      [createCaptureFrame({ timestampMs: 1000, showState: 'generative' })],
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
        label: 'manifest-benchmark',
        captureMode: 'auto',
        sourceMode: 'system-audio',
        triggerKind: 'drop',
        triggerReason: 'manifest benchmark'
      }
    );

    await fs.writeFile(benchmarkCapturePath, JSON.stringify(benchmarkCapture), 'utf8');

    const currentSummary = summarizeCapture(
      {
        metadata: {
          label: 'current-drop',
          captureMode: 'auto',
          triggerKind: 'drop',
          triggerReason: 'current',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'safe',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE,
          quickStartProfileId: 'pc-music',
          quickStartProfileLabel: 'Music On This PC'
        },
        frames: [createCaptureFrame({ timestampMs: 1000 })]
      },
      'C:/dev/GitHub/visulive/captures/current-drop.json'
    );

    const benchmarkSummaries = await loadManifestBenchmarkSummaries([currentSummary], {
      manifest: {
        activeBenchmarkId: 'manifest-afqr',
        primaryBenchmarkId: 'manifest-afqr',
        secondaryScenarioIds: [],
        benchmarks: [
          {
            id: 'manifest-afqr',
            kind: 'primary-correction',
            label: 'Manifest AFQR benchmark',
            capturePaths: [benchmarkCapturePath]
          }
        ]
      }
    });

    expect(benchmarkSummaries).toHaveLength(1);
    expect((benchmarkSummaries[0] as any)?.benchmark?.active).toBe(true);

    const aggregate = buildAggregateSection([currentSummary], {
      benchmarkSummaries
    });
    const emptyReport = buildEmptyCaptureReportMarkdown({
      manifestHealth: {
        lines: ['- Active benchmark id: manifest-afqr']
      },
      benchmarkSummaries
    });

    expect(aggregate).toContain('Active benchmark label: Manifest AFQR benchmark');
    expect(aggregate).toContain('Benchmark label: Manifest AFQR benchmark');
    expect(emptyReport).toContain('## Benchmark truth');
    expect(emptyReport).toContain('Benchmark label: Manifest AFQR benchmark');
  });

  it('renders manifest health and richer v2 evidence sections', () => {
    const capture = buildReplayCapture(
      [
        createCaptureFrame({
          timestampMs: 1000,
          visualTelemetry: {
            stageWorldMode: 'cathedral-rise',
            stageCueFamily: 'reveal',
            stageShotClass: 'pressure',
            stageTransitionClass: 'wipe',
            stageTempoCadenceMode: 'metered'
          }
        })
      ],
      {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        calibrationDurationMs: 2400,
        calibrationSampleCount: 120,
        calibrationRmsPercentile20: 0.012,
        calibrationPeakPercentile90: 0.064,
        displayAudioGranted: true,
        displayTrackLabel: 'AFQR',
        deviceLabel: 'PC Audio'
      },
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
        label: 'evidence-v2',
        captureMode: 'auto',
        sourceMode: 'system-audio',
        triggerKind: 'floor',
        triggerReason: 'quiet room test',
        triggerTimestampMs: 1000,
        proofStills: {
          requested: true,
          sampleIntervalMs: 480,
          saved: [
            {
              kind: 'peak',
              timestampMs: 1000,
              fileName: 'evidence-v2__peak.png'
            }
          ]
        }
      }
    );
    const summary = summarizeCapture(
      capture,
      'C:/dev/GitHub/visulive/captures/evidence-v2.json'
    );
    const section = buildCaptureSection(summary, 'C:/dev/GitHub/visulive');
    const aggregate = buildAggregateSection([summary], {
      manifestHealthLines: [
        '- Active benchmark id: afqr-test',
        '- Missing benchmark capture path: `captures/inbox/missing.json`'
      ]
    });

    expect(section).toContain('### Boot and calibration');
    expect(section).toContain('### Source integrity');
    expect(section).toContain('### Decision summary');
    expect(section).toContain('### Input drift');
    expect(section).toContain('### Proof stills');
    expect(section).toContain('evidence-v2__peak.png');
    expect(aggregate).toContain('## Manifest health');
    expect(aggregate).toContain('### Review gates');
    expect(aggregate).toContain('truth gate');
    expect(aggregate).toContain('### Coverage debt and monopolies');
    expect(aggregate).toContain('Missing benchmark capture path');
  });

  it('classifies silent shared PC audio startup as non-proof evidence', () => {
    const sourceReadiness = {
      ...DEFAULT_AUDIO_DIAGNOSTICS.sourceReadiness,
      trackGranted: true,
      signalPresent: false,
      musicLock: false,
      proofReady: false,
      sourcePresentScore: 0,
      currentSignalPresent: false,
      currentMusicLock: false,
      recentSignalFrameCount: 0,
      recentMusicLockFrameCount: 0
    };
    const frame = createCaptureFrame({
      timestampMs: 1000,
      showState: 'void',
      performanceIntent: 'hold',
      momentKind: 'none',
      subPressure: 0,
      body: 0,
      accent: 0,
      phraseTension: 0,
      resonance: 0,
      musicConfidence: 0,
      peakConfidence: 0,
      beatConfidence: 0,
      dropImpact: 0,
      sectionChange: 0,
      releaseTail: 0
    });
    frame.diagnostics = {
      ...frame.diagnostics,
      rawRms: 0,
      rawPeak: 0,
      startupStage: 'engine-frames',
      startupBlocker: 'silent-shared-source',
      workletPacketCount: 24,
      nonzeroRmsFrameCount: 0,
      zeroRmsFrameCount: 24,
      currentSignalPresent: false,
      currentMusicLock: false,
      sourceReadiness
    };
    const capture = buildReplayCapture(
      [frame],
      {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        sourceMode: 'system-audio',
        calibrationTrust: 'provisional',
        calibrationQuality: 'silent-system-audio',
        displayAudioGranted: true,
        displayTrackLabel: 'Chrome Tab',
        deviceLabel: 'PC Audio',
        rawRms: 0,
        rawPeak: 0,
        startupStage: 'engine-frames',
        startupBlocker: 'silent-shared-source',
        workletPacketCount: 24,
        nonzeroRmsFrameCount: 0,
        zeroRmsFrameCount: 24,
        currentSignalPresent: false,
        currentMusicLock: false,
        sourceReadiness
      },
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
        label: 'silent-pc-audio',
        captureMode: 'auto',
        sourceMode: 'system-audio',
        triggerKind: 'floor',
        triggerReason: 'silent shared source',
        triggerTimestampMs: 1000
      }
    );

    const summary = summarizeCapture(
      capture,
      'C:/dev/GitHub/visulive/captures/silent-pc-audio.json'
    );
    const section = buildCaptureSection(summary, 'C:/dev/GitHub/visulive');
    const aggregate = buildAggregateSection([summary]);

    expect(summary.startupHealth).toBe('silent-share');
    expect(summary.findings).toContain(
      'PC Audio was shared, but no nonzero audio frames were recorded. Start playback in the shared source before proof calibration.'
    );
    expect(section).toContain(
      '- Startup stage / blocker / health: engine-frames / silent-shared-source / silent-share'
    );
    expect(aggregate).toContain('### Startup health');
    expect(aggregate).toContain('- silent-share (1)');
  });

  it('reports spectrum source hints in per-capture and aggregate evidence', () => {
    const frame = createCaptureFrame({
      timestampMs: 1000,
      dropImpact: 0.04,
      sectionChange: 0.02,
      accent: 0.04,
      peakConfidence: 0.12,
      beatConfidence: 0.1,
      musicConfidence: 0.18
    });
    frame.diagnostics.spectrumFrame = {
      schemaVersion: 1,
      timestampMs: 1000,
      sampleRate: 48000,
      fftSize: 2048,
      binWidth: 23.4375,
      legacyLow: 0.48,
      legacyMid: 0.14,
      legacyHigh: 0.08,
      coverageConfidence: 0.7,
      bands: [
        {
          id: 'kick',
          hzLow: 45,
          hzHigh: 90,
          energy: 0.72,
          peak: 0.8,
          flux: 0.4,
          onset: 0.82,
          sustain: 0.22,
          noise: 0.08,
          tonal: 0.18,
          confidence: 0.74,
          reliability: 0.52,
          binCount: 2
        }
      ]
    };
    frame.diagnostics.sourceHintFrame = {
      schemaVersion: 1,
      timestampMs: 1000,
      sourceMode: 'system-audio',
      runtimeMode: 'active',
      confidence: 0.82,
      topHintId: 'lowImpactCandidate',
      reasonCodes: ['low-onset'],
      suppressionCodes: ['speech-like'],
      hints: [
        {
          id: 'lowImpactCandidate',
          value: 0.9,
          confidence: 0.86,
          density: 0.5,
          reasonCodes: ['low-onset'],
          suppressionCodes: []
        },
        {
          id: 'speechPresenceCandidate',
          value: 0.66,
          confidence: 0.7,
          density: 0.44,
          reasonCodes: ['mid-presence'],
          suppressionCodes: ['speech-like']
        }
      ]
    };
    const capture = {
      metadata: {
        label: 'source-hint-test',
        captureMode: 'auto',
        triggerKind: 'drop',
        triggerReason: 'source hint proof',
        sourceLabel: 'PC Audio',
        sourceMode: 'system-audio',
        rendererBackend: 'webgpu',
        qualityTier: 'balanced',
        rawPathGranted: true,
        controls: DEFAULT_USER_CONTROL_STATE
      },
      frames: [frame]
    };

    const summary = summarizeCapture(
      capture,
      'C:/dev/GitHub/visulive/captures/source-hint-test.json'
    );
    const section = buildCaptureSection(summary, 'C:/dev/GitHub/visulive');
    const aggregate = buildAggregateSection([summary]);

    expect(summary.sourceHintSummary?.recorded).toBe(true);
    expect(summary.sourceHintSummary?.missedHighConfidenceSourceEvents).toBe(1);
    expect(section).toContain('### Spectrum source hints');
    expect(section).toContain('lowImpactCandidate');
    expect(section).toContain('speech-like');
    expect(aggregate).toContain('### Source-hint evidence');
    expect(aggregate).toContain('Captures with source hints: 1');
  });

  it('reports orchestration utilization across authored systems', () => {
    const capture = {
      metadata: {
        label: 'orchestration-utilization-test',
        captureMode: 'auto',
        triggerKind: 'section',
        triggerReason: 'utilization proof',
        sourceLabel: 'PC Audio',
        sourceMode: 'system-audio',
        rendererBackend: 'webgpu',
        qualityTier: 'balanced',
        rawPathGranted: true,
        controls: DEFAULT_USER_CONTROL_STATE
      },
      frames: [
        createCaptureFrame({
          timestampMs: 1000,
          visualTelemetry: {
            activeAct: 'matrix-storm',
            paletteState: 'tron-blue',
            canonicalCueClass: 'gather',
            stageCueFamily: 'gather',
            visualMotif: 'machine-grid',
            paletteBaseState: 'tron-blue',
            heroRole: 'supporting',
            activeHeroForm: 'cube',
            ringPosture: 'event-strike',
            stageWorldMode: 'aperture-cage',
            activeSignatureMoment: 'cathedral-open',
            signatureMomentPhase: 'hold',
            activePlayableMotifScene: 'machine-tunnel',
            playableMotifSceneProfileId: 'machine-tunnel',
            playableMotifSceneSilhouetteFamily: 'perspective-tunnel',
            playableMotifSceneSurfaceRole: 'shutter-lanes',
            compositorMaskFamily: 'shutter',
            particleFieldJob: 'pressure-dust'
          }
        }),
        createCaptureFrame({
          timestampMs: 1600,
          visualTelemetry: {
            activeAct: 'ghost-afterimage',
            paletteState: 'ghost-white',
            canonicalCueClass: 'haunt',
            stageCueFamily: 'haunt',
            visualMotif: 'ghost-residue',
            paletteBaseState: 'ghost-white',
            heroRole: 'ghost',
            activeHeroForm: 'diamond',
            ringPosture: 'residue-trace',
            stageWorldMode: 'ghost-chamber',
            activeSignatureMoment: 'ghost-residue',
            signatureMomentPhase: 'residue',
            activePlayableMotifScene: 'ghost-constellation',
            playableMotifSceneProfileId: 'ghost-constellation',
            playableMotifSceneSilhouetteFamily: 'wide-constellation',
            playableMotifSceneSurfaceRole: 'celestial-field',
            compositorMaskFamily: 'ghost-veil',
            particleFieldJob: 'memory-echo'
          }
        })
      ]
    };

    const summary = summarizeCapture(
      capture,
      'C:/dev/GitHub/visulive/captures/orchestration-utilization-test.json'
    );
    const aggregate = buildAggregateSection([summary]);

    expect(aggregate).toContain('### Orchestration utilization');
    expect(aggregate).toContain('Cue classes: gather=50.0%, haunt=50.0%');
    expect(aggregate).toContain('Playable scenes:');
    expect(aggregate).toContain('machine-tunnel=50.0%');
    expect(aggregate).toContain('ghost-constellation=50.0%');
    expect(aggregate).toContain('Compositor masks:');
    expect(aggregate).toContain('shutter=50.0%');
    expect(aggregate).toContain('ghost-veil=50.0%');
    expect(aggregate).toContain('Particle jobs:');
    expect(aggregate).toContain('pressure-dust=50.0%');
    expect(aggregate).toContain('memory-echo=50.0%');
  });

  it('does not count quiet texture source hints as missed source events', () => {
    const frame = createCaptureFrame({
      timestampMs: 1000,
      dropImpact: 0.03,
      sectionChange: 0.02,
      accent: 0.04,
      peakConfidence: 0.08,
      beatConfidence: 0.08,
      musicConfidence: 0.12
    });
    frame.diagnostics.sourceHintFrame = {
      schemaVersion: 1,
      timestampMs: 1000,
      sourceMode: 'system-audio',
      runtimeMode: 'active',
      confidence: 0.82,
      topHintId: 'silenceAir',
      reasonCodes: ['quiet-air'],
      suppressionCodes: [],
      hints: [
        {
          id: 'silenceAir',
          value: 0.92,
          confidence: 0.88,
          density: 0.2,
          reasonCodes: ['quiet-air'],
          suppressionCodes: []
        },
        {
          id: 'tonalLift',
          value: 0.74,
          confidence: 0.82,
          density: 0.24,
          reasonCodes: ['stable-tone'],
          suppressionCodes: []
        }
      ]
    };

    const summary = summarizeCapture(
      {
        metadata: {
          label: 'quiet-source-hint-test',
          captureMode: 'auto',
          triggerKind: 'quiet',
          triggerReason: 'quiet source hint proof',
          sourceLabel: 'PC Audio',
          sourceMode: 'system-audio',
          rendererBackend: 'webgpu',
          qualityTier: 'balanced',
          rawPathGranted: true,
          controls: DEFAULT_USER_CONTROL_STATE
        },
        frames: [frame]
      },
      'C:/dev/GitHub/visulive/captures/quiet-source-hint-test.json'
    );

    expect(summary.sourceHintSummary?.recorded).toBe(true);
    expect(summary.sourceHintSummary?.missedHighConfidenceSourceEvents).toBe(0);
  });
});
