import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function expect(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function includesAll(source, tokens) {
  return tokens.every((token) => source.includes(token));
}

const failures = [];
const packageJson = JSON.parse(read('package.json'));
const runJournal = read('src/replay/runJournal.ts');
const app = read('src/app/App.tsx');
const buildProofPack = read('scripts/build-proof-pack.mjs');
const captureReporting = read('scripts/capture-reporting.mjs');
const runPackageUtils = read('scripts/run-package-utils.mjs');
const evidenceRecommendations = read('scripts/evidence-recommendations.mjs');
const queryEvidence = read('scripts/query-evidence.mjs');
const anthologyCatalog = read('src/scene/direction/anthologyCatalog.ts');
const agents = read('AGENTS.md');
const deploymentOps = read('docs/deployment-operations.md');

expect(
  packageJson.scripts['release:verify:strict']?.includes('--require-current') &&
    packageJson.scripts['release:verify:strict']?.includes('--strict') &&
    packageJson.scripts['release:verify'] === 'npm run release:verify:stable',
  'release verification must enforce current benchmark and strict proof-pack gates.'
);

expect(
  buildProofPack.includes('if (args.strict && failedGates.length > 0)') &&
    buildProofPack.includes('process.exitCode = 1'),
  'proof-pack strict mode must exit non-zero on failed gates.'
);

expect(
  includesAll(runJournal, [
    "buildInfo.lane === 'stable'",
    "buildInfo.lane === 'frontier'",
    "buildInfo.proofStatus === 'proof-pack'",
    "buildInfo.proofStatus === 'promoted'",
    'buildInfo.dirty === false',
    "buildInfo.commit !== 'dev'",
    "buildInfo.branch !== 'unknown'"
  ]),
  'serious proof build identity must reject dev/unverified/dirty/unknown builds.'
);

expect(
  app.includes('buildInfo: createReplayBuildInfo(BUILD_INFO)') &&
    app.includes('hasBuildIdentity: isReplayBuildInfoValid(BUILD_INFO)'),
  'run metadata must use the shared build identity validator.'
);

const saveIndex = app.indexOf('const stillSaveResult = await saveCaptureBlobsToDirectory');
const registerIndex = app.indexOf('registerReplayRunStill(activeJournal');
expect(
  saveIndex >= 0 &&
    registerIndex > saveIndex &&
    app.includes('if (!stillSaveResult.savedFileNames.includes(stillFileName))') &&
    app.includes("invalidateActiveProofRun(\n            'capture-save-failed'"),
  'checkpoint stills must register only after successful save and invalidate on failure.'
);

expect(
  captureReporting.includes("No active benchmark id is set.") &&
    captureReporting.includes("No primary benchmark id is set.") &&
    captureReporting.includes('No current-canonical benchmark exists.') &&
    captureReporting.includes('!requireCurrentCanonical || currentBenchmarkMissingReasons.length === 0'),
  'benchmark validation must fail --require-current when current benchmark truth is missing.'
);

expect(
  runPackageUtils.includes('Refusing to overwrite existing run package') &&
    !runPackageUtils.includes('rm(targetDirectory') &&
    !runPackageUtils.includes('force: true'),
  'run package lifecycle moves must refuse overwrites.'
);

expect(
  evidenceRecommendations.includes("id: 'taste'") &&
    evidenceRecommendations.includes("? 'pass'") &&
    evidenceRecommendations.includes("? 'warn'") &&
    evidenceRecommendations.includes(": 'fail'"),
  'recommendation taste gate must support pass/warn/fail.'
);

expect(
  queryEvidence.includes('resolveCommitTimestamp') &&
    queryEvidence.includes('afterCommitBuiltAt') &&
    queryEvidence.includes('build_built_at >= @afterCommitBuiltAt') &&
    !queryEvidence.includes('build_commit >= @afterCommit'),
  'after-commit evidence queries must use timestamps, not lexicographic hashes.'
);

expect(
  anthologyCatalog.includes("id: 'hero-ecology'") &&
    anthologyCatalog.includes("runtimeOwnershipStatus: 'owned-system'") &&
    anthologyCatalog.includes('HeroSystem owns core lifecycle now'),
  'machine-readable anthology catalog must reflect current HeroSystem ownership.'
);

expect(
  agents.includes('now explicitly sequences world, chamber, hero, authority, and stage work') &&
    !agents.includes('FlagshipShowRuntime` is a facade/forwarding layer'),
  'AGENTS must not describe FlagshipShowRuntime as a forwarding facade.'
);

expect(
  deploymentOps.includes('strict proof-pack generation; any failed proof gate makes the command fail') &&
    deploymentOps.includes('strict current-canonical benchmark manifest validation'),
  'deployment runbook must not trust weak release verification.'
);

if (failures.length > 0) {
  console.error('Proof audit failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Proof audit passed.');
