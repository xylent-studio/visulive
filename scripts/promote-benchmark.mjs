import fs from 'node:fs/promises';
import path from 'node:path';
import {
  benchmarkManifestPath,
  workspaceRoot
} from './capture-reporting.mjs';

function parseArgs(args) {
  const options = {
    capturePath: null,
    id: null,
    label: null,
    kind: 'primary-correction'
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
    benchmarks: []
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.capturePath) {
    throw new Error(
      'Usage: npm run benchmark:promote -- <capture-path> [--id benchmark-id] [--label benchmark label] [--kind primary-correction|secondary-floor|contrast|historical]'
    );
  }

  const resolvedCapturePath = path.resolve(workspaceRoot, options.capturePath);
  await fs.access(resolvedCapturePath);

  const relativeCapturePath = path
    .relative(workspaceRoot, resolvedCapturePath)
    .replace(/\\/g, '/');
  const derivedId =
    options.id ??
    path.basename(relativeCapturePath, path.extname(relativeCapturePath));
  const derivedLabel = options.label ?? derivedId;
  const manifest = await loadManifest();
  const benchmarks = Array.isArray(manifest.benchmarks) ? manifest.benchmarks : [];
  const existingIndex = benchmarks.findIndex((benchmark) => benchmark?.id === derivedId);
  const nextBenchmark = {
    id: derivedId,
    kind: options.kind,
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

  if (options.kind === 'primary-correction') {
    manifest.activeBenchmarkId = derivedId;
    manifest.primaryBenchmarkId = derivedId;
  }

  if (options.kind === 'secondary-floor') {
    manifest.secondaryScenarioIds = Array.from(
      new Set([...(manifest.secondaryScenarioIds ?? []), derivedId])
    );
  }

  await fs.writeFile(
    benchmarkManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log(`Promoted ${relativeCapturePath} as ${derivedId} (${options.kind}).`);
  console.log(`Manifest updated at ${benchmarkManifestPath}`);
}

await main();
