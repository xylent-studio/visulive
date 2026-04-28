const DEFAULT_TARGETS_BY_LANE = {
  stable: ['https://visulive.xylent.studio'],
  frontier: process.env.VISULIVE_FRONTIER_URL
    ? [process.env.VISULIVE_FRONTIER_URL]
    : [],
  legacy: ['https://visulive-v1.xylent.studio']
};

const UNPROVISIONED_LANE_NOTES = {
  frontier:
    'Frontier staging host is intentionally not provisioned yet. Skipping default frontier smoke check. Pass --url or set VISULIVE_FRONTIER_URL once a real staging host exists.'
};

function parseArgs(argv) {
  const targets = [];
  let includeHttp = false;
  let lane = 'stable';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--url') {
      const value = argv[index + 1];
      if (value) {
        targets.push(value);
        index += 1;
      }
      continue;
    }

    if (arg === '--include-http') {
      includeHttp = true;
    }

    if (arg === '--lane') {
      const value = argv[index + 1];
      if (
        value === 'stable' ||
        value === 'frontier' ||
        value === 'legacy'
      ) {
        lane = value;
        index += 1;
      }
    }
  }

  const usingDefaultLaneTargets = targets.length === 0;
  const resolvedTargets =
    usingDefaultLaneTargets ? [...DEFAULT_TARGETS_BY_LANE[lane]] : [...targets];
  if (includeHttp && lane === 'stable' && usingDefaultLaneTargets) {
    resolvedTargets.unshift('http://visulive.xylent.studio');
  }

  return {
    lane,
    targets: resolvedTargets,
    usingDefaultLaneTargets
  };
}

async function fetchTarget(target) {
  const response = await fetch(target, {
    redirect: 'manual',
    headers: {
      'user-agent': 'visulive-prod-smoke/1.0.0'
    }
  });

  let bodySample = '';
  if (response.status >= 200 && response.status < 300) {
    bodySample = (await response.text()).slice(0, 2048);
  }

  return {
    target,
    status: response.status,
    location: response.headers.get('location'),
    server: response.headers.get('server'),
    contentType: response.headers.get('content-type'),
    bodySample
  };
}

function printResult(result) {
  const parts = [
    `${result.target} -> ${result.status}`,
    `server=${result.server ?? 'unknown'}`,
    `type=${result.contentType ?? 'unknown'}`
  ];

  if (result.location) {
    parts.push(`location=${result.location}`);
  }

  console.log(parts.join(' | '));
}

async function main() {
  const { lane, targets, usingDefaultLaneTargets } = parseArgs(
    process.argv.slice(2)
  );
  const failures = [];

  if (targets.length === 0) {
    if (usingDefaultLaneTargets && lane in UNPROVISIONED_LANE_NOTES) {
      console.log(UNPROVISIONED_LANE_NOTES[lane]);
      return;
    }

    console.error(`No smoke targets resolved for lane "${lane}".`);
    process.exitCode = 1;
    return;
  }

  for (const target of targets) {
    try {
      const result = await fetchTarget(target);
      printResult(result);

      const successfulRedirect = result.status >= 300 && result.status < 400 && !!result.location;
      const successfulHtml =
        result.status >= 200 &&
        result.status < 300 &&
        (result.contentType ?? '').includes('text/html') &&
        /VisuLive/i.test(result.bodySample);

      if (!successfulRedirect && !successfulHtml) {
        failures.push(`${target} returned ${result.status} without a healthy HTML response.`);
      }
    } catch (error) {
      failures.push(
        `${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Production smoke check passed.');
}

await main();
