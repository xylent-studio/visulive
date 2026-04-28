import {
  loadRunPackage,
  moveRunPackage,
  updateRunPackageArtifacts
} from './run-package-utils.mjs';

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runPackage = await loadRunPackage(args.runId);

  runPackage.journal.metadata.lifecycleState = 'archive';
  runPackage.manifest.metadata.lifecycleState = 'archive';
  runPackage.journal.metadata.updatedAt = new Date().toISOString();
  runPackage.manifest.metadata.updatedAt = runPackage.journal.metadata.updatedAt;

  await moveRunPackage(runPackage, 'archive');
  await updateRunPackageArtifacts(runPackage);

  console.log(`Run package ${args.runId} archived at ${runPackage.runDirectory}`);
}

await main();
