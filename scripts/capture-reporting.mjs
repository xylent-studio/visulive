import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildAggregateSection,
  buildBenchmarkReadSections,
  buildCaptureSection,
  collectEvidenceFreshness,
  summarizeCapture,
  timestampLabel
} from './capture-analysis-core.mjs';

export const workspaceRoot = process.cwd();
export const captureRoot = path.join(workspaceRoot, 'captures');
export const inboxRoot = path.join(captureRoot, 'inbox');
export const canonicalRoot = path.join(captureRoot, 'canonical');
export const archiveRoot = path.join(captureRoot, 'archive');
export const legacyArchiveRoot = path.join(archiveRoot, 'legacy');
export const reportRoot = path.join(captureRoot, 'reports');
export const benchmarkManifestPath = path.join(captureRoot, 'benchmark-manifest.json');
const VALID_EXTENSIONS = new Set(['.json']);
const SCENARIO_KIND_VALUES = new Set([
  'primary-benchmark',
  'room-floor',
  'coverage',
  'sparse-silence',
  'operator-trust',
  'steering',
  'historical',
  'primary-correction',
  'secondary-floor',
  'contrast'
]);
const BENCHMARK_STATUS_VALUES = new Set([
  'historical-baseline',
  'current-candidate',
  'current-canonical'
]);

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readAndParseCaptureFile(filePath) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return JSON.parse(raw.replace(/^\uFEFF/, ''));
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : '';
      const likelyIncomplete =
        message.includes('Unexpected end of JSON input') ||
        message.includes('Unterminated string');

      if (!likelyIncomplete || attempt === 1) {
        throw error;
      }

      await delay(250);
    }
  }

  throw lastError;
}

function classifyCaptureArtifact(parsed) {
  const artifactType =
    parsed?.metadata && typeof parsed.metadata === 'object'
      ? parsed.metadata.artifactType
      : null;

  if (
    artifactType === 'replay-capture' ||
    (typeof parsed?.version === 'number' && Array.isArray(parsed?.frames))
  ) {
    return 'replay-capture';
  }

  if (artifactType === 'run-journal') {
    return 'run-journal';
  }

  if (artifactType === 'run-manifest') {
    return 'run-manifest';
  }

  if (artifactType === 'run-recommendations') {
    return 'run-recommendations';
  }

  return 'unknown';
}

