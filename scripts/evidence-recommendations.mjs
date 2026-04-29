import path from 'node:path';

function average(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function uniqueCount(values = []) {
  return new Set(values.filter((value) => typeof value === 'string' && value.length > 0)).size;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

const TASTE_THRESHOLDS = {
  perceptualWashoutPassMax: 0.08,
  perceptualWashoutWarnMax: 0.14,
  colorfulnessPassMin: 0.09,
  colorfulnessWarnMin: 0.055,
  chamberPassMin: 0.16,
  chamberWarnMin: 0.12,
  legacyGlowSpendPassMax: 0.35,
  legacyGlowSpendWarnMax: 0.95
};

function collectRunMetrics(summaries = []) {
  const overbrightRates = [];
  const perceptualWashoutRisks = [];
  const perceptualColorfulness = [];
  const compositorOverprocessRisks = [];
  const heroCoverage = [];
  const worldDominance = [];
  const chamberPresence = [];
  const ringAuthority = [];
  const cueClasses = [];
  const families = [];
  const quietCaptures = [];
  const flagCounts = new Map();
  let buildIdentityValidCount = 0;
  let scenarioValidatedCount = 0;

  for (const summary of summaries) {
    const visual = summary?.visualSummary ?? {};
    const metadata = summary?.metadata ?? {};

    if (typeof visual.overbrightRate === 'number') {
      overbrightRates.push(visual.overbrightRate);
    }

    if (typeof visual.perceptualWashoutRiskMean === 'number') {
      perceptualWashoutRisks.push(visual.perceptualWashoutRiskMean);
    }

    if (typeof visual.perceptualColorfulnessMean === 'number') {
      perceptualColorfulness.push(visual.perceptualColorfulnessMean);
    }

    if (typeof visual.compositorOverprocessRiskMean === 'number') {
      compositorOverprocessRisks.push(visual.compositorOverprocessRiskMean);
    }

    if (typeof visual.heroCoverageMean === 'number') {
      heroCoverage.push(visual.heroCoverageMean);
    }

    if (typeof visual.worldDominanceDeliveredMean === 'number') {
      worldDominance.push(visual.worldDominanceDeliveredMean);
    }

    if (typeof visual.chamberPresenceMean === 'number') {
      chamberPresence.push(visual.chamberPresenceMean);
    }

    if (typeof visual.ringAuthorityMean === 'number') {
      ringAuthority.push(visual.ringAuthorityMean);
    }

    if (typeof visual.dominantCanonicalCueClass === 'string') {
      cueClasses.push(visual.dominantCanonicalCueClass);
    } else if (typeof visual.dominantStageCueFamily === 'string') {
      cueClasses.push(visual.dominantStageCueFamily);
    }

    if (typeof visual.dominantShowFamily === 'string') {
      families.push(visual.dominantShowFamily);
    }

    if (
      visual.dominantPerformanceRegime === 'silence-beauty' ||
      visual.dominantPerformanceRegime === 'room-floor' ||
      visual.dominantPerformanceRegime === 'suspense'
    ) {
      quietCaptures.push(summary);
    }

    if (metadata?.buildInfo?.valid === true) {
      buildIdentityValidCount += 1;
    }

    if (!metadata?.scenarioAssessment || metadata.scenarioAssessment.validated === true) {
      scenarioValidatedCount += 1;
    }

    for (const flag of summary?.qualityFlags ?? []) {
      flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
    }
  }

  return {
    clipCount: summaries.length,
    averageOverbrightRate: average(overbrightRates),
    averagePerceptualWashoutRisk: average(perceptualWashoutRisks),
    averagePerceptualColorfulness: average(perceptualColorfulness),
    averageCompositorOverprocessRisk: average(compositorOverprocessRisks),
    perceptualWashoutSampleCount: perceptualWashoutRisks.length,
    perceptualColorfulnessSampleCount: perceptualColorfulness.length,
    compositorOverprocessSampleCount: compositorOverprocessRisks.length,
    averageHeroCoverage: average(heroCoverage),
    averageWorldDominance: average(worldDominance),
    averageChamberPresence: average(chamberPresence),
    averageRingAuthority: average(ringAuthority),
    cueClassCount: uniqueCount(cueClasses),
    familyCount: uniqueCount(families),
    quietCaptureCount: quietCaptures.length,
    buildIdentityValidCount,
    scenarioValidatedCount,
    flagCounts
  };
}

function countInvalidations(journal) {
  return journal?.metadata?.proofValidity?.invalidations ?? [];
}

function buildGateOutcomes({ journal, summaries, missedEntries = [] }) {
  const metrics = collectRunMetrics(summaries);
  const invalidations = countInvalidations(journal);
  const proofValidity = journal?.metadata?.proofValidity;
  const noTouch = journal?.metadata?.noTouchWindowPassed === true;
  const interventions = journal?.metadata?.interventionCount ?? 0;
  const hasPerceptualTaste =
    metrics.perceptualWashoutSampleCount > 0 &&
    metrics.perceptualColorfulnessSampleCount > 0;
  const tastePass =
    summaries.length > 0 &&
    hasPerceptualTaste &&
    metrics.averagePerceptualWashoutRisk <=
      TASTE_THRESHOLDS.perceptualWashoutPassMax &&
    metrics.averagePerceptualColorfulness >=
      TASTE_THRESHOLDS.colorfulnessPassMin &&
    metrics.averageChamberPresence >= TASTE_THRESHOLDS.chamberPassMin &&
    metrics.averageOverbrightRate <= TASTE_THRESHOLDS.legacyGlowSpendPassMax;
  const tasteWarn =
    summaries.length > 0 &&
    metrics.averageChamberPresence >= TASTE_THRESHOLDS.chamberWarnMin &&
    (hasPerceptualTaste
      ? metrics.averagePerceptualWashoutRisk <=
          TASTE_THRESHOLDS.perceptualWashoutWarnMax &&
        metrics.averagePerceptualColorfulness >=
          TASTE_THRESHOLDS.colorfulnessWarnMin &&
        metrics.averageOverbrightRate <= TASTE_THRESHOLDS.legacyGlowSpendWarnMax
      : metrics.averageOverbrightRate <= 0.12);

  return [
    {
      id: 'truth',
      status:
        proofValidity?.currentProofEligible === true &&
        metrics.buildIdentityValidCount === summaries.length &&
        metrics.scenarioValidatedCount === summaries.length
          ? 'pass'
          : proofValidity?.currentProofEligible === true
            ? 'warn'
            : 'fail',
      rationale:
        proofValidity?.currentProofEligible === true
          ? 'Run provenance is eligible for current proof, with build identity and scenario validation recorded.'
          : invalidations.length > 0
            ? invalidations[invalidations.length - 1]?.reason ??
              'Run invalidations make this batch ineligible as current proof.'
            : 'Run readiness or proof validity does not yet clear the truth gate.'
    },
    {
      id: 'hierarchy',
      status:
        metrics.averageHeroCoverage <= 0.28 &&
        metrics.averageWorldDominance >= 0.18 &&
        metrics.averageRingAuthority <= 1.05
          ? 'pass'
          : metrics.averageHeroCoverage <= 0.33 &&
              metrics.averageWorldDominance >= 0.14
            ? 'warn'
            : 'fail',
      rationale: `hero=${metrics.averageHeroCoverage.toFixed(3)} world=${metrics.averageWorldDominance.toFixed(3)} ring=${metrics.averageRingAuthority.toFixed(3)}`
    },
    {
      id: 'coverage',
      status:
        metrics.cueClassCount >= 3 && metrics.familyCount >= 2
          ? 'pass'
          : metrics.cueClassCount >= 2
            ? 'warn'
            : 'fail',
      rationale: `cue classes=${metrics.cueClassCount} families=${metrics.familyCount}`
    },
    {
      id: 'taste',
      status: tastePass ? 'pass' : tasteWarn ? 'warn' : 'fail',
      rationale: hasPerceptualTaste
        ? `legacyGlow=${metrics.averageOverbrightRate.toFixed(3)} washout=${metrics.averagePerceptualWashoutRisk.toFixed(3)} color=${metrics.averagePerceptualColorfulness.toFixed(3)} chamber=${metrics.averageChamberPresence.toFixed(3)}`
        : `legacyGlow=${metrics.averageOverbrightRate.toFixed(3)} chamber=${metrics.averageChamberPresence.toFixed(3)}`
    },
    {
      id: 'operator-trust',
      status:
        noTouch && interventions === 0 && invalidations.length === 0 && missedEntries.length === 0
          ? 'pass'
          : noTouch && invalidations.length === 0
            ? 'warn'
            : 'fail',
      rationale:
        noTouch && interventions === 0
          ? missedEntries.length === 0
            ? 'No-touch proof remained clean for this run.'
            : `${missedEntries.length} missed capture opportunity marker(s) were found.`
          : 'No-touch operator trust was not maintained for this run.'
    }
  ];
}

function buildRecommendation({
  runId,
  clipFiles,
  stillFiles,
  issueId,
  severity,
  title,
  ownerLane,
  subsystem,
  suspectedCause,
  impactedGates,
  targetMetrics,
  recommendedNextProofScenario,
  confidence
}) {
  return {
    issueId,
    severity,
    title,
    ownerLane,
    subsystem,
    suspectedCause,
    impactedGates,
    targetMetrics,
    recommendedNextProofScenario,
    confidence: clamp01(confidence),
    evidence: {
      runId,
      clipFiles,
      stillFiles
    }
  };
}

export function buildRunRecommendationArtifact({
  runId,
  journal,
  summaries = [],
  missedEntries = [],
  lifecycleState = 'inbox'
}) {
  const clipFiles = summaries.map((summary) => path.basename(summary.filePath ?? ''));
  const stillFiles = (journal?.checkpointStills ?? []).map((still) => still.fileName);
  const metrics = collectRunMetrics(summaries);
  const gateOutcomes = buildGateOutcomes({ journal, summaries, missedEntries });
  const proofValidity = journal?.metadata?.proofValidity;
  const invalidations = countInvalidations(journal);
  const recommendations = [];
  const dominantScenario =
    journal?.metadata?.scenarioAssessment?.derivedScenario ??
    journal?.metadata?.proofScenarioKind ??
    null;

  if (proofValidity?.currentProofEligible !== true) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'proof-invalid',
        severity: 'critical',
        title: 'Proof run is not eligible as current truth',
        ownerLane: 'evidence-capture-analyzer',
        subsystem: 'Proof Wave / run package lifecycle',
        suspectedCause:
          invalidations[invalidations.length - 1]?.reason ??
          'The serious-run readiness or validity contract was not maintained.',
        impactedGates: ['truth', 'operator trust'],
        targetMetrics: ['currentProofEligible=true', 'invalidationCount=0'],
        recommendedNextProofScenario: dominantScenario,
        confidence: 0.98
      })
    );
  }

  const hasPerceptualTaste =
    metrics.perceptualWashoutSampleCount > 0 &&
    metrics.perceptualColorfulnessSampleCount > 0;
  const perceptualWashoutFailure =
    hasPerceptualTaste &&
    (metrics.averagePerceptualWashoutRisk >
      TASTE_THRESHOLDS.perceptualWashoutWarnMax ||
      metrics.averagePerceptualColorfulness <
        TASTE_THRESHOLDS.colorfulnessWarnMin);

  if (perceptualWashoutFailure || metrics.averageOverbrightRate >= 0.1) {
    const legacyOnlyGlowSpend =
      !perceptualWashoutFailure &&
      hasPerceptualTaste &&
      metrics.averagePerceptualWashoutRisk <=
        TASTE_THRESHOLDS.perceptualWashoutPassMax;

    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: legacyOnlyGlowSpend ? 'glow-spend-calibration' : 'overbright-governance',
        severity: perceptualWashoutFailure
          ? metrics.averagePerceptualWashoutRisk >= 0.22
            ? 'critical'
            : 'high'
          : metrics.averageOverbrightRate >= 0.85
            ? 'medium'
            : 'low',
        title: legacyOnlyGlowSpend
          ? 'Legacy glow-spend telemetry is high without perceptual washout'
          : 'Overbright governance is producing perceptual washout risk',
        ownerLane: 'renderer-safe-tier',
        subsystem: 'AuthorityGovernor + LightingSystem',
        suspectedCause: legacyOnlyGlowSpend
          ? 'The legacy overbright metric is measuring sustained glow spend; tune or relabel it separately from visible washout.'
          : 'Authority, compositor, or lighting ceilings are not preserving contrast and saturation early enough.',
        impactedGates: legacyOnlyGlowSpend ? ['taste'] : ['hierarchy', 'taste'],
        targetMetrics: legacyOnlyGlowSpend
          ? [
              'averageOverbrightRate trend down without dimming',
              'perceptualWashoutRisk remains low',
              'perceptualColorfulness remains stable'
            ]
          : [
              'perceptualWashoutRisk <= 0.14',
              'perceptualColorfulness >= 0.055',
              'compositionSafetyScore up'
            ],
        recommendedNextProofScenario: 'primary-benchmark',
        confidence: legacyOnlyGlowSpend ? 0.7 : 0.86
      })
    );
  }

  if (metrics.averageHeroCoverage >= 0.28 && metrics.averageWorldDominance <= 0.18) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'hero-monopoly',
        severity: metrics.averageHeroCoverage >= 0.34 ? 'high' : 'medium',
        title: 'Hero still monopolizes the frame when world authority should lead',
        ownerLane: 'runtime-governance',
        subsystem: 'AuthorityGovernor + framing ceilings',
        suspectedCause:
          'Hero scale or framing ceilings are not yielding enough authority to chamber/world.',
        impactedGates: ['hierarchy', 'coverage'],
        targetMetrics: ['averageHeroCoverage <= 0.24', 'averageWorldDominance >= 0.20'],
        recommendedNextProofScenario: 'coverage',
        confidence: 0.82
      })
    );
  }

  if (metrics.averageWorldDominance <= 0.18 || metrics.flagCounts.get('weakWorldAuthorityDelivery')) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'weak-world-delivery',
        severity: metrics.averageWorldDominance <= 0.14 ? 'high' : 'medium',
        title: 'World takeover is still too weak or decorative',
        ownerLane: 'chamber-environment-lighting',
        subsystem: 'WorldSystem + ChamberSystem',
        suspectedCause:
          'Chamber/world participation is present, but not decisive enough to read across the room.',
        impactedGates: ['hierarchy', 'coverage', 'taste'],
        targetMetrics: ['averageWorldDominance >= 0.22', 'averageChamberPresence >= 0.18'],
        recommendedNextProofScenario: 'coverage',
        confidence: 0.78
      })
    );
  }

  if (metrics.averageRingAuthority >= 1.05 || metrics.flagCounts.get('ringOverdrawRisk')) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'ring-overdraw',
        severity: metrics.averageRingAuthority >= 1.15 ? 'high' : 'medium',
        title: 'Ring authority is lingering too long or over-drawing the chamber read',
        ownerLane: 'chamber-environment-lighting',
        subsystem: 'ChamberSystem + ParticleSystem',
        suspectedCause:
          'Ring persistence and field density are staying too dominant after the cue should move on.',
        impactedGates: ['hierarchy', 'taste'],
        targetMetrics: ['averageRingAuthority <= 0.95', 'ringBeltPersistence down'],
        recommendedNextProofScenario: 'primary-benchmark',
        confidence: 0.74
      })
    );
  }

  if (
    (dominantScenario === 'room-floor' || dominantScenario === 'sparse-silence') &&
    (metrics.quietCaptureCount === 0 || metrics.averageChamberPresence < 0.16)
  ) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'quiet-state-collapse',
        severity: 'medium',
        title: 'Quiet-state proof does not yet stay readable and alive',
        ownerLane: 'show-direction-cue-logic',
        subsystem: 'quiet-state regime and chamber/world choreography',
        suspectedCause:
          'Low-energy cue policy is not preserving enough chamber/world presence during sparse passages.',
        impactedGates: ['coverage', 'taste'],
        targetMetrics: ['quietCaptureCount > 0', 'averageChamberPresence >= 0.16'],
        recommendedNextProofScenario: dominantScenario,
        confidence: 0.69
      })
    );
  }

  if (
    dominantScenario === 'operator-trust' &&
    ((journal?.metadata?.interventionCount ?? 0) > 0 || invalidations.length > 0)
  ) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'operator-trust-failure',
        severity: 'high',
        title: 'Operator-trust scenario broke the no-touch contract',
        ownerLane: 'operator-ux-controls',
        subsystem: 'Proof Wave / no-touch tracking',
        suspectedCause:
          invalidations[invalidations.length - 1]?.reason ??
          'Operator flow or capture tooling still requires manual rescue.',
        impactedGates: ['operator trust', 'truth'],
        targetMetrics: ['interventionCount=0', 'invalidationCount=0'],
        recommendedNextProofScenario: 'operator-trust',
        confidence: 0.92
      })
    );
  }

  if (missedEntries.length > 0) {
    recommendations.push(
      buildRecommendation({
        runId,
        clipFiles,
        stillFiles,
        issueId: 'missed-opportunities',
        severity: missedEntries.length >= 3 ? 'high' : 'medium',
        title: 'Run journal shows meaningful moments with no matching saved clip',
        ownerLane: 'evidence-capture-analyzer',
        subsystem: 'authority-aware auto capture',
        suspectedCause:
          'Trigger windows or clip finalization are missing meaningful authority or governance moments.',
        impactedGates: ['truth', 'operator trust'],
        targetMetrics: ['missedOpportunityCount=0'],
        recommendedNextProofScenario: dominantScenario ?? 'coverage',
        confidence: 0.8
      })
    );
  }

  return {
    version: 1,
    metadata: {
      app: 'visulive',
      artifactType: 'run-recommendations',
      runId,
      generatedAt: new Date().toISOString(),
      lifecycleState,
      proofValidity,
      gateOutcomes
    },
    recommendations
  };
}

