import type { ReplayCaptureFrame } from './types';

export type ProofStillKind = 'pre' | 'peak' | 'safety' | 'outro';

export type ProofStillSample = {
  timestampMs: number;
  blob: Blob;
  eventScore: number;
  safetyScore: number;
  riskScore: number;
};

export type ProofStillSelection = {
  kind: ProofStillKind;
  sample: ProofStillSample;
};

export const PROOF_STILL_SAMPLE_INTERVAL_MS = 480;

export function buildProofStillFileName(
  label: string,
  kind: ProofStillKind
): string {
  return `${label}__${kind}.png`;
}

export function evaluateProofStillFrame(frame: ReplayCaptureFrame): {
  eventScore: number;
  safetyScore: number;
  riskScore: number;
} {
  const listening = frame.listeningFrame;
  const visual = frame.visualTelemetry;
  const eventScore =
    (visual.eventGlowBudget ?? 0) * 1.8 +
    (visual.temporalWindows?.beatStrike ?? 0) * 1.2 +
    listening.dropImpact * 1.4 +
    listening.sectionChange * 0.9 +
    listening.releaseTail * 0.5;
  const safetyScore =
    typeof visual.compositionSafetyScore === 'number'
      ? visual.compositionSafetyScore
      : typeof visual.stageCompositionSafety === 'number'
        ? visual.stageCompositionSafety
        : 1;
  const riskScore =
    Math.max(0, 1 - safetyScore) * 1.8 +
    (visual.heroCoverageEstimate ?? 0) * 1.1 +
    (visual.ringBeltPersistence ?? 0) * 0.8 +
    (visual.wirefieldDensityScore ?? 0) * 0.8 +
    (visual.overbright ?? 0) * 0.7;

  return {
    eventScore,
    safetyScore,
    riskScore
  };
}

export function selectClosestProofStillSample(
  samples: ProofStillSample[],
  targetTimestampMs: number
): ProofStillSample | null {
  if (samples.length === 0) {
    return null;
  }

  let best: ProofStillSample | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const sample of samples) {
    const distance = Math.abs(sample.timestampMs - targetTimestampMs);
    if (distance < bestDistance) {
      best = sample;
      bestDistance = distance;
    }
  }

  return best;
}

export function dedupeProofStillSelections(
  selections: ProofStillSelection[]
): ProofStillSelection[] {
  const usedTimestamps = new Set<number>();
  const deduped: ProofStillSelection[] = [];

  for (const selection of selections) {
    if (usedTimestamps.has(selection.sample.timestampMs)) {
      continue;
    }

    usedTimestamps.add(selection.sample.timestampMs);
    deduped.push(selection);
  }

  return deduped;
}
