import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadRunPackage, resolveRunStillPaths } from './run-package-utils.mjs';
import { workspaceRoot } from './capture-reporting.mjs';

function parseArgs(argv) {
  const args = {
    runId: '',
    output: '',
    kinds: new Set(['signature', 'signature-preview', 'authority', 'safety', 'quiet', 'peak']),
    includeAll: false,
    limit: 64
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--run-id') {
      args.runId = argv[index + 1] ?? '';
      index += 1;
    } else if (token === '--output') {
      args.output = argv[index + 1] ?? '';
      index += 1;
    } else if (token === '--kinds') {
      args.kinds = new Set(
        (argv[index + 1] ?? '')
          .split(',')
          .map((kind) => kind.trim())
          .filter(Boolean)
      );
      index += 1;
    } else if (token === '--all') {
      args.includeAll = true;
    } else if (token === '--limit') {
      args.limit = Number(argv[index + 1] ?? args.limit);
      index += 1;
    }
  }

  if (!args.runId) {
    throw new Error('moment:sheet requires --run-id <runId>.');
  }

  args.limit = Number.isFinite(args.limit)
    ? Math.max(1, Math.floor(args.limit))
    : 64;

  return args;
}

function formatNumber(value, digits = 3) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : 'n/a';
}

function formatMs(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${Math.round(value)}ms`
    : 'n/a';
}

function escapeCell(value) {
  return String(value ?? 'n/a').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function stillKindFromName(fileName) {
  const suffixMatch = fileName.match(/__([a-z-]+)(?:_\d+)?\.png$/i);
  if (suffixMatch) {
    return suffixMatch[1];
  }

  if (fileName.includes('signature-preview')) {
    return 'signature-preview';
  }

  if (fileName.includes('signature-moment')) {
    return 'signature';
  }

  if (fileName.includes('authority-turn')) {
    return 'authority';
  }

  return 'unknown';
}

function elapsedMsFromName(fileName) {
  const match = fileName.match(/__([a-z-]+)_(\d+)\.png$/i);
  return match ? Number(match[2]) : null;
}

function nearestSample(samples, timestampMs) {
  if (!Number.isFinite(timestampMs) || samples.length === 0) {
    return null;
  }

  let best = samples[0];
  let bestDistance = Math.abs((best.timestampMs ?? 0) - timestampMs);

  for (const sample of samples.slice(1)) {
    const distance = Math.abs((sample.timestampMs ?? 0) - timestampMs);
    if (distance < bestDistance) {
      best = sample;
      bestDistance = distance;
    }
  }

  return bestDistance <= 1500 ? best : null;
}

function summarizeSample(sample) {
  if (!sample) {
    return {
      cue: 'n/a',
      signature: 'n/a',
      scene: 'n/a',
      authority: 'n/a',
      safety: 'n/a'
    };
  }

  const signature = sample.signatureMoment ?? {};
  const playable = sample.playableMotif ?? {};
  const authority = sample.authority ?? {};
  const stage = sample.stage ?? {};

  return {
    cue: `${stage.canonicalCueClass ?? 'unknown'} / ${stage.stageCueFamily ?? 'unknown'} / ${stage.stageWorldMode ?? 'unknown'}`,
    signature: `${signature.activeSignatureMoment ?? 'none'} / ${signature.signatureMomentPhase ?? 'idle'} / ${signature.signatureMomentStyle ?? 'n/a'} / i=${formatNumber(signature.signatureMomentIntensity)}`,
    scene: `${playable.activePlayableMotifScene ?? 'n/a'} / ${playable.playableMotifSceneProfileId ?? 'n/a'} / ${playable.playableMotifSceneSilhouetteFamily ?? 'n/a'} / ${playable.playableMotifSceneSurfaceRole ?? 'n/a'} / mask=${playable.compositorMaskFamily ?? 'n/a'} / job=${playable.particleFieldJob ?? 'n/a'} / i=${formatNumber(playable.playableMotifSceneIntensity)} / silhouette=${formatNumber(playable.playableMotifSceneSilhouetteConfidence)}`,
    authority: `world=${formatNumber(authority.worldDominanceDelivered)} chamber=${formatNumber(authority.chamberPresenceScore)} ring=${formatNumber(authority.ringAuthority)}`,
    safety: `wash=${formatNumber(signature.perceptualWashoutRisk)} color=${formatNumber(signature.perceptualColorfulnessScore)} over=${formatNumber(authority.overbright)}`
  };
}

function imageTag(filePath, width = 260) {
  const uri = pathToFileURL(filePath).href;
  return `<img src="${uri}" width="${width}" />`;
}

async function writeReviewSheet(runPackage, args) {
  const stillPaths = resolveRunStillPaths(runPackage);
  const samples = Array.isArray(runPackage.journal.samples)
    ? runPackage.journal.samples
    : [];

  const stills = stillPaths
    .map((filePath) => {
      const fileName = path.basename(filePath);
      const kind = stillKindFromName(fileName);
      const elapsedMs = elapsedMsFromName(fileName);
      const sample = nearestSample(samples, elapsedMs);

      return {
        filePath,
        fileName,
        kind,
        elapsedMs,
        sample,
        summary: summarizeSample(sample)
      };
    })
    .filter((still) => args.includeAll || args.kinds.has(still.kind))
    .sort((left, right) => {
      const leftTime = Number.isFinite(left.elapsedMs) ? left.elapsedMs : Number.MAX_SAFE_INTEGER;
      const rightTime = Number.isFinite(right.elapsedMs) ? right.elapsedMs : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime || left.fileName.localeCompare(right.fileName);
    })
    .slice(0, args.limit);

  const outputPath = args.output
    ? path.resolve(workspaceRoot, args.output)
    : path.join(
        workspaceRoot,
        'captures',
        'reports',
        'moment-contact-sheets',
        `${runPackage.runId}__moment-review-sheet.md`
      );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const metadata = runPackage.manifest.metadata ?? {};
  const lines = [
    `# Moment Review Sheet: ${runPackage.runId}`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Run package: ${runPackage.runDirectory}`,
    `Lifecycle: ${metadata.lifecycleState ?? runPackage.rootKind}`,
    `Proof mission: ${metadata.proofMission?.kind ?? metadata.proofScenarioKind ?? 'n/a'}`,
    `Build: ${metadata.buildInfo?.version ?? 'n/a'} / ${metadata.buildInfo?.commit ?? 'n/a'} / ${metadata.buildInfo?.lane ?? 'n/a'} / valid=${metadata.buildInfo?.valid === true}`,
    `Eligibility: ${metadata.proofMissionEligibility?.verdict ?? metadata.proofValidity?.verdict ?? 'n/a'}`,
    `Artifact integrity: ${metadata.artifactIntegrity?.verdict ?? 'n/a'}`,
    `Included stills: ${stills.length}`,
    '',
    '## How To Review',
    '',
    '- First pass: squint or zoom out and decide whether the image class reads before details matter.',
    '- Second pass: compare the `signature` and `scene` columns; generic-looking images with different labels are failures.',
    '- Third pass: mark quick scores below, then route fixes to the owner lane shown by the telemetry.',
    '',
    'Quick score tags for the review note:',
    '',
    '- `favorite`: frame should influence the target look.',
    '- `weak`: frame is mechanically valid but visually underpowered.',
    '- `reads-at-thumbnail`: scene/moment is identifiable when small.',
    '- `scene-label-mismatch`: telemetry says one scene but the image reads as another.',
    '- `generic-ring-wallpaper`: rings dominate without serving architecture, strike, residue, or suppression.',
    '- `premium-frame`: frame is showable even without diagnostics.',
    '',
    '## Contact Sheet',
    '',
    '| Still | Timing | Intent Telemetry | Authority / Safety |',
    '| --- | --- | --- | --- |',
    ...stills.map((still) => [
      `| ${imageTag(still.filePath)}`,
      `${escapeCell(still.kind)}<br>${formatMs(still.elapsedMs)}<br>${escapeCell(still.fileName)}`,
      `${escapeCell(still.summary.cue)}<br>${escapeCell(still.summary.signature)}<br>${escapeCell(still.summary.scene)}`,
      `${escapeCell(still.summary.authority)}<br>${escapeCell(still.summary.safety)} |`
    ].join(' | ')),
    '',
    '## Temporal Strip',
    '',
    ...stills.map((still) => [
      `### ${formatMs(still.elapsedMs)} - ${still.kind}`,
      '',
      imageTag(still.filePath, 560),
      '',
      `- Cue: ${still.summary.cue}`,
      `- Signature: ${still.summary.signature}`,
      `- Playable scene: ${still.summary.scene}`,
      `- Authority: ${still.summary.authority}`,
      `- Safety/color: ${still.summary.safety}`,
      ''
    ].join('\n'))
  ];

  await fs.writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8');
  return outputPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runPackage = await loadRunPackage(args.runId);
  const outputPath = await writeReviewSheet(runPackage, args);
  console.log(`Moment review sheet written to ${outputPath}`);
}

await main();
