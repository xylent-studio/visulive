import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const args = {
    db: path.join(workspaceRoot, 'captures', 'evidence-catalog.sqlite'),
    left: null,
    right: null,
    scenario: null,
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--db':
        args.db = path.resolve(workspaceRoot, argv[++index] ?? args.db);
        break;
      case '--left':
        args.left = argv[++index] ?? null;
        break;
      case '--right':
        args.right = argv[++index] ?? null;
        break;
      case '--scenario':
        args.scenario = argv[++index] ?? null;
        break;
      case '--json':
        args.json = true;
        break;
      default:
        break;
    }
  }

  return args;
}

function parseJsonArray(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseGateOutcomes(value) {
  return parseJsonArray(value).reduce((map, gate) => {
    if (gate && typeof gate.id === 'string') {
      map.set(gate.id, gate);
    }
    return map;
  }, new Map());
}

function parseCountMap(value) {
  const entries = parseJsonArray(value);
  if (entries.length > 0) {
    return entries.reduce((map, entry) => {
      if (entry && typeof entry.key === 'string' && typeof entry.value === 'number') {
        map.set(entry.key, entry.value);
      }
      return map;
    }, new Map());
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return new Map(
          Object.entries(parsed).map(([key, count]) => [key, Number(count) || 0])
        );
      }
    } catch {
      return new Map();
    }
  }

  return new Map();
}

function resolveScenarioRunIds(db, scenario) {
  const candidate = db
    .prepare(
      `
        SELECT run_id
        FROM runs
        WHERE lifecycle_state = 'reviewed-candidate'
          AND (derived_scenario = @scenario OR declared_scenario = @scenario OR proof_scenario_kind = @scenario)
        ORDER BY updated_at DESC, run_id DESC
        LIMIT 1
      `
    )
    .get({ scenario });
  const canonical = db
    .prepare(
      `
        SELECT run_id
        FROM runs
        WHERE lifecycle_state = 'canonical'
          AND (derived_scenario = @scenario OR declared_scenario = @scenario OR proof_scenario_kind = @scenario)
        ORDER BY updated_at DESC, run_id DESC
        LIMIT 1
      `
    )
    .get({ scenario });

  if (!candidate?.run_id || !canonical?.run_id) {
    throw new Error(
      `Could not resolve reviewed-candidate and canonical runs for scenario "${scenario}".`
    );
  }

  return {
    left: canonical.run_id,
    right: candidate.run_id
  };
}

function loadRunAggregate(db, runId) {
  const run = db.prepare('SELECT * FROM runs WHERE run_id = ?').get(runId);

  if (!run) {
    throw new Error(`Run "${runId}" was not found in the evidence catalog.`);
  }

  const clipAggregate = db
    .prepare(`
      SELECT
        COUNT(*) AS clip_count,
        AVG(overbright_rate) AS avg_overbright,
        AVG(world_dominance_mean) AS avg_world_dominance,
        AVG(chamber_presence_mean) AS avg_chamber_presence,
        AVG(hero_coverage_mean) AS avg_hero_coverage,
        AVG(ring_authority_mean) AS avg_ring_authority,
        SUM(CASE WHEN no_touch_window_passed = 1 THEN 1 ELSE 0 END) AS no_touch_clips,
        SUM(CASE WHEN scenario_validated = 1 THEN 1 ELSE 0 END) AS validated_clips
      FROM clips
      WHERE run_id = ?
    `)
    .get(runId);

  const recommendationAggregate = db
    .prepare(`
      SELECT
        COUNT(*) AS recommendation_count,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) AS high_count,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) AS medium_count,
        SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) AS low_count
      FROM recommendations
      WHERE run_id = ?
    `)
    .get(runId);

  const ownerLaneRows = db
    .prepare(`
      SELECT owner_lane, COUNT(*) AS count
      FROM recommendations
      WHERE run_id = ?
      GROUP BY owner_lane
      ORDER BY count DESC, owner_lane ASC
    `)
    .all(runId);

  return {
    run,
    clipAggregate,
    recommendationAggregate,
    ownerLaneRows,
    gateOutcomes: parseGateOutcomes(run.gate_outcomes_json),
    markerCounts: parseCountMap(run.marker_counts_json),
    stillCounts: parseCountMap(run.still_counts_json)
  };
}

function formatNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(3) : 'n/a';
}

function formatDelta(label, left, right) {
  const delta =
    typeof left === 'number' && typeof right === 'number'
      ? (right - left).toFixed(3)
      : 'n/a';

  return `- ${label}: ${left ?? 'n/a'} -> ${right ?? 'n/a'} (delta ${delta})`;
}

function formatStatusChange(label, left, right) {
  return `- ${label}: ${left ?? 'n/a'} -> ${right ?? 'n/a'}`;
}

function formatMapLines(label, leftMap, rightMap) {
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();
  if (keys.length === 0) {
    return [`- ${label}: none`];
  }

  return keys.map((key) => `- ${label} ${key}: ${leftMap.get(key) ?? 0} -> ${rightMap.get(key) ?? 0}`);
}

