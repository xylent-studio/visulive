import fs from 'node:fs/promises';
import path from 'node:path';
import {
  loadRunPackage,
  moveRunPackage,
  updateRunPackageArtifacts
} from './run-package-utils.mjs';

function parseArgs(argv) {
  const args = {
    runId: null,
    state: 'reviewed-candidate'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--run-id':
        args.runId = argv[++index] ?? null;
        break;
      case '--state':
        args.state = argv[++index] ?? args.state;
        break;
      default:
        break;
    }
  }

  if (!args.runId) {
    throw new Error('promote-run-package requires --run-id <runId>.');
  }

  if (args.state !== 'reviewed-candidate' && args.state !== 'canonical') {
    throw new Error('promote-run-package --state must be reviewed-candidate or canonical.');
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runPackage = await loadRunPackage(args.runId);
  const proofValidity = runPackage.journal.metadata.proofValidity;

  if (proofValidity?.currentProofEligible !== true) {
    throw new Error(
      `Run "${args.runId}" is not current-proof-eligible and cannot be promoted.`
    );
  }

  const recommendationFileName =
    runPackage.journal.metadata.recommendationFileName ??
    runPackage.manifest.recommendationFileName;

  if (!recommendationFileName) {
    throw new Error(
      `Run "${args.runId}" has no attached recommendation artifact. Review the run package first.`
    );
  }

  const recommendationPath = path.join(runPackage.runDirectory, recommendationFileName);
  await fs.access(recommendationPath);

  runPackage.journal.metadata.lifecycleState = args.state;
  runPackage.manifest.metadata.lifecycleState = args.state;
  runPackage.journal.metadata.updatedAt = new Date().toISOString();
  runPackage.manifest.metadata.updatedAt = runPackage.journal.metadata.updatedAt;

  await moveRunPackage(runPackage, args.state);
  await updateRunPackageArtifacts(runPackage);

  console.log(
    `Run package ${args.runId} promoted to ${args.state} at ${runPackage.runDirectory}`
  );
}

await main();
