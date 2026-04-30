import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { refreshArchivedReviewSummaries } from '../../scripts/archive-run-package.mjs';

describe('archive run package summaries', () => {
  it('refreshes archived review summary lifecycle fields', async () => {
    const runDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'visulive-archive-summary-')
    );
    const summaryPath = path.join(runDirectory, 'run_test__review-summary.md');

    await fs.writeFile(
      summaryPath,
      [
        '# Run Package Review',
        '',
        'Run id: run_test',
        'Root: inbox',
        'Lifecycle: inbox',
        'Reviewed: 2026-04-29T00:00:00.000Z',
        'Proof verdict: valid',
        ''
      ].join('\n'),
      'utf8'
    );

    await refreshArchivedReviewSummaries({
      runDirectory,
      journal: {
        metadata: {
          updatedAt: '2026-04-30T15:01:17.000Z'
        }
      }
    });

    const updated = await fs.readFile(summaryPath, 'utf8');

    expect(updated).toContain('Root: archive');
    expect(updated).toContain('Lifecycle: archive');
    expect(updated).toContain('Reviewed: 2026-04-30T15:01:17.000Z');

    await fs.rm(runDirectory, { recursive: true, force: true });
  });
});
