import fs from 'node:fs/promises';
import path from 'node:path';
import {
  analyzeCaptureTargets,
  captureRoot,
  inboxRoot,
  reportRoot,
  workspaceRoot
} from './capture-reporting.mjs';
import {
  formatMs,
  formatNumber,
  formatPercent,
  timestampLabel
} from './capture-analysis-core.mjs';

function parseArgs(argv) {
  const args = {
    captures: inboxRoot,
    report: path.join(reportRoot, 'capture-analysis_latest.md'),
    screenshots: path.join(captureRoot, 'inbox', 'screenshots'),
    output: null,
    manifest: null,
    limit: 3
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
      case '--limit':
        args.limit = Math.max(1, Number.parseInt(argv[++index] ?? '3', 10) || 3);
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

function inferCueClass(summary) {
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

function buildGateStatus(label, passed, rationale) {
  return {
    label,
    status: passed ? 'pass' : 'warn',
    rationale
  };
}

function summarizeCoverage(summaries) {
  const cueCounts = new Map();
  const chamberCounts = new Map();
  const compositorCounts = new Map();
  const spendProfileCounts = new Map();
  let safeCount = 0;
  let overbrightRateSum = 0;
  let overbrightSamples = 0;
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
    if (typeof visual.overbrightRate === 'number') {
      overbrightRateSum += visual.overbrightRate;
      overbrightSamples += 1;
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
    safeCount,
    averageOverbrightRate:
      overbrightSamples > 0 ? overbrightRateSum / overbrightSamples : null,
    largeHeroCount,
    averageRingAuthority:
      ringAuthoritySamples > 0 ? ringAuthoritySum / ringAuthoritySamples : null
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
  screenshots,
  summaries,
  aggregate,
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
        `  - cue class: ${inferCueClass(summary)}`,
        `  - dominant act: ${visual.dominantAct ?? 'unknown'}`,
        `  - dominant chamber family: ${visual.dominantShowFamily ?? 'unknown'}`,
        `  - compositor: event glow ${formatNumber(visual.eventGlowMean ?? 0)} mean / ${formatNumber(visual.eventGlowPeak ?? 0)} peak; bloom ${formatNumber(visual.bloomStrengthMean ?? 0)} mean / ${formatNumber(visual.bloomStrengthPeak ?? 0)} peak`,
        `  - spend: ${visual.dominantSpendProfile ?? 'unavailable'}; overbright ${visual.overbrightRate == null ? 'n/a' : formatPercent(visual.overbrightRate)}; hero scale peak ${visual.heroScalePeak == null ? 'n/a' : formatNumber(visual.heroScalePeak)}`,
        `  - safe tier: ${visual.dominantQualityTier === 'safe' ? 'yes' : 'no'}`,
        `  - flags: ${flags}`
      ].join('\n');
    });

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
    `- Safe-tier captures: ${aggregate.safeCount}/${summaries.length}`,
    `- Screenshot references: ${screenshots.length}`,
    `- Strong evidence picks: ${strong.length}`,
    `- Weak evidence picks: ${weak.length}`,
    '',
    '## Validation Gates',
    ...gates.map((gate) => `- ${gate.label}: ${gate.status} - ${gate.rationale}`),
    '',
    '## Cue Spread',
    ...(topCueLines.length > 0 ? topCueLines : ['- No cue classes inferred.']),
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
    `- Large hero frequency: ${aggregate.largeHeroCount}/${summaries.length} capture(s)`,
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
  const reportText = await readTextIfExists(reportPath);
  const screenshots = await collectScreenshotInventory(screenshotsPath);
  const reportTimestamp =
    reportText?.match(/^Generated:\s*(.+)$/m)?.[1]?.trim() ?? null;
  const reportCaptureCount =
    Number.parseInt(reportText?.match(/^Capture count:\s*(\d+)$/m)?.[1] ?? '', 10) ||
    null;
  const aggregate = summarizeCoverage(summaries);
  const picks = pickExtremes(summaries, args.limit);
  const gates = [
    buildGateStatus(
      'safe-tier discipline',
      aggregate.safeCount > 0,
      aggregate.safeCount === summaries.length
        ? 'All analyzed captures are safe-tier.'
        : `${aggregate.safeCount}/${summaries.length} captures are safe-tier.`
    ),
    buildGateStatus(
      'cue diversity',
      aggregate.cueCounts.size >= 3,
      `${aggregate.cueCounts.size} cue class(es) inferred from current captures.`
    ),
    buildGateStatus(
      'chamber participation',
      [...aggregate.chamberCounts.keys()].some((family) =>
        family !== 'unknown' && family !== 'eclipse-chamber'
      ),
      'The pack contains chamber families beyond the default shell.'
    ),
    buildGateStatus(
      'compositor consequence',
      [...summaries].some((summary) => (summary.visualSummary?.eventGlowPeak ?? 0) >= 0.2),
      'At least one capture shows visible event-glow spend.'
    ),
    buildGateStatus(
      'proof-pack completeness',
      screenshots.length > 0 && summaries.length > 0,
      screenshots.length > 0
        ? `${screenshots.length} screenshot reference(s) available.`
        : 'No screenshot references were found.'
    )
  ];
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceReportPath: reportPath,
    reportTimestamp,
    reportCaptureCount,
    capturesPath,
    screenshotsPath,
    captureCount: summaries.length,
    aggregate: {
      safeTierCaptures: aggregate.safeCount,
      cueSpread: Object.fromEntries(aggregate.cueCounts.entries()),
      chamberSpread: Object.fromEntries(aggregate.chamberCounts.entries()),
      compositorSpread: Object.fromEntries(aggregate.compositorCounts.entries()),
      spendProfileSpread: Object.fromEntries(aggregate.spendProfileCounts.entries()),
      averageOverbrightRate: aggregate.averageOverbrightRate,
      largeHeroCount: aggregate.largeHeroCount,
      averageRingAuthority: aggregate.averageRingAuthority
    },
    gates,
    strongEvidence: picks.strong.map(({ summary, score }) => ({
      file: summary.filePath,
      score,
      triggerKind: summary.metadata?.triggerKind ?? 'manual',
      eventArchetype: summary.eventArchetype ?? 'unknown',
      cueClass: inferCueClass(summary),
      dominantAct: summary.visualSummary?.dominantAct ?? 'unknown',
      dominantShowFamily: summary.visualSummary?.dominantShowFamily ?? 'unknown',
      dominantPaletteState: summary.visualSummary?.dominantPaletteState ?? 'unknown',
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
    screenshots,
    summaries,
    aggregate,
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

  if (!args.output && !args.manifest) {
    console.log('');
    console.log(`Captured ${summaries.length} evidence set(s) and ${screenshots.length} screenshot reference(s).`);
  }
}

await main();
