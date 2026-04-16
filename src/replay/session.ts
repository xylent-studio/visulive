import type { AudioDiagnostics, AnalysisFrame, ListeningFrame } from '../types/audio';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import { sanitizeUserControlState, type UserControlState } from '../types/tuning';
import {
  DEFAULT_VISUAL_TELEMETRY,
  DEFAULT_VISUAL_TELEMETRY_SUMMARY,
  VISUAL_ASSET_LAYERS,
  type CaptureQualityFlag,
  type AtmosphereMatterState,
  type PaletteState,
  type ShowAct,
  type StageCueFamily,
  type StageShotClass,
  type StageWorldMode,
  type VisualTelemetryFrame,
  type VisualTelemetrySummary
} from '../types/visual';
import type {
  ReplayCapture,
  ReplayCaptureMetadata,
  ReplayCaptureFrame,
  ReplayDecisionBucketSummary,
  ReplayDecisionSummary,
  ReplayEventTimingDisposition,
  ReplayFrameDiagnostics,
  ReplayInputDriftSummary,
  ReplayMetricWindowSummary,
  ReplayProofStillSummary
} from './types';

type BuildReplayCaptureOptions = {
  label?: string;
  captureMode?: 'manual' | 'auto';
  triggerKind?: string;
  triggerReason?: string;
  sourceMode?: AudioDiagnostics['sourceMode'];
  launchQuickStartProfileId?: string | null;
  launchQuickStartProfileLabel?: string | null;
  quickStartProfileId?: string | null;
  quickStartProfileLabel?: string | null;
  triggerCount?: number;
  extensionCount?: number;
  triggerTimestampMs?: number;
  proofStills?: ReplayProofStillSummary | null;
};

type CaptureWindowJudgement = {
  oversized: boolean;
  multiEvent: boolean;
};

type EventTimingSummary = {
  disposition: ReplayEventTimingDisposition;
  latencyMs: number | null;
};

export function cloneListeningFrame(frame: ListeningFrame): ListeningFrame {
  return { ...frame };
}

export function cloneAnalysisFrame(frame: AnalysisFrame): AnalysisFrame {
  return { ...frame };
}

export function cloneReplayCaptureFrame(
  listeningFrame: ListeningFrame,
  analysisFrame: AnalysisFrame,
  audio: AudioDiagnostics,
  visualTelemetry: VisualTelemetryFrame = DEFAULT_VISUAL_TELEMETRY
): ReplayCaptureFrame {
  return {
    timestampMs: listeningFrame.timestampMs,
    listeningFrame: cloneListeningFrame(listeningFrame),
    analysisFrame: cloneAnalysisFrame(analysisFrame),
    diagnostics: {
      humRejection: audio.humRejection,
      musicTrend: audio.musicTrend,
      silenceGate: audio.silenceGate,
      beatIntervalMs: audio.beatIntervalMs,
      rawRms: audio.rawRms,
      rawPeak: audio.rawPeak,
      adaptiveCeiling: audio.adaptiveCeiling,
      noiseFloor: audio.noiseFloor,
      minimumCeiling: audio.minimumCeiling,
      calibrationPeak: audio.calibrationPeak,
      spectrumLow: audio.spectrumLow,
      spectrumMid: audio.spectrumMid,
      spectrumHigh: audio.spectrumHigh,
      roomMusicFloorActive: audio.roomMusicFloorActive,
      roomMusicDrive: audio.roomMusicDrive,
      aftermathEntryEvidence: audio.aftermathEntryEvidence,
      aftermathExitPressure: audio.aftermathExitPressure,
      stateReason: audio.stateReason,
      showStateReason: audio.showStateReason,
      momentReason: audio.momentReason,
      conductorReason: audio.conductorReason,
      warnings: [...audio.warnings]
    },
    visualTelemetry: cloneVisualTelemetryFrame(visualTelemetry)
  };
}

function inferShowActFromListeningFrame(
  frame: Pick<
    ListeningFrame,
    'showState' | 'performanceIntent' | 'dropImpact' | 'sectionChange' | 'releaseTail'
  >
): ShowAct {
  if (frame.showState === 'aftermath' || frame.performanceIntent === 'haunt') {
    return 'ghost-afterimage';
  }

  if (
    frame.showState === 'surge' ||
    frame.performanceIntent === 'detonate' ||
    frame.dropImpact > 0.48 ||
    frame.sectionChange > 0.4
  ) {
    return 'eclipse-rupture';
  }

  if (frame.showState === 'tactile') {
    return 'matrix-storm';
  }

  if (
    frame.showState === 'generative' ||
    frame.performanceIntent === 'ignite'
  ) {
    return 'laser-bloom';
  }

  return 'void-chamber';
}

function cloneVisualTelemetryFrame(
  visualTelemetry: VisualTelemetryFrame
): VisualTelemetryFrame {
  return {
    ...visualTelemetry,
    macroEventsActive: [...visualTelemetry.macroEventsActive],
    temporalWindows: { ...visualTelemetry.temporalWindows },
    assetLayerActivity: { ...visualTelemetry.assetLayerActivity }
  };
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry) => typeof entry[1] === 'number')
  ) as Record<string, number>;
}

function normalizeFixedNumberRecord<TKey extends string>(
  keys: readonly TKey[],
  value: unknown
): Record<TKey, number> {
  const normalized = normalizeNumberRecord(value);

  return Object.fromEntries(
    keys.map((key) => [key, typeof normalized[key] === 'number' ? normalized[key] : 0])
  ) as Record<TKey, number>;
}

function normalizeNestedFixedNumberRecord<
  TOuter extends string,
  TInner extends string
>(
  outerKeys: readonly TOuter[],
  innerKeys: readonly TInner[],
  value: unknown
): Record<TOuter, Record<TInner, number>> {
  if (!value || typeof value !== 'object') {
    return Object.fromEntries(
      outerKeys.map((outer) => [outer, normalizeFixedNumberRecord(innerKeys, undefined)])
    ) as Record<TOuter, Record<TInner, number>>;
  }

  return Object.fromEntries(
    outerKeys.map((outer) => [
      outer,
      normalizeFixedNumberRecord(innerKeys, (value as Record<string, unknown>)[outer])
    ])
  ) as Record<TOuter, Record<TInner, number>>;
}

function qualityTierRank(value: string): number {
  switch (value) {
    case 'premium':
      return 3;
    case 'balanced':
      return 2;
    case 'safe':
      return 1;
    default:
      return 0;
  }
}

