import fs from 'node:fs/promises';
import path from 'node:path';
import { workspaceRoot } from './capture-reporting.mjs';
import { timestampLabel } from './capture-analysis-core.mjs';

function parseArgs() {
  return {
    report: path.join('captures', 'reports', 'capture-analysis_latest.md'),
    proofPack: path.join('docs', 'proof-pack_latest.md'),
    proofManifest: path.join('docs', 'proof-pack_latest.json'),
    recommendations: path.join('docs', 'proof-pack_recommendations_latest.json'),
    template: path.join('captures', 'review-note-template.md'),
    output: path.join('captures', 'reviews', `review-note_${timestampLabel()}.md`)
  };
}

function applyArgs(defaults, argv) {
  const args = { ...defaults };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--report':
        args.report = argv[++index] ?? args.report;
        break;
      case '--proof-pack':
        args.proofPack = argv[++index] ?? args.proofPack;
        break;
      case '--proof-manifest':
        args.proofManifest = argv[++index] ?? args.proofManifest;
        break;
      case '--recommendations':
        args.recommendations = argv[++index] ?? args.recommendations;
        break;
      case '--template':
        args.template = argv[++index] ?? args.template;
        break;
      case '--output':
        args.output = argv[++index] ?? args.output;
        break;
      default:
        break;
    }
  }

  return args;
}

async function readText(filePath) {
  return fs.readFile(filePath, 'utf8');
}

function formatList(values = [], formatter = (value) => value) {
  if (!Array.isArray(values) || values.length === 0) {
    return '- none';
  }

  return values.map((value) => `- ${formatter(value)}`).join('\n');
}

async function main() {
  const args = applyArgs(parseArgs(), process.argv.slice(2));
  const reportPath = path.resolve(workspaceRoot, args.report);
  const proofPackPath = path.resolve(workspaceRoot, args.proofPack);
  const proofManifestPath = path.resolve(workspaceRoot, args.proofManifest);
  const recommendationsPath = path.resolve(workspaceRoot, args.recommendations);
  const templatePath = path.resolve(workspaceRoot, args.template);
  const outputPath = path.resolve(workspaceRoot, args.output);

  const [template, proofManifestRaw] = await Promise.all([
    readText(templatePath),
    readText(proofManifestPath)
  ]);
  const proofManifest = JSON.parse(proofManifestRaw);
  const failingGates = (proofManifest.gates ?? []).filter((gate) => gate.status === 'fail');
  const warningGates = (proofManifest.gates ?? []).filter((gate) => gate.status === 'warn');
  const currentScenarios = Object.entries(
    proofManifest.scenarioCoverage?.currentCounts ?? {}
  );
  const historicalScenarios = Object.entries(
    proofManifest.scenarioCoverage?.historicalBaselineCounts ?? {}
  );

  const reviewHeader = [
    '# VisuLive Proof Review Note',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Source report: ${reportPath}`,
    `Source proof pack: ${proofPackPath}`,
    `Source proof manifest: ${proofManifestPath}`,
    `Source recommendations: ${recommendationsPath}`,
    '',
    '## Current proof read',
    `- Current branch freshness: ${
      proofManifest.evidenceFreshness?.currentBranchProofFresh ? 'pass' : 'fail'
    } - ${proofManifest.evidenceFreshness?.summaryLine ?? 'unavailable'}`,
    `- Current review captures: ${proofManifest.scenarioCoverage?.currentReviewCaptureCount ?? 0}`,
    `- Unclassified current captures: ${proofManifest.scenarioCoverage?.unclassifiedCurrentCount ?? 0}`,
    `- Screenshot review freshness: ${
      proofManifest.screenshotFreshness?.currentReviewReady ? 'pass' : 'fail'
    } - ${proofManifest.screenshotFreshness?.summaryLine ?? 'unavailable'}`,
    '',
    '## Current scenarios',
    ...(currentScenarios.length > 0
      ? currentScenarios.map(([scenarioKind, count]) => `- ${scenarioKind}: ${count}`)
      : ['- none']),
    '',
    '## Historical baselines',
    ...(historicalScenarios.length > 0
      ? historicalScenarios.map(([scenarioKind, count]) => `- ${scenarioKind}: ${count}`)
      : ['- none']),
    '',
    '## Gate failures',
    formatList(failingGates, (gate) => `${gate.label}: ${gate.rationale}`),
    '',
    '## Gate warnings',
    formatList(warningGates, (gate) => `${gate.label}: ${gate.rationale}`),
    '',
    '## Human review reminder',
    '- Use fullscreen room-read plus proof stills before writing the final verdict.',
    '- Do not promote a capture to current-canonical benchmark truth unless the batch is actually good enough.',
    '- Archive or promote the reviewed inbox batch after the pass so inbox returns to fresh-only state.',
    '',
    '---',
    '',
    template.trim(),
    ''
  ].join('\n');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, reviewHeader, 'utf8');

  console.log(`Proof review note scaffold written to ${outputPath}`);
}

await main();
