import {
  loadRunPackage,
  moveRunPackage,
  updateRunPackageArtifacts,
  validateRunPackageIntegrity
} from './run-package-utils.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = {
    runId: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--run-id') {
      args.runId = argv[++index] ?? null;
    }
  }

  if (!args.runId) {
    throw new Error('archive-run-package requires --run-id <runId>.');
  }

  return args;
}

export async function refreshArchivedReviewSummaries(runPackage) {
  const entries = await fs.readdir(runPackage.runDirectory, { withFileTypes: true });
  const updatedAt = runPackage.journal.metadata.updatedAt;

  for (const entry of entries) {
    if (
      !entry.isFile() ||
      !entry.name.endsWith('__review-summary.md')
    ) {
      continue;
    }

    const filePath = path.join(runPackage.runDirectory, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const next = raw
      .replace(/^-?\s*Root: .+$/m, 'Root: archive')
      .replace(/^-?\s*Lifecycle: .+$/m, 'Lifecycle: archive')
      .replace(/^-?\s*Reviewed: .+$/m, `Reviewed: ${updatedAt}`);

    if (next !== raw) {
      await fs.writeFile(filePath, next, 'utf8');
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runPackage = await loadRunPackage(args.runId);
  const integrity = await validateRunPackageIntegrity(runPackage);

  runPackage.journal.metadata.lifecycleState = 'archive';
  runPackage.manifest.metadata.lifecycleState = 'archive';
  runPackage.journal.metadata.artifactIntegrity = integrity;
  runPackage.manifest.metadata.artifactIntegrity = integrity;
  runPackage.journal.metadata.updatedAt = new Date().toISOString();
  runPackage.manifest.metadata.updatedAt = runPackage.journal.metadata.updatedAt;
  for (const recommendationFile of runPackage.recommendationFiles ?? []) {
    recommendationFile.artifact.metadata.lifecycleState = 'archive';
    recommendationFile.artifact.metadata.updatedAt = runPackage.journal.metadata.updatedAt;
  }

  await moveRunPackage(runPackage, 'archive');
  await updateRunPackageArtifacts(runPackage);
  await refreshArchivedReviewSummaries(runPackage);

  console.log(`Run package ${args.runId} archived at ${runPackage.runDirectory}`);
  if (integrity.verdict !== 'pass') {
    console.warn(`Archived with artifact-integrity verdict ${integrity.verdict}.`);
  }
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] ?? '')).href) {
  await main();
}
