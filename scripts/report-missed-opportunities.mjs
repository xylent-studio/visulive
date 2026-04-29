import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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
  'quality-downgrade',
  'signature-moment-precharge',
  'signature-moment-peak',
  'signature-moment-residue'
]);
const SIGNATURE_MARKER_KINDS = new Set([
  'signature-moment-precharge',
  'signature-moment-peak',
  'signature-moment-residue'
]);
const MATCH_WINDOW_MS = 2_500;
const CLUSTER_GAP_MS = 5_000;
const DEFAULT_STILL_MATCH_WINDOW_MS = 1_500;
const SIGNATURE_STILL_MATCH_WINDOW_MS = 5_000;

function parseArgs(argv) {
  const args = {
    targets: [inboxRoot, canonicalRoot, archiveRoot],
    json: false,
    explicitTargets: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--target':
        args.explicitTargets.push(path.resolve(workspaceRoot, argv[++index] ?? ''));
        break;
      case '--json':
        args.json = true;
        break;
      default:
        break;
    }
  }

  args.targets = [
    ...new Set(
      (args.explicitTargets.length > 0 ? args.explicitTargets : args.targets).filter(Boolean)
    )
  ];
  delete args.explicitTargets;
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
        endMs: Math.max(...timestamps),
        triggerKind: summary?.metadata?.triggerKind ?? null,
        version: typeof parsed?.version === 'number' ? parsed.version : null
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
    endMs: triggerTimestampMs + halfWindowMs,
    triggerKind: summary?.metadata?.triggerKind ?? null,
    version: typeof summary?.metadata?.version === 'number' ? summary.metadata.version : null
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

function resolveExpectedEvidence(cluster) {
  switch (cluster.markerKind) {
    case 'governance-risk':
      return {
        severity: 'high',
        clipKinds: new Set(['governance-risk']),
        stillKinds: new Set(['safety']),
        label: 'governance-risk clip or safety still'
      };
    case 'quiet-beauty':
      return {
        severity: 'medium',
        clipKinds: new Set(['quiet-beauty']),
        stillKinds: new Set(['quiet']),
        label: 'quiet-beauty clip or quiet still'
      };
    case 'operator-trust-clear':
      return {
        severity: 'high',
        clipKinds: new Set(['operator-trust-clear']),
        stillKinds: new Set(['trust']),
        label: 'operator-trust clip or trust still'
      };
    case 'quality-downgrade':
      return {
        severity: 'high',
        clipKinds: new Set(['quality-downgrade']),
        stillKinds: new Set(['safety']),
        label: 'quality-downgrade clip or safety still'
      };
    case 'signature-moment-precharge':
    case 'signature-moment-peak':
    case 'signature-moment-residue':
      return {
        severity: cluster.markerKind === 'signature-moment-peak' ? 'high' : 'medium',
        clipKinds: new Set([cluster.markerKind]),
        stillKinds: new Set(['signature', 'signature-preview']),
        label: `${cluster.markerKind} clip or signature still`
      };
    case 'authority-turn':
    default:
      return {
        severity: 'medium',
        clipKinds: new Set(['authority-turn']),
        stillKinds: new Set(['authority']),
        label: 'authority-turn clip or authority still'
      };
  }
}

function clusterHasSavedEvidence(cluster, runClips = [], runStills = []) {
  const clusterStart = cluster.timestampMs - MATCH_WINDOW_MS;
  const clusterEnd = cluster.endTimestampMs + MATCH_WINDOW_MS;
  const expectedEvidence = resolveExpectedEvidence(cluster);
  const matchedClip = runClips.some(
    (clip) =>
      clip.endMs >= clusterStart &&
      clip.startMs <= clusterEnd &&
      (expectedEvidence.clipKinds.has(clip.triggerKind) ||
        (clip.triggerKind === null && (clip.version ?? 0) < 3))
  );

  if (matchedClip) {
    return {
      matched: true,
      expectedEvidence
    };
  }

  const stillMatchWindowMs = SIGNATURE_MARKER_KINDS.has(cluster.markerKind)
    ? SIGNATURE_STILL_MATCH_WINDOW_MS
    : DEFAULT_STILL_MATCH_WINDOW_MS;

  const matchedStill = runStills.some((still) => {
    const timestampMs = still?.timestampMs;
    return (
      typeof timestampMs === 'number' &&
      expectedEvidence.stillKinds.has(still?.kind) &&
      timestampMs >= cluster.timestampMs - stillMatchWindowMs &&
      timestampMs <= cluster.endTimestampMs + stillMatchWindowMs
    );
  });

  return {
    matched: matchedStill,
    expectedEvidence
  };
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
      const evidenceMatch = clusterHasSavedEvidence(cluster, runClips, runStills);
      if (!evidenceMatch.matched) {
        missed.push({
          runId,
          markerKind: cluster.markerKind,
          severity: evidenceMatch.expectedEvidence.severity,
          timestampMs: cluster.timestampMs,
          endTimestampMs: cluster.endTimestampMs,
          markerCount: cluster.markerCount,
          reason: cluster.reason,
          expectedEvidence: evidenceMatch.expectedEvidence.label,
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
          `- ${entry.runId} | ${entry.markerKind} [${entry.severity}] @ ${entry.timestampMs}-${entry.endTimestampMs}ms (${entry.markerCount} marker(s)) | expected ${entry.expectedEvidence} | ${entry.reason} | ${entry.journalPath}`
      )
    ].join('\n')
  );
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1] ?? '')).href) {
  await main();
}
