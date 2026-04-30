import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const currentTruthPath = path.join(workspaceRoot, 'docs', 'current-truth.md');
const reportLatestPath = path.join(
  workspaceRoot,
  'captures',
  'reports',
  'capture-analysis_latest.md'
);
const runRoots = {
  inbox: path.join(workspaceRoot, 'captures', 'inbox', 'runs'),
  canonical: path.join(workspaceRoot, 'captures', 'canonical', 'runs'),
  archive: path.join(workspaceRoot, 'captures', 'archive', 'runs')
};
const checkpointRoot = 'C:\\dev\\_intel\\ops\\local-machine-ops\\checkpoints\\visulive';
const runIdPattern = /run_\d{8}_\d{6}_[a-z0-9]+/g;

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function statOrNull(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: workspaceRoot,
      encoding: 'utf8'
    }).trim();
  } catch {
    return null;
  }
}

async function readTextOrNull(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function listDirectories(rootPath) {
  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(rootPath, entry.name));
  } catch {
    return [];
  }
}

async function collectRunDirectories() {
  const entries = [];

  for (const [rootKind, rootPath] of Object.entries(runRoots)) {
    const directories = await listDirectories(rootPath);
    for (const directory of directories) {
      const stats = await statOrNull(directory);
      entries.push({
        rootKind,
        runId: path.basename(directory),
        directory,
        mtimeMs: stats?.mtimeMs ?? 0
      });
    }
  }

  return entries.sort((left, right) => right.mtimeMs - left.mtimeMs);
}

async function findLatestCheckpoint() {
  const directories = await listDirectories(checkpointRoot);
  const files = [];

  for (const directory of directories.length > 0 ? directories : [checkpointRoot]) {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) {
          continue;
        }
        const filePath = path.join(directory, entry.name);
        const stats = await statOrNull(filePath);
        files.push({ filePath, mtimeMs: stats?.mtimeMs ?? 0 });
      }
    } catch {
      // The local intel stack is optional.
    }
  }

  return files.sort((left, right) => right.mtimeMs - left.mtimeMs)[0] ?? null;
}

function formatAge(ms) {
  if (!Number.isFinite(ms) || ms < 0) {
    return 'unknown';
  }

  const minutes = Math.round(ms / 60000);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours}h`;
  }

  return `${Math.round(hours / 24)}d`;
}

function line(kind, message) {
  return `- ${kind.toUpperCase()}: ${message}`;
}

async function main() {
  const now = Date.now();
  const head = gitHead();
  const currentTruth = await readTextOrNull(currentTruthPath);
  const runDirectories = await collectRunDirectories();
  const newestRun = runDirectories[0] ?? null;
  const inboxRuns = runDirectories.filter((entry) => entry.rootKind === 'inbox');
  const latestReportStats = await statOrNull(reportLatestPath);
  const latestCheckpoint = await findLatestCheckpoint();
  const output = ['# Current Truth Audit', ''];

  output.push(line('info', `HEAD commit: ${head ?? 'unavailable'}`));

  if (!currentTruth) {
    output.push(line('warn', 'docs/current-truth.md is missing.'));
  } else {
    const currentTruthStats = await statOrNull(currentTruthPath);
    const currentTruthRunIds = [...new Set(currentTruth.match(runIdPattern) ?? [])];
    output.push(
      line(
        'info',
        `docs/current-truth.md age: ${formatAge(now - (currentTruthStats?.mtimeMs ?? now))}`
      )
    );

    const commitSelfReference =
      /Current committed wave:\s+run `git rev-parse --short HEAD`/i.test(currentTruth);

    if (head && !currentTruth.includes(head) && !commitSelfReference) {
      output.push(
        line('warn', `docs/current-truth.md does not mention current HEAD ${head}.`)
      );
    } else if (head && commitSelfReference && !currentTruth.includes(head)) {
      output.push(
        line(
          'info',
          'docs/current-truth.md declares the current committed wave by repository HEAD.'
        )
      );
    }

    for (const runId of currentTruthRunIds) {
      if (!runDirectories.some((entry) => entry.runId === runId)) {
        output.push(line('warn', `current-truth references missing run package ${runId}.`));
      }
    }

    output.push(
      line(
        'info',
        `current-truth run references: ${
          currentTruthRunIds.length > 0 ? currentTruthRunIds.join(', ') : 'none'
        }`
      )
    );
  }

  output.push(
    line(
      inboxRuns.length > 0 ? 'warn' : 'pass',
      inboxRuns.length > 0
        ? `captures/inbox/runs has ${inboxRuns.length} run package(s): ${inboxRuns
            .map((entry) => entry.runId)
            .join(', ')}`
        : 'captures/inbox/runs has no run-package residue.'
    )
  );

  if (newestRun) {
    output.push(
      line(
        'info',
        `Newest run package: ${newestRun.runId} (${newestRun.rootKind}, ${formatAge(
          now - newestRun.mtimeMs
        )} old)`
      )
    );
  } else {
    output.push(line('warn', 'No run packages were found under captures.'));
  }

  if (!latestReportStats) {
    output.push(line('warn', 'capture-analysis_latest.md is missing.'));
  } else {
    const staleAgainstNewestRun =
      newestRun && latestReportStats.mtimeMs + 1000 < newestRun.mtimeMs;
    output.push(
      line(
        staleAgainstNewestRun ? 'warn' : 'pass',
        `capture-analysis_latest.md age: ${formatAge(now - latestReportStats.mtimeMs)}${
          staleAgainstNewestRun ? '; older than newest run package' : ''
        }`
      )
    );
  }

  if (!latestCheckpoint) {
    output.push(line('warn', 'No local _intel checkpoint was found for visulive.'));
  } else {
    const staleAgainstNewestRun =
      newestRun && latestCheckpoint.mtimeMs + 1000 < newestRun.mtimeMs;
    output.push(
      line(
        staleAgainstNewestRun ? 'warn' : 'pass',
        `_intel latest checkpoint age: ${formatAge(now - latestCheckpoint.mtimeMs)}${
          staleAgainstNewestRun ? '; older than newest run package' : ''
        }`
      )
    );
  }

  output.push('');
  output.push('This audit is informational and exits 0; proof gates remain owned by proof scripts.');
  console.log(output.join('\n'));
}

await main();
