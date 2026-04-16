import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildAggregateSection,
  buildBenchmarkReadSections,
  buildCaptureSection,
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

    return {
      activeBenchmarkId,
      primaryBenchmarkId,
      secondaryScenarioIds,
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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function collectBenchmarkManifestHealth() {
  const manifest = await loadBenchmarkManifest();

  if (!manifest) {
    return {
      present: false,
      valid: false,
      missingCapturePaths: [],
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
  const invalidBenchmarkIds = [];

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
      }
    }
  }

  for (const benchmarkId of [
    manifest.activeBenchmarkId,
    manifest.primaryBenchmarkId,
    ...manifest.secondaryScenarioIds
  ]) {
    if (benchmarkId && !benchmarksById.has(benchmarkId)) {
      invalidBenchmarkIds.push(benchmarkId);
    }
  }

  return {
    present: true,
    valid: missingCapturePaths.length === 0 && invalidBenchmarkIds.length === 0,
    missingCapturePaths,
    invalidBenchmarkIds,
    activeBenchmarkId: manifest.activeBenchmarkId,
    primaryBenchmarkId: manifest.primaryBenchmarkId,
    secondaryScenarioIds: manifest.secondaryScenarioIds,
    lines: [
      `- Active benchmark id: ${manifest.activeBenchmarkId ?? 'none'}`,
      `- Primary benchmark id: ${manifest.primaryBenchmarkId ?? 'none'}`,
      `- Secondary floor ids: ${manifest.secondaryScenarioIds.length > 0 ? manifest.secondaryScenarioIds.join(', ') : 'none'}`,
      `- Benchmarks declared: ${manifest.benchmarks.length}`,
      ...(missingCapturePaths.length > 0
        ? missingCapturePaths.map((capturePath) => `- Missing benchmark capture path: \`${capturePath}\``)
        : ['- All benchmark capture paths currently resolve.']),
      ...(invalidBenchmarkIds.length > 0
        ? invalidBenchmarkIds.map((benchmarkId) => `- Invalid benchmark pointer: \`${benchmarkId}\``)
        : ['- Benchmark pointers are internally consistent.'])
    ]
  };
}

function normalizeBenchmarkKind(kind, benchmark, manifest) {
  if (
    kind === 'primary-correction' ||
    kind === 'secondary-floor' ||
    kind === 'contrast' ||
    kind === 'historical'
  ) {
    return kind;
  }

  const benchmarkId = typeof benchmark?.id === 'string' ? benchmark.id : null;

  if (
    benchmarkId &&
    (benchmarkId === manifest?.primaryBenchmarkId ||
      benchmarkId === manifest?.activeBenchmarkId)
  ) {
    return 'primary-correction';
  }

  if (
    benchmarkId &&
    Array.isArray(manifest?.secondaryScenarioIds) &&
    manifest.secondaryScenarioIds.includes(benchmarkId)
  ) {
    return 'secondary-floor';
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
          kind: normalizeBenchmarkKind(benchmark.kind, benchmark, manifest),
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
      summaries.push(summary);
    } catch (error) {
      reportCaptureReadError(filePath, error);
    }
  }

  return summaries;
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
  return [
    buildAggregateSection(summaries, {
      manifestHealthLines: options.manifestHealth?.lines ?? [],
      manifestHealth: options.manifestHealth ?? null,
      benchmarkSummaries: options.benchmarkSummaries ?? []
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

  return [
    '# Capture Analysis Report',
    '',
    `Generated: ${generatedAt}`,
    'Capture count: 0',
    '',
    '## Manifest health',
    ...((manifestHealth?.lines ?? ['- No benchmark manifest diagnostics are available.'])),
    '',
    '## Benchmark truth',
    ...buildBenchmarkReadSections([], { benchmarkSummaries }),
    '',
    '## Current state',
    '- No capture JSON files were found in the active inbox.',
    `- Active inbox: \`${inboxPath}\``,
    `- Historical captures remain archived under \`${archivePath}\`.`,
    '- Collect a fresh quick-start batch into the inbox, then rerun analysis.',
    '',
    '## Next steps',
    '- Restart the live loop if needed.',
    '- Launch from an authored quick start, not a manual/custom state.',
    '- Choose the repo `captures/inbox` folder in diagnostics.',
    '- Record a focused batch: 3-5 build/drop moments, 1-2 release phrases, 1 quiet atmospheric section.',
    '- Run `npm run analyze:captures` again after the new inbox files land.'
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
