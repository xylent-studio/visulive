import fs from 'node:fs/promises';
import path from 'node:path';
import {
  analyzeCaptureTargets,
  collectBenchmarkManifestHealth,
  collectRunArtifacts,
  captureRoot,
  inboxRoot,
  loadManifestBenchmarkSummaries,
  reportRoot,
  workspaceRoot
} from './capture-reporting.mjs';
import {
  collectEvidenceFreshness,
  formatProofScenarioKindLabel,
  formatMs,
  formatNumber,
  formatPercent,
  formatTimestamp,
  resolveCaptureReviewScenarioKind,
  timestampLabel
} from './capture-analysis-core.mjs';
import { buildBatchRecommendationArtifact } from './evidence-recommendations.mjs';
import { collectMissedCaptureOpportunities } from './report-missed-opportunities.mjs';

function parseArgs(argv) {
  const args = {
    captures: inboxRoot,
    report: path.join(reportRoot, 'capture-analysis_latest.md'),
    screenshots: path.join(captureRoot, 'inbox', 'screenshots'),
    output: null,
    manifest: null,
    recommendations: null,
    limit: 3,
    strict: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--captures':
        args.captures = argv[++index] ?? args.captures;
        break;
      case '--report':
        args.report = argv[++index] ?? args.report;
        break;
      case '--screenshots':
        args.screenshots = argv[++index] ?? args.screenshots;
        break;
      case '--output':
        args.output = argv[++index] ?? null;
        break;
      case '--manifest':
        args.manifest = argv[++index] ?? null;
        break;
      case '--recommendations':
        args.recommendations = argv[++index] ?? null;
        break;
      case '--limit':
        args.limit = Math.max(1, Number.parseInt(argv[++index] ?? '3', 10) || 3);
        break;
      case '--strict':
      case '--fail-on-gate-failure':
        args.strict = true;
        break;
      default:
        break;
    }
  }

  return args;
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function collectScreenshotInventory(screenshotsPath) {
  try {
    const entries = await fs.readdir(screenshotsPath, { withFileTypes: true });
    const screenshots = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) {
        continue;
      }

      const absolutePath = path.join(screenshotsPath, entry.name);
      const stat = await fs.stat(absolutePath);

      screenshots.push({
        name: entry.name,
        path: absolutePath,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString()
      });
    }

    return screenshots.sort((left, right) => {
      const modifiedDelta =
        new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
      if (modifiedDelta !== 0) {
        return modifiedDelta;
      }

      return right.name.localeCompare(left.name, 'en', { numeric: true });
    });
  } catch {
    return [];
  }
}

async function collectRunStillInventory(runArtifacts = []) {
  const stills = [];
  const seen = new Set();

  for (const entry of runArtifacts) {
    if (entry.artifactType !== 'run-journal') {
      continue;
    }

    const runId = entry.artifact?.metadata?.runId;
    const checkpointStills = Array.isArray(entry.artifact?.checkpointStills)
      ? entry.artifact.checkpointStills
      : [];
    const runDirectory = path.dirname(entry.filePath);

    for (const still of checkpointStills) {
      if (typeof still?.fileName !== 'string' || !still.fileName) {
        continue;
      }

      const absolutePath = path.join(runDirectory, 'stills', still.fileName);
      if (seen.has(absolutePath)) {
        continue;
      }

      try {
        const stat = await fs.stat(absolutePath);
        seen.add(absolutePath);
        stills.push({
          name: runId ? `${runId}/${still.fileName}` : still.fileName,
          path: absolutePath,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          kind: still.kind ?? 'run-still',
          timestampMs: still.timestampMs
        });
      } catch {
        // Missing still files are judged by run validity; don't let one broken ref stop reporting.
      }
    }
  }

  return stills.sort((left, right) => {
    const modifiedDelta =
      new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
    if (modifiedDelta !== 0) {
      return modifiedDelta;
    }

    return right.name.localeCompare(left.name, 'en', { numeric: true });
  });
}

function inferCueClass(summary) {
  const canonicalCueClass = summary.visualSummary?.dominantCanonicalCueClass;
  const hasCanonicalCueCoverage = Object.values(
    summary.visualSummary?.canonicalCueClassSpread ?? {}
  ).some((value) => typeof value === 'number' && value > 0);
  if (
    hasCanonicalCueCoverage &&
    (canonicalCueClass === 'hold' ||
      canonicalCueClass === 'gather' ||
      canonicalCueClass === 'tighten' ||
      canonicalCueClass === 'reveal' ||
      canonicalCueClass === 'orbit-widen' ||
      canonicalCueClass === 'fan-sweep' ||
      canonicalCueClass === 'laser-burst' ||
      canonicalCueClass === 'rupture' ||
      canonicalCueClass === 'collapse' ||
      canonicalCueClass === 'haunt' ||
      canonicalCueClass === 'residue' ||
      canonicalCueClass === 'recovery')
  ) {
    return canonicalCueClass;
  }

  const stageCueFamily = summary.visualSummary?.dominantStageCueFamily;
  if (
    stageCueFamily === 'brood' ||
    stageCueFamily === 'gather' ||
    stageCueFamily === 'reveal' ||
    stageCueFamily === 'rupture' ||
    stageCueFamily === 'release' ||
    stageCueFamily === 'haunt' ||
    stageCueFamily === 'reset'
  ) {
    return stageCueFamily;
  }

  const activeAct = summary.visualSummary?.dominantAct ?? 'unknown';
  const eventArchetype = summary.eventArchetype ?? 'unknown';
  const triggerKind = summary.metadata?.triggerKind ?? 'manual';

  if (activeAct === 'ghost-afterimage' || eventArchetype === 'ghost-trace' || triggerKind === 'release') {
    return 'haunt';
  }

  if (activeAct === 'eclipse-rupture' || eventArchetype === 'collapse' || triggerKind === 'drop') {
    return 'rupture';
  }

  if (activeAct === 'laser-bloom' || eventArchetype === 'portal-open') {
    return 'reveal';
  }

  if (activeAct === 'matrix-storm' || eventArchetype === 'strike-burst') {
    return 'gather';
  }

  if (activeAct === 'void-chamber') {
    return 'brood';
  }

  return 'gather';
}

