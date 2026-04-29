import path from 'node:path';

const STAGE_WORLD_MODES = [
  'hold',
  'aperture-cage',
  'fan-sweep',
  'cathedral-rise',
  'collapse-well',
  'ghost-chamber',
  'field-bloom'
];

const ATMOSPHERE_MATTER_STATES = ['gas', 'liquid', 'plasma', 'crystal'];

const SIGNATURE_MOMENT_KINDS = [
  'none',
  'collapse-scar',
  'cathedral-open',
  'ghost-residue',
  'silence-constellation'
];

const SIGNATURE_MOMENT_STYLES = [
  'contrast-mythic',
  'maximal-neon',
  'ambient-premium'
];

const VISUAL_MOTIFS = [
  'void-anchor',
  'machine-grid',
  'neon-portal',
  'rupture-scar',
  'ghost-residue',
  'silence-constellation',
  'acoustic-transient',
  'world-takeover'
];

const PLAYABLE_MOTIF_SCENES = [
  'none',
  'neon-cathedral',
  'machine-tunnel',
  'void-pressure',
  'ghost-constellation',
  'collapse-scar'
];

const PLAYABLE_MOTIF_SCENE_TRANSITION_REASONS = [
  'hold',
  'motif-change',
  'section-turn',
  'drop-rupture',
  'release-residue',
  'signature-moment',
  'authority-shift',
  'quiet-state'
];

const PLAYABLE_MOTIF_SCENE_DRIVERS = [
  'motif',
  'signature',
  'authority',
  'release',
  'quiet',
  'hold'
];

const SCENE_SILHOUETTE_FAMILIES = [
  'none',
  'vertical-vault',
  'perspective-tunnel',
  'negative-space-mass',
  'wide-constellation',
  'diagonal-rupture'
];

const SCENE_SURFACE_ROLES = [
  'none',
  'architectural-aperture',
  'shutter-lanes',
  'void-scrim',
  'celestial-field',
  'scar-matte'
];

const COMPOSITOR_MASK_FAMILIES = [
  'none',
  'iris',
  'shutter',
  'slit',
  'edge-window',
  'scar-matte',
  'portal-aperture',
  'ghost-veil'
];

const PARTICLE_FIELD_JOBS = [
  'none',
  'weather',
  'offspring',
  'punctuation',
  'residue',
  'memory-echo',
  'pressure-dust'
];

const RING_POSTURES = [
  'background-scaffold',
  'cathedral-architecture',
  'event-strike',
  'residue-trace',
  'suppressed'
];

const HERO_ROLES = [
  'dominant',
  'supporting',
  'fractured',
  'ghost',
  'twin',
  'membrane',
  'suppressed',
  'world-as-hero'
];

const HERO_FORMS = ['orb', 'cube', 'pyramid', 'diamond', 'prism', 'shard', 'mushroom'];

const HERO_FORM_REASONS = [
  'hold',
  'motif-change',
  'cue-family',
  'section-turn',
  'drop-rupture',
  'release-residue',
  'signature-moment',
  'authority-demotion'
];

const PALETTE_TRANSITION_REASONS = [
  'hold',
  'motif-change',
  'section-turn',
  'drop-rupture',
  'release-residue',
  'signature-moment',
  'authority-shift'
];

const VISUAL_ASSET_LAYERS = [
  'worldSphere',
  'worldStain',
  'worldFlash',
  'fog',
  'heroShell',
  'heroAura',
  'heroFresnel',
  'heroEnergyShell',
  'heroSeam',
  'ghostHero',
  'heroCore',
  'heroEdges',
  'heroMembrane',
  'heroCrown',
  'heroTwins',
  'chamberRings',
  'portalRings',
  'chromaHalos',
  'ghostLattice',
  'laserBeams',
  'stageBlades',
  'stageSweeps',
  'satellites',
  'pressureWaves',
  'particles',
  'ambientLight',
  'fillLight',
  'warmLight',
  'coolLight',
  'afterImage'
];

const COVERAGE_POLICY = {
  'palette states': {
    core: ['void-cyan', 'tron-blue', 'acid-lime', 'solar-magenta'],
    supporting: [],
    rare: ['ghost-white']
  },
  acts: {
    core: ['void-chamber', 'laser-bloom', 'matrix-storm', 'eclipse-rupture'],
    supporting: [],
    rare: ['ghost-afterimage']
  },
  families: {
    core: [
      'liquid-pressure-core',
      'portal-iris',
      'cathedral-rings',
      'ghost-lattice',
      'storm-crown',
      'eclipse-chamber',
      'spectral-plume'
    ],
    supporting: [],
    rare: []
  },
  'stage cue families': {
    core: ['brood', 'gather', 'reveal', 'rupture', 'release'],
    supporting: ['haunt'],
    rare: ['reset']
  },
  'canonical cue classes': {
    core: ['hold', 'gather', 'tighten', 'reveal', 'rupture', 'recovery'],
    supporting: ['orbit-widen', 'fan-sweep', 'laser-burst', 'collapse', 'haunt'],
    rare: ['residue']
  },
  'stage world modes': {
    core: [
      'hold',
      'aperture-cage',
      'fan-sweep',
      'cathedral-rise',
      'collapse-well',
      'field-bloom'
    ],
    supporting: [],
    rare: ['ghost-chamber']
  },
  'signature moments': {
    core: ['collapse-scar', 'cathedral-open', 'ghost-residue', 'silence-constellation'],
    supporting: [],
    rare: []
  },
  'macro events': {
    core: ['pressure-wave', 'portal-open', 'halo-ignition', 'twin-split', 'world-stain'],
    supporting: ['cathedral-rise'],
    rare: ['ghost-afterimage', 'singularity-collapse']
  },
  'asset layers': {
    core: [
      'worldSphere',
      'heroShell',
      'heroCore',
      'heroEdges',
      'chamberRings',
      'particles',
      'ambientLight',
      'fillLight',
      'coolLight'
    ],
    supporting: [
      'worldStain',
      'worldFlash',
      'fog',
      'heroAura',
      'heroFresnel',
      'heroEnergyShell',
      'heroSeam',
      'heroMembrane',
      'heroCrown',
      'portalRings',
      'chromaHalos',
      'ghostLattice',
      'laserBeams',
      'stageBlades',
      'stageSweeps',
      'satellites',
      'warmLight'
    ],
    rare: ['ghostHero', 'heroTwins', 'pressureWaves', 'afterImage']
  }
};

function pad(value) {
  return String(value).padStart(2, '0');
}

export function timestampLabel(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export function formatNumber(value, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

export function formatMs(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0.0s';
  }

  return `${(value / 1000).toFixed(1)}s`;
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0.0%';
  }

  return `${(value * 100).toFixed(1)}%`;
}

export function formatTimestamp(value) {
  const normalized =
    value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;

  if (!normalized || Number.isNaN(normalized.getTime())) {
    return 'n/a';
  }

  return normalized.toISOString();
}

export const PROOF_SCENARIO_KINDS = [
  'primary-benchmark',
  'room-floor',
  'coverage',
  'sparse-silence',
  'operator-trust',
  'steering'
];

export function isCurrentProofScenarioKind(value) {
  return PROOF_SCENARIO_KINDS.includes(value);
}

export function formatProofScenarioKindLabel(kind) {
  switch (kind) {
    case 'primary-benchmark':
      return 'Primary benchmark';
    case 'room-floor':
      return 'Room floor';
    case 'coverage':
      return 'Coverage';
    case 'sparse-silence':
      return 'Sparse / silence';
    case 'operator-trust':
      return 'Operator trust';
    case 'steering':
      return 'Steering';
    default:
      return 'Unassigned';
  }
}

export function resolveCaptureReviewScenarioKind(summaryOrMetadata = {}) {
  const metadata =
    summaryOrMetadata?.metadata && typeof summaryOrMetadata.metadata === 'object'
      ? summaryOrMetadata.metadata
      : summaryOrMetadata;

  const scenarioAssessment =
    metadata?.scenarioAssessment && typeof metadata.scenarioAssessment === 'object'
      ? metadata.scenarioAssessment
      : null;
  const proofMission =
    metadata?.proofMission && typeof metadata.proofMission === 'object'
      ? metadata.proofMission
      : null;

  if (isCurrentProofScenarioKind(proofMission?.scenarioKind)) {
    return proofMission.scenarioKind;
  }

  if (
    scenarioAssessment?.validated === true &&
    isCurrentProofScenarioKind(scenarioAssessment.derivedScenario)
  ) {
    return scenarioAssessment.derivedScenario;
  }

  if (scenarioAssessment && scenarioAssessment.validated !== true) {
    return null;
  }

  if (isCurrentProofScenarioKind(metadata?.proofScenarioKind)) {
    return metadata.proofScenarioKind;
  }

  const benchmarkKind = summaryOrMetadata?.benchmark?.kind;
  return isCurrentProofScenarioKind(benchmarkKind) ? benchmarkKind : null;
}

function normalizeDateInput(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized;
  }

  return null;
}

function isHistoricalBenchmarkStatus(status) {
  return status === 'historical-baseline';
}

function isCurrentBenchmarkStatus(status) {
  return status === 'current-candidate' || status === 'current-canonical';
}

function resolveSummaryTimestamp(summary) {
  return (
    normalizeDateInput(summary?.sourceTimestamps?.effectiveCapturedAt) ??
    normalizeDateInput(summary?.metadata?.capturedAt)
  );
}

function buildSummaryTimestampRange(summaries = []) {
  const timestamps = summaries
    .map((summary) => resolveSummaryTimestamp(summary))
    .filter((value) => value instanceof Date);

  if (timestamps.length === 0) {
    return {
      count: 0,
      oldest: null,
      newest: null,
      oldestIso: null,
      newestIso: null
    };
  }

  timestamps.sort((left, right) => left.getTime() - right.getTime());

  return {
    count: timestamps.length,
    oldest: timestamps[0],
    newest: timestamps[timestamps.length - 1],
    oldestIso: timestamps[0].toISOString(),
    newestIso: timestamps[timestamps.length - 1].toISOString()
  };
}

function formatTimestampRange(range) {
  if (!range?.count || !range.oldestIso || !range.newestIso) {
    return 'none';
  }

  if (range.oldestIso === range.newestIso) {
    return range.oldestIso;
  }

  return `${range.oldestIso} -> ${range.newestIso}`;
}

function formatAgeDays(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return '0.0 day(s)';
  }

  return `${(milliseconds / (1000 * 60 * 60 * 24)).toFixed(1)} day(s)`;
}

export function collectEvidenceFreshness(currentSummaries = [], options = {}) {
  const benchmarkSummaries = Array.isArray(options.benchmarkSummaries)
    ? options.benchmarkSummaries
    : [];
  const evidencePolicy =
    options.evidencePolicy && typeof options.evidencePolicy === 'object'
      ? options.evidencePolicy
      : {};
  const now = normalizeDateInput(options.now) ?? new Date();
  const seriousProofMaxAgeDays =
    Number.isFinite(evidencePolicy.seriousProofMaxAgeDays) &&
    evidencePolicy.seriousProofMaxAgeDays > 0
      ? evidencePolicy.seriousProofMaxAgeDays
      : 7;
  const currentBranchProofCutoffAt = normalizeDateInput(
    evidencePolicy.currentBranchProofCutoffAt
  );
  const currentReviewSummaries = [
    ...currentSummaries.filter(
      (summary) => !isHistoricalBenchmarkStatus(summary?.benchmark?.status)
    ),
    ...benchmarkSummaries.filter((summary) =>
      isCurrentBenchmarkStatus(summary?.benchmark?.status)
    )
  ];
  const historicalBaselineSummaries = benchmarkSummaries.filter((summary) =>
    isHistoricalBenchmarkStatus(summary?.benchmark?.status)
  );
  const allAttachedSummaries = [...currentSummaries, ...benchmarkSummaries];
  const currentBatchRange = buildSummaryTimestampRange(currentSummaries);
  const currentReviewRange = buildSummaryTimestampRange(currentReviewSummaries);
  const historicalBaselineRange = buildSummaryTimestampRange(historicalBaselineSummaries);
  const allAttachedRange = buildSummaryTimestampRange(allAttachedSummaries);
  const reasons = [];
  let currentBranchProofFresh = true;

  if (currentReviewRange.count === 0) {
    currentBranchProofFresh = false;
    reasons.push(
      'No current candidate/current canonical captures are attached to this report.'
    );
  }

  if (
    currentBranchProofCutoffAt &&
    currentReviewRange.newest &&
    currentReviewRange.newest.getTime() < currentBranchProofCutoffAt.getTime()
  ) {
    currentBranchProofFresh = false;
    reasons.push(
      `Newest current review capture predates the current branch proof cutoff (${currentBranchProofCutoffAt.toISOString()}).`
    );
  }

  if (currentReviewRange.newest) {
    const ageMs = now.getTime() - currentReviewRange.newest.getTime();
    const maxAgeMs = seriousProofMaxAgeDays * 24 * 60 * 60 * 1000;

    if (ageMs > maxAgeMs) {
      currentBranchProofFresh = false;
      reasons.push(
        `Newest current review capture is ${formatAgeDays(ageMs)} old, beyond the serious proof window of ${seriousProofMaxAgeDays} day(s).`
      );
    }
  }

  if (reasons.length === 0) {
    reasons.push(
      'Current review captures satisfy the current branch proof cutoff and freshness window.'
    );
  }

  return {
    currentBatchRange,
    currentReviewRange,
    historicalBaselineRange,
    allAttachedRange,
    currentReviewCount: currentReviewRange.count,
    historicalBaselineCount: historicalBaselineRange.count,
    currentBranchProofCutoffAt: currentBranchProofCutoffAt?.toISOString() ?? null,
    seriousProofMaxAgeDays,
    currentBranchProofFresh,
    note:
      typeof evidencePolicy.note === 'string' && evidencePolicy.note.trim().length > 0
        ? evidencePolicy.note.trim()
        : null,
    reasons,
    summaryLine: currentBranchProofFresh ? reasons[0] : reasons.join(' '),
    lines: [
      `- Attached source capture date range: ${formatTimestampRange(allAttachedRange)}`,
      `- Current batch capture date range: ${formatTimestampRange(currentBatchRange)}`,
      `- Current review capture date range: ${formatTimestampRange(currentReviewRange)}`,
      `- Historical baseline capture date range: ${formatTimestampRange(historicalBaselineRange)}`,
      `- Current branch proof cutoff: ${formatTimestamp(
        currentBranchProofCutoffAt
      )}`,
      `- Serious proof max age: ${seriousProofMaxAgeDays} day(s)`,
      `- Current branch proof freshness: ${
        currentBranchProofFresh ? 'fresh' : 'stale'
      } - ${reasons.join(' ')}`,
      ...(typeof evidencePolicy.note === 'string' && evidencePolicy.note.trim().length > 0
        ? [`- Evidence policy note: ${evidencePolicy.note.trim()}`]
        : [])
    ]
  };
}

function incrementCounter(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function normalizePaletteState(value) {
  if (value === 'ultraviolet') {
    return 'tron-blue';
  }

  if (
    value === 'void-cyan' ||
    value === 'tron-blue' ||
    value === 'acid-lime' ||
    value === 'solar-magenta' ||
    value === 'ghost-white'
  ) {
    return value;
  }

  return 'unknown';
}

function normalizeActiveAct(value, listening = {}) {
  if (
    value === 'void-chamber' ||
    value === 'laser-bloom' ||
    value === 'matrix-storm' ||
    value === 'eclipse-rupture' ||
    value === 'ghost-afterimage'
  ) {
    return value;
  }

  if (listening.showState === 'aftermath' || listening.performanceIntent === 'haunt') {
    return 'ghost-afterimage';
  }

  if (listening.showState === 'surge' || listening.performanceIntent === 'detonate') {
    return 'eclipse-rupture';
  }

  if (listening.showState === 'tactile') {
    return 'matrix-storm';
  }

  if (
    listening.showState === 'generative' ||
    listening.performanceIntent === 'ignite'
  ) {
    return 'laser-bloom';
  }

  return 'void-chamber';
}

function buildMetricTracker() {
  return {
    sum: 0,
    peak: Number.NEGATIVE_INFINITY
  };
}

function updateMetricTracker(tracker, value) {
  tracker.sum += value;
  tracker.peak = Math.max(tracker.peak, value);
}

function finalizeMetricTracker(tracker, count) {
  return {
    mean: count > 0 ? tracker.sum / count : 0,
    peak: Number.isFinite(tracker.peak) ? tracker.peak : 0
  };
}

function summarizeLongestRun(frames, selector) {
  let currentValue = null;
  let currentStartMs = 0;
  let currentEndMs = 0;
  let currentCount = 0;
  let best = {
    value: 'unknown',
    startMs: 0,
    endMs: 0,
    durationMs: 0,
    frameCount: 0
  };

  for (const frame of frames) {
    const value = selector(frame) ?? 'unknown';
    const timestampMs = Number.isFinite(frame.timestampMs) ? frame.timestampMs : 0;

    if (currentValue === value) {
      currentEndMs = timestampMs;
      currentCount += 1;
      continue;
    }

    if (currentCount > best.frameCount) {
      best = {
        value: currentValue ?? 'unknown',
        startMs: currentStartMs,
        endMs: currentEndMs,
        durationMs: Math.max(0, currentEndMs - currentStartMs),
        frameCount: currentCount
      };
    }

    currentValue = value;
    currentStartMs = timestampMs;
    currentEndMs = timestampMs;
    currentCount = 1;
  }

  if (currentCount > best.frameCount) {
    best = {
      value: currentValue ?? 'unknown',
      startMs: currentStartMs,
      endMs: currentEndMs,
      durationMs: Math.max(0, currentEndMs - currentStartMs),
      frameCount: currentCount
    };
  }

  return best;
}

function formatLongestRun(label, run) {
  return `- ${label}: \`${run?.value ?? 'unknown'}\` for ${formatMs(run?.durationMs ?? 0)} (${run?.frameCount ?? 0} frames)`;
}

function normalizeBenchmarkKind(kind, active = false) {
  if (
    kind === 'primary-benchmark' ||
    kind === 'room-floor' ||
    kind === 'coverage' ||
    kind === 'sparse-silence' ||
    kind === 'operator-trust' ||
    kind === 'steering' ||
    kind === 'historical'
  ) {
    return kind;
  }

  if (kind === 'primary-correction') {
    return 'primary-benchmark';
  }

  if (kind === 'secondary-floor') {
    return 'room-floor';
  }

  if (kind === 'contrast') {
    return 'coverage';
  }

  return active ? 'primary-benchmark' : 'historical';
}

function resolveBenchmarkKind(summary) {
  return normalizeBenchmarkKind(summary?.benchmark?.kind, Boolean(summary?.benchmark?.active));
}

function formatBenchmarkReadSection(title, summary, stats, runSummary = summary?.longestRuns) {
  if (!stats) {
    return [];
  }

  return [
    `### ${title}`,
    `- Benchmark label: ${summary?.benchmark?.label ?? summary?.benchmark?.id ?? 'unknown'}`,
    `- Benchmark kind: ${resolveBenchmarkKind(summary)}`,
    `- Average capture duration: ${formatMs(stats.averageDurationMs)}`,
    `- Average hero scale mean / peak: ${formatNumber(stats.averageHeroScaleMean)} / ${formatNumber(stats.averageHeroScalePeak)}`,
    `- Average hero screen X / Y mean: ${formatNumber(stats.averageHeroScreenXMean)} / ${formatNumber(stats.averageHeroScreenYMean)}`,
    ...(runSummary
      ? [
          formatLongestRun('Longest show-state run', runSummary.showState),
          formatLongestRun('Longest performance-intent run', runSummary.performanceIntent),
          formatLongestRun('Longest stage-cue run', runSummary.stageCueFamily),
          formatLongestRun('Longest stage-shot run', runSummary.stageShotClass),
          formatLongestRun('Longest transition run', runSummary.stageTransitionClass),
          formatLongestRun('Longest cadence run', runSummary.stageTempoCadenceMode)
        ]
      : ['- Benchmark run summary is available in per-capture sections.'])
  ];
}

function collectBenchmarkReadSummaries(summaries, benchmarkSummaries = []) {
  const deduped = new Map();

  for (const summary of [...summaries, ...benchmarkSummaries]) {
    if (!summary || typeof summary !== 'object' || !summary.benchmark) {
      continue;
    }

    const resolvedFilePath =
      typeof summary.filePath === 'string'
        ? path.resolve(summary.filePath)
        : `benchmark-${deduped.size}`;

    if (!deduped.has(resolvedFilePath)) {
      deduped.set(resolvedFilePath, summary);
    }
  }

  return [...deduped.values()];
}

export function buildBenchmarkReadSections(summaries, options = {}) {
  const benchmarkReadSummaries = collectBenchmarkReadSummaries(
    Array.isArray(summaries) ? summaries : [],
    Array.isArray(options.benchmarkSummaries) ? options.benchmarkSummaries : []
  );
  const activeBenchmarkSummaries = benchmarkReadSummaries.filter((summary) => summary.benchmark?.active);
  const secondaryBenchmarkSummaries = benchmarkReadSummaries.filter(
    (summary) =>
      resolveBenchmarkKind(summary) === 'room-floor' &&
      !isHistoricalBenchmarkStatus(summary?.benchmark?.status)
  );
  const historicalPrimaryBenchmarkSummaries = benchmarkReadSummaries.filter(
    (summary) =>
      resolveBenchmarkKind(summary) === 'primary-benchmark' &&
      isHistoricalBenchmarkStatus(summary?.benchmark?.status)
  );
  const historicalRoomFloorSummaries = benchmarkReadSummaries.filter(
    (summary) =>
      resolveBenchmarkKind(summary) === 'room-floor' &&
      isHistoricalBenchmarkStatus(summary?.benchmark?.status)
  );
  const activeBenchmarkStats =
    activeBenchmarkSummaries.length > 0 ? buildAggregateStats(activeBenchmarkSummaries) : null;
  const secondaryBenchmarkStats =
    secondaryBenchmarkSummaries.length > 0
      ? buildAggregateStats(secondaryBenchmarkSummaries)
      : null;
  const historicalPrimaryBenchmarkStats =
    historicalPrimaryBenchmarkSummaries.length > 0
      ? buildAggregateStats(historicalPrimaryBenchmarkSummaries)
      : null;
  const historicalRoomFloorStats =
    historicalRoomFloorSummaries.length > 0
      ? buildAggregateStats(historicalRoomFloorSummaries)
      : null;
  const activeBenchmarkRunSummary =
    activeBenchmarkSummaries.length === 1 ? activeBenchmarkSummaries[0].longestRuns : null;
  const secondaryBenchmarkRunSummary =
    secondaryBenchmarkSummaries.length === 1 ? secondaryBenchmarkSummaries[0].longestRuns : null;
  const historicalPrimaryRunSummary =
    historicalPrimaryBenchmarkSummaries.length === 1
      ? historicalPrimaryBenchmarkSummaries[0].longestRuns
      : null;
  const historicalRoomFloorRunSummary =
    historicalRoomFloorSummaries.length === 1
      ? historicalRoomFloorSummaries[0].longestRuns
      : null;

  return [
    ...(activeBenchmarkStats
      ? formatBenchmarkReadSection(
          'Active benchmark read',
          activeBenchmarkSummaries[0],
          activeBenchmarkStats,
          activeBenchmarkRunSummary
        )
      : historicalPrimaryBenchmarkStats
      ? [
          '### Active benchmark read',
          '- No current active benchmark is selected.',
          '',
          ...formatBenchmarkReadSection(
            'Historical primary baseline',
            historicalPrimaryBenchmarkSummaries[0],
            historicalPrimaryBenchmarkStats,
            historicalPrimaryRunSummary
          ),
          '- Status: historical baseline only. Do not treat this as current branch proof.'
        ]
      : ['### Active benchmark read', '- No active benchmark manifest or active benchmark captures were found.']),
    ...(secondaryBenchmarkStats
      ? [
          '',
          ...formatBenchmarkReadSection(
            'Secondary floor read',
            secondaryBenchmarkSummaries[0],
            secondaryBenchmarkStats,
            secondaryBenchmarkRunSummary
          )
        ]
      : historicalRoomFloorStats
      ? [
          '',
          ...formatBenchmarkReadSection(
            'Historical room-floor baseline',
            historicalRoomFloorSummaries[0],
            historicalRoomFloorStats,
            historicalRoomFloorRunSummary
          ),
          '- Status: historical baseline only. Do not treat this as current branch proof.'
        ]
      : [])
  ];
}

function createZeroAssetLayerSummary() {
  return Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [
      layer,
      {
        mean: 0,
        peak: 0,
        activeFrameRate: 0
      }
    ])
  );
}

function hasPositiveSpread(spread = {}) {
  return Object.values(spread).some((value) => typeof value === 'number' && value > 0);
}

function inferCanonicalCueClassFromStageFamily(stageCueFamily) {
  switch (stageCueFamily) {
    case 'gather':
      return 'gather';
    case 'reveal':
      return 'reveal';
    case 'rupture':
      return 'rupture';
    case 'haunt':
      return 'haunt';
    case 'release':
    case 'reset':
      return 'recovery';
    case 'brood':
    default:
      return 'hold';
  }
}

