#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_HINT_IDS = [
  'lowImpactCandidate',
  'subSustain',
  'bassBodySupport',
  'percussiveSnap',
  'airMotion',
  'speechPresenceCandidate',
  'highSweepCandidate',
  'tonalLift',
  'silenceAir',
  'broadbandHit'
];

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: npm run source-hint:lab -- [capture-or-folder ...]');
  console.log('Reads replay capture JSON and summarizes recorded source-hint diagnostics.');
  process.exit(0);
}
const targets = args.length > 0 ? args : ['captures/inbox/runs'];

async function main() {
  const files = [];
  for (const target of targets) {
    files.push(...(await collectJsonFiles(path.resolve(process.cwd(), target))));
  }

  const summaries = [];
  for (const filePath of files) {
    const summary = await summarizeCaptureFile(filePath);
    if (summary) {
      summaries.push(summary);
    }
  }

  const recorded = summaries.filter((summary) => summary.hintFrames > 0);
  const totalFrames = summaries.reduce((sum, summary) => sum + summary.frames, 0);
  const hintFrames = summaries.reduce((sum, summary) => sum + summary.hintFrames, 0);
  const hintTotals = Object.fromEntries(SOURCE_HINT_IDS.map((id) => [id, 0]));
  for (const summary of summaries) {
    for (const [id, value] of Object.entries(summary.hintPeaks)) {
      hintTotals[id] = Math.max(hintTotals[id] ?? 0, value);
    }
  }

  console.log('Source Hint Lab');
  console.log(`files=${summaries.length} recorded=${recorded.length}`);
  console.log(`frames=${totalFrames} hintFrames=${hintFrames}`);
  console.log(`coverage=${totalFrames > 0 ? (hintFrames / totalFrames).toFixed(3) : '0.000'}`);
  console.log(
    `hintPeaks=${Object.entries(hintTotals)
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1])
      .map(([id, value]) => `${id}:${value.toFixed(3)}`)
      .join(' ') || 'none'}`
  );
}

async function collectJsonFiles(target) {
  const stat = await fs.stat(target).catch(() => null);
  if (!stat) {
    return [];
  }
  if (stat.isFile()) {
    return target.endsWith('.json') ? [target] : [];
  }

  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function summarizeCaptureFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8').catch(() => null);
  if (!raw) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed.frames)) {
    return null;
  }

  const hintPeaks = Object.fromEntries(SOURCE_HINT_IDS.map((id) => [id, 0]));
  let hintFrames = 0;
  for (const frame of parsed.frames) {
    const hints = frame?.diagnostics?.sourceHintFrame?.hints;
    if (!Array.isArray(hints)) {
      continue;
    }
    hintFrames += 1;
    for (const hint of hints) {
      if (!SOURCE_HINT_IDS.includes(hint?.id)) {
        continue;
      }
      const signal = finiteNumber(hint.value) * finiteNumber(hint.confidence);
      hintPeaks[hint.id] = Math.max(hintPeaks[hint.id], signal);
    }
  }

  return {
    filePath,
    frames: parsed.frames.length,
    hintFrames,
    hintPeaks
  };
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