function scoreCapture(summary) {
  const visual = summary.visualSummary ?? {};
  const peakEvent = visual.eventGlowPeak ?? 0;
  const meanEvent = visual.eventGlowMean ?? 0;
  const peakHero = summary.peaks?.heroGlowSpend ?? 0;
  const peakWorld = summary.peaks?.worldGlowSpend ?? 0;
  const heroHueRange = visual.heroHueRange ?? 0;
  const worldHueRange = visual.worldHueRange ?? 0;
  const activeAct = visual.dominantAct ?? 'unknown';
  const dominantFamily = visual.dominantShowFamily ?? 'unknown';
  const qualityFlags = new Set(summary.qualityFlags ?? []);
  const cueClass = inferCueClass(summary);
  const overbrightRate = visual.overbrightRate ?? 0;
  const heroScalePeak = visual.heroScalePeak ?? 0;
  const ringAuthorityMean = visual.ringAuthorityMean ?? 0;

  let score =
    peakEvent * 3.5 +
    meanEvent * 1.8 +
    peakHero * 0.8 +
    peakWorld * 0.8 +
    heroHueRange * 0.8 +
    worldHueRange * 0.9 +
    Math.min(heroScalePeak, 2.4) * 0.45 +
    ringAuthorityMean * 0.9 -
    overbrightRate * 3.2;

  if (summary.visualSummary?.dominantQualityTier === 'safe') {
    score += 0.5;
  }

  if (['eclipse-rupture', 'ghost-afterimage', 'laser-bloom'].includes(activeAct)) {
    score += 1;
  }

  if (dominantFamily !== 'unknown' && dominantFamily !== 'eclipse-chamber') {
    score += 0.4;
  }

  if (cueClass === 'rupture' || cueClass === 'haunt') {
    score += 0.5;
  }

  if (qualityFlags.has('undercommittedDrop')) {
    score -= 1.3;
  }

  if (qualityFlags.has('weakPhraseRelease')) {
    score -= 0.6;
  }

  if (qualityFlags.has('lowPaletteVariation')) {
    score -= 0.4;
  }

  if (qualityFlags.has('safeTierActive')) {
    score += 0.4;
  }

  return score;
}

function buildGateStatus(label, passed, rationale, failure = false) {
  return {
    label,
    status: passed ? 'pass' : failure ? 'fail' : 'warn',
    required: failure === true,
    rationale
  };
}

const AUTHORITY_PROOF_THRESHOLDS = {
  chamberPresenceMean: 0.24,
  frameHierarchyMean: 0.62,
  heroCoverageMeanMax: 0.32,
  overbrightRateMax: 0.12,
  worldDominanceDeliveredMean: 0.28
};

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isSharedOrDominantWorldAuthority(summary) {
  const visual = summary?.visualSummary ?? {};
  return (
    (visual.worldDominanceDeliveredMean ?? 0) >=
      AUTHORITY_PROOF_THRESHOLDS.worldDominanceDeliveredMean ||
    visual.dominantWorldAuthorityState === 'shared' ||
    visual.dominantWorldAuthorityState === 'dominant'
  );
}

function hasAuthorityProofShape(summary) {
  const visual = summary?.visualSummary ?? {};
  return (
    isSharedOrDominantWorldAuthority(summary) &&
    (visual.chamberPresenceMean ?? 0) >=
      AUTHORITY_PROOF_THRESHOLDS.chamberPresenceMean &&
    (visual.frameHierarchyMean ?? 0) >=
      AUTHORITY_PROOF_THRESHOLDS.frameHierarchyMean &&
    (visual.heroCoverageMean ?? 1) <=
      AUTHORITY_PROOF_THRESHOLDS.heroCoverageMeanMax &&
    (visual.overbrightRate ?? 1) <= AUTHORITY_PROOF_THRESHOLDS.overbrightRateMax
  );
}

function hasHeroMonopolyRisk(summary) {
  const visual = summary?.visualSummary ?? {};
  return (
    ((visual.heroCoverageMean ?? 0) >= 0.28 &&
      (visual.worldDominanceDeliveredMean ?? 1) <= 0.2) ||
    (visual.heroCoveragePeak ?? 0) > 0.5 ||
    (summary?.qualityFlags ?? []).includes('heroMonopolyRisk')
  );
}

function isHistoricalBenchmarkStatus(status) {
  return status === 'historical-baseline';
}

function isCurrentBenchmarkStatus(status) {
  return status === 'current-candidate' || status === 'current-canonical';
}

function isCurrentProofEligible(summary) {
  const proofValidity = summary?.metadata?.proofValidity;

  if (proofValidity && typeof proofValidity === 'object') {
    return proofValidity.currentProofEligible === true;
  }

  return false;
}

