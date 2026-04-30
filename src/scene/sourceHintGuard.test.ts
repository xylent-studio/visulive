import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_PATTERNS = [
  /\bSpectrumFrame\b/,
  /\bSourceHintFrame\b/,
  /sourceHintInterpreter/,
  /spectrumBands/
];

function collectSceneFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSceneFiles(fullPath));
      continue;
    }
    if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('source hint visual boundary', () => {
  it('keeps raw spectrum and source-hint contracts out of visual systems', () => {
    const sceneRoot = path.resolve(process.cwd(), 'src/scene');
    const offenders = collectSceneFiles(sceneRoot)
      .map((filePath) => ({
        filePath,
        source: fs.readFileSync(filePath, 'utf8')
      }))
      .filter(({ source }) =>
        FORBIDDEN_PATTERNS.some((pattern) => pattern.test(source))
      )
      .map(({ filePath }) => path.relative(process.cwd(), filePath));

    expect(offenders).toEqual([]);
  });
});
