import { describe, expect, it } from 'vitest';
import {
  clusterHasSavedEvidence,
  clusterMissableMarkers,
  resolveExpectedEvidence
} from '../../scripts/report-missed-opportunities.mjs';

describe('missed capture opportunity matching', () => {
  it('clusters missable markers by kind and ignores non-proof noise', () => {
    const clusters = clusterMissableMarkers([
      { kind: 'authority-turn', timestampMs: 1000, reason: 'world=shared' },
      { kind: 'authority-turn', timestampMs: 3200, reason: 'world=shared' },
      { kind: 'signature-preview', timestampMs: 4000, reason: 'lab' },
      { kind: 'quiet-beauty', timestampMs: 14000, reason: 'quiet' }
    ]);

    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toMatchObject({
      markerKind: 'authority-turn',
      timestampMs: 1000,
      endTimestampMs: 3200,
      markerCount: 2
    });
    expect(clusters[1]).toMatchObject({
      markerKind: 'quiet-beauty',
      timestampMs: 14000,
      markerCount: 1
    });
  });

  it('clusters persistent governance risk across the capture cooldown window', () => {
    const clusters = clusterMissableMarkers([
      { kind: 'governance-risk', timestampMs: 251410, reason: 'overbright' },
      { kind: 'governance-risk', timestampMs: 259464, reason: 'overbright' },
      { kind: 'governance-risk', timestampMs: 276221, reason: 'safety=risk' }
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      markerKind: 'governance-risk',
      timestampMs: 251410,
      endTimestampMs: 276221,
      markerCount: 3
    });
  });

  it('counts contextual signature stills that span governance risk clusters', () => {
    const cluster = {
      markerKind: 'governance-risk',
      timestampMs: 397976,
      endTimestampMs: 399672,
      markerCount: 9,
      reason: 'safety=ok overbright=0.326'
    };

    const match = clusterHasSavedEvidence(
      cluster,
      [],
      [{ kind: 'signature', timestampMs: 399480 }]
    );

    expect(match.matched).toBe(true);
    expect(match.expectedEvidence.label).toContain('contextual');
  });

  it('ignores armed and eligible signature candidates when looking for missed precharge proof', () => {
    const clusters = clusterMissableMarkers([
      {
        kind: 'signature-moment-precharge',
        timestampMs: 1000,
        reason: 'signature=silence-constellation style=ambient-premium phase=armed'
      },
      {
        kind: 'signature-moment-precharge',
        timestampMs: 1600,
        reason: 'signature=cathedral-open style=maximal-neon phase=eligible'
      },
      {
        kind: 'signature-moment-precharge',
        timestampMs: 2400,
        reason: 'signature=cathedral-open style=maximal-neon phase=precharge'
      }
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      markerKind: 'signature-moment-precharge',
      timestampMs: 2400,
      markerCount: 1
    });
  });

  it('counts authority-context clips and stills that span late authority turns', () => {
    const cluster = {
      markerKind: 'authority-turn',
      timestampMs: 439237,
      endTimestampMs: 439237,
      markerCount: 1,
      reason: 'world=dominant'
    };

    expect(resolveExpectedEvidence(cluster).label).toContain('authority/context');
    expect(
      clusterHasSavedEvidence(
        cluster,
        [
          {
            startMs: 433800,
            endMs: 435200,
            triggerKind: 'signature-moment-peak',
            version: 3
          }
        ],
        []
      ).matched
    ).toBe(true);
    expect(
      clusterHasSavedEvidence(
        cluster,
        [],
        [{ kind: 'safety', timestampMs: 447900 }]
      ).matched
    ).toBe(true);
  });

  it('counts signature clips that span precharge even when the clip phase differs', () => {
    const cluster = {
      markerKind: 'signature-moment-precharge',
      timestampMs: 68037,
      endTimestampMs: 68037,
      markerCount: 1,
      reason: 'signature=cathedral-open'
    };

    const match = clusterHasSavedEvidence(
      cluster,
      [
        {
          startMs: 64200,
          endMs: 70400,
          triggerKind: 'signature-moment-peak',
          version: 3
        }
      ],
      []
    );

    expect(match.matched).toBe(true);
    expect(match.expectedEvidence.label).toContain('signature-moment');
  });

  it('keeps truly uncovered signature precharge markers visible', () => {
    const cluster = {
      markerKind: 'signature-moment-precharge',
      timestampMs: 97880,
      endTimestampMs: 98498,
      markerCount: 2,
      reason: 'signature=silence-constellation'
    };

    expect(clusterHasSavedEvidence(cluster, [], []).matched).toBe(false);
  });
});
