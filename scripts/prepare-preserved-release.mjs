import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    version: '',
    title: '',
    commit: '',
    builtAt: '',
    sourceBranch: 'release/v1',
    lane: 'stable',
    publicUrl: 'https://visulive-v1.xylent.studio',
    provisionalPublicUrl: '',
    siteName: 'visulive-v1-xylent-studio',
    tag: '',
    proofStatus: 'unknown',
    githubReleaseUrl: '',
    liveDeployId: '',
    legacyDeployId: '',
    customDomainStatus: '',
    outputDir: '',
    distDir: 'dist',
    notesFile: '',
    proofPackMarkdown: 'docs/proof-pack_latest.md',
    proofPackJson: 'docs/proof-pack_latest.json',
    benchmarkManifest: 'captures/benchmark-manifest.json',
    screenshotsDir: 'captures/reports/live-review'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case '--version':
        args.version = next ?? args.version;
        index += 1;
        break;
      case '--title':
        args.title = next ?? args.title;
        index += 1;
        break;
      case '--commit':
        args.commit = next ?? args.commit;
        index += 1;
        break;
      case '--built-at':
        args.builtAt = next ?? args.builtAt;
        index += 1;
        break;
      case '--source-branch':
        args.sourceBranch = next ?? args.sourceBranch;
        index += 1;
        break;
      case '--lane':
        args.lane = next ?? args.lane;
        index += 1;
        break;
      case '--public-url':
        args.publicUrl = next ?? args.publicUrl;
        index += 1;
        break;
      case '--provisional-public-url':
        args.provisionalPublicUrl = next ?? args.provisionalPublicUrl;
        index += 1;
        break;
      case '--site-name':
        args.siteName = next ?? args.siteName;
        index += 1;
        break;
      case '--tag':
        args.tag = next ?? args.tag;
        index += 1;
        break;
      case '--proof-status':
        args.proofStatus = next ?? args.proofStatus;
        index += 1;
        break;
      case '--github-release-url':
        args.githubReleaseUrl = next ?? args.githubReleaseUrl;
        index += 1;
        break;
      case '--live-deploy-id':
        args.liveDeployId = next ?? args.liveDeployId;
        index += 1;
        break;
      case '--legacy-deploy-id':
        args.legacyDeployId = next ?? args.legacyDeployId;
        index += 1;
        break;
      case '--custom-domain-status':
        args.customDomainStatus = next ?? args.customDomainStatus;
        index += 1;
        break;
      case '--output-dir':
        args.outputDir = next ?? args.outputDir;
        index += 1;
        break;
      case '--dist-dir':
        args.distDir = next ?? args.distDir;
        index += 1;
        break;
      case '--notes-file':
        args.notesFile = next ?? args.notesFile;
        index += 1;
        break;
      case '--proof-pack-markdown':
        args.proofPackMarkdown = next ?? args.proofPackMarkdown;
        index += 1;
        break;
      case '--proof-pack-json':
        args.proofPackJson = next ?? args.proofPackJson;
        index += 1;
        break;
      case '--benchmark-manifest':
        args.benchmarkManifest = next ?? args.benchmarkManifest;
        index += 1;
        break;
      case '--screenshots-dir':
        args.screenshotsDir = next ?? args.screenshotsDir;
        index += 1;
        break;
      default:
        break;
    }
  }

  if (!args.version) {
    throw new Error('Expected --version <value>.');
  }

  if (!args.title) {
    args.title = `VisuLive ${args.version} — Preserved Edition`;
  }

  if (!args.tag) {
    args.tag = args.version;
  }

  if (!args.outputDir) {
    args.outputDir = path.join('preserved-releases', args.version);
  }

  return args;
}

function resolveRepoPath(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function copyIfExists(sourcePath, targetPath) {
  if (!(await pathExists(sourcePath))) {
    return false;
  }

  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
  return true;
}

async function copyDirectory(sourceDir, targetDir) {
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

async function listFilesRecursive(rootDir) {
  const results = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const targetPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFilesRecursive(targetPath)));
      continue;
    }

    results.push(targetPath);
  }

  return results.sort();
}