function mergeVisualSummaryEnhancements(metadata = {}, visualSummary = {}) {
  const metadataVisual = metadata.visualSummary ?? {};
  const rawStageCueFamily =
    visualSummary.dominantStageCueFamily ??
    metadataVisual.dominantStageCueFamily ??
    'brood';
  const rawCanonicalCueClassSpread =
    visualSummary.canonicalCueClassSpread ?? metadataVisual.canonicalCueClassSpread;
  const fallbackCanonicalCueClass = inferCanonicalCueClassFromStageFamily(rawStageCueFamily);
  const canonicalCueClassSpread = hasPositiveSpread(rawCanonicalCueClassSpread)
    ? rawCanonicalCueClassSpread
    : {
        hold: 0,
        gather: 0,
        tighten: 0,
        reveal: 0,
        'orbit-widen': 0,
        'fan-sweep': 0,
        'laser-burst': 0,
        rupture: 0,
        collapse: 0,
        haunt: 0,
        residue: 0,
        recovery: 0,
        [fallbackCanonicalCueClass]: 1
      };

  return {
    ...metadataVisual,
    ...visualSummary,
    stageCueFamilySpread:
      visualSummary.stageCueFamilySpread ??
      metadataVisual.stageCueFamilySpread ??
      {
        brood: 0,
        gather: 0,
        reveal: 0,
        rupture: 0,
        release: 0,
        haunt: 0,
        reset: 0
      },
    dominantStageCueFamily:
      visualSummary.dominantStageCueFamily ??
      metadataVisual.dominantStageCueFamily ??
      'brood',
    canonicalCueClassSpread,
    dominantCanonicalCueClass:
      (hasPositiveSpread(rawCanonicalCueClassSpread)
        ? visualSummary.dominantCanonicalCueClass ?? metadataVisual.dominantCanonicalCueClass
        : fallbackCanonicalCueClass) ?? 'hold',
    performanceRegimeSpread:
      visualSummary.performanceRegimeSpread ??
      metadataVisual.performanceRegimeSpread ??
      {
        'silence-beauty': 0,
        'room-floor': 0,
        suspense: 0,
        gathering: 0,
        driving: 0,
        surge: 0,
        aftermath: 0
      },
    dominantPerformanceRegime:
      visualSummary.dominantPerformanceRegime ??
      metadataVisual.dominantPerformanceRegime ??
      'silence-beauty',
    stageIntentSpread:
      visualSummary.stageIntentSpread ??
      metadataVisual.stageIntentSpread ??
      {
        'hero-pressure': 0,
        'chamber-pressure': 0,
        'world-takeover': 0,
        'residue-memory': 0,
        'recovery-hold': 0,
        hybrid: 0
      },
    dominantStageIntent:
      visualSummary.dominantStageIntent ??
      metadataVisual.dominantStageIntent ??
      'hybrid',
    silenceStateSpread:
      visualSummary.silenceStateSpread ??
      metadataVisual.silenceStateSpread ??
      {
        none: 0,
        'room-floor': 0,
        beauty: 0,
        suspense: 0
      },
    dominantSilenceState:
      visualSummary.dominantSilenceState ??
      metadataVisual.dominantSilenceState ??
      'beauty',
    visualMotifSpread:
      visualSummary.visualMotifSpread ??
      metadataVisual.visualMotifSpread ??
      Object.fromEntries(VISUAL_MOTIFS.map((value) => [value, 0])),
    dominantVisualMotif:
      visualSummary.dominantVisualMotif ??
      metadataVisual.dominantVisualMotif ??
      'void-anchor',
    playableMotifSceneSpread:
      visualSummary.playableMotifSceneSpread ??
      metadataVisual.playableMotifSceneSpread ??
      Object.fromEntries(PLAYABLE_MOTIF_SCENES.map((value) => [value, 0])),
    dominantPlayableMotifScene:
      visualSummary.dominantPlayableMotifScene ??
      metadataVisual.dominantPlayableMotifScene ??
      'none',
    playableMotifSceneProfileSpread:
      visualSummary.playableMotifSceneProfileSpread ??
      metadataVisual.playableMotifSceneProfileSpread ??
      Object.fromEntries(PLAYABLE_MOTIF_SCENES.map((value) => [value, 0])),
    dominantPlayableMotifSceneProfile:
      visualSummary.dominantPlayableMotifSceneProfile ??
      metadataVisual.dominantPlayableMotifSceneProfile ??
      'none',
    playableMotifSceneSilhouetteFamilySpread:
      visualSummary.playableMotifSceneSilhouetteFamilySpread ??
      metadataVisual.playableMotifSceneSilhouetteFamilySpread ??
      Object.fromEntries(SCENE_SILHOUETTE_FAMILIES.map((value) => [value, 0])),
    dominantPlayableMotifSceneSilhouetteFamily:
      visualSummary.dominantPlayableMotifSceneSilhouetteFamily ??
      metadataVisual.dominantPlayableMotifSceneSilhouetteFamily ??
      'none',
    playableMotifSceneSurfaceRoleSpread:
      visualSummary.playableMotifSceneSurfaceRoleSpread ??
      metadataVisual.playableMotifSceneSurfaceRoleSpread ??
      Object.fromEntries(SCENE_SURFACE_ROLES.map((value) => [value, 0])),
    dominantPlayableMotifSceneSurfaceRole:
      visualSummary.dominantPlayableMotifSceneSurfaceRole ??
      metadataVisual.dominantPlayableMotifSceneSurfaceRole ??
      'none',
    compositorMaskFamilySpread:
      visualSummary.compositorMaskFamilySpread ??
      metadataVisual.compositorMaskFamilySpread ??
      Object.fromEntries(COMPOSITOR_MASK_FAMILIES.map((value) => [value, 0])),
    dominantCompositorMaskFamily:
      visualSummary.dominantCompositorMaskFamily ??
      metadataVisual.dominantCompositorMaskFamily ??
      'none',
    particleFieldJobSpread:
      visualSummary.particleFieldJobSpread ??
      metadataVisual.particleFieldJobSpread ??
      Object.fromEntries(PARTICLE_FIELD_JOBS.map((value) => [value, 0])),
    particleFieldJobTelemetryRate:
      visualSummary.particleFieldJobTelemetryRate ??
      metadataVisual.particleFieldJobTelemetryRate ??
      0,
    dominantParticleFieldJob:
      visualSummary.dominantParticleFieldJob ??
      metadataVisual.dominantParticleFieldJob ??
      'none',
    playableMotifSceneTransitionReasonSpread:
      visualSummary.playableMotifSceneTransitionReasonSpread ??
      metadataVisual.playableMotifSceneTransitionReasonSpread ??
      Object.fromEntries(
        PLAYABLE_MOTIF_SCENE_TRANSITION_REASONS.map((value) => [value, 0])
      ),
    dominantPlayableMotifSceneTransitionReason:
      visualSummary.dominantPlayableMotifSceneTransitionReason ??
      metadataVisual.dominantPlayableMotifSceneTransitionReason ??
      'hold',
    playableMotifSceneLongestRunMs:
      visualSummary.playableMotifSceneLongestRunMs ??
      metadataVisual.playableMotifSceneLongestRunMs ??
      0,
    playableMotifSceneMotifMatchRate:
      visualSummary.playableMotifSceneMotifMatchRate ??
      metadataVisual.playableMotifSceneMotifMatchRate ??
      1,
    playableMotifScenePaletteMatchRate:
      visualSummary.playableMotifScenePaletteMatchRate ??
      metadataVisual.playableMotifScenePaletteMatchRate ??
      1,
    playableMotifSceneProfileMatchRate:
      visualSummary.playableMotifSceneProfileMatchRate ??
      metadataVisual.playableMotifSceneProfileMatchRate ??
      1,
    playableMotifSceneDistinctnessMean:
      visualSummary.playableMotifSceneDistinctnessMean ??
      metadataVisual.playableMotifSceneDistinctnessMean ??
      0,
    playableMotifSceneSilhouetteConfidenceMean:
      visualSummary.playableMotifSceneSilhouetteConfidenceMean ??
      metadataVisual.playableMotifSceneSilhouetteConfidenceMean ??
      0,
    heroRoleSpread:
      visualSummary.heroRoleSpread ??
      metadataVisual.heroRoleSpread ??
      Object.fromEntries(HERO_ROLES.map((value) => [value, 0])),
    dominantHeroRole:
      visualSummary.dominantHeroRole ??
      metadataVisual.dominantHeroRole ??
      'supporting',
    heroFormSpread:
      visualSummary.heroFormSpread ??
      metadataVisual.heroFormSpread ??
      Object.fromEntries(HERO_FORMS.map((value) => [value, 0])),
    dominantHeroForm:
      visualSummary.dominantHeroForm ??
      metadataVisual.dominantHeroForm ??
      'orb',
    heroFormReasonSpread:
      visualSummary.heroFormReasonSpread ??
      metadataVisual.heroFormReasonSpread ??
      Object.fromEntries(HERO_FORM_REASONS.map((value) => [value, 0])),
    dominantHeroFormReason:
      visualSummary.dominantHeroFormReason ??
      metadataVisual.dominantHeroFormReason ??
      'hold',
    paletteTransitionReasonSpread:
      visualSummary.paletteTransitionReasonSpread ??
      metadataVisual.paletteTransitionReasonSpread ??
      Object.fromEntries(PALETTE_TRANSITION_REASONS.map((value) => [value, 0])),
    dominantPaletteTransitionReason:
      visualSummary.dominantPaletteTransitionReason ??
      metadataVisual.dominantPaletteTransitionReason ??
      'hold',
    paletteBaseStateSpread:
      visualSummary.paletteBaseStateSpread ??
      metadataVisual.paletteBaseStateSpread ??
      Object.fromEntries(COVERAGE_POLICY['palette states'].core.concat(COVERAGE_POLICY['palette states'].rare).map((value) => [value, 0])),
    dominantPaletteBaseState:
      visualSummary.dominantPaletteBaseState ??
      metadataVisual.dominantPaletteBaseState ??
      'void-cyan',
    paletteBaseLongestRunMs:
      visualSummary.paletteBaseLongestRunMs ??
      metadataVisual.paletteBaseLongestRunMs ??
      0,
    heroFormLongestRunMs:
      visualSummary.heroFormLongestRunMs ??
      metadataVisual.heroFormLongestRunMs ??
      0,
    heroFormSwitchesPerMinute:
      visualSummary.heroFormSwitchesPerMinute ??
      metadataVisual.heroFormSwitchesPerMinute ??
      0,
    plannedActiveHeroFormMatchRate:
      visualSummary.plannedActiveHeroFormMatchRate ??
      metadataVisual.plannedActiveHeroFormMatchRate ??
      1,
    heroWorldHueDivergenceMean:
      visualSummary.heroWorldHueDivergenceMean ??
      metadataVisual.heroWorldHueDivergenceMean ??
      0,
    semanticConfidenceMean:
      visualSummary.semanticConfidenceMean ??
      metadataVisual.semanticConfidenceMean ??
      0,
    unearnedChangeRiskMean:
      visualSummary.unearnedChangeRiskMean ??
      metadataVisual.unearnedChangeRiskMean ??
      0,
    stageWorldModeSpread:
      visualSummary.stageWorldModeSpread ??
      metadataVisual.stageWorldModeSpread ??
      Object.fromEntries(STAGE_WORLD_MODES.map((value) => [value, 0])),
    dominantStageWorldMode:
      visualSummary.dominantStageWorldMode ?? metadataVisual.dominantStageWorldMode ?? 'hold',
    signatureMomentSpread:
      visualSummary.signatureMomentSpread ??
      metadataVisual.signatureMomentSpread ??
      Object.fromEntries(SIGNATURE_MOMENT_KINDS.map((value) => [value, 0])),
    dominantSignatureMoment:
      visualSummary.dominantSignatureMoment ??
      metadataVisual.dominantSignatureMoment ??
      'none',
    signatureMomentStyleSpread:
      visualSummary.signatureMomentStyleSpread ??
      metadataVisual.signatureMomentStyleSpread ??
      Object.fromEntries(SIGNATURE_MOMENT_STYLES.map((value) => [value, 0])),
    dominantSignatureMomentStyle:
      visualSummary.dominantSignatureMomentStyle ??
      metadataVisual.dominantSignatureMomentStyle ??
      'contrast-mythic',
    signatureMomentActiveRate:
      visualSummary.signatureMomentActiveRate ??
      metadataVisual.signatureMomentActiveRate ??
      0,
    signatureMomentIntensityMean:
      visualSummary.signatureMomentIntensityMean ??
      metadataVisual.signatureMomentIntensityMean ??
      0,
    signatureMomentIntensityPeak:
      visualSummary.signatureMomentIntensityPeak ??
      metadataVisual.signatureMomentIntensityPeak ??
      0,
    signatureMomentTriggerConfidenceMean:
      visualSummary.signatureMomentTriggerConfidenceMean ??
      metadataVisual.signatureMomentTriggerConfidenceMean ??
      0,
    signatureMomentForcedPreviewRate:
      visualSummary.signatureMomentForcedPreviewRate ??
      metadataVisual.signatureMomentForcedPreviewRate ??
      0,
    collapseScarMean:
      visualSummary.collapseScarMean ?? metadataVisual.collapseScarMean ?? 0,
    collapseScarPeak:
      visualSummary.collapseScarPeak ?? metadataVisual.collapseScarPeak ?? 0,
    cathedralOpenMean:
      visualSummary.cathedralOpenMean ?? metadataVisual.cathedralOpenMean ?? 0,
    cathedralOpenPeak:
      visualSummary.cathedralOpenPeak ?? metadataVisual.cathedralOpenPeak ?? 0,
    ghostResidueMean:
      visualSummary.ghostResidueMean ?? metadataVisual.ghostResidueMean ?? 0,
    ghostResiduePeak:
      visualSummary.ghostResiduePeak ?? metadataVisual.ghostResiduePeak ?? 0,
    silenceConstellationMean:
      visualSummary.silenceConstellationMean ??
      metadataVisual.silenceConstellationMean ??
      0,
    silenceConstellationPeak:
      visualSummary.silenceConstellationPeak ??
      metadataVisual.silenceConstellationPeak ??
      0,
    aftermathClearanceMean:
      visualSummary.aftermathClearanceMean ??
      metadataVisual.aftermathClearanceMean ??
      1,
    postConsequenceMean:
      visualSummary.postConsequenceMean ?? metadataVisual.postConsequenceMean ?? 0,
    postOverprocessRiskMean:
      visualSummary.postOverprocessRiskMean ??
      metadataVisual.postOverprocessRiskMean ??
      0,
    postOverprocessRiskPeak:
      visualSummary.postOverprocessRiskPeak ??
      metadataVisual.postOverprocessRiskPeak ??
      0,
    compositorContrastLiftMean:
      visualSummary.compositorContrastLiftMean ??
      metadataVisual.compositorContrastLiftMean ??
      0,
    compositorSaturationLiftMean:
      visualSummary.compositorSaturationLiftMean ??
      metadataVisual.compositorSaturationLiftMean ??
      0,
    compositorOverprocessRiskMean:
      visualSummary.compositorOverprocessRiskMean ??
      metadataVisual.compositorOverprocessRiskMean ??
      0,
    compositorOverprocessRiskPeak:
      visualSummary.compositorOverprocessRiskPeak ??
      metadataVisual.compositorOverprocessRiskPeak ??
      0,
    perceptualContrastMean:
      visualSummary.perceptualContrastMean ??
      metadataVisual.perceptualContrastMean ??
      0,
    perceptualColorfulnessMean:
      visualSummary.perceptualColorfulnessMean ??
      metadataVisual.perceptualColorfulnessMean ??
      0,
    perceptualWashoutRiskMean:
      visualSummary.perceptualWashoutRiskMean ??
      metadataVisual.perceptualWashoutRiskMean ??
      0,
    perceptualWashoutRiskPeak:
      visualSummary.perceptualWashoutRiskPeak ??
      metadataVisual.perceptualWashoutRiskPeak ??
      0,
    qualityTransitionCount:
      visualSummary.qualityTransitionCount ?? metadataVisual.qualityTransitionCount ?? 0,
    firstQualityDowngradeMs:
      typeof visualSummary.firstQualityDowngradeMs === 'number'
        ? visualSummary.firstQualityDowngradeMs
        : typeof metadataVisual.firstQualityDowngradeMs === 'number'
        ? metadataVisual.firstQualityDowngradeMs
        : null,
    assetLayerSummary:
      visualSummary.assetLayerSummary ??
      metadataVisual.assetLayerSummary ??
      createZeroAssetLayerSummary()
  };
}

function formatDecisionBucket(label, bucket) {
  const dominant = bucket?.dominantReason ?? 'n/a';
  const transitions = bucket?.transitionCount ?? 0;
  const topReasons =
    Array.isArray(bucket?.topReasons) && bucket.topReasons.length > 0
      ? bucket.topReasons.map((entry) => `${entry.value} (${entry.count})`).join(', ')
      : 'n/a';

  return `- ${label}: dominant=${dominant}; transitions=${transitions}; top=${topReasons}`;
}

function averageSpreadAcrossBatch(summaries, selector) {
  const totals = new Map();

  for (const summary of summaries) {
    const spread = selector(summary) ?? {};
    for (const [key, value] of Object.entries(spread)) {
      if (typeof value !== 'number') {
        continue;
      }

      totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }

  return Object.fromEntries(
    [...totals.entries()].map(([key, value]) => [key, value / summaries.length])
  );
}

function averageNestedSpreadAcrossBatch(summaries, selector) {
  const totals = new Map();

  for (const summary of summaries) {
    const nestedSpread = selector(summary) ?? {};

    for (const [outerKey, innerSpread] of Object.entries(nestedSpread)) {
      if (!innerSpread || typeof innerSpread !== 'object') {
        continue;
      }

      const nestedTotals = totals.get(outerKey) ?? new Map();

      for (const [innerKey, value] of Object.entries(innerSpread)) {
        if (typeof value !== 'number') {
          continue;
        }

        nestedTotals.set(innerKey, (nestedTotals.get(innerKey) ?? 0) + value);
      }

      totals.set(outerKey, nestedTotals);
    }
  }

  return Object.fromEntries(
    [...totals.entries()].map(([outerKey, nestedTotals]) => [
      outerKey,
      Object.fromEntries(
        [...nestedTotals.entries()].map(([innerKey, value]) => [
          innerKey,
          value / summaries.length
        ])
      )
    ])
  );
}

function averageDefinedNumber(summaries, selector) {
  let sum = 0;
  let samples = 0;

  for (const summary of summaries) {
    const value = selector(summary);

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      continue;
    }

    sum += value;
    samples += 1;
  }

  return samples > 0 ? sum / samples : null;
}

function formatSpread(spread = {}) {
  const entries = Object.entries(spread).filter((entry) => typeof entry[1] === 'number');

  return entries.length > 0
    ? entries.map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ')
    : 'n/a';
}

function formatNestedSpreadLines(nestedSpread = {}) {
  return Object.entries(nestedSpread)
    .filter((entry) => entry[1] && typeof entry[1] === 'object')
    .map(([outerKey, innerSpread]) => `- ${outerKey}: ${formatSpread(innerSpread)}`);
}

function buildCoverageCategoryLines(label, occupancy, policy, batchCount) {
  const entries = Object.entries(occupancy)
    .filter((entry) => typeof entry[1] === 'number')
    .sort((left, right) => right[1] - left[1]);
  const top = entries[0] ?? null;
  const runnerUp = entries[1] ?? null;
  const monopolies = [];
  const dormant = [];
  const rareSightings = [];

  if (
    top &&
    top[1] > 0.55 &&
    (!runnerUp || top[1] >= runnerUp[1] * 2)
  ) {
    monopolies.push(
      `- ${label}: monopoly risk on \`${top[0]}\` at ${formatPercent(top[1])}.`
    );
  }

  for (const lane of policy.core ?? []) {
    if ((occupancy[lane] ?? 0) <= 0) {
      dormant.push(`- ${label}: dormant core lane \`${lane}\`.`);
    }
  }

  if (batchCount >= 6) {
    for (const lane of policy.supporting ?? []) {
      if ((occupancy[lane] ?? 0) <= 0) {
        dormant.push(`- ${label}: dormant supporting lane \`${lane}\`.`);
      }
    }
  }

  for (const lane of policy.rare ?? []) {
    if ((occupancy[lane] ?? 0) > 0) {
      rareSightings.push(
        `- ${label}: rare lane \`${lane}\` appeared at ${formatPercent(occupancy[lane])}.`
      );
    }
  }

  return {
    monopolies,
    dormant,
    rareSightings
  };
}

function analyzeCoverageDebt(summaries) {
  if (summaries.length === 0) {
    return {
      monopolies: [],
      dormant: [],
      rareSightings: [],
      lines: ['- No captures were available for coverage analysis.']
    };
  }

  const categoryResults = [
    buildCoverageCategoryLines(
      'palette states',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.paletteStateSpread),
      COVERAGE_POLICY['palette states'],
      summaries.length
    ),
    buildCoverageCategoryLines(
      'acts',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.actSpread),
      COVERAGE_POLICY.acts,
      summaries.length
    ),
    buildCoverageCategoryLines(
      'families',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.showFamilySpread),
      COVERAGE_POLICY.families,
      summaries.length
    ),
    buildCoverageCategoryLines(
      'stage cue families',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.stageCueFamilySpread),
      COVERAGE_POLICY['stage cue families'],
      summaries.length
    ),
    buildCoverageCategoryLines(
      'canonical cue classes',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.canonicalCueClassSpread),
      COVERAGE_POLICY['canonical cue classes'],
      summaries.length
    ),
    buildCoverageCategoryLines(
      'stage world modes',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.stageWorldModeSpread),
      COVERAGE_POLICY['stage world modes'],
      summaries.length
    ),
    buildCoverageCategoryLines(
      'macro events',
      averageSpreadAcrossBatch(summaries, (summary) => summary.visualSummary?.macroEventSpread),
      COVERAGE_POLICY['macro events'],
      summaries.length
    ),
    buildCoverageCategoryLines(
      'asset layers',
      averageSpreadAcrossBatch(summaries, (summary) =>
        Object.fromEntries(
          Object.entries(summary.visualSummary?.assetLayerSummary ?? {}).map(([key, value]) => [
            key,
            value?.activeFrameRate ?? 0
          ])
        )
      ),
      COVERAGE_POLICY['asset layers'],
      summaries.length
    )
  ];

  const monopolies = categoryResults.flatMap((result) => result.monopolies);
  const dormant = categoryResults.flatMap((result) => result.dormant);
  const rareSightings = categoryResults.flatMap((result) => result.rareSightings);

  return {
    monopolies,
    dormant,
    rareSightings,
    lines: [
      ...(monopolies.length > 0
        ? monopolies
        : ['- No major monopolies were detected in the current batch.']),
      ...(dormant.length > 0
        ? dormant
        : ['- No dormant core lanes were detected in the current batch.']),
      ...(rareSightings.length > 0
        ? rareSightings
        : ['- No rare lanes were sighted in the current batch.'])
    ]
  };
}

function buildCoverageDebtLines(summaries) {
  return analyzeCoverageDebt(summaries).lines;
}

function buildGateLine(label, status, detail) {
  return `- ${label}: ${status.toUpperCase()} - ${detail}`;
}

function buildReviewGateLines({
  summaries,
  aggregateStats,
  manifestHealth,
  evidenceFreshness
}) {
  if (summaries.length === 0) {
    return ['- No captures were available, so batch-level review gates could not be evaluated.'];
  }

  const truthIssues = [];
  const truthWarnings = [];

  if (!manifestHealth?.valid) {
    truthIssues.push('benchmark manifest is missing, stale, or internally inconsistent');
  }
  if (evidenceFreshness && !evidenceFreshness.currentBranchProofFresh) {
    truthIssues.push(evidenceFreshness.summaryLine);
  }
  if (aggregateStats.provenanceMismatchCount > 0) {
    truthIssues.push(
      `${aggregateStats.provenanceMismatchCount} capture(s) reported source provenance mismatches`
    );
  }
  if (aggregateStats.invalidBuildIdentityCount > 0) {
    truthIssues.push(
      `${aggregateStats.invalidBuildIdentityCount} capture(s) have invalid or dirty build identity`
    );
  }
  if (aggregateStats.proofInvalidCount > 0) {
    truthIssues.push(
      `${aggregateStats.proofInvalidCount} capture(s) came from invalidated proof runs`
    );
  }
  if (aggregateStats.scenarioMismatchCount > 0) {
    truthIssues.push(
      `${aggregateStats.scenarioMismatchCount} capture(s) failed derived scenario validation`
    );
  }
  if (aggregateStats.missingScenarioTagCount > 0) {
    truthIssues.push(
      `${aggregateStats.missingScenarioTagCount} serious capture(s) were started without a proof scenario`
    );
  }
  if (aggregateStats.proofIneligibleCount > 0) {
    truthWarnings.push(
      `${aggregateStats.proofIneligibleCount} capture(s) are not current-proof eligible`
    );
  }
  if (aggregateStats.oversizedWindowCount > 0) {
    truthWarnings.push(
      `${aggregateStats.oversizedWindowCount} capture(s) exceeded the preferred evidence window`
    );
  }
  if (aggregateStats.multiEventWindowCount > 0) {
    truthWarnings.push(
      `${aggregateStats.multiEventWindowCount} capture(s) smeared multiple trigger events together`
    );
  }

  const governanceIssues = [];
  const governanceWarnings = [];

  if (aggregateStats.averageHeroScalePeak > 0.68) {
    governanceIssues.push(
      `hero peak scale remained too large on average (${formatNumber(aggregateStats.averageHeroScalePeak)})`
    );
  } else if (aggregateStats.averageHeroScalePeak > 0.58) {
    governanceWarnings.push(
      `hero peak scale is still elevated (${formatNumber(aggregateStats.averageHeroScalePeak)})`
    );
  }

  if (aggregateStats.averageRingAuthorityMean > 0.58) {
    governanceIssues.push(
      `ring authority remained too dominant (${formatNumber(aggregateStats.averageRingAuthorityMean)})`
    );
  } else if (aggregateStats.averageRingAuthorityMean > 0.46) {
    governanceWarnings.push(
      `ring authority is still carrying too much of the frame (${formatNumber(aggregateStats.averageRingAuthorityMean)})`
    );
  }

  if (aggregateStats.averageOverbrightPeak > 0.62) {
    governanceIssues.push(
      `overbright risk peaked too high (${formatNumber(aggregateStats.averageOverbrightPeak)})`
    );
  } else if (aggregateStats.averageOverbrightPeak > 0.48) {
    governanceWarnings.push(
      `overbright risk is still elevated (${formatNumber(aggregateStats.averageOverbrightPeak)})`
    );
  }

  if (aggregateStats.averageQualityTransitionCount > 1.4) {
    governanceIssues.push(
      `renderer stability is weak (${formatNumber(aggregateStats.averageQualityTransitionCount)} quality transitions per capture)`
    );
  } else if (aggregateStats.averageQualityTransitionCount > 0.6) {
    governanceWarnings.push(
      `renderer stability needs review (${formatNumber(aggregateStats.averageQualityTransitionCount)} quality transitions per capture)`
    );
  }

  if (
    typeof aggregateStats.averageHeroTravelRangeZ === 'number' &&
    aggregateStats.averageHeroTravelRangeZ < 0.08
  ) {
    governanceWarnings.push(
      `hero depth travel is still too flat (${formatNumber(aggregateStats.averageHeroTravelRangeZ)})`
    );
  }

  if (
    typeof aggregateStats.averageChamberTravelRangeZ === 'number' &&
    aggregateStats.averageChamberTravelRangeZ < 0.05
  ) {
    governanceWarnings.push(
      `chamber depth travel is still too flat (${formatNumber(aggregateStats.averageChamberTravelRangeZ)})`
    );
  }

  if (
    typeof aggregateStats.averagePaletteEntropy === 'number' &&
    aggregateStats.averagePaletteEntropy < 1
  ) {
    governanceWarnings.push(
      `palette variation is still narrow (${formatNumber(aggregateStats.averagePaletteEntropy)})`
    );
  }

  if (
    typeof aggregateStats.averageWorldHueRange === 'number' &&
    aggregateStats.averageWorldHueRange < 0.18
  ) {
    governanceWarnings.push(
      `world hue range is still muted (${formatNumber(aggregateStats.averageWorldHueRange)})`
    );
  }

  if (
    typeof aggregateStats.averageRingOverdrawFallbackRate === 'number' &&
    aggregateStats.averageRingOverdrawFallbackRate > 0.18
  ) {
    governanceWarnings.push(
      `ring-overdraw fallback still fires too often (${formatPercent(aggregateStats.averageRingOverdrawFallbackRate)})`
    );
  }

  if (
    typeof aggregateStats.averageWashoutFallbackRate === 'number' &&
    aggregateStats.averageWashoutFallbackRate > 0.16
  ) {
    governanceWarnings.push(
      `washout fallback still fires too often (${formatPercent(aggregateStats.averageWashoutFallbackRate)})`
    );
  }

  const coverage = analyzeCoverageDebt(summaries);
  const coverageIssues = [
    ...(coverage.monopolies.length > 0
      ? [`${coverage.monopolies.length} monopoly risk finding(s)`]
      : []),
    ...(coverage.dormant.length > 0
      ? [`${coverage.dormant.length} dormant core/supporting lane finding(s)`]
      : [])
  ];
  const coverageNotes =
    coverage.rareSightings.length > 0
      ? `${coverage.rareSightings.length} curated rare-lane sighting(s) were observed.`
      : 'No curated rare lanes were observed in this batch.';

  return [
    buildGateLine(
      'truth gate',
      truthIssues.length > 0 ? 'fail' : truthWarnings.length > 0 ? 'warn' : 'pass',
      truthIssues.length > 0
        ? truthIssues.join('; ')
        : truthWarnings.length > 0
          ? truthWarnings.join('; ')
          : 'benchmark pointers, provenance, and capture windows are coherent'
    ),
    buildGateLine(
      'governance gate',
      governanceIssues.length > 0 ? 'fail' : governanceWarnings.length > 0 ? 'warn' : 'pass',
      governanceIssues.length > 0
        ? governanceIssues.join('; ')
        : governanceWarnings.length > 0
          ? governanceWarnings.join('; ')
          : 'hero scale, ring authority, overbright risk, and renderer stability are within the current acceptance band'
    ),
    buildGateLine(
      'coverage gate',
      coverageIssues.length > 0 ? 'fail' : 'pass',
      coverageIssues.length > 0
        ? `${coverageIssues.join('; ')}. ${coverageNotes}`
        : `No major monopolies or dormant core lanes were detected. ${coverageNotes}`
    ),
    buildGateLine(
      'taste gate',
      'manual',
      'use fullscreen room-read plus proof stills and the short review note to judge across-room authority, chamber read, and up-close reward'
    )
  ];
}

