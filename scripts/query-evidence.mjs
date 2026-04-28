import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const workspaceRoot = process.cwd();

function parseArgs(argv) {
  const args = {
    db: path.join(workspaceRoot, 'captures', 'evidence-catalog.sqlite'),
    entity: 'clips',
    scenario: null,
    runId: null,
    afterCommit: null,
    noTouch: false,
    maxOverbright: null,
    minWorldDominance: null,
    minChamberPresence: null,
    qualityFlag: null,
    lifecycle: null,
    currentProof: false,
    ownerLane: null,
    issueId: null,
    limit: 20,
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--db':
        args.db = path.resolve(workspaceRoot, argv[++index] ?? args.db);
        break;
      case '--entity':
        args.entity = argv[++index] ?? args.entity;
        break;
      case '--runs':
        args.entity = 'runs';
        break;
      case '--recommendations':
        args.entity = 'recommendations';
        break;
      case '--scenario':
        args.scenario = argv[++index] ?? null;
        break;
      case '--run-id':
        args.runId = argv[++index] ?? null;
        break;
      case '--after-commit':
        args.afterCommit = argv[++index] ?? null;
        break;
      case '--no-touch':
        args.noTouch = true;
        break;
      case '--max-overbright':
        args.maxOverbright = Number.parseFloat(argv[++index] ?? '');
        break;
      case '--min-world-dominance':
        args.minWorldDominance = Number.parseFloat(argv[++index] ?? '');
        break;
      case '--min-chamber-presence':
        args.minChamberPresence = Number.parseFloat(argv[++index] ?? '');
        break;
      case '--quality-flag':
        args.qualityFlag = argv[++index] ?? null;
        break;
      case '--lifecycle':
        args.lifecycle = argv[++index] ?? null;
        break;
      case '--current-proof':
        args.currentProof = true;
        break;
      case '--owner-lane':
        args.ownerLane = argv[++index] ?? null;
        break;
      case '--issue-id':
        args.issueId = argv[++index] ?? null;
        break;
      case '--limit':
        args.limit = Math.max(1, Number.parseInt(argv[++index] ?? '20', 10) || 20);
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

function resolveCommitTimestamp(commit) {
  try {
    const output = execFileSync('git', ['show', '-s', '--format=%cI', commit], {
      cwd: workspaceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    if (output.length > 0 && Number.isFinite(Date.parse(output))) {
      return output;
    }
  } catch {
    // Fall through to the explicit error below.
  }

  throw new Error(
    `Could not resolve commit timestamp for "${commit}". Use a commit reachable from this repository.`
  );
}

function buildQueryParameters(args) {
  return {
    afterCommitBuiltAt: args.afterCommit ? resolveCommitTimestamp(args.afterCommit) : null
  };
}

function buildClipsQuery(args, resolved) {
  const clauses = [];
  const parameters = {};

  if (args.scenario) {
    clauses.push(
      '(clips.derived_scenario = @scenario OR clips.proof_scenario_kind = @scenario OR clips.proof_mission_kind = @scenario OR runs.derived_scenario = @scenario OR runs.proof_mission_kind = @scenario)'
    );
    parameters.scenario = args.scenario;
  }

  if (args.runId) {
    clauses.push('clips.run_id = @runId');
    parameters.runId = args.runId;
  }

  if (args.afterCommit) {
    clauses.push('clips.build_built_at >= @afterCommitBuiltAt');
    parameters.afterCommitBuiltAt = resolved.afterCommitBuiltAt;
  }

  if (args.noTouch) {
    clauses.push('clips.no_touch_window_passed = 1');
  }

  if (Number.isFinite(args.maxOverbright)) {
    clauses.push('clips.overbright_rate <= @maxOverbright');
    parameters.maxOverbright = args.maxOverbright;
  }

  if (Number.isFinite(args.minWorldDominance)) {
    clauses.push('clips.world_dominance_mean >= @minWorldDominance');
    parameters.minWorldDominance = args.minWorldDominance;
  }

  if (Number.isFinite(args.minChamberPresence)) {
    clauses.push('clips.chamber_presence_mean >= @minChamberPresence');
    parameters.minChamberPresence = args.minChamberPresence;
  }

  if (args.qualityFlag) {
    clauses.push('clips.quality_flags_json LIKE @qualityFlag');
    parameters.qualityFlag = `%${args.qualityFlag}%`;
  }

  if (args.lifecycle) {
    clauses.push('runs.lifecycle_state = @lifecycle');
    parameters.lifecycle = args.lifecycle;
  }

  if (args.currentProof) {
    clauses.push('runs.current_proof_eligible = 1');
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return {
    sql: `
      SELECT
        clips.file_path,
        clips.run_id,
        clips.label,
        clips.capture_mode,
        clips.captured_at,
        clips.trigger_kind,
        clips.proof_scenario_kind,
        clips.proof_mission_kind,
        clips.proof_mission_label,
        clips.proof_mission_eligibility_verdict,
        clips.artifact_integrity_verdict,
        clips.derived_scenario,
        clips.scenario_validated,
        clips.build_commit,
        clips.build_built_at,
        clips.build_valid,
        clips.no_touch_window_passed,
        clips.overbright_rate,
        clips.world_dominance_mean,
        clips.chamber_presence_mean,
        clips.ring_authority_mean,
        clips.hero_coverage_mean,
        clips.quality_flags_json,
        runs.lifecycle_state,
        runs.current_proof_eligible,
        runs.proof_wave_armed
      FROM clips
      LEFT JOIN runs ON runs.run_id = clips.run_id
      ${where}
      ORDER BY clips.captured_at DESC, clips.file_path DESC
      LIMIT @limit
    `,
    parameters: {
      ...parameters,
      limit: args.limit
    }
  };
}

function buildRunsQuery(args, resolved) {
  const clauses = [];
  const parameters = {};

  if (args.scenario) {
    clauses.push(
      '(runs.derived_scenario = @scenario OR runs.declared_scenario = @scenario OR runs.proof_scenario_kind = @scenario OR runs.proof_mission_kind = @scenario)'
    );
    parameters.scenario = args.scenario;
  }

  if (args.runId) {
    clauses.push('runs.run_id = @runId');
    parameters.runId = args.runId;
  }

  if (args.afterCommit) {
    clauses.push('runs.build_built_at >= @afterCommitBuiltAt');
    parameters.afterCommitBuiltAt = resolved.afterCommitBuiltAt;
  }

  if (args.noTouch) {
    clauses.push('runs.no_touch_window_passed = 1');
  }

  if (args.lifecycle) {
    clauses.push('runs.lifecycle_state = @lifecycle');
    parameters.lifecycle = args.lifecycle;
  }

  if (args.currentProof) {
    clauses.push('runs.current_proof_eligible = 1');
  }

  if (Number.isFinite(args.minWorldDominance)) {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM clips
        WHERE clips.run_id = runs.run_id
          AND clips.world_dominance_mean >= @minWorldDominance
      )
    `);
    parameters.minWorldDominance = args.minWorldDominance;
  }

  if (Number.isFinite(args.minChamberPresence)) {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM clips
        WHERE clips.run_id = runs.run_id
          AND clips.chamber_presence_mean >= @minChamberPresence
      )
    `);
    parameters.minChamberPresence = args.minChamberPresence;
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return {
    sql: `
      SELECT
        runs.run_id,
        runs.lifecycle_state,
        runs.build_commit,
        runs.build_built_at,
        runs.build_lane,
        runs.proof_scenario_kind,
        runs.proof_run_state,
        runs.proof_mission_kind,
        runs.proof_mission_label,
        runs.proof_mission_eligibility_verdict,
        runs.proof_mission_eligibility_current,
        runs.artifact_integrity_verdict,
        runs.declared_scenario,
        runs.derived_scenario,
        runs.scenario_validated,
        runs.proof_ready,
        runs.proof_valid,
        runs.current_proof_eligible,
        runs.invalidation_count,
        runs.recovery_guidance,
        runs.no_touch_window_passed,
        runs.intervention_count,
        runs.sample_count,
        runs.marker_count,
        runs.clip_count,
        runs.checkpoint_still_count,
        runs.recommendation_count,
        runs.recommendation_issue_ids_json,
        runs.gate_outcomes_json,
        runs.updated_at
      FROM runs
      ${where}
      ORDER BY runs.updated_at DESC, runs.run_id DESC
      LIMIT @limit
    `,
    parameters: {
      ...parameters,
      limit: args.limit
    }
  };
}

function buildRecommendationsQuery(args, resolved) {
  const clauses = [];
  const parameters = {};

  if (args.ownerLane) {
    clauses.push('recommendations.owner_lane = @ownerLane');
    parameters.ownerLane = args.ownerLane;
  }

  if (args.issueId) {
    clauses.push('recommendations.issue_id = @issueId');
    parameters.issueId = args.issueId;
  }

  if (args.runId) {
    clauses.push('recommendations.run_id = @runId');
    parameters.runId = args.runId;
  }

  if (args.scenario) {
    clauses.push(
      '(runs.derived_scenario = @scenario OR runs.declared_scenario = @scenario OR runs.proof_scenario_kind = @scenario OR runs.proof_mission_kind = @scenario)'
    );
    parameters.scenario = args.scenario;
  }

  if (args.lifecycle) {
    clauses.push('runs.lifecycle_state = @lifecycle');
    parameters.lifecycle = args.lifecycle;
  }

  if (args.afterCommit) {
    clauses.push('runs.build_built_at >= @afterCommitBuiltAt');
    parameters.afterCommitBuiltAt = resolved.afterCommitBuiltAt;
  }

  if (args.currentProof) {
    clauses.push('runs.current_proof_eligible = 1');
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return {
    sql: `
      SELECT
        recommendations.run_id,
        recommendations.issue_id,
        recommendations.severity,
        recommendations.title,
        recommendations.owner_lane,
        recommendations.subsystem,
        recommendations.suspected_cause,
        recommendations.impacted_gates_json,
        recommendations.target_metrics_json,
        recommendations.recommended_next_scenario,
        recommendations.confidence,
        recommendations.clip_files_json,
        recommendations.still_files_json,
        runs.lifecycle_state,
        runs.build_commit,
        runs.build_built_at,
        runs.proof_scenario_kind,
        runs.proof_mission_kind,
        runs.proof_mission_eligibility_verdict,
        runs.artifact_integrity_verdict,
        runs.current_proof_eligible
      FROM recommendations
      LEFT JOIN runs ON runs.run_id = recommendations.run_id
      ${where}
      ORDER BY recommendations.confidence DESC, recommendations.run_id DESC, recommendations.issue_id ASC
      LIMIT @limit
    `,
    parameters: {
      ...parameters,
      limit: args.limit
    }
  };
}

function buildQuery(args, resolved) {
  if (args.entity === 'runs') {
    return buildRunsQuery(args, resolved);
  }

  if (args.entity === 'recommendations') {
    return buildRecommendationsQuery(args, resolved);
  }

  return buildClipsQuery(args, resolved);
}

function formatClipRow(row) {
  return [
    `- ${row.label} (${row.capture_mode}, ${row.trigger_kind ?? 'manual'})`,
    `  - file: ${row.file_path}`,
    `  - run: ${row.run_id ?? 'none'} | lifecycle: ${row.lifecycle_state ?? 'unknown'} | build: ${row.build_commit ?? 'unknown'} @ ${row.build_built_at ?? 'unknown'} (${row.build_valid ? 'valid' : 'invalid'})`,
    `  - scenario: ${row.derived_scenario ?? row.proof_scenario_kind ?? 'unassigned'} (${row.scenario_validated ? 'validated' : 'pending/mismatch'}) | mission: ${row.proof_mission_label ?? row.proof_mission_kind ?? 'none'}`,
    `  - eligibility/integrity: ${row.proof_mission_eligibility_verdict ?? 'pending'} / ${row.artifact_integrity_verdict ?? 'pending'}`,
    `  - no-touch: ${row.no_touch_window_passed ? 'yes' : 'no'} | proof wave: ${row.proof_wave_armed ? 'armed' : 'off'} | current-proof: ${row.current_proof_eligible ? 'yes' : 'no'}`,
    `  - world/chamber/overbright/hero/ring: ${row.world_dominance_mean ?? 'n/a'} / ${row.chamber_presence_mean ?? 'n/a'} / ${row.overbright_rate ?? 'n/a'} / ${row.hero_coverage_mean ?? 'n/a'} / ${row.ring_authority_mean ?? 'n/a'}`,
    `  - flags: ${row.quality_flags_json ?? '[]'}`
  ].join('\n');
}

function formatRunRow(row) {
  return [
    `- ${row.run_id} (${row.lifecycle_state ?? 'unknown'})`,
    `  - build: ${row.build_commit ?? 'unknown'} / ${row.build_lane ?? 'unknown'} / ${row.build_built_at ?? 'unknown'} | scenario: ${row.derived_scenario ?? row.proof_scenario_kind ?? 'unassigned'}`,
    `  - mission: ${row.proof_mission_label ?? row.proof_mission_kind ?? 'none'} | state=${row.proof_run_state ?? 'legacy'} | eligibility=${row.proof_mission_eligibility_verdict ?? 'pending'} | integrity=${row.artifact_integrity_verdict ?? 'pending'}`,
    `  - proof: ready=${row.proof_ready ? 'yes' : 'no'} valid=${row.proof_valid ? 'yes' : 'no'} current=${row.current_proof_eligible ? 'yes' : 'no'}`,
    `  - no-touch/interventions: ${row.no_touch_window_passed ? 'pass' : 'no'} / ${row.intervention_count ?? 0}`,
    `  - samples/markers/clips/stills: ${row.sample_count ?? 0} / ${row.marker_count ?? 0} / ${row.clip_count ?? 0} / ${row.checkpoint_still_count ?? 0}`,
    `  - recommendations: ${row.recommendation_count ?? 0} | invalidations: ${row.invalidation_count ?? 0}`,
    `  - recovery: ${row.recovery_guidance ?? 'none'}`,
    `  - issues: ${row.recommendation_issue_ids_json ?? '[]'}`
  ].join('\n');
}

function formatRecommendationRow(row) {
  return [
    `- ${row.issue_id} [${row.severity}] ${row.title}`,
    `  - run: ${row.run_id} | lifecycle: ${row.lifecycle_state ?? 'unknown'} | build: ${row.build_commit ?? 'unknown'} @ ${row.build_built_at ?? 'unknown'} | current-proof: ${row.current_proof_eligible ? 'yes' : 'no'}`,
    `  - owner lane: ${row.owner_lane} | subsystem: ${row.subsystem}`,
    `  - scenario: ${row.proof_scenario_kind ?? 'unassigned'} | mission: ${row.proof_mission_kind ?? 'none'} (${row.proof_mission_eligibility_verdict ?? 'pending'} / ${row.artifact_integrity_verdict ?? 'pending'}) | next proof: ${row.recommended_next_scenario ?? 'none'}`,
    `  - confidence: ${row.confidence ?? 'n/a'} | impacted gates: ${row.impacted_gates_json ?? '[]'}`,
    `  - cause: ${row.suspected_cause}`,
    `  - clips: ${row.clip_files_json ?? '[]'} | stills: ${row.still_files_json ?? '[]'}`
  ].join('\n');
}

function formatRows(entity, rows) {
  if (entity === 'runs') {
    return rows.map(formatRunRow).join('\n');
  }

  if (entity === 'recommendations') {
    return rows.map(formatRecommendationRow).join('\n');
  }

  return rows.map(formatClipRow).join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const resolved = buildQueryParameters(args);
  const db = new DatabaseSync(args.db, { readonly: true });

  try {
    const { sql, parameters } = buildQuery(args, resolved);
    const rows = db.prepare(sql).all(parameters);

    if (args.json) {
      console.log(JSON.stringify(rows, null, 2));
      return;
    }

    if (rows.length === 0) {
      console.log('No evidence rows matched the requested filters.');
      return;
    }

    console.log(formatRows(args.entity, rows));
  } finally {
    db.close();
  }
}

main();