async function loadBenchmarkManifest() {
  try {
    const raw = await fs.readFile(benchmarkManifestPath, 'utf8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const benchmarks = Array.isArray(parsed.benchmarks) ? parsed.benchmarks : [];
    const activeBenchmarkId =
      typeof parsed.activeBenchmarkId === 'string' ? parsed.activeBenchmarkId : null;
    const primaryBenchmarkId =
      typeof parsed.primaryBenchmarkId === 'string'
        ? parsed.primaryBenchmarkId
        : activeBenchmarkId;
    const secondaryScenarioIds = Array.isArray(parsed.secondaryScenarioIds)
      ? parsed.secondaryScenarioIds.filter((value) => typeof value === 'string')
      : [];
    const scenarioIdsByKind =
      parsed.scenarioIdsByKind && typeof parsed.scenarioIdsByKind === 'object'
        ? Object.fromEntries(
            Object.entries(parsed.scenarioIdsByKind)
              .filter(
                ([kind, ids]) =>
                  SCENARIO_KIND_VALUES.has(kind) && Array.isArray(ids)
              )
              .map(([kind, ids]) => [
                kind,
                ids.filter((value) => typeof value === 'string')
              ])
          )
        : {};
    const evidencePolicy =
      parsed.evidencePolicy && typeof parsed.evidencePolicy === 'object'
        ? {
            currentBranchProofCutoffAt:
              typeof parsed.evidencePolicy.currentBranchProofCutoffAt === 'string'
                ? parsed.evidencePolicy.currentBranchProofCutoffAt
                : null,
            seriousProofMaxAgeDays:
              Number.isFinite(parsed.evidencePolicy.seriousProofMaxAgeDays) &&
              parsed.evidencePolicy.seriousProofMaxAgeDays > 0
                ? parsed.evidencePolicy.seriousProofMaxAgeDays
                : 7,
            note:
              typeof parsed.evidencePolicy.note === 'string'
                ? parsed.evidencePolicy.note
                : null
          }
        : {
            currentBranchProofCutoffAt: null,
            seriousProofMaxAgeDays: 7,
            note: null
          };

    return {
      activeBenchmarkId,
      primaryBenchmarkId,
      secondaryScenarioIds,
      scenarioIdsByKind,
      evidencePolicy,
      benchmarks
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    console.error(
      `Failed to load benchmark manifest "${benchmarkManifestPath}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return null;
  }
}

function normalizeBenchmarkStatus(status, benchmark, manifest) {
  if (BENCHMARK_STATUS_VALUES.has(status)) {
    return status;
  }

  const benchmarkId = typeof benchmark?.id === 'string' ? benchmark.id : null;
  const currentScenarioIds = new Set(
    [
      manifest?.activeBenchmarkId,
      manifest?.primaryBenchmarkId,
      ...(Array.isArray(manifest?.secondaryScenarioIds)
        ? manifest.secondaryScenarioIds
        : []),
      ...Object.values(manifest?.scenarioIdsByKind ?? {}).flat()
    ].filter((value) => typeof value === 'string')
  );

  if (benchmarkId && currentScenarioIds.has(benchmarkId)) {
    return 'current-canonical';
  }

  return 'historical-baseline';
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function collectBenchmarkManifestHealth(options = {}) {
  const requireCurrentCanonical = options.requireCurrentCanonical === true;
  const manifest = await loadBenchmarkManifest();

  if (!manifest) {
    return {
      present: false,
      valid: false,
      missingCapturePaths: [],
      nonCanonicalCapturePaths: [],
      invalidBenchmarkIds: [],
      lines: ['- No benchmark manifest was found.', '- Active benchmark truth is currently undefined.']
    };
  }

  const benchmarksById = new Map(
    manifest.benchmarks
      .filter((benchmark) => benchmark && typeof benchmark === 'object')
      .map((benchmark) => [benchmark.id, benchmark])
  );
  const missingCapturePaths = [];
  const nonCanonicalCapturePaths = [];
  const invalidBenchmarkIds = [];
  const historicalBaselineIds = [];
  const currentCandidateIds = [];
  const currentCanonicalIds = [];

  for (const benchmark of manifest.benchmarks) {
    const status = normalizeBenchmarkStatus(benchmark?.status, benchmark, manifest);
    const benchmarkLabel = benchmark?.label ?? benchmark?.id ?? 'unknown';

    if (status === 'historical-baseline') {
      historicalBaselineIds.push(benchmarkLabel);
    } else if (status === 'current-candidate') {
      currentCandidateIds.push(benchmarkLabel);
    } else if (status === 'current-canonical') {
      currentCanonicalIds.push(benchmarkLabel);
    }
  }

  for (const benchmark of manifest.benchmarks) {
    const capturePaths = Array.isArray(benchmark?.capturePaths)
      ? benchmark.capturePaths
      : [];

    for (const capturePath of capturePaths) {
      if (typeof capturePath !== 'string') {
        continue;
      }

      const resolvedCapturePath = path.resolve(workspaceRoot, capturePath);
      if (!(await pathExists(resolvedCapturePath))) {
        missingCapturePaths.push(capturePath);
        continue;
      }

      const inCanonicalRoot =
        resolvedCapturePath === canonicalRoot ||
        resolvedCapturePath.startsWith(`${canonicalRoot}${path.sep}`);
      const inArchiveRoot =
        resolvedCapturePath === archiveRoot ||
        resolvedCapturePath.startsWith(`${archiveRoot}${path.sep}`);

      if (!inCanonicalRoot && !inArchiveRoot) {
        nonCanonicalCapturePaths.push(capturePath);
      }
    }
  }

  for (const benchmarkId of [
    manifest.activeBenchmarkId,
    manifest.primaryBenchmarkId,
    ...manifest.secondaryScenarioIds,
    ...Object.values(manifest.scenarioIdsByKind ?? {}).flat()
  ]) {
    if (benchmarkId && !benchmarksById.has(benchmarkId)) {
      invalidBenchmarkIds.push(benchmarkId);
    }
  }
  const activeBenchmark = manifest.activeBenchmarkId
    ? benchmarksById.get(manifest.activeBenchmarkId)
    : null;
  const primaryBenchmark = manifest.primaryBenchmarkId
    ? benchmarksById.get(manifest.primaryBenchmarkId)
    : null;
  const activeBenchmarkStatus = activeBenchmark
    ? normalizeBenchmarkStatus(activeBenchmark.status, activeBenchmark, manifest)
    : null;
  const primaryBenchmarkStatus = primaryBenchmark
    ? normalizeBenchmarkStatus(primaryBenchmark.status, primaryBenchmark, manifest)
    : null;
  const currentBenchmarkMissingReasons = [];

  if (!manifest.activeBenchmarkId) {
    currentBenchmarkMissingReasons.push('No active benchmark id is set.');
  } else if (activeBenchmarkStatus !== 'current-canonical') {
    currentBenchmarkMissingReasons.push(
      `Active benchmark "${manifest.activeBenchmarkId}" is not current-canonical.`
    );
  }

  if (!manifest.primaryBenchmarkId) {
    currentBenchmarkMissingReasons.push('No primary benchmark id is set.');
  } else if (primaryBenchmarkStatus !== 'current-canonical') {
    currentBenchmarkMissingReasons.push(
      `Primary benchmark "${manifest.primaryBenchmarkId}" is not current-canonical.`
    );
  }

  if (currentCanonicalIds.length === 0) {
    currentBenchmarkMissingReasons.push('No current-canonical benchmark exists.');
  }

  return {
    present: true,
    valid:
      missingCapturePaths.length === 0 &&
      nonCanonicalCapturePaths.length === 0 &&
      invalidBenchmarkIds.length === 0 &&
      (!requireCurrentCanonical || currentBenchmarkMissingReasons.length === 0),
    missingCapturePaths,
    nonCanonicalCapturePaths,
    invalidBenchmarkIds,
    activeBenchmarkId: manifest.activeBenchmarkId,
    primaryBenchmarkId: manifest.primaryBenchmarkId,
    secondaryScenarioIds: manifest.secondaryScenarioIds,
    scenarioIdsByKind: manifest.scenarioIdsByKind,
    evidencePolicy: manifest.evidencePolicy,
    currentBenchmarkMissingReasons,
    lines: [
      `- Active benchmark id: ${manifest.activeBenchmarkId ?? 'none'}`,
      `- Primary benchmark id: ${manifest.primaryBenchmarkId ?? 'none'}`,
      `- Room-floor ids: ${manifest.secondaryScenarioIds.length > 0 ? manifest.secondaryScenarioIds.join(', ') : 'none'}`,
      `- Scenario ids by kind: ${
        Object.keys(manifest.scenarioIdsByKind ?? {}).length > 0
          ? Object.entries(manifest.scenarioIdsByKind)
              .map(([kind, ids]) => `${kind}=[${ids.join(', ')}]`)
              .join('; ')
          : 'none'
      }`,
      `- Current proof cutoff: ${manifest.evidencePolicy.currentBranchProofCutoffAt ?? 'none'}`,
      `- Serious proof max age: ${manifest.evidencePolicy.seriousProofMaxAgeDays} day(s)`,
      `- Historical baseline benchmarks: ${historicalBaselineIds.length > 0 ? historicalBaselineIds.join(', ') : 'none'}`,
      `- Current candidate benchmarks: ${currentCandidateIds.length > 0 ? currentCandidateIds.join(', ') : 'none'}`,
      `- Current canonical benchmarks: ${currentCanonicalIds.length > 0 ? currentCanonicalIds.join(', ') : 'none'}`,
      ...(requireCurrentCanonical
        ? currentBenchmarkMissingReasons.length > 0
          ? currentBenchmarkMissingReasons.map((reason) => `- Current benchmark requirement failed: ${reason}`)
          : ['- Current benchmark requirement satisfied.']
        : ['- Current benchmark requirement not enforced for this validation run.']),
      `- Benchmarks declared: ${manifest.benchmarks.length}`,
      ...(missingCapturePaths.length > 0
        ? missingCapturePaths.map((capturePath) => `- Missing benchmark capture path: \`${capturePath}\``)
        : ['- All benchmark capture paths currently resolve.']),
      ...(nonCanonicalCapturePaths.length > 0
        ? nonCanonicalCapturePaths.map(
            (capturePath) =>
              `- Benchmark capture path is not canonical/archive truth: \`${capturePath}\``
          )
        : ['- Benchmark capture paths live under canonical/archive storage.']),
      ...(invalidBenchmarkIds.length > 0
        ? invalidBenchmarkIds.map((benchmarkId) => `- Invalid benchmark pointer: \`${benchmarkId}\``)
        : ['- Benchmark pointers are internally consistent.'])
    ]
  };
}