export function resolveEventArchetype(peaks, dominantState) {
  if (peaks.dropImpact > 0.78 && peaks.subPressure > 0.58) {
    return 'collapse';
  }

  if (peaks.sectionChange > 0.56 && peaks.peakConfidence > 0.6) {
    return 'cathedral-rise';
  }

  if (peaks.accent > 0.58 && peaks.beatConfidence > 0.52) {
    return 'strike-burst';
  }

  if (peaks.musicConfidence > 0.62 && peaks.phraseTension > 0.5) {
    return 'portal-open';
  }

  if (dominantState === 'aftermath' || peaks.releaseTail > 0.42) {
    return 'ghost-trace';
  }

  return dominantState;
}

function normalizeCaptureFramesChronology(frames, triggerTimestampMs) {
  if (!Array.isArray(frames) || frames.length <= 1) {
    return {
      frames: Array.isArray(frames) ? frames : [],
      normalized: false
    };
  }

  const breakIndices = [];

  for (let index = 1; index < frames.length; index += 1) {
    if ((frames[index]?.timestampMs ?? 0) < (frames[index - 1]?.timestampMs ?? 0)) {
      breakIndices.push(index);
    }
  }

  if (breakIndices.length === 0) {
    return {
      frames,
      normalized: false
    };
  }

  const segments = [];
  let startIndex = 0;

  for (const breakIndex of breakIndices) {
    segments.push(frames.slice(startIndex, breakIndex));
    startIndex = breakIndex;
  }

  segments.push(frames.slice(startIndex));

  const rankedSegments = segments
    .map((segment) => {
      const startMs = segment[0]?.timestampMs ?? 0;
      const endMs = segment[segment.length - 1]?.timestampMs ?? startMs;
      const triggerDistance =
        typeof triggerTimestampMs === 'number'
          ? triggerTimestampMs < startMs
            ? startMs - triggerTimestampMs
            : triggerTimestampMs > endMs
              ? triggerTimestampMs - endMs
              : 0
          : 0;

      return {
        segment,
        endMs,
        triggerDistance
      };
    })
    .sort((left, right) => {
      if (
        typeof triggerTimestampMs === 'number' &&
        left.triggerDistance !== right.triggerDistance
      ) {
        return left.triggerDistance - right.triggerDistance;
      }

      if (left.segment.length !== right.segment.length) {
        return right.segment.length - left.segment.length;
      }

      return right.endMs - left.endMs;
    });

  return {
    frames: rankedSegments[0]?.segment ?? frames,
    normalized: true
  };
}

