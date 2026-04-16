import fs from 'node:fs';
import path from 'node:path';
import {
  analyzeCaptureTargets,
  collectBenchmarkManifestHealth,
  inboxRoot,
  reportRoot,
  writeEmptyCaptureReport,
  writeCaptureReport
} from './capture-reporting.mjs';

const LATEST_REPORT_NAME = 'capture-analysis_latest.md';
let debounceTimer = null;
let running = false;
let queued = false;

async function generateLatestReport() {
  if (running) {
    queued = true;
    return;
  }

  running = true;

  try {
    const summaries = await analyzeCaptureTargets([inboxRoot]);
    const manifestHealth = await collectBenchmarkManifestHealth();

    if (summaries.length === 0) {
      await writeEmptyCaptureReport({
        fileName: LATEST_REPORT_NAME,
        manifestHealth
      });
      console.log('watch:captures | no capture JSON files found yet.');
      return;
    }

    const reportPath = await writeCaptureReport(summaries, {
      fileName: LATEST_REPORT_NAME,
      manifestHealth
    });
    console.log(
      `watch:captures | analyzed ${summaries.length} capture(s) -> ${path.relative(process.cwd(), reportPath)}`
    );
  } catch (error) {
    console.error(
      `watch:captures | ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    running = false;

    if (queued) {
      queued = false;
      void generateLatestReport();
    }
  }
}

function scheduleLatestReport() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void generateLatestReport();
  }, 800);
}

await fs.promises.mkdir(reportRoot, { recursive: true });
await fs.promises.mkdir(inboxRoot, { recursive: true });
void generateLatestReport();

const watcher = fs.watch(
  inboxRoot,
  { recursive: true },
  (_eventType, fileName) => {
    if (!fileName) {
      scheduleLatestReport();
      return;
    }

    const normalized = String(fileName).replace(/\\/g, '/');

    if (!normalized.toLowerCase().endsWith('.json')) {
      return;
    }

    if (normalized.startsWith('reports/')) {
      return;
    }

    scheduleLatestReport();
  }
);

console.log(
  `watch:captures | watching ${path.relative(process.cwd(), inboxRoot)} for new capture JSON files`
);
console.log(
  `watch:captures | live report path ${path.relative(process.cwd(), path.join(reportRoot, LATEST_REPORT_NAME))}`
);

process.on('SIGINT', () => {
  watcher.close();
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  process.exit(0);
});