function normalizeBenchmarkKind(kind, benchmark, manifest) {
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

  const benchmarkId = typeof benchmark?.id === 'string' ? benchmark.id : null;

  if (
    benchmarkId &&
    (benchmarkId === manifest?.primaryBenchmarkId ||
      benchmarkId === manifest?.activeBenchmarkId)
  ) {
    return 'primary-benchmark';
  }

  if (
    benchmarkId &&
    Array.isArray(manifest?.secondaryScenarioIds) &&
    manifest.secondaryScenarioIds.includes(benchmarkId)
  ) {
    return 'room-floor';
  }

  for (const [scenarioKind, scenarioIds] of Object.entries(
    manifest?.scenarioIdsByKind ?? {}
  )) {
    if (benchmarkId && Array.isArray(scenarioIds) && scenarioIds.includes(benchmarkId)) {
      return normalizeBenchmarkKind(scenarioKind, null, null);
    }
  }

  return 'historical';
}

function resolveBenchmarkMatch(filePath, manifest) {
  if (!manifest) {
    return null;
  }

  const normalizedFilePath = path.resolve(filePath);

  for (const benchmark of manifest.benchmarks) {
    if (!benchmark || typeof benchmark !== 'object') {
      continue;
    }

    const capturePaths = Array.isArray(benchmark.capturePaths)
      ? benchmark.capturePaths
      : [];

    for (const capturePath of capturePaths) {
      if (typeof capturePath !== 'string') {
        continue;
      }

      const resolvedCapturePath = path.resolve(workspaceRoot, capturePath);
      if (resolvedCapturePath === normalizedFilePath) {
        return {
          id: typeof benchmark.id === 'string' ? benchmark.id : undefined,
          label: typeof benchmark.label === 'string' ? benchmark.label : undefined,
          kind: normalizeBenchmarkKind(
            benchmark.kind,
            typeof benchmark.id === 'string' &&
              benchmark.id === manifest.activeBenchmarkId
          ),
          status: normalizeBenchmarkStatus(benchmark.status, benchmark, manifest),
          active:
            typeof benchmark.id === 'string' &&
            benchmark.id === manifest.activeBenchmarkId
        };
      }
    }
  }

  return null;
}

