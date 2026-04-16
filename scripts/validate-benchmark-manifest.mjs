import {
  benchmarkManifestPath,
  collectBenchmarkManifestHealth
} from './capture-reporting.mjs';

async function main() {
  const manifestHealth = await collectBenchmarkManifestHealth();

  console.log(`Benchmark manifest: ${benchmarkManifestPath}`);
  for (const line of manifestHealth.lines) {
    console.log(line.replace(/^- /, ''));
  }

  if (!manifestHealth.valid) {
    process.exitCode = 1;
  }
}

await main();