export function summarizeCapture(capture, filePath) {
  const metadata = capture.metadata ?? {};
  const chronology = normalizeCaptureFramesChronology(
    Array.isArray(capture.frames) ? capture.frames : [],
    typeof metadata.triggerTimestampMs === 'number'
      ? metadata.triggerTimestampMs
      : undefined
  );
  const frames = chronology.frames;

  if (frames.length === 0) {
    return {
      filePath,
      metadata,
      frameCount: 0,
      durationMs: 0,
      dominantState: 'unknown',
      eventArchetype: 'unknown',
      stateOccupancy: new Map(),
      intentOccupancy: new Map(),
      momentCounts: new Map(),
      peaks: {},
      means: {},
      beatInterval: {
        mean: 0,
        stdev: 0,
        sampleCount: 0
      },
      eventTimingDisposition: 'unknown',
      eventLatencyMs: null,
      warnings: [],
      findings: ['Capture contains no frames and cannot be analyzed.']
    };
  }

  const stateCounts = new Map();
  const intentCounts = new Map();
  const momentCounts = new Map();
  const warnings = new Set();
  const qualityTierCounts = new Map();
  const actCounts = new Map();
  const paletteStateCounts = new Map();
  const metrics = {
    subPressure: buildMetricTracker(),
    bassBody: buildMetricTracker(),
    lowMidBody: buildMetricTracker(),
    body: buildMetricTracker(),
    accent: buildMetricTracker(),
    shimmer: buildMetricTracker(),
    resonance: buildMetricTracker(),
    phraseTension: buildMetricTracker(),
    musicConfidence: buildMetricTracker(),
    peakConfidence: buildMetricTracker(),
    beatConfidence: buildMetricTracker(),
    dropImpact: buildMetricTracker(),
    sectionChange: buildMetricTracker(),
    releaseTail: buildMetricTracker(),
    speechConfidence: buildMetricTracker(),
    ambienceConfidence: buildMetricTracker(),
    ambientGlowBudget: buildMetricTracker(),
    eventGlowBudget: buildMetricTracker(),
    worldGlowSpend: buildMetricTracker(),
    heroGlowSpend: buildMetricTracker(),
    shellGlowSpend: buildMetricTracker(),
    preBeatLift: buildMetricTracker(),
    beatStrike: buildMetricTracker(),
    postBeatRelease: buildMetricTracker(),
    interBeatFloat: buildMetricTracker(),
    barTurn: buildMetricTracker(),
    phraseResolve: buildMetricTracker()
  };
  const beatIntervals = [];
  const firstTimestampMs = frames[0].timestampMs;
  const lastTimestampMs = frames[frames.length - 1].timestampMs;
  let heroHueMin = Number.POSITIVE_INFINITY;
  let heroHueMax = Number.NEGATIVE_INFINITY;
  let worldHueMin = Number.POSITIVE_INFINITY;
  let worldHueMax = Number.NEGATIVE_INFINITY;
  const showFamilyCounts = new Map();
  const macroEventCounts = new Map();
  const spendProfileCounts = new Map();
  const stageRingAuthorityCounts = new Map();
  const stageCueFamilyCounts = new Map();
  const stageShotClassCounts = new Map();
  const stageTransitionClassCounts = new Map();
  const stageTempoCadenceModeCounts = new Map();
  const atmosphereMatterStateCounts = new Map();
  const visualMotifCounts = new Map();
  const playableMotifSceneCounts = new Map();
  const playableMotifSceneProfileCounts = new Map();
  const playableMotifSceneSilhouetteFamilyCounts = new Map();
  const playableMotifSceneSurfaceRoleCounts = new Map();
  const compositorMaskFamilyCounts = new Map();
  const particleFieldJobCounts = new Map();
  let particleFieldJobTelemetryFrames = 0;
  const playableMotifSceneTransitionReasonCounts = new Map();
  const playableMotifSceneDriverCounts = new Map();
  const ringPostureCounts = new Map();
  const heroRoleCounts = new Map();
  const heroFormCounts = new Map();
  const heroFormReasonCounts = new Map();
  const paletteTransitionReasonCounts = new Map();
  const paletteBaseStateCounts = new Map();
  const assetLayerTotals = Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  );
  const assetLayerPeaks = Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  );
  const assetLayerActiveFrames = Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  );
  let exposureSum = 0;
  let exposurePeak = 0;
  let bloomStrengthSum = 0;
  let bloomStrengthPeak = 0;
  let bloomThresholdSum = 0;
  let bloomRadiusSum = 0;
  let bloomRadiusPeak = 0;
  let afterImageDampSum = 0;
  let afterImageDampPeak = 0;
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
  let overbrightFrames = 0;
  let overbrightSamples = 0;
  let overbrightPeak = 0;
  let heroScaleSamples = 0;
  let heroScaleSum = 0;
  let heroScalePeak = 0;
  let heroScreenSamples = 0;
  let heroScreenXSum = 0;
  let heroScreenYSum = 0;
  let ringAuthoritySamples = 0;
  let ringAuthoritySum = 0;
  let stageCeilingSamples = 0;
  let stageExposureCeilingSum = 0;
  let stageBloomCeilingSum = 0;
  let stageWashoutSuppressionSum = 0;
  let stageHeroScaleSamples = 0;
  let stageHeroScaleMinSum = 0;
  let stageHeroScaleMaxSum = 0;
  let stageCompositionSafetySamples = 0;
  let stageCompositionSafetySum = 0;
  let compositionSafetySamples = 0;
  let compositionSafetyUnsafeFrames = 0;
  let heroCoverageSamples = 0;
  let heroCoverageSum = 0;
  let heroCoveragePeak = 0;
  let heroOffCenterPenaltySamples = 0;
  let heroOffCenterPenaltySum = 0;
  let heroOffCenterPenaltyPeak = 0;
  let heroDepthPenaltySamples = 0;
  let heroDepthPenaltySum = 0;
  let heroDepthPenaltyPeak = 0;
  let chamberPresenceSamples = 0;
  let chamberPresenceSum = 0;
  let frameHierarchySamples = 0;
  let frameHierarchySum = 0;
  let ringBeltPersistenceSamples = 0;
  let ringBeltPersistenceSum = 0;
  let ringBeltPersistencePeak = 0;
  let wirefieldDensitySamples = 0;
  let wirefieldDensitySum = 0;
  let wirefieldDensityPeak = 0;
  let worldDominanceDeliveredSamples = 0;
  let worldDominanceDeliveredSum = 0;
  const signatureMomentCounts = new Map();
  const signatureMomentStyleCounts = new Map();
  let signatureMomentActiveFrames = 0;
  let signatureMomentIntensitySamples = 0;
  let signatureMomentIntensitySum = 0;
  let signatureMomentIntensityPeak = 0;
  let signatureMomentTriggerConfidenceSamples = 0;
  let signatureMomentTriggerConfidenceSum = 0;
  let signatureMomentForcedPreviewFrames = 0;
  let collapseScarSum = 0;
  let collapseScarPeak = 0;
  let cathedralOpenSum = 0;
  let cathedralOpenPeak = 0;
  let ghostResidueSum = 0;
  let ghostResiduePeak = 0;
  let silenceConstellationSum = 0;
  let silenceConstellationPeak = 0;
  let aftermathClearanceSamples = 0;
  let aftermathClearanceSum = 0;
  let postConsequenceSamples = 0;
  let postConsequenceSum = 0;
  let postOverprocessRiskSamples = 0;
  let postOverprocessRiskSum = 0;
  let postOverprocessRiskPeak = 0;
  let compositorSamples = 0;
  let compositorContrastLiftSum = 0;
  let compositorSaturationLiftSum = 0;
  let compositorOverprocessRiskSum = 0;
  let compositorOverprocessRiskPeak = 0;
  let perceptualSamples = 0;
  let perceptualContrastSum = 0;
  let perceptualColorfulnessSum = 0;
  let perceptualWashoutRiskSum = 0;
  let perceptualWashoutRiskPeak = 0;
  let plannedActiveHeroFormMatchFrames = 0;
  let plannedActiveHeroFormMatchSamples = 0;
  let semanticConfidenceSum = 0;
  let semanticConfidenceSamples = 0;
  let heroWorldHueDivergenceSum = 0;
  let heroWorldHueDivergenceSamples = 0;
  let unearnedChangeRiskSum = 0;
  let unearnedChangeRiskSamples = 0;
  let playableMotifSceneMotifMatchFrames = 0;
  let playableMotifSceneMotifMatchSamples = 0;
  let playableMotifScenePaletteMatchFrames = 0;
  let playableMotifScenePaletteMatchSamples = 0;
  let playableMotifSceneIntentMatchFrames = 0;
  let playableMotifSceneIntentMatchSamples = 0;
  let playableMotifSceneProfileMatchFrames = 0;
  let playableMotifSceneProfileMatchSamples = 0;
  let playableMotifSceneDistinctnessSum = 0;
  let playableMotifSceneDistinctnessSamples = 0;
  let playableMotifSceneSilhouetteConfidenceSum = 0;
  let playableMotifSceneSilhouetteConfidenceSamples = 0;
  let heroFormSwitchCountMin = Number.POSITIVE_INFINITY;
  let heroFormSwitchCountPeak = 0;

  for (const frame of frames) {
    const listening = frame.listeningFrame ?? {};
    const diagnostics = frame.diagnostics ?? {};
    const visual = frame.visualTelemetry ?? {};
    const normalizedAct = normalizeActiveAct(visual.activeAct, listening);
    const normalizedPaletteState = normalizePaletteState(visual.paletteState);

    incrementCounter(stateCounts, listening.showState ?? 'unknown');
    incrementCounter(intentCounts, listening.performanceIntent ?? 'unknown');
    incrementCounter(momentCounts, listening.momentKind ?? 'unknown');
    incrementCounter(qualityTierCounts, visual.qualityTier ?? 'unknown');
    incrementCounter(actCounts, normalizedAct);
    incrementCounter(paletteStateCounts, normalizedPaletteState);
    incrementCounter(
      visualMotifCounts,
      VISUAL_MOTIFS.includes(visual.visualMotif)
        ? visual.visualMotif
        : 'void-anchor'
    );
    incrementCounter(
      playableMotifSceneCounts,
      PLAYABLE_MOTIF_SCENES.includes(visual.activePlayableMotifScene)
        ? visual.activePlayableMotifScene
        : 'none'
    );
    incrementCounter(
      playableMotifSceneProfileCounts,
      PLAYABLE_MOTIF_SCENES.includes(visual.playableMotifSceneProfileId)
        ? visual.playableMotifSceneProfileId
        : 'none'
    );
    incrementCounter(
      playableMotifSceneSilhouetteFamilyCounts,
      SCENE_SILHOUETTE_FAMILIES.includes(visual.playableMotifSceneSilhouetteFamily)
        ? visual.playableMotifSceneSilhouetteFamily
        : 'none'
    );
    incrementCounter(
      playableMotifSceneSurfaceRoleCounts,
      SCENE_SURFACE_ROLES.includes(visual.playableMotifSceneSurfaceRole)
        ? visual.playableMotifSceneSurfaceRole
        : 'none'
    );
    incrementCounter(
      compositorMaskFamilyCounts,
      COMPOSITOR_MASK_FAMILIES.includes(visual.compositorMaskFamily)
        ? visual.compositorMaskFamily
        : 'none'
    );
    incrementCounter(
      particleFieldJobCounts,
      PARTICLE_FIELD_JOBS.includes(visual.particleFieldJob)
        ? visual.particleFieldJob
        : 'none'
    );
    if (PARTICLE_FIELD_JOBS.includes(visual.particleFieldJob)) {
      particleFieldJobTelemetryFrames += 1;
    }
    incrementCounter(
      playableMotifSceneTransitionReasonCounts,
      PLAYABLE_MOTIF_SCENE_TRANSITION_REASONS.includes(
        visual.playableMotifSceneTransitionReason
      )
        ? visual.playableMotifSceneTransitionReason
        : 'hold'
    );
    incrementCounter(
      playableMotifSceneDriverCounts,
      PLAYABLE_MOTIF_SCENE_DRIVERS.includes(visual.playableMotifSceneDriver)
        ? visual.playableMotifSceneDriver
        : 'hold'
    );
    incrementCounter(
      ringPostureCounts,
      RING_POSTURES.includes(visual.ringPosture)
        ? visual.ringPosture
        : 'background-scaffold'
    );
    if (typeof visual.playableMotifSceneMotifMatch === 'boolean') {
      playableMotifSceneMotifMatchSamples += 1;
      if (visual.playableMotifSceneMotifMatch) {
        playableMotifSceneMotifMatchFrames += 1;
      }
    }
    if (typeof visual.playableMotifScenePaletteMatch === 'boolean') {
      playableMotifScenePaletteMatchSamples += 1;
      if (visual.playableMotifScenePaletteMatch) {
        playableMotifScenePaletteMatchFrames += 1;
      }
    }
    if (typeof visual.playableMotifSceneIntentMatch === 'boolean') {
      playableMotifSceneIntentMatchSamples += 1;
      if (visual.playableMotifSceneIntentMatch) {
        playableMotifSceneIntentMatchFrames += 1;
      }
    }
    if (typeof visual.playableMotifSceneProfileMatch === 'boolean') {
      playableMotifSceneProfileMatchSamples += 1;
      if (visual.playableMotifSceneProfileMatch) {
        playableMotifSceneProfileMatchFrames += 1;
      }
    }
    if (typeof visual.playableMotifSceneDistinctness === 'number') {
      playableMotifSceneDistinctnessSamples += 1;
      playableMotifSceneDistinctnessSum += visual.playableMotifSceneDistinctness;
    }
    if (typeof visual.playableMotifSceneSilhouetteConfidence === 'number') {
      playableMotifSceneSilhouetteConfidenceSamples += 1;
      playableMotifSceneSilhouetteConfidenceSum +=
        visual.playableMotifSceneSilhouetteConfidence;
    }
    for (const layer of VISUAL_ASSET_LAYERS) {
      const activity = Math.max(0, visual.assetLayerActivity?.[layer] ?? 0);
      assetLayerTotals[layer] += activity;
      assetLayerPeaks[layer] = Math.max(assetLayerPeaks[layer], activity);
      if (activity > 0.01) {
        assetLayerActiveFrames[layer] += 1;
      }
    }
    incrementCounter(
      heroRoleCounts,
      HERO_ROLES.includes(visual.heroRole) ? visual.heroRole : 'supporting'
    );
    incrementCounter(
      heroFormCounts,
      HERO_FORMS.includes(visual.activeHeroForm)
        ? visual.activeHeroForm
        : HERO_FORMS.includes(visual.stageHeroForm)
          ? visual.stageHeroForm
          : 'orb'
    );
    incrementCounter(
      heroFormReasonCounts,
      HERO_FORM_REASONS.includes(visual.heroFormReason)
        ? visual.heroFormReason
        : 'hold'
    );
    incrementCounter(
      paletteTransitionReasonCounts,
      PALETTE_TRANSITION_REASONS.includes(visual.paletteTransitionReason)
        ? visual.paletteTransitionReason
        : 'hold'
    );
    incrementCounter(
      paletteBaseStateCounts,
      COVERAGE_POLICY['palette states'].core
        .concat(COVERAGE_POLICY['palette states'].rare)
        .includes(visual.paletteBaseState)
        ? visual.paletteBaseState
        : normalizedPaletteState
    );
    incrementCounter(showFamilyCounts, visual.showFamily ?? 'unknown');
    const atmosphereMatterState = ATMOSPHERE_MATTER_STATES.includes(
      visual.atmosphereMatterState
    )
      ? visual.atmosphereMatterState
      : 'gas';
    incrementCounter(atmosphereMatterStateCounts, atmosphereMatterState);
    for (const macroEvent of visual.macroEventsActive ?? []) {
      incrementCounter(macroEventCounts, macroEvent);
    }
    if (visual.stageSpendProfile === 'withheld' || visual.stageSpendProfile === 'earned' || visual.stageSpendProfile === 'peak') {
      incrementCounter(spendProfileCounts, visual.stageSpendProfile);
    }
    if (
      visual.stageCueFamily === 'brood' ||
      visual.stageCueFamily === 'gather' ||
      visual.stageCueFamily === 'reveal' ||
      visual.stageCueFamily === 'rupture' ||
      visual.stageCueFamily === 'release' ||
      visual.stageCueFamily === 'haunt' ||
      visual.stageCueFamily === 'reset'
    ) {
      incrementCounter(stageCueFamilyCounts, visual.stageCueFamily);
    }
    if (
      visual.stageRingAuthority === 'background-scaffold' ||
      visual.stageRingAuthority === 'framing-architecture' ||
      visual.stageRingAuthority === 'event-platform'
    ) {
      incrementCounter(stageRingAuthorityCounts, visual.stageRingAuthority);
    }
    if (
      visual.stageShotClass === 'anchor' ||
      visual.stageShotClass === 'pressure' ||
      visual.stageShotClass === 'rupture' ||
      visual.stageShotClass === 'worldTakeover' ||
      visual.stageShotClass === 'aftermath' ||
      visual.stageShotClass === 'isolate'
    ) {
      incrementCounter(stageShotClassCounts, visual.stageShotClass);
    }
    if (
      visual.stageTransitionClass === 'hold' ||
      visual.stageTransitionClass === 'wipe' ||
      visual.stageTransitionClass === 'collapse' ||
      visual.stageTransitionClass === 'iris' ||
      visual.stageTransitionClass === 'blackoutCut' ||
      visual.stageTransitionClass === 'residueDissolve' ||
      visual.stageTransitionClass === 'vectorHandoff'
    ) {
      incrementCounter(stageTransitionClassCounts, visual.stageTransitionClass);
    }
    if (
      visual.stageTempoCadenceMode === 'float' ||
      visual.stageTempoCadenceMode === 'metered' ||
      visual.stageTempoCadenceMode === 'driving' ||
      visual.stageTempoCadenceMode === 'surge' ||
      visual.stageTempoCadenceMode === 'aftermath'
    ) {
      incrementCounter(stageTempoCadenceModeCounts, visual.stageTempoCadenceMode);
    }
    exposureSum += visual.exposure ?? 0;
    exposurePeak = Math.max(exposurePeak, visual.exposure ?? 0);
    bloomStrengthSum += visual.bloomStrength ?? 0;
    bloomStrengthPeak = Math.max(bloomStrengthPeak, visual.bloomStrength ?? 0);
    bloomThresholdSum += visual.bloomThreshold ?? 0;
    bloomRadiusSum += visual.bloomRadius ?? 0.1;
    bloomRadiusPeak = Math.max(bloomRadiusPeak, visual.bloomRadius ?? 0.1);
    afterImageDampSum += visual.afterImageDamp ?? 0.78;
    afterImageDampPeak = Math.max(afterImageDampPeak, visual.afterImageDamp ?? 0.78);
    atmosphereGasSum += visual.atmosphereGas ?? 1;
    atmosphereLiquidSum += visual.atmosphereLiquid ?? 0;
    atmospherePlasmaSum += visual.atmospherePlasma ?? 0;
    atmosphereCrystalSum += visual.atmosphereCrystal ?? 0;
    atmospherePressureSum += visual.atmospherePressure ?? 0;
    atmospherePressurePeak = Math.max(
      atmospherePressurePeak,
      visual.atmospherePressure ?? 0
    );
    atmosphereIonizationSum += visual.atmosphereIonization ?? 0;
    atmosphereIonizationPeak = Math.max(
      atmosphereIonizationPeak,
      visual.atmosphereIonization ?? 0
    );
    atmosphereResidueSum += visual.atmosphereResidue ?? 0;
    atmosphereResiduePeak = Math.max(
      atmosphereResiduePeak,
      visual.atmosphereResidue ?? 0
    );
    atmosphereStructureRevealSum += visual.atmosphereStructureReveal ?? 0;
    atmosphereStructureRevealPeak = Math.max(
      atmosphereStructureRevealPeak,
      visual.atmosphereStructureReveal ?? 0
    );
    if (typeof visual.overbright === 'number') {
      overbrightSamples += 1;
      overbrightPeak = Math.max(overbrightPeak, visual.overbright);
      if (visual.overbright > 0.08) {
        overbrightFrames += 1;
      }
    }
    if (typeof visual.heroScale === 'number') {
      heroScaleSamples += 1;
      heroScaleSum += visual.heroScale;
      heroScalePeak = Math.max(heroScalePeak, visual.heroScale);
    }
    if (typeof visual.heroScreenX === 'number' && typeof visual.heroScreenY === 'number') {
      heroScreenSamples += 1;
      heroScreenXSum += visual.heroScreenX;
      heroScreenYSum += visual.heroScreenY;
    }
    if (typeof visual.ringAuthority === 'number') {
      ringAuthoritySamples += 1;
      ringAuthoritySum += visual.ringAuthority;
    }
    if (
      typeof visual.stageExposureCeiling === 'number' &&
      typeof visual.stageBloomCeiling === 'number' &&
      typeof visual.stageWashoutSuppression === 'number'
    ) {
      stageCeilingSamples += 1;
      stageExposureCeilingSum += visual.stageExposureCeiling;
      stageBloomCeilingSum += visual.stageBloomCeiling;
      stageWashoutSuppressionSum += visual.stageWashoutSuppression;
    }
    if (
      typeof visual.stageHeroScaleMin === 'number' &&
      typeof visual.stageHeroScaleMax === 'number'
    ) {
      stageHeroScaleSamples += 1;
      stageHeroScaleMinSum += visual.stageHeroScaleMin;
      stageHeroScaleMaxSum += visual.stageHeroScaleMax;
    }
    if (typeof visual.stageCompositionSafety === 'number') {
      stageCompositionSafetySamples += 1;
      stageCompositionSafetySum += visual.stageCompositionSafety;
    }
    if (typeof visual.compositionSafetyFlag === 'boolean') {
      compositionSafetySamples += 1;
      if (visual.compositionSafetyFlag) {
        compositionSafetyUnsafeFrames += 1;
      }
    }
    if (typeof visual.heroCoverageEstimate === 'number') {
      heroCoverageSamples += 1;
      heroCoverageSum += visual.heroCoverageEstimate;
      heroCoveragePeak = Math.max(heroCoveragePeak, visual.heroCoverageEstimate);
    }
    if (typeof visual.heroOffCenterPenalty === 'number') {
      heroOffCenterPenaltySamples += 1;
      heroOffCenterPenaltySum += visual.heroOffCenterPenalty;
      heroOffCenterPenaltyPeak = Math.max(
        heroOffCenterPenaltyPeak,
        visual.heroOffCenterPenalty
      );
    }
    if (typeof visual.heroDepthPenalty === 'number') {
      heroDepthPenaltySamples += 1;
      heroDepthPenaltySum += visual.heroDepthPenalty;
      heroDepthPenaltyPeak = Math.max(heroDepthPenaltyPeak, visual.heroDepthPenalty);
    }
    if (typeof visual.chamberPresenceScore === 'number') {
      chamberPresenceSamples += 1;
      chamberPresenceSum += visual.chamberPresenceScore;
    }
    if (typeof visual.frameHierarchyScore === 'number') {
      frameHierarchySamples += 1;
      frameHierarchySum += visual.frameHierarchyScore;
    }
    if (typeof visual.ringBeltPersistence === 'number') {
      ringBeltPersistenceSamples += 1;
      ringBeltPersistenceSum += visual.ringBeltPersistence;
      ringBeltPersistencePeak = Math.max(
        ringBeltPersistencePeak,
        visual.ringBeltPersistence
      );
    }
    if (typeof visual.wirefieldDensityScore === 'number') {
      wirefieldDensitySamples += 1;
      wirefieldDensitySum += visual.wirefieldDensityScore;
      wirefieldDensityPeak = Math.max(
        wirefieldDensityPeak,
        visual.wirefieldDensityScore
      );
    }
    if (typeof visual.worldDominanceDelivered === 'number') {
      worldDominanceDeliveredSamples += 1;
      worldDominanceDeliveredSum += visual.worldDominanceDelivered;
    }
    const activeSignatureMoment = SIGNATURE_MOMENT_KINDS.includes(
      visual.activeSignatureMoment
    )
      ? visual.activeSignatureMoment
      : 'none';
    incrementCounter(signatureMomentCounts, activeSignatureMoment);
    if (activeSignatureMoment !== 'none') {
      signatureMomentActiveFrames += 1;
    }
    if (activeSignatureMoment !== 'none') {
      const signatureMomentStyle = SIGNATURE_MOMENT_STYLES.includes(
        visual.signatureMomentStyle
      )
        ? visual.signatureMomentStyle
        : 'contrast-mythic';
      incrementCounter(signatureMomentStyleCounts, signatureMomentStyle);
    }
    if (typeof visual.signatureMomentIntensity === 'number') {
      signatureMomentIntensitySamples += 1;
      signatureMomentIntensitySum += visual.signatureMomentIntensity;
      signatureMomentIntensityPeak = Math.max(
        signatureMomentIntensityPeak,
        visual.signatureMomentIntensity
      );
    }
    if (typeof visual.signatureMomentTriggerConfidence === 'number') {
      signatureMomentTriggerConfidenceSamples += 1;
      signatureMomentTriggerConfidenceSum +=
        visual.signatureMomentTriggerConfidence;
    }
    if (visual.signatureMomentForcedPreview === true) {
      signatureMomentForcedPreviewFrames += 1;
    }
    if (typeof visual.collapseScarAmount === 'number') {
      collapseScarSum += visual.collapseScarAmount;
      collapseScarPeak = Math.max(collapseScarPeak, visual.collapseScarAmount);
    }
    if (typeof visual.cathedralOpenAmount === 'number') {
      cathedralOpenSum += visual.cathedralOpenAmount;
      cathedralOpenPeak = Math.max(cathedralOpenPeak, visual.cathedralOpenAmount);
    }
    if (typeof visual.ghostResidueAmount === 'number') {
      ghostResidueSum += visual.ghostResidueAmount;
      ghostResiduePeak = Math.max(ghostResiduePeak, visual.ghostResidueAmount);
    }
    if (typeof visual.silenceConstellationAmount === 'number') {
      silenceConstellationSum += visual.silenceConstellationAmount;
      silenceConstellationPeak = Math.max(
        silenceConstellationPeak,
        visual.silenceConstellationAmount
      );
    }
    if (typeof visual.aftermathClearance === 'number') {
      aftermathClearanceSamples += 1;
      aftermathClearanceSum += visual.aftermathClearance;
    }
    if (typeof visual.postConsequenceIntensity === 'number') {
      postConsequenceSamples += 1;
      postConsequenceSum += visual.postConsequenceIntensity;
    }
    if (typeof visual.postOverprocessRisk === 'number') {
      postOverprocessRiskSamples += 1;
      postOverprocessRiskSum += visual.postOverprocessRisk;
      postOverprocessRiskPeak = Math.max(
        postOverprocessRiskPeak,
        visual.postOverprocessRisk
      );
    }
    if (
      typeof visual.compositorContrastLift === 'number' ||
      typeof visual.compositorSaturationLift === 'number' ||
      typeof visual.compositorOverprocessRisk === 'number'
    ) {
      compositorSamples += 1;
      compositorContrastLiftSum += visual.compositorContrastLift ?? 0;
      compositorSaturationLiftSum += visual.compositorSaturationLift ?? 0;
      compositorOverprocessRiskSum += visual.compositorOverprocessRisk ?? 0;
      compositorOverprocessRiskPeak = Math.max(
        compositorOverprocessRiskPeak,
        visual.compositorOverprocessRisk ?? 0
      );
    }
    if (
      typeof visual.perceptualContrastScore === 'number' ||
      typeof visual.perceptualColorfulnessScore === 'number' ||
      typeof visual.perceptualWashoutRisk === 'number'
    ) {
      perceptualSamples += 1;
      perceptualContrastSum += visual.perceptualContrastScore ?? 0;
      perceptualColorfulnessSum += visual.perceptualColorfulnessScore ?? 0;
      perceptualWashoutRiskSum += visual.perceptualWashoutRisk ?? 0;
      perceptualWashoutRiskPeak = Math.max(
        perceptualWashoutRiskPeak,
        visual.perceptualWashoutRisk ?? 0
      );
    }
    if (typeof visual.plannedActiveHeroFormMatch === 'boolean') {
      plannedActiveHeroFormMatchSamples += 1;
      if (visual.plannedActiveHeroFormMatch) {
        plannedActiveHeroFormMatchFrames += 1;
      }
    }
    if (typeof visual.semanticConfidence === 'number') {
      semanticConfidenceSamples += 1;
      semanticConfidenceSum += visual.semanticConfidence;
    }
    if (typeof visual.heroWorldHueDivergence === 'number') {
      heroWorldHueDivergenceSamples += 1;
      heroWorldHueDivergenceSum += visual.heroWorldHueDivergence;
    }
    if (typeof visual.unearnedChangeRisk === 'number') {
      unearnedChangeRiskSamples += 1;
      unearnedChangeRiskSum += visual.unearnedChangeRisk;
    }
    if (typeof visual.heroFormSwitchCount === 'number') {
      heroFormSwitchCountMin = Math.min(
        heroFormSwitchCountMin,
        visual.heroFormSwitchCount
      );
      heroFormSwitchCountPeak = Math.max(heroFormSwitchCountPeak, visual.heroFormSwitchCount);
    }

    updateMetricTracker(metrics.subPressure, listening.subPressure ?? 0);
    updateMetricTracker(metrics.bassBody, listening.bassBody ?? 0);
    updateMetricTracker(metrics.lowMidBody, listening.lowMidBody ?? 0);
    updateMetricTracker(metrics.body, listening.body ?? 0);
    updateMetricTracker(metrics.accent, listening.accent ?? 0);
    updateMetricTracker(metrics.shimmer, listening.shimmer ?? 0);
    updateMetricTracker(metrics.resonance, listening.resonance ?? 0);
    updateMetricTracker(metrics.phraseTension, listening.phraseTension ?? 0);
    updateMetricTracker(metrics.musicConfidence, listening.musicConfidence ?? 0);
    updateMetricTracker(metrics.peakConfidence, listening.peakConfidence ?? 0);
    updateMetricTracker(metrics.beatConfidence, listening.beatConfidence ?? 0);
    updateMetricTracker(metrics.dropImpact, listening.dropImpact ?? 0);
    updateMetricTracker(metrics.sectionChange, listening.sectionChange ?? 0);
    updateMetricTracker(metrics.releaseTail, listening.releaseTail ?? 0);
    updateMetricTracker(metrics.speechConfidence, listening.speechConfidence ?? 0);
    updateMetricTracker(metrics.ambienceConfidence, listening.ambienceConfidence ?? 0);
    updateMetricTracker(metrics.ambientGlowBudget, visual.ambientGlowBudget ?? 0);
    updateMetricTracker(metrics.eventGlowBudget, visual.eventGlowBudget ?? 0);
    updateMetricTracker(metrics.worldGlowSpend, visual.worldGlowSpend ?? 0);
    updateMetricTracker(metrics.heroGlowSpend, visual.heroGlowSpend ?? 0);
    updateMetricTracker(metrics.shellGlowSpend, visual.shellGlowSpend ?? 0);
    updateMetricTracker(
      metrics.preBeatLift,
      visual.temporalWindows?.preBeatLift ?? 0
    );
    updateMetricTracker(metrics.beatStrike, visual.temporalWindows?.beatStrike ?? 0);
    updateMetricTracker(
      metrics.postBeatRelease,
      visual.temporalWindows?.postBeatRelease ?? 0
    );
    updateMetricTracker(
      metrics.interBeatFloat,
      visual.temporalWindows?.interBeatFloat ?? 0
    );
    updateMetricTracker(metrics.barTurn, visual.temporalWindows?.barTurn ?? 0);
    updateMetricTracker(
      metrics.phraseResolve,
      visual.temporalWindows?.phraseResolve ?? 0
    );
    heroHueMin = Math.min(heroHueMin, visual.heroHue ?? Number.POSITIVE_INFINITY);
    heroHueMax = Math.max(heroHueMax, visual.heroHue ?? Number.NEGATIVE_INFINITY);
    worldHueMin = Math.min(worldHueMin, visual.worldHue ?? Number.POSITIVE_INFINITY);
    worldHueMax = Math.max(worldHueMax, visual.worldHue ?? Number.NEGATIVE_INFINITY);

    if (typeof diagnostics.beatIntervalMs === 'number' && diagnostics.beatIntervalMs > 0) {
      beatIntervals.push(diagnostics.beatIntervalMs);
    }

    for (const warning of diagnostics.warnings ?? []) {
      warnings.add(warning);
    }
  }

  const metricMeans = {};
  const metricPeaks = {};

  for (const [key, tracker] of Object.entries(metrics)) {
    const result = finalizeMetricTracker(tracker, frames.length);
    metricMeans[key] = result.mean;
    metricPeaks[key] = result.peak;
  }

  const beatMean =
    beatIntervals.length > 0
      ? beatIntervals.reduce((sum, value) => sum + value, 0) / beatIntervals.length
      : 0;
  const beatVariance =
    beatIntervals.length > 0
      ? beatIntervals.reduce((sum, value) => sum + (value - beatMean) ** 2, 0) /
        beatIntervals.length
      : 0;
  const durationMs = Math.max(0, lastTimestampMs - firstTimestampMs);
  const longestRuns = {
    showState: summarizeLongestRun(frames, (frame) => frame.listeningFrame?.showState),
    performanceIntent: summarizeLongestRun(
      frames,
      (frame) => frame.listeningFrame?.performanceIntent
    ),
    stageCueFamily: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.stageCueFamily
    ),
    stageShotClass: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.stageShotClass
    ),
    stageTransitionClass: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.stageTransitionClass
    ),
    stageTempoCadenceMode: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.stageTempoCadenceMode
    )
  };
  const findings = [];
  const triggerKind = capture.metadata?.triggerKind ?? 'manual';
  const surgeRatio = (stateCounts.get('surge') ?? 0) / frames.length;
  const generativeRatio = (stateCounts.get('generative') ?? 0) / frames.length;
  const aftermathRatio = (stateCounts.get('aftermath') ?? 0) / frames.length;
  const cadenceRatio = (stateCounts.get('cadence') ?? 0) / frames.length;
  const dominantState =
    [...stateCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'unknown';
  const eventArchetype = resolveEventArchetype(metricPeaks, dominantState);
  const dominantQualityTier =
    [...qualityTierCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'unknown';
  const dominantAct =
    [...actCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'unknown';
  const dominantPaletteState =
    [...paletteStateCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'unknown';
  const dominantAtmosphereMatterState =
    [...atmosphereMatterStateCounts.entries()].sort(
      (left, right) => right[1] - left[1]
    )[0]?.[0] ?? 'gas';
  const dominantSignatureMoment =
    [...signatureMomentCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    'none';
  const heroHueRange =
    Number.isFinite(heroHueMin) && Number.isFinite(heroHueMax)
      ? heroHueMax - heroHueMin
      : 0;
  const worldHueRange =
    Number.isFinite(worldHueMin) && Number.isFinite(worldHueMax)
      ? worldHueMax - worldHueMin
      : 0;
  const visualSummary = mergeVisualSummaryEnhancements(metadata, {
    dominantQualityTier,
    dominantPaletteState,
    visualMotifSpread: Object.fromEntries(
      VISUAL_MOTIFS.map((kind) => [
        kind,
        (visualMotifCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantVisualMotif:
      [...visualMotifCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'void-anchor',
    playableMotifSceneSpread: Object.fromEntries(
      PLAYABLE_MOTIF_SCENES.map((kind) => [
        kind,
        (playableMotifSceneCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantPlayableMotifScene:
      [...playableMotifSceneCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'none',
    playableMotifSceneProfileSpread: Object.fromEntries(
      PLAYABLE_MOTIF_SCENES.map((kind) => [
        kind,
        (playableMotifSceneProfileCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantPlayableMotifSceneProfile:
      [...playableMotifSceneProfileCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'none',
    playableMotifSceneSilhouetteFamilySpread: Object.fromEntries(
      SCENE_SILHOUETTE_FAMILIES.map((kind) => [
        kind,
        (playableMotifSceneSilhouetteFamilyCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantPlayableMotifSceneSilhouetteFamily:
      [...playableMotifSceneSilhouetteFamilyCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'none',
    playableMotifSceneSurfaceRoleSpread: Object.fromEntries(
      SCENE_SURFACE_ROLES.map((kind) => [
        kind,
        (playableMotifSceneSurfaceRoleCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantPlayableMotifSceneSurfaceRole:
      [...playableMotifSceneSurfaceRoleCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'none',
    compositorMaskFamilySpread: Object.fromEntries(
      COMPOSITOR_MASK_FAMILIES.map((kind) => [
        kind,
        (compositorMaskFamilyCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantCompositorMaskFamily:
      [...compositorMaskFamilyCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'none',
    particleFieldJobSpread: Object.fromEntries(
      PARTICLE_FIELD_JOBS.map((kind) => [
        kind,
        (particleFieldJobCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    particleFieldJobTelemetryRate: particleFieldJobTelemetryFrames / frames.length,
    dominantParticleFieldJob:
      [...particleFieldJobCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'none',
    playableMotifSceneTransitionReasonSpread: Object.fromEntries(
      PLAYABLE_MOTIF_SCENE_TRANSITION_REASONS.map((reason) => [
        reason,
        (playableMotifSceneTransitionReasonCounts.get(reason) ?? 0) / frames.length
      ])
    ),
    dominantPlayableMotifSceneTransitionReason:
      [...playableMotifSceneTransitionReasonCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'hold',
    playableMotifSceneDriverSpread: Object.fromEntries(
      PLAYABLE_MOTIF_SCENE_DRIVERS.map((driver) => [
        driver,
        (playableMotifSceneDriverCounts.get(driver) ?? 0) / frames.length
      ])
    ),
    dominantPlayableMotifSceneDriver:
      [...playableMotifSceneDriverCounts.entries()].sort(
        (left, right) => right[1] - left[1]
      )[0]?.[0] ?? 'hold',
    ringPostureSpread: Object.fromEntries(
      RING_POSTURES.map((posture) => [
        posture,
        (ringPostureCounts.get(posture) ?? 0) / frames.length
      ])
    ),
    dominantRingPosture:
      [...ringPostureCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'background-scaffold',
    playableMotifSceneLongestRunMs: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.activePlayableMotifScene
    ).durationMs,
    playableMotifSceneMotifMatchRate:
      playableMotifSceneMotifMatchSamples > 0
        ? playableMotifSceneMotifMatchFrames /
          playableMotifSceneMotifMatchSamples
        : undefined,
    playableMotifScenePaletteMatchRate:
      playableMotifScenePaletteMatchSamples > 0
        ? playableMotifScenePaletteMatchFrames /
          playableMotifScenePaletteMatchSamples
        : undefined,
    playableMotifSceneIntentMatchRate:
      playableMotifSceneIntentMatchSamples > 0
        ? playableMotifSceneIntentMatchFrames /
          playableMotifSceneIntentMatchSamples
        : undefined,
    playableMotifSceneProfileMatchRate:
      playableMotifSceneProfileMatchSamples > 0
        ? playableMotifSceneProfileMatchFrames /
          playableMotifSceneProfileMatchSamples
        : undefined,
    playableMotifSceneDistinctnessMean:
      playableMotifSceneDistinctnessSamples > 0
        ? playableMotifSceneDistinctnessSum /
          playableMotifSceneDistinctnessSamples
        : undefined,
    playableMotifSceneSilhouetteConfidenceMean:
      playableMotifSceneSilhouetteConfidenceSamples > 0
        ? playableMotifSceneSilhouetteConfidenceSum /
          playableMotifSceneSilhouetteConfidenceSamples
        : undefined,
    heroRoleSpread: Object.fromEntries(
      HERO_ROLES.map((role) => [role, (heroRoleCounts.get(role) ?? 0) / frames.length])
    ),
    dominantHeroRole:
      [...heroRoleCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'supporting',
    heroFormSpread: Object.fromEntries(
      HERO_FORMS.map((form) => [form, (heroFormCounts.get(form) ?? 0) / frames.length])
    ),
    dominantHeroForm:
      [...heroFormCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'orb',
    heroFormReasonSpread: Object.fromEntries(
      HERO_FORM_REASONS.map((reason) => [
        reason,
        (heroFormReasonCounts.get(reason) ?? 0) / frames.length
      ])
    ),
    dominantHeroFormReason:
      [...heroFormReasonCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'hold',
    paletteTransitionReasonSpread: Object.fromEntries(
      PALETTE_TRANSITION_REASONS.map((reason) => [
        reason,
        (paletteTransitionReasonCounts.get(reason) ?? 0) / frames.length
      ])
    ),
    dominantPaletteTransitionReason:
      [...paletteTransitionReasonCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'hold',
    paletteBaseStateSpread: Object.fromEntries(
      COVERAGE_POLICY['palette states'].core
        .concat(COVERAGE_POLICY['palette states'].rare)
        .map((state) => [state, (paletteBaseStateCounts.get(state) ?? 0) / frames.length])
    ),
    dominantPaletteBaseState:
      [...paletteBaseStateCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'void-cyan',
    paletteBaseLongestRunMs: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.paletteBaseState
    ).durationMs,
    heroFormLongestRunMs: summarizeLongestRun(
      frames,
      (frame) => frame.visualTelemetry?.activeHeroForm ?? frame.visualTelemetry?.stageHeroForm
    ).durationMs,
    heroFormSwitchesPerMinute:
      Math.max(
        0,
        heroFormSwitchCountPeak -
          (Number.isFinite(heroFormSwitchCountMin) ? heroFormSwitchCountMin : 0)
      ) /
      Math.max(0.016, (lastTimestampMs - firstTimestampMs) / 60000),
    plannedActiveHeroFormMatchRate:
      plannedActiveHeroFormMatchSamples > 0
        ? plannedActiveHeroFormMatchFrames / plannedActiveHeroFormMatchSamples
        : undefined,
    heroWorldHueDivergenceMean:
      heroWorldHueDivergenceSamples > 0
        ? heroWorldHueDivergenceSum / heroWorldHueDivergenceSamples
        : undefined,
    semanticConfidenceMean:
      semanticConfidenceSamples > 0
        ? semanticConfidenceSum / semanticConfidenceSamples
        : undefined,
    unearnedChangeRiskMean:
      unearnedChangeRiskSamples > 0
        ? unearnedChangeRiskSum / unearnedChangeRiskSamples
        : undefined,
    exposureMean: exposureSum / frames.length,
    exposurePeak,
    bloomStrengthMean: bloomStrengthSum / frames.length,
    bloomStrengthPeak,
    bloomThresholdMean: bloomThresholdSum / frames.length,
    bloomRadiusMean: bloomRadiusSum / frames.length,
    bloomRadiusPeak,
    afterImageDampMean: afterImageDampSum / frames.length,
    afterImageDampPeak,
    ambientGlowMean: metricMeans.ambientGlowBudget,
    ambientGlowPeak: metricPeaks.ambientGlowBudget,
    eventGlowMean: metricMeans.eventGlowBudget,
    eventGlowPeak: metricPeaks.eventGlowBudget,
    worldGlowMean: metricMeans.worldGlowSpend,
    heroGlowMean: metricMeans.heroGlowSpend,
    shellGlowMean: metricMeans.shellGlowSpend,
    atmosphereMatterStateSpread: Object.fromEntries(
      ATMOSPHERE_MATTER_STATES.map((state) => [
        state,
        (atmosphereMatterStateCounts.get(state) ?? 0) / frames.length
      ])
    ),
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
    signatureMomentSpread: Object.fromEntries(
      SIGNATURE_MOMENT_KINDS.map((kind) => [
        kind,
        (signatureMomentCounts.get(kind) ?? 0) / frames.length
      ])
    ),
    dominantSignatureMoment,
    signatureMomentStyleSpread: Object.fromEntries(
      SIGNATURE_MOMENT_STYLES.map((style) => [
        style,
        signatureMomentActiveFrames > 0
          ? (signatureMomentStyleCounts.get(style) ?? 0) /
            Math.max(1, signatureMomentActiveFrames)
          : 0
      ])
    ),
    dominantSignatureMomentStyle:
      [...signatureMomentStyleCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'contrast-mythic',
    signatureMomentActiveRate: signatureMomentActiveFrames / frames.length,
    signatureMomentIntensityMean:
      signatureMomentIntensitySamples > 0
        ? signatureMomentIntensitySum / signatureMomentIntensitySamples
        : undefined,
    signatureMomentIntensityPeak:
      signatureMomentIntensitySamples > 0 ? signatureMomentIntensityPeak : undefined,
    signatureMomentTriggerConfidenceMean:
      signatureMomentTriggerConfidenceSamples > 0
        ? signatureMomentTriggerConfidenceSum /
          signatureMomentTriggerConfidenceSamples
        : undefined,
    signatureMomentForcedPreviewRate:
      signatureMomentForcedPreviewFrames / frames.length,
    collapseScarMean: collapseScarSum / frames.length,
    collapseScarPeak,
    cathedralOpenMean: cathedralOpenSum / frames.length,
    cathedralOpenPeak,
    ghostResidueMean: ghostResidueSum / frames.length,
    ghostResiduePeak,
    silenceConstellationMean: silenceConstellationSum / frames.length,
    silenceConstellationPeak,
    aftermathClearanceMean:
      aftermathClearanceSamples > 0
        ? aftermathClearanceSum / aftermathClearanceSamples
        : undefined,
    postConsequenceMean:
      postConsequenceSamples > 0 ? postConsequenceSum / postConsequenceSamples : undefined,
    postOverprocessRiskMean:
      postOverprocessRiskSamples > 0
        ? postOverprocessRiskSum / postOverprocessRiskSamples
        : undefined,
    postOverprocessRiskPeak:
      postOverprocessRiskSamples > 0 ? postOverprocessRiskPeak : undefined,
    compositorContrastLiftMean:
      compositorSamples > 0 ? compositorContrastLiftSum / compositorSamples : undefined,
    compositorSaturationLiftMean:
      compositorSamples > 0 ? compositorSaturationLiftSum / compositorSamples : undefined,
    compositorOverprocessRiskMean:
      compositorSamples > 0
        ? compositorOverprocessRiskSum / compositorSamples
        : undefined,
    compositorOverprocessRiskPeak:
      compositorSamples > 0 ? compositorOverprocessRiskPeak : undefined,
    perceptualContrastMean:
      perceptualSamples > 0 ? perceptualContrastSum / perceptualSamples : undefined,
    perceptualColorfulnessMean:
      perceptualSamples > 0
        ? perceptualColorfulnessSum / perceptualSamples
        : undefined,
    perceptualWashoutRiskMean:
      perceptualSamples > 0 ? perceptualWashoutRiskSum / perceptualSamples : undefined,
    perceptualWashoutRiskPeak:
      perceptualSamples > 0 ? perceptualWashoutRiskPeak : undefined,
    dominantSpendProfile:
      [...spendProfileCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      undefined,
    dominantShowFamily:
      [...showFamilyCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'unknown',
    showFamilySpread: Object.fromEntries(
      [...showFamilyCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    stageCueFamilySpread: Object.fromEntries(
      [...stageCueFamilyCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantStageCueFamily:
      [...stageCueFamilyCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      undefined,
    spendProfileSpread: Object.fromEntries(
      [...spendProfileCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    actSpread: Object.fromEntries(
      [...actCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantAct,
    macroEventSpread: Object.fromEntries(
      [...macroEventCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantMacroEvent:
      [...macroEventCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      'unknown',
    stageRingAuthoritySpread: Object.fromEntries(
      [...stageRingAuthorityCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantStageRingAuthority:
      [...stageRingAuthorityCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      undefined,
    stageShotClassSpread: Object.fromEntries(
      [...stageShotClassCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantStageShotClass:
      [...stageShotClassCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      undefined,
    stageTransitionClassSpread: Object.fromEntries(
      [...stageTransitionClassCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantStageTransitionClass:
      [...stageTransitionClassCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      undefined,
    stageTempoCadenceModeSpread: Object.fromEntries(
      [...stageTempoCadenceModeCounts.entries()].map(([key, count]) => [key, count / frames.length])
    ),
    dominantStageTempoCadenceMode:
      [...stageTempoCadenceModeCounts.entries()]
        .sort((left, right) => right[1] - left[1])[0]?.[0] ?? undefined,
    stageCompositionSafetyMean:
      stageCompositionSafetySamples > 0
        ? stageCompositionSafetySum / stageCompositionSafetySamples
        : undefined,
    compositionSafetyRate:
      compositionSafetySamples > 0
        ? compositionSafetyUnsafeFrames / compositionSafetySamples
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
      heroDepthPenaltySamples > 0
        ? heroDepthPenaltySum / heroDepthPenaltySamples
        : undefined,
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
      wirefieldDensitySamples > 0
        ? wirefieldDensitySum / wirefieldDensitySamples
        : undefined,
    wirefieldDensityPeak:
      wirefieldDensitySamples > 0 ? wirefieldDensityPeak : undefined,
    worldDominanceDeliveredMean:
      worldDominanceDeliveredSamples > 0
        ? worldDominanceDeliveredSum / worldDominanceDeliveredSamples
        : undefined,
    overbrightRate: overbrightSamples > 0 ? overbrightFrames / overbrightSamples : undefined,
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
      stageCeilingSamples > 0 ? stageWashoutSuppressionSum / stageCeilingSamples : undefined,
    stageHeroScaleMinMean:
      stageHeroScaleSamples > 0 ? stageHeroScaleMinSum / stageHeroScaleSamples : undefined,
    stageHeroScaleMaxMean:
      stageHeroScaleSamples > 0 ? stageHeroScaleMaxSum / stageHeroScaleSamples : undefined,
    heroHueRange,
    worldHueRange,
    temporalWindowMeans: {
      preBeatLift: metricMeans.preBeatLift,
      beatStrike: metricMeans.beatStrike,
      postBeatRelease: metricMeans.postBeatRelease,
      interBeatFloat: metricMeans.interBeatFloat,
      barTurn: metricMeans.barTurn,
      phraseResolve: metricMeans.phraseResolve
    },
    paletteStateSpread: Object.fromEntries(
      [...paletteStateCounts.entries()].map(([key, count]) => [
        key,
        count / frames.length
      ])
    ),
    assetLayerSummary: Object.fromEntries(
      VISUAL_ASSET_LAYERS.map((layer) => [
        layer,
        {
          mean: assetLayerTotals[layer] / frames.length,
          peak: assetLayerPeaks[layer],
          activeFrameRate: assetLayerActiveFrames[layer] / frames.length
        }
      ])
    )
  });
  const eventTimingSummary = deriveEventTimingSummary({
    metadata,
    frames
  });
  const eventLatencyMs = eventTimingSummary.latencyMs;
  const qualityFlags = deriveQualityFlagsFromSummary({
    metadata: capture.metadata ?? {},
    visualSummary,
    metricPeaks,
    durationMs
  });
  const windowJudgement = deriveCaptureWindowJudgement({
    triggerKind,
    durationMs,
    triggerCount: capture.metadata?.triggerCount ?? 0,
    extensionCount: capture.metadata?.extensionCount ?? 0
  });

  if (triggerKind === 'drop' && metricPeaks.dropImpact < 0.45) {
    findings.push(
      `Auto-captured drop peaked at dropImpact=${formatNumber(metricPeaks.dropImpact)}. Conductor drop detection still looks conservative for this moment.`
    );
  }

  if (
    (triggerKind === 'drop' || metricPeaks.dropImpact > 0.6) &&
    surgeRatio < 0.18 &&
    generativeRatio < 0.35
  ) {
    findings.push(
      `The capture hears impact but spends little time in surge/generative posture (${formatPercent(
        surgeRatio + generativeRatio
      )}). The scene may still be under-committing on major hits.`
    );
  }

  if (metricPeaks.musicConfidence > 0.7 && metricPeaks.resonance < 0.42) {
    findings.push(
      `Music confidence peaks strongly (${formatNumber(
        metricPeaks.musicConfidence
      )}) but resonance carry stays modest (${formatNumber(
        metricPeaks.resonance
      )}). Low-volume music may still feel too short-lived.`
    );
  }

  if (metricPeaks.beatConfidence > 0.55 && metricPeaks.accent < 0.38) {
    findings.push(
      `Beat confidence is present (${formatNumber(
        metricPeaks.beatConfidence
      )}) but accent peaks stay restrained (${formatNumber(
        metricPeaks.accent
      )}). Rhythm spending may still be too polite.`
    );
  }

  if (metricPeaks.phraseTension > 0.62 && metricPeaks.sectionChange < 0.28) {
    findings.push(
      `Phrase tension builds (${formatNumber(
        metricPeaks.phraseTension
      )}) without a strong section-change release (${formatNumber(
        metricPeaks.sectionChange
      )}). Section transition logic may still be under-reading structure.`
    );
  }

  if (metricPeaks.speechConfidence > 0.55 && surgeRatio > 0.2) {
    findings.push(
      `Speech confidence rises (${formatNumber(
        metricPeaks.speechConfidence
      )}) while surge occupancy remains high (${formatPercent(
        surgeRatio
      )}). Speech handling may still be over-escalating.`
    );
  }

  if (metricPeaks.ambienceConfidence > 0.55 && cadenceRatio + generativeRatio > 0.45) {
    findings.push(
      `Ambient confidence is high (${formatNumber(
        metricPeaks.ambienceConfidence
      )}) and the system spends ${formatPercent(
        cadenceRatio + generativeRatio
      )} in active room states. Re-check hush and HVAC guardrails.`
    );
  }

  if (aftermathRatio < 0.08 && metricPeaks.releaseTail > 0.42) {
    findings.push(
      `Release tail peaks at ${formatNumber(
        metricPeaks.releaseTail
      )} but aftermath occupancy is only ${formatPercent(
        aftermathRatio
      )}. Aftermath may still collapse too quickly.`
    );
  }

  if (windowJudgement.oversized && !windowJudgement.multiEvent) {
    findings.push(
      `Capture duration reaches ${formatMs(
        durationMs
      )}. Auto-capture windows this large smear musical intent and are weaker for retuning.`
    );
  }

  if (windowJudgement.multiEvent) {
    findings.push(
      `Auto capture was extended ${capture.metadata?.extensionCount ?? 0} times across ${capture.metadata?.triggerCount ?? 0} trigger hits. This moment likely spans more than one musical event.`
    );
  }

  if (qualityFlags.includes('manualCustom')) {
    findings.push(
      'This capture was not anchored to a locked Proof Mission / launch profile, so it is useful history but lower-confidence tuning evidence.'
    );
  }

  if (qualityFlags.includes('safeTierActive')) {
    findings.push(
      'Safe quality tier was active during this capture. Tune against it on purpose because it is a real target-machine posture.'
    );
  }

  if (qualityFlags.includes('highAmbientGlow')) {
    findings.push(
      `Ambient glow stayed elevated (mean ${formatNumber(metricMeans.ambientGlowBudget)}). The image is probably washing itself out between events.`
    );
  }

  if (qualityFlags.includes('lowPaletteVariation')) {
    findings.push(
      `Palette variation is still narrow (hero hue range ${formatNumber(heroHueRange)} / world hue range ${formatNumber(worldHueRange)}). The show is likely settling into one lane for too long.`
    );
  }

  if (qualityFlags.includes('randomFeelingPaletteChurn')) {
    findings.push(
      `Palette movement may feel unearned (unearned-change risk ${formatNumber(visualSummary.unearnedChangeRiskMean)}; dominant base ${visualSummary.dominantPaletteBaseState ?? 'unknown'}). Base color should move on phrase, release, rupture, signature, or authority reasons.`
    );
  }

  if (qualityFlags.includes('unearnedHeroFormSwitch')) {
    findings.push(
      `Hero form changes may be semantically weak (${formatNumber(visualSummary.heroFormSwitchesPerMinute)} switches/min; planned-active match ${formatPercent(visualSummary.plannedActiveHeroFormMatchRate)}). Shape changes should follow motif grammar, not variety pressure.`
    );
  }

  if (qualityFlags.includes('heroWorldHueDivergence')) {
    findings.push(
      `Hero/world hue divergence is high (${formatNumber(visualSummary.heroWorldHueDivergenceMean)}), so the show may read as separate random color systems instead of one palette frame.`
    );
  }

  if (qualityFlags.includes('ambiguousHeroSilhouette')) {
    findings.push(
      `Hero silhouette evidence is weak (dominant form ${visualSummary.dominantHeroForm ?? 'unknown'}, longest form run ${formatMs(visualSummary.heroFormLongestRunMs ?? 0)}). Motif identity may not read from across the room.`
    );
  }

  if (qualityFlags.includes('sceneChurn')) {
    findings.push(
      `Playable motif scene churn is high (longest scene run ${formatMs(visualSummary.playableMotifSceneLongestRunMs ?? 0)}). Scene changes should happen on phrase or signature causes, not short-lived texture drift.`
    );
  }

  if (qualityFlags.includes('sceneMotifMismatch')) {
    findings.push(
      `Playable motif scene does not consistently match the active motif (${formatPercent(visualSummary.playableMotifSceneMotifMatchRate)} match). Authored scenes should lock to motif grammar before variety.`
    );
  }

  if (qualityFlags.includes('sceneIntentMismatch')) {
    findings.push(
      `Playable motif scene intent is drifting from the current driver (${formatPercent(visualSummary.playableMotifSceneIntentMatchRate)} match). Check signature override, dwell, and collapse-residue exit rules before adding new scenes.`
    );
  }

  if (qualityFlags.includes('sceneProfileMismatch')) {
    findings.push(
      `Playable motif scene profile is not consistently matching active ontology (${formatPercent(visualSummary.playableMotifSceneProfileMatchRate)} match). Scene labels need distinct silhouette, surface, mask, and particle-job posture.`
    );
  }

  if (qualityFlags.includes('sameySceneSilhouette')) {
    findings.push(
      `Playable motif scene silhouette confidence is low (${formatNumber(visualSummary.playableMotifSceneSilhouetteConfidenceMean)}). Strengthen scene posture until it reads in thumbnail review.`
    );
  }

  if (qualityFlags.includes('decorativeParticleActivity')) {
    findings.push(
      `Particles are active without a resolved field job (${visualSummary.dominantParticleFieldJob ?? 'none'}). Route particles as weather, punctuation, pressure dust, residue, or memory echo instead of decorative activity.`
    );
  }

  if (qualityFlags.includes('undercommittedDrop')) {
    findings.push(
      `Drop capture still under-committed visually/audio-wise (dropImpact ${formatNumber(metricPeaks.dropImpact)} / eventGlow peak ${formatNumber(metricPeaks.eventGlowBudget)}).`
    );
  }

  if (qualityFlags.includes('weakPhraseRelease')) {
    findings.push(
      `Release capture did not spend enough phrase resolve (releaseTail ${formatNumber(metricPeaks.releaseTail)} / phraseResolve mean ${formatNumber(metricMeans.phraseResolve)}).`
    );
  }

  if (qualityFlags.includes('staleBuildIdentity')) {
    findings.push(
      'Build identity is missing or non-current, so this capture cannot count as trustworthy current-branch proof.'
    );
  }

  if (qualityFlags.includes('scenarioMismatch')) {
    findings.push(
      'The declared proof scenario does not match the derived scenario evidence, so this clip should not satisfy scenario coverage on its label alone.'
    );
  }

  if (qualityFlags.includes('weakWorldAuthorityDelivery')) {
    findings.push(
      `World/chamber authority delivery is weak (${formatNumber(visualSummary.worldDominanceDeliveredMean)} mean, hierarchy ${formatNumber(visualSummary.frameHierarchyMean)}).`
    );
  }

  if (qualityFlags.includes('heroMonopolyRisk')) {
    findings.push(
      `Hero coverage is too dominant (${formatNumber(visualSummary.heroCoverageMean)} mean) relative to world delivery (${formatNumber(visualSummary.worldDominanceDeliveredMean)}).`
    );
  }

  if (qualityFlags.includes('ringOverdrawRisk')) {
    findings.push(
      `Ring persistence or overdraw fallback is still too high (${formatNumber(visualSummary.ringBeltPersistenceMean)} mean / ${formatPercent(visualSummary.ringOverdrawFallbackRate)} fallback).`
    );
  }

  if (qualityFlags.includes('lowChamberPresence')) {
    findings.push(
      `Chamber presence stayed too low (${formatNumber(visualSummary.chamberPresenceMean)} mean), so chamber/world ownership likely did not read clearly enough.`
    );
  }

  if ((visualSummary.compositionSafetyRate ?? 0) > 0.24) {
    findings.push(
      `Composition safety fallback was active in ${formatPercent(
        visualSummary.compositionSafetyRate ?? 0
      )} of telemetry samples. Framing governance is still rescuing too many shots.`
    );
  }

  if ((visualSummary.heroCoveragePeak ?? 0) > 0.34) {
    findings.push(
      `Hero coverage peaks at ${formatNumber(
        visualSummary.heroCoveragePeak
      )}, which is still crowding the frame for a governance-era pass.`
    );
  }

  if ((visualSummary.ringBeltPersistenceMean ?? 0) > 0.3) {
    findings.push(
      `Ring-belt persistence stays elevated (${formatNumber(
        visualSummary.ringBeltPersistenceMean
      )} mean). Midline ring staging is still overstaying.`
    );
  }

    if ((visualSummary.worldDominanceDeliveredMean ?? 0) < 0.3) {
      findings.push(
        `World/chamber dominance delivery is weak (${formatNumber(
          visualSummary.worldDominanceDeliveredMean
        )} mean). The frame is still declaring authority more often than it visibly delivers it.`
      );
    }

    if (
      longestRuns.showState.value === 'aftermath' &&
      longestRuns.showState.durationMs > 25000
    ) {
      findings.push(
        `The longest aftermath run lasts ${formatMs(
          longestRuns.showState.durationMs
        )}. The benchmark is still getting stuck in post-event behavior.`
      );
    }

    if (
      longestRuns.stageCueFamily.value === 'haunt' &&
      longestRuns.stageCueFamily.durationMs > 25000
    ) {
      findings.push(
        `The longest haunt cue run lasts ${formatMs(
          longestRuns.stageCueFamily.durationMs
        )}. Cue diversity is still collapsing into aftermath language for too long.`
      );
    }

  if (
    eventTimingSummary.disposition === 'lagging' &&
    typeof eventLatencyMs === 'number' &&
    eventLatencyMs > 220
  ) {
    findings.push(
      `Visual spend lags audio trigger by ${eventLatencyMs.toFixed(0)}ms. The scene is still too slow to commit around this event.`
    );
  }

  if (warnings.size > 0) {
    findings.push(`Runtime warnings were present: ${Array.from(warnings).join(' | ')}`);
  }

  if (
    typeof metadata.launchQuickStartProfileLabel === 'string' &&
    typeof metadata.controls?.preset === 'string'
  ) {
    findings.push(
      `Capture provenance layers: launch quick start "${metadata.launchQuickStartProfileLabel}" serialized as preset "${metadata.controls.preset}". Keep the launch label and serialized preset distinct when judging this run.`
    );
  }

  if (findings.length === 0) {
    findings.push(
      'No obvious tuning flags were inferred from this capture. Review visually for authored spend and composition, not just signal quality.'
    );
  }

  if (chronology.normalized) {
    findings.unshift(
      'Frame chronology wrapped across a timebase reset; analysis discarded stale pre-roll frames around the active trigger.'
    );
  }

  return {
    filePath,
    metadata,
    frameCount: frames.length,
    durationMs,
    dominantState,
    eventArchetype,
    stateOccupancy: stateCounts,
    intentOccupancy: intentCounts,
    momentCounts,
    peaks: metricPeaks,
      means: metricMeans,
      visualSummary,
      longestRuns,
      qualityFlags,
      eventTimingDisposition: eventTimingSummary.disposition,
      eventLatencyMs,
      beatInterval: {
        mean: beatMean,
      stdev: Math.sqrt(beatVariance),
      sampleCount: beatIntervals.length
    },
    warnings: Array.from(warnings),
    findings
  };
}

function mapToOrderedLines(map, total) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, count]) => `- \`${key}\`: ${count} frames (${formatPercent(count / total)})`);
}

function isLegacyCaptureSummary(summary) {
  const fileName = path.basename(summary.filePath ?? '');
  const label = summary.metadata?.label ?? '';

  return fileName.includes('1969-12-31') || label.includes('1969-12-31');
}

function resolveSourceMode(metadata = {}) {
  if (
    metadata.sourceMode === 'room-mic' ||
    metadata.sourceMode === 'system-audio' ||
    metadata.sourceMode === 'hybrid'
  ) {
    return metadata.sourceMode;
  }

  const sourceLabel = String(metadata.sourceLabel ?? '').toLowerCase();

  if (
    sourceLabel.includes('system audio') ||
    sourceLabel.includes('pc audio') ||
    sourceLabel.includes('display audio')
  ) {
    return 'system-audio';
  }

  if (sourceLabel.includes('hybrid')) {
    return 'hybrid';
  }

  if (sourceLabel.length > 0) {
    return 'room-mic';
  }

  return 'unknown';
}

function resolveQuickStartLabel(metadata = {}) {
  return (
    metadata.quickStartProfileLabel ??
    metadata.quickStartProfileId ??
    'manual/custom'
  );
}

function resolveLaunchQuickStartLabel(metadata = {}) {
  return (
    metadata.launchQuickStartProfileLabel ??
    metadata.launchQuickStartProfileId ??
    metadata.quickStartProfileLabel ??
    metadata.quickStartProfileId ??
    'manual/none'
  );
}

function resolveCaptureWindowThresholds(triggerKind) {
  switch (triggerKind) {
    case 'drop':
      return { maxDurationMs: 7600, maxExtensions: 1, maxTriggerCount: 3 };
    case 'signature-moment-peak':
      return { maxDurationMs: 7200, maxExtensions: 1, maxTriggerCount: 3 };
    case 'signature-moment-precharge':
      return { maxDurationMs: 8600, maxExtensions: 1, maxTriggerCount: 3 };
    case 'signature-moment-residue':
      return { maxDurationMs: 9800, maxExtensions: 2, maxTriggerCount: 4 };
    case 'section':
    case 'release':
      return { maxDurationMs: 9000, maxExtensions: 2, maxTriggerCount: 4 };
    case 'floor':
      return { maxDurationMs: 12000, maxExtensions: 2, maxTriggerCount: 4 };
    default:
      return { maxDurationMs: 16000, maxExtensions: 2, maxTriggerCount: 8 };
  }
}

function deriveCaptureWindowJudgement({
  triggerKind,
  durationMs,
  triggerCount,
  extensionCount
}) {
  const thresholds = resolveCaptureWindowThresholds(triggerKind);

  return {
    thresholds,
    oversized:
      durationMs > thresholds.maxDurationMs ||
      extensionCount > thresholds.maxExtensions ||
      triggerCount > thresholds.maxTriggerCount,
    multiEvent:
      extensionCount > thresholds.maxExtensions ||
      triggerCount > thresholds.maxTriggerCount
  };
}

function isVisualCommitFrame(frame, triggerKind) {
  const listening = frame.listeningFrame ?? {};
  const visual = frame.visualTelemetry ?? {};

  switch (triggerKind) {
    case 'drop':
      return (
        (visual.eventGlowBudget ?? 0) > 0.22 ||
        (visual.temporalWindows?.beatStrike ?? 0) > 0.24 ||
        visual.stageCueFamily === 'rupture' ||
        visual.stageShotClass === 'worldTakeover' ||
        (listening.dropImpact ?? 0) > 0.42
      );
    case 'section':
      return (
        (visual.eventGlowBudget ?? 0) > 0.18 ||
        (visual.temporalWindows?.barTurn ?? 0) > 0.18 ||
        visual.stageCueFamily === 'reveal' ||
        visual.stageShotClass === 'pressure' ||
        visual.stageShotClass === 'worldTakeover' ||
        (listening.sectionChange ?? 0) > 0.34
      );
    case 'release':
      return (
        (visual.temporalWindows?.phraseResolve ?? 0) > 0.18 ||
        (visual.temporalWindows?.postBeatRelease ?? 0) > 0.18 ||
        (visual.atmosphereResidue ?? 0) > 0.24 ||
        visual.stageCueFamily === 'release' ||
        visual.stageShotClass === 'aftermath' ||
        (listening.releaseTail ?? 0) > 0.28
      );
    case 'signature-moment-precharge':
      return (
        Boolean(visual.activeSignatureMoment) &&
        visual.activeSignatureMoment !== 'none' &&
        (visual.signatureMomentPhase === 'armed' ||
          visual.signatureMomentPhase === 'eligible' ||
          visual.signatureMomentPhase === 'precharge') &&
        ((visual.signatureMomentPrechargeProgress ?? 0) > 0.2 ||
          (visual.signatureMomentTriggerConfidence ?? 0) > 0.4)
      );
    case 'signature-moment-peak':
      return (
        Boolean(visual.activeSignatureMoment) &&
        visual.activeSignatureMoment !== 'none' &&
        (visual.signatureMomentPhase === 'strike' ||
          visual.signatureMomentPhase === 'hold') &&
        ((visual.signatureMomentIntensity ?? 0) > 0.34 ||
          (visual.postConsequenceIntensity ?? 0) > 0.24)
      );
    case 'signature-moment-residue':
      return (
        Boolean(visual.activeSignatureMoment) &&
        visual.activeSignatureMoment !== 'none' &&
        (visual.signatureMomentPhase === 'residue' ||
          visual.signatureMomentPhase === 'clear') &&
        ((visual.ghostResidueAmount ?? 0) > 0.18 ||
          (visual.postConsequenceIntensity ?? 0) > 0.18 ||
          (visual.signatureMomentIntensity ?? 0) > 0.18)
      );
    default:
      return false;
  }
}

function deriveEventTimingSummary({ metadata = {}, frames = [] }) {
  const fallbackDisposition =
    metadata.eventTimingDisposition === 'aligned' ||
    metadata.eventTimingDisposition === 'lagging' ||
    metadata.eventTimingDisposition === 'precharged' ||
    metadata.eventTimingDisposition === 'unknown'
      ? metadata.eventTimingDisposition
      : 'unknown';
  const fallbackLatency =
    typeof metadata.eventLatencyMs === 'number'
      ? metadata.eventLatencyMs
      : metadata.eventLatencyMs === null
        ? null
        : null;
  const triggerTimestampMs =
    typeof metadata.triggerTimestampMs === 'number' ? metadata.triggerTimestampMs : null;
  const triggerKind =
    metadata.triggerKind === 'drop' ||
    metadata.triggerKind === 'section' ||
    metadata.triggerKind === 'release' ||
    metadata.triggerKind === 'floor' ||
    metadata.triggerKind === 'signature-moment-precharge' ||
    metadata.triggerKind === 'signature-moment-peak' ||
    metadata.triggerKind === 'signature-moment-residue'
      ? metadata.triggerKind
      : undefined;

  if (triggerTimestampMs === null || frames.length === 0) {
    return {
      disposition: fallbackDisposition,
      latencyMs: fallbackLatency
    };
  }

  const timingWindow =
    triggerKind === 'release'
      ? { preMs: 900, postMs: 2200 }
      : triggerKind === 'signature-moment-residue'
        ? { preMs: 900, postMs: 2600 }
        : triggerKind === 'signature-moment-precharge'
          ? { preMs: 1300, postMs: 1800 }
          : triggerKind === 'signature-moment-peak'
            ? { preMs: 900, postMs: 1700 }
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
      disposition: fallbackDisposition,
      latencyMs: fallbackLatency
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
      disposition: fallbackDisposition,
      latencyMs: fallbackLatency
    };
  }

  const latencyMs = committedAfterTrigger.timestampMs - triggerTimestampMs;

  return {
    disposition: latencyMs > 220 ? 'lagging' : 'aligned',
    latencyMs
  };
}

function formatEventTimingSummary(disposition, latencyMs) {
  if (disposition === 'precharged') {
    return typeof latencyMs === 'number'
      ? `precharged (${Math.abs(latencyMs).toFixed(0)}ms lead)`
      : 'precharged';
  }

  if (disposition === 'aligned' || disposition === 'lagging') {
    return typeof latencyMs === 'number'
      ? `${disposition} (${latencyMs.toFixed(0)}ms)`
      : disposition;
  }

  return typeof latencyMs === 'number' ? `${latencyMs.toFixed(0)}ms` : 'unknown';
}

function deriveQualityFlagsFromSummary({
  metadata = {},
  visualSummary,
  metricPeaks,
  durationMs
}) {
  const flags = new Set();
  const launchQuickStartProfileId = metadata.launchQuickStartProfileId;
  const quickStartProfileId = metadata.quickStartProfileId;
  const triggerCount = metadata.triggerCount ?? 0;
  const extensionCount = metadata.extensionCount ?? 0;

  if (
    (!launchQuickStartProfileId && !quickStartProfileId) ||
    (launchQuickStartProfileId &&
      quickStartProfileId &&
      quickStartProfileId !== launchQuickStartProfileId)
  ) {
    flags.add('manualCustom');
  }

  const windowJudgement = deriveCaptureWindowJudgement({
    triggerKind: metadata.triggerKind,
    durationMs,
    triggerCount,
    extensionCount
  });

  if (windowJudgement.oversized) {
    flags.add('oversizedWindow');
  }

  if (windowJudgement.multiEvent) {
    flags.add('multiEventWindow');
  }

  if (
    metadata.qualityTier === 'safe' ||
    visualSummary.dominantQualityTier === 'safe'
  ) {
    flags.add('safeTierActive');
  }

  if (visualSummary.ambientGlowMean > 0.16) {
    flags.add('highAmbientGlow');
  }

  if (
    visualSummary.heroHueRange < 0.12 &&
    visualSummary.worldHueRange < 0.08
  ) {
    flags.add('lowPaletteVariation');
  }

  if (metadata.triggerKind === 'drop' && metricPeaks.dropImpact < 0.45) {
    flags.add('undercommittedDrop');
  }

  if (
    metadata.triggerKind === 'release' &&
    (metricPeaks.releaseTail < 0.42 ||
      visualSummary.temporalWindowMeans.phraseResolve < 0.08)
  ) {
    flags.add('weakPhraseRelease');
  }

  if (metadata.buildInfo?.valid !== true) {
    flags.add('staleBuildIdentity');
  }

  if (
    metadata.scenarioAssessment &&
    typeof metadata.scenarioAssessment === 'object' &&
    metadata.scenarioAssessment.validated !== true
  ) {
    flags.add('scenarioMismatch');
  }

  if (
    (visualSummary.worldDominanceDeliveredMean ?? 0) < 0.18 &&
    (visualSummary.frameHierarchyMean ?? 1) < 0.72
  ) {
    flags.add('weakWorldAuthorityDelivery');
  }

  if (
    (visualSummary.heroCoverageMean ?? 0) >= 0.28 &&
    (visualSummary.worldDominanceDeliveredMean ?? 0) <= 0.16
  ) {
    flags.add('heroMonopolyRisk');
  }

  if (
    (visualSummary.ringBeltPersistenceMean ?? 0) >= 0.28 ||
    (visualSummary.ringOverdrawFallbackRate ?? 0) >= 0.12
  ) {
    flags.add('ringOverdrawRisk');
  }

  if ((visualSummary.chamberPresenceMean ?? 0) < 0.16) {
    flags.add('lowChamberPresence');
  }

  if ((visualSummary.unearnedChangeRiskMean ?? 0) > 0.22) {
    flags.add('randomFeelingPaletteChurn');
  }

  if (
    (visualSummary.heroFormSwitchesPerMinute ?? 0) > 9 ||
    (visualSummary.plannedActiveHeroFormMatchRate ?? 1) < 0.72
  ) {
    flags.add('unearnedHeroFormSwitch');
  }

  if ((visualSummary.heroWorldHueDivergenceMean ?? 0) > 0.32) {
    flags.add('heroWorldHueDivergence');
  }

  if (
    (visualSummary.heroFormSpread &&
      Math.max(...Object.values(visualSummary.heroFormSpread)) > 0.9) ||
    (visualSummary.heroFormLongestRunMs ?? 0) < 1800
  ) {
    flags.add('ambiguousHeroSilhouette');
  }

  if (
    (visualSummary.playableMotifSceneLongestRunMs ?? 0) > 0 &&
    (visualSummary.playableMotifSceneLongestRunMs ?? 0) < 4200
  ) {
    flags.add('sceneChurn');
  }

  if ((visualSummary.playableMotifSceneMotifMatchRate ?? 1) < 0.72) {
    flags.add('sceneMotifMismatch');
  }

  if ((visualSummary.playableMotifSceneIntentMatchRate ?? 1) < 0.78) {
    flags.add('sceneIntentMismatch');
  }

  if ((visualSummary.playableMotifSceneProfileMatchRate ?? 1) < 0.78) {
    flags.add('sceneProfileMismatch');
  }

  if ((visualSummary.playableMotifSceneSilhouetteConfidenceMean ?? 1) < 0.46) {
    flags.add('sameySceneSilhouette');
  }

  const particleActivity = visualSummary.assetLayerSummary?.particles?.activeFrameRate ?? 0;
  const particleJobTelemetryRate = visualSummary.particleFieldJobTelemetryRate ?? 0;
  if (
    particleJobTelemetryRate > 0.5 &&
    particleActivity > 0.68 &&
    (visualSummary.dominantParticleFieldJob ?? 'none') === 'none'
  ) {
    flags.add('decorativeParticleActivity');
  }

  return [...flags];
}

function buildAggregateStats(summaries) {
  const safeSummaries = summaries.filter(Boolean);
  const allFindings = safeSummaries.flatMap((summary) => summary.findings);
  const findingBuckets = new Map();
  const triggerArchetypes = new Map();
  const sourceModes = new Map();
  const activeQuickStarts = new Map();
  const launchQuickStarts = new Map();
  const qualityTierSpread = new Map();
  const actSpread = new Map();
  const paletteStateSpread = new Map();
  const showFamilySpread = new Map();
  const macroEventSpread = new Map();
  const atmosphereMatterStateSpread = new Map();
  const spendProfileSpread = new Map();
  const stageRingAuthoritySpread = new Map();
  const signatureMomentSpread = new Map();
  const playableMotifSceneSpread = new Map();
  const playableMotifSceneTransitionReasonSpread = new Map();
  const eventTimingDispositionSpread = new Map();
  const qualityFlagCounts = new Map();
  let customizedFromLaunchCount = 0;
  let launchedFromQuickStartCount = 0;
  let exposureMeanSum = 0;
  let exposurePeakSum = 0;
  let bloomStrengthMeanSum = 0;
  let bloomStrengthPeakSum = 0;
  let bloomThresholdMeanSum = 0;
  let bloomRadiusMeanSum = 0;
  let bloomRadiusPeakSum = 0;
  let bloomRadiusMeanSamples = 0;
  let bloomRadiusPeakSamples = 0;
  let afterImageDampMeanSum = 0;
  let afterImageDampPeakSum = 0;
  let afterImageDampMeanSamples = 0;
  let afterImageDampPeakSamples = 0;
  let ambientGlowMeanSum = 0;
  let eventGlowMeanSum = 0;
  let heroHueRangeSum = 0;
  let worldHueRangeSum = 0;
  let atmospherePressureMeanSum = 0;
  let atmospherePressurePeakSum = 0;
  let atmospherePressureMeanSamples = 0;
  let atmospherePressurePeakSamples = 0;
  let atmosphereIonizationMeanSum = 0;
  let atmosphereIonizationPeakSum = 0;
  let atmosphereIonizationMeanSamples = 0;
  let atmosphereIonizationPeakSamples = 0;
  let atmosphereResidueMeanSum = 0;
  let atmosphereResiduePeakSum = 0;
  let atmosphereResidueMeanSamples = 0;
  let atmosphereResiduePeakSamples = 0;
  let atmosphereStructureRevealMeanSum = 0;
  let atmosphereStructureRevealPeakSum = 0;
  let atmosphereStructureRevealMeanSamples = 0;
  let atmosphereStructureRevealPeakSamples = 0;
  let overbrightRateSum = 0;
  let overbrightPeakSum = 0;
  let overbrightRateSamples = 0;
  let overbrightPeakSamples = 0;
  let heroScaleMeanSum = 0;
  let heroScalePeakSum = 0;
  let heroScaleSamples = 0;
  let heroScalePeakSamples = 0;
  let heroScreenXMeanSum = 0;
  let heroScreenYMeanSum = 0;
  let heroScreenSamples = 0;
  let ringAuthorityMeanSum = 0;
  let ringAuthoritySamples = 0;
  let stageExposureCeilingMeanSum = 0;
  let stageBloomCeilingMeanSum = 0;
  let stageWashoutSuppressionMeanSum = 0;
  let stageCeilingSamples = 0;
  let stageHeroScaleMinMeanSum = 0;
  let stageHeroScaleMaxMeanSum = 0;
  let stageHeroScaleSamples = 0;
  let signatureMomentActiveRateSum = 0;
  let signatureMomentActiveRateSamples = 0;
  let playableMotifSceneMotifMatchRateSum = 0;
  let playableMotifSceneMotifMatchRateSamples = 0;
  let playableMotifScenePaletteMatchRateSum = 0;
  let playableMotifScenePaletteMatchRateSamples = 0;
  let playableMotifSceneDistinctnessMeanSum = 0;
  let playableMotifSceneDistinctnessMeanSamples = 0;
  let playableMotifSceneSilhouetteConfidenceMeanSum = 0;
  let playableMotifSceneSilhouetteConfidenceMeanSamples = 0;
  let playableMotifSceneLongestRunMsSum = 0;
  let playableMotifSceneLongestRunMsSamples = 0;
  let postOverprocessRiskMeanSum = 0;
  let postOverprocessRiskMeanSamples = 0;
  let eventLatencySum = 0;
  let eventLatencyCount = 0;
  let qualityTransitionSum = 0;
  let qualityTransitionSamples = 0;
  let provenanceMismatchCount = 0;
  let proofStillSavedCount = 0;
  let invalidBuildIdentityCount = 0;
  let proofInvalidCount = 0;
  let proofIneligibleCount = 0;
  let scenarioMismatchCount = 0;
  let missingScenarioTagCount = 0;

  for (const finding of allFindings) {
    const bucket = finding
      .replace(/`[^`]+`/g, '')
      .replace(/=\d+\.\d+/g, '=<n>')
      .replace(/\(\d+\.\d+%\)/g, '(<n>%)')
      .replace(/\d+\.\d+/g, '<n>')
      .split('. ')[0];
    incrementCounter(findingBuckets, bucket);
  }

  for (const summary of safeSummaries) {
    const trigger = summary.metadata?.triggerKind ?? 'manual';
    const key = `${trigger}:${summary.eventArchetype}`;
    incrementCounter(triggerArchetypes, key);
    incrementCounter(sourceModes, resolveSourceMode(summary.metadata));
    const activeQuickStart = resolveQuickStartLabel(summary.metadata);
    const launchQuickStart = resolveLaunchQuickStartLabel(summary.metadata);

    incrementCounter(activeQuickStarts, activeQuickStart);
    incrementCounter(launchQuickStarts, launchQuickStart);
    incrementCounter(
      qualityTierSpread,
      summary.visualSummary?.dominantQualityTier ?? 'unknown'
    );
    incrementCounter(
      actSpread,
      summary.visualSummary?.dominantAct ?? 'unknown'
    );
    incrementCounter(
      paletteStateSpread,
      summary.visualSummary?.dominantPaletteState ?? 'unknown'
    );
    incrementCounter(
      showFamilySpread,
      summary.visualSummary?.dominantShowFamily ?? 'unknown'
    );
    incrementCounter(
      macroEventSpread,
      summary.visualSummary?.dominantMacroEvent ?? 'unknown'
    );
    incrementCounter(
      atmosphereMatterStateSpread,
      summary.visualSummary?.dominantAtmosphereMatterState ?? 'unknown'
    );
    incrementCounter(
      spendProfileSpread,
      summary.visualSummary?.dominantSpendProfile ?? 'unknown'
    );
    incrementCounter(
      stageRingAuthoritySpread,
      summary.visualSummary?.dominantStageRingAuthority ?? 'unknown'
    );
    incrementCounter(
      signatureMomentSpread,
      summary.visualSummary?.dominantSignatureMoment ?? 'none'
    );
    incrementCounter(
      playableMotifSceneSpread,
      summary.visualSummary?.dominantPlayableMotifScene ?? 'none'
    );
    incrementCounter(
      playableMotifSceneTransitionReasonSpread,
      summary.visualSummary?.dominantPlayableMotifSceneTransitionReason ?? 'hold'
    );
    incrementCounter(
      eventTimingDispositionSpread,
      summary.eventTimingDisposition ?? 'unknown'
    );
    for (const flag of summary.qualityFlags ?? []) {
      incrementCounter(qualityFlagCounts, flag);
    }
    exposureMeanSum += summary.visualSummary?.exposureMean ?? 0;
    exposurePeakSum += summary.visualSummary?.exposurePeak ?? 0;
    bloomStrengthMeanSum += summary.visualSummary?.bloomStrengthMean ?? 0;
    bloomStrengthPeakSum += summary.visualSummary?.bloomStrengthPeak ?? 0;
    bloomThresholdMeanSum += summary.visualSummary?.bloomThresholdMean ?? 0;
    if (typeof summary.visualSummary?.bloomRadiusMean === 'number') {
      bloomRadiusMeanSum += summary.visualSummary.bloomRadiusMean;
      bloomRadiusMeanSamples += 1;
    }
    if (typeof summary.visualSummary?.bloomRadiusPeak === 'number') {
      bloomRadiusPeakSum += summary.visualSummary.bloomRadiusPeak;
      bloomRadiusPeakSamples += 1;
    }
    if (typeof summary.visualSummary?.afterImageDampMean === 'number') {
      afterImageDampMeanSum += summary.visualSummary.afterImageDampMean;
      afterImageDampMeanSamples += 1;
    }
    if (typeof summary.visualSummary?.afterImageDampPeak === 'number') {
      afterImageDampPeakSum += summary.visualSummary.afterImageDampPeak;
      afterImageDampPeakSamples += 1;
    }
    ambientGlowMeanSum += summary.visualSummary?.ambientGlowMean ?? 0;
    eventGlowMeanSum += summary.visualSummary?.eventGlowMean ?? 0;
    heroHueRangeSum += summary.visualSummary?.heroHueRange ?? 0;
    worldHueRangeSum += summary.visualSummary?.worldHueRange ?? 0;
    if (typeof summary.visualSummary?.atmospherePressureMean === 'number') {
      atmospherePressureMeanSum += summary.visualSummary.atmospherePressureMean;
      atmospherePressureMeanSamples += 1;
    }
    if (typeof summary.visualSummary?.atmospherePressurePeak === 'number') {
      atmospherePressurePeakSum += summary.visualSummary.atmospherePressurePeak;
      atmospherePressurePeakSamples += 1;
    }
    if (typeof summary.visualSummary?.atmosphereIonizationMean === 'number') {
      atmosphereIonizationMeanSum += summary.visualSummary.atmosphereIonizationMean;
      atmosphereIonizationMeanSamples += 1;
    }
    if (typeof summary.visualSummary?.atmosphereIonizationPeak === 'number') {
      atmosphereIonizationPeakSum += summary.visualSummary.atmosphereIonizationPeak;
      atmosphereIonizationPeakSamples += 1;
    }
    if (typeof summary.visualSummary?.atmosphereResidueMean === 'number') {
      atmosphereResidueMeanSum += summary.visualSummary.atmosphereResidueMean;
      atmosphereResidueMeanSamples += 1;
    }
    if (typeof summary.visualSummary?.atmosphereResiduePeak === 'number') {
      atmosphereResiduePeakSum += summary.visualSummary.atmosphereResiduePeak;
      atmosphereResiduePeakSamples += 1;
    }
    if (typeof summary.visualSummary?.atmosphereStructureRevealMean === 'number') {
      atmosphereStructureRevealMeanSum +=
        summary.visualSummary.atmosphereStructureRevealMean;
      atmosphereStructureRevealMeanSamples += 1;
    }
    if (typeof summary.visualSummary?.atmosphereStructureRevealPeak === 'number') {
      atmosphereStructureRevealPeakSum +=
        summary.visualSummary.atmosphereStructureRevealPeak;
      atmosphereStructureRevealPeakSamples += 1;
    }
    if (typeof summary.visualSummary?.overbrightRate === 'number') {
      overbrightRateSum += summary.visualSummary.overbrightRate;
      overbrightRateSamples += 1;
    }
    if (typeof summary.visualSummary?.overbrightPeak === 'number') {
      overbrightPeakSum += summary.visualSummary.overbrightPeak;
      overbrightPeakSamples += 1;
    }
    if (typeof summary.visualSummary?.heroScaleMean === 'number') {
      heroScaleMeanSum += summary.visualSummary.heroScaleMean;
      heroScaleSamples += 1;
    }
    if (typeof summary.visualSummary?.heroScalePeak === 'number') {
      heroScalePeakSum += summary.visualSummary.heroScalePeak;
      heroScalePeakSamples += 1;
    }
    if (
      typeof summary.visualSummary?.heroScreenXMean === 'number' &&
      typeof summary.visualSummary?.heroScreenYMean === 'number'
    ) {
      heroScreenSamples += 1;
      heroScreenXMeanSum += summary.visualSummary.heroScreenXMean;
      heroScreenYMeanSum += summary.visualSummary.heroScreenYMean;
    }
    if (typeof summary.visualSummary?.ringAuthorityMean === 'number') {
      ringAuthorityMeanSum += summary.visualSummary.ringAuthorityMean;
      ringAuthoritySamples += 1;
    }
    if (
      typeof summary.visualSummary?.stageExposureCeilingMean === 'number' &&
      typeof summary.visualSummary?.stageBloomCeilingMean === 'number' &&
      typeof summary.visualSummary?.stageWashoutSuppressionMean === 'number'
    ) {
      stageCeilingSamples += 1;
      stageExposureCeilingMeanSum += summary.visualSummary.stageExposureCeilingMean;
      stageBloomCeilingMeanSum += summary.visualSummary.stageBloomCeilingMean;
      stageWashoutSuppressionMeanSum += summary.visualSummary.stageWashoutSuppressionMean;
    }
    if (
      typeof summary.visualSummary?.stageHeroScaleMinMean === 'number' &&
      typeof summary.visualSummary?.stageHeroScaleMaxMean === 'number'
    ) {
      stageHeroScaleSamples += 1;
      stageHeroScaleMinMeanSum += summary.visualSummary.stageHeroScaleMinMean;
      stageHeroScaleMaxMeanSum += summary.visualSummary.stageHeroScaleMaxMean;
    }
    if (typeof summary.visualSummary?.signatureMomentActiveRate === 'number') {
      signatureMomentActiveRateSamples += 1;
      signatureMomentActiveRateSum += summary.visualSummary.signatureMomentActiveRate;
    }
    if (
      typeof summary.visualSummary?.playableMotifSceneMotifMatchRate === 'number'
    ) {
      playableMotifSceneMotifMatchRateSamples += 1;
      playableMotifSceneMotifMatchRateSum +=
        summary.visualSummary.playableMotifSceneMotifMatchRate;
    }
    if (
      typeof summary.visualSummary?.playableMotifScenePaletteMatchRate === 'number'
    ) {
      playableMotifScenePaletteMatchRateSamples += 1;
      playableMotifScenePaletteMatchRateSum +=
        summary.visualSummary.playableMotifScenePaletteMatchRate;
    }
    if (
      typeof summary.visualSummary?.playableMotifSceneDistinctnessMean === 'number'
    ) {
      playableMotifSceneDistinctnessMeanSamples += 1;
      playableMotifSceneDistinctnessMeanSum +=
        summary.visualSummary.playableMotifSceneDistinctnessMean;
    }
    if (
      typeof summary.visualSummary?.playableMotifSceneSilhouetteConfidenceMean ===
      'number'
    ) {
      playableMotifSceneSilhouetteConfidenceMeanSamples += 1;
      playableMotifSceneSilhouetteConfidenceMeanSum +=
        summary.visualSummary.playableMotifSceneSilhouetteConfidenceMean;
    }
    if (typeof summary.visualSummary?.playableMotifSceneLongestRunMs === 'number') {
      playableMotifSceneLongestRunMsSamples += 1;
      playableMotifSceneLongestRunMsSum +=
        summary.visualSummary.playableMotifSceneLongestRunMs;
    }
    if (typeof summary.visualSummary?.postOverprocessRiskMean === 'number') {
      postOverprocessRiskMeanSamples += 1;
      postOverprocessRiskMeanSum += summary.visualSummary.postOverprocessRiskMean;
    }
    if (
      typeof summary.eventLatencyMs === 'number' &&
      summary.eventTimingDisposition !== 'precharged' &&
      summary.eventTimingDisposition !== 'unknown'
    ) {
      eventLatencySum += summary.eventLatencyMs;
      eventLatencyCount += 1;
    }
    if (typeof summary.visualSummary?.qualityTransitionCount === 'number') {
      qualityTransitionSum += summary.visualSummary.qualityTransitionCount;
      qualityTransitionSamples += 1;
    }
    if (summary.metadata?.sourceSummary?.provenanceMismatch) {
      provenanceMismatchCount += 1;
    }
    if (summary.metadata?.buildInfo?.valid !== true) {
      invalidBuildIdentityCount += 1;
    }
    if (summary.metadata?.proofValidity?.verdict === 'invalid') {
      proofInvalidCount += 1;
    }
    if (summary.metadata?.proofValidity?.currentProofEligible === false) {
      proofIneligibleCount += 1;
    }
    if (summary.metadata?.scenarioAssessment?.validated === false) {
      scenarioMismatchCount += 1;
    }
    if (summary.metadata?.proofReadiness?.seriousRun === true) {
      const scenarioCheck = summary.metadata.proofReadiness.checks?.find(
        (check) => check?.id === 'scenario-tag'
      );
      if (scenarioCheck?.passed === false) {
        missingScenarioTagCount += 1;
      }
    }
    proofStillSavedCount += summary.metadata?.proofStills?.saved?.length ?? 0;

    if (launchQuickStart !== 'manual/none') {
      launchedFromQuickStartCount += 1;
      if (activeQuickStart !== launchQuickStart) {
        customizedFromLaunchCount += 1;
      }
    }
  }

  const topFindingLines = [...findingBuckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([finding, count]) => `- ${finding} (${count})`);
  const averagePeakMusic =
    safeSummaries.reduce((sum, summary) => sum + summary.peaks.musicConfidence, 0) /
    safeSummaries.length;
  const averagePeakDrop =
    safeSummaries.reduce((sum, summary) => sum + summary.peaks.dropImpact, 0) /
    safeSummaries.length;
  const averagePeakAccent =
    safeSummaries.reduce((sum, summary) => sum + summary.peaks.accent, 0) /
    safeSummaries.length;
  const averageDurationMs =
    safeSummaries.reduce((sum, summary) => sum + summary.durationMs, 0) /
    safeSummaries.length;
  const oversizedWindowCount = safeSummaries.filter((summary) =>
    (summary.qualityFlags ?? []).includes('oversizedWindow')
  ).length;
  const multiEventWindowCount = safeSummaries.filter((summary) =>
    (summary.qualityFlags ?? []).includes('multiEventWindow')
  ).length;
  const triggerLines = [...triggerArchetypes.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const sourceLines = [...sourceModes.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const activeQuickStartLines = [...activeQuickStarts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const launchQuickStartLines = [...launchQuickStarts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const qualityTierLines = [...qualityTierSpread.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const actLines = [...actSpread.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const paletteStateLines = [...paletteStateSpread.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const atmosphereMatterStateLines = [...atmosphereMatterStateSpread.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const eventTimingDispositionLines = [...eventTimingDispositionSpread.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const qualityFlagLines = [...qualityFlagCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- ${value} (${count})`);
  const paletteStateSpreadByActLines = formatNestedSpreadLines(
    averageNestedSpreadAcrossBatch(
      safeSummaries,
      (summary) => summary.visualSummary?.paletteStateSpreadByAct
    )
  );
  const paletteStateSpreadByFamilyLines = formatNestedSpreadLines(
    averageNestedSpreadAcrossBatch(
      safeSummaries,
      (summary) => summary.visualSummary?.paletteStateSpreadByFamily
    )
  );
  const stageShotClassSpreadByFamilyLines = formatNestedSpreadLines(
    averageNestedSpreadAcrossBatch(
      safeSummaries,
      (summary) => summary.visualSummary?.stageShotClassSpreadByFamily
    )
  );
  const stageWorldModeSpreadByFamilyLines = formatNestedSpreadLines(
    averageNestedSpreadAcrossBatch(
      safeSummaries,
      (summary) => summary.visualSummary?.stageWorldModeSpreadByFamily
    )
  );

  return {
    averagePeakMusic,
    averagePeakDrop,
    averagePeakAccent,
    averageDurationMs,
    averageExposureMean: exposureMeanSum / safeSummaries.length,
    averageExposurePeak: exposurePeakSum / safeSummaries.length,
    averageBloomStrengthMean: bloomStrengthMeanSum / safeSummaries.length,
    averageBloomStrengthPeak: bloomStrengthPeakSum / safeSummaries.length,
    averageBloomThresholdMean: bloomThresholdMeanSum / safeSummaries.length,
    averageBloomRadiusMean:
      bloomRadiusMeanSamples > 0 ? bloomRadiusMeanSum / bloomRadiusMeanSamples : 0,
    averageBloomRadiusPeak:
      bloomRadiusPeakSamples > 0 ? bloomRadiusPeakSum / bloomRadiusPeakSamples : 0,
    averageAfterImageDampMean:
      afterImageDampMeanSamples > 0
        ? afterImageDampMeanSum / afterImageDampMeanSamples
        : 0,
    averageAfterImageDampPeak:
      afterImageDampPeakSamples > 0
        ? afterImageDampPeakSum / afterImageDampPeakSamples
        : 0,
    averageAmbientGlowMean: ambientGlowMeanSum / safeSummaries.length,
    averageEventGlowMean: eventGlowMeanSum / safeSummaries.length,
    averageHeroHueRange: heroHueRangeSum / safeSummaries.length,
    averageWorldHueRange: worldHueRangeSum / safeSummaries.length,
    averageAtmospherePressureMean:
      atmospherePressureMeanSamples > 0
        ? atmospherePressureMeanSum / atmospherePressureMeanSamples
        : 0,
    averageAtmospherePressurePeak:
      atmospherePressurePeakSamples > 0
        ? atmospherePressurePeakSum / atmospherePressurePeakSamples
        : 0,
    averageAtmosphereIonizationMean:
      atmosphereIonizationMeanSamples > 0
        ? atmosphereIonizationMeanSum / atmosphereIonizationMeanSamples
        : 0,
    averageAtmosphereIonizationPeak:
      atmosphereIonizationPeakSamples > 0
        ? atmosphereIonizationPeakSum / atmosphereIonizationPeakSamples
        : 0,
    averageAtmosphereResidueMean:
      atmosphereResidueMeanSamples > 0
        ? atmosphereResidueMeanSum / atmosphereResidueMeanSamples
        : 0,
    averageAtmosphereResiduePeak:
      atmosphereResiduePeakSamples > 0
        ? atmosphereResiduePeakSum / atmosphereResiduePeakSamples
        : 0,
    averageAtmosphereStructureRevealMean:
      atmosphereStructureRevealMeanSamples > 0
        ? atmosphereStructureRevealMeanSum / atmosphereStructureRevealMeanSamples
        : 0,
    averageAtmosphereStructureRevealPeak:
      atmosphereStructureRevealPeakSamples > 0
        ? atmosphereStructureRevealPeakSum / atmosphereStructureRevealPeakSamples
        : 0,
    averageOverbrightRate:
      overbrightRateSamples > 0 ? overbrightRateSum / overbrightRateSamples : 0,
    averageOverbrightPeak:
      overbrightPeakSamples > 0 ? overbrightPeakSum / overbrightPeakSamples : 0,
    averageHeroScaleMean:
      heroScaleSamples > 0 ? heroScaleMeanSum / heroScaleSamples : 0,
    averageHeroScalePeak:
      heroScalePeakSamples > 0 ? heroScalePeakSum / heroScalePeakSamples : 0,
    averageHeroScreenXMean:
      heroScreenSamples > 0 ? heroScreenXMeanSum / heroScreenSamples : 0,
    averageHeroScreenYMean:
      heroScreenSamples > 0 ? heroScreenYMeanSum / heroScreenSamples : 0,
    averageRingAuthorityMean:
      ringAuthoritySamples > 0 ? ringAuthorityMeanSum / ringAuthoritySamples : 0,
    averageStageExposureCeilingMean:
      stageCeilingSamples > 0 ? stageExposureCeilingMeanSum / stageCeilingSamples : 0,
    averageStageBloomCeilingMean:
      stageCeilingSamples > 0 ? stageBloomCeilingMeanSum / stageCeilingSamples : 0,
    averageStageWashoutSuppressionMean:
      stageCeilingSamples > 0 ? stageWashoutSuppressionMeanSum / stageCeilingSamples : 0,
    averageStageHeroScaleMinMean:
      stageHeroScaleSamples > 0 ? stageHeroScaleMinMeanSum / stageHeroScaleSamples : 0,
    averageStageHeroScaleMaxMean:
      stageHeroScaleSamples > 0 ? stageHeroScaleMaxMeanSum / stageHeroScaleSamples : 0,
    averageSignatureMomentActiveRate:
      signatureMomentActiveRateSamples > 0
        ? signatureMomentActiveRateSum / signatureMomentActiveRateSamples
        : 0,
    averagePlayableMotifSceneMotifMatchRate:
      playableMotifSceneMotifMatchRateSamples > 0
        ? playableMotifSceneMotifMatchRateSum /
          playableMotifSceneMotifMatchRateSamples
        : 0,
    averagePlayableMotifScenePaletteMatchRate:
      playableMotifScenePaletteMatchRateSamples > 0
        ? playableMotifScenePaletteMatchRateSum /
          playableMotifScenePaletteMatchRateSamples
        : 0,
    averagePlayableMotifSceneDistinctnessMean:
      playableMotifSceneDistinctnessMeanSamples > 0
        ? playableMotifSceneDistinctnessMeanSum /
          playableMotifSceneDistinctnessMeanSamples
        : 0,
    averagePlayableMotifSceneSilhouetteConfidenceMean:
      playableMotifSceneSilhouetteConfidenceMeanSamples > 0
        ? playableMotifSceneSilhouetteConfidenceMeanSum /
          playableMotifSceneSilhouetteConfidenceMeanSamples
        : 0,
    averagePlayableMotifSceneLongestRunMs:
      playableMotifSceneLongestRunMsSamples > 0
        ? playableMotifSceneLongestRunMsSum / playableMotifSceneLongestRunMsSamples
        : 0,
    averagePostOverprocessRiskMean:
      postOverprocessRiskMeanSamples > 0
        ? postOverprocessRiskMeanSum / postOverprocessRiskMeanSamples
        : 0,
    averageEventLatencyMs:
      eventLatencyCount > 0 ? eventLatencySum / eventLatencyCount : null,
    averageQualityTransitionCount:
      qualityTransitionSamples > 0
        ? qualityTransitionSum / qualityTransitionSamples
        : 0,
    averageActEntropy: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.actEntropy
    ),
    averagePaletteEntropy: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.paletteEntropy
    ),
    averageStageShotClassEntropy: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.stageShotClassEntropy
    ),
    averageStageWorldModeEntropy: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.stageWorldModeEntropy
    ),
    averageActLongestRunMs: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.actLongestRunMs
    ),
    averagePaletteStateLongestRunMs: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.paletteStateLongestRunMs
    ),
    averageStageShotClassLongestRunMs: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.stageShotClassLongestRunMs
    ),
    averageStageWorldModeLongestRunMs: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.stageWorldModeLongestRunMs
    ),
    averageHeroTravelRangeX: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroTravelRangeX
    ),
    averageHeroTravelRangeY: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroTravelRangeY
    ),
    averageHeroTravelRangeZ: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroTravelRangeZ
    ),
    averageHeroRotationVariancePitch: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroRotationVariancePitch
    ),
    averageHeroRotationVarianceYaw: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroRotationVarianceYaw
    ),
    averageHeroRotationVarianceRoll: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroRotationVarianceRoll
    ),
    averageChamberTravelRangeX: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.chamberTravelRangeX
    ),
    averageChamberTravelRangeY: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.chamberTravelRangeY
    ),
    averageChamberTravelRangeZ: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.chamberTravelRangeZ
    ),
    averageChamberRotationVariancePitch: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.chamberRotationVariancePitch
    ),
    averageChamberRotationVarianceYaw: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.chamberRotationVarianceYaw
    ),
    averageChamberRotationVarianceRoll: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.chamberRotationVarianceRoll
    ),
    averageCameraTravelRangeX: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.cameraTravelRangeX
    ),
    averageCameraTravelRangeY: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.cameraTravelRangeY
    ),
    averageCameraTravelRangeZ: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.cameraTravelRangeZ
    ),
    averageCameraRotationVariancePitch: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.cameraRotationVariancePitch
    ),
    averageCameraRotationVarianceYaw: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.cameraRotationVarianceYaw
    ),
    averageCameraRotationVarianceRoll: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.cameraRotationVarianceRoll
    ),
    averageHeroOverreachFallbackRate: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.heroOverreachFallbackRate
    ),
    averageRingOverdrawFallbackRate: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.ringOverdrawFallbackRate
    ),
    averageOverbrightFallbackRate: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.overbrightFallbackRate
    ),
    averageWashoutFallbackRate: averageDefinedNumber(
      safeSummaries,
      (summary) => summary.visualSummary?.washoutFallbackRate
    ),
    oversizedWindowCount,
    multiEventWindowCount,
    triggerLines,
    sourceLines,
    activeQuickStartLines,
    launchQuickStartLines,
    qualityTierLines,
    actLines,
    paletteStateLines,
    atmosphereMatterStateLines,
    eventTimingDispositionLines,
    showFamilyLines: [...showFamilySpread.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    macroEventLines: [...macroEventSpread.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    spendProfileLines: [...spendProfileSpread.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    stageRingAuthorityLines: [...stageRingAuthoritySpread.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    signatureMomentLines: [...signatureMomentSpread.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    playableMotifSceneLines: [...playableMotifSceneSpread.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    playableMotifSceneTransitionReasonLines: [
      ...playableMotifSceneTransitionReasonSpread.entries()
    ]
      .sort((left, right) => right[1] - left[1])
      .map(([value, count]) => `- ${value} (${count})`),
    paletteStateSpreadByActLines,
    paletteStateSpreadByFamilyLines,
    stageShotClassSpreadByFamilyLines,
    stageWorldModeSpreadByFamilyLines,
    qualityFlagLines,
    customizedFromLaunchCount,
    launchedFromQuickStartCount,
    provenanceMismatchCount,
    proofStillSavedCount,
    invalidBuildIdentityCount,
    proofInvalidCount,
    proofIneligibleCount,
    scenarioMismatchCount,
    missingScenarioTagCount,
    topFindingLines
  };
}

export function buildCaptureSection(summary, workspaceRoot = process.cwd()) {
  const metadata = summary.metadata ?? {};
  const peaks = summary.peaks;
  const means = summary.means;
  const longestRuns = summary.longestRuns ?? {};
  const sourceMode = resolveSourceMode(metadata);
  const visual = summary.visualSummary ?? {
    dominantQualityTier: 'unknown',
    dominantPaletteState: 'unknown',
    dominantAct: 'unknown',
    dominantShowFamily: 'unknown',
    dominantMacroEvent: 'unknown',
    exposureMean: 0,
    exposurePeak: 0,
    bloomStrengthMean: 0,
    bloomStrengthPeak: 0,
    bloomThresholdMean: 0,
    bloomRadiusMean: 0,
    bloomRadiusPeak: 0,
    afterImageDampMean: 0,
    afterImageDampPeak: 0,
    ambientGlowMean: 0,
    ambientGlowPeak: 0,
    eventGlowMean: 0,
    eventGlowPeak: 0,
    worldGlowMean: 0,
    heroGlowMean: 0,
    shellGlowMean: 0,
    atmosphereMatterStateSpread: {},
    dominantAtmosphereMatterState: 'gas',
    atmosphereGasMean: 0,
    atmosphereLiquidMean: 0,
    atmospherePlasmaMean: 0,
    atmosphereCrystalMean: 0,
    atmospherePressureMean: 0,
    atmospherePressurePeak: 0,
    atmosphereIonizationMean: 0,
    atmosphereIonizationPeak: 0,
    atmosphereResidueMean: 0,
    atmosphereResiduePeak: 0,
    atmosphereStructureRevealMean: 0,
    atmosphereStructureRevealPeak: 0,
    showFamilySpread: {},
    actSpread: {},
    macroEventSpread: {},
    heroHueRange: 0,
    worldHueRange: 0,
    overbrightRate: 0,
    overbrightPeak: 0,
    heroScaleMean: 0,
    heroScalePeak: 0,
    heroScreenXMean: 0,
    heroScreenYMean: 0,
    ringAuthorityMean: 0,
    stageExposureCeilingMean: 0,
    stageBloomCeilingMean: 0,
    stageWashoutSuppressionMean: 0,
    stageHeroScaleMinMean: 0,
    stageHeroScaleMaxMean: 0,
    spendProfileSpread: {},
    dominantSpendProfile: 'unknown',
    stageRingAuthoritySpread: {},
    dominantStageRingAuthority: 'unknown',
    stageWorldModeSpread: {},
    dominantStageWorldMode: 'hold',
    signatureMomentSpread: {},
    dominantSignatureMoment: 'none',
    signatureMomentActiveRate: 0,
    signatureMomentIntensityMean: 0,
    signatureMomentIntensityPeak: 0,
    collapseScarMean: 0,
    collapseScarPeak: 0,
    cathedralOpenMean: 0,
    cathedralOpenPeak: 0,
    ghostResidueMean: 0,
    ghostResiduePeak: 0,
    silenceConstellationMean: 0,
    silenceConstellationPeak: 0,
    aftermathClearanceMean: 1,
    postConsequenceMean: 0,
    postOverprocessRiskMean: 0,
    postOverprocessRiskPeak: 0,
    stageShotClassSpread: {},
    dominantStageShotClass: 'unknown',
    stageTransitionClassSpread: {},
    dominantStageTransitionClass: 'unknown',
    stageTempoCadenceModeSpread: {},
    dominantStageTempoCadenceMode: 'unknown',
    qualityTransitionCount: 0,
    firstQualityDowngradeMs: null,
    assetLayerSummary: createZeroAssetLayerSummary(),
    temporalWindowMeans: {
      preBeatLift: 0,
      beatStrike: 0,
      postBeatRelease: 0,
      interBeatFloat: 0,
      barTurn: 0,
      phraseResolve: 0
    },
    paletteStateSpread: {}
  };
  const spendProfileSpread = visual.spendProfileSpread ?? {};
  const stageCueFamilySpread = visual.stageCueFamilySpread ?? {};
  const stageRingAuthoritySpread = visual.stageRingAuthoritySpread ?? {};
  const stageWorldModeSpread = visual.stageWorldModeSpread ?? {};
  const stageShotClassSpread = visual.stageShotClassSpread ?? {};
  const stageTransitionClassSpread = visual.stageTransitionClassSpread ?? {};
  const stageTempoCadenceModeSpread = visual.stageTempoCadenceModeSpread ?? {};
  const signatureMomentSpread = visual.signatureMomentSpread ?? {};
  const signatureMomentStyleSpread = visual.signatureMomentStyleSpread ?? {};
  const playableMotifSceneSpread = visual.playableMotifSceneSpread ?? {};
  const playableMotifSceneProfileSpread = visual.playableMotifSceneProfileSpread ?? {};
  const playableMotifSceneSilhouetteFamilySpread =
    visual.playableMotifSceneSilhouetteFamilySpread ?? {};
  const playableMotifSceneSurfaceRoleSpread =
    visual.playableMotifSceneSurfaceRoleSpread ?? {};
  const compositorMaskFamilySpread = visual.compositorMaskFamilySpread ?? {};
  const particleFieldJobSpread = visual.particleFieldJobSpread ?? {};
  const playableMotifSceneTransitionReasonSpread =
    visual.playableMotifSceneTransitionReasonSpread ?? {};
  const paletteStateSpreadByAct = visual.paletteStateSpreadByAct ?? {};
  const paletteStateSpreadByFamily = visual.paletteStateSpreadByFamily ?? {};
  const stageShotClassSpreadByFamily = visual.stageShotClassSpreadByFamily ?? {};
  const stageWorldModeSpreadByFamily = visual.stageWorldModeSpreadByFamily ?? {};
  const assetLayerLines = Object.entries(visual.assetLayerSummary ?? {})
    .filter((entry) => (entry[1]?.activeFrameRate ?? 0) > 0)
    .sort((left, right) => (right[1]?.activeFrameRate ?? 0) - (left[1]?.activeFrameRate ?? 0))
    .slice(0, 8)
    .map(
      ([key, value]) =>
        `- ${key}: active=${formatPercent(value?.activeFrameRate ?? 0)} mean=${formatNumber(value?.mean ?? 0)} peak=${formatNumber(value?.peak ?? 0)}`
    );

  return [
    `## ${metadata.label ?? path.basename(summary.filePath)}`,
    '',
    `- File: \`${path.relative(workspaceRoot, summary.filePath)}\``,
    `- Mode: \`${metadata.captureMode ?? 'manual'}\``,
    `- Proof scenario: ${formatProofScenarioKindLabel(
      resolveCaptureReviewScenarioKind(summary)
    )}`,
    `- Trigger: \`${metadata.triggerKind ?? 'manual'}\``,
    `- Trigger reason: ${metadata.triggerReason ?? 'n/a'}`,
    `- Dominant state: \`${summary.dominantState}\``,
    `- Event archetype: \`${summary.eventArchetype}\``,
    `- Source: ${metadata.sourceLabel ?? 'Unknown source'}`,
      `- Source mode: \`${sourceMode}\``,
      `- Build: ${metadata.buildInfo?.version ?? 'unknown'} / ${metadata.buildInfo?.commit ?? 'unknown'} / ${metadata.buildInfo?.lane ?? 'unknown'}${metadata.buildInfo?.proofStatus ? ` / ${metadata.buildInfo.proofStatus}` : ''}`,
      `- Build identity valid: ${metadata.buildInfo?.valid === true ? 'yes' : 'no'}`,
      `- Run id: ${metadata.runId ?? 'n/a'}`,
      `- Scenario assessment: ${
        metadata.scenarioAssessment
          ? `${metadata.scenarioAssessment.declaredScenario ?? 'unassigned'} -> ${metadata.scenarioAssessment.derivedScenario ?? 'unresolved'} (${metadata.scenarioAssessment.validated ? 'validated' : 'mismatch/pending'}, confidence ${formatPercent(metadata.scenarioAssessment.confidence ?? 0)})`
          : 'not recorded'
      }`,
      ...(summary.benchmark?.active
        ? [`- Active benchmark: ${summary.benchmark.label ?? summary.benchmark.id ?? 'unknown'}`]
        : []),
      ...(summary.benchmark
        ? [`- Benchmark kind: \`${resolveBenchmarkKind(summary)}\``]
        : []),
      `- Launch profile: ${resolveLaunchQuickStartLabel(metadata)}`,
      `- Active launch profile: ${resolveQuickStartLabel(metadata)}`,
      `- Serialized preset: ${metadata.controls?.preset ?? 'n/a'}`,
      `- Frames: ${summary.frameCount}`,
      `- Duration: ${formatMs(summary.durationMs)}`,
      `- Renderer: ${metadata.rendererBackend ?? 'n/a'} / ${metadata.qualityTier ?? 'n/a'}`,
      `- Raw path: ${metadata.rawPathGranted ? 'clean' : 'compromised'}`,
      `- Quality flags: ${(summary.qualityFlags ?? []).length > 0 ? summary.qualityFlags.join(', ') : 'none'}`,
    ...(typeof metadata.triggerCount === 'number'
      ? [
          `- Trigger hits in window: ${metadata.triggerCount}`,
          `- Window extensions: ${metadata.extensionCount ?? 0}`
        ]
      : []),
    '',
    '### Provenance',
    `- Launch profile: ${resolveLaunchQuickStartLabel(metadata)}`,
    `- Active launch profile: ${resolveQuickStartLabel(metadata)}`,
    `- Serialized preset: ${metadata.controls?.preset ?? 'n/a'}`,
    `- Provenance note: legacy quick-start metadata and serialized preset are both preserved here so the benchmark can keep room-floor provenance separate from control-state provenance.`,
    ...(resolveLaunchQuickStartLabel(metadata) !== resolveQuickStartLabel(metadata)
      ? [
          `- Provenance warning: launch profile ${resolveLaunchQuickStartLabel(metadata)} drifted to active launch profile ${resolveQuickStartLabel(metadata)}.`
        ]
      : []),
    ...(metadata.sourceSummary?.provenanceMismatch
      ? [`- Source mismatch: ${metadata.sourceSummary.provenanceNote ?? 'Serialized source provenance does not match the active source mode.'}`]
      : []),
    '',
    '### Boot and calibration',
    `- Calibration duration / samples: ${metadata.bootSummary?.calibrationDurationMs ?? 0}ms / ${metadata.bootSummary?.calibrationSampleCount ?? 0}`,
    `- Calibration p20 rms / p90 peak: ${formatNumber(metadata.bootSummary?.calibrationRmsPercentile20 ?? 0)} / ${formatNumber(metadata.bootSummary?.calibrationPeakPercentile90 ?? 0)}`,
    `- Noise floor / adaptive ceiling / minimum ceiling: ${formatNumber(metadata.bootSummary?.noiseFloor ?? 0)} / ${formatNumber(metadata.bootSummary?.adaptiveCeiling ?? 0)} / ${formatNumber(metadata.bootSummary?.minimumCeiling ?? 0)}`,
    `- Calibration peak: ${formatNumber(metadata.bootSummary?.calibrationPeak ?? 0)}`,
    '',
    '### Source integrity',
    `- Source mode / label: ${metadata.sourceSummary?.sourceMode ?? sourceMode} / ${metadata.sourceSummary?.sourceLabel ?? metadata.sourceLabel ?? 'unknown'}`,
    `- Selected input id: ${metadata.sourceSummary?.selectedInputId ?? metadata.selectedInputId ?? 'n/a'}`,
    `- Display audio granted: ${metadata.sourceSummary?.displayAudioGranted ? 'yes' : 'no'}`,
    `- Display track label: ${metadata.sourceSummary?.displayTrackLabel ?? 'n/a'}`,
    `- Provenance mismatch: ${metadata.sourceSummary?.provenanceMismatch ? 'yes' : 'no'}`,
    '',
    '### Occupancy',
    ...mapToOrderedLines(summary.stateOccupancy, summary.frameCount),
    '',
    '### Performance intent',
    ...mapToOrderedLines(summary.intentOccupancy, summary.frameCount),
    '',
    '### Moments',
    ...mapToOrderedLines(summary.momentCounts, summary.frameCount),
    '',
    '### Signal summary',
    `- Mean / peak body: ${formatNumber(means.body)} / ${formatNumber(peaks.body)}`,
    `- Mean / peak accent: ${formatNumber(means.accent)} / ${formatNumber(peaks.accent)}`,
    `- Mean / peak shimmer: ${formatNumber(means.shimmer)} / ${formatNumber(peaks.shimmer)}`,
    `- Mean / peak resonance: ${formatNumber(means.resonance)} / ${formatNumber(peaks.resonance)}`,
    `- Peak music confidence: ${formatNumber(peaks.musicConfidence)}`,
    `- Peak beat confidence: ${formatNumber(peaks.beatConfidence)}`,
    `- Peak phrase tension: ${formatNumber(peaks.phraseTension)}`,
    `- Peak drop impact: ${formatNumber(peaks.dropImpact)}`,
    `- Peak section change: ${formatNumber(peaks.sectionChange)}`,
    `- Peak release tail: ${formatNumber(peaks.releaseTail)}`,
    `- Peak ambience confidence: ${formatNumber(peaks.ambienceConfidence)}`,
    `- Peak speech confidence: ${formatNumber(peaks.speechConfidence)}`,
    `- Beat interval mean / stdev: ${summary.beatInterval.sampleCount > 0 ? `${formatNumber(summary.beatInterval.mean, 1)}ms / ${formatNumber(summary.beatInterval.stdev, 1)}ms` : 'n/a'}`,
    '',
    '### Visual summary',
    `- Dominant quality tier: ${visual.dominantQualityTier}`,
    `- Dominant act: ${visual.dominantAct}`,
    `- Dominant palette state: ${visual.dominantPaletteState}`,
    `- Dominant show family: ${visual.dominantShowFamily}`,
    `- Dominant macro event: ${visual.dominantMacroEvent}`,
    `- Dominant canonical cue: ${visual.dominantCanonicalCueClass ?? 'unknown'}`,
    `- Dominant performance regime: ${visual.dominantPerformanceRegime ?? 'unknown'}`,
    `- Dominant stage intent: ${visual.dominantStageIntent ?? 'unknown'}`,
    `- Dominant silence state: ${visual.dominantSilenceState ?? 'unknown'}`,
    `- Dominant spend profile: ${visual.dominantSpendProfile ?? 'unknown'}`,
    `- Dominant world mode: ${visual.dominantStageWorldMode ?? 'unknown'}`,
    `- Dominant atmosphere matter state: ${visual.dominantAtmosphereMatterState ?? 'gas'}`,
    `- Dominant signature moment/style: ${visual.dominantSignatureMoment ?? 'none'} / ${visual.dominantSignatureMomentStyle ?? 'contrast-mythic'}`,
    `- Dominant motif / base palette: ${visual.dominantVisualMotif ?? 'void-anchor'} / ${visual.dominantPaletteBaseState ?? visual.dominantPaletteState}`,
    `- Dominant playable scene / transition / driver: ${visual.dominantPlayableMotifScene ?? 'none'} / ${visual.dominantPlayableMotifSceneTransitionReason ?? 'hold'} / ${visual.dominantPlayableMotifSceneDriver ?? 'hold'}`,
    `- Dominant scene profile / silhouette / surface / mask / particle job: ${visual.dominantPlayableMotifSceneProfile ?? 'none'} / ${visual.dominantPlayableMotifSceneSilhouetteFamily ?? 'none'} / ${visual.dominantPlayableMotifSceneSurfaceRole ?? 'none'} / ${visual.dominantCompositorMaskFamily ?? 'none'} / ${visual.dominantParticleFieldJob ?? 'none'}`,
    `- Dominant hero role/form/reason: ${visual.dominantHeroRole ?? 'supporting'} / ${visual.dominantHeroForm ?? 'orb'} / ${visual.dominantHeroFormReason ?? 'hold'}`,
    `- Semantic confidence / unearned risk: ${formatNumber(visual.semanticConfidenceMean)} / ${formatNumber(visual.unearnedChangeRiskMean)}`,
    `- Hero planned-form match / switches-min / hue divergence: ${formatPercent(visual.plannedActiveHeroFormMatchRate)} / ${formatNumber(visual.heroFormSwitchesPerMinute)} / ${formatNumber(visual.heroWorldHueDivergenceMean)}`,
    `- Scene intent/motif/palette/profile match / silhouette: ${formatPercent(visual.playableMotifSceneIntentMatchRate)} / ${formatPercent(visual.playableMotifSceneMotifMatchRate)} / ${formatPercent(visual.playableMotifScenePaletteMatchRate)} / ${formatPercent(visual.playableMotifSceneProfileMatchRate)} / ${formatNumber(visual.playableMotifSceneSilhouetteConfidenceMean)}`,
    '',
    '### Compositor summary',
    `- Exposure mean / peak: ${formatNumber(visual.exposureMean)} / ${formatNumber(visual.exposurePeak)}`,
    `- Bloom strength mean / peak: ${formatNumber(visual.bloomStrengthMean)} / ${formatNumber(visual.bloomStrengthPeak)}`,
    `- Bloom threshold mean: ${formatNumber(visual.bloomThresholdMean)}`,
    `- Bloom radius mean / peak: ${formatNumber(visual.bloomRadiusMean)} / ${formatNumber(visual.bloomRadiusPeak)}`,
    `- Afterimage damp mean / peak: ${formatNumber(visual.afterImageDampMean)} / ${formatNumber(visual.afterImageDampPeak)}`,
    `- Ambient glow mean / peak: ${formatNumber(visual.ambientGlowMean)} / ${formatNumber(visual.ambientGlowPeak)}`,
    `- Event glow mean / peak: ${formatNumber(visual.eventGlowMean)} / ${formatNumber(visual.eventGlowPeak)}`,
    `- World / hero / shell glow mean: ${formatNumber(visual.worldGlowMean)} / ${formatNumber(visual.heroGlowMean)} / ${formatNumber(visual.shellGlowMean)}`,
    '',
    '### Signature moments',
    `- Signature moment spread: ${Object.keys(signatureMomentSpread).length > 0 ? Object.entries(signatureMomentSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Signature style spread: ${Object.keys(signatureMomentStyleSpread).length > 0 ? Object.entries(signatureMomentStyleSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Active rate / intensity mean / peak: ${formatPercent(visual.signatureMomentActiveRate)} / ${formatNumber(visual.signatureMomentIntensityMean)} / ${formatNumber(visual.signatureMomentIntensityPeak)}`,
    `- Trigger confidence / forced preview rate: ${formatNumber(visual.signatureMomentTriggerConfidenceMean)} / ${formatPercent(visual.signatureMomentForcedPreviewRate)}`,
    `- Playable scene spread: ${Object.keys(playableMotifSceneSpread).length > 0 ? Object.entries(playableMotifSceneSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Scene profile spread: ${Object.keys(playableMotifSceneProfileSpread).length > 0 ? Object.entries(playableMotifSceneProfileSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Scene silhouette spread: ${Object.keys(playableMotifSceneSilhouetteFamilySpread).length > 0 ? Object.entries(playableMotifSceneSilhouetteFamilySpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Scene surface spread: ${Object.keys(playableMotifSceneSurfaceRoleSpread).length > 0 ? Object.entries(playableMotifSceneSurfaceRoleSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Compositor mask spread: ${Object.keys(compositorMaskFamilySpread).length > 0 ? Object.entries(compositorMaskFamilySpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Particle field job spread: ${Object.keys(particleFieldJobSpread).length > 0 ? Object.entries(particleFieldJobSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Particle job telemetry coverage: ${formatPercent(visual.particleFieldJobTelemetryRate)}`,
    `- Playable scene transition spread: ${Object.keys(playableMotifSceneTransitionReasonSpread).length > 0 ? Object.entries(playableMotifSceneTransitionReasonSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Playable scene driver spread: ${Object.keys(visual.playableMotifSceneDriverSpread ?? {}).length > 0 ? Object.entries(visual.playableMotifSceneDriverSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Scene longest run / distinctness: ${formatMs(visual.playableMotifSceneLongestRunMs ?? 0)} / ${formatNumber(visual.playableMotifSceneDistinctnessMean)}`,
    `- Collapse scar mean / peak: ${formatNumber(visual.collapseScarMean)} / ${formatNumber(visual.collapseScarPeak)}`,
    `- Cathedral open mean / peak: ${formatNumber(visual.cathedralOpenMean)} / ${formatNumber(visual.cathedralOpenPeak)}`,
    `- Ghost residue mean / peak: ${formatNumber(visual.ghostResidueMean)} / ${formatNumber(visual.ghostResiduePeak)}`,
    `- Silence constellation mean / peak: ${formatNumber(visual.silenceConstellationMean)} / ${formatNumber(visual.silenceConstellationPeak)}`,
    `- Aftermath clearance / post consequence / post risk: ${formatNumber(visual.aftermathClearanceMean)} / ${formatNumber(visual.postConsequenceMean)} / ${formatNumber(visual.postOverprocessRiskMean)} peak ${formatNumber(visual.postOverprocessRiskPeak)}`,
    `- Compositor contrast/saturation/risk: ${formatNumber(visual.compositorContrastLiftMean)} / ${formatNumber(visual.compositorSaturationLiftMean)} / ${formatNumber(visual.compositorOverprocessRiskMean)} peak ${formatNumber(visual.compositorOverprocessRiskPeak)}`,
    `- Perceptual contrast/colorfulness/washout: ${formatNumber(visual.perceptualContrastMean)} / ${formatNumber(visual.perceptualColorfulnessMean)} / ${formatNumber(visual.perceptualWashoutRiskMean)} peak ${formatNumber(visual.perceptualWashoutRiskPeak)}`,
    '',
    '### Atmosphere summary',
    `- Matter-state spread: ${Object.keys(visual.atmosphereMatterStateSpread ?? {}).length > 0 ? Object.entries(visual.atmosphereMatterStateSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Gas / liquid / plasma / crystal mean: ${formatNumber(visual.atmosphereGasMean)} / ${formatNumber(visual.atmosphereLiquidMean)} / ${formatNumber(visual.atmospherePlasmaMean)} / ${formatNumber(visual.atmosphereCrystalMean)}`,
    `- Pressure mean / peak: ${formatNumber(visual.atmospherePressureMean)} / ${formatNumber(visual.atmospherePressurePeak)}`,
    `- Ionization mean / peak: ${formatNumber(visual.atmosphereIonizationMean)} / ${formatNumber(visual.atmosphereIonizationPeak)}`,
    `- Residue mean / peak: ${formatNumber(visual.atmosphereResidueMean)} / ${formatNumber(visual.atmosphereResiduePeak)}`,
    `- Structure reveal mean / peak: ${formatNumber(visual.atmosphereStructureRevealMean)} / ${formatNumber(visual.atmosphereStructureRevealPeak)}`,
    '',
    '### Governance summary',
    `- Spend profile spread: ${Object.keys(spendProfileSpread).length > 0 ? Object.entries(spendProfileSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Ring posture spread: ${Object.keys(visual.ringPostureSpread ?? {}).length > 0 ? Object.entries(visual.ringPostureSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Stage cue-family spread: ${Object.keys(stageCueFamilySpread).length > 0 ? Object.entries(stageCueFamilySpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Canonical cue-class spread: ${Object.keys(visual.canonicalCueClassSpread ?? {}).length > 0 ? Object.entries(visual.canonicalCueClassSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Performance regime spread: ${Object.keys(visual.performanceRegimeSpread ?? {}).length > 0 ? Object.entries(visual.performanceRegimeSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Stage intent spread: ${Object.keys(visual.stageIntentSpread ?? {}).length > 0 ? Object.entries(visual.stageIntentSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Silence-state spread: ${Object.keys(visual.silenceStateSpread ?? {}).length > 0 ? Object.entries(visual.silenceStateSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Stage ring authority spread: ${Object.keys(stageRingAuthoritySpread).length > 0 ? Object.entries(stageRingAuthoritySpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Hero scale mean / peak: ${formatNumber(visual.heroScaleMean)} / ${formatNumber(visual.heroScalePeak)}`,
    `- Hero screen X / Y mean: ${formatNumber(visual.heroScreenXMean)} / ${formatNumber(visual.heroScreenYMean)}`,
    `- Ring authority mean: ${formatNumber(visual.ringAuthorityMean)}`,
    `- Overbright rate / peak: ${formatNumber(visual.overbrightRate)} / ${formatNumber(visual.overbrightPeak)}`,
    `- Stage exposure / bloom ceiling mean: ${formatNumber(visual.stageExposureCeilingMean)} / ${formatNumber(visual.stageBloomCeilingMean)}`,
    `- Stage washout suppression mean: ${formatNumber(visual.stageWashoutSuppressionMean)}`,
    `- Stage hero scale min / max mean: ${formatNumber(visual.stageHeroScaleMinMean)} / ${formatNumber(visual.stageHeroScaleMaxMean)}`,
    `- Dominant stage ring authority: ${visual.dominantStageRingAuthority ?? 'unknown'}`,
    `- Stage shot-class spread: ${Object.keys(stageShotClassSpread).length > 0 ? Object.entries(stageShotClassSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Stage transition spread: ${Object.keys(stageTransitionClassSpread).length > 0 ? Object.entries(stageTransitionClassSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Stage cadence spread: ${Object.keys(stageTempoCadenceModeSpread).length > 0 ? Object.entries(stageTempoCadenceModeSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Stage world-mode spread: ${Object.keys(stageWorldModeSpread).length > 0 ? Object.entries(stageWorldModeSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Composition safety mean / unsafe rate: ${formatNumber(visual.stageCompositionSafetyMean)} / ${formatNumber(visual.compositionSafetyRate)}`,
    `- Hero coverage mean / peak: ${formatNumber(visual.heroCoverageMean)} / ${formatNumber(visual.heroCoveragePeak)}`,
    `- Hero off-center penalty mean / peak: ${formatNumber(visual.heroOffCenterPenaltyMean)} / ${formatNumber(visual.heroOffCenterPenaltyPeak)}`,
    `- Hero depth penalty mean / peak: ${formatNumber(visual.heroDepthPenaltyMean)} / ${formatNumber(visual.heroDepthPenaltyPeak)}`,
    `- Chamber presence mean / frame hierarchy mean: ${formatNumber(visual.chamberPresenceMean)} / ${formatNumber(visual.frameHierarchyMean)}`,
    `- Ring-belt persistence mean / peak: ${formatNumber(visual.ringBeltPersistenceMean)} / ${formatNumber(visual.ringBeltPersistencePeak)}`,
    `- Wirefield density mean / peak: ${formatNumber(visual.wirefieldDensityMean)} / ${formatNumber(visual.wirefieldDensityPeak)}`,
    `- World dominance delivered mean: ${formatNumber(visual.worldDominanceDeliveredMean)}`,
    '',
    '### Motion telemetry',
    `- Hero travel range X / Y / Z: ${formatNumber(visual.heroTravelRangeX)} / ${formatNumber(visual.heroTravelRangeY)} / ${formatNumber(visual.heroTravelRangeZ)}`,
    `- Hero rotation variance pitch / yaw / roll: ${formatNumber(visual.heroRotationVariancePitch)} / ${formatNumber(visual.heroRotationVarianceYaw)} / ${formatNumber(visual.heroRotationVarianceRoll)}`,
    `- Chamber travel range X / Y / Z: ${formatNumber(visual.chamberTravelRangeX)} / ${formatNumber(visual.chamberTravelRangeY)} / ${formatNumber(visual.chamberTravelRangeZ)}`,
    `- Chamber rotation variance pitch / yaw / roll: ${formatNumber(visual.chamberRotationVariancePitch)} / ${formatNumber(visual.chamberRotationVarianceYaw)} / ${formatNumber(visual.chamberRotationVarianceRoll)}`,
    `- Camera travel range X / Y / Z: ${formatNumber(visual.cameraTravelRangeX)} / ${formatNumber(visual.cameraTravelRangeY)} / ${formatNumber(visual.cameraTravelRangeZ)}`,
    `- Camera rotation variance pitch / yaw / roll: ${formatNumber(visual.cameraRotationVariancePitch)} / ${formatNumber(visual.cameraRotationVarianceYaw)} / ${formatNumber(visual.cameraRotationVarianceRoll)}`,
    '',
    '### Structure summary',
    `- Act / palette / shot / world entropy: ${formatNumber(visual.actEntropy)} / ${formatNumber(visual.paletteEntropy)} / ${formatNumber(visual.stageShotClassEntropy)} / ${formatNumber(visual.stageWorldModeEntropy)}`,
    `- Longest act / palette / shot / world run: ${formatMs(visual.actLongestRunMs)} / ${formatMs(visual.paletteStateLongestRunMs)} / ${formatMs(visual.stageShotClassLongestRunMs)} / ${formatMs(visual.stageWorldModeLongestRunMs)}`,
    `- Motif spread: ${Object.keys(visual.visualMotifSpread ?? {}).length > 0 ? Object.entries(visual.visualMotifSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Palette transition reasons: ${Object.keys(visual.paletteTransitionReasonSpread ?? {}).length > 0 ? Object.entries(visual.paletteTransitionReasonSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Hero form spread: ${Object.keys(visual.heroFormSpread ?? {}).length > 0 ? Object.entries(visual.heroFormSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Hero form reason spread: ${Object.keys(visual.heroFormReasonSpread ?? {}).length > 0 ? Object.entries(visual.heroFormReasonSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Longest base-palette / hero-form run: ${formatMs(visual.paletteBaseLongestRunMs)} / ${formatMs(visual.heroFormLongestRunMs)}`,
    `- Fallback rates hero-overreach / ring-overdraw / overbright / washout: ${formatPercent(visual.heroOverreachFallbackRate)} / ${formatPercent(visual.ringOverdrawFallbackRate)} / ${formatPercent(visual.overbrightFallbackRate)} / ${formatPercent(visual.washoutFallbackRate)}`,
    '',
    '### Cause spread',
    ...(Object.keys(paletteStateSpreadByAct).length > 0
      ? ['- Palette state by act:', ...formatNestedSpreadLines(paletteStateSpreadByAct)]
      : ['- Palette state by act: n/a']),
    ...(Object.keys(paletteStateSpreadByFamily).length > 0
      ? ['- Palette state by cue family:', ...formatNestedSpreadLines(paletteStateSpreadByFamily)]
      : ['- Palette state by cue family: n/a']),
    ...(Object.keys(stageShotClassSpreadByFamily).length > 0
      ? ['- Shot class by cue family:', ...formatNestedSpreadLines(stageShotClassSpreadByFamily)]
      : ['- Shot class by cue family: n/a']),
    ...(Object.keys(stageWorldModeSpreadByFamily).length > 0
      ? ['- World mode by cue family:', ...formatNestedSpreadLines(stageWorldModeSpreadByFamily)]
      : ['- World mode by cue family: n/a']),
    '',
    '### Chamber summary',
    `- Show family spread: ${Object.keys(visual.showFamilySpread).length > 0 ? Object.entries(visual.showFamilySpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Macro event spread: ${Object.keys(visual.macroEventSpread).length > 0 ? Object.entries(visual.macroEventSpread).map(([key, value]) => `${key}=${formatPercent(value)}`).join(', ') : 'n/a'}`,
    `- Hero / world hue range: ${formatNumber(visual.heroHueRange)} / ${formatNumber(visual.worldHueRange)}`,
    `- Temporal means (pre / beat / post / float / bar / phrase): ${formatNumber(visual.temporalWindowMeans.preBeatLift)} / ${formatNumber(visual.temporalWindowMeans.beatStrike)} / ${formatNumber(visual.temporalWindowMeans.postBeatRelease)} / ${formatNumber(visual.temporalWindowMeans.interBeatFloat)} / ${formatNumber(visual.temporalWindowMeans.barTurn)} / ${formatNumber(visual.temporalWindowMeans.phraseResolve)}`,
    `- Event timing: ${formatEventTimingSummary(summary.eventTimingDisposition, summary.eventLatencyMs)}`,
    '',
    '### Renderer stability',
    `- Quality transitions: ${visual.qualityTransitionCount ?? 0}`,
    `- First downgrade: ${typeof visual.firstQualityDowngradeMs === 'number' ? `${visual.firstQualityDowngradeMs.toFixed(0)}ms` : 'n/a'}`,
    '',
    '### Decision summary',
    formatDecisionBucket('State reasons', metadata.decisionSummary?.state),
    formatDecisionBucket('Show-state reasons', metadata.decisionSummary?.showState),
    formatDecisionBucket('Moment reasons', metadata.decisionSummary?.moment),
    formatDecisionBucket('Conductor reasons', metadata.decisionSummary?.conductor),
    '',
    '### Input drift',
    `- Noise floor start/end/min/max: ${formatNumber(metadata.inputDriftSummary?.noiseFloor?.start ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.noiseFloor?.end ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.noiseFloor?.min ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.noiseFloor?.max ?? 0)}`,
    `- Adaptive ceiling start/end/min/max: ${formatNumber(metadata.inputDriftSummary?.adaptiveCeiling?.start ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.adaptiveCeiling?.end ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.adaptiveCeiling?.min ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.adaptiveCeiling?.max ?? 0)}`,
    `- Raw rms start/end/min/max: ${formatNumber(metadata.inputDriftSummary?.rawRms?.start ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.rawRms?.end ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.rawRms?.min ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.rawRms?.max ?? 0)}`,
    `- Raw peak start/end/min/max: ${formatNumber(metadata.inputDriftSummary?.rawPeak?.start ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.rawPeak?.end ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.rawPeak?.min ?? 0)} / ${formatNumber(metadata.inputDriftSummary?.rawPeak?.max ?? 0)}`,
    `- Room-floor active rate: ${formatPercent(metadata.inputDriftSummary?.roomMusicFloorActiveRate ?? 0)}`,
    '',
    '### Asset-layer activity',
    ...(assetLayerLines.length > 0 ? assetLayerLines : ['- No asset-layer activity was serialized.']),
    '',
    '### Proof stills',
    `- Requested: ${metadata.proofStills?.requested ? 'yes' : 'no'}`,
    `- Saved: ${metadata.proofStills?.saved?.length ?? 0}`,
    ...(metadata.proofStills?.saved?.length
      ? metadata.proofStills.saved.map(
          (entry) => `- ${entry.kind}: ${entry.fileName} @ ${entry.timestampMs}ms`
        )
      : ['- No proof still files were attached to this capture.']),
    ...(metadata.proofStills?.warning ? [`- Warning: ${metadata.proofStills.warning}`] : []),
    '',
    '### Longest runs',
    formatLongestRun('Show state', longestRuns.showState),
    formatLongestRun('Performance intent', longestRuns.performanceIntent),
    formatLongestRun('Stage cue family', longestRuns.stageCueFamily),
    formatLongestRun('Stage shot class', longestRuns.stageShotClass),
    formatLongestRun('Stage transition class', longestRuns.stageTransitionClass),
    formatLongestRun('Stage cadence mode', longestRuns.stageTempoCadenceMode),
    '',
    '### Tuning flags',
    ...summary.findings.map((finding) => `- ${finding}`),
    ''
  ].join('\n');
}

export function buildAggregateSection(summaries, options = {}) {
  const manifestHealthLines = Array.isArray(options.manifestHealthLines)
    ? options.manifestHealthLines
    : [];
  const manifestHealth = options.manifestHealth ?? null;
  const evidenceFreshness =
    options.evidenceFreshness && typeof options.evidenceFreshness === 'object'
      ? options.evidenceFreshness
      : collectEvidenceFreshness(summaries, {
          benchmarkSummaries: options.benchmarkSummaries,
          evidencePolicy: manifestHealth?.evidencePolicy
        });
  const benchmarkReadSummaries = collectBenchmarkReadSummaries(
    summaries,
    Array.isArray(options.benchmarkSummaries) ? options.benchmarkSummaries : []
  );
  const legacySummaries = summaries.filter((summary) => isLegacyCaptureSummary(summary));
  const freshSummaries = summaries.filter((summary) => !isLegacyCaptureSummary(summary));
  const activeBenchmarkSummaries = benchmarkReadSummaries.filter((summary) => summary.benchmark?.active);
  const secondaryBenchmarkSummaries = benchmarkReadSummaries.filter(
    (summary) =>
      resolveBenchmarkKind(summary) === 'room-floor' &&
      !isHistoricalBenchmarkStatus(summary?.benchmark?.status)
  );
  const aggregateStats = buildAggregateStats(summaries);
  const freshStats =
    freshSummaries.length > 0 && freshSummaries.length !== summaries.length
      ? buildAggregateStats(freshSummaries)
      : null;
  const activeBenchmarkStats =
    activeBenchmarkSummaries.length > 0 ? buildAggregateStats(activeBenchmarkSummaries) : null;
  const secondaryBenchmarkStats =
    secondaryBenchmarkSummaries.length > 0
      ? buildAggregateStats(secondaryBenchmarkSummaries)
      : null;
  const activeBenchmarkLabel =
    activeBenchmarkSummaries[0]?.benchmark?.label ??
    activeBenchmarkSummaries[0]?.benchmark?.id ??
    null;
  const secondaryBenchmarkLabel =
    secondaryBenchmarkSummaries[0]?.benchmark?.label ??
    secondaryBenchmarkSummaries[0]?.benchmark?.id ??
    null;
  const proofScenarioCounts = new Map();

  for (const summary of summaries) {
    const proofScenarioKind = resolveCaptureReviewScenarioKind(summary);

    if (!proofScenarioKind) {
      continue;
    }

    incrementCounter(proofScenarioCounts, proofScenarioKind);
  }

  const proofScenarioLines = [...proofScenarioCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(
      ([proofScenarioKind, count]) =>
        `- ${formatProofScenarioKindLabel(proofScenarioKind)} (${count})`
    );
  const reviewGateLines = buildReviewGateLines({
    summaries,
    aggregateStats,
    manifestHealth,
    evidenceFreshness
  });

  return [
    '# Capture Analysis Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Capture count: ${summaries.length}`,
      ...(manifestHealthLines.length > 0
        ? ['', '## Manifest health', ...manifestHealthLines, '']
        : ['']),
      '## Evidence freshness',
      ...(Array.isArray(evidenceFreshness?.lines) && evidenceFreshness.lines.length > 0
        ? evidenceFreshness.lines
        : ['- Evidence freshness is unavailable.']),
      '',
      ...(legacySummaries.length > 0
        ? [
            `Fresh non-legacy captures: ${freshSummaries.length}`,
            `Legacy pre-wall-clock captures: ${legacySummaries.length}`,
            ''
          ]
        : ['']),
      ...(activeBenchmarkStats
        ? [
            `Active benchmark captures: ${activeBenchmarkSummaries.length}`,
            `Active benchmark label: ${activeBenchmarkLabel ?? 'unknown'}`,
            '- Historical captures remain useful context, but they are not the active benchmark truth.',
            ''
          ]
        : []),
      ...(secondaryBenchmarkStats
        ? [
            `Secondary floor captures: ${secondaryBenchmarkSummaries.length}`,
            `Secondary floor label: ${secondaryBenchmarkLabel ?? 'unknown'}`,
            ''
          ]
        : []),
      '',
      '## Aggregate read',
    `- Average peak music confidence: ${formatNumber(aggregateStats.averagePeakMusic)}`,
    `- Average peak drop impact: ${formatNumber(aggregateStats.averagePeakDrop)}`,
    `- Average peak accent: ${formatNumber(aggregateStats.averagePeakAccent)}`,
    `- Average capture duration: ${formatMs(aggregateStats.averageDurationMs)}`,
    `- Oversized windows: ${aggregateStats.oversizedWindowCount}`,
    `- Multi-event windows: ${aggregateStats.multiEventWindowCount}`,
    `- Average exposure mean / peak: ${formatNumber(aggregateStats.averageExposureMean)} / ${formatNumber(aggregateStats.averageExposurePeak)}`,
    `- Average bloom strength mean / peak: ${formatNumber(aggregateStats.averageBloomStrengthMean)} / ${formatNumber(aggregateStats.averageBloomStrengthPeak)}`,
    `- Average bloom threshold mean: ${formatNumber(aggregateStats.averageBloomThresholdMean)}`,
    `- Average bloom radius mean / peak: ${formatNumber(aggregateStats.averageBloomRadiusMean)} / ${formatNumber(aggregateStats.averageBloomRadiusPeak)}`,
    `- Average afterimage damp mean / peak: ${formatNumber(aggregateStats.averageAfterImageDampMean)} / ${formatNumber(aggregateStats.averageAfterImageDampPeak)}`,
    `- Average ambient glow mean: ${formatNumber(aggregateStats.averageAmbientGlowMean)}`,
    `- Average event glow mean: ${formatNumber(aggregateStats.averageEventGlowMean)}`,
    `- Average hero hue range: ${formatNumber(aggregateStats.averageHeroHueRange)}`,
    `- Average world hue range: ${formatNumber(aggregateStats.averageWorldHueRange)}`,
    `- Average atmosphere pressure mean / peak: ${formatNumber(aggregateStats.averageAtmospherePressureMean)} / ${formatNumber(aggregateStats.averageAtmospherePressurePeak)}`,
    `- Average atmosphere ionization mean / peak: ${formatNumber(aggregateStats.averageAtmosphereIonizationMean)} / ${formatNumber(aggregateStats.averageAtmosphereIonizationPeak)}`,
    `- Average atmosphere residue mean / peak: ${formatNumber(aggregateStats.averageAtmosphereResidueMean)} / ${formatNumber(aggregateStats.averageAtmosphereResiduePeak)}`,
    `- Average atmosphere structure-reveal mean / peak: ${formatNumber(aggregateStats.averageAtmosphereStructureRevealMean)} / ${formatNumber(aggregateStats.averageAtmosphereStructureRevealPeak)}`,
    `- Average overbright rate / peak: ${formatNumber(aggregateStats.averageOverbrightRate)} / ${formatNumber(aggregateStats.averageOverbrightPeak)}`,
    `- Average hero scale mean / peak: ${formatNumber(aggregateStats.averageHeroScaleMean)} / ${formatNumber(aggregateStats.averageHeroScalePeak)}`,
    `- Average hero screen X / Y mean: ${formatNumber(aggregateStats.averageHeroScreenXMean)} / ${formatNumber(aggregateStats.averageHeroScreenYMean)}`,
    `- Average ring authority mean: ${formatNumber(aggregateStats.averageRingAuthorityMean)}`,
    `- Average hero travel range X / Y / Z: ${formatNumber(aggregateStats.averageHeroTravelRangeX)} / ${formatNumber(aggregateStats.averageHeroTravelRangeY)} / ${formatNumber(aggregateStats.averageHeroTravelRangeZ)}`,
    `- Average chamber travel range X / Y / Z: ${formatNumber(aggregateStats.averageChamberTravelRangeX)} / ${formatNumber(aggregateStats.averageChamberTravelRangeY)} / ${formatNumber(aggregateStats.averageChamberTravelRangeZ)}`,
    `- Average camera travel range X / Y / Z: ${formatNumber(aggregateStats.averageCameraTravelRangeX)} / ${formatNumber(aggregateStats.averageCameraTravelRangeY)} / ${formatNumber(aggregateStats.averageCameraTravelRangeZ)}`,
    `- Average act / palette / shot / world entropy: ${formatNumber(aggregateStats.averageActEntropy)} / ${formatNumber(aggregateStats.averagePaletteEntropy)} / ${formatNumber(aggregateStats.averageStageShotClassEntropy)} / ${formatNumber(aggregateStats.averageStageWorldModeEntropy)}`,
    `- Average longest act / palette / shot / world run: ${aggregateStats.averageActLongestRunMs == null ? 'n/a' : formatMs(aggregateStats.averageActLongestRunMs)} / ${aggregateStats.averagePaletteStateLongestRunMs == null ? 'n/a' : formatMs(aggregateStats.averagePaletteStateLongestRunMs)} / ${aggregateStats.averageStageShotClassLongestRunMs == null ? 'n/a' : formatMs(aggregateStats.averageStageShotClassLongestRunMs)} / ${aggregateStats.averageStageWorldModeLongestRunMs == null ? 'n/a' : formatMs(aggregateStats.averageStageWorldModeLongestRunMs)}`,
    `- Average fallback rates hero-overreach / ring-overdraw / overbright / washout: ${formatPercent(aggregateStats.averageHeroOverreachFallbackRate)} / ${formatPercent(aggregateStats.averageRingOverdrawFallbackRate)} / ${formatPercent(aggregateStats.averageOverbrightFallbackRate)} / ${formatPercent(aggregateStats.averageWashoutFallbackRate)}`,
    `- Average stage exposure / bloom ceiling mean: ${formatNumber(aggregateStats.averageStageExposureCeilingMean)} / ${formatNumber(aggregateStats.averageStageBloomCeilingMean)}`,
    `- Average stage washout suppression mean: ${formatNumber(aggregateStats.averageStageWashoutSuppressionMean)}`,
    `- Average stage hero scale min / max mean: ${formatNumber(aggregateStats.averageStageHeroScaleMinMean)} / ${formatNumber(aggregateStats.averageStageHeroScaleMaxMean)}`,
    `- Average signature-moment active rate / post risk: ${formatPercent(aggregateStats.averageSignatureMomentActiveRate)} / ${formatNumber(aggregateStats.averagePostOverprocessRiskMean)}`,
    `- Average playable-scene motif/palette match: ${formatPercent(aggregateStats.averagePlayableMotifSceneMotifMatchRate)} / ${formatPercent(aggregateStats.averagePlayableMotifScenePaletteMatchRate)}`,
    `- Average playable-scene distinctness / silhouette: ${formatNumber(aggregateStats.averagePlayableMotifSceneDistinctnessMean)} / ${formatNumber(aggregateStats.averagePlayableMotifSceneSilhouetteConfidenceMean)}`,
    `- Average playable-scene longest run: ${formatMs(aggregateStats.averagePlayableMotifSceneLongestRunMs)}`,
    `- Average event latency (non-precharged): ${aggregateStats.averageEventLatencyMs === null ? 'n/a' : `${aggregateStats.averageEventLatencyMs.toFixed(0)}ms`}`,
    `- Average quality transitions per capture: ${formatNumber(aggregateStats.averageQualityTransitionCount)}`,
    `- Source provenance mismatches: ${aggregateStats.provenanceMismatchCount}`,
    `- Saved proof still files: ${aggregateStats.proofStillSavedCount}`,
    '',
    '### Review gates',
    ...reviewGateLines,
    '',
    '### Governance spread',
    ...(aggregateStats.spendProfileLines.length > 0
      ? aggregateStats.spendProfileLines
      : ['- No spend profiles were recorded.']),
      ...(aggregateStats.stageRingAuthorityLines.length > 0
        ? aggregateStats.stageRingAuthorityLines
        : ['- No stage ring authority values were recorded.']),
      '',
      '### Signature moment spread',
      ...(aggregateStats.signatureMomentLines.length > 0
        ? aggregateStats.signatureMomentLines
        : ['- No signature moments were recorded.']),
      '',
      '### Playable motif scene spread',
      ...(aggregateStats.playableMotifSceneLines.length > 0
        ? aggregateStats.playableMotifSceneLines
        : ['- No playable motif scenes were recorded.']),
      '',
      '### Playable motif scene transition spread',
      ...(aggregateStats.playableMotifSceneTransitionReasonLines.length > 0
        ? aggregateStats.playableMotifSceneTransitionReasonLines
        : ['- No playable motif scene transition reasons were recorded.']),
      '',
      '### Coverage debt and monopolies',
      ...buildCoverageDebtLines(summaries),
      '',
      ...buildBenchmarkReadSections(summaries, {
        benchmarkSummaries: options.benchmarkSummaries
      }),
      '',
    '### Quality-tier spread',
    ...(aggregateStats.qualityTierLines.length > 0
      ? aggregateStats.qualityTierLines
      : ['- No quality tiers were recorded.']),
    '',
    '### Proof scenario spread',
    ...(proofScenarioLines.length > 0
      ? proofScenarioLines
      : ['- No proof scenarios were tagged on these captures.']),
    '',
    '### Act spread',
    ...(aggregateStats.actLines.length > 0
      ? aggregateStats.actLines
      : ['- No acts were recorded.']),
    '',
    '### Palette-state spread',
    ...(aggregateStats.paletteStateLines.length > 0
      ? aggregateStats.paletteStateLines
      : ['- No palette states were recorded.']),
    '',
    '### Atmosphere matter-state spread',
    ...(aggregateStats.atmosphereMatterStateLines.length > 0
      ? aggregateStats.atmosphereMatterStateLines
      : ['- No atmosphere matter states were recorded.']),
    '',
    '### Event timing spread',
    ...(aggregateStats.eventTimingDispositionLines.length > 0
      ? aggregateStats.eventTimingDispositionLines
      : ['- No event timing dispositions were recorded.']),
    '',
    '### Cause spread',
    ...(aggregateStats.paletteStateSpreadByActLines.length > 0
      ? ['- Palette state by act:', ...aggregateStats.paletteStateSpreadByActLines]
      : ['- Palette state by act: n/a']),
    ...(aggregateStats.paletteStateSpreadByFamilyLines.length > 0
      ? ['- Palette state by cue family:', ...aggregateStats.paletteStateSpreadByFamilyLines]
      : ['- Palette state by cue family: n/a']),
    ...(aggregateStats.stageShotClassSpreadByFamilyLines.length > 0
      ? ['- Shot class by cue family:', ...aggregateStats.stageShotClassSpreadByFamilyLines]
      : ['- Shot class by cue family: n/a']),
    ...(aggregateStats.stageWorldModeSpreadByFamilyLines.length > 0
      ? ['- World mode by cue family:', ...aggregateStats.stageWorldModeSpreadByFamilyLines]
      : ['- World mode by cue family: n/a']),
    '',
    '### Chamber spread',
    ...(aggregateStats.showFamilyLines.length > 0
      ? aggregateStats.showFamilyLines
      : ['- No show families were recorded.']),
    '',
    '### Macro-event spread',
    ...(aggregateStats.macroEventLines.length > 0
      ? aggregateStats.macroEventLines
      : ['- No macro events were recorded.']),
    '',
    '### Source mode spread',
    ...(aggregateStats.sourceLines.length > 0
      ? aggregateStats.sourceLines
      : ['- No source modes were recorded.']),
    '',
    '### Launch profile spread',
    ...(aggregateStats.launchQuickStartLines.length > 0
      ? aggregateStats.launchQuickStartLines
      : ['- No launch profiles were recorded.']),
    '',
    '### Active launch profile spread',
    ...(aggregateStats.activeQuickStartLines.length > 0
      ? aggregateStats.activeQuickStartLines
      : ['- No active launch profiles were recorded.']),
    '',
    `- Captures launched from authored profiles: ${aggregateStats.launchedFromQuickStartCount}`,
    `- Captures customized away from their launch profile: ${aggregateStats.customizedFromLaunchCount}`,
    '',
    ...(freshStats
      ? [
          '## Fresh capture read',
          `- Average peak music confidence: ${formatNumber(freshStats.averagePeakMusic)}`,
          `- Average peak drop impact: ${formatNumber(freshStats.averagePeakDrop)}`,
          `- Average peak accent: ${formatNumber(freshStats.averagePeakAccent)}`,
          `- Average capture duration: ${formatMs(freshStats.averageDurationMs)}`,
          `- Oversized windows: ${freshStats.oversizedWindowCount}`,
          `- Multi-event windows: ${freshStats.multiEventWindowCount}`,
          `- Average exposure mean / peak: ${formatNumber(freshStats.averageExposureMean)} / ${formatNumber(freshStats.averageExposurePeak)}`,
          `- Average bloom strength mean / peak: ${formatNumber(freshStats.averageBloomStrengthMean)} / ${formatNumber(freshStats.averageBloomStrengthPeak)}`,
          `- Average bloom threshold mean: ${formatNumber(freshStats.averageBloomThresholdMean)}`,
          `- Average bloom radius mean / peak: ${formatNumber(freshStats.averageBloomRadiusMean)} / ${formatNumber(freshStats.averageBloomRadiusPeak)}`,
          `- Average afterimage damp mean / peak: ${formatNumber(freshStats.averageAfterImageDampMean)} / ${formatNumber(freshStats.averageAfterImageDampPeak)}`,
          `- Average ambient glow mean: ${formatNumber(freshStats.averageAmbientGlowMean)}`,
          `- Average event glow mean: ${formatNumber(freshStats.averageEventGlowMean)}`,
          `- Average hero hue range: ${formatNumber(freshStats.averageHeroHueRange)}`,
          `- Average world hue range: ${formatNumber(freshStats.averageWorldHueRange)}`,
          `- Average atmosphere pressure mean / peak: ${formatNumber(freshStats.averageAtmospherePressureMean)} / ${formatNumber(freshStats.averageAtmospherePressurePeak)}`,
          `- Average atmosphere ionization mean / peak: ${formatNumber(freshStats.averageAtmosphereIonizationMean)} / ${formatNumber(freshStats.averageAtmosphereIonizationPeak)}`,
          `- Average atmosphere residue mean / peak: ${formatNumber(freshStats.averageAtmosphereResidueMean)} / ${formatNumber(freshStats.averageAtmosphereResiduePeak)}`,
          `- Average atmosphere structure-reveal mean / peak: ${formatNumber(freshStats.averageAtmosphereStructureRevealMean)} / ${formatNumber(freshStats.averageAtmosphereStructureRevealPeak)}`,
          `- Average playable-scene motif/palette match: ${formatPercent(freshStats.averagePlayableMotifSceneMotifMatchRate)} / ${formatPercent(freshStats.averagePlayableMotifScenePaletteMatchRate)}`,
          `- Average playable-scene distinctness / silhouette: ${formatNumber(freshStats.averagePlayableMotifSceneDistinctnessMean)} / ${formatNumber(freshStats.averagePlayableMotifSceneSilhouetteConfidenceMean)}`,
          `- Average playable-scene longest run: ${formatMs(freshStats.averagePlayableMotifSceneLongestRunMs)}`,
          `- Average hero travel range X / Y / Z: ${formatNumber(freshStats.averageHeroTravelRangeX)} / ${formatNumber(freshStats.averageHeroTravelRangeY)} / ${formatNumber(freshStats.averageHeroTravelRangeZ)}`,
          `- Average chamber travel range X / Y / Z: ${formatNumber(freshStats.averageChamberTravelRangeX)} / ${formatNumber(freshStats.averageChamberTravelRangeY)} / ${formatNumber(freshStats.averageChamberTravelRangeZ)}`,
          `- Average camera travel range X / Y / Z: ${formatNumber(freshStats.averageCameraTravelRangeX)} / ${formatNumber(freshStats.averageCameraTravelRangeY)} / ${formatNumber(freshStats.averageCameraTravelRangeZ)}`,
          `- Average act / palette / shot / world entropy: ${formatNumber(freshStats.averageActEntropy)} / ${formatNumber(freshStats.averagePaletteEntropy)} / ${formatNumber(freshStats.averageStageShotClassEntropy)} / ${formatNumber(freshStats.averageStageWorldModeEntropy)}`,
          `- Average event latency (non-precharged): ${freshStats.averageEventLatencyMs === null ? 'n/a' : `${freshStats.averageEventLatencyMs.toFixed(0)}ms`}`,
          '',
          '### Fresh quality-tier spread',
          ...(freshStats.qualityTierLines.length > 0
            ? freshStats.qualityTierLines
            : ['- No quality tiers were recorded.']),
          '',
          '### Fresh act spread',
          ...(freshStats.actLines.length > 0
            ? freshStats.actLines
            : ['- No acts were recorded.']),
          '',
          '### Fresh palette-state spread',
          ...(freshStats.paletteStateLines.length > 0
            ? freshStats.paletteStateLines
            : ['- No palette states were recorded.']),
          '',
          '### Fresh playable motif scene spread',
          ...(freshStats.playableMotifSceneLines.length > 0
            ? freshStats.playableMotifSceneLines
            : ['- No playable motif scenes were recorded.']),
          '',
          '### Fresh playable motif scene transition spread',
          ...(freshStats.playableMotifSceneTransitionReasonLines.length > 0
            ? freshStats.playableMotifSceneTransitionReasonLines
            : ['- No playable motif scene transition reasons were recorded.']),
          '',
          '### Fresh cause spread',
          ...(freshStats.paletteStateSpreadByActLines.length > 0
            ? ['- Palette state by act:', ...freshStats.paletteStateSpreadByActLines]
            : ['- Palette state by act: n/a']),
          ...(freshStats.paletteStateSpreadByFamilyLines.length > 0
            ? ['- Palette state by cue family:', ...freshStats.paletteStateSpreadByFamilyLines]
            : ['- Palette state by cue family: n/a']),
          ...(freshStats.stageShotClassSpreadByFamilyLines.length > 0
            ? ['- Shot class by cue family:', ...freshStats.stageShotClassSpreadByFamilyLines]
            : ['- Shot class by cue family: n/a']),
          ...(freshStats.stageWorldModeSpreadByFamilyLines.length > 0
            ? ['- World mode by cue family:', ...freshStats.stageWorldModeSpreadByFamilyLines]
            : ['- World mode by cue family: n/a']),
          '',
          '### Fresh chamber spread',
          ...(freshStats.showFamilyLines.length > 0
            ? freshStats.showFamilyLines
            : ['- No show families were recorded.']),
          '',
          '### Fresh macro-event spread',
          ...(freshStats.macroEventLines.length > 0
            ? freshStats.macroEventLines
            : ['- No macro events were recorded.']),
          '',
          '### Fresh source mode spread',
          ...(freshStats.sourceLines.length > 0
            ? freshStats.sourceLines
            : ['- No source modes were recorded.']),
          '',
          '### Fresh launch profile spread',
          ...(freshStats.launchQuickStartLines.length > 0
            ? freshStats.launchQuickStartLines
            : ['- No launch profiles were recorded.']),
          '',
          '### Fresh active launch profile spread',
          ...(freshStats.activeQuickStartLines.length > 0
            ? freshStats.activeQuickStartLines
            : ['- No active launch profiles were recorded.']),
          '',
          `- Fresh captures launched from authored profiles: ${freshStats.launchedFromQuickStartCount}`,
          `- Fresh captures customized away from their launch profile: ${freshStats.customizedFromLaunchCount}`,
          '',
          '### Fresh trigger/archetype spread',
          ...(freshStats.triggerLines.length > 0
            ? freshStats.triggerLines
            : ['- No trigger archetypes could be derived.']),
          '',
          '### Fresh most common flags',
          ...(freshStats.topFindingLines.length > 0
            ? freshStats.topFindingLines
            : ['- No repeated flags were inferred.']),
          ''
        ]
      : []),
    '## Trigger/archetype spread',
    ...(aggregateStats.triggerLines.length > 0
      ? aggregateStats.triggerLines
      : ['- No trigger archetypes could be derived.']),
    '',
    '## Most common flags',
    ...(aggregateStats.topFindingLines.length > 0
      ? aggregateStats.topFindingLines
      : ['- No repeated flags were inferred.']),
    '',
    '## Quality flags',
    ...(aggregateStats.qualityFlagLines.length > 0
      ? aggregateStats.qualityFlagLines
      : ['- No capture-quality flags were recorded.']),
    ''
  ].join('\n');
}
