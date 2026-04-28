import fs from 'node:fs/promises';
import path from 'node:path';
import {
  benchmarkManifestPath,
  workspaceRoot
} from './capture-reporting.mjs';
import { loadRunPackage } from './run-package-utils.mjs';

function parseArgs(args) {
  const options = {
    capturePath: null,
    id: null,
    label: null,
    kind: 'primary-benchmark',
    status: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith('--') && !options.capturePath) {
      options.capturePath = arg;
      continue;
    }

    if (arg === '--id') {
      options.id = args[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === '--label') {
      options.label = args[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === '--kind') {
      options.kind = args[index + 1] ?? options.kind;
      index += 1;
      continue;
    }

    if (arg === '--status') {
      options.status = args[index + 1] ?? null;
      index += 1;
    }
  }

  return options;
}

async function loadManifest() {
  try {
    const raw = await fs.readFile(benchmarkManifestPath, 'utf8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));

    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Start from an empty manifest.
  }

  return {
    activeBenchmarkId: null,
    primaryBenchmarkId: null,
    secondaryScenarioIds: [],
    scenarioIdsByKind: {},
    benchmarks: []
  };
}

function normalizeKind(kind) {
  if (kind === 'primary-correction') {
    return 'primary-benchmark';
  }

  if (kind === 'secondary-floor') {
    return 'room-floor';
  }

  if (kind === 'contrast') {
    return 'coverage';
  }

  return kind;
}

function normalizeStatus(status, normalizedKind) {
  if (
    status === 'historical-baseline' ||
    status === 'current-candidate' ||
    status === 'current-canonical'
  ) {
    return status;
  }

  return normalizedKind === 'historical' ? 'historical-baseline' : 'current-candidate';
}

function isCurrentStatus(status) {
  return status === 'current-candidate' || status === 'current-canonical';
}

function rebuildScenarioPointers(manifest) {
  manifest.activeBenchmarkId = null;
  manifest.primaryBenchmarkId = null;
  manifest.secondaryScenarioIds = [];
  manifest.scenarioIdsByKind = {};

  for (const benchmark of manifest.benchmarks ?? []) {
    if (!benchmark || typeof benchmark !== 'object') {
      continue;
    }

    const benchmarkId = typeof benchmark.id === 'string' ? benchmark.id : null;
    const benchmarkKind = normalizeKind(benchmark.kind);
    const benchmarkStatus = normalizeStatus(benchmark.status, benchmarkKind);

    benchmark.kind = benchmarkKind;
    benchmark.status = benchmarkStatus;

    if (!benchmarkId || !isCurrentStatus(benchmarkStatus) || benchmarkKind === 'historical') {
      continue;
    }

    if (!Array.isArray(manifest.scenarioIdsByKind[benchmarkKind])) {
      manifest.scenarioIdsByKind[benchmarkKind] = [];
    }

    manifest.scenarioIdsByKind[benchmarkKind].push(benchmarkId);

    if (benchmarkKind === 'room-floor') {
      manifest.secondaryScenarioIds.push(benchmarkId);
    }

    if (benchmarkKind === 'primary-benchmark') {
      if (!manifest.primaryBenchmarkId) {
        manifest.primaryBenchmarkId = benchmarkId;
      }

      if (!manifest.activeBenchmarkId && benchmarkStatus === 'current-canonical') {
        manifest.activeBenchmarkId = benchmarkId;
      }
    }
  }

  for (const [kind, ids] of Object.entries(manifest.scenarioIdsByKind)) {
    manifest.scenarioIdsByKind[kind] = Array.from(new Set(ids));
  }

  manifest.secondaryScenarioIds = Array.from(new Set(manifest.secondaryScenarioIds));

  if (!manifest.activeBenchmarkId && manifest.primaryBenchmarkId) {
    manifest.activeBenchmarkId = manifest.primaryBenchmarkId;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.capturePath) {
    throw new Error(
      'Usage: npm run benchmark:promote -- <capture-path> [--id benchmark-id] [--label benchmark label] [--kind primary-benchmark|room-floor|coverage|sparse-silence|operator-trust|steering|historical] [--status historical-baseline|current-candidate|current-canonical]. Default status is current-candidate unless --status is provided.'
    );
  }

  const resolvedCapturePath = path.resolve(workspaceRoot, options.capturePath);
  await fs.access(resolvedCapturePath);

  const relativeCapturePath = path
    .relative(workspaceRoot, resolvedCapturePath)
    .replace(/\\/g, '/');
  const promotableCapture =
    relativeCapturePath.startsWith('captures/canonical/') ||
    relativeCapturePath.startsWith('captures/archive/');

  if (!promotableCapture) {
    throw new Error(
      'Benchmark captures must live under captures/canonical or captures/archive before promotion.'
    );
  }

  const derivedId =
    options.id ??
    path.basename(relativeCapturePath, path.extname(relativeCapturePath));
  const derivedLabel = options.label ?? derivedId;
  const manifest = await loadManifest();
  const normalizedKind = normalizeKind(options.kind);
  const normalizedStatus = normalizeStatus(options.status, normalizedKind);
  const runPackageMatch = relativeCapturePath.match(/captures\/(?:canonical|archive)\/runs\/([^/]+)\/clips\//);

  if (
    runPackageMatch &&
    normalizedStatus !== 'historical-baseline' &&
    normalizedKind !== 'historical'
  ) {
    const runId = runPackageMatch[1];
    const runPackage = await loadRunPackage(runId);
    const currentProofEligible = runPackage.journal.metadata.proofValidity?.currentProofEligible === true;
    const lifecycleState = runPackage.journal.metadata.lifecycleState;

    if (!currentProofEligible) {
      throw new Error(
        `Benchmark promotion requires a current-proof-eligible run package. Run "${runId}" is not eligible.`
      );
    }

    if (lifecycleState !== 'reviewed-candidate' && lifecycleState !== 'canonical') {
      throw new Error(
        `Benchmark promotion requires a reviewed run package. Run "${runId}" is in lifecycle state "${lifecycleState}".`
      );
    }
  }

  const benchmarks = Array.isArray(manifest.benchmarks) ? manifest.benchmarks : [];
  const existingIndex = benchmarks.findIndex((benchmark) => benchmark?.id === derivedId);
  const nextBenchmark = {
    id: derivedId,
    kind: normalizedKind,
    status: normalizedStatus,
    label: derivedLabel,
    capturePaths: [relativeCapturePath]
  };

  if (existingIndex >= 0) {
    benchmarks[existingIndex] = {
      ...benchmarks[existingIndex],
      ...nextBenchmark
    };
  } else {
    benchmarks.push(nextBenchmark);
  }

  manifest.benchmarks = benchmarks;
  rebuildScenarioPointers(manifest);

  await fs.writeFile(
    benchmarkManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log(
    `Promoted ${relativeCapturePath} as ${derivedId} (${normalizedKind}, ${normalizedStatus}).`
  );
  console.log(`Manifest updated at ${benchmarkManifestPath}`);
}

await main();
