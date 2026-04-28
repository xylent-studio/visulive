import {
  benchmarkManifestPath,
  collectBenchmarkManifestHealth
} from './capture-reporting.mjs';

function parseArgs(argv) {
  return {
    requireCurrentCanonical:
      argv.includes('--require-current') || argv.includes('--require-current-canonical')
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestHealth = await collectBenchmarkManifestHealth({
    requireCurrentCanonical: args.requireCurrentCanonical
  });

  console.log(`Benchmark manifest: ${benchmarkManifestPath}`);
  for (const line of manifestHealth.lines) {
    console.log(line.replace(/^- /, ''));
  }

  if (!manifestHealth.valid) {
    process.exitCode = 1;
  }
}

await main();