async function sha256ForFile(targetPath) {
  const hash = crypto.createHash('sha256');
  const data = await fs.readFile(targetPath);
  hash.update(data);
  return hash.digest('hex');
}

function archiveDirectory(sourceDir, archivePath) {
  if (process.platform === 'win32') {
    const command = [
      '$ErrorActionPreference = "Stop"',
      'Add-Type -AssemblyName System.IO.Compression.FileSystem',
      `$source = '${sourceDir.replace(/'/g, "''")}'`,
      `$destination = '${archivePath.replace(/'/g, "''")}'`,
      'if (Test-Path $destination) { Remove-Item -LiteralPath $destination -Force }',
      '[System.IO.Compression.ZipFile]::CreateFromDirectory($source, $destination)'
    ].join('; ');
    const result = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      {
        cwd: repoRoot,
        stdio: 'inherit'
      }
    );

    if (result.status !== 0) {
      throw new Error(`Failed to create archive ${archivePath}.`);
    }

    return;
  }

  const result = spawnSync('tar', ['-czf', archivePath, '-C', sourceDir, '.'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error(`Failed to create archive ${archivePath}.`);
  }
}

function relativeToRepo(targetPath) {
  return path.relative(repoRoot, targetPath).replace(/\\/g, '/');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputRoot = resolveRepoPath(args.outputDir);
  const assetsRoot = path.join(outputRoot, 'assets');
  const docsRoot = path.join(outputRoot, 'docs');
  const evidenceRoot = path.join(outputRoot, 'evidence');
  const screenshotsRoot = path.join(outputRoot, 'screenshots');
  const distSource = resolveRepoPath(args.distDir);
  const notesSource = args.notesFile
    ? resolveRepoPath(args.notesFile)
    : path.join(outputRoot, 'release-notes.md');
  const proofPackMarkdownSource = resolveRepoPath(args.proofPackMarkdown);
  const proofPackJsonSource = resolveRepoPath(args.proofPackJson);
  const benchmarkManifestSource = resolveRepoPath(args.benchmarkManifest);
  const screenshotsSource = resolveRepoPath(args.screenshotsDir);

  await ensureDir(outputRoot);
  await ensureDir(assetsRoot);
  await ensureDir(docsRoot);
  await ensureDir(evidenceRoot);

  const copiedArtifacts = [];

  if (args.notesFile) {
    const copied = await copyIfExists(
      notesSource,
      path.join(docsRoot, path.basename(notesSource))
    );
    if (copied) {
      copiedArtifacts.push(path.join(docsRoot, path.basename(notesSource)));
    }
  }

  for (const [sourcePath, destinationRoot] of [
    [proofPackMarkdownSource, evidenceRoot],
    [proofPackJsonSource, evidenceRoot],
    [benchmarkManifestSource, evidenceRoot]
  ]) {
    const copied = await copyIfExists(
      sourcePath,
      path.join(destinationRoot, path.basename(sourcePath))
    );
    if (copied) {
      copiedArtifacts.push(path.join(destinationRoot, path.basename(sourcePath)));
    }
  }

  let screenshotsCopied = false;
  if (await pathExists(screenshotsSource)) {
    await copyDirectory(screenshotsSource, screenshotsRoot);
    screenshotsCopied = true;
  }

  let distArchivePath = null;
  if (await pathExists(distSource)) {
    const distSnapshotRoot = path.join(assetsRoot, 'dist');
    await copyDirectory(distSource, distSnapshotRoot);
    const archiveExtension = process.platform === 'win32' ? 'zip' : 'tar.gz';
    distArchivePath = path.join(
      assetsRoot,
      `visulive-${args.version}-dist.${archiveExtension}`
    );
    archiveDirectory(distSnapshotRoot, distArchivePath);
    copiedArtifacts.push(distArchivePath);
  }

  const checksumEntries = [];
  for (const artifactPath of copiedArtifacts) {
    checksumEntries.push({
      path: relativeToRepo(artifactPath),
      sha256: await sha256ForFile(artifactPath)
    });
  }

  if (screenshotsCopied) {
    const screenshotFiles = await listFilesRecursive(screenshotsRoot);
    for (const screenshotPath of screenshotFiles) {
      checksumEntries.push({
        path: relativeToRepo(screenshotPath),
        sha256: await sha256ForFile(screenshotPath)
      });
    }
  }

  const status =
    args.commit && args.builtAt && distArchivePath
      ? 'ready'
      : 'pending-live-capture';

  const record = {
    status,
    version: args.version,
    title: args.title,
    tag: args.tag,
    sourceSnapshot: {
      commit: args.commit || null,
      sourceBranch: args.sourceBranch,
      lane: args.lane
    },
    publicArchive: {
      url: args.publicUrl,
      provisionalUrl: args.provisionalPublicUrl || null,
      netlifySiteName: args.siteName,
      customDomainStatus: args.customDomainStatus || null
    },
    build: {
      builtAt: args.builtAt || null,
      proofStatus: args.proofStatus
    },
    release: {
      githubReleaseUrl: args.githubReleaseUrl || null
    },
    deploys: {
      liveDeployId: args.liveDeployId || null,
      legacyDeployId: args.legacyDeployId || null
    },
    assets: {
      distArchive: distArchivePath ? relativeToRepo(distArchivePath) : null,
      releaseNotes: args.notesFile
        ? relativeToRepo(path.join(docsRoot, path.basename(notesSource)))
        : relativeToRepo(path.join(outputRoot, 'release-notes.md')),
      proofPackMarkdown: (await pathExists(path.join(evidenceRoot, path.basename(proofPackMarkdownSource))))
        ? relativeToRepo(path.join(evidenceRoot, path.basename(proofPackMarkdownSource)))
        : null,
      proofPackJson: (await pathExists(path.join(evidenceRoot, path.basename(proofPackJsonSource))))
        ? relativeToRepo(path.join(evidenceRoot, path.basename(proofPackJsonSource)))
        : null,
      benchmarkManifest: (await pathExists(path.join(evidenceRoot, path.basename(benchmarkManifestSource))))
        ? relativeToRepo(path.join(evidenceRoot, path.basename(benchmarkManifestSource)))
        : null,
      screenshotsDir: screenshotsCopied ? relativeToRepo(screenshotsRoot) : null
    },
    checksums: checksumEntries,
    notes:
      status === 'ready'
        ? args.customDomainStatus && args.customDomainStatus !== 'ready'
          ? 'Preserved release package is ready, the legacy site is deployed, and the remaining blocker is final custom-domain binding.'
          : 'Preserved release package is ready, the legacy site is deployed, and the release record is complete.'
        : 'Exact live production commit, build timestamp, and/or artifact archive are still missing. Capture them from the real deployed stable build before tagging and publishing this preserved edition.'
  };

  const recordPath = path.join(outputRoot, 'release-record.json');
  await fs.writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

  const checksumsPath = path.join(outputRoot, 'SHA256SUMS.txt');
  const checksumText =
    checksumEntries.length > 0
      ? checksumEntries
          .map((entry) => `${entry.sha256}  ${entry.path}`)
          .join('\n')
      : '# No packaged assets yet.\n';
  await fs.writeFile(checksumsPath, `${checksumText}\n`, 'utf8');

  console.log(
    `Prepared preserved release record at ${relativeToRepo(recordPath)} with status ${status}.`
  );
  if (distArchivePath) {
    console.log(`Packaged dist archive at ${relativeToRepo(distArchivePath)}.`);
  } else {
    console.log('No dist directory was found; dist archive was not created.');
  }
}

await main();