export function buildBatchRecommendationArtifact({
  summaries = [],
  runArtifacts = [],
  missedEntries = [],
  sourceProofManifestPath = null
}) {
  const runEntries = new Map();

  for (const entry of runArtifacts) {
    const metadata = entry?.artifact?.metadata ?? {};
    const runId = typeof metadata.runId === 'string' ? metadata.runId : null;

    if (!runId) {
      continue;
    }

    const current =
      runEntries.get(runId) ?? {
        journal: null,
        manifest: null,
        summaries: [],
        missedEntries: []
      };

    if (entry.artifactType === 'run-journal') {
      current.journal = entry.artifact;
    }

    if (entry.artifactType === 'run-manifest') {
      current.manifest = entry.artifact;
    }

    runEntries.set(runId, current);
  }

  for (const summary of summaries) {
    const runId = summary?.metadata?.runId;

    if (typeof runId !== 'string') {
      continue;
    }

    const current =
      runEntries.get(runId) ?? {
        journal: null,
        manifest: null,
        summaries: [],
        missedEntries: []
      };
    current.summaries.push(summary);
    runEntries.set(runId, current);
  }

  for (const missedEntry of missedEntries) {
    const runId = missedEntry?.runId;

    if (typeof runId !== 'string') {
      continue;
    }

    const current =
      runEntries.get(runId) ?? {
        journal: null,
        manifest: null,
        summaries: [],
        missedEntries: []
      };
    current.missedEntries.push(missedEntry);
    runEntries.set(runId, current);
  }

  const runs = Object.fromEntries(
    [...runEntries.entries()].map(([runId, entry]) => {
      const lifecycleState =
        entry.journal?.metadata?.lifecycleState ??
        entry.manifest?.metadata?.lifecycleState ??
        'inbox';

      return [
        runId,
        buildRunRecommendationArtifact({
          runId,
          journal: entry.journal,
          summaries: entry.summaries,
          missedEntries: entry.missedEntries,
          lifecycleState
        })
      ];
    })
  );

  const totalRecommendationCount = Object.values(runs).reduce(
    (sum, artifact) => sum + (artifact.recommendations?.length ?? 0),
    0
  );

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourceProofManifestPath,
    runCount: Object.keys(runs).length,
    totalRecommendationCount,
    runs
  };
}
