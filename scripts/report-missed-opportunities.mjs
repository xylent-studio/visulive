import fs from 'node:fs/promises';
import path from 'node:path';
import {
  analyzeCaptureTargets,
  archiveRoot,
  canonicalRoot,
  collectRunArtifacts,
  inboxRoot,
  workspaceRoot
} from './capture-reporting.mjs';

const MISSABLE_MARKER_KINDS = new Set([
  'authority-turn',
  'governance-risk',
  'quiet-beauty',
  'operator-trust-clear',
  'quality-downgrade'
]);
const MATCH_WINDOW_MS = 2_500;
const CLUSTER_GAP_MS = 5_000;
const STILL_MATCH_WINDOW_MS = 1_500;

function parseArgs(argv) {
  const args = {
    targets: [inboxRoot, canonicalRoot, archiveRoot],
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--target':
        args.targets.push(path.resolve(workspaceRoot, argv[++index] ?? ''));
        break;
      case '--json':
        args.json = true;
        break;
      default:
        break;
    }
  }

  args.targets = [...new Set(args.targets.filter(Boolean))];
  return args;
}

async function resolveClipCoverage(summary) {
  const triggerTimestampMs = summary?.metadata?.triggerTimestampMs;

  try {
    const raw = await fs.readFile(summary.filePath, 'utf8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
    const timestamps = (Array.isArray(parsed?.frames) ? parsed.frames : [])
      .map((frame) => frame?.timestampMs)
      .filter((value) => typeof value === 'number' && Number.isFinite(value));

    if (timestamps.length > 0) {
      return {
        startMs: Math.min(...timestamps),
        endMs: Math.max(...timestamps)
      };
    }
  } catch {
    // Fall back to summary metadata below.
  }

  if (typeof triggerTimestampMs !== 'number' || !Number.isFinite(triggerTimestampMs)) {
    return null;
  }

  const halfWindowMs =
    typeof summary?.durationMs === 'number' && Number.isFinite(summary.durationMs)
      ? Math.max(MATCH_WINDOW_MS, summary.durationMs / 2)
      : MATCH_WINDOW_MS;

  return {
    startMs: triggerTimestampMs - halfWindowMs,
    endMs: triggerTimestampMs + halfWindowMs
  };
}

async function resolveClipCoverageByRunId(summaries = []) {
  const clipsByRunId = new Map();

  for (const summary of summaries) {
    const runId = summary?.metadata?.runId;
    if (typeof runId !== 'string') {
      continue;
    }

    const coverage = await resolveClipCoverage(summary);
    if (!coverage) {
      continue;
    }

    const current = clipsByRunId.get(runId) ?? [];
    current.push(coverage);
    clipsByRunId.set(runId, current);
  }

  return clipsByRunId;
}

function clusterMissableMarkers(markers = []) {
  const clusters = [];
  const markersByKind = new Map();

  for (const marker of markers) {
    if (!MISSABLE_MARKER_KINDS.has(marker.kind)) {
      continue;
    }

    const current = markersByKind.get(marker.kind) ?? [];
    current.push(marker);
    markersByKind.set(marker.kind, current);
  }

  for (const [kind, kindMarkers] of markersByKind.entries()) {
    const sortedMarkers = kindMarkers
      .filter((marker) => typeof marker.timestampMs === 'number')
      .sort((left, right) => left.timestampMs - right.timestampMs);
    let activeCluster = null;

    for (const marker of sortedMarkers) {
      if (
        !activeCluster ||
        marker.timestampMs - activeCluster.endTimestampMs > CLUSTER_GAP_MS
      ) {
        activeCluster = {
          markerKind: kind,
          timestampMs: marker.timestampMs,
          endTimestampMs: marker.timestampMs,
          reason: marker.reason,
          markerCount: 1
        };
        clusters.push(activeCluster);
        continue;
      }

      activeCluster.endTimestampMs = marker.timestampMs;
      activeCluster.markerCount += 1;
    }
  }

  return clusters.sort((left, right) => left.timestampMs - right.timestampMs);
}

function clusterHasSavedEvidence(cluster, runClips = [], runStills = []) {
  const clusterStart = cluster.timestampMs - MATCH_WINDOW_MS;
  const clusterEnd = cluster.endTimestampMs + MATCH_WINDOW_MS;
  const matchedClip = runClips.some(
    (clip) => clip.endMs >= clusterStart && clip.startMs <= clusterEnd
  );

  if (matchedClip) {
    return true;
  }

  return runStills.some((still) => {
    const timestampMs = still?.timestampMs;
    return (
      typeof timestampMs === 'number' &&
      timestampMs >= cluster.timestampMs - STILL_MATCH_WINDOW_MS &&
      timestampMs <= cluster.endTimestampMs + STILL_MATCH_WINDOW_MS
    );
  });
}

export async function collectMissedCaptureOpportunities(targets = [inboxRoot, canonicalRoot, archiveRoot]) {
  const runArtifacts = await collectRunArtifacts(targets);
  const summaries = await analyzeCaptureTargets(targets);
  const clipsByRunId = await resolveClipCoverageByRunId(summaries);

  const missed = [];

  for (const entry of runArtifacts) {
    if (entry.artifactType !== 'run-journal') {
      continue;
    }

    const journal = entry.artifact;
    const runId = journal?.metadata?.runId;
    if (typeof runId !== 'string') {
      continue;
    }

    const runClips = clipsByRunId.get(runId) ?? [];
    const runStills = Array.isArray(journal.checkpointStills)
      ? journal.checkpointStills
      : [];
    const clusters = clusterMissableMarkers(journal.markers ?? []);

    for (const cluster of clusters) {
      if (!clusterHasSavedEvidence(cluster, runClips, runStills)) {
        missed.push({
          runId,
          markerKind: cluster.markerKind,
          timestampMs: cluster.timestampMs,
          endTimestampMs: cluster.endTimestampMs,
          markerCount: cluster.markerCount,
          reason: cluster.reason,
          journalPath: entry.filePath
        });
      }
    }
  }

  return missed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const missed = await collectMissedCaptureOpportunities(args.targets);

  if (args.json) {
    console.log(JSON.stringify(missed, null, 2));
    return;
  }

  if (missed.length === 0) {
    console.log('No missed capture opportunities were detected in the indexed run journals.');
    return;
  }

  console.log(
    [
      '# Missed Capture Opportunities',
      '',
      ...missed.map(
        (entry) =>
          `- ${entry.runId} | ${entry.markerKind} @ ${entry.timestampMs}-${entry.endTimestampMs}ms (${entry.markerCount} marker(s)) | ${entry.reason} | ${entry.journalPath}`
      )
    ].join('\n')
  );
}

await main();
