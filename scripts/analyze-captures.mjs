import {
  analyzeCaptureTargets,
  canonicalRoot,
  collectBenchmarkManifestHealth,
  inboxRoot,
  loadManifestBenchmarkSummaries,
  writeEmptyCaptureReport,
  writeCaptureReport
} from './capture-reporting.mjs';

const LATEST_REPORT_NAME = 'capture-analysis_latest.md';

async function main() {
  const inputArgs = process.argv.slice(2);
  const targetPaths = inputArgs.length > 0 ? inputArgs : [inboxRoot, canonicalRoot];
  const summaries = await analyzeCaptureTargets(targetPaths);
  const manifestHealth = await collectBenchmarkManifestHealth();
  const benchmarkSummaries = await loadManifestBenchmarkSummaries(summaries);

  if (summaries.length === 0) {
    const latestReportPath = await writeEmptyCaptureReport({
      fileName: LATEST_REPORT_NAME,
      manifestHealth,
      benchmarkSummaries
    });
    console.error('No capture JSON files were found to analyze.');
    console.log(`Latest report refreshed at ${latestReportPath}`);
    process.exitCode = 1;
    return;
  }
  const reportPath = await writeCaptureReport(summaries, {
    manifestHealth,
    benchmarkSummaries
  });
  const latestReportPath = await writeCaptureReport(summaries, {
    fileName: LATEST_REPORT_NAME,
    manifestHealth,
    benchmarkSummaries
  });

  console.log(`Analyzed ${summaries.length} capture(s).`);
  console.log(`Report written to ${reportPath}`);
  console.log(`Latest report refreshed at ${latestReportPath}`);
}

await main();