function formatGateLines(left, right) {
  const gateIds = [...new Set([...left.gateOutcomes.keys(), ...right.gateOutcomes.keys()])].sort();
  if (gateIds.length === 0) {
    return ['- No gate outcomes recorded.'];
  }

  return gateIds.map((gateId) => {
    const leftGate = left.gateOutcomes.get(gateId);
    const rightGate = right.gateOutcomes.get(gateId);
    return `- ${gateId}: ${leftGate?.status ?? 'n/a'} -> ${rightGate?.status ?? 'n/a'} | ${rightGate?.rationale ?? leftGate?.rationale ?? 'no rationale'}`;
  });
}

function buildMarkdown(leftRunId, rightRunId, left, right) {
  return [
    '# Evidence Run Compare',
    '',
    `- Left: ${leftRunId} (${left.run.lifecycle_state ?? 'unknown'} / ${left.run.build_commit ?? 'unknown'} / ${left.run.proof_scenario_kind ?? 'unassigned'})`,
    `- Right: ${rightRunId} (${right.run.lifecycle_state ?? 'unknown'} / ${right.run.build_commit ?? 'unknown'} / ${right.run.proof_scenario_kind ?? 'unassigned'})`,
    '',
    '## Run Posture',
    formatStatusChange('lifecycle', left.run.lifecycle_state, right.run.lifecycle_state),
    formatStatusChange(
      'proof verdict',
      left.run.current_proof_eligible ? 'current-proof-eligible' : left.run.proof_valid ? 'valid' : 'invalid/exploratory',
      right.run.current_proof_eligible ? 'current-proof-eligible' : right.run.proof_valid ? 'valid' : 'invalid/exploratory'
    ),
    formatDelta('invalidation count', left.run.invalidation_count, right.run.invalidation_count),
    formatDelta('intervention count', left.run.intervention_count, right.run.intervention_count),
    formatStatusChange('recovery guidance', left.run.recovery_guidance, right.run.recovery_guidance),
    '',
    '## Run Metrics',
    formatDelta('sample count', left.run.sample_count, right.run.sample_count),
    formatDelta('marker count', left.run.marker_count, right.run.marker_count),
    formatDelta('clip count', left.run.clip_count, right.run.clip_count),
    formatDelta('checkpoint still count', left.run.checkpoint_still_count, right.run.checkpoint_still_count),
    '',
    '## Clip Aggregates',
    formatDelta('average overbright', left.clipAggregate.avg_overbright, right.clipAggregate.avg_overbright),
    formatDelta('average world dominance', left.clipAggregate.avg_world_dominance, right.clipAggregate.avg_world_dominance),
    formatDelta('average chamber presence', left.clipAggregate.avg_chamber_presence, right.clipAggregate.avg_chamber_presence),
    formatDelta('average hero coverage', left.clipAggregate.avg_hero_coverage, right.clipAggregate.avg_hero_coverage),
    formatDelta('average ring authority', left.clipAggregate.avg_ring_authority, right.clipAggregate.avg_ring_authority),
    formatDelta('no-touch clips', left.clipAggregate.no_touch_clips, right.clipAggregate.no_touch_clips),
    formatDelta('validated clips', left.clipAggregate.validated_clips, right.clipAggregate.validated_clips),
    '',
    '## Gate Outcomes',
    ...formatGateLines(left, right),
    '',
    '## Marker Distribution',
    ...formatMapLines('marker', left.markerCounts, right.markerCounts),
    '',
    '## Still Distribution',
    ...formatMapLines('still', left.stillCounts, right.stillCounts),
    '',
    '## Recommendation Posture',
    formatDelta('recommendation count', left.recommendationAggregate.recommendation_count, right.recommendationAggregate.recommendation_count),
    formatDelta('critical recommendations', left.recommendationAggregate.critical_count, right.recommendationAggregate.critical_count),
    formatDelta('high recommendations', left.recommendationAggregate.high_count, right.recommendationAggregate.high_count),
    formatDelta('medium recommendations', left.recommendationAggregate.medium_count, right.recommendationAggregate.medium_count),
    formatDelta('low recommendations', left.recommendationAggregate.low_count, right.recommendationAggregate.low_count),
    ...formatMapLines(
      'owner lane',
      new Map(left.ownerLaneRows.map((row) => [row.owner_lane, row.count])),
      new Map(right.ownerLaneRows.map((row) => [row.owner_lane, row.count]))
    )
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = new DatabaseSync(args.db, { readonly: true });

  try {
    let leftRunId = args.left;
    let rightRunId = args.right;

    if ((!leftRunId || !rightRunId) && args.scenario) {
      const resolved = resolveScenarioRunIds(db, args.scenario);
      leftRunId = resolved.left;
      rightRunId = resolved.right;
    }

    if (!leftRunId || !rightRunId) {
      throw new Error(
        'compare-evidence requires --left <runId> and --right <runId>, or --scenario <scenario> to auto-resolve canonical vs reviewed-candidate runs.'
      );
    }

    const left = loadRunAggregate(db, leftRunId);
    const right = loadRunAggregate(db, rightRunId);

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            leftRunId,
            rightRunId,
            left,
            right
          },
          null,
          2
        )
      );
      return;
    }

    console.log(buildMarkdown(leftRunId, rightRunId, left, right));
  } finally {
    db.close();
  }
}

main();