function collectTimestampRange(entries, selector) {
  const timestamps = entries
    .map((entry) => selector(entry))
    .map((value) => (typeof value === 'string' ? new Date(value) : null))
    .filter((value) => value instanceof Date && !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (timestamps.length === 0) {
    return {
      count: 0,
      oldestIso: null,
      newestIso: null,
      oldest: null,
      newest: null
    };
  }

  return {
    count: timestamps.length,
    oldestIso: timestamps[0].toISOString(),
    newestIso: timestamps[timestamps.length - 1].toISOString(),
    oldest: timestamps[0],
    newest: timestamps[timestamps.length - 1]
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

function summarizeScreenshotFreshness(screenshots, evidencePolicy = {}) {
  const range = collectTimestampRange(screenshots, (shot) => shot?.modifiedAt);
  const cutoff =
    typeof evidencePolicy.currentBranchProofCutoffAt === 'string'
      ? new Date(evidencePolicy.currentBranchProofCutoffAt)
      : null;
  const seriousProofMaxAgeDays =
    Number.isFinite(evidencePolicy.seriousProofMaxAgeDays) &&
    evidencePolicy.seriousProofMaxAgeDays > 0
      ? evidencePolicy.seriousProofMaxAgeDays
      : 7;
  const reasons = [];
  let currentReviewReady = true;

  if (range.count === 0) {
    currentReviewReady = false;
    reasons.push('No current screenshot references were found.');
  }

  if (
    cutoff instanceof Date &&
    !Number.isNaN(cutoff.getTime()) &&
    range.newest &&
    range.newest.getTime() < cutoff.getTime()
  ) {
    currentReviewReady = false;
    reasons.push(
      `Newest screenshot reference predates the current branch proof cutoff (${cutoff.toISOString()}).`
    );
  }

  if (range.newest) {
    const ageMs = Date.now() - range.newest.getTime();
    const maxAgeMs = seriousProofMaxAgeDays * 24 * 60 * 60 * 1000;

    if (ageMs > maxAgeMs) {
      currentReviewReady = false;
      reasons.push(
        `Newest screenshot reference is older than the serious proof window of ${seriousProofMaxAgeDays} day(s).`
      );
    }
  }

  if (reasons.length === 0) {
    reasons.push('Screenshot references satisfy the current proof cutoff and freshness window.');
  }

  return {
    range,
    currentReviewReady,
    reasons,
    summaryLine: currentReviewReady ? reasons[0] : reasons.join(' ')
  };
}

function summarizeCoverage(summaries) {
  const cueCounts = new Map();
  const chamberCounts = new Map();
  const compositorCounts = new Map();
  const spendProfileCounts = new Map();
  const worldAuthorityStateCounts = new Map();
  let safeCount = 0;
  let chamberPresenceSum = 0;
  let chamberPresenceSamples = 0;
  let frameHierarchySum = 0;
  let frameHierarchySamples = 0;
  let heroCoverageSum = 0;
  let heroCoverageSamples = 0;
  let worldDominanceDeliveredSum = 0;
  let worldDominanceDeliveredSamples = 0;
  let overbrightRateSum = 0;
  let overbrightSamples = 0;
  let authorityReadyCount = 0;
  let heroMonopolyRiskCount = 0;
  let lowChamberPresenceCount = 0;
  let weakWorldAuthorityCount = 0;
  let overbrightRiskCount = 0;
  let worldAuthorityEvidenceCount = 0;
  let largeHeroCount = 0;
  let ringAuthoritySum = 0;
  let ringAuthoritySamples = 0;

  for (const summary of summaries) {
    const visual = summary.visualSummary ?? {};
    const cueClass = inferCueClass(summary);
    const dominantFamily = visual.dominantShowFamily ?? 'unknown';
    const compositorClass =
      visual.eventGlowPeak >= 0.2 || visual.bloomStrengthPeak >= 0.18
        ? 'consequence'
        : 'muted';

    cueCounts.set(cueClass, (cueCounts.get(cueClass) ?? 0) + 1);
    chamberCounts.set(dominantFamily, (chamberCounts.get(dominantFamily) ?? 0) + 1);
    compositorCounts.set(
      compositorClass,
      (compositorCounts.get(compositorClass) ?? 0) + 1
    );
    if (visual.dominantWorldAuthorityState) {
      worldAuthorityStateCounts.set(
        visual.dominantWorldAuthorityState,
        (worldAuthorityStateCounts.get(visual.dominantWorldAuthorityState) ?? 0) + 1
      );
    }
    if (isNumber(visual.chamberPresenceMean)) {
      chamberPresenceSum += visual.chamberPresenceMean;
      chamberPresenceSamples += 1;
      if (visual.chamberPresenceMean < AUTHORITY_PROOF_THRESHOLDS.chamberPresenceMean) {
        lowChamberPresenceCount += 1;
      }
    }
    if (isNumber(visual.frameHierarchyMean)) {
      frameHierarchySum += visual.frameHierarchyMean;
      frameHierarchySamples += 1;
    }
    if (isNumber(visual.heroCoverageMean)) {
      heroCoverageSum += visual.heroCoverageMean;
      heroCoverageSamples += 1;
    }
    if (isNumber(visual.worldDominanceDeliveredMean)) {
      worldDominanceDeliveredSum += visual.worldDominanceDeliveredMean;
      worldDominanceDeliveredSamples += 1;
      if (
        visual.worldDominanceDeliveredMean <
        AUTHORITY_PROOF_THRESHOLDS.worldDominanceDeliveredMean
      ) {
        weakWorldAuthorityCount += 1;
      }
    }
    if (typeof visual.overbrightRate === 'number') {
      overbrightRateSum += visual.overbrightRate;
      overbrightSamples += 1;
      if (visual.overbrightRate > AUTHORITY_PROOF_THRESHOLDS.overbrightRateMax) {
        overbrightRiskCount += 1;
      }
    }
    if (hasAuthorityProofShape(summary)) {
      authorityReadyCount += 1;
    }
    if (hasHeroMonopolyRisk(summary)) {
      heroMonopolyRiskCount += 1;
    }
    if (isSharedOrDominantWorldAuthority(summary)) {
      worldAuthorityEvidenceCount += 1;
    }
    if ((visual.heroScalePeak ?? 0) >= 1.2) {
      largeHeroCount += 1;
    }
    if (typeof visual.ringAuthorityMean === 'number') {
      ringAuthoritySum += visual.ringAuthorityMean;
      ringAuthoritySamples += 1;
    }
    for (const [profile, ratio] of Object.entries(visual.spendProfileSpread ?? {})) {
      spendProfileCounts.set(
        profile,
        (spendProfileCounts.get(profile) ?? 0) + ratio
      );
    }

    if (visual.dominantQualityTier === 'safe') {
      safeCount += 1;
    }
  }

  return {
    cueCounts,
    chamberCounts,
    compositorCounts,
    spendProfileCounts,
    worldAuthorityStateCounts,
    safeCount,
    authorityReadyCount,
    heroMonopolyRiskCount,
    lowChamberPresenceCount,
    weakWorldAuthorityCount,
    overbrightRiskCount,
    worldAuthorityEvidenceCount,
    averageChamberPresence:
      chamberPresenceSamples > 0 ? chamberPresenceSum / chamberPresenceSamples : null,
    averageFrameHierarchy:
      frameHierarchySamples > 0 ? frameHierarchySum / frameHierarchySamples : null,
    averageHeroCoverage:
      heroCoverageSamples > 0 ? heroCoverageSum / heroCoverageSamples : null,
    averageWorldDominanceDelivered:
      worldDominanceDeliveredSamples > 0
        ? worldDominanceDeliveredSum / worldDominanceDeliveredSamples
        : null,
    averageOverbrightRate:
      overbrightSamples > 0 ? overbrightRateSum / overbrightSamples : null,
    largeHeroCount,
    averageRingAuthority:
      ringAuthoritySamples > 0 ? ringAuthoritySum / ringAuthoritySamples : null
  };
}

function normalizeScenarioKind(kind, active = false) {
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

function summarizeScenarioCoverage(summaries, benchmarkSummaries = []) {
  const currentScenarioCounts = new Map();
  const historicalScenarioCounts = new Map();
  const currentReviewSummaries = [
    ...summaries.filter((summary) => isCurrentProofEligible(summary)),
    ...benchmarkSummaries.filter((summary) =>
      isCurrentBenchmarkStatus(summary?.benchmark?.status) &&
      isCurrentProofEligible(summary)
    )
  ];
  const historicalBaselineSummaries = benchmarkSummaries.filter((summary) =>
    isHistoricalBenchmarkStatus(summary?.benchmark?.status)
  );
  let noTouchCaptureCount = 0;
  let qualifiedNoTouchCount = 0;
  let silenceDignityCount = 0;
  let worldAuthorityCount = 0;
  let primaryBenchmarkAuthorityCount = 0;
  let primaryBenchmarkNoTouchAuthorityCount = 0;
  let operatorTrustCount = 0;
  let unclassifiedCurrentCount = 0;

  for (const summary of currentReviewSummaries) {
    const scenarioKind = resolveCaptureReviewScenarioKind(summary);

    if (scenarioKind) {
      currentScenarioCounts.set(
        scenarioKind,
        (currentScenarioCounts.get(scenarioKind) ?? 0) + 1
      );
    } else {
      unclassifiedCurrentCount += 1;
    }

    if ((summary?.metadata?.interventionCount ?? 1) === 0) {
      noTouchCaptureCount += 1;
    }

    if (summary?.metadata?.noTouchWindowPassed === true) {
      qualifiedNoTouchCount += 1;
    }

    const dominantPerformanceRegime =
      summary?.visualSummary?.dominantPerformanceRegime ?? 'unknown';
    if (
      dominantPerformanceRegime === 'silence-beauty' ||
      dominantPerformanceRegime === 'room-floor' ||
      dominantPerformanceRegime === 'suspense'
    ) {
      silenceDignityCount += 1;
    }

    if (isSharedOrDominantWorldAuthority(summary)) {
      worldAuthorityCount += 1;

      if (scenarioKind === 'primary-benchmark') {
        primaryBenchmarkAuthorityCount += 1;

        if (summary?.metadata?.noTouchWindowPassed === true) {
          primaryBenchmarkNoTouchAuthorityCount += 1;
        }
      }
    }

    if (scenarioKind === 'operator-trust') {
      operatorTrustCount += 1;
    }
  }

  for (const summary of historicalBaselineSummaries) {
    const scenarioKind = normalizeScenarioKind(
      summary?.benchmark?.kind,
      Boolean(summary?.benchmark?.active)
    );

    historicalScenarioCounts.set(
      scenarioKind,
      (historicalScenarioCounts.get(scenarioKind) ?? 0) + 1
    );
  }

  return {
    currentScenarioCounts,
    historicalScenarioCounts,
    currentReviewCaptureCount: currentReviewSummaries.length,
    historicalBaselineCount: historicalBaselineSummaries.length,
    unclassifiedCurrentCount,
    noTouchCaptureCount,
    qualifiedNoTouchCount,
    silenceDignityCount,
    worldAuthorityCount,
    primaryBenchmarkAuthorityCount,
    primaryBenchmarkNoTouchAuthorityCount,
    operatorTrustCount
  };
}

function pickExtremes(summaries, limit) {
  const ranked = [...summaries]
    .map((summary) => ({
      summary,
      score: scoreCapture(summary)
    }))
    .sort((left, right) => right.score - left.score);

  return {
    strong: ranked.slice(0, limit),
    weak: [...ranked].sort((left, right) => left.score - right.score).slice(0, limit)
  };
}

function buildMarkdown({
  generatedAt,
  reportProvenance,
  reportTimestamp,
  reportCaptureCount,
  proofEligibleCount,
  evidenceFreshness,
  screenshotFreshness,
  screenshots,
  summaries,
  aggregate,
  scenarioCoverage,
  gates,
  strong,
  weak
}) {
  const topCueLines = [...aggregate.cueCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([cueClass, count]) => `- \`${cueClass}\`: ${count} capture(s)`);
  const chamberLines = [...aggregate.chamberCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([family, count]) => `- \`${family}\`: ${count} capture(s)`);
  const compositorLines = [...aggregate.compositorCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([value, count]) => `- \`${value}\`: ${count} capture(s)`);
  const spendLines = [...aggregate.spendProfileCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(
      ([profile, weight]) =>
        `- \`${profile}\`: weighted presence ${formatNumber(weight, 2)}`
    );
  const worldAuthorityLines = [...aggregate.worldAuthorityStateCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([state, count]) => `- \`${state}\`: ${count} capture(s)`);

  const captureLines = (entries) =>
    entries.map(({ summary, score }) => {
      const visual = summary.visualSummary ?? {};
      const flags = summary.qualityFlags?.length
        ? summary.qualityFlags.join(', ')
        : 'none';

      return [
        `- \`${path.basename(summary.filePath ?? '')}\``,
        `  - score: ${formatNumber(score, 2)}`,
        `  - trigger/event: ${summary.metadata?.triggerKind ?? 'manual'} / ${summary.eventArchetype ?? 'unknown'}`,
        `  - route/world/look: ${summary.metadata?.resolvedRoute ?? summary.metadata?.routePolicy ?? 'unknown'} / ${summary.metadata?.effectiveWorldId ?? summary.metadata?.showWorldId ?? 'unknown'} / ${summary.metadata?.effectiveLookId ?? summary.metadata?.lookId ?? 'unknown'}`,
        `  - proof scenario: ${formatProofScenarioKindLabel(
          resolveCaptureReviewScenarioKind(summary)
        )}`,
        `  - build: ${summary.metadata?.buildInfo?.version ?? 'unknown'} / ${summary.metadata?.buildInfo?.commit ?? 'unknown'} / ${summary.metadata?.buildInfo?.lane ?? 'unknown'} (${summary.metadata?.buildInfo?.valid === true ? 'valid' : 'invalid'})`,
        `  - scenario validation: ${
          summary.metadata?.scenarioAssessment
            ? `${summary.metadata.scenarioAssessment.declaredScenario ?? 'unassigned'} -> ${summary.metadata.scenarioAssessment.derivedScenario ?? 'unresolved'} (${summary.metadata.scenarioAssessment.validated ? 'validated' : 'mismatch/pending'})`
            : 'not recorded'
        }`,
        `  - capability: ${summary.metadata?.showCapabilityMode ?? 'unknown'}${summary.metadata?.advancedDrawerTab ? `; advanced tab ${summary.metadata.advancedDrawerTab}` : ''}`,
        `  - canonical cue class: ${inferCueClass(summary)}`,
        `  - dominant act: ${visual.dominantAct ?? 'unknown'}`,
        `  - dominant chamber family: ${visual.dominantShowFamily ?? 'unknown'}`,
        `  - authority: world ${formatNumber(
          visual.worldDominanceDeliveredMean
        )}; chamber ${formatNumber(visual.chamberPresenceMean)}; hierarchy ${formatNumber(
          visual.frameHierarchyMean
        )}; hero coverage ${formatNumber(visual.heroCoverageMean)}`,
        `  - compositor: event glow ${formatNumber(visual.eventGlowMean ?? 0)} mean / ${formatNumber(visual.eventGlowPeak ?? 0)} peak; bloom ${formatNumber(visual.bloomStrengthMean ?? 0)} mean / ${formatNumber(visual.bloomStrengthPeak ?? 0)} peak`,
        `  - spend: ${visual.dominantSpendProfile ?? 'unavailable'}; overbright ${visual.overbrightRate == null ? 'n/a' : formatPercent(visual.overbrightRate)}; hero scale peak ${visual.heroScalePeak == null ? 'n/a' : formatNumber(visual.heroScalePeak)}`,
        `  - interventions: ${summary.metadata?.interventionCount ?? 'unknown'}; no-touch window ${summary.metadata?.noTouchWindowPassed === true ? 'passed' : 'not proven'}`,
        `  - safe tier: ${visual.dominantQualityTier === 'safe' ? 'yes' : 'no'}`,
        `  - flags: ${flags}`
      ].join('\n');
    });

  const currentScenarioLines = [...scenarioCoverage.currentScenarioCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([scenarioKind, count]) => `- \`${scenarioKind}\`: ${count} capture(s)`);
  const historicalScenarioLines = [...scenarioCoverage.historicalScenarioCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([scenarioKind, count]) => `- \`${scenarioKind}\`: ${count} capture(s)`);

  const screenshotLines = screenshots.length
    ? screenshots.map(
        (shot) =>
          `- \`${shot.name}\` (${Math.round(shot.sizeBytes / 1024)} KB, modified ${shot.modifiedAt})`
      )
    : ['- No screenshots found in the configured folder.'];

  return [
    '# VisuLive Proof Pack',
    '',
    `Generated: ${generatedAt}`,
    `Source report: ${reportProvenance}`,
    `Report timestamp: ${reportTimestamp ?? 'unknown'}`,
    `Report capture count: ${reportCaptureCount ?? summaries.length}`,
    '',
    '## Executive Read',
    `- Captures analyzed: ${summaries.length}`,
    `- Current-proof-eligible captures: ${proofEligibleCount}`,
    `- Safe-tier captures: ${aggregate.safeCount}/${proofEligibleCount || 0}`,
    `- Screenshot references: ${screenshots.length}`,
    `- Strong evidence picks: ${strong.length}`,
    `- Weak evidence picks: ${weak.length}`,
    '',
    '## Evidence Freshness',
    `- Attached source capture date range: ${formatTimestampRange(
      evidenceFreshness?.allAttachedRange
    )}`,
    `- Current batch capture date range: ${formatTimestampRange(
      evidenceFreshness?.currentBatchRange
    )}`,
    `- Current review capture date range: ${formatTimestampRange(
      evidenceFreshness?.currentReviewRange
    )}`,
    `- Historical baseline capture date range: ${formatTimestampRange(
      evidenceFreshness?.historicalBaselineRange
    )}`,
    `- Current branch proof cutoff: ${formatTimestamp(
      evidenceFreshness?.currentBranchProofCutoffAt
    )}`,
    `- Serious proof max age: ${evidenceFreshness?.seriousProofMaxAgeDays ?? 'n/a'} day(s)`,
    `- Current branch proof freshness: ${
      evidenceFreshness?.currentBranchProofFresh ? 'pass' : 'fail'
    } - ${evidenceFreshness?.summaryLine ?? 'Evidence freshness is unavailable.'}`,
    `- Screenshot review freshness: ${
      screenshotFreshness?.currentReviewReady ? 'pass' : 'fail'
    } - ${screenshotFreshness?.summaryLine ?? 'Screenshot freshness is unavailable.'}`,
    `- Screenshot date range: ${formatTimestampRange(screenshotFreshness?.range)}`,
    '',
    '## Validation Gates',
    ...gates.map((gate) => `- ${gate.label}: ${gate.status} - ${gate.rationale}`),
    '',
    '## Scenario Coverage',
    ...(currentScenarioLines.length > 0
      ? ['### Current scenarios', ...currentScenarioLines]
      : ['### Current scenarios', '- No current scenario captures were attached to this review pack.']),
    '',
    ...(historicalScenarioLines.length > 0
      ? ['### Historical baselines', ...historicalScenarioLines]
      : ['### Historical baselines', '- No historical baseline scenarios are attached.']),
    '',
    `- Current review captures: ${scenarioCoverage.currentReviewCaptureCount}`,
    `- Unclassified current captures: ${scenarioCoverage.unclassifiedCurrentCount}`,
    `- Historical baseline captures: ${scenarioCoverage.historicalBaselineCount}`,
    `- No-touch captures: ${scenarioCoverage.noTouchCaptureCount}`,
    `- Qualified no-touch windows: ${scenarioCoverage.qualifiedNoTouchCount}`,
    `- Quiet-state evidence: ${scenarioCoverage.silenceDignityCount}`,
    `- World-authority evidence: ${scenarioCoverage.worldAuthorityCount}`,
    `- Primary no-touch authority evidence: ${scenarioCoverage.primaryBenchmarkNoTouchAuthorityCount}`,
    `- Operator-trust evidence: ${scenarioCoverage.operatorTrustCount}`,
    '',
    '## Cue Spread',
    ...(topCueLines.length > 0 ? topCueLines : ['- No cue classes inferred.']),
    '',
    '## Authority Split Read',
    `- Authority-ready captures: ${aggregate.authorityReadyCount}/${proofEligibleCount || 0}`,
    `- World-authority evidence: ${aggregate.worldAuthorityEvidenceCount}/${proofEligibleCount || 0}`,
    `- Chamber presence mean: ${formatNumber(
      aggregate.averageChamberPresence
    )} (target >= ${formatNumber(AUTHORITY_PROOF_THRESHOLDS.chamberPresenceMean)})`,
    `- World dominance delivered mean: ${formatNumber(
      aggregate.averageWorldDominanceDelivered
    )} (target >= ${formatNumber(
      AUTHORITY_PROOF_THRESHOLDS.worldDominanceDeliveredMean
    )})`,
    `- Frame hierarchy mean: ${formatNumber(
      aggregate.averageFrameHierarchy
    )} (target >= ${formatNumber(AUTHORITY_PROOF_THRESHOLDS.frameHierarchyMean)})`,
    `- Hero coverage mean: ${formatNumber(
      aggregate.averageHeroCoverage
    )} (target <= ${formatNumber(AUTHORITY_PROOF_THRESHOLDS.heroCoverageMeanMax)})`,
    `- Overbright rate: ${
      aggregate.averageOverbrightRate == null
        ? 'unavailable'
        : formatPercent(aggregate.averageOverbrightRate)
    } (target <= ${formatPercent(AUTHORITY_PROOF_THRESHOLDS.overbrightRateMax)})`,
    `- Risk counts: hero monopoly ${aggregate.heroMonopolyRiskCount}/${proofEligibleCount || 0}; low chamber ${aggregate.lowChamberPresenceCount}/${proofEligibleCount || 0}; weak world ${aggregate.weakWorldAuthorityCount}/${proofEligibleCount || 0}; overbright ${aggregate.overbrightRiskCount}/${proofEligibleCount || 0}`,
    ...(worldAuthorityLines.length > 0
      ? ['### World authority state spread', ...worldAuthorityLines]
      : ['### World authority state spread', '- No world-authority state telemetry available.']),
    '',
    '## Chamber Authority',
    ...(chamberLines.length > 0 ? chamberLines : ['- No chamber family spread available.']),
    '',
    '## Compositor Consequence',
    ...(compositorLines.length > 0
      ? compositorLines
      : ['- No compositor consequence spread available.']),
    '',
    '## Spend Governance',
    ...(spendLines.length > 0
      ? spendLines
      : ['- Spend profile telemetry unavailable in this batch.']),
    `- Overbright risk: ${
      aggregate.averageOverbrightRate == null
        ? 'unavailable'
        : formatPercent(aggregate.averageOverbrightRate)
    }`,
    `- Large hero frequency: ${aggregate.largeHeroCount}/${proofEligibleCount || 0} capture(s)`,
    `- Ring authority mean: ${
      aggregate.averageRingAuthority == null
        ? 'unavailable'
        : formatNumber(aggregate.averageRingAuthority)
    }`,
    '',
    '## Strong Evidence',
    ...(strong.length > 0 ? captureLines(strong) : ['- No strong evidence picks available.']),
    '',
    '## Weak Evidence',
    ...(weak.length > 0 ? captureLines(weak) : ['- No weak evidence picks available.']),
    '',
    '## Screenshot Review Set',
    ...screenshotLines,
    '',
    '## Notes',
    '- This harness scores evidence captures, not raw PNG pixels.',
    '- Use the screenshot set as the manual visual review layer.',
    '- If you want image-analysis scoring later, add a visual classifier without changing this proof-pack contract.'
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const capturesPath = path.resolve(workspaceRoot, args.captures);
  const reportPath = path.resolve(workspaceRoot, args.report);
  const screenshotsPath = path.resolve(workspaceRoot, args.screenshots);
  const summaries = await analyzeCaptureTargets([capturesPath]);
  const proofEligibleSummaries = summaries.filter((summary) => isCurrentProofEligible(summary));
  const benchmarkSummaries = await loadManifestBenchmarkSummaries(summaries);
  const manifestHealth = await collectBenchmarkManifestHealth();
  const runArtifacts = await collectRunArtifacts([capturesPath]);
  const runIntegrityFailures = runArtifacts.filter((entry) => {
    if (entry.artifactType !== 'run-journal' && entry.artifactType !== 'run-manifest') {
      return false;
    }

    return entry.artifact?.metadata?.artifactIntegrity?.verdict === 'fail';
  });
  const missedEntries = await collectMissedCaptureOpportunities([capturesPath]);
  const reportText = await readTextIfExists(reportPath);
  const looseScreenshots = await collectScreenshotInventory(screenshotsPath);
  const runStills = await collectRunStillInventory(runArtifacts);
  const screenshots = [...looseScreenshots, ...runStills].sort((left, right) => {
    const modifiedDelta =
      new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
    if (modifiedDelta !== 0) {
      return modifiedDelta;
    }

    return right.name.localeCompare(left.name, 'en', { numeric: true });
  });
  const reportTimestamp =
    reportText?.match(/^Generated:\s*(.+)$/m)?.[1]?.trim() ?? null;
  const reportCaptureCount =
    Number.parseInt(reportText?.match(/^Capture count:\s*(\d+)$/m)?.[1] ?? '', 10) ||
    null;
  const aggregate = summarizeCoverage(proofEligibleSummaries);
  const scenarioCoverage = summarizeScenarioCoverage(summaries, benchmarkSummaries);
  const evidenceFreshness = collectEvidenceFreshness(summaries, {
    benchmarkSummaries,
    evidencePolicy: manifestHealth.evidencePolicy
  });
  const screenshotFreshness = summarizeScreenshotFreshness(
    screenshots,
    manifestHealth.evidencePolicy
  );
  const hasCurrentCaptures = proofEligibleSummaries.length > 0;
  const buildIdentityValidCount = proofEligibleSummaries.filter(
    (summary) => summary?.metadata?.buildInfo?.valid === true
  ).length;
  const scenarioValidationCount = proofEligibleSummaries.filter(
    (summary) =>
      !summary?.metadata?.scenarioAssessment ||
      summary.metadata.scenarioAssessment.validated === true
  ).length;
  const picks = pickExtremes(proofEligibleSummaries, args.limit);
  const recommendationArtifact = buildBatchRecommendationArtifact({
    summaries,
    runArtifacts,
    missedEntries,
    sourceProofManifestPath: args.manifest
      ? path.resolve(workspaceRoot, args.manifest)
      : null
  });
  const authoritySplitRationale = !hasCurrentCaptures
    ? 'No current captures are attached to this proof pack yet.'
    : `authority-ready ${aggregate.authorityReadyCount}/${proofEligibleSummaries.length}; world ${formatNumber(
        aggregate.averageWorldDominanceDelivered
      )}; chamber ${formatNumber(aggregate.averageChamberPresence)}; hierarchy ${formatNumber(
        aggregate.averageFrameHierarchy
      )}; hero coverage ${formatNumber(aggregate.averageHeroCoverage)}; overbright ${
        aggregate.averageOverbrightRate == null
          ? 'unavailable'
          : formatPercent(aggregate.averageOverbrightRate)
      }; risks hero/chamber/world/overbright ${aggregate.heroMonopolyRiskCount}/${aggregate.lowChamberPresenceCount}/${aggregate.weakWorldAuthorityCount}/${aggregate.overbrightRiskCount}.`;
  const gates = [
    buildGateStatus(
      'current-branch freshness',
      Boolean(evidenceFreshness.currentBranchProofFresh),
      evidenceFreshness.summaryLine,
      true
    ),
    buildGateStatus(
      'safe-tier discipline',
      hasCurrentCaptures && aggregate.safeCount === proofEligibleSummaries.length,
      !hasCurrentCaptures
        ? 'No current captures are attached to this proof pack yet.'
        : aggregate.safeCount === proofEligibleSummaries.length
        ? 'All analyzed captures are safe-tier.'
        : `${aggregate.safeCount}/${proofEligibleSummaries.length} captures are safe-tier.`
    ),
    buildGateStatus(
      'cue diversity',
      hasCurrentCaptures && aggregate.cueCounts.size >= 3,
      !hasCurrentCaptures
        ? 'No current captures are attached to this proof pack yet.'
        : `${aggregate.cueCounts.size} cue class(es) inferred from current captures.`
    ),
    buildGateStatus(
      'chamber participation',
      hasCurrentCaptures &&
        [...aggregate.chamberCounts.keys()].some(
          (family) => family !== 'unknown' && family !== 'eclipse-chamber'
        ),
      !hasCurrentCaptures
        ? 'No current captures are attached to this proof pack yet.'
        : 'The pack contains chamber families beyond the default shell.'
    ),
    buildGateStatus(
      'compositor consequence',
      hasCurrentCaptures &&
        [...proofEligibleSummaries].some(
          (summary) => (summary.visualSummary?.eventGlowPeak ?? 0) >= 0.2
        ),
      !hasCurrentCaptures
        ? 'No current captures are attached to this proof pack yet.'
        : 'At least one capture shows visible event-glow spend.'
    ),
    buildGateStatus(
      'build identity',
      hasCurrentCaptures && buildIdentityValidCount === proofEligibleSummaries.length,
      !hasCurrentCaptures
        ? 'No current captures are attached to this proof pack yet.'
        : buildIdentityValidCount === proofEligibleSummaries.length
          ? 'All current captures include valid build identity.'
          : `${buildIdentityValidCount}/${proofEligibleSummaries.length} current captures include valid build identity.`,
      true
    ),
    buildGateStatus(
      'scenario validation',
      hasCurrentCaptures && scenarioValidationCount === proofEligibleSummaries.length,
      !hasCurrentCaptures
        ? 'No current captures are attached to this proof pack yet.'
        : scenarioValidationCount === proofEligibleSummaries.length
          ? 'Current capture scenarios are validated or unrecorded.'
          : `${scenarioValidationCount}/${proofEligibleSummaries.length} current captures are scenario-validated.`,
      true
    ),
    buildGateStatus(
      'proof-pack completeness',
      screenshotFreshness.currentReviewReady &&
        proofEligibleSummaries.length > 0 &&
        buildIdentityValidCount === proofEligibleSummaries.length,
      screenshotFreshness.currentReviewReady &&
      proofEligibleSummaries.length > 0 &&
      buildIdentityValidCount === proofEligibleSummaries.length
        ? `${screenshots.length} current screenshot reference(s) are available and all captures are attributable to a valid build.`
        : screenshotFreshness.currentReviewReady && proofEligibleSummaries.length === 0
          ? `${screenshots.length} current screenshot reference(s) are available, but no current-proof-eligible captures are attached.`
        : screenshotFreshness.summaryLine,
      true
    ),
    buildGateStatus(
      'no-touch autonomy',
      scenarioCoverage.qualifiedNoTouchCount > 0,
      scenarioCoverage.qualifiedNoTouchCount > 0
        ? `${scenarioCoverage.qualifiedNoTouchCount} capture(s) cleared the no-touch proof window.`
        : 'No current review captures have yet cleared the no-touch proof window on this branch.',
      true
    ),
    buildGateStatus(
      'authority split validation',
      hasCurrentCaptures &&
        aggregate.authorityReadyCount > 0 &&
        aggregate.heroMonopolyRiskCount === 0 &&
        aggregate.overbrightRiskCount === 0,
      authoritySplitRationale,
      true
    ),
    buildGateStatus(
      'primary authority proof',
      scenarioCoverage.primaryBenchmarkNoTouchAuthorityCount > 0,
      scenarioCoverage.primaryBenchmarkNoTouchAuthorityCount > 0
        ? `${scenarioCoverage.primaryBenchmarkNoTouchAuthorityCount} no-touch primary benchmark capture(s) show world/chamber authority.`
        : 'No no-touch primary benchmark capture has proven world/chamber authority on this branch.',
      true
    ),
    buildGateStatus(
      'silence dignity',
      scenarioCoverage.silenceDignityCount > 0,
      scenarioCoverage.silenceDignityCount > 0
        ? `${scenarioCoverage.silenceDignityCount} capture(s) preserved quiet-state regime evidence.`
        : 'No quiet-state evidence is attached to this proof pack yet.'
    ),
    buildGateStatus(
      'world authority delivery',
      aggregate.worldAuthorityEvidenceCount > 0,
      aggregate.worldAuthorityEvidenceCount > 0
        ? `${aggregate.worldAuthorityEvidenceCount} capture(s) show shared or dominant world authority.`
        : 'World-authority delivery is still not proven in this pack.'
    ),
    buildGateStatus(
      'operator trust',
      scenarioCoverage.operatorTrustCount > 0,
      scenarioCoverage.operatorTrustCount > 0
        ? `${scenarioCoverage.operatorTrustCount} operator-trust scenario capture(s) are attached.`
        : 'No current operator-trust scenario is attached to this pack yet.',
      true
    ),
    buildGateStatus(
      'run artifact integrity',
      runIntegrityFailures.length === 0,
      runIntegrityFailures.length === 0
        ? 'Run journals/manifests do not report artifact-integrity failures.'
        : `${runIntegrityFailures.length} run artifact(s) report artifact-integrity failures.`,
      true
    ),
    buildGateStatus(
      'missed capture opportunities',
      missedEntries.length === 0,
      missedEntries.length === 0
        ? 'All serious run markers that should have produced clips were matched.'
        : `${missedEntries.length} meaningful run marker(s) were not matched to saved clips.`,
      true
    ),
    buildGateStatus(
      'scenario coverage',
      manifestHealth.valid &&
        scenarioCoverage.currentScenarioCounts.has('primary-benchmark') &&
        scenarioCoverage.currentScenarioCounts.has('room-floor') &&
        scenarioCoverage.currentScenarioCounts.has('coverage') &&
        scenarioCoverage.currentScenarioCounts.has('sparse-silence') &&
        scenarioCoverage.currentScenarioCounts.has('operator-trust'),
      `Current scenarios present: ${
        [...scenarioCoverage.currentScenarioCounts.keys()].sort().join(', ') || 'none'
      }; historical baselines: ${
        [...scenarioCoverage.historicalScenarioCounts.keys()].sort().join(', ') || 'none'
      }`,
      true
    )
  ];
  const failedGates = gates.filter((gate) => gate.status === 'fail');
  const warningGates = gates.filter((gate) => gate.status === 'warn');
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceReportPath: reportPath,
    reportTimestamp,
    reportCaptureCount,
    capturesPath,
    screenshotsPath,
    captureCount: summaries.length,
    proofEligibleCaptureCount: proofEligibleSummaries.length,
    benchmarkScenarioCount: benchmarkSummaries.length,
    evidenceFreshness,
    screenshotFreshness: {
      range: screenshotFreshness.range,
      currentReviewReady: screenshotFreshness.currentReviewReady,
      summaryLine: screenshotFreshness.summaryLine
    },
    aggregate: {
      safeTierCaptures: aggregate.safeCount,
      cueSpread: Object.fromEntries(aggregate.cueCounts.entries()),
      chamberSpread: Object.fromEntries(aggregate.chamberCounts.entries()),
      compositorSpread: Object.fromEntries(aggregate.compositorCounts.entries()),
      spendProfileSpread: Object.fromEntries(aggregate.spendProfileCounts.entries()),
      worldAuthorityStateSpread: Object.fromEntries(
        aggregate.worldAuthorityStateCounts.entries()
      ),
      authorityReadyCount: aggregate.authorityReadyCount,
      worldAuthorityEvidenceCount: aggregate.worldAuthorityEvidenceCount,
      heroMonopolyRiskCount: aggregate.heroMonopolyRiskCount,
      lowChamberPresenceCount: aggregate.lowChamberPresenceCount,
      weakWorldAuthorityCount: aggregate.weakWorldAuthorityCount,
      overbrightRiskCount: aggregate.overbrightRiskCount,
      averageChamberPresence: aggregate.averageChamberPresence,
      averageFrameHierarchy: aggregate.averageFrameHierarchy,
      averageHeroCoverage: aggregate.averageHeroCoverage,
      averageWorldDominanceDelivered: aggregate.averageWorldDominanceDelivered,
      averageOverbrightRate: aggregate.averageOverbrightRate,
      largeHeroCount: aggregate.largeHeroCount,
      averageRingAuthority: aggregate.averageRingAuthority
    },
    scenarioCoverage: {
      currentCounts: Object.fromEntries(scenarioCoverage.currentScenarioCounts.entries()),
      historicalBaselineCounts: Object.fromEntries(
        scenarioCoverage.historicalScenarioCounts.entries()
      ),
      currentReviewCaptureCount: scenarioCoverage.currentReviewCaptureCount,
      unclassifiedCurrentCount: scenarioCoverage.unclassifiedCurrentCount,
      historicalBaselineCount: scenarioCoverage.historicalBaselineCount,
      noTouchCaptureCount: scenarioCoverage.noTouchCaptureCount,
      qualifiedNoTouchCount: scenarioCoverage.qualifiedNoTouchCount,
      silenceDignityCount: scenarioCoverage.silenceDignityCount,
      worldAuthorityCount: scenarioCoverage.worldAuthorityCount,
      primaryBenchmarkAuthorityCount: scenarioCoverage.primaryBenchmarkAuthorityCount,
      primaryBenchmarkNoTouchAuthorityCount:
        scenarioCoverage.primaryBenchmarkNoTouchAuthorityCount,
      operatorTrustCount: scenarioCoverage.operatorTrustCount
    },
    runArtifactIntegrityFailureCount: runIntegrityFailures.length,
    missedOpportunityCount: missedEntries.length,
    releaseReady: failedGates.length === 0 && warningGates.length === 0,
    strictGateFailureCount: failedGates.length,
    warningGateCount: warningGates.length,
    blockingGateFailures: failedGates,
    gates,
    recommendationsByRun: recommendationArtifact.runs,
    strongEvidence: picks.strong.map(({ summary, score }) => ({
      file: summary.filePath,
      score,
      triggerKind: summary.metadata?.triggerKind ?? 'manual',
      eventArchetype: summary.eventArchetype ?? 'unknown',
      cueClass: inferCueClass(summary),
      dominantAct: summary.visualSummary?.dominantAct ?? 'unknown',
      dominantShowFamily: summary.visualSummary?.dominantShowFamily ?? 'unknown',
      dominantPaletteState: summary.visualSummary?.dominantPaletteState ?? 'unknown',
      chamberPresenceMean: summary.visualSummary?.chamberPresenceMean ?? null,
      frameHierarchyMean: summary.visualSummary?.frameHierarchyMean ?? null,
      heroCoverageMean: summary.visualSummary?.heroCoverageMean ?? null,
      worldDominanceDeliveredMean:
        summary.visualSummary?.worldDominanceDeliveredMean ?? null,
      eventGlowPeak: summary.visualSummary?.eventGlowPeak ?? 0,
      bloomStrengthPeak: summary.visualSummary?.bloomStrengthPeak ?? 0,
      qualityFlags: summary.qualityFlags ?? []
    })),
    weakEvidence: picks.weak.map(({ summary, score }) => ({
      file: summary.filePath,
      score,
      triggerKind: summary.metadata?.triggerKind ?? 'manual',
      eventArchetype: summary.eventArchetype ?? 'unknown',
      cueClass: inferCueClass(summary),
      dominantAct: summary.visualSummary?.dominantAct ?? 'unknown',
      dominantShowFamily: summary.visualSummary?.dominantShowFamily ?? 'unknown',
      dominantPaletteState: summary.visualSummary?.dominantPaletteState ?? 'unknown',
      chamberPresenceMean: summary.visualSummary?.chamberPresenceMean ?? null,
      frameHierarchyMean: summary.visualSummary?.frameHierarchyMean ?? null,
      heroCoverageMean: summary.visualSummary?.heroCoverageMean ?? null,
      worldDominanceDeliveredMean:
        summary.visualSummary?.worldDominanceDeliveredMean ?? null,
      eventGlowPeak: summary.visualSummary?.eventGlowPeak ?? 0,
      bloomStrengthPeak: summary.visualSummary?.bloomStrengthPeak ?? 0,
      qualityFlags: summary.qualityFlags ?? []
    })),
    screenshots: screenshots.map((shot) => ({
      name: shot.name,
      path: shot.path,
      sizeBytes: shot.sizeBytes,
      modifiedAt: shot.modifiedAt
    }))
  };
  const markdown = buildMarkdown({
    generatedAt: new Date().toISOString(),
    reportProvenance: reportPath,
    reportTimestamp,
    reportCaptureCount,
    proofEligibleCount: proofEligibleSummaries.length,
    evidenceFreshness,
    screenshotFreshness,
    screenshots,
    summaries,
    aggregate,
    scenarioCoverage,
    gates,
    strong: picks.strong,
    weak: picks.weak
  });

  if (args.output) {
    const outputPath = path.resolve(workspaceRoot, args.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, markdown, 'utf8');
    console.log(`Proof pack markdown written to ${outputPath}`);
  } else {
    console.log(markdown);
  }

  if (args.manifest) {
    const manifestPath = path.resolve(workspaceRoot, args.manifest);
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`Proof pack manifest written to ${manifestPath}`);
  }

  if (args.recommendations) {
    const recommendationsPath = path.resolve(workspaceRoot, args.recommendations);
    await fs.mkdir(path.dirname(recommendationsPath), { recursive: true });
    await fs.writeFile(
      recommendationsPath,
      `${JSON.stringify(recommendationArtifact, null, 2)}\n`,
      'utf8'
    );
    console.log(`Proof recommendations written to ${recommendationsPath}`);
  }

  if (!args.output && !args.manifest) {
    console.log('');
    console.log(`Captured ${summaries.length} evidence set(s) and ${screenshots.length} screenshot reference(s).`);
  }

  if (args.strict && manifest.releaseReady !== true) {
    const strictBlockers = [...failedGates, ...warningGates];
    console.error(
      `Proof pack strict mode failed: ${strictBlockers
        .map((gate) => gate.label)
        .join(', ')}.`
    );
    process.exitCode = 1;
  }
}

await main();