function reportCaptureReadError(filePath, error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const likelyIncompleteOrCorrupt =
    message.includes('Unexpected end of JSON input') ||
    message.includes('Unterminated string');

  if (likelyIncompleteOrCorrupt) {
    console.warn(`Skipping incomplete or corrupt capture "${filePath}": ${message}`);
  } else {
    console.error(`Failed to analyze "${filePath}": ${message}`);
  }
}

async function summarizeCaptureFile(filePath, manifest) {
  const capture = await readAndParseCaptureFile(filePath);
  if (classifyCaptureArtifact(capture) !== 'replay-capture') {
    return null;
  }
  const summary = summarizeCapture(capture, filePath);
  const benchmark = resolveBenchmarkMatch(filePath, manifest);

  if (benchmark) {
    summary.benchmark = benchmark;
  }

  return summary;
}

export async function collectJsonFiles(targetPath, options = {}) {
  const {
    ignoreReports = true,
    ignoreArchive = false,
    ignoreCanonical = false
  } = options;
  const stat = await fs.stat(targetPath);

  if (stat.isFile()) {
    return VALID_EXTENSIONS.has(path.extname(targetPath).toLowerCase())
      ? [targetPath]
      : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      if (ignoreReports && entry.name === 'reports') {
        continue;
      }

      if (ignoreArchive && entry.name === 'archive') {
        continue;
      }

      if (ignoreCanonical && entry.name === 'canonical') {
        continue;
      }

      files.push(...(await collectJsonFiles(nextPath, options)));
      continue;
    }

    if (VALID_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(nextPath);
    }
  }

  return files;
}