function buildTimestampLabel(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

function deriveCaptureWindowJudgement(
  triggerKind: string | undefined,
  durationMs: number,
  triggerCount: number,
  extensionCount: number
): CaptureWindowJudgement {
  const normalizedTriggerKind =
    triggerKind === 'drop' ||
    triggerKind === 'section' ||
    triggerKind === 'release' ||
    triggerKind === 'floor'
      ? triggerKind
      : undefined;
  const thresholds =
    normalizedTriggerKind === 'drop'
      ? { maxDurationMs: 7600, maxExtensions: 1, maxTriggerCount: 3 }
      : normalizedTriggerKind === 'section' || normalizedTriggerKind === 'release'
        ? { maxDurationMs: 9000, maxExtensions: 2, maxTriggerCount: 4 }
        : normalizedTriggerKind === 'floor'
          ? { maxDurationMs: 12000, maxExtensions: 2, maxTriggerCount: 4 }
          : { maxDurationMs: 16000, maxExtensions: 2, maxTriggerCount: 8 };

  return {
    oversized:
      durationMs > thresholds.maxDurationMs ||
      extensionCount > thresholds.maxExtensions ||
      triggerCount > thresholds.maxTriggerCount,
    multiEvent:
      extensionCount > thresholds.maxExtensions ||
      triggerCount > thresholds.maxTriggerCount
  };
}

function isVisualCommitFrame(
  frame: ReplayCaptureFrame,
  triggerKind: string | undefined
): boolean {
  const listening = frame.listeningFrame;
  const visual = frame.visualTelemetry;

  switch (triggerKind) {
    case 'drop':
      return (
        visual.eventGlowBudget > 0.22 ||
        visual.temporalWindows.beatStrike > 0.24 ||
        visual.stageCueFamily === 'rupture' ||
        visual.stageShotClass === 'worldTakeover' ||
        listening.dropImpact > 0.42
      );
    case 'section':
      return (
        visual.eventGlowBudget > 0.18 ||
        visual.temporalWindows.barTurn > 0.18 ||
        visual.stageCueFamily === 'reveal' ||
        visual.stageShotClass === 'pressure' ||
        visual.stageShotClass === 'worldTakeover' ||
        listening.sectionChange > 0.34
      );
    case 'release':
      return (
        visual.temporalWindows.phraseResolve > 0.18 ||
        visual.temporalWindows.postBeatRelease > 0.18 ||
        visual.atmosphereResidue > 0.24 ||
        visual.stageCueFamily === 'release' ||
        visual.stageShotClass === 'aftermath' ||
        listening.releaseTail > 0.28
      );
    default:
      return false;
  }
}

function deriveEventTimingSummary(
  frames: ReplayCaptureFrame[],
  triggerKind: string | undefined,
  triggerTimestampMs: number | undefined
): EventTimingSummary {
  if (
    typeof triggerTimestampMs !== 'number' ||
    !Number.isFinite(triggerTimestampMs) ||
    frames.length === 0
  ) {
    return {
      disposition: 'unknown',
      latencyMs: null
    };
  }

  const timingWindow =
    triggerKind === 'release'
      ? { preMs: 900, postMs: 2200 }
      : triggerKind === 'section'
        ? { preMs: 700, postMs: 1800 }
        : triggerKind === 'drop'
          ? { preMs: 500, postMs: 1400 }
          : { preMs: 600, postMs: 1600 };
  const nearbyFrames = frames.filter(
    (frame) =>
      frame.timestampMs >= triggerTimestampMs - timingWindow.preMs &&
      frame.timestampMs <= triggerTimestampMs + timingWindow.postMs
  );

  if (nearbyFrames.length === 0) {
    return {
      disposition: 'unknown',
      latencyMs: null
    };
  }

  const prechargedCommit = [...nearbyFrames]
    .reverse()
    .find(
      (frame) =>
        frame.timestampMs < triggerTimestampMs && isVisualCommitFrame(frame, triggerKind)
    );

  if (prechargedCommit) {
    return {
      disposition: 'precharged',
      latencyMs: prechargedCommit.timestampMs - triggerTimestampMs
    };
  }

  const committedAfterTrigger = nearbyFrames.find(
    (frame) =>
      frame.timestampMs >= triggerTimestampMs && isVisualCommitFrame(frame, triggerKind)
  );

  if (!committedAfterTrigger) {
    return {
      disposition: 'unknown',
      latencyMs: null
    };
  }

  const latencyMs = committedAfterTrigger.timestampMs - triggerTimestampMs;

  return {
    disposition: latencyMs > 220 ? 'lagging' : 'aligned',
    latencyMs
  };
}

function buildMetricWindowSummary(values: number[]): ReplayMetricWindowSummary {
  if (values.length === 0) {
    return {
      start: 0,
      end: 0,
      min: 0,
      max: 0
    };
  }

  return {
    start: values[0] ?? 0,
    end: values[values.length - 1] ?? 0,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

const STAGE_CUE_FAMILY_KEYS: StageCueFamily[] = [
  'brood',
  'gather',
  'reveal',
  'rupture',
  'release',
  'haunt',
  'reset'
];
const STAGE_WORLD_MODE_KEYS: StageWorldMode[] = [
  'hold',
  'aperture-cage',
  'fan-sweep',
  'cathedral-rise',
  'collapse-well',
  'ghost-chamber',
  'field-bloom'
];
const ATMOSPHERE_MATTER_STATE_KEYS: AtmosphereMatterState[] = [
  'gas',
  'liquid',
  'plasma',
  'crystal'
];
const STAGE_SHOT_CLASS_KEYS: StageShotClass[] = [
  'anchor',
  'pressure',
  'rupture',
  'worldTakeover',
  'aftermath',
  'isolate'
];
const PALETTE_STATE_KEYS: PaletteState[] = [
  'void-cyan',
  'tron-blue',
  'acid-lime',
  'solar-magenta',
  'ghost-white'
];
const SHOW_ACT_KEYS: ShowAct[] = [
  'void-chamber',
  'laser-bloom',
  'matrix-storm',
  'eclipse-rupture',
  'ghost-afterimage'
];

type AxisTracker = {
  min: number;
  max: number;
  sum: number;
  sumSquares: number;
  samples: number;
};

function createAxisTracker(): AxisTracker {
  return {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY,
    sum: 0,
    sumSquares: 0,
    samples: 0
  };
}

function updateAxisTracker(tracker: AxisTracker, value: number | undefined): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return;
  }

  tracker.min = Math.min(tracker.min, value);
  tracker.max = Math.max(tracker.max, value);
  tracker.sum += value;
  tracker.sumSquares += value * value;
  tracker.samples += 1;
}

function axisRange(tracker: AxisTracker): number {
  return tracker.samples > 0 ? tracker.max - tracker.min : 0;
}

function axisVariance(tracker: AxisTracker): number {
  if (tracker.samples <= 0) {
    return 0;
  }

  const mean = tracker.sum / tracker.samples;
  return Math.max(0, tracker.sumSquares / tracker.samples - mean * mean);
}

function incrementNestedCounter<TOuter extends string, TInner extends string>(
  map: Map<TOuter, Map<TInner, number>>,
  outer: TOuter,
  inner: TInner
): void {
  const nested = map.get(outer) ?? new Map<TInner, number>();
  nested.set(inner, (nested.get(inner) ?? 0) + 1);
  map.set(outer, nested);
}

function buildNestedSpread<TOuter extends string, TInner extends string>(
  outerKeys: readonly TOuter[],
  innerKeys: readonly TInner[],
  counts: Map<TOuter, Map<TInner, number>>
): Record<TOuter, Record<TInner, number>> {
  return Object.fromEntries(
    outerKeys.map((outer) => {
      const nested = counts.get(outer);
      const outerTotal =
        nested ? [...nested.values()].reduce((sum, count) => sum + count, 0) : 0;

      return [
        outer,
        Object.fromEntries(
          innerKeys.map((inner) => [
            inner,
            outerTotal > 0 ? (nested?.get(inner) ?? 0) / outerTotal : 0
          ])
        ) as Record<TInner, number>
      ];
    })
  ) as Record<TOuter, Record<TInner, number>>;
}

function entropyFromSpread(record: Record<string, number>): number {
  return Object.values(record)
    .filter((value) => value > 0)
    .reduce((sum, value) => sum - value * Math.log2(value), 0);
}

function longestRunDurationMs(
  frames: ReplayCaptureFrame[],
  selector: (frame: ReplayCaptureFrame) => string | undefined
): number {
  let bestStart = 0;
  let bestEnd = 0;
  let currentValue: string | null = null;
  let currentStart = 0;
  let currentEnd = 0;

  for (const frame of frames) {
    const value = selector(frame) ?? 'unknown';
    const timestampMs = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;

    if (currentValue === value) {
      currentEnd = timestampMs;
      continue;
    }

    if (currentValue !== null && currentEnd - currentStart > bestEnd - bestStart) {
      bestStart = currentStart;
      bestEnd = currentEnd;
    }

    currentValue = value;
    currentStart = timestampMs;
    currentEnd = timestampMs;
  }

  if (currentValue !== null && currentEnd - currentStart > bestEnd - bestStart) {
    bestStart = currentStart;
    bestEnd = currentEnd;
  }

  return Math.max(0, bestEnd - bestStart);
}

function normalizeReplayCaptureFrameSequence(
  frames: ReplayCaptureFrame[],
  triggerTimestampMs?: number
): ReplayCaptureFrame[] {
  if (frames.length <= 1) {
    return frames;
  }

  const breakIndices: number[] = [];

  for (let index = 1; index < frames.length; index += 1) {
    if (frames[index]!.timestampMs < frames[index - 1]!.timestampMs) {
      breakIndices.push(index);
    }
  }

  if (breakIndices.length === 0) {
    return frames;
  }

  const segments: ReplayCaptureFrame[][] = [];
  let startIndex = 0;

  for (const breakIndex of breakIndices) {
    segments.push(frames.slice(startIndex, breakIndex));
    startIndex = breakIndex;
  }

  segments.push(frames.slice(startIndex));

  const chooseSegment = () => {
    if (typeof triggerTimestampMs === 'number') {
      const ranked = segments
        .map((segment, index) => {
          const startMs = segment[0]!.timestampMs;
          const endMs = segment[segment.length - 1]!.timestampMs;
          const triggerDistance =
            triggerTimestampMs < startMs
              ? startMs - triggerTimestampMs
              : triggerTimestampMs > endMs
                ? triggerTimestampMs - endMs
                : 0;

          return {
            index,
            segment,
            triggerDistance,
            endMs
          };
        })
        .sort((left, right) => {
          if (left.triggerDistance !== right.triggerDistance) {
            return left.triggerDistance - right.triggerDistance;
          }

          if (left.segment.length !== right.segment.length) {
            return right.segment.length - left.segment.length;
          }

          return right.endMs - left.endMs;
        });

      return ranked[0]?.segment ?? frames;
    }

    return (
      [...segments].sort((left, right) => {
        if (left.length !== right.length) {
          return right.length - left.length;
        }

        return (
          (right[right.length - 1]?.timestampMs ?? 0) -
          (left[left.length - 1]?.timestampMs ?? 0)
        );
      })[0] ?? frames
    );
  };

  return chooseSegment();
}

function incrementReasonCount(
  counts: Map<string, number>,
  value: string | undefined
): void {
  const normalizedValue = value?.trim() || 'unspecified';
  counts.set(normalizedValue, (counts.get(normalizedValue) ?? 0) + 1);
}

function summarizeDecisionBucket(
  frames: ReplayCaptureFrame[],
  selector: (frame: ReplayCaptureFrame) => string
): ReplayDecisionBucketSummary {
  const reasonCounts = new Map<string, number>();
  let transitionCount = 0;
  let previousValue: string | null = null;

  for (const frame of frames) {
    const value = selector(frame).trim() || 'unspecified';
    incrementReasonCount(reasonCounts, value);
    if (previousValue !== null && previousValue !== value) {
      transitionCount += 1;
    }
    previousValue = value;
  }

  const topReasons = [...reasonCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([value, count]) => ({ value, count }));

  return {
    dominantReason: topReasons[0]?.value ?? null,
    transitionCount,
    topReasons
  };
}

function summarizeDecisionReasons(
  frames: ReplayCaptureFrame[]
): ReplayDecisionSummary {
  return {
    state: summarizeDecisionBucket(frames, (frame) => frame.diagnostics.stateReason),
    showState: summarizeDecisionBucket(
      frames,
      (frame) => frame.diagnostics.showStateReason
    ),
    moment: summarizeDecisionBucket(frames, (frame) => frame.diagnostics.momentReason),
    conductor: summarizeDecisionBucket(
      frames,
      (frame) => frame.diagnostics.conductorReason
    )
  };
}

function summarizeInputDrift(
  frames: ReplayCaptureFrame[]
): ReplayInputDriftSummary {
  const noiseFloor = frames.map((frame) => frame.diagnostics.noiseFloor);
  const adaptiveCeiling = frames.map(
    (frame) => frame.diagnostics.adaptiveCeiling
  );
  const silenceGate = frames.map((frame) => frame.diagnostics.silenceGate);
  const rawRms = frames.map((frame) => frame.diagnostics.rawRms);
  const rawPeak = frames.map((frame) => frame.diagnostics.rawPeak);
  const roomMusicFloorFrames = frames.filter(
    (frame) => frame.diagnostics.roomMusicFloorActive
  ).length;

  return {
    noiseFloor: buildMetricWindowSummary(noiseFloor),
    adaptiveCeiling: buildMetricWindowSummary(adaptiveCeiling),
    silenceGate: buildMetricWindowSummary(silenceGate),
    rawRms: buildMetricWindowSummary(rawRms),
    rawPeak: buildMetricWindowSummary(rawPeak),
    roomMusicFloorActiveRate:
      frames.length > 0 ? roomMusicFloorFrames / frames.length : 0
  };
}

function resolveSourceProvenanceNote(
  audio: AudioDiagnostics,
  sourceMode: AudioDiagnostics['sourceMode'],
  sourceLabel: string
): string | undefined {
  const normalizedLabel = sourceLabel.toLowerCase();
  const looksLikeMic =
    normalizedLabel.includes('mic') || normalizedLabel.includes('microphone');
  const looksLikeSystem =
    normalizedLabel.includes('pc audio') ||
    normalizedLabel.includes('system audio') ||
    normalizedLabel.includes('display audio');

  if (sourceMode === 'system-audio' && looksLikeMic && !audio.displayAudioGranted) {
    return 'System-audio mode is active but the source label still looks like a microphone and no display-audio grant was recorded.';
  }

  if (sourceMode === 'room-mic' && audio.displayAudioGranted) {
    return 'Room-mic mode is active even though display-audio permission is present.';
  }

  if (sourceMode === 'system-audio' && !looksLikeSystem && audio.displayAudioGranted) {
    return 'Display audio was granted but the serialized source label does not clearly identify a system-audio path.';
  }

  return undefined;
}

function buildBootSummary(audio: AudioDiagnostics) {
  return {
    calibrationDurationMs: audio.calibrationDurationMs,
    calibrationSampleCount: audio.calibrationSampleCount,
    calibrationRmsPercentile20: audio.calibrationRmsPercentile20,
    calibrationPeakPercentile90: audio.calibrationPeakPercentile90,
    noiseFloor: audio.noiseFloor,
    minimumCeiling: audio.minimumCeiling,
    calibrationPeak: audio.calibrationPeak,
    adaptiveCeiling: audio.adaptiveCeiling
  };
}

function buildSourceSummary(
  audio: AudioDiagnostics,
  sourceMode: AudioDiagnostics['sourceMode'],
  sourceLabel: string
) {
  const provenanceNote = resolveSourceProvenanceNote(audio, sourceMode, sourceLabel);

  return {
    sourceMode,
    sourceLabel,
    selectedInputId: audio.selectedInputId,
    displayAudioGranted: audio.displayAudioGranted,
    displayTrackLabel: audio.displayTrackLabel,
    rawPathGranted: audio.rawPathGranted,
    provenanceMismatch: Boolean(provenanceNote),
    provenanceNote
  };
}

export function buildReplayCapture(
  frames: ReplayCaptureFrame[],
  audio: AudioDiagnostics,
  renderer: RendererDiagnostics,
  controls: UserControlState,
  options?: BuildReplayCaptureOptions
): ReplayCapture {
  const capturedAt = new Date();
  const sanitizedControls = sanitizeUserControlState(controls);
  const launchQuickStartProfileId =
    options?.launchQuickStartProfileId ?? undefined;
  const quickStartProfileId = options?.quickStartProfileId ?? undefined;
  const startedFromQuickStart = Boolean(launchQuickStartProfileId);
  const driftedFromLaunchQuickStart = Boolean(
    launchQuickStartProfileId &&
      quickStartProfileId &&
      launchQuickStartProfileId !== quickStartProfileId
  );
  const normalizedFrames = normalizeReplayCaptureFrameSequence(
    frames.map((frame) => ({
      timestampMs: frame.timestampMs,
      listeningFrame: cloneListeningFrame(frame.listeningFrame),
      analysisFrame: cloneAnalysisFrame(frame.analysisFrame),
      diagnostics: {
        ...frame.diagnostics,
        warnings: [...frame.diagnostics.warnings]
      },
      visualTelemetry: cloneVisualTelemetryFrame(
        frame.visualTelemetry ?? DEFAULT_VISUAL_TELEMETRY
      )
    })),
    options?.triggerTimestampMs
  );
  const visualSummary = summarizeVisualTelemetry(normalizedFrames);
  const durationMs =
    normalizedFrames.length > 1
      ? normalizedFrames[normalizedFrames.length - 1]!.timestampMs -
        normalizedFrames[0]!.timestampMs
      : 0;
  const eventTimingSummary = deriveEventTimingSummary(
    normalizedFrames,
    options?.triggerKind,
    options?.triggerTimestampMs
  );
  const qualityFlags = deriveCaptureQualityFlags({
    frames: normalizedFrames,
    renderer,
    launchQuickStartProfileId,
    quickStartProfileId,
    triggerKind: options?.triggerKind,
    durationMs,
    triggerCount: options?.triggerCount ?? 0,
    extensionCount: options?.extensionCount ?? 0,
    visualSummary
  });

  return {
    version: 2,
    metadata: {
      app: 'visulive',
      label: options?.label ?? `room-capture_${buildTimestampLabel(capturedAt)}`,
      captureMode: options?.captureMode ?? 'manual',
      capturedAt: capturedAt.toISOString(),
      sourceLabel: audio.deviceLabel || 'Unknown microphone',
      sourceMode: options?.sourceMode ?? audio.sourceMode,
      selectedInputId: audio.selectedInputId,
      rawPathGranted: audio.rawPathGranted,
      sampleRate: audio.sampleRate,
      rendererBackend: renderer.backend,
      qualityTier: renderer.qualityTier,
      controls: sanitizedControls,
      launchQuickStartProfileId,
      launchQuickStartProfileLabel:
        options?.launchQuickStartProfileLabel ?? undefined,
      quickStartProfileId,
      quickStartProfileLabel: options?.quickStartProfileLabel ?? undefined,
      triggerKind: options?.triggerKind,
      triggerReason: options?.triggerReason,
      triggerCount:
        typeof options?.triggerCount === 'number' ? options.triggerCount : undefined,
      extensionCount:
        typeof options?.extensionCount === 'number'
          ? options.extensionCount
          : undefined,
      triggerTimestampMs:
        typeof options?.triggerTimestampMs === 'number'
          ? options.triggerTimestampMs
          : undefined,
      startedFromQuickStart,
      driftedFromLaunchQuickStart,
      bootSummary: buildBootSummary(audio),
      sourceSummary: buildSourceSummary(
        audio,
        options?.sourceMode ?? audio.sourceMode,
        audio.deviceLabel || 'Unknown microphone'
      ),
      decisionSummary: summarizeDecisionReasons(normalizedFrames),
      inputDriftSummary: summarizeInputDrift(normalizedFrames),
      proofStills: options?.proofStills ?? undefined,
      visualSummary,
      qualityFlags,
      eventTimingDisposition: eventTimingSummary.disposition,
      eventLatencyMs: eventTimingSummary.latencyMs
    },
    frames: normalizedFrames
  };
}

export function formatReplayDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function summarizeVisualTelemetry(
  frames: ReplayCaptureFrame[]
): VisualTelemetrySummary {
  if (frames.length === 0) {
    return { ...DEFAULT_VISUAL_TELEMETRY_SUMMARY };
  }

  const qualityCounts = new Map<string, number>();
  const actCounts = new Map<ShowAct, number>();
  const paletteCounts = new Map<PaletteState, number>();
  const stageCueFamilyCounts = new Map<string, number>();
  const stageWorldModeCounts = new Map<StageWorldMode, number>();
  const atmosphereMatterStateCounts = new Map<AtmosphereMatterState, number>();
  const paletteByActCounts = new Map<ShowAct, Map<PaletteState, number>>();
  const paletteByFamilyCounts = new Map<StageCueFamily, Map<PaletteState, number>>();
  const shotByFamilyCounts = new Map<StageCueFamily, Map<StageShotClass, number>>();
  const worldModeByFamilyCounts = new Map<StageCueFamily, Map<StageWorldMode, number>>();
  const spendProfileCounts = new Map<string, number>();
  const stageRingAuthorityCounts = new Map<string, number>();
  const stageShotClassCounts = new Map<string, number>();
  const stageTransitionClassCounts = new Map<string, number>();
  const stageTempoCadenceModeCounts = new Map<string, number>();
  const showFamilyCounts = new Map<string, number>();
  const macroEventCounts = new Map<string, number>();
  const assetLayerTotals = Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  ) as Record<(typeof VISUAL_ASSET_LAYERS)[number], number>;
  const assetLayerPeaks = Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  ) as Record<(typeof VISUAL_ASSET_LAYERS)[number], number>;
  const assetLayerActiveFrames = Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  ) as Record<(typeof VISUAL_ASSET_LAYERS)[number], number>;
  let exposureSum = 0;
  let exposurePeak = 0;
  let bloomStrengthSum = 0;
  let bloomStrengthPeak = 0;
  let bloomThresholdSum = 0;
  let bloomRadiusSum = 0;
  let bloomRadiusPeak = 0;
  let afterImageDampSum = 0;
  let afterImageDampPeak = 0;
  let ambientGlowSum = 0;
  let ambientGlowPeak = 0;
  let eventGlowSum = 0;
  let eventGlowPeak = 0;
  let worldGlowSum = 0;
  let heroGlowSum = 0;
  let shellGlowSum = 0;
  let atmosphereGasSum = 0;
  let atmosphereLiquidSum = 0;
  let atmospherePlasmaSum = 0;
  let atmosphereCrystalSum = 0;
  let atmospherePressureSum = 0;
  let atmospherePressurePeak = 0;
  let atmosphereIonizationSum = 0;
  let atmosphereIonizationPeak = 0;
  let atmosphereResidueSum = 0;
  let atmosphereResiduePeak = 0;
  let atmosphereStructureRevealSum = 0;
  let atmosphereStructureRevealPeak = 0;
  let heroHueMin = Number.POSITIVE_INFINITY;
  let heroHueMax = Number.NEGATIVE_INFINITY;
  let worldHueMin = Number.POSITIVE_INFINITY;
  let worldHueMax = Number.NEGATIVE_INFINITY;
  let overbrightFrames = 0;
  let overbrightPeak = 0;
  let overbrightSamples = 0;
  let heroScaleSum = 0;
  let heroScalePeak = 0;
  let heroScaleSamples = 0;
  let heroScreenXSum = 0;
  let heroScreenYSum = 0;
  let heroScreenSamples = 0;
  let ringAuthoritySum = 0;
  let ringAuthoritySamples = 0;
  let stageExposureCeilingSum = 0;
  let stageBloomCeilingSum = 0;
  let stageWashoutSuppressionSum = 0;
  let stageCeilingSamples = 0;
  let stageHeroScaleMinSum = 0;
  let stageHeroScaleMaxSum = 0;
  let stageHeroScaleSamples = 0;
  let stageCompositionSafetySum = 0;
  let stageCompositionSafetySamples = 0;
  let compositionSafetyFrames = 0;
  let compositionSafetySamples = 0;
  let heroCoverageSum = 0;
  let heroCoveragePeak = 0;
  let heroCoverageSamples = 0;
  let heroOffCenterPenaltySum = 0;
  let heroOffCenterPenaltyPeak = 0;
  let heroOffCenterPenaltySamples = 0;
  let heroDepthPenaltySum = 0;
  let heroDepthPenaltyPeak = 0;
  let heroDepthPenaltySamples = 0;
  let chamberPresenceSum = 0;
  let chamberPresenceSamples = 0;
  let frameHierarchySum = 0;
  let frameHierarchySamples = 0;
  let ringBeltPersistenceSum = 0;
  let ringBeltPersistencePeak = 0;
  let ringBeltPersistenceSamples = 0;
  let wirefieldDensitySum = 0;
  let wirefieldDensityPeak = 0;
  let wirefieldDensitySamples = 0;
  let worldDominanceDeliveredSum = 0;
  let worldDominanceDeliveredSamples = 0;
  let qualityTransitionCount = 0;
  let firstQualityDowngradeMs: number | undefined;
  let previousQualityTier: string | null = null;
  let heroOverreachFallbackFrames = 0;
  let ringOverdrawFallbackFrames = 0;
  let overbrightFallbackFrames = 0;
  let washoutFallbackFrames = 0;
  let fallbackSamples = 0;
  const heroTranslateXTracker = createAxisTracker();
  const heroTranslateYTracker = createAxisTracker();
  const heroTranslateZTracker = createAxisTracker();
  const heroPitchTracker = createAxisTracker();
  const heroYawTracker = createAxisTracker();
  const heroRollTracker = createAxisTracker();
  const chamberTranslateXTracker = createAxisTracker();
  const chamberTranslateYTracker = createAxisTracker();
  const chamberTranslateZTracker = createAxisTracker();
  const chamberPitchTracker = createAxisTracker();
  const chamberYawTracker = createAxisTracker();
  const chamberRollTracker = createAxisTracker();
  const cameraTranslateXTracker = createAxisTracker();
  const cameraTranslateYTracker = createAxisTracker();
  const cameraTranslateZTracker = createAxisTracker();
  const cameraPitchTracker = createAxisTracker();
  const cameraYawTracker = createAxisTracker();
  const cameraRollTracker = createAxisTracker();
  const temporalSums = {
    preBeatLift: 0,
    beatStrike: 0,
    postBeatRelease: 0,
    interBeatFloat: 0,
    barTurn: 0,
    phraseResolve: 0
  };

  for (const frame of frames) {
    const telemetry = frame.visualTelemetry ?? DEFAULT_VISUAL_TELEMETRY;

    qualityCounts.set(
      telemetry.qualityTier,
      (qualityCounts.get(telemetry.qualityTier) ?? 0) + 1
    );
    exposureSum += telemetry.exposure;
    exposurePeak = Math.max(exposurePeak, telemetry.exposure);
    bloomStrengthSum += telemetry.bloomStrength;
    bloomStrengthPeak = Math.max(bloomStrengthPeak, telemetry.bloomStrength);
    bloomThresholdSum += telemetry.bloomThreshold;
    const bloomRadius = telemetry.bloomRadius ?? DEFAULT_VISUAL_TELEMETRY.bloomRadius;
    bloomRadiusSum += bloomRadius;
    bloomRadiusPeak = Math.max(bloomRadiusPeak, bloomRadius);
    const afterImageDamp =
      telemetry.afterImageDamp ?? DEFAULT_VISUAL_TELEMETRY.afterImageDamp ?? 0.78;
    afterImageDampSum += afterImageDamp;
    afterImageDampPeak = Math.max(afterImageDampPeak, afterImageDamp);
    const atmosphereMatterState =
      telemetry.atmosphereMatterState ?? DEFAULT_VISUAL_TELEMETRY.atmosphereMatterState;
    atmosphereMatterStateCounts.set(
      atmosphereMatterState,
      (atmosphereMatterStateCounts.get(atmosphereMatterState) ?? 0) + 1
    );
    const atmosphereGas =
      telemetry.atmosphereGas ?? DEFAULT_VISUAL_TELEMETRY.atmosphereGas;
    const atmosphereLiquid =
      telemetry.atmosphereLiquid ?? DEFAULT_VISUAL_TELEMETRY.atmosphereLiquid;
    const atmospherePlasma =
      telemetry.atmospherePlasma ?? DEFAULT_VISUAL_TELEMETRY.atmospherePlasma;
    const atmosphereCrystal =
      telemetry.atmosphereCrystal ?? DEFAULT_VISUAL_TELEMETRY.atmosphereCrystal;
    const atmospherePressure =
      telemetry.atmospherePressure ?? DEFAULT_VISUAL_TELEMETRY.atmospherePressure;
    const atmosphereIonization =
      telemetry.atmosphereIonization ?? DEFAULT_VISUAL_TELEMETRY.atmosphereIonization;
    const atmosphereResidue =
      telemetry.atmosphereResidue ?? DEFAULT_VISUAL_TELEMETRY.atmosphereResidue;
    const atmosphereStructureReveal =
      telemetry.atmosphereStructureReveal ??
      DEFAULT_VISUAL_TELEMETRY.atmosphereStructureReveal;
    atmosphereGasSum += atmosphereGas;
    atmosphereLiquidSum += atmosphereLiquid;
    atmospherePlasmaSum += atmospherePlasma;
    atmosphereCrystalSum += atmosphereCrystal;
    atmospherePressureSum += atmospherePressure;
    atmospherePressurePeak = Math.max(atmospherePressurePeak, atmospherePressure);
    atmosphereIonizationSum += atmosphereIonization;
    atmosphereIonizationPeak = Math.max(
      atmosphereIonizationPeak,
      atmosphereIonization
    );
    atmosphereResidueSum += atmosphereResidue;
    atmosphereResiduePeak = Math.max(atmosphereResiduePeak, atmosphereResidue);
    atmosphereStructureRevealSum += atmosphereStructureReveal;
    atmosphereStructureRevealPeak = Math.max(
      atmosphereStructureRevealPeak,
      atmosphereStructureReveal
    );
    actCounts.set(
      telemetry.activeAct,
      (actCounts.get(telemetry.activeAct) ?? 0) + 1
    );
    paletteCounts.set(
      telemetry.paletteState,
      (paletteCounts.get(telemetry.paletteState) ?? 0) + 1
    );
    incrementNestedCounter(
      paletteByActCounts,
      telemetry.activeAct,
      telemetry.paletteState
    );
    showFamilyCounts.set(
      telemetry.showFamily,
      (showFamilyCounts.get(telemetry.showFamily) ?? 0) + 1
    );
    const stageCueFamily =
      telemetry.stageCueFamily ?? DEFAULT_VISUAL_TELEMETRY.stageCueFamily ?? 'brood';
    stageCueFamilyCounts.set(
      stageCueFamily,
      (stageCueFamilyCounts.get(stageCueFamily) ?? 0) + 1
    );
    incrementNestedCounter(
      paletteByFamilyCounts,
      stageCueFamily,
      telemetry.paletteState
    );
    stageWorldModeCounts.set(
      telemetry.stageWorldMode ?? DEFAULT_VISUAL_TELEMETRY.stageWorldMode ?? 'hold',
      (stageWorldModeCounts.get(
        telemetry.stageWorldMode ?? DEFAULT_VISUAL_TELEMETRY.stageWorldMode ?? 'hold'
      ) ?? 0) + 1
    );
    if (telemetry.stageWorldMode) {
      incrementNestedCounter(worldModeByFamilyCounts, stageCueFamily, telemetry.stageWorldMode);
    }
    if (
      telemetry.stageSpendProfile === 'withheld' ||
      telemetry.stageSpendProfile === 'earned' ||
      telemetry.stageSpendProfile === 'peak'
    ) {
      spendProfileCounts.set(
        telemetry.stageSpendProfile,
        (spendProfileCounts.get(telemetry.stageSpendProfile) ?? 0) + 1
      );
    }
    if (
      telemetry.stageRingAuthority === 'background-scaffold' ||
      telemetry.stageRingAuthority === 'framing-architecture' ||
      telemetry.stageRingAuthority === 'event-platform'
    ) {
      stageRingAuthorityCounts.set(
        telemetry.stageRingAuthority,
        (stageRingAuthorityCounts.get(telemetry.stageRingAuthority) ?? 0) + 1
      );
    }
    if (
      telemetry.stageShotClass === 'anchor' ||
      telemetry.stageShotClass === 'pressure' ||
      telemetry.stageShotClass === 'rupture' ||
      telemetry.stageShotClass === 'worldTakeover' ||
      telemetry.stageShotClass === 'aftermath' ||
      telemetry.stageShotClass === 'isolate'
    ) {
      stageShotClassCounts.set(
        telemetry.stageShotClass,
        (stageShotClassCounts.get(telemetry.stageShotClass) ?? 0) + 1
      );
      incrementNestedCounter(shotByFamilyCounts, stageCueFamily, telemetry.stageShotClass);
    }
    if (
      telemetry.stageTransitionClass === 'hold' ||
      telemetry.stageTransitionClass === 'wipe' ||
      telemetry.stageTransitionClass === 'collapse' ||
      telemetry.stageTransitionClass === 'iris' ||
      telemetry.stageTransitionClass === 'blackoutCut' ||
      telemetry.stageTransitionClass === 'residueDissolve' ||
      telemetry.stageTransitionClass === 'vectorHandoff'
    ) {
      stageTransitionClassCounts.set(
        telemetry.stageTransitionClass,
        (stageTransitionClassCounts.get(telemetry.stageTransitionClass) ?? 0) + 1
      );
    }
    if (
      telemetry.stageTempoCadenceMode === 'float' ||
      telemetry.stageTempoCadenceMode === 'metered' ||
      telemetry.stageTempoCadenceMode === 'driving' ||
      telemetry.stageTempoCadenceMode === 'surge' ||
      telemetry.stageTempoCadenceMode === 'aftermath'
    ) {
      stageTempoCadenceModeCounts.set(
        telemetry.stageTempoCadenceMode,
        (stageTempoCadenceModeCounts.get(telemetry.stageTempoCadenceMode) ?? 0) + 1
      );
    }
    for (const macroEvent of telemetry.macroEventsActive ?? []) {
      macroEventCounts.set(
        macroEvent,
        (macroEventCounts.get(macroEvent) ?? 0) + 1
      );
    }
    ambientGlowSum += telemetry.ambientGlowBudget;
    ambientGlowPeak = Math.max(ambientGlowPeak, telemetry.ambientGlowBudget);
    eventGlowSum += telemetry.eventGlowBudget;
    eventGlowPeak = Math.max(eventGlowPeak, telemetry.eventGlowBudget);
    worldGlowSum += telemetry.worldGlowSpend;
    heroGlowSum += telemetry.heroGlowSpend;
    shellGlowSum += telemetry.shellGlowSpend;
    heroHueMin = Math.min(heroHueMin, telemetry.heroHue);
    heroHueMax = Math.max(heroHueMax, telemetry.heroHue);
    worldHueMin = Math.min(worldHueMin, telemetry.worldHue);
    worldHueMax = Math.max(worldHueMax, telemetry.worldHue);
    if (typeof telemetry.overbright === 'number') {
      overbrightSamples += 1;
      overbrightPeak = Math.max(overbrightPeak, telemetry.overbright);
      if (telemetry.overbright > 0.08) {
        overbrightFrames += 1;
      }
    }
    if (typeof telemetry.heroScale === 'number') {
      heroScaleSamples += 1;
      heroScaleSum += telemetry.heroScale;
      heroScalePeak = Math.max(heroScalePeak, telemetry.heroScale);
    }
    if (
      typeof telemetry.heroScreenX === 'number' &&
      typeof telemetry.heroScreenY === 'number'
    ) {
      heroScreenSamples += 1;
      heroScreenXSum += telemetry.heroScreenX;
      heroScreenYSum += telemetry.heroScreenY;
    }
    if (typeof telemetry.ringAuthority === 'number') {
      ringAuthoritySamples += 1;
      ringAuthoritySum += telemetry.ringAuthority;
    }
    if (
      typeof telemetry.stageExposureCeiling === 'number' &&
      typeof telemetry.stageBloomCeiling === 'number' &&
      typeof telemetry.stageWashoutSuppression === 'number'
    ) {
      stageCeilingSamples += 1;
      stageExposureCeilingSum += telemetry.stageExposureCeiling;
      stageBloomCeilingSum += telemetry.stageBloomCeiling;
      stageWashoutSuppressionSum += telemetry.stageWashoutSuppression;
    }
    if (
      typeof telemetry.stageHeroScaleMin === 'number' &&
      typeof telemetry.stageHeroScaleMax === 'number'
    ) {
      stageHeroScaleSamples += 1;
      stageHeroScaleMinSum += telemetry.stageHeroScaleMin;
      stageHeroScaleMaxSum += telemetry.stageHeroScaleMax;
    }
    if (typeof telemetry.stageCompositionSafety === 'number') {
      stageCompositionSafetySamples += 1;
      stageCompositionSafetySum += telemetry.stageCompositionSafety;
    }
    if (typeof telemetry.compositionSafetyFlag === 'boolean') {
      compositionSafetySamples += 1;
      if (telemetry.compositionSafetyFlag) {
        compositionSafetyFrames += 1;
      }
    }
    if (typeof telemetry.heroCoverageEstimate === 'number') {
      heroCoverageSamples += 1;
      heroCoverageSum += telemetry.heroCoverageEstimate;
      heroCoveragePeak = Math.max(heroCoveragePeak, telemetry.heroCoverageEstimate);
    }
    if (typeof telemetry.heroOffCenterPenalty === 'number') {
      heroOffCenterPenaltySamples += 1;
      heroOffCenterPenaltySum += telemetry.heroOffCenterPenalty;
      heroOffCenterPenaltyPeak = Math.max(
        heroOffCenterPenaltyPeak,
        telemetry.heroOffCenterPenalty
      );
    }
    if (typeof telemetry.heroDepthPenalty === 'number') {
      heroDepthPenaltySamples += 1;
      heroDepthPenaltySum += telemetry.heroDepthPenalty;
      heroDepthPenaltyPeak = Math.max(heroDepthPenaltyPeak, telemetry.heroDepthPenalty);
    }
    if (typeof telemetry.chamberPresenceScore === 'number') {
      chamberPresenceSamples += 1;
      chamberPresenceSum += telemetry.chamberPresenceScore;
    }
    if (typeof telemetry.frameHierarchyScore === 'number') {
      frameHierarchySamples += 1;
      frameHierarchySum += telemetry.frameHierarchyScore;
    }
    if (typeof telemetry.ringBeltPersistence === 'number') {
      ringBeltPersistenceSamples += 1;
      ringBeltPersistenceSum += telemetry.ringBeltPersistence;
      ringBeltPersistencePeak = Math.max(
        ringBeltPersistencePeak,
        telemetry.ringBeltPersistence
      );
    }
    if (typeof telemetry.wirefieldDensityScore === 'number') {
      wirefieldDensitySamples += 1;
      wirefieldDensitySum += telemetry.wirefieldDensityScore;
      wirefieldDensityPeak = Math.max(wirefieldDensityPeak, telemetry.wirefieldDensityScore);
    }
    if (typeof telemetry.worldDominanceDelivered === 'number') {
      worldDominanceDeliveredSamples += 1;
      worldDominanceDeliveredSum += telemetry.worldDominanceDelivered;
    }
    updateAxisTracker(heroTranslateXTracker, telemetry.heroTranslateX);
    updateAxisTracker(heroTranslateYTracker, telemetry.heroTranslateY);
    updateAxisTracker(heroTranslateZTracker, telemetry.heroTranslateZ);
    updateAxisTracker(heroPitchTracker, telemetry.heroRotationPitch);
    updateAxisTracker(heroYawTracker, telemetry.heroRotationYaw);
    updateAxisTracker(heroRollTracker, telemetry.heroRotationRoll);
    updateAxisTracker(chamberTranslateXTracker, telemetry.chamberTranslateX);
    updateAxisTracker(chamberTranslateYTracker, telemetry.chamberTranslateY);
    updateAxisTracker(chamberTranslateZTracker, telemetry.chamberTranslateZ);
    updateAxisTracker(chamberPitchTracker, telemetry.chamberRotationPitch);
    updateAxisTracker(chamberYawTracker, telemetry.chamberRotationYaw);
    updateAxisTracker(chamberRollTracker, telemetry.chamberRotationRoll);
    updateAxisTracker(cameraTranslateXTracker, telemetry.cameraTranslateX);
    updateAxisTracker(cameraTranslateYTracker, telemetry.cameraTranslateY);
    updateAxisTracker(cameraTranslateZTracker, telemetry.cameraTranslateZ);
    updateAxisTracker(cameraPitchTracker, telemetry.cameraRotationPitch);
    updateAxisTracker(cameraYawTracker, telemetry.cameraRotationYaw);
    updateAxisTracker(cameraRollTracker, telemetry.cameraRotationRoll);
    if (
      typeof telemetry.stageFallbackHeroOverreach === 'boolean' ||
      typeof telemetry.stageFallbackRingOverdraw === 'boolean' ||
      typeof telemetry.stageFallbackOverbrightRisk === 'boolean' ||
      typeof telemetry.stageFallbackWashoutRisk === 'boolean'
    ) {
      fallbackSamples += 1;
      if (telemetry.stageFallbackHeroOverreach) {
        heroOverreachFallbackFrames += 1;
      }
      if (telemetry.stageFallbackRingOverdraw) {
        ringOverdrawFallbackFrames += 1;
      }
      if (telemetry.stageFallbackOverbrightRisk) {
        overbrightFallbackFrames += 1;
      }
      if (telemetry.stageFallbackWashoutRisk) {
        washoutFallbackFrames += 1;
      }
    }
    for (const layer of VISUAL_ASSET_LAYERS) {
      const activity = Math.max(0, telemetry.assetLayerActivity[layer] ?? 0);
      assetLayerTotals[layer] += activity;
      assetLayerPeaks[layer] = Math.max(assetLayerPeaks[layer], activity);
      if (activity > 0.01) {
        assetLayerActiveFrames[layer] += 1;
      }
    }
    if (previousQualityTier !== null && previousQualityTier !== telemetry.qualityTier) {
      qualityTransitionCount += 1;
      if (
        firstQualityDowngradeMs === undefined &&
        qualityTierRank(telemetry.qualityTier) < qualityTierRank(previousQualityTier)
      ) {
        firstQualityDowngradeMs = frame.timestampMs;
      }
    }
    previousQualityTier = telemetry.qualityTier;
    temporalSums.preBeatLift += telemetry.temporalWindows.preBeatLift;
    temporalSums.beatStrike += telemetry.temporalWindows.beatStrike;
    temporalSums.postBeatRelease += telemetry.temporalWindows.postBeatRelease;
    temporalSums.interBeatFloat += telemetry.temporalWindows.interBeatFloat;
    temporalSums.barTurn += telemetry.temporalWindows.barTurn;
    temporalSums.phraseResolve += telemetry.temporalWindows.phraseResolve;
  }

  const dominantQualityTier =
    [...qualityCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'unknown';
  const dominantAct =
    [...actCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'void-chamber';
  const dominantPaletteState =
    [...paletteCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'void-cyan';
  const dominantStageCueFamily =
    [...stageCueFamilyCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'brood';
  const dominantStageWorldMode =
    [...stageWorldModeCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'hold';
  const dominantSpendProfile =
    [...spendProfileCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    undefined;
  const dominantStageRingAuthority =
    [...stageRingAuthorityCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    undefined;
  const dominantStageShotClass =
    [...stageShotClassCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    undefined;
  const dominantStageTransitionClass =
    [...stageTransitionClassCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    undefined;
  const dominantStageTempoCadenceMode =
    [...stageTempoCadenceModeCounts.entries()]
      .sort((left, right) => right[1] - left[1])[0]?.[0] ?? undefined;
  const dominantAtmosphereMatterState =
    [...atmosphereMatterStateCounts.entries()].sort(
      (left, right) => right[1] - left[1]
    )[0]?.[0] ?? 'gas';
  const actSpread: VisualTelemetrySummary['actSpread'] = {
    'void-chamber': (actCounts.get('void-chamber') ?? 0) / frames.length,
    'laser-bloom': (actCounts.get('laser-bloom') ?? 0) / frames.length,
    'matrix-storm': (actCounts.get('matrix-storm') ?? 0) / frames.length,
    'eclipse-rupture': (actCounts.get('eclipse-rupture') ?? 0) / frames.length,
    'ghost-afterimage': (actCounts.get('ghost-afterimage') ?? 0) / frames.length
  };
  const paletteStateSpread: VisualTelemetrySummary['paletteStateSpread'] = {
    'void-cyan': (paletteCounts.get('void-cyan') ?? 0) / frames.length,
    'tron-blue': (paletteCounts.get('tron-blue') ?? 0) / frames.length,
    'acid-lime': (paletteCounts.get('acid-lime') ?? 0) / frames.length,
    'solar-magenta': (paletteCounts.get('solar-magenta') ?? 0) / frames.length,
    'ghost-white': (paletteCounts.get('ghost-white') ?? 0) / frames.length
  };
  const stageCueFamilySpread: VisualTelemetrySummary['stageCueFamilySpread'] = {
    brood: (stageCueFamilyCounts.get('brood') ?? 0) / frames.length,
    gather: (stageCueFamilyCounts.get('gather') ?? 0) / frames.length,
    reveal: (stageCueFamilyCounts.get('reveal') ?? 0) / frames.length,
    rupture: (stageCueFamilyCounts.get('rupture') ?? 0) / frames.length,
    release: (stageCueFamilyCounts.get('release') ?? 0) / frames.length,
    haunt: (stageCueFamilyCounts.get('haunt') ?? 0) / frames.length,
    reset: (stageCueFamilyCounts.get('reset') ?? 0) / frames.length
  };
  const stageWorldModeSpread: VisualTelemetrySummary['stageWorldModeSpread'] = {
    hold: (stageWorldModeCounts.get('hold') ?? 0) / frames.length,
    'aperture-cage': (stageWorldModeCounts.get('aperture-cage') ?? 0) / frames.length,
    'fan-sweep': (stageWorldModeCounts.get('fan-sweep') ?? 0) / frames.length,
    'cathedral-rise': (stageWorldModeCounts.get('cathedral-rise') ?? 0) / frames.length,
    'collapse-well': (stageWorldModeCounts.get('collapse-well') ?? 0) / frames.length,
    'ghost-chamber': (stageWorldModeCounts.get('ghost-chamber') ?? 0) / frames.length,
    'field-bloom': (stageWorldModeCounts.get('field-bloom') ?? 0) / frames.length
  };
  const stageShotClassSpread =
    stageShotClassCounts.size > 0
      ? (Object.fromEntries(
          [...stageShotClassCounts.entries()].map(([key, count]) => [
            key,
            count / frames.length
          ])
        ) as VisualTelemetrySummary['stageShotClassSpread'])
      : undefined;
  const paletteStateSpreadByAct = buildNestedSpread(
    SHOW_ACT_KEYS,
    PALETTE_STATE_KEYS,
    paletteByActCounts
  );
  const paletteStateSpreadByFamily = buildNestedSpread(
    STAGE_CUE_FAMILY_KEYS,
    PALETTE_STATE_KEYS,
    paletteByFamilyCounts
  );
  const stageWorldModeSpreadByFamily = buildNestedSpread(
    STAGE_CUE_FAMILY_KEYS,
    STAGE_WORLD_MODE_KEYS,
    worldModeByFamilyCounts
  );
  const stageShotClassSpreadByFamily = buildNestedSpread(
    STAGE_CUE_FAMILY_KEYS,
    STAGE_SHOT_CLASS_KEYS,
    shotByFamilyCounts
  );
  const actLongestRunMs = longestRunDurationMs(
    frames,
    (frame) => frame.visualTelemetry?.activeAct
  );
  const paletteStateLongestRunMs = longestRunDurationMs(
    frames,
    (frame) => frame.visualTelemetry?.paletteState
  );
  const stageShotClassLongestRunMs = longestRunDurationMs(
    frames,
    (frame) => frame.visualTelemetry?.stageShotClass
  );
  const stageWorldModeLongestRunMs = longestRunDurationMs(
    frames,
    (frame) => frame.visualTelemetry?.stageWorldMode
  );

  return {
    dominantQualityTier:
      dominantQualityTier === 'safe' ||
      dominantQualityTier === 'balanced' ||
      dominantQualityTier === 'premium'
        ? dominantQualityTier
        : 'unknown',
    exposureMean: exposureSum / frames.length,
    exposurePeak,
    bloomStrengthMean: bloomStrengthSum / frames.length,
    bloomStrengthPeak,
    bloomThresholdMean: bloomThresholdSum / frames.length,
    bloomRadiusMean: bloomRadiusSum / frames.length,
    bloomRadiusPeak,
    afterImageDampMean: afterImageDampSum / frames.length,
    afterImageDampPeak,
    ambientGlowMean: ambientGlowSum / frames.length,
    ambientGlowPeak,
    eventGlowMean: eventGlowSum / frames.length,
    eventGlowPeak,
    worldGlowMean: worldGlowSum / frames.length,
    heroGlowMean: heroGlowSum / frames.length,
    shellGlowMean: shellGlowSum / frames.length,
    atmosphereMatterStateSpread: {
      gas: (atmosphereMatterStateCounts.get('gas') ?? 0) / frames.length,
      liquid: (atmosphereMatterStateCounts.get('liquid') ?? 0) / frames.length,
      plasma: (atmosphereMatterStateCounts.get('plasma') ?? 0) / frames.length,
      crystal: (atmosphereMatterStateCounts.get('crystal') ?? 0) / frames.length
    },
    dominantAtmosphereMatterState,
    atmosphereGasMean: atmosphereGasSum / frames.length,
    atmosphereLiquidMean: atmosphereLiquidSum / frames.length,
    atmospherePlasmaMean: atmospherePlasmaSum / frames.length,
    atmosphereCrystalMean: atmosphereCrystalSum / frames.length,
    atmospherePressureMean: atmospherePressureSum / frames.length,
    atmospherePressurePeak,
    atmosphereIonizationMean: atmosphereIonizationSum / frames.length,
    atmosphereIonizationPeak,
    atmosphereResidueMean: atmosphereResidueSum / frames.length,
    atmosphereResiduePeak,
    atmosphereStructureRevealMean: atmosphereStructureRevealSum / frames.length,
    atmosphereStructureRevealPeak,
    dominantShowFamily:
      [...showFamilyCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'unknown',
    showFamilySpread: Object.fromEntries(
      [...showFamilyCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    actSpread,
    dominantAct,
    paletteStateSpread,
    paletteStateSpreadByAct,
    paletteStateSpreadByFamily,
    stageCueFamilySpread,
    dominantStageCueFamily:
      dominantStageCueFamily === 'brood' ||
      dominantStageCueFamily === 'gather' ||
      dominantStageCueFamily === 'reveal' ||
      dominantStageCueFamily === 'rupture' ||
      dominantStageCueFamily === 'release' ||
      dominantStageCueFamily === 'haunt' ||
      dominantStageCueFamily === 'reset'
        ? dominantStageCueFamily
        : 'brood',
    stageWorldModeSpread,
    stageWorldModeSpreadByFamily,
    dominantStageWorldMode:
      dominantStageWorldMode === 'hold' ||
      dominantStageWorldMode === 'aperture-cage' ||
      dominantStageWorldMode === 'fan-sweep' ||
      dominantStageWorldMode === 'cathedral-rise' ||
      dominantStageWorldMode === 'collapse-well' ||
      dominantStageWorldMode === 'ghost-chamber' ||
      dominantStageWorldMode === 'field-bloom'
        ? dominantStageWorldMode
        : 'hold',
    macroEventSpread: Object.fromEntries(
      [...macroEventCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantMacroEvent:
      [...macroEventCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'unknown',
    dominantPaletteState,
    heroHueRange:
      Number.isFinite(heroHueMin) && Number.isFinite(heroHueMax)
        ? heroHueMax - heroHueMin
        : 0,
    worldHueRange:
      Number.isFinite(worldHueMin) && Number.isFinite(worldHueMax)
        ? worldHueMax - worldHueMin
        : 0,
    temporalWindowMeans: {
      preBeatLift: temporalSums.preBeatLift / frames.length,
      beatStrike: temporalSums.beatStrike / frames.length,
      postBeatRelease: temporalSums.postBeatRelease / frames.length,
      interBeatFloat: temporalSums.interBeatFloat / frames.length,
      barTurn: temporalSums.barTurn / frames.length,
      phraseResolve: temporalSums.phraseResolve / frames.length
    },
    spendProfileSpread:
      spendProfileCounts.size > 0
        ? Object.fromEntries(
            [...spendProfileCounts.entries()].map(([key, count]) => [
              key,
              count / frames.length
            ])
          ) as VisualTelemetrySummary['spendProfileSpread']
        : undefined,
    dominantSpendProfile:
      dominantSpendProfile === 'withheld' ||
      dominantSpendProfile === 'earned' ||
      dominantSpendProfile === 'peak'
        ? dominantSpendProfile
        : undefined,
    overbrightRate:
      overbrightSamples > 0 ? overbrightFrames / overbrightSamples : undefined,
    overbrightPeak: overbrightSamples > 0 ? overbrightPeak : undefined,
    heroScaleMean: heroScaleSamples > 0 ? heroScaleSum / heroScaleSamples : undefined,
    heroScalePeak: heroScaleSamples > 0 ? heroScalePeak : undefined,
    heroScreenXMean:
      heroScreenSamples > 0 ? heroScreenXSum / heroScreenSamples : undefined,
    heroScreenYMean:
      heroScreenSamples > 0 ? heroScreenYSum / heroScreenSamples : undefined,
    ringAuthorityMean:
      ringAuthoritySamples > 0 ? ringAuthoritySum / ringAuthoritySamples : undefined,
    stageExposureCeilingMean:
      stageCeilingSamples > 0 ? stageExposureCeilingSum / stageCeilingSamples : undefined,
    stageBloomCeilingMean:
      stageCeilingSamples > 0 ? stageBloomCeilingSum / stageCeilingSamples : undefined,
    stageWashoutSuppressionMean:
      stageCeilingSamples > 0
        ? stageWashoutSuppressionSum / stageCeilingSamples
        : undefined,
    stageHeroScaleMinMean:
      stageHeroScaleSamples > 0
        ? stageHeroScaleMinSum / stageHeroScaleSamples
        : undefined,
    stageHeroScaleMaxMean:
      stageHeroScaleSamples > 0
        ? stageHeroScaleMaxSum / stageHeroScaleSamples
        : undefined,
    stageRingAuthoritySpread:
      stageRingAuthorityCounts.size > 0
        ? Object.fromEntries(
            [...stageRingAuthorityCounts.entries()].map(([key, count]) => [
              key,
              count / frames.length
            ])
          ) as VisualTelemetrySummary['stageRingAuthoritySpread']
        : undefined,
    dominantStageRingAuthority:
      dominantStageRingAuthority === 'background-scaffold' ||
      dominantStageRingAuthority === 'framing-architecture' ||
      dominantStageRingAuthority === 'event-platform'
        ? dominantStageRingAuthority
        : undefined,
    stageShotClassSpread,
    stageShotClassSpreadByFamily,
    dominantStageShotClass:
      dominantStageShotClass === 'anchor' ||
      dominantStageShotClass === 'pressure' ||
      dominantStageShotClass === 'rupture' ||
      dominantStageShotClass === 'worldTakeover' ||
      dominantStageShotClass === 'aftermath' ||
      dominantStageShotClass === 'isolate'
        ? dominantStageShotClass
        : undefined,
    stageTransitionClassSpread:
      stageTransitionClassCounts.size > 0
        ? Object.fromEntries(
            [...stageTransitionClassCounts.entries()].map(([key, count]) => [
              key,
              count / frames.length
            ])
          ) as VisualTelemetrySummary['stageTransitionClassSpread']
        : undefined,
    dominantStageTransitionClass:
      dominantStageTransitionClass === 'hold' ||
      dominantStageTransitionClass === 'wipe' ||
      dominantStageTransitionClass === 'collapse' ||
      dominantStageTransitionClass === 'iris' ||
      dominantStageTransitionClass === 'blackoutCut' ||
      dominantStageTransitionClass === 'residueDissolve' ||
      dominantStageTransitionClass === 'vectorHandoff'
        ? dominantStageTransitionClass
        : undefined,
    stageTempoCadenceModeSpread:
      stageTempoCadenceModeCounts.size > 0
        ? Object.fromEntries(
            [...stageTempoCadenceModeCounts.entries()].map(([key, count]) => [
              key,
              count / frames.length
            ])
          ) as VisualTelemetrySummary['stageTempoCadenceModeSpread']
        : undefined,
    dominantStageTempoCadenceMode:
      dominantStageTempoCadenceMode === 'float' ||
      dominantStageTempoCadenceMode === 'metered' ||
      dominantStageTempoCadenceMode === 'driving' ||
      dominantStageTempoCadenceMode === 'surge' ||
      dominantStageTempoCadenceMode === 'aftermath'
        ? dominantStageTempoCadenceMode
        : undefined,
    actEntropy: entropyFromSpread(actSpread),
    paletteEntropy: entropyFromSpread(paletteStateSpread),
    stageShotClassEntropy: entropyFromSpread(stageShotClassSpread ?? {}),
    stageWorldModeEntropy: entropyFromSpread(stageWorldModeSpread ?? {}),
    actLongestRunMs,
    paletteStateLongestRunMs,
    stageShotClassLongestRunMs,
    stageWorldModeLongestRunMs,
    stageCompositionSafetyMean:
      stageCompositionSafetySamples > 0
        ? stageCompositionSafetySum / stageCompositionSafetySamples
        : undefined,
    compositionSafetyRate:
      compositionSafetySamples > 0
        ? compositionSafetyFrames / compositionSafetySamples
        : undefined,
    heroCoverageMean:
      heroCoverageSamples > 0 ? heroCoverageSum / heroCoverageSamples : undefined,
    heroCoveragePeak: heroCoverageSamples > 0 ? heroCoveragePeak : undefined,
    heroOffCenterPenaltyMean:
      heroOffCenterPenaltySamples > 0
        ? heroOffCenterPenaltySum / heroOffCenterPenaltySamples
        : undefined,
    heroOffCenterPenaltyPeak:
      heroOffCenterPenaltySamples > 0 ? heroOffCenterPenaltyPeak : undefined,
    heroDepthPenaltyMean:
      heroDepthPenaltySamples > 0 ? heroDepthPenaltySum / heroDepthPenaltySamples : undefined,
    heroDepthPenaltyPeak:
      heroDepthPenaltySamples > 0 ? heroDepthPenaltyPeak : undefined,
    chamberPresenceMean:
      chamberPresenceSamples > 0 ? chamberPresenceSum / chamberPresenceSamples : undefined,
    frameHierarchyMean:
      frameHierarchySamples > 0 ? frameHierarchySum / frameHierarchySamples : undefined,
    ringBeltPersistenceMean:
      ringBeltPersistenceSamples > 0
        ? ringBeltPersistenceSum / ringBeltPersistenceSamples
        : undefined,
    ringBeltPersistencePeak:
      ringBeltPersistenceSamples > 0 ? ringBeltPersistencePeak : undefined,
    wirefieldDensityMean:
      wirefieldDensitySamples > 0 ? wirefieldDensitySum / wirefieldDensitySamples : undefined,
    wirefieldDensityPeak:
      wirefieldDensitySamples > 0 ? wirefieldDensityPeak : undefined,
    worldDominanceDeliveredMean:
      worldDominanceDeliveredSamples > 0
        ? worldDominanceDeliveredSum / worldDominanceDeliveredSamples
        : undefined,
    heroTravelRangeX: axisRange(heroTranslateXTracker),
    heroTravelRangeY: axisRange(heroTranslateYTracker),
    heroTravelRangeZ: axisRange(heroTranslateZTracker),
    heroRotationVariancePitch: axisVariance(heroPitchTracker),
    heroRotationVarianceYaw: axisVariance(heroYawTracker),
    heroRotationVarianceRoll: axisVariance(heroRollTracker),
    chamberTravelRangeX: axisRange(chamberTranslateXTracker),
    chamberTravelRangeY: axisRange(chamberTranslateYTracker),
    chamberTravelRangeZ: axisRange(chamberTranslateZTracker),
    chamberRotationVariancePitch: axisVariance(chamberPitchTracker),
    chamberRotationVarianceYaw: axisVariance(chamberYawTracker),
    chamberRotationVarianceRoll: axisVariance(chamberRollTracker),
    cameraTravelRangeX: axisRange(cameraTranslateXTracker),
    cameraTravelRangeY: axisRange(cameraTranslateYTracker),
    cameraTravelRangeZ: axisRange(cameraTranslateZTracker),
    cameraRotationVariancePitch: axisVariance(cameraPitchTracker),
    cameraRotationVarianceYaw: axisVariance(cameraYawTracker),
    cameraRotationVarianceRoll: axisVariance(cameraRollTracker),
    heroOverreachFallbackRate:
      fallbackSamples > 0 ? heroOverreachFallbackFrames / fallbackSamples : undefined,
    ringOverdrawFallbackRate:
      fallbackSamples > 0 ? ringOverdrawFallbackFrames / fallbackSamples : undefined,
    overbrightFallbackRate:
      fallbackSamples > 0 ? overbrightFallbackFrames / fallbackSamples : undefined,
    washoutFallbackRate:
      fallbackSamples > 0 ? washoutFallbackFrames / fallbackSamples : undefined,
    qualityTransitionCount,
    firstQualityDowngradeMs,
    assetLayerSummary: Object.fromEntries(
      VISUAL_ASSET_LAYERS.map((layer) => [
        layer,
        {
          mean: assetLayerTotals[layer] / frames.length,
          peak: assetLayerPeaks[layer],
          activeFrameRate: assetLayerActiveFrames[layer] / frames.length
        }
      ])
    ) as VisualTelemetrySummary['assetLayerSummary']
  };
}

function deriveCaptureQualityFlags(input: {
  frames: ReplayCaptureFrame[];
  renderer: RendererDiagnostics;
  launchQuickStartProfileId?: string;
  quickStartProfileId?: string;
  triggerKind?: string;
  durationMs: number;
  triggerCount: number;
  extensionCount: number;
  visualSummary: VisualTelemetrySummary;
}): CaptureQualityFlag[] {
  const flags = new Set<CaptureQualityFlag>();
  const peakDropImpact = Math.max(
    0,
    ...input.frames.map((frame) => frame.listeningFrame.dropImpact)
  );
  const peakReleaseTail = Math.max(
    0,
    ...input.frames.map((frame) => frame.listeningFrame.releaseTail)
  );

  if (
    (!input.launchQuickStartProfileId && !input.quickStartProfileId) ||
    (input.launchQuickStartProfileId &&
      input.quickStartProfileId &&
      input.quickStartProfileId !== input.launchQuickStartProfileId)
  ) {
    flags.add('manualCustom');
  }

  const windowJudgement = deriveCaptureWindowJudgement(
    input.triggerKind,
    input.durationMs,
    input.triggerCount,
    input.extensionCount
  );

  if (windowJudgement.oversized) {
    flags.add('oversizedWindow');
  }

  if (windowJudgement.multiEvent) {
    flags.add('multiEventWindow');
  }

  if (
    input.renderer.qualityTier === 'safe' ||
    input.visualSummary.dominantQualityTier === 'safe'
  ) {
    flags.add('safeTierActive');
  }

  if (input.visualSummary.ambientGlowMean > 0.16) {
    flags.add('highAmbientGlow');
  }

  if (
    input.visualSummary.heroHueRange < 0.12 &&
    input.visualSummary.worldHueRange < 0.08
  ) {
    flags.add('lowPaletteVariation');
  }

  if (input.triggerKind === 'drop' && peakDropImpact < 0.45) {
    flags.add('undercommittedDrop');
  }

  if (input.triggerKind === 'release' && peakReleaseTail < 0.3) {
    flags.add('weakPhraseRelease');
  }

  return [...flags];
}

export function parseReplayCapture(raw: string): ReplayCapture {
  const parsed = JSON.parse(raw) as unknown;

  if (
    !isObject(parsed) ||
    (parsed.version !== 1 && parsed.version !== 2) ||
    !Array.isArray(parsed.frames)
  ) {
    throw new Error('Invalid replay capture file.');
  }

  if (!isObject(parsed.metadata) || typeof parsed.metadata.label !== 'string') {
    throw new Error('Replay capture metadata is missing or malformed.');
  }

  const parsedVersion = parsed.version === 2 ? 2 : 1;

  const frames = normalizeReplayCaptureFrameSequence(
    parsed.frames
      .filter((frame): frame is Record<string, unknown> => isObject(frame))
      .map((frame) => {
        const listeningFrame = frame.listeningFrame;
        const analysisFrame = frame.analysisFrame;

        if (!isObject(listeningFrame) || !isObject(analysisFrame)) {
          throw new Error('Replay capture frame is malformed.');
        }

        const normalizedListeningFrame = cloneListeningFrame(
          listeningFrame as ListeningFrame
        );
        const normalizedVisualTelemetry = normalizeVisualTelemetryFrame(
          frame.visualTelemetry
        );

        if (
          !isObject(frame.visualTelemetry) ||
          typeof (frame.visualTelemetry as { activeAct?: unknown }).activeAct !==
            'string'
        ) {
          normalizedVisualTelemetry.activeAct = inferShowActFromListeningFrame(
            normalizedListeningFrame
          );
        }

        return {
          timestampMs:
            typeof frame.timestampMs === 'number'
              ? frame.timestampMs
              : typeof listeningFrame.timestampMs === 'number'
                ? listeningFrame.timestampMs
                : 0,
          listeningFrame: normalizedListeningFrame,
          analysisFrame: cloneAnalysisFrame(analysisFrame as AnalysisFrame),
          diagnostics: normalizeReplayFrameDiagnostics(frame.diagnostics),
          visualTelemetry: normalizedVisualTelemetry
        };
      }),
    typeof parsed.metadata.triggerTimestampMs === 'number'
      ? parsed.metadata.triggerTimestampMs
      : undefined
  );

  if (frames.length === 0) {
    throw new Error('Replay capture contains no frames.');
  }

  return {
    version: parsedVersion,
    metadata: {
      app: 'visulive',
      label: parsed.metadata.label,
      capturedAt:
        typeof parsed.metadata.capturedAt === 'string'
          ? parsed.metadata.capturedAt
          : new Date().toISOString(),
      captureMode:
        parsed.metadata.captureMode === 'auto' ? 'auto' : 'manual',
      sourceLabel:
        typeof parsed.metadata.sourceLabel === 'string'
          ? parsed.metadata.sourceLabel
          : 'Unknown microphone',
      sourceMode:
        parsed.metadata.sourceMode === 'system-audio' ||
        parsed.metadata.sourceMode === 'hybrid'
          ? parsed.metadata.sourceMode
          : 'room-mic',
      selectedInputId:
        typeof parsed.metadata.selectedInputId === 'string' ||
        parsed.metadata.selectedInputId === null
          ? parsed.metadata.selectedInputId
          : null,
      rawPathGranted: Boolean(parsed.metadata.rawPathGranted),
      sampleRate:
        typeof parsed.metadata.sampleRate === 'number'
          ? parsed.metadata.sampleRate
          : null,
      rendererBackend:
        typeof parsed.metadata.rendererBackend === 'string'
          ? parsed.metadata.rendererBackend
          : 'unknown',
      qualityTier:
        typeof parsed.metadata.qualityTier === 'string'
          ? parsed.metadata.qualityTier
          : 'unknown',
      controls: sanitizeUserControlState(
        isObject(parsed.metadata.controls)
          ? (parsed.metadata.controls as Partial<UserControlState>)
          : null
      ),
      launchQuickStartProfileId:
        typeof parsed.metadata.launchQuickStartProfileId === 'string'
          ? parsed.metadata.launchQuickStartProfileId
          : undefined,
      launchQuickStartProfileLabel:
        typeof parsed.metadata.launchQuickStartProfileLabel === 'string'
          ? parsed.metadata.launchQuickStartProfileLabel
          : undefined,
      quickStartProfileId:
        typeof parsed.metadata.quickStartProfileId === 'string'
          ? parsed.metadata.quickStartProfileId
          : undefined,
      quickStartProfileLabel:
        typeof parsed.metadata.quickStartProfileLabel === 'string'
          ? parsed.metadata.quickStartProfileLabel
          : undefined,
      triggerKind:
        typeof parsed.metadata.triggerKind === 'string'
          ? parsed.metadata.triggerKind
          : undefined,
      triggerReason:
        typeof parsed.metadata.triggerReason === 'string'
          ? parsed.metadata.triggerReason
          : undefined,
      triggerCount:
        typeof parsed.metadata.triggerCount === 'number'
          ? parsed.metadata.triggerCount
          : undefined,
      extensionCount:
        typeof parsed.metadata.extensionCount === 'number'
          ? parsed.metadata.extensionCount
          : undefined,
      triggerTimestampMs:
        typeof parsed.metadata.triggerTimestampMs === 'number'
          ? parsed.metadata.triggerTimestampMs
          : undefined,
      startedFromQuickStart:
        typeof parsed.metadata.startedFromQuickStart === 'boolean'
          ? parsed.metadata.startedFromQuickStart
          : undefined,
      driftedFromLaunchQuickStart:
        typeof parsed.metadata.driftedFromLaunchQuickStart === 'boolean'
          ? parsed.metadata.driftedFromLaunchQuickStart
          : undefined,
      bootSummary: normalizeReplayBootSummary(parsed.metadata.bootSummary),
      sourceSummary: normalizeReplaySourceSummary(parsed.metadata.sourceSummary),
      decisionSummary: normalizeReplayDecisionSummary(parsed.metadata.decisionSummary),
      inputDriftSummary: normalizeReplayInputDriftSummary(
        parsed.metadata.inputDriftSummary
      ),
      proofStills: normalizeReplayProofStillSummary(parsed.metadata.proofStills),
      visualSummary: normalizeVisualTelemetrySummary(parsed.metadata.visualSummary),
      qualityFlags: Array.isArray(parsed.metadata.qualityFlags)
        ? parsed.metadata.qualityFlags.filter(
          (flag): flag is CaptureQualityFlag => typeof flag === 'string'
          )
        : undefined,
      eventTimingDisposition:
        parsed.metadata.eventTimingDisposition === 'aligned' ||
        parsed.metadata.eventTimingDisposition === 'lagging' ||
        parsed.metadata.eventTimingDisposition === 'precharged' ||
        parsed.metadata.eventTimingDisposition === 'unknown'
          ? parsed.metadata.eventTimingDisposition
          : undefined,
      eventLatencyMs:
        typeof parsed.metadata.eventLatencyMs === 'number'
          ? parsed.metadata.eventLatencyMs
          : parsed.metadata.eventLatencyMs === null
            ? null
            : undefined
    },
    frames
  };
}

function normalizeReplayFrameDiagnostics(
  value: unknown
): ReplayFrameDiagnostics {
  const diagnostics =
    typeof value === 'object' && value !== null
      ? (value as Partial<ReplayFrameDiagnostics>)
      : null;

  return {
    humRejection:
      typeof diagnostics?.humRejection === 'number'
        ? diagnostics.humRejection
        : 0,
    musicTrend:
      typeof diagnostics?.musicTrend === 'number' ? diagnostics.musicTrend : 0,
    silenceGate:
      typeof diagnostics?.silenceGate === 'number'
        ? diagnostics.silenceGate
        : 0,
    beatIntervalMs:
      typeof diagnostics?.beatIntervalMs === 'number'
        ? diagnostics.beatIntervalMs
        : 0,
    rawRms: typeof diagnostics?.rawRms === 'number' ? diagnostics.rawRms : 0,
    rawPeak:
      typeof diagnostics?.rawPeak === 'number' ? diagnostics.rawPeak : 0,
    adaptiveCeiling:
      typeof diagnostics?.adaptiveCeiling === 'number'
        ? diagnostics.adaptiveCeiling
        : 0,
    noiseFloor:
      typeof diagnostics?.noiseFloor === 'number' ? diagnostics.noiseFloor : 0.02,
    minimumCeiling:
      typeof diagnostics?.minimumCeiling === 'number'
        ? diagnostics.minimumCeiling
        : 0.06,
    calibrationPeak:
      typeof diagnostics?.calibrationPeak === 'number'
        ? diagnostics.calibrationPeak
        : 0.06,
    spectrumLow:
      typeof diagnostics?.spectrumLow === 'number'
        ? diagnostics.spectrumLow
        : 0,
    spectrumMid:
      typeof diagnostics?.spectrumMid === 'number'
        ? diagnostics.spectrumMid
        : 0,
    spectrumHigh:
      typeof diagnostics?.spectrumHigh === 'number'
        ? diagnostics.spectrumHigh
        : 0,
    roomMusicFloorActive:
      typeof diagnostics?.roomMusicFloorActive === 'boolean'
        ? diagnostics.roomMusicFloorActive
        : false,
    roomMusicDrive:
      typeof diagnostics?.roomMusicDrive === 'number'
        ? diagnostics.roomMusicDrive
        : 0,
    aftermathEntryEvidence:
      typeof diagnostics?.aftermathEntryEvidence === 'number'
        ? diagnostics.aftermathEntryEvidence
        : 0,
    aftermathExitPressure:
      typeof diagnostics?.aftermathExitPressure === 'number'
        ? diagnostics.aftermathExitPressure
        : 0,
    stateReason:
      typeof diagnostics?.stateReason === 'string'
        ? diagnostics.stateReason
        : 'Replay frame diagnostics unavailable.',
    showStateReason:
      typeof diagnostics?.showStateReason === 'string'
        ? diagnostics.showStateReason
        : 'Replay frame diagnostics unavailable.',
    momentReason:
      typeof diagnostics?.momentReason === 'string'
        ? diagnostics.momentReason
        : 'Replay frame diagnostics unavailable.',
    conductorReason:
      typeof diagnostics?.conductorReason === 'string'
        ? diagnostics.conductorReason
        : 'Replay frame diagnostics unavailable.',
    warnings: Array.isArray(diagnostics?.warnings)
      ? diagnostics.warnings.filter(
          (warning): warning is string => typeof warning === 'string'
        )
      : []
  };
}

function normalizeVisualTelemetryFrame(value: unknown): VisualTelemetryFrame {
  const telemetry =
    typeof value === 'object' && value !== null
      ? (value as Partial<VisualTelemetryFrame>)
      : null;
  const rawPaletteState =
    typeof (telemetry as { paletteState?: unknown } | null)?.paletteState === 'string'
      ? (telemetry as { paletteState?: string }).paletteState
      : undefined;

  return {
    qualityTier:
      telemetry?.qualityTier === 'safe' ||
      telemetry?.qualityTier === 'balanced' ||
      telemetry?.qualityTier === 'premium'
        ? telemetry.qualityTier
        : 'unknown',
    exposure:
      typeof telemetry?.exposure === 'number'
        ? telemetry.exposure
        : DEFAULT_VISUAL_TELEMETRY.exposure,
    bloomStrength:
      typeof telemetry?.bloomStrength === 'number'
        ? telemetry.bloomStrength
        : DEFAULT_VISUAL_TELEMETRY.bloomStrength,
    bloomThreshold:
      typeof telemetry?.bloomThreshold === 'number'
        ? telemetry.bloomThreshold
        : DEFAULT_VISUAL_TELEMETRY.bloomThreshold,
    bloomRadius:
      typeof telemetry?.bloomRadius === 'number'
        ? telemetry.bloomRadius
        : DEFAULT_VISUAL_TELEMETRY.bloomRadius,
    ambientGlowBudget:
      typeof telemetry?.ambientGlowBudget === 'number'
        ? telemetry.ambientGlowBudget
        : DEFAULT_VISUAL_TELEMETRY.ambientGlowBudget,
    eventGlowBudget:
      typeof telemetry?.eventGlowBudget === 'number'
        ? telemetry.eventGlowBudget
        : DEFAULT_VISUAL_TELEMETRY.eventGlowBudget,
    worldGlowSpend:
      typeof telemetry?.worldGlowSpend === 'number'
        ? telemetry.worldGlowSpend
        : DEFAULT_VISUAL_TELEMETRY.worldGlowSpend,
    heroGlowSpend:
      typeof telemetry?.heroGlowSpend === 'number'
        ? telemetry.heroGlowSpend
        : DEFAULT_VISUAL_TELEMETRY.heroGlowSpend,
    shellGlowSpend:
      typeof telemetry?.shellGlowSpend === 'number'
        ? telemetry.shellGlowSpend
        : DEFAULT_VISUAL_TELEMETRY.shellGlowSpend,
    activeAct:
      telemetry?.activeAct === 'void-chamber' ||
      telemetry?.activeAct === 'laser-bloom' ||
      telemetry?.activeAct === 'matrix-storm' ||
      telemetry?.activeAct === 'eclipse-rupture' ||
      telemetry?.activeAct === 'ghost-afterimage'
        ? telemetry.activeAct
        : DEFAULT_VISUAL_TELEMETRY.activeAct,
    paletteState:
      rawPaletteState === 'ultraviolet'
        ? 'tron-blue'
        : rawPaletteState === 'void-cyan' ||
            rawPaletteState === 'tron-blue' ||
            rawPaletteState === 'acid-lime' ||
            rawPaletteState === 'solar-magenta' ||
            rawPaletteState === 'ghost-white'
          ? rawPaletteState
          : DEFAULT_VISUAL_TELEMETRY.paletteState,
    showFamily:
      typeof telemetry?.showFamily === 'string'
        ? telemetry.showFamily
        : DEFAULT_VISUAL_TELEMETRY.showFamily,
    macroEventsActive: Array.isArray(telemetry?.macroEventsActive)
      ? telemetry.macroEventsActive.filter(
          (event): event is string => typeof event === 'string'
        )
      : [],
    heroHue:
      typeof telemetry?.heroHue === 'number'
        ? telemetry.heroHue
        : DEFAULT_VISUAL_TELEMETRY.heroHue,
    worldHue:
      typeof telemetry?.worldHue === 'number'
        ? telemetry.worldHue
        : DEFAULT_VISUAL_TELEMETRY.worldHue,
    cueClass:
      telemetry?.cueClass === 'brood' ||
      telemetry?.cueClass === 'gather' ||
      telemetry?.cueClass === 'reveal' ||
      telemetry?.cueClass === 'rupture' ||
      telemetry?.cueClass === 'afterglow' ||
      telemetry?.cueClass === 'haunt'
        ? telemetry.cueClass
        : DEFAULT_VISUAL_TELEMETRY.cueClass,
    cueIntensity:
      typeof telemetry?.cueIntensity === 'number'
        ? telemetry.cueIntensity
        : DEFAULT_VISUAL_TELEMETRY.cueIntensity,
    cueAttack:
      typeof telemetry?.cueAttack === 'number'
        ? telemetry.cueAttack
        : DEFAULT_VISUAL_TELEMETRY.cueAttack,
    cueSustain:
      typeof telemetry?.cueSustain === 'number'
        ? telemetry.cueSustain
        : DEFAULT_VISUAL_TELEMETRY.cueSustain,
    cueDecay:
      typeof telemetry?.cueDecay === 'number'
        ? telemetry.cueDecay
        : DEFAULT_VISUAL_TELEMETRY.cueDecay,
    cueScreenWeight:
      typeof telemetry?.cueScreenWeight === 'number'
        ? telemetry.cueScreenWeight
        : DEFAULT_VISUAL_TELEMETRY.cueScreenWeight,
    cueResidueWeight:
      typeof telemetry?.cueResidueWeight === 'number'
        ? telemetry.cueResidueWeight
        : DEFAULT_VISUAL_TELEMETRY.cueResidueWeight,
    cueWorldWeight:
      typeof telemetry?.cueWorldWeight === 'number'
        ? telemetry.cueWorldWeight
        : DEFAULT_VISUAL_TELEMETRY.cueWorldWeight,
    cueHeroWeight:
      typeof telemetry?.cueHeroWeight === 'number'
        ? telemetry.cueHeroWeight
        : DEFAULT_VISUAL_TELEMETRY.cueHeroWeight,
    cueEventDensity:
      typeof telemetry?.cueEventDensity === 'number'
        ? telemetry.cueEventDensity
        : DEFAULT_VISUAL_TELEMETRY.cueEventDensity,
    stageCueFamily:
      telemetry?.stageCueFamily === 'brood' ||
      telemetry?.stageCueFamily === 'gather' ||
      telemetry?.stageCueFamily === 'reveal' ||
      telemetry?.stageCueFamily === 'rupture' ||
      telemetry?.stageCueFamily === 'release' ||
      telemetry?.stageCueFamily === 'haunt' ||
      telemetry?.stageCueFamily === 'reset'
        ? telemetry.stageCueFamily
        : DEFAULT_VISUAL_TELEMETRY.stageCueFamily,
    stageCueDominance:
      telemetry?.stageCueDominance === 'hero' ||
      telemetry?.stageCueDominance === 'chamber' ||
      telemetry?.stageCueDominance === 'world' ||
      telemetry?.stageCueDominance === 'hybrid'
        ? telemetry.stageCueDominance
        : DEFAULT_VISUAL_TELEMETRY.stageCueDominance,
    stageSpendProfile:
      telemetry?.stageSpendProfile === 'withheld' ||
      telemetry?.stageSpendProfile === 'earned' ||
      telemetry?.stageSpendProfile === 'peak'
        ? telemetry.stageSpendProfile
        : undefined,
    stageWorldMode:
      telemetry?.stageWorldMode === 'hold' ||
      telemetry?.stageWorldMode === 'aperture-cage' ||
      telemetry?.stageWorldMode === 'fan-sweep' ||
      telemetry?.stageWorldMode === 'cathedral-rise' ||
      telemetry?.stageWorldMode === 'collapse-well' ||
      telemetry?.stageWorldMode === 'ghost-chamber' ||
      telemetry?.stageWorldMode === 'field-bloom'
        ? telemetry.stageWorldMode
        : DEFAULT_VISUAL_TELEMETRY.stageWorldMode,
    stageCompositorMode:
      telemetry?.stageCompositorMode === 'none' ||
      telemetry?.stageCompositorMode === 'precharge' ||
      telemetry?.stageCompositorMode === 'wipe' ||
      telemetry?.stageCompositorMode === 'flash' ||
      telemetry?.stageCompositorMode === 'scar' ||
      telemetry?.stageCompositorMode === 'afterimage' ||
      telemetry?.stageCompositorMode === 'cut'
        ? telemetry.stageCompositorMode
        : DEFAULT_VISUAL_TELEMETRY.stageCompositorMode,
    stageResidueMode:
      telemetry?.stageResidueMode === 'none' ||
      telemetry?.stageResidueMode === 'short' ||
      telemetry?.stageResidueMode === 'afterglow' ||
      telemetry?.stageResidueMode === 'ghost' ||
      telemetry?.stageResidueMode === 'scar' ||
      telemetry?.stageResidueMode === 'clear'
        ? telemetry.stageResidueMode
        : DEFAULT_VISUAL_TELEMETRY.stageResidueMode,
    stageTransformIntent:
      telemetry?.stageTransformIntent === 'hold' ||
      telemetry?.stageTransformIntent === 'compress' ||
      telemetry?.stageTransformIntent === 'open' ||
      telemetry?.stageTransformIntent === 'collapse' ||
      telemetry?.stageTransformIntent === 'sweep' ||
      telemetry?.stageTransformIntent === 'exhale' ||
      telemetry?.stageTransformIntent === 'clear'
        ? telemetry.stageTransformIntent
        : DEFAULT_VISUAL_TELEMETRY.stageTransformIntent,
    stageHeroScaleMin:
      typeof telemetry?.stageHeroScaleMin === 'number'
        ? telemetry.stageHeroScaleMin
        : undefined,
    stageHeroScaleMax:
      typeof telemetry?.stageHeroScaleMax === 'number'
        ? telemetry.stageHeroScaleMax
        : undefined,
    stageHeroAnchorLane:
      telemetry?.stageHeroAnchorLane === 'center' ||
      telemetry?.stageHeroAnchorLane === 'left' ||
      telemetry?.stageHeroAnchorLane === 'right' ||
      telemetry?.stageHeroAnchorLane === 'high' ||
      telemetry?.stageHeroAnchorLane === 'low'
        ? telemetry.stageHeroAnchorLane
        : undefined,
    stageHeroAnchorStrength:
      typeof telemetry?.stageHeroAnchorStrength === 'number'
        ? telemetry.stageHeroAnchorStrength
        : undefined,
    stageExposureCeiling:
      typeof telemetry?.stageExposureCeiling === 'number'
        ? telemetry.stageExposureCeiling
        : undefined,
    stageBloomCeiling:
      typeof telemetry?.stageBloomCeiling === 'number'
        ? telemetry.stageBloomCeiling
        : undefined,
    stageRingAuthority:
      telemetry?.stageRingAuthority === 'background-scaffold' ||
      telemetry?.stageRingAuthority === 'framing-architecture' ||
      telemetry?.stageRingAuthority === 'event-platform'
        ? telemetry.stageRingAuthority
        : undefined,
    stageWashoutSuppression:
      typeof telemetry?.stageWashoutSuppression === 'number'
        ? telemetry.stageWashoutSuppression
        : undefined,
    stageMotionPhrase:
      telemetry?.stageMotionPhrase === 'drift-orbit' ||
      telemetry?.stageMotionPhrase === 'bank-rise' ||
      telemetry?.stageMotionPhrase === 'arc-handoff' ||
      telemetry?.stageMotionPhrase === 'tumble-release' ||
      telemetry?.stageMotionPhrase === 'recoil-dive' ||
      telemetry?.stageMotionPhrase === 'cathedral-precession'
        ? telemetry.stageMotionPhrase
        : DEFAULT_VISUAL_TELEMETRY.stageMotionPhrase,
    stageCameraPhrase:
      telemetry?.stageCameraPhrase === 'drift-orbit' ||
      telemetry?.stageCameraPhrase === 'bank-rise' ||
      telemetry?.stageCameraPhrase === 'arc-handoff' ||
      telemetry?.stageCameraPhrase === 'tumble-release' ||
      telemetry?.stageCameraPhrase === 'recoil-dive' ||
      telemetry?.stageCameraPhrase === 'cathedral-precession'
        ? telemetry.stageCameraPhrase
        : DEFAULT_VISUAL_TELEMETRY.stageCameraPhrase,
    stageHeroForm:
      telemetry?.stageHeroForm === 'orb' ||
      telemetry?.stageHeroForm === 'cube' ||
      telemetry?.stageHeroForm === 'pyramid' ||
      telemetry?.stageHeroForm === 'diamond' ||
      telemetry?.stageHeroForm === 'prism' ||
      telemetry?.stageHeroForm === 'shard' ||
      telemetry?.stageHeroForm === 'mushroom'
        ? telemetry.stageHeroForm
        : DEFAULT_VISUAL_TELEMETRY.stageHeroForm,
    stageHeroAccentForm:
      telemetry?.stageHeroAccentForm === 'orb' ||
      telemetry?.stageHeroAccentForm === 'cube' ||
      telemetry?.stageHeroAccentForm === 'pyramid' ||
      telemetry?.stageHeroAccentForm === 'diamond' ||
      telemetry?.stageHeroAccentForm === 'prism' ||
      telemetry?.stageHeroAccentForm === 'shard' ||
      telemetry?.stageHeroAccentForm === 'mushroom'
        ? telemetry.stageHeroAccentForm
        : DEFAULT_VISUAL_TELEMETRY.stageHeroAccentForm,
    stageHeroFormHoldSeconds:
      typeof telemetry?.stageHeroFormHoldSeconds === 'number'
        ? telemetry.stageHeroFormHoldSeconds
        : DEFAULT_VISUAL_TELEMETRY.stageHeroFormHoldSeconds,
    stagePaletteHoldSeconds:
      typeof telemetry?.stagePaletteHoldSeconds === 'number'
        ? telemetry.stagePaletteHoldSeconds
        : DEFAULT_VISUAL_TELEMETRY.stagePaletteHoldSeconds,
    stageScreenEffectFamily:
      telemetry?.stageScreenEffectFamily === 'none' ||
      telemetry?.stageScreenEffectFamily === 'residue' ||
      telemetry?.stageScreenEffectFamily === 'carve' ||
      telemetry?.stageScreenEffectFamily === 'wipe' ||
      telemetry?.stageScreenEffectFamily === 'stain' ||
      telemetry?.stageScreenEffectFamily === 'directional-afterimage' ||
      telemetry?.stageScreenEffectFamily === 'impact-memory'
        ? telemetry.stageScreenEffectFamily
        : DEFAULT_VISUAL_TELEMETRY.stageScreenEffectFamily,
    stageScreenEffectIntensity:
      typeof telemetry?.stageScreenEffectIntensity === 'number'
        ? telemetry.stageScreenEffectIntensity
        : DEFAULT_VISUAL_TELEMETRY.stageScreenEffectIntensity,
    stageScreenEffectDirectionalBias:
      typeof telemetry?.stageScreenEffectDirectionalBias === 'number'
        ? telemetry.stageScreenEffectDirectionalBias
        : DEFAULT_VISUAL_TELEMETRY.stageScreenEffectDirectionalBias,
    stageScreenEffectMemoryBias:
      typeof telemetry?.stageScreenEffectMemoryBias === 'number'
        ? telemetry.stageScreenEffectMemoryBias
        : DEFAULT_VISUAL_TELEMETRY.stageScreenEffectMemoryBias,
    stageScreenEffectCarveBias:
      typeof telemetry?.stageScreenEffectCarveBias === 'number'
        ? telemetry.stageScreenEffectCarveBias
        : DEFAULT_VISUAL_TELEMETRY.stageScreenEffectCarveBias,
    stageHeroScaleBias:
      typeof telemetry?.stageHeroScaleBias === 'number'
        ? telemetry.stageHeroScaleBias
        : DEFAULT_VISUAL_TELEMETRY.stageHeroScaleBias,
    stageHeroStageX:
      typeof telemetry?.stageHeroStageX === 'number'
        ? telemetry.stageHeroStageX
        : DEFAULT_VISUAL_TELEMETRY.stageHeroStageX,
    stageHeroStageY:
      typeof telemetry?.stageHeroStageY === 'number'
        ? telemetry.stageHeroStageY
        : DEFAULT_VISUAL_TELEMETRY.stageHeroStageY,
    stageHeroDepthBias:
      typeof telemetry?.stageHeroDepthBias === 'number'
        ? telemetry.stageHeroDepthBias
        : DEFAULT_VISUAL_TELEMETRY.stageHeroDepthBias,
    stageHeroMotionBias:
      typeof telemetry?.stageHeroMotionBias === 'number'
        ? telemetry.stageHeroMotionBias
        : DEFAULT_VISUAL_TELEMETRY.stageHeroMotionBias,
    stageHeroMorphBias:
      typeof telemetry?.stageHeroMorphBias === 'number'
        ? telemetry.stageHeroMorphBias
        : DEFAULT_VISUAL_TELEMETRY.stageHeroMorphBias,
    stageShotClass:
      telemetry?.stageShotClass === 'anchor' ||
      telemetry?.stageShotClass === 'pressure' ||
      telemetry?.stageShotClass === 'rupture' ||
      telemetry?.stageShotClass === 'worldTakeover' ||
      telemetry?.stageShotClass === 'aftermath' ||
      telemetry?.stageShotClass === 'isolate'
        ? telemetry.stageShotClass
        : undefined,
    stageTransitionClass:
      telemetry?.stageTransitionClass === 'hold' ||
      telemetry?.stageTransitionClass === 'wipe' ||
      telemetry?.stageTransitionClass === 'collapse' ||
      telemetry?.stageTransitionClass === 'iris' ||
      telemetry?.stageTransitionClass === 'blackoutCut' ||
      telemetry?.stageTransitionClass === 'residueDissolve' ||
      telemetry?.stageTransitionClass === 'vectorHandoff'
        ? telemetry.stageTransitionClass
        : undefined,
    stageEventScale:
      telemetry?.stageEventScale === 'micro' ||
      telemetry?.stageEventScale === 'phrase' ||
      telemetry?.stageEventScale === 'stage'
        ? telemetry.stageEventScale
        : undefined,
    stageTempoCadenceMode:
      telemetry?.stageTempoCadenceMode === 'float' ||
      telemetry?.stageTempoCadenceMode === 'metered' ||
      telemetry?.stageTempoCadenceMode === 'driving' ||
      telemetry?.stageTempoCadenceMode === 'surge' ||
      telemetry?.stageTempoCadenceMode === 'aftermath'
        ? telemetry.stageTempoCadenceMode
        : undefined,
    stageCompositionSafety:
      typeof telemetry?.stageCompositionSafety === 'number'
        ? telemetry.stageCompositionSafety
        : undefined,
    stageFallbackDemoteHero:
      typeof telemetry?.stageFallbackDemoteHero === 'boolean'
        ? telemetry.stageFallbackDemoteHero
        : undefined,
    stageFallbackWidenShot:
      typeof telemetry?.stageFallbackWidenShot === 'boolean'
        ? telemetry.stageFallbackWidenShot
        : undefined,
    stageFallbackForceWorldTakeover:
      typeof telemetry?.stageFallbackForceWorldTakeover === 'boolean'
        ? telemetry.stageFallbackForceWorldTakeover
        : undefined,
    heroScale:
      typeof telemetry?.heroScale === 'number' ? telemetry.heroScale : undefined,
    heroScreenX:
      typeof telemetry?.heroScreenX === 'number'
        ? telemetry.heroScreenX
        : undefined,
    heroScreenY:
      typeof telemetry?.heroScreenY === 'number'
        ? telemetry.heroScreenY
        : undefined,
    heroCoverageEstimate:
      typeof telemetry?.heroCoverageEstimate === 'number'
        ? telemetry.heroCoverageEstimate
        : undefined,
    heroOffCenterPenalty:
      typeof telemetry?.heroOffCenterPenalty === 'number'
        ? telemetry.heroOffCenterPenalty
        : undefined,
    heroDepthPenalty:
      typeof telemetry?.heroDepthPenalty === 'number'
        ? telemetry.heroDepthPenalty
        : undefined,
    heroTranslateX:
      typeof telemetry?.heroTranslateX === 'number' ? telemetry.heroTranslateX : undefined,
    heroTranslateY:
      typeof telemetry?.heroTranslateY === 'number' ? telemetry.heroTranslateY : undefined,
    heroTranslateZ:
      typeof telemetry?.heroTranslateZ === 'number' ? telemetry.heroTranslateZ : undefined,
    heroRotationPitch:
      typeof telemetry?.heroRotationPitch === 'number'
        ? telemetry.heroRotationPitch
        : undefined,
    heroRotationYaw:
      typeof telemetry?.heroRotationYaw === 'number'
        ? telemetry.heroRotationYaw
        : undefined,
    heroRotationRoll:
      typeof telemetry?.heroRotationRoll === 'number'
        ? telemetry.heroRotationRoll
        : undefined,
    chamberTranslateX:
      typeof telemetry?.chamberTranslateX === 'number'
        ? telemetry.chamberTranslateX
        : undefined,
    chamberTranslateY:
      typeof telemetry?.chamberTranslateY === 'number'
        ? telemetry.chamberTranslateY
        : undefined,
    chamberTranslateZ:
      typeof telemetry?.chamberTranslateZ === 'number'
        ? telemetry.chamberTranslateZ
        : undefined,
    chamberRotationPitch:
      typeof telemetry?.chamberRotationPitch === 'number'
        ? telemetry.chamberRotationPitch
        : undefined,
    chamberRotationYaw:
      typeof telemetry?.chamberRotationYaw === 'number'
        ? telemetry.chamberRotationYaw
        : undefined,
    chamberRotationRoll:
      typeof telemetry?.chamberRotationRoll === 'number'
        ? telemetry.chamberRotationRoll
        : undefined,
    cameraTranslateX:
      typeof telemetry?.cameraTranslateX === 'number'
        ? telemetry.cameraTranslateX
        : undefined,
    cameraTranslateY:
      typeof telemetry?.cameraTranslateY === 'number'
        ? telemetry.cameraTranslateY
        : undefined,
    cameraTranslateZ:
      typeof telemetry?.cameraTranslateZ === 'number'
        ? telemetry.cameraTranslateZ
        : undefined,
    cameraRotationPitch:
      typeof telemetry?.cameraRotationPitch === 'number'
        ? telemetry.cameraRotationPitch
        : undefined,
    cameraRotationYaw:
      typeof telemetry?.cameraRotationYaw === 'number'
        ? telemetry.cameraRotationYaw
        : undefined,
    cameraRotationRoll:
      typeof telemetry?.cameraRotationRoll === 'number'
        ? telemetry.cameraRotationRoll
        : undefined,
    ringAuthority:
      typeof telemetry?.ringAuthority === 'number'
        ? telemetry.ringAuthority
        : undefined,
    chamberPresenceScore:
      typeof telemetry?.chamberPresenceScore === 'number'
        ? telemetry.chamberPresenceScore
        : undefined,
    frameHierarchyScore:
      typeof telemetry?.frameHierarchyScore === 'number'
        ? telemetry.frameHierarchyScore
        : undefined,
    compositionSafetyFlag:
      typeof telemetry?.compositionSafetyFlag === 'boolean'
        ? telemetry.compositionSafetyFlag
        : undefined,
    compositionSafetyScore:
      typeof telemetry?.compositionSafetyScore === 'number'
        ? telemetry.compositionSafetyScore
        : undefined,
    overbright:
      typeof telemetry?.overbright === 'number'
        ? telemetry.overbright
        : undefined,
    ringBeltPersistence:
      typeof telemetry?.ringBeltPersistence === 'number'
        ? telemetry.ringBeltPersistence
        : undefined,
    wirefieldDensityScore:
      typeof telemetry?.wirefieldDensityScore === 'number'
        ? telemetry.wirefieldDensityScore
        : undefined,
    worldDominanceDelivered:
      typeof telemetry?.worldDominanceDelivered === 'number'
        ? telemetry.worldDominanceDelivered
        : undefined,
    stageFallbackHeroOverreach:
      typeof telemetry?.stageFallbackHeroOverreach === 'boolean'
        ? telemetry.stageFallbackHeroOverreach
        : undefined,
    stageFallbackRingOverdraw:
      typeof telemetry?.stageFallbackRingOverdraw === 'boolean'
        ? telemetry.stageFallbackRingOverdraw
        : undefined,
    stageFallbackOverbrightRisk:
      typeof telemetry?.stageFallbackOverbrightRisk === 'boolean'
        ? telemetry.stageFallbackOverbrightRisk
        : undefined,
    stageFallbackWashoutRisk:
      typeof telemetry?.stageFallbackWashoutRisk === 'boolean'
        ? telemetry.stageFallbackWashoutRisk
        : undefined,
    afterImageDamp:
      typeof telemetry?.afterImageDamp === 'number'
        ? telemetry.afterImageDamp
        : DEFAULT_VISUAL_TELEMETRY.afterImageDamp,
    atmosphereMatterState:
      telemetry?.atmosphereMatterState === 'gas' ||
      telemetry?.atmosphereMatterState === 'liquid' ||
      telemetry?.atmosphereMatterState === 'plasma' ||
      telemetry?.atmosphereMatterState === 'crystal'
        ? telemetry.atmosphereMatterState
        : DEFAULT_VISUAL_TELEMETRY.atmosphereMatterState,
    atmosphereGas:
      typeof telemetry?.atmosphereGas === 'number'
        ? telemetry.atmosphereGas
        : DEFAULT_VISUAL_TELEMETRY.atmosphereGas,
    atmosphereLiquid:
      typeof telemetry?.atmosphereLiquid === 'number'
        ? telemetry.atmosphereLiquid
        : DEFAULT_VISUAL_TELEMETRY.atmosphereLiquid,
    atmospherePlasma:
      typeof telemetry?.atmospherePlasma === 'number'
        ? telemetry.atmospherePlasma
        : DEFAULT_VISUAL_TELEMETRY.atmospherePlasma,
    atmosphereCrystal:
      typeof telemetry?.atmosphereCrystal === 'number'
        ? telemetry.atmosphereCrystal
        : DEFAULT_VISUAL_TELEMETRY.atmosphereCrystal,
    atmospherePressure:
      typeof telemetry?.atmospherePressure === 'number'
        ? telemetry.atmospherePressure
        : DEFAULT_VISUAL_TELEMETRY.atmospherePressure,
    atmosphereIonization:
      typeof telemetry?.atmosphereIonization === 'number'
        ? telemetry.atmosphereIonization
        : DEFAULT_VISUAL_TELEMETRY.atmosphereIonization,
    atmosphereResidue:
      typeof telemetry?.atmosphereResidue === 'number'
        ? telemetry.atmosphereResidue
        : DEFAULT_VISUAL_TELEMETRY.atmosphereResidue,
    atmosphereStructureReveal:
      typeof telemetry?.atmosphereStructureReveal === 'number'
        ? telemetry.atmosphereStructureReveal
        : DEFAULT_VISUAL_TELEMETRY.atmosphereStructureReveal,
    temporalWindows: {
      preBeatLift:
        typeof telemetry?.temporalWindows?.preBeatLift === 'number'
          ? telemetry.temporalWindows.preBeatLift
          : 0,
      beatStrike:
        typeof telemetry?.temporalWindows?.beatStrike === 'number'
          ? telemetry.temporalWindows.beatStrike
          : 0,
      postBeatRelease:
        typeof telemetry?.temporalWindows?.postBeatRelease === 'number'
          ? telemetry.temporalWindows.postBeatRelease
          : 0,
      interBeatFloat:
        typeof telemetry?.temporalWindows?.interBeatFloat === 'number'
          ? telemetry.temporalWindows.interBeatFloat
          : 0,
      barTurn:
        typeof telemetry?.temporalWindows?.barTurn === 'number'
          ? telemetry.temporalWindows.barTurn
          : 0,
      phraseResolve:
        typeof telemetry?.temporalWindows?.phraseResolve === 'number'
          ? telemetry.temporalWindows.phraseResolve
          : 0
    },
    assetLayerActivity: Object.fromEntries(
      VISUAL_ASSET_LAYERS.map((layer) => [
        layer,
        typeof telemetry?.assetLayerActivity?.[layer] === 'number'
          ? telemetry.assetLayerActivity[layer]
          : DEFAULT_VISUAL_TELEMETRY.assetLayerActivity[layer]
      ])
    ) as VisualTelemetryFrame['assetLayerActivity']
  };
}

function normalizeReplayMetricWindowSummary(
  value: unknown
): ReplayMetricWindowSummary | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    start: typeof value.start === 'number' ? value.start : 0,
    end: typeof value.end === 'number' ? value.end : 0,
    min: typeof value.min === 'number' ? value.min : 0,
    max: typeof value.max === 'number' ? value.max : 0
  };
}

function normalizeReplayBootSummary(value: unknown): ReplayCaptureMetadata['bootSummary'] {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    calibrationDurationMs:
      typeof value.calibrationDurationMs === 'number'
        ? value.calibrationDurationMs
        : 0,
    calibrationSampleCount:
      typeof value.calibrationSampleCount === 'number'
        ? value.calibrationSampleCount
        : 0,
    calibrationRmsPercentile20:
      typeof value.calibrationRmsPercentile20 === 'number'
        ? value.calibrationRmsPercentile20
        : 0,
    calibrationPeakPercentile90:
      typeof value.calibrationPeakPercentile90 === 'number'
        ? value.calibrationPeakPercentile90
        : 0,
    noiseFloor: typeof value.noiseFloor === 'number' ? value.noiseFloor : 0,
    minimumCeiling:
      typeof value.minimumCeiling === 'number' ? value.minimumCeiling : 0,
    calibrationPeak:
      typeof value.calibrationPeak === 'number' ? value.calibrationPeak : 0,
    adaptiveCeiling:
      typeof value.adaptiveCeiling === 'number' ? value.adaptiveCeiling : 0
  };
}

function normalizeReplaySourceSummary(
  value: unknown
): ReplayCaptureMetadata['sourceSummary'] {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    sourceMode:
      value.sourceMode === 'system-audio' || value.sourceMode === 'hybrid'
        ? value.sourceMode
        : 'room-mic',
    sourceLabel:
      typeof value.sourceLabel === 'string' ? value.sourceLabel : 'Unknown microphone',
    selectedInputId:
      typeof value.selectedInputId === 'string' || value.selectedInputId === null
        ? value.selectedInputId
        : null,
    displayAudioGranted: Boolean(value.displayAudioGranted),
    displayTrackLabel:
      typeof value.displayTrackLabel === 'string' || value.displayTrackLabel === null
        ? value.displayTrackLabel
        : null,
    rawPathGranted: Boolean(value.rawPathGranted),
    provenanceMismatch: Boolean(value.provenanceMismatch),
    provenanceNote:
      typeof value.provenanceNote === 'string' ? value.provenanceNote : undefined
  };
}

function normalizeReplayDecisionBucketSummary(
  value: unknown
): ReplayDecisionBucketSummary {
  if (!isObject(value)) {
    return {
      dominantReason: null,
      transitionCount: 0,
      topReasons: []
    };
  }

  return {
    dominantReason:
      typeof value.dominantReason === 'string' ? value.dominantReason : null,
    transitionCount:
      typeof value.transitionCount === 'number' ? value.transitionCount : 0,
    topReasons: Array.isArray(value.topReasons)
      ? value.topReasons
          .filter(
            (entry): entry is { value: string; count: number } =>
              isObject(entry) &&
              typeof entry.value === 'string' &&
              typeof entry.count === 'number'
          )
          .slice(0, 3)
      : []
  };
}

function normalizeReplayDecisionSummary(
  value: unknown
): ReplayCaptureMetadata['decisionSummary'] {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    state: normalizeReplayDecisionBucketSummary(value.state),
    showState: normalizeReplayDecisionBucketSummary(value.showState),
    moment: normalizeReplayDecisionBucketSummary(value.moment),
    conductor: normalizeReplayDecisionBucketSummary(value.conductor)
  };
}

function normalizeReplayInputDriftSummary(
  value: unknown
): ReplayCaptureMetadata['inputDriftSummary'] {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    noiseFloor:
      normalizeReplayMetricWindowSummary(value.noiseFloor) ??
      buildMetricWindowSummary([]),
    adaptiveCeiling:
      normalizeReplayMetricWindowSummary(value.adaptiveCeiling) ??
      buildMetricWindowSummary([]),
    silenceGate:
      normalizeReplayMetricWindowSummary(value.silenceGate) ??
      buildMetricWindowSummary([]),
    rawRms:
      normalizeReplayMetricWindowSummary(value.rawRms) ?? buildMetricWindowSummary([]),
    rawPeak:
      normalizeReplayMetricWindowSummary(value.rawPeak) ?? buildMetricWindowSummary([]),
    roomMusicFloorActiveRate:
      typeof value.roomMusicFloorActiveRate === 'number'
        ? value.roomMusicFloorActiveRate
        : 0
  };
}

function normalizeReplayProofStillSummary(
  value: unknown
): ReplayCaptureMetadata['proofStills'] {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    requested: Boolean(value.requested),
    sampleIntervalMs:
      typeof value.sampleIntervalMs === 'number' ? value.sampleIntervalMs : 0,
    saved: Array.isArray(value.saved)
      ? value.saved.filter(
          (entry): entry is ReplayProofStillSummary['saved'][number] =>
            isObject(entry) &&
            (entry.kind === 'pre' ||
              entry.kind === 'peak' ||
              entry.kind === 'safety' ||
              entry.kind === 'outro') &&
            typeof entry.timestampMs === 'number' &&
            typeof entry.fileName === 'string'
        )
      : [],
    warning: typeof value.warning === 'string' ? value.warning : undefined
  };
}

function normalizeVisualTelemetrySummary(value: unknown): VisualTelemetrySummary | undefined {
  const summary =
    typeof value === 'object' && value !== null
      ? (value as Partial<VisualTelemetrySummary>)
      : null;
  const rawDominantPaletteState =
    typeof (summary as { dominantPaletteState?: unknown } | null)?.dominantPaletteState ===
    'string'
      ? (summary as { dominantPaletteState?: string }).dominantPaletteState
      : undefined;

  if (!summary) {
    return undefined;
  }

  return {
    dominantQualityTier:
      summary.dominantQualityTier === 'safe' ||
      summary.dominantQualityTier === 'balanced' ||
      summary.dominantQualityTier === 'premium'
        ? summary.dominantQualityTier
        : 'unknown',
    exposureMean:
      typeof summary.exposureMean === 'number'
        ? summary.exposureMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.exposureMean,
    exposurePeak:
      typeof summary.exposurePeak === 'number'
        ? summary.exposurePeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.exposurePeak,
    bloomStrengthMean:
      typeof summary.bloomStrengthMean === 'number'
        ? summary.bloomStrengthMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.bloomStrengthMean,
    bloomStrengthPeak:
      typeof summary.bloomStrengthPeak === 'number'
        ? summary.bloomStrengthPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.bloomStrengthPeak,
    bloomThresholdMean:
      typeof summary.bloomThresholdMean === 'number'
        ? summary.bloomThresholdMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.bloomThresholdMean,
    bloomRadiusMean:
      typeof summary.bloomRadiusMean === 'number'
        ? summary.bloomRadiusMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.bloomRadiusMean,
    bloomRadiusPeak:
      typeof summary.bloomRadiusPeak === 'number'
        ? summary.bloomRadiusPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.bloomRadiusPeak,
    afterImageDampMean:
      typeof summary.afterImageDampMean === 'number'
        ? summary.afterImageDampMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.afterImageDampMean,
    afterImageDampPeak:
      typeof summary.afterImageDampPeak === 'number'
        ? summary.afterImageDampPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.afterImageDampPeak,
    ambientGlowMean:
      typeof summary.ambientGlowMean === 'number'
        ? summary.ambientGlowMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.ambientGlowMean,
    ambientGlowPeak:
      typeof summary.ambientGlowPeak === 'number'
        ? summary.ambientGlowPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.ambientGlowPeak,
    eventGlowMean:
      typeof summary.eventGlowMean === 'number'
        ? summary.eventGlowMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.eventGlowMean,
    eventGlowPeak:
      typeof summary.eventGlowPeak === 'number'
        ? summary.eventGlowPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.eventGlowPeak,
    worldGlowMean:
      typeof summary.worldGlowMean === 'number'
        ? summary.worldGlowMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.worldGlowMean,
    heroGlowMean:
      typeof summary.heroGlowMean === 'number'
        ? summary.heroGlowMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.heroGlowMean,
    shellGlowMean:
      typeof summary.shellGlowMean === 'number'
        ? summary.shellGlowMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.shellGlowMean,
    atmosphereMatterStateSpread: normalizeFixedNumberRecord(
      ATMOSPHERE_MATTER_STATE_KEYS,
      summary.atmosphereMatterStateSpread
    ),
    dominantAtmosphereMatterState:
      summary.dominantAtmosphereMatterState === 'gas' ||
      summary.dominantAtmosphereMatterState === 'liquid' ||
      summary.dominantAtmosphereMatterState === 'plasma' ||
      summary.dominantAtmosphereMatterState === 'crystal'
        ? summary.dominantAtmosphereMatterState
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantAtmosphereMatterState,
    atmosphereGasMean:
      typeof summary.atmosphereGasMean === 'number'
        ? summary.atmosphereGasMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereGasMean,
    atmosphereLiquidMean:
      typeof summary.atmosphereLiquidMean === 'number'
        ? summary.atmosphereLiquidMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereLiquidMean,
    atmospherePlasmaMean:
      typeof summary.atmospherePlasmaMean === 'number'
        ? summary.atmospherePlasmaMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmospherePlasmaMean,
    atmosphereCrystalMean:
      typeof summary.atmosphereCrystalMean === 'number'
        ? summary.atmosphereCrystalMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereCrystalMean,
    atmospherePressureMean:
      typeof summary.atmospherePressureMean === 'number'
        ? summary.atmospherePressureMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmospherePressureMean,
    atmospherePressurePeak:
      typeof summary.atmospherePressurePeak === 'number'
        ? summary.atmospherePressurePeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmospherePressurePeak,
    atmosphereIonizationMean:
      typeof summary.atmosphereIonizationMean === 'number'
        ? summary.atmosphereIonizationMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereIonizationMean,
    atmosphereIonizationPeak:
      typeof summary.atmosphereIonizationPeak === 'number'
        ? summary.atmosphereIonizationPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereIonizationPeak,
    atmosphereResidueMean:
      typeof summary.atmosphereResidueMean === 'number'
        ? summary.atmosphereResidueMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereResidueMean,
    atmosphereResiduePeak:
      typeof summary.atmosphereResiduePeak === 'number'
        ? summary.atmosphereResiduePeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereResiduePeak,
    atmosphereStructureRevealMean:
      typeof summary.atmosphereStructureRevealMean === 'number'
        ? summary.atmosphereStructureRevealMean
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereStructureRevealMean,
    atmosphereStructureRevealPeak:
      typeof summary.atmosphereStructureRevealPeak === 'number'
        ? summary.atmosphereStructureRevealPeak
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.atmosphereStructureRevealPeak,
    dominantShowFamily:
      typeof summary.dominantShowFamily === 'string'
        ? summary.dominantShowFamily
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantShowFamily,
    showFamilySpread: normalizeNumberRecord(summary.showFamilySpread),
    actSpread: {
      'void-chamber':
        typeof summary.actSpread?.['void-chamber'] === 'number'
          ? summary.actSpread['void-chamber']
          : 0,
      'laser-bloom':
        typeof summary.actSpread?.['laser-bloom'] === 'number'
          ? summary.actSpread['laser-bloom']
          : 0,
      'matrix-storm':
        typeof summary.actSpread?.['matrix-storm'] === 'number'
          ? summary.actSpread['matrix-storm']
          : 0,
      'eclipse-rupture':
        typeof summary.actSpread?.['eclipse-rupture'] === 'number'
          ? summary.actSpread['eclipse-rupture']
          : 0,
      'ghost-afterimage':
        typeof summary.actSpread?.['ghost-afterimage'] === 'number'
          ? summary.actSpread['ghost-afterimage']
          : 0
    },
    dominantAct:
      summary.dominantAct === 'void-chamber' ||
      summary.dominantAct === 'laser-bloom' ||
      summary.dominantAct === 'matrix-storm' ||
      summary.dominantAct === 'eclipse-rupture' ||
      summary.dominantAct === 'ghost-afterimage'
        ? summary.dominantAct
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantAct,
    paletteStateSpread: {
      'void-cyan':
        typeof summary.paletteStateSpread?.['void-cyan'] === 'number'
          ? summary.paletteStateSpread['void-cyan']
          : 0,
      'tron-blue':
        typeof summary.paletteStateSpread?.['tron-blue'] === 'number'
          ? summary.paletteStateSpread['tron-blue']
          : 0,
      'acid-lime':
        typeof summary.paletteStateSpread?.['acid-lime'] === 'number'
          ? summary.paletteStateSpread['acid-lime']
          : 0,
      'solar-magenta':
        typeof summary.paletteStateSpread?.['solar-magenta'] === 'number'
          ? summary.paletteStateSpread['solar-magenta']
          : 0,
      'ghost-white':
        typeof summary.paletteStateSpread?.['ghost-white'] === 'number'
          ? summary.paletteStateSpread['ghost-white']
          : 0
    },
    paletteStateSpreadByAct: normalizeNestedFixedNumberRecord(
      SHOW_ACT_KEYS,
      PALETTE_STATE_KEYS,
      summary.paletteStateSpreadByAct
    ),
    paletteStateSpreadByFamily: normalizeNestedFixedNumberRecord(
      STAGE_CUE_FAMILY_KEYS,
      PALETTE_STATE_KEYS,
      summary.paletteStateSpreadByFamily
    ),
    dominantPaletteState:
      rawDominantPaletteState === 'ultraviolet'
        ? 'tron-blue'
        : rawDominantPaletteState === 'void-cyan' ||
            rawDominantPaletteState === 'tron-blue' ||
            rawDominantPaletteState === 'acid-lime' ||
            rawDominantPaletteState === 'solar-magenta' ||
            rawDominantPaletteState === 'ghost-white'
          ? rawDominantPaletteState
          : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantPaletteState,
    stageCueFamilySpread: {
      brood:
        typeof summary.stageCueFamilySpread?.brood === 'number'
          ? summary.stageCueFamilySpread.brood
          : 0,
      gather:
        typeof summary.stageCueFamilySpread?.gather === 'number'
          ? summary.stageCueFamilySpread.gather
          : 0,
      reveal:
        typeof summary.stageCueFamilySpread?.reveal === 'number'
          ? summary.stageCueFamilySpread.reveal
          : 0,
      rupture:
        typeof summary.stageCueFamilySpread?.rupture === 'number'
          ? summary.stageCueFamilySpread.rupture
          : 0,
      release:
        typeof summary.stageCueFamilySpread?.release === 'number'
          ? summary.stageCueFamilySpread.release
          : 0,
      haunt:
        typeof summary.stageCueFamilySpread?.haunt === 'number'
          ? summary.stageCueFamilySpread.haunt
          : 0,
      reset:
        typeof summary.stageCueFamilySpread?.reset === 'number'
          ? summary.stageCueFamilySpread.reset
          : 0
    },
    dominantStageCueFamily:
      summary.dominantStageCueFamily === 'brood' ||
      summary.dominantStageCueFamily === 'gather' ||
      summary.dominantStageCueFamily === 'reveal' ||
      summary.dominantStageCueFamily === 'rupture' ||
      summary.dominantStageCueFamily === 'release' ||
      summary.dominantStageCueFamily === 'haunt' ||
      summary.dominantStageCueFamily === 'reset'
        ? summary.dominantStageCueFamily
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantStageCueFamily,
    stageWorldModeSpread: {
      hold:
        typeof summary.stageWorldModeSpread?.hold === 'number'
          ? summary.stageWorldModeSpread.hold
          : 0,
      'aperture-cage':
        typeof summary.stageWorldModeSpread?.['aperture-cage'] === 'number'
          ? summary.stageWorldModeSpread['aperture-cage']
          : 0,
      'fan-sweep':
        typeof summary.stageWorldModeSpread?.['fan-sweep'] === 'number'
          ? summary.stageWorldModeSpread['fan-sweep']
          : 0,
      'cathedral-rise':
        typeof summary.stageWorldModeSpread?.['cathedral-rise'] === 'number'
          ? summary.stageWorldModeSpread['cathedral-rise']
          : 0,
      'collapse-well':
        typeof summary.stageWorldModeSpread?.['collapse-well'] === 'number'
          ? summary.stageWorldModeSpread['collapse-well']
          : 0,
      'ghost-chamber':
        typeof summary.stageWorldModeSpread?.['ghost-chamber'] === 'number'
          ? summary.stageWorldModeSpread['ghost-chamber']
          : 0,
      'field-bloom':
        typeof summary.stageWorldModeSpread?.['field-bloom'] === 'number'
          ? summary.stageWorldModeSpread['field-bloom']
          : 0
    },
    stageWorldModeSpreadByFamily: normalizeNestedFixedNumberRecord(
      STAGE_CUE_FAMILY_KEYS,
      STAGE_WORLD_MODE_KEYS,
      summary.stageWorldModeSpreadByFamily
    ),
    dominantStageWorldMode:
      summary.dominantStageWorldMode === 'hold' ||
      summary.dominantStageWorldMode === 'aperture-cage' ||
      summary.dominantStageWorldMode === 'fan-sweep' ||
      summary.dominantStageWorldMode === 'cathedral-rise' ||
      summary.dominantStageWorldMode === 'collapse-well' ||
      summary.dominantStageWorldMode === 'ghost-chamber' ||
      summary.dominantStageWorldMode === 'field-bloom'
        ? summary.dominantStageWorldMode
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantStageWorldMode,
    macroEventSpread: normalizeNumberRecord(summary.macroEventSpread),
    dominantMacroEvent:
      typeof summary.dominantMacroEvent === 'string'
        ? summary.dominantMacroEvent
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.dominantMacroEvent,
    heroHueRange:
      typeof summary.heroHueRange === 'number'
        ? summary.heroHueRange
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.heroHueRange,
    worldHueRange:
      typeof summary.worldHueRange === 'number'
        ? summary.worldHueRange
        : DEFAULT_VISUAL_TELEMETRY_SUMMARY.worldHueRange,
    temporalWindowMeans: {
      preBeatLift:
        typeof summary.temporalWindowMeans?.preBeatLift === 'number'
          ? summary.temporalWindowMeans.preBeatLift
          : 0,
      beatStrike:
        typeof summary.temporalWindowMeans?.beatStrike === 'number'
          ? summary.temporalWindowMeans.beatStrike
          : 0,
      postBeatRelease:
        typeof summary.temporalWindowMeans?.postBeatRelease === 'number'
          ? summary.temporalWindowMeans.postBeatRelease
          : 0,
      interBeatFloat:
        typeof summary.temporalWindowMeans?.interBeatFloat === 'number'
          ? summary.temporalWindowMeans.interBeatFloat
          : 0,
      barTurn:
        typeof summary.temporalWindowMeans?.barTurn === 'number'
          ? summary.temporalWindowMeans.barTurn
          : 0,
      phraseResolve:
        typeof summary.temporalWindowMeans?.phraseResolve === 'number'
          ? summary.temporalWindowMeans.phraseResolve
          : 0
    },
    spendProfileSpread: normalizeNumberRecord(summary.spendProfileSpread),
    dominantSpendProfile:
      summary.dominantSpendProfile === 'withheld' ||
      summary.dominantSpendProfile === 'earned' ||
      summary.dominantSpendProfile === 'peak'
        ? summary.dominantSpendProfile
        : undefined,
    overbrightRate:
      typeof summary.overbrightRate === 'number'
        ? summary.overbrightRate
        : undefined,
    overbrightPeak:
      typeof summary.overbrightPeak === 'number'
        ? summary.overbrightPeak
        : undefined,
    heroScaleMean:
      typeof summary.heroScaleMean === 'number'
        ? summary.heroScaleMean
        : undefined,
    heroScalePeak:
      typeof summary.heroScalePeak === 'number'
        ? summary.heroScalePeak
        : undefined,
    heroScreenXMean:
      typeof summary.heroScreenXMean === 'number'
        ? summary.heroScreenXMean
        : undefined,
    heroScreenYMean:
      typeof summary.heroScreenYMean === 'number'
        ? summary.heroScreenYMean
        : undefined,
    ringAuthorityMean:
      typeof summary.ringAuthorityMean === 'number'
        ? summary.ringAuthorityMean
        : undefined,
    stageExposureCeilingMean:
      typeof summary.stageExposureCeilingMean === 'number'
        ? summary.stageExposureCeilingMean
        : undefined,
    stageBloomCeilingMean:
      typeof summary.stageBloomCeilingMean === 'number'
        ? summary.stageBloomCeilingMean
        : undefined,
    stageWashoutSuppressionMean:
      typeof summary.stageWashoutSuppressionMean === 'number'
        ? summary.stageWashoutSuppressionMean
        : undefined,
    stageHeroScaleMinMean:
      typeof summary.stageHeroScaleMinMean === 'number'
        ? summary.stageHeroScaleMinMean
        : undefined,
    stageHeroScaleMaxMean:
      typeof summary.stageHeroScaleMaxMean === 'number'
        ? summary.stageHeroScaleMaxMean
        : undefined,
    stageRingAuthoritySpread: normalizeNumberRecord(summary.stageRingAuthoritySpread),
    dominantStageRingAuthority:
      summary.dominantStageRingAuthority === 'background-scaffold' ||
      summary.dominantStageRingAuthority === 'framing-architecture' ||
      summary.dominantStageRingAuthority === 'event-platform'
        ? summary.dominantStageRingAuthority
        : undefined,
    stageShotClassSpread: normalizeNumberRecord(summary.stageShotClassSpread),
    stageShotClassSpreadByFamily: normalizeNestedFixedNumberRecord(
      STAGE_CUE_FAMILY_KEYS,
      STAGE_SHOT_CLASS_KEYS,
      summary.stageShotClassSpreadByFamily
    ),
    dominantStageShotClass:
      summary.dominantStageShotClass === 'anchor' ||
      summary.dominantStageShotClass === 'pressure' ||
      summary.dominantStageShotClass === 'rupture' ||
      summary.dominantStageShotClass === 'worldTakeover' ||
      summary.dominantStageShotClass === 'aftermath' ||
      summary.dominantStageShotClass === 'isolate'
        ? summary.dominantStageShotClass
        : undefined,
    stageTransitionClassSpread: normalizeNumberRecord(summary.stageTransitionClassSpread),
    dominantStageTransitionClass:
      summary.dominantStageTransitionClass === 'hold' ||
      summary.dominantStageTransitionClass === 'wipe' ||
      summary.dominantStageTransitionClass === 'collapse' ||
      summary.dominantStageTransitionClass === 'iris' ||
      summary.dominantStageTransitionClass === 'blackoutCut' ||
      summary.dominantStageTransitionClass === 'residueDissolve' ||
      summary.dominantStageTransitionClass === 'vectorHandoff'
        ? summary.dominantStageTransitionClass
        : undefined,
    stageTempoCadenceModeSpread: normalizeNumberRecord(summary.stageTempoCadenceModeSpread),
    dominantStageTempoCadenceMode:
      summary.dominantStageTempoCadenceMode === 'float' ||
      summary.dominantStageTempoCadenceMode === 'metered' ||
      summary.dominantStageTempoCadenceMode === 'driving' ||
      summary.dominantStageTempoCadenceMode === 'surge' ||
      summary.dominantStageTempoCadenceMode === 'aftermath'
        ? summary.dominantStageTempoCadenceMode
        : undefined,
    actEntropy:
      typeof summary.actEntropy === 'number' ? summary.actEntropy : undefined,
    paletteEntropy:
      typeof summary.paletteEntropy === 'number' ? summary.paletteEntropy : undefined,
    stageShotClassEntropy:
      typeof summary.stageShotClassEntropy === 'number'
        ? summary.stageShotClassEntropy
        : undefined,
    stageWorldModeEntropy:
      typeof summary.stageWorldModeEntropy === 'number'
        ? summary.stageWorldModeEntropy
        : undefined,
    actLongestRunMs:
      typeof summary.actLongestRunMs === 'number'
        ? summary.actLongestRunMs
        : undefined,
    paletteStateLongestRunMs:
      typeof summary.paletteStateLongestRunMs === 'number'
        ? summary.paletteStateLongestRunMs
        : undefined,
    stageShotClassLongestRunMs:
      typeof summary.stageShotClassLongestRunMs === 'number'
        ? summary.stageShotClassLongestRunMs
        : undefined,
    stageWorldModeLongestRunMs:
      typeof summary.stageWorldModeLongestRunMs === 'number'
        ? summary.stageWorldModeLongestRunMs
        : undefined,
    stageCompositionSafetyMean:
      typeof summary.stageCompositionSafetyMean === 'number'
        ? summary.stageCompositionSafetyMean
        : undefined,
    compositionSafetyRate:
      typeof summary.compositionSafetyRate === 'number'
        ? summary.compositionSafetyRate
        : undefined,
    heroCoverageMean:
      typeof summary.heroCoverageMean === 'number'
        ? summary.heroCoverageMean
        : undefined,
    heroCoveragePeak:
      typeof summary.heroCoveragePeak === 'number'
        ? summary.heroCoveragePeak
        : undefined,
    heroOffCenterPenaltyMean:
      typeof summary.heroOffCenterPenaltyMean === 'number'
        ? summary.heroOffCenterPenaltyMean
        : undefined,
    heroOffCenterPenaltyPeak:
      typeof summary.heroOffCenterPenaltyPeak === 'number'
        ? summary.heroOffCenterPenaltyPeak
        : undefined,
    heroDepthPenaltyMean:
      typeof summary.heroDepthPenaltyMean === 'number'
        ? summary.heroDepthPenaltyMean
        : undefined,
    heroDepthPenaltyPeak:
      typeof summary.heroDepthPenaltyPeak === 'number'
        ? summary.heroDepthPenaltyPeak
        : undefined,
    chamberPresenceMean:
      typeof summary.chamberPresenceMean === 'number'
        ? summary.chamberPresenceMean
        : undefined,
    frameHierarchyMean:
      typeof summary.frameHierarchyMean === 'number'
        ? summary.frameHierarchyMean
        : undefined,
    ringBeltPersistenceMean:
      typeof summary.ringBeltPersistenceMean === 'number'
        ? summary.ringBeltPersistenceMean
        : undefined,
    ringBeltPersistencePeak:
      typeof summary.ringBeltPersistencePeak === 'number'
        ? summary.ringBeltPersistencePeak
        : undefined,
    wirefieldDensityMean:
      typeof summary.wirefieldDensityMean === 'number'
        ? summary.wirefieldDensityMean
        : undefined,
    wirefieldDensityPeak:
      typeof summary.wirefieldDensityPeak === 'number'
        ? summary.wirefieldDensityPeak
        : undefined,
    worldDominanceDeliveredMean:
      typeof summary.worldDominanceDeliveredMean === 'number'
        ? summary.worldDominanceDeliveredMean
        : undefined,
    heroTravelRangeX:
      typeof summary.heroTravelRangeX === 'number' ? summary.heroTravelRangeX : undefined,
    heroTravelRangeY:
      typeof summary.heroTravelRangeY === 'number' ? summary.heroTravelRangeY : undefined,
    heroTravelRangeZ:
      typeof summary.heroTravelRangeZ === 'number' ? summary.heroTravelRangeZ : undefined,
    heroRotationVariancePitch:
      typeof summary.heroRotationVariancePitch === 'number'
        ? summary.heroRotationVariancePitch
        : undefined,
    heroRotationVarianceYaw:
      typeof summary.heroRotationVarianceYaw === 'number'
        ? summary.heroRotationVarianceYaw
        : undefined,
    heroRotationVarianceRoll:
      typeof summary.heroRotationVarianceRoll === 'number'
        ? summary.heroRotationVarianceRoll
        : undefined,
    chamberTravelRangeX:
      typeof summary.chamberTravelRangeX === 'number'
        ? summary.chamberTravelRangeX
        : undefined,
    chamberTravelRangeY:
      typeof summary.chamberTravelRangeY === 'number'
        ? summary.chamberTravelRangeY
        : undefined,
    chamberTravelRangeZ:
      typeof summary.chamberTravelRangeZ === 'number'
        ? summary.chamberTravelRangeZ
        : undefined,
    chamberRotationVariancePitch:
      typeof summary.chamberRotationVariancePitch === 'number'
        ? summary.chamberRotationVariancePitch
        : undefined,
    chamberRotationVarianceYaw:
      typeof summary.chamberRotationVarianceYaw === 'number'
        ? summary.chamberRotationVarianceYaw
        : undefined,
    chamberRotationVarianceRoll:
      typeof summary.chamberRotationVarianceRoll === 'number'
        ? summary.chamberRotationVarianceRoll
        : undefined,
    cameraTravelRangeX:
      typeof summary.cameraTravelRangeX === 'number'
        ? summary.cameraTravelRangeX
        : undefined,
    cameraTravelRangeY:
      typeof summary.cameraTravelRangeY === 'number'
        ? summary.cameraTravelRangeY
        : undefined,
    cameraTravelRangeZ:
      typeof summary.cameraTravelRangeZ === 'number'
        ? summary.cameraTravelRangeZ
        : undefined,
    cameraRotationVariancePitch:
      typeof summary.cameraRotationVariancePitch === 'number'
        ? summary.cameraRotationVariancePitch
        : undefined,
    cameraRotationVarianceYaw:
      typeof summary.cameraRotationVarianceYaw === 'number'
        ? summary.cameraRotationVarianceYaw
        : undefined,
    cameraRotationVarianceRoll:
      typeof summary.cameraRotationVarianceRoll === 'number'
        ? summary.cameraRotationVarianceRoll
        : undefined,
    heroOverreachFallbackRate:
      typeof summary.heroOverreachFallbackRate === 'number'
        ? summary.heroOverreachFallbackRate
        : undefined,
    ringOverdrawFallbackRate:
      typeof summary.ringOverdrawFallbackRate === 'number'
        ? summary.ringOverdrawFallbackRate
        : undefined,
    overbrightFallbackRate:
      typeof summary.overbrightFallbackRate === 'number'
        ? summary.overbrightFallbackRate
        : undefined,
    washoutFallbackRate:
      typeof summary.washoutFallbackRate === 'number'
        ? summary.washoutFallbackRate
        : undefined,
    qualityTransitionCount:
      typeof summary.qualityTransitionCount === 'number'
        ? summary.qualityTransitionCount
        : 0,
    firstQualityDowngradeMs:
      typeof summary.firstQualityDowngradeMs === 'number'
        ? summary.firstQualityDowngradeMs
        : undefined,
    assetLayerSummary: Object.fromEntries(
      VISUAL_ASSET_LAYERS.map((layer) => {
        const entry = summary.assetLayerSummary?.[layer];

        return [
          layer,
          {
            mean: typeof entry?.mean === 'number' ? entry.mean : 0,
            peak: typeof entry?.peak === 'number' ? entry.peak : 0,
            activeFrameRate:
              typeof entry?.activeFrameRate === 'number' ? entry.activeFrameRate : 0
          }
        ];
      })
    ) as VisualTelemetrySummary['assetLayerSummary']
  };
}

export function downloadReplayCapture(capture: ReplayCapture): void {
  const blob = new Blob([JSON.stringify(capture, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${capture.metadata.label}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
