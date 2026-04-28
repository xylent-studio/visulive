import { execFileSync } from 'node:child_process';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const allowDirty = args.has('--allow-dirty');

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function parseNodeVersion(version) {
  const [major = '0', minor = '0', patch = '0'] = version.split('.');

  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10)
  };
}

function nodeVersionPasses(version) {
  const parsed = parseNodeVersion(version);

  if (!Number.isFinite(parsed.major) || !Number.isFinite(parsed.minor)) {
    return false;
  }

  return parsed.major > 22 || (parsed.major === 22 && parsed.minor >= 12);
}

async function canWriteCaptureInbox() {
  const inboxPath = path.join(repoRoot, 'captures', 'inbox');
  const testPath = path.join(inboxPath, `.proof-preflight-${process.pid}.tmp`);

  await mkdir(inboxPath, { recursive: true });
  await writeFile(testPath, `proof-preflight ${new Date().toISOString()}\n`, 'utf8');
  await unlink(testPath);

  return inboxPath;
}

function printResult({ failures, warnings, branch, commit, dirtyCount, inboxPath }) {
  const passed = failures.length === 0;
  const status =
    passed && allowDirty && dirtyCount > 0
      ? 'passed for exploratory checks only'
      : passed
        ? 'passed'
        : 'failed';

  console.log(`Serious proof preflight ${status}.`);
  console.log(`Branch: ${branch}`);
  console.log(`Commit: ${commit}`);
  console.log(`Dirty paths: ${dirtyCount}`);
  console.log(`Capture inbox: ${inboxPath}`);

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (failures.length > 0) {
    console.error('\nBlockers:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error('\nFix the blockers, then start the local proof app with:');
    console.error('npm run dev:proof');
    process.exitCode = 1;
    return;
  }

  if (allowDirty && dirtyCount > 0) {
    console.log(
      '\nExploratory setup is usable, but serious proof still requires a clean committed workspace before npm run dev:proof.'
    );
    return;
  }

  console.log('\nStart the local proof app with:');
  console.log('npm run dev:proof');
  console.log('\nThen select Backstage -> Capture -> Proof Scenario before Start Show.');
}

async function main() {
  const failures = [];
  const warnings = [];
  let branch = 'unknown';
  let commit = 'unknown';
  let dirtyOutput = '';
  let inboxPath = path.join(repoRoot, 'captures', 'inbox');

  if (!nodeVersionPasses(process.versions.node)) {
    failures.push(`Node ${process.versions.node} is below the required >=22.12.0 runtime.`);
  }

  try {
    branch = git(['branch', '--show-current']) || 'unknown';
    commit = git(['rev-parse', '--short', 'HEAD']) || 'unknown';
    dirtyOutput = git(['status', '--porcelain']);
  } catch (error) {
    failures.push(`Git metadata could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (branch === 'release/v1') {
    failures.push('Current branch is release/v1. Serious proof must target the active rewrite branch, not preserved legacy.');
  }

  if (branch === 'unknown') {
    failures.push('Current branch is unknown, so captures would not have attributable build identity.');
  }

  const dirtyLines = dirtyOutput
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (dirtyLines.length > 0 && !allowDirty) {
    failures.push(
      `Working tree has ${dirtyLines.length} dirty path(s). Serious proof build identity requires a clean committed workspace.`
    );
  } else if (dirtyLines.length > 0) {
    warnings.push(
      `Working tree has ${dirtyLines.length} dirty path(s). --allow-dirty was used, so this can only support exploratory capture.`
    );
  }

  try {
    inboxPath = await canWriteCaptureInbox();
  } catch (error) {
    failures.push(
      `captures/inbox is not writable: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  printResult({
    failures,
    warnings,
    branch,
    commit,
    dirtyCount: dirtyLines.length,
    inboxPath
  });
}

await main();
