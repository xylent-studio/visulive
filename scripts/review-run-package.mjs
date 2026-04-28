import fs from 'node:fs/promises';
import path from 'node:path';
import { analyzeCaptureTargets } from './capture-reporting.mjs';
import { buildRunRecommendationArtifact } from './evidence-recommendations.mjs';
import { collectMissedCaptureOpportunities } from './report-missed-opportunities.mjs';
import {
  copyFileIntoRunPackage,
  loadRunPackage,
  resolveRunClipPaths,
  updateRunPackageArtifacts
} from './run-package-utils.mjs';

function parseArgs(argv) {
  const args = {
    runId: null,
    reviewNote: null,
    summaryFileName: null,
    recommendationsFileName: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--run-id':
        args.runId = argv[++index] ?? null;
        break;
      case '--review-note':
        args.reviewNote = argv[++index] ?? null;
        break;
      case '--summary-file':
        args.summaryFileName = argv[++index] ?? null;
        break;
      case '--recommendations-file':
        args.recommendationsFileName = argv[++index] ?? null;
        break;
      default:
        break;
    }
  }

  if (!args.runId) {
    throw new Error('review-run-package requires --run-id <runId>.');
  }

  return args;
}

function buildSummaryMarkdown(runPackage, summaries, recommendationsArtifact, missedEntries) {
  const proofValidity = runPackage.journal.metadata.proofValidity;
  const invalidations = proofValidity?.invalidations ?? [];
  const gateLines = (recommendationsArtifact.metadata.gateOutcomes ?? []).map(
    (gate) => `- ${gate.id}: ${gate.status} - ${gate.rationale}`
  );
  const recommendationLines =
    recommendationsArtifact.recommendations.length > 0
      ? recommendationsArtifact.recommendations.map(
          (recommendation) =>
            `- ${recommendation.issueId} [${recommendation.severity}] - ${recommendation.title} | ${recommendation.ownerLane} | ${recommendation.suspectedCause}`
        )
      : ['- No ranked tuning recommendations were produced for this run.'];

  return [
    '# Run Package Review',
    '',
    `Run id: ${runPackage.runId}`,
    `Root: ${runPackage.rootKind}`,
    `Lifecycle: ${runPackage.journal.metadata.lifecycleState}`,
    `Proof verdict: ${proofValidity?.verdict ?? 'exploratory'}`,
    `Current-proof-eligible: ${proofValidity?.currentProofEligible === true ? 'yes' : 'no'}`,
    `Recovery guidance: ${proofValidity?.recoveryGuidance ?? 'none'}`,
    `Scenario: ${runPackage.journal.metadata.proofScenarioKind ?? 'unassigned'}`,
    `Clip count: ${summaries.length}`,
    `Checkpoint still count: ${runPackage.journal.checkpointStills?.length ?? 0}`,
    '',
    '## Invalidations',
    ...(invalidations.length > 0
      ? invalidations.map(
          (invalidation) =>
            `- ${invalidation.code} @ ${invalidation.timestampMs}ms - ${invalidation.reason} (${invalidation.recommendedDisposition})`
        )
      : ['- none']),
    '',
    '## Gate outcomes',
    ...(gateLines.length > 0 ? gateLines : ['- none']),
    '',
    '## Missed opportunities',
    ...(missedEntries.length > 0
      ? missedEntries.map(
          (entry) =>
            `- ${entry.markerKind} @ ${entry.timestampMs}ms - ${entry.reason}`
        )
      : ['- none']),
    '',
    '## Recommendations',
    ...recommendationLines,
    ''
  ].join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runPackage = await loadRunPackage(args.runId);
  const clipPaths = resolveRunClipPaths(runPackage);
  const summaries = await analyzeCaptureTargets(clipPaths);
  const missedEntries = (await collectMissedCaptureOpportunities([runPackage.runDirectory])).filter(
    (entry) => entry.runId === args.runId
  );
  const recommendationsArtifact = buildRunRecommendationArtifact({
    runId: args.runId,
    journal: runPackage.journal,
    summaries,
    missedEntries,
    lifecycleState: runPackage.journal.metadata.lifecycleState
  });

  const summaryFileName =
    args.summaryFileName ?? `${args.runId}__review-summary.md`;
  const recommendationsFileName =
    args.recommendationsFileName ?? `${args.runId}__recommendations.json`;
  const summaryPath = path.join(runPackage.runDirectory, summaryFileName);
  const recommendationsPath = path.join(runPackage.runDirectory, recommendationsFileName);

  await fs.writeFile(
    summaryPath,
    buildSummaryMarkdown(runPackage, summaries, recommendationsArtifact, missedEntries),
    'utf8'
  );
  await fs.writeFile(
    recommendationsPath,
    `${JSON.stringify(recommendationsArtifact, null, 2)}\n`,
    'utf8'
  );

  runPackage.journal.metadata.recommendationFileName = recommendationsFileName;
  runPackage.manifest.recommendationFileName = recommendationsFileName;

  if (args.reviewNote) {
    const reviewNoteFileName = `${args.runId}__review-note${path.extname(args.reviewNote) || '.md'}`;
    await copyFileIntoRunPackage(runPackage, args.reviewNote, reviewNoteFileName);
    runPackage.journal.metadata.reviewNoteFileName = reviewNoteFileName;
    runPackage.manifest.reviewNoteFileName = reviewNoteFileName;
  }

  runPackage.journal.metadata.updatedAt = new Date().toISOString();
  runPackage.manifest.metadata.updatedAt = runPackage.journal.metadata.updatedAt;
  await updateRunPackageArtifacts(runPackage);

  console.log(`Run review summary written to ${summaryPath}`);
  console.log(`Run recommendations written to ${recommendationsPath}`);

  if (args.reviewNote) {
    console.log(`Review note attached to ${runPackage.journal.metadata.reviewNoteFileName}`);
  }
}

await main();