export async function analyzeCaptureTargets(targetPaths = [inboxRoot]) {
  const discoveredFiles = [];
  const benchmarkManifest = await loadBenchmarkManifest();

  for (const rawTarget of targetPaths) {
    const resolvedTarget = path.resolve(workspaceRoot, rawTarget);

    try {
      const useDefaultFilters = resolvedTarget === inboxRoot;
      discoveredFiles.push(
        ...(await collectJsonFiles(resolvedTarget, {
          ignoreReports: true,
          ignoreArchive: useDefaultFilters,
          ignoreCanonical: useDefaultFilters
        }))
      );
    } catch (error) {
      console.error(
        `Skipping "${rawTarget}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  const uniqueFiles = [...new Set(discoveredFiles)].sort();

  if (uniqueFiles.length === 0) {
    return [];
  }

  const summaries = [];

  for (const filePath of uniqueFiles) {
    try {
      const summary = await summarizeCaptureFile(filePath, benchmarkManifest);
      if (summary) {
        summaries.push(summary);
      }
    } catch (error) {
      reportCaptureReadError(filePath, error);
    }
  }

  return summaries;
}

export async function collectRunArtifacts(targetPaths = [inboxRoot]) {
  const discoveredFiles = [];

  for (const rawTarget of targetPaths) {
    const resolvedTarget = path.resolve(workspaceRoot, rawTarget);

    try {
      const useDefaultFilters = resolvedTarget === inboxRoot;
      discoveredFiles.push(
        ...(await collectJsonFiles(resolvedTarget, {
          ignoreReports: true,
          ignoreArchive: useDefaultFilters,
          ignoreCanonical: useDefaultFilters
        }))
      );
    } catch (error) {
      console.error(
        `Skipping "${rawTarget}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  const uniqueFiles = [...new Set(discoveredFiles)].sort();
  const artifacts = [];

  for (const filePath of uniqueFiles) {
    try {
      const parsed = await readAndParseCaptureFile(filePath);
      const artifactType = classifyCaptureArtifact(parsed);

      if (
        artifactType !== 'run-journal' &&
        artifactType !== 'run-manifest' &&
        artifactType !== 'run-recommendations'
      ) {
        continue;
      }

      artifacts.push({
        filePath,
        artifactType,
        artifact: parsed
      });
    } catch (error) {
      reportCaptureReadError(filePath, error);
    }
  }

  return artifacts;
}

export async function loadManifestBenchmarkSummaries(existingSummaries = [], options = {}) {
  const benchmarkManifest = options.manifest ?? (await loadBenchmarkManifest());

  if (!benchmarkManifest) {
    return [];
  }

  const existingPaths = new Set(
    existingSummaries
      .map((summary) => (typeof summary?.filePath === 'string' ? path.resolve(summary.filePath) : null))
      .filter((filePath) => typeof filePath === 'string')
  );
  const manifestPaths = new Set();
  const benchmarkSummaries = [];

  for (const benchmark of benchmarkManifest.benchmarks ?? []) {
    for (const capturePath of benchmark?.capturePaths ?? []) {
      if (typeof capturePath !== 'string') {
        continue;
      }

      const resolvedCapturePath = path.resolve(workspaceRoot, capturePath);
      if (existingPaths.has(resolvedCapturePath) || manifestPaths.has(resolvedCapturePath)) {
        continue;
      }

      manifestPaths.add(resolvedCapturePath);

      if (!(await pathExists(resolvedCapturePath))) {
        continue;
      }

      try {
        benchmarkSummaries.push(
          await summarizeCaptureFile(resolvedCapturePath, benchmarkManifest)
        );
      } catch (error) {
        reportCaptureReadError(resolvedCapturePath, error);
      }
    }
  }

  return benchmarkSummaries;
}

export function buildCaptureReportMarkdown(summaries, options = {}) {
  const evidenceFreshness = collectEvidenceFreshness(summaries, {
    benchmarkSummaries: options.benchmarkSummaries ?? [],
    evidencePolicy: options.manifestHealth?.evidencePolicy
  });

  return [
    buildAggregateSection(summaries, {
      manifestHealthLines: options.manifestHealth?.lines ?? [],
      manifestHealth: options.manifestHealth ?? null,
      benchmarkSummaries: options.benchmarkSummaries ?? [],
      evidenceFreshness
    }),
    ...summaries.map((summary) => buildCaptureSection(summary, workspaceRoot))
  ].join('\n');
}

export function buildEmptyCaptureReportMarkdown(options = {}) {
  const {
    generatedAt = new Date().toISOString(),
    inboxPath = path.relative(workspaceRoot, inboxRoot),
    archivePath = path.relative(workspaceRoot, archiveRoot),
    manifestHealth,
    benchmarkSummaries = []
  } = options;
  const evidenceFreshness = collectEvidenceFreshness([], {
    benchmarkSummaries,
    evidencePolicy: manifestHealth?.evidencePolicy
  });

  return [
    '# Capture Analysis Report',
    '',
    `Generated: ${generatedAt}`,
    'Capture count: 0',
    '',
    '## Manifest health',
    ...((manifestHealth?.lines ?? ['- No benchmark manifest diagnostics are available.'])),
    '',
    '## Evidence freshness',
    ...(evidenceFreshness.lines ?? ['- Evidence freshness is unavailable.']),
    '',
    '## Benchmark truth',
    ...buildBenchmarkReadSections([], { benchmarkSummaries }),
    '',
    '## Current state',
    '- No capture JSON files were found in the active inbox.',
    `- Active inbox: \`${inboxPath}\``,
    `- Historical captures remain archived under \`${archivePath}\`.`,
    '- Historical baselines may still exist in the benchmark manifest, but they are not current branch proof.',
    '- Collect a fresh quick-start batch into the inbox, then rerun analysis.',
    '',
    '## Next steps',
    '- Restart the live loop if needed.',
    '- Launch from an authored quick start, not a manual/custom state.',
    '- Choose the repo `captures/inbox` folder in diagnostics.',
    '- Set the diagnostics proof scenario tag before the serious run starts.',
    '- Record a focused batch: 3-5 build/drop moments, 1-2 release phrases, 1 quiet atmospheric section.',
    '- Run `npm run proof:current` again after the new inbox files land.'
  ].join('\n');
}

export async function writeCaptureReport(
  summaries,
  options = {}
) {
  const {
    fileName = `capture-analysis_${timestampLabel()}.md`
  } = options;

  await fs.mkdir(reportRoot, { recursive: true });
  const reportPath = path.join(reportRoot, fileName);
  const report = buildCaptureReportMarkdown(summaries, {
    manifestHealth: options.manifestHealth,
    benchmarkSummaries: options.benchmarkSummaries
  });

  await fs.writeFile(reportPath, report, 'utf8');

  return reportPath;
}

export async function writeEmptyCaptureReport(options = {}) {
  const {
    fileName = 'capture-analysis_latest.md'
  } = options;

  await fs.mkdir(reportRoot, { recursive: true });
  const reportPath = path.join(reportRoot, fileName);
  const report = buildEmptyCaptureReportMarkdown({
    manifestHealth: options.manifestHealth,
    benchmarkSummaries: options.benchmarkSummaries
  });

  await fs.writeFile(reportPath, report, 'utf8');

  return reportPath;
}
