import { spawn } from 'node:child_process';
import path from 'node:path';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const args = {
    captures: null,
    report: path.join('captures', 'reports', 'capture-analysis_latest.md'),
    screenshots: path.join('captures', 'inbox', 'screenshots'),
    output: path.join('docs', 'proof-pack_latest.md'),
    manifest: path.join('docs', 'proof-pack_latest.json'),
    recommendations: path.join('docs', 'proof-pack_recommendations_latest.json'),
    limit: 5,
    reviewNote: false,
    reviewNoteOutput: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--captures':
        args.captures = argv[++index] ?? null;
        break;
      case '--report':
        args.report = argv[++index] ?? args.report;
        break;
      case '--screenshots':
        args.screenshots = argv[++index] ?? args.screenshots;
        break;
      case '--output':
        args.output = argv[++index] ?? args.output;
        break;
      case '--manifest':
        args.manifest = argv[++index] ?? args.manifest;
        break;
      case '--recommendations':
        args.recommendations = argv[++index] ?? args.recommendations;
        break;
      case '--limit':
        args.limit = Math.max(1, Number.parseInt(argv[++index] ?? '5', 10) || 5);
        break;
      case '--review-note':
        args.reviewNote = true;
        break;
      case '--review-note-output':
        args.reviewNoteOutput = argv[++index] ?? null;
        break;
      default:
        break;
    }
  }

  return args;
}

function runNodeScript(scriptPath, scriptArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(workspaceRoot, scriptPath), ...scriptArgs], {
      cwd: workspaceRoot,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      resolve(typeof code === 'number' ? code : 1);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const benchmarkExitCode = await runNodeScript('scripts/validate-benchmark-manifest.mjs');

  if (benchmarkExitCode !== 0) {
    process.exitCode = benchmarkExitCode;
    return;
  }

  const analyzeArgs = args.captures ? [args.captures] : [];
  const analyzeExitCode = await runNodeScript('scripts/analyze-captures.mjs', analyzeArgs);
  const proofPackArgs = [
    '--report',
    args.report,
    '--screenshots',
    args.screenshots,
    '--output',
    args.output,
    '--manifest',
    args.manifest,
    '--recommendations',
    args.recommendations,
    '--limit',
    String(args.limit)
  ];

  if (args.captures) {
    proofPackArgs.unshift(args.captures);
    proofPackArgs.unshift('--captures');
  }

  const proofPackExitCode = await runNodeScript('scripts/build-proof-pack.mjs', proofPackArgs);

  if (proofPackExitCode !== 0) {
    process.exitCode = proofPackExitCode;
    return;
  }

  if (args.reviewNote) {
    const reviewNoteArgs = [
      '--report',
      args.report,
      '--proof-pack',
      args.output,
      '--proof-manifest',
      args.manifest
    ];

    if (args.reviewNoteOutput) {
      reviewNoteArgs.push('--output', args.reviewNoteOutput);
    }

    const reviewNoteExitCode = await runNodeScript(
      'scripts/write-proof-review-note.mjs',
      reviewNoteArgs
    );

    if (reviewNoteExitCode !== 0) {
      process.exitCode = reviewNoteExitCode;
      return;
    }
  }

  if (analyzeExitCode !== 0) {
    console.error(
      'proof:current | analyzer did not find a current inbox batch. Reports were refreshed, but fresh proof is still missing.'
    );
    process.exitCode = analyzeExitCode;
    return;
  }

  console.log('proof:current | benchmark validation, analysis, and proof-pack refresh completed.');
}

await main();
