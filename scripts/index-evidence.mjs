import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  analyzeCaptureTargets,
  archiveRoot,
  canonicalRoot,
  collectRunArtifacts,
  inboxRoot,
  workspaceRoot
} from './capture-reporting.mjs';

function parseArgs(argv) {
  const args = {
    db: path.join(workspaceRoot, 'captures', 'evidence-catalog.sqlite'),
    targets: [inboxRoot, canonicalRoot, archiveRoot]
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    switch (value) {
      case '--db':
        args.db = path.resolve(workspaceRoot, argv[++index] ?? args.db);
        break;
      case '--target':
        args.targets.push(path.resolve(workspaceRoot, argv[++index] ?? ''));
        break;
      default:
        break;
    }
  }

  args.targets = [...new Set(args.targets.filter(Boolean))];
  return args;
}

function ensureSchema(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      journal_path TEXT,
      manifest_path TEXT,
      lifecycle_state TEXT,
      build_version TEXT,
      build_commit TEXT,
      build_built_at TEXT,
      build_lane TEXT,
      build_valid INTEGER,
      source_mode TEXT,
      source_label TEXT,
      show_start_route TEXT,
      resolved_route TEXT,
      proof_wave_armed INTEGER,
      proof_scenario_kind TEXT,
      proof_run_state TEXT,
      proof_mission_kind TEXT,
      proof_mission_label TEXT,
      proof_mission_locked_at TEXT,
      proof_mission_expected_route TEXT,
      proof_mission_expected_source TEXT,
      proof_mission_strict_no_touch INTEGER,
      proof_mission_duration_min_s REAL,
      proof_mission_duration_max_s REAL,
      proof_mission_eligibility_verdict TEXT,
      proof_mission_eligibility_current INTEGER,
      artifact_integrity_verdict TEXT,
      artifact_integrity_issues_json TEXT,
      declared_scenario TEXT,
      derived_scenario TEXT,
      scenario_validated INTEGER,
      scenario_confidence REAL,
      proof_ready INTEGER,
      proof_valid INTEGER,
      current_proof_eligible INTEGER,
      readiness_checks_json TEXT,
      invalidation_count INTEGER,
      invalidation_reasons_json TEXT,
      recovery_guidance TEXT,
      session_started_at TEXT,
      session_elapsed_ms REAL,
      intervention_count INTEGER,
      no_touch_window_passed INTEGER,
      sample_count INTEGER,
      marker_count INTEGER,
      marker_counts_json TEXT,
      clip_count INTEGER,
      checkpoint_still_count INTEGER,
      still_counts_json TEXT,
      review_note_path TEXT,
      recommendation_path TEXT,
      recommendation_count INTEGER,
      recommendation_issue_ids_json TEXT,
      gate_outcomes_json TEXT,
      dominant_signature_moment TEXT,
      dominant_signature_style TEXT,
      signature_moment_active_rate REAL,
      signature_moment_forced_preview_rate REAL,
      compositor_overprocess_risk_mean REAL,
      perceptual_washout_risk_mean REAL,
      perceptual_colorfulness_mean REAL,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS clips (
      file_path TEXT PRIMARY KEY,
      run_id TEXT,
      label TEXT,
      capture_mode TEXT,
      captured_at TEXT,
      trigger_kind TEXT,
      proof_scenario_kind TEXT,
      proof_mission_kind TEXT,
      proof_mission_label TEXT,
      proof_mission_eligibility_verdict TEXT,
      artifact_integrity_verdict TEXT,
      declared_scenario TEXT,
      derived_scenario TEXT,
      scenario_validated INTEGER,
      scenario_confidence REAL,
      build_commit TEXT,
      build_built_at TEXT,
      build_valid INTEGER,
      no_touch_window_passed INTEGER,
      intervention_count INTEGER,
      overbright_rate REAL,
      world_dominance_mean REAL,
      chamber_presence_mean REAL,
      ring_authority_mean REAL,
      hero_coverage_mean REAL,
      dominant_signature_moment TEXT,
      dominant_signature_style TEXT,
      signature_moment_active_rate REAL,
      signature_moment_forced_preview_rate REAL,
      compositor_overprocess_risk_mean REAL,
      perceptual_washout_risk_mean REAL,
      perceptual_colorfulness_mean REAL,
      quality_flags_json TEXT
    );
    CREATE TABLE IF NOT EXISTS stills (
      run_id TEXT,
      file_name TEXT,
      file_path TEXT,
      kind TEXT,
      timestamp_ms REAL,
      PRIMARY KEY (run_id, file_name)
    );
    CREATE TABLE IF NOT EXISTS recommendations (
      run_id TEXT,
      issue_id TEXT,
      severity TEXT,
      title TEXT,
      owner_lane TEXT,
      subsystem TEXT,
      suspected_cause TEXT,
      impacted_gates_json TEXT,
      target_metrics_json TEXT,
      recommended_next_scenario TEXT,
      confidence REAL,
      clip_files_json TEXT,
      still_files_json TEXT,
      PRIMARY KEY (run_id, issue_id)
    );
    DELETE FROM runs;
    DELETE FROM clips;
    DELETE FROM stills;
    DELETE FROM recommendations;
  `);

  for (const statement of [
    'ALTER TABLE runs ADD COLUMN build_built_at TEXT',
    'ALTER TABLE clips ADD COLUMN build_built_at TEXT',
    'ALTER TABLE runs ADD COLUMN proof_run_state TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_kind TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_label TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_locked_at TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_expected_route TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_expected_source TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_strict_no_touch INTEGER',
    'ALTER TABLE runs ADD COLUMN proof_mission_duration_min_s REAL',
    'ALTER TABLE runs ADD COLUMN proof_mission_duration_max_s REAL',
    'ALTER TABLE runs ADD COLUMN proof_mission_eligibility_verdict TEXT',
    'ALTER TABLE runs ADD COLUMN proof_mission_eligibility_current INTEGER',
    'ALTER TABLE runs ADD COLUMN artifact_integrity_verdict TEXT',
    'ALTER TABLE runs ADD COLUMN artifact_integrity_issues_json TEXT',
    'ALTER TABLE clips ADD COLUMN proof_mission_kind TEXT',
    'ALTER TABLE clips ADD COLUMN proof_mission_label TEXT',
    'ALTER TABLE clips ADD COLUMN proof_mission_eligibility_verdict TEXT',
    'ALTER TABLE clips ADD COLUMN artifact_integrity_verdict TEXT',
    'ALTER TABLE runs ADD COLUMN dominant_signature_moment TEXT',
    'ALTER TABLE runs ADD COLUMN dominant_signature_style TEXT',
    'ALTER TABLE runs ADD COLUMN signature_moment_active_rate REAL',
    'ALTER TABLE runs ADD COLUMN signature_moment_forced_preview_rate REAL',
    'ALTER TABLE runs ADD COLUMN compositor_overprocess_risk_mean REAL',
    'ALTER TABLE runs ADD COLUMN perceptual_washout_risk_mean REAL',
    'ALTER TABLE runs ADD COLUMN perceptual_colorfulness_mean REAL',
    'ALTER TABLE clips ADD COLUMN dominant_signature_moment TEXT',
    'ALTER TABLE clips ADD COLUMN dominant_signature_style TEXT',
    'ALTER TABLE clips ADD COLUMN signature_moment_active_rate REAL',
    'ALTER TABLE clips ADD COLUMN signature_moment_forced_preview_rate REAL',
    'ALTER TABLE clips ADD COLUMN compositor_overprocess_risk_mean REAL',
    'ALTER TABLE clips ADD COLUMN perceptual_washout_risk_mean REAL',
    'ALTER TABLE clips ADD COLUMN perceptual_colorfulness_mean REAL'
  ]) {
    try {
      db.exec(statement);
    } catch {
      // Existing local catalogs are rebuilt in place; ignore already-present columns.
    }
  }
}

function toInt(value) {
  return value ? 1 : 0;
}

function mean(values) {
  const numericValues = values.filter(
    (value) => typeof value === 'number' && Number.isFinite(value)
  );

  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function dominantCounterKey(counts, fallback = null) {
  let bestKey = fallback;
  let bestCount = 0;

  for (const [key, count] of counts.entries()) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }

  return bestKey;
}

function summarizeRunSignaturePosture(journal) {
  const samples = Array.isArray(journal?.samples) ? journal.samples : [];
  const momentCounts = new Map();
  const styleCounts = new Map();
  const forcedPreviewSamples = [];
  const compositorRiskSamples = [];
  const washoutSamples = [];
  const colorfulnessSamples = [];
  let activeSamples = 0;

  for (const sample of samples) {
    const signature = sample?.signatureMoment ?? {};
    const activeMoment =
      typeof signature.activeSignatureMoment === 'string'
        ? signature.activeSignatureMoment
        : 'none';

    if (activeMoment !== 'none') {
      activeSamples += 1;
      momentCounts.set(activeMoment, (momentCounts.get(activeMoment) ?? 0) + 1);

      const style =
        typeof signature.signatureMomentStyle === 'string'
          ? signature.signatureMomentStyle
          : 'contrast-mythic';
      styleCounts.set(style, (styleCounts.get(style) ?? 0) + 1);
    }

    forcedPreviewSamples.push(signature.signatureMomentForcedPreview === true ? 1 : 0);
    compositorRiskSamples.push(signature.compositorOverprocessRisk);
    washoutSamples.push(signature.perceptualWashoutRisk);
    colorfulnessSamples.push(signature.perceptualColorfulnessScore);
  }

  return {
    dominantSignatureMoment: dominantCounterKey(momentCounts, 'none'),
    dominantSignatureStyle: dominantCounterKey(styleCounts, null),
    signatureMomentActiveRate:
      samples.length > 0 ? activeSamples / samples.length : null,
    signatureMomentForcedPreviewRate: mean(forcedPreviewSamples),
    compositorOverprocessRiskMean: mean(compositorRiskSamples),
    perceptualWashoutRiskMean: mean(washoutSamples),
    perceptualColorfulnessMean: mean(colorfulnessSamples)
  };
}

function insertRuns(db, runArtifacts) {
  const groupedRuns = new Map();

  for (const entry of runArtifacts) {
    const metadata = entry?.artifact?.metadata ?? {};
    const runId = typeof metadata.runId === 'string' ? metadata.runId : null;
    if (!runId) {
      continue;
    }

    const current = groupedRuns.get(runId) ?? {
      runId,
      journal: null,
      journalPath: null,
      manifest: null,
      manifestPath: null,
      recommendation: null,
      recommendationPath: null
    };

    if (entry.artifactType === 'run-journal') {
      current.journal = entry.artifact;
      current.journalPath = entry.filePath;
    }

    if (entry.artifactType === 'run-manifest') {
      current.manifest = entry.artifact;
      current.manifestPath = entry.filePath;
    }

    if (entry.artifactType === 'run-recommendations') {
      current.recommendation = entry.artifact;
      current.recommendationPath = entry.filePath;
    }

    groupedRuns.set(runId, current);
  }

  const insertRun = db.prepare(`
    INSERT INTO runs (
      run_id, journal_path, manifest_path, build_version, build_commit, build_built_at, build_lane, build_valid,
      lifecycle_state, source_mode, source_label, show_start_route, resolved_route, proof_wave_armed,
      proof_scenario_kind, proof_run_state, proof_mission_kind, proof_mission_label,
      proof_mission_locked_at, proof_mission_expected_route, proof_mission_expected_source,
      proof_mission_strict_no_touch, proof_mission_duration_min_s, proof_mission_duration_max_s,
      proof_mission_eligibility_verdict, proof_mission_eligibility_current,
      artifact_integrity_verdict, artifact_integrity_issues_json,
      declared_scenario, derived_scenario, scenario_validated,
      scenario_confidence, proof_ready, proof_valid, current_proof_eligible, readiness_checks_json, invalidation_count,
      invalidation_reasons_json, recovery_guidance, session_started_at, session_elapsed_ms,
      intervention_count, no_touch_window_passed, sample_count, marker_count, marker_counts_json,
      clip_count, checkpoint_still_count, still_counts_json, review_note_path, recommendation_path,
      recommendation_count, recommendation_issue_ids_json, gate_outcomes_json,
      dominant_signature_moment, dominant_signature_style, signature_moment_active_rate,
      signature_moment_forced_preview_rate, compositor_overprocess_risk_mean,
      perceptual_washout_risk_mean, perceptual_colorfulness_mean, updated_at
    ) VALUES (
      @run_id, @journal_path, @manifest_path, @build_version, @build_commit, @build_built_at, @build_lane, @build_valid,
      @lifecycle_state, @source_mode, @source_label, @show_start_route, @resolved_route, @proof_wave_armed,
      @proof_scenario_kind, @proof_run_state, @proof_mission_kind, @proof_mission_label,
      @proof_mission_locked_at, @proof_mission_expected_route, @proof_mission_expected_source,
      @proof_mission_strict_no_touch, @proof_mission_duration_min_s, @proof_mission_duration_max_s,
      @proof_mission_eligibility_verdict, @proof_mission_eligibility_current,
      @artifact_integrity_verdict, @artifact_integrity_issues_json,
      @declared_scenario, @derived_scenario, @scenario_validated,
      @scenario_confidence, @proof_ready, @proof_valid, @current_proof_eligible, @readiness_checks_json, @invalidation_count,
      @invalidation_reasons_json, @recovery_guidance, @session_started_at, @session_elapsed_ms,
      @intervention_count, @no_touch_window_passed, @sample_count, @marker_count, @marker_counts_json,
      @clip_count, @checkpoint_still_count, @still_counts_json, @review_note_path, @recommendation_path,
      @recommendation_count, @recommendation_issue_ids_json, @gate_outcomes_json,
      @dominant_signature_moment, @dominant_signature_style, @signature_moment_active_rate,
      @signature_moment_forced_preview_rate, @compositor_overprocess_risk_mean,
      @perceptual_washout_risk_mean, @perceptual_colorfulness_mean, @updated_at
    )
  `);

  const insertStill = db.prepare(`
    INSERT INTO stills (run_id, file_name, file_path, kind, timestamp_ms)
    VALUES (@run_id, @file_name, @file_path, @kind, @timestamp_ms)
  `);

  for (const entry of groupedRuns.values()) {
    const metadata = entry.journal?.metadata ?? entry.manifest?.metadata ?? {};
    const scenarioAssessment = metadata.scenarioAssessment ?? {};
    const proofReadiness = metadata.proofReadiness ?? {};
    const proofValidity = metadata.proofValidity ?? {};
    const proofMission = metadata.proofMission ?? {};
    const proofMissionEligibility = metadata.proofMissionEligibility ?? {};
    const artifactIntegrity = metadata.artifactIntegrity ?? {};
    const currentProofEligible = proofMission.kind
      ? proofMissionEligibility.currentProofEligible === true
      : proofValidity.currentProofEligible === true;
    const signaturePosture = summarizeRunSignaturePosture(entry.journal);
    const markerCounts = Object.fromEntries(
      (entry.journal?.markers ?? []).reduce((counts, marker) => {
        const nextCount = counts.get(marker.kind) ?? 0;
        counts.set(marker.kind, nextCount + 1);
        return counts;
      }, new Map())
    );
    const stillCounts = Object.fromEntries(
      (entry.journal?.checkpointStills ?? []).reduce((counts, still) => {
        const nextCount = counts.get(still.kind) ?? 0;
        counts.set(still.kind, nextCount + 1);
        return counts;
      }, new Map())
    );
    const reviewNotePath =
      entry.manifest?.reviewNoteFileName && entry.manifestPath
        ? path.join(path.dirname(entry.manifestPath), entry.manifest.reviewNoteFileName)
        : null;
    const gateOutcomes = entry.recommendation?.metadata?.gateOutcomes ?? [];
    const readinessChecks = Array.isArray(proofReadiness.checks)
      ? proofReadiness.checks.map((check) => ({
          id: check.id,
          label: check.label,
          passed: check.passed,
          reason: check.reason,
          blocking: check.blocking
        }))
      : [];
    const recommendationIssueIds = Array.isArray(entry.recommendation?.recommendations)
      ? entry.recommendation.recommendations
          .map((recommendation) =>
            typeof recommendation?.issueId === 'string' ? recommendation.issueId : null
          )
          .filter(Boolean)
      : [];
    insertRun.run({
      run_id: entry.runId,
      journal_path: entry.journalPath,
      manifest_path: entry.manifestPath,
      build_version: metadata.buildInfo?.version ?? null,
      build_commit: metadata.buildInfo?.commit ?? null,
      build_built_at: metadata.buildInfo?.builtAt ?? null,
      build_lane: metadata.buildInfo?.lane ?? null,
      build_valid: toInt(metadata.buildInfo?.valid === true),
      lifecycle_state:
        metadata.lifecycleState ?? entry.recommendation?.metadata?.lifecycleState ?? 'inbox',
      source_mode: metadata.sourceMode ?? null,
      source_label: metadata.sourceLabel ?? null,
      show_start_route: metadata.showStartRoute ?? null,
      resolved_route: metadata.resolvedRoute ?? null,
      proof_wave_armed: toInt(metadata.proofWaveArmed === true),
      proof_scenario_kind: metadata.proofScenarioKind ?? null,
      proof_run_state: metadata.proofRunState ?? null,
      proof_mission_kind: proofMission.kind ?? null,
      proof_mission_label: proofMission.label ?? null,
      proof_mission_locked_at: proofMission.lockedAt ?? null,
      proof_mission_expected_route: proofMission.expectedRoute ?? null,
      proof_mission_expected_source: proofMission.expectedSourceMode ?? null,
      proof_mission_strict_no_touch: toInt(proofMission.strictNoTouch === true),
      proof_mission_duration_min_s:
        typeof proofMission.expectedDurationSeconds?.min === 'number'
          ? proofMission.expectedDurationSeconds.min
          : null,
      proof_mission_duration_max_s:
        typeof proofMission.expectedDurationSeconds?.max === 'number'
          ? proofMission.expectedDurationSeconds.max
          : null,
      proof_mission_eligibility_verdict:
        proofMissionEligibility.verdict ?? null,
      proof_mission_eligibility_current: toInt(
        proofMissionEligibility.currentProofEligible === true
      ),
      artifact_integrity_verdict: artifactIntegrity.verdict ?? null,
      artifact_integrity_issues_json: JSON.stringify(artifactIntegrity.issues ?? []),
      declared_scenario: scenarioAssessment.declaredScenario ?? null,
      derived_scenario: scenarioAssessment.derivedScenario ?? null,
      scenario_validated: toInt(scenarioAssessment.validated === true),
      scenario_confidence:
        typeof scenarioAssessment.confidence === 'number'
          ? scenarioAssessment.confidence
          : null,
      proof_ready: toInt(proofReadiness.ready === true),
      proof_valid: toInt(proofValidity.verdict === 'valid'),
      current_proof_eligible: toInt(currentProofEligible),
      readiness_checks_json: JSON.stringify(readinessChecks),
      invalidation_count: Array.isArray(proofValidity.invalidations)
        ? proofValidity.invalidations.length
        : 0,
      invalidation_reasons_json: JSON.stringify(
        Array.isArray(proofValidity.invalidations)
          ? proofValidity.invalidations.map((invalidation) => ({
              code: invalidation.code,
              reason: invalidation.reason,
              timestampMs: invalidation.timestampMs,
              recommendedDisposition: invalidation.recommendedDisposition
            }))
          : []
      ),
      recovery_guidance:
        typeof proofValidity.recoveryGuidance === 'string'
          ? proofValidity.recoveryGuidance
          : null,
      session_started_at: metadata.sessionStartedAt ?? null,
      session_elapsed_ms:
        typeof metadata.sessionElapsedMs === 'number'
          ? metadata.sessionElapsedMs
          : null,
      intervention_count:
        typeof metadata.interventionCount === 'number'
          ? metadata.interventionCount
          : null,
      no_touch_window_passed: toInt(metadata.noTouchWindowPassed === true),
      sample_count: entry.journal?.samples?.length ?? entry.manifest?.metadata?.sampleCount ?? 0,
      marker_count: entry.journal?.markers?.length ?? entry.manifest?.metadata?.markerCount ?? 0,
      marker_counts_json: JSON.stringify(markerCounts),
      clip_count: entry.journal?.clips?.length ?? entry.manifest?.metadata?.clipCount ?? 0,
      checkpoint_still_count:
        entry.journal?.checkpointStills?.length ?? 0,
      still_counts_json: JSON.stringify(stillCounts),
      review_note_path: reviewNotePath,
      recommendation_path: entry.recommendationPath,
      recommendation_count: entry.recommendation?.recommendations?.length ?? 0,
      recommendation_issue_ids_json: JSON.stringify(recommendationIssueIds),
      gate_outcomes_json: JSON.stringify(gateOutcomes),
      dominant_signature_moment: signaturePosture.dominantSignatureMoment,
      dominant_signature_style: signaturePosture.dominantSignatureStyle,
      signature_moment_active_rate: signaturePosture.signatureMomentActiveRate,
      signature_moment_forced_preview_rate:
        signaturePosture.signatureMomentForcedPreviewRate,
      compositor_overprocess_risk_mean:
        signaturePosture.compositorOverprocessRiskMean,
      perceptual_washout_risk_mean: signaturePosture.perceptualWashoutRiskMean,
      perceptual_colorfulness_mean:
        signaturePosture.perceptualColorfulnessMean,
      updated_at: metadata.updatedAt ?? metadata.createdAt ?? null
    });

    if (!entry.journal || !entry.journalPath) {
      continue;
    }

    const stillRoot = path.join(path.dirname(entry.journalPath), 'stills');
    for (const still of entry.journal.checkpointStills ?? []) {
      insertStill.run({
        run_id: entry.runId,
        file_name: still.fileName,
        file_path: path.join(stillRoot, still.fileName),
        kind: still.kind,
        timestamp_ms: still.timestampMs
      });
    }
  }
}

function insertRecommendations(db, runArtifacts) {
  const insertRecommendation = db.prepare(`
    INSERT INTO recommendations (
      run_id, issue_id, severity, title, owner_lane, subsystem, suspected_cause,
      impacted_gates_json, target_metrics_json, recommended_next_scenario,
      confidence, clip_files_json, still_files_json
    ) VALUES (
      @run_id, @issue_id, @severity, @title, @owner_lane, @subsystem, @suspected_cause,
      @impacted_gates_json, @target_metrics_json, @recommended_next_scenario,
      @confidence, @clip_files_json, @still_files_json
    )
  `);

  for (const entry of runArtifacts) {
    if (entry.artifactType !== 'run-recommendations') {
      continue;
    }

    const runId = entry.artifact?.metadata?.runId;

    if (typeof runId !== 'string') {
      continue;
    }

    for (const recommendation of entry.artifact?.recommendations ?? []) {
      insertRecommendation.run({
        run_id: runId,
        issue_id: recommendation.issueId,
        severity: recommendation.severity,
        title: recommendation.title,
        owner_lane: recommendation.ownerLane,
        subsystem: recommendation.subsystem,
        suspected_cause: recommendation.suspectedCause,
        impacted_gates_json: JSON.stringify(recommendation.impactedGates ?? []),
        target_metrics_json: JSON.stringify(recommendation.targetMetrics ?? []),
        recommended_next_scenario: recommendation.recommendedNextProofScenario ?? null,
        confidence:
          typeof recommendation.confidence === 'number'
            ? recommendation.confidence
            : null,
        clip_files_json: JSON.stringify(recommendation.evidence?.clipFiles ?? []),
        still_files_json: JSON.stringify(recommendation.evidence?.stillFiles ?? [])
      });
    }
  }
}

function insertClips(db, summaries) {
  const insertClip = db.prepare(`
    INSERT INTO clips (
      file_path, run_id, label, capture_mode, captured_at, trigger_kind, proof_scenario_kind,
      proof_mission_kind, proof_mission_label, proof_mission_eligibility_verdict,
      artifact_integrity_verdict,
      declared_scenario, derived_scenario, scenario_validated, scenario_confidence,
      build_commit, build_built_at, build_valid, no_touch_window_passed, intervention_count,
      overbright_rate, world_dominance_mean, chamber_presence_mean, ring_authority_mean,
      hero_coverage_mean, dominant_signature_moment, dominant_signature_style,
      signature_moment_active_rate, signature_moment_forced_preview_rate,
      compositor_overprocess_risk_mean, perceptual_washout_risk_mean,
      perceptual_colorfulness_mean, quality_flags_json
    ) VALUES (
      @file_path, @run_id, @label, @capture_mode, @captured_at, @trigger_kind, @proof_scenario_kind,
      @proof_mission_kind, @proof_mission_label, @proof_mission_eligibility_verdict,
      @artifact_integrity_verdict,
      @declared_scenario, @derived_scenario, @scenario_validated, @scenario_confidence,
      @build_commit, @build_built_at, @build_valid, @no_touch_window_passed, @intervention_count,
      @overbright_rate, @world_dominance_mean, @chamber_presence_mean, @ring_authority_mean,
      @hero_coverage_mean, @dominant_signature_moment, @dominant_signature_style,
      @signature_moment_active_rate, @signature_moment_forced_preview_rate,
      @compositor_overprocess_risk_mean, @perceptual_washout_risk_mean,
      @perceptual_colorfulness_mean, @quality_flags_json
    )
  `);

  for (const summary of summaries) {
    const metadata = summary?.metadata ?? {};
    const scenarioAssessment = metadata.scenarioAssessment ?? {};
    const proofMission = metadata.proofMission ?? {};

    insertClip.run({
      file_path: summary.filePath,
      run_id: metadata.runId ?? null,
      label: metadata.label ?? path.basename(summary.filePath),
      capture_mode: metadata.captureMode ?? 'manual',
      captured_at: metadata.capturedAt ?? null,
      trigger_kind: metadata.triggerKind ?? null,
      proof_scenario_kind: metadata.proofScenarioKind ?? null,
      proof_mission_kind: proofMission.kind ?? null,
      proof_mission_label: proofMission.label ?? null,
      proof_mission_eligibility_verdict:
        metadata.proofMissionEligibility?.verdict ?? null,
      artifact_integrity_verdict: metadata.artifactIntegrity?.verdict ?? null,
      declared_scenario: scenarioAssessment.declaredScenario ?? null,
      derived_scenario: scenarioAssessment.derivedScenario ?? null,
      scenario_validated: toInt(scenarioAssessment.validated === true),
      scenario_confidence:
        typeof scenarioAssessment.confidence === 'number'
          ? scenarioAssessment.confidence
          : null,
      build_commit: metadata.buildInfo?.commit ?? null,
      build_built_at: metadata.buildInfo?.builtAt ?? null,
      build_valid: toInt(metadata.buildInfo?.valid === true),
      no_touch_window_passed: toInt(metadata.noTouchWindowPassed === true),
      intervention_count:
        typeof metadata.interventionCount === 'number'
          ? metadata.interventionCount
          : null,
      overbright_rate: summary.visualSummary?.overbrightRate ?? null,
      world_dominance_mean:
        summary.visualSummary?.worldDominanceDeliveredMean ?? null,
      chamber_presence_mean:
        summary.visualSummary?.chamberPresenceMean ?? null,
      ring_authority_mean: summary.visualSummary?.ringAuthorityMean ?? null,
      hero_coverage_mean: summary.visualSummary?.heroCoverageMean ?? null,
      dominant_signature_moment:
        summary.visualSummary?.dominantSignatureMoment ?? null,
      dominant_signature_style:
        summary.visualSummary?.dominantSignatureMomentStyle ?? null,
      signature_moment_active_rate:
        summary.visualSummary?.signatureMomentActiveRate ?? null,
      signature_moment_forced_preview_rate:
        summary.visualSummary?.signatureMomentForcedPreviewRate ?? null,
      compositor_overprocess_risk_mean:
        summary.visualSummary?.compositorOverprocessRiskMean ?? null,
      perceptual_washout_risk_mean:
        summary.visualSummary?.perceptualWashoutRiskMean ?? null,
      perceptual_colorfulness_mean:
        summary.visualSummary?.perceptualColorfulnessMean ?? null,
      quality_flags_json: JSON.stringify(summary.qualityFlags ?? [])
    });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await fs.mkdir(path.dirname(args.db), { recursive: true });

  const runArtifacts = await collectRunArtifacts(args.targets);
  const summaries = await analyzeCaptureTargets(args.targets);
  const db = new DatabaseSync(args.db);

  try {
    ensureSchema(db);
    insertRuns(db, runArtifacts);
    insertClips(db, summaries);
    insertRecommendations(db, runArtifacts);
  } finally {
    db.close();
  }

  console.log(
    `Indexed ${runArtifacts.length} run artifact(s) and ${summaries.length} clip summary record(s) into ${path.relative(workspaceRoot, args.db)}.`
  );
}

await main();
