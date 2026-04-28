import fs from 'node:fs/promises';
import path from 'node:path';
import {
  archiveRoot,
  canonicalRoot,
  inboxRoot,
  workspaceRoot
} from './capture-reporting.mjs';

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function classifyRoot(rootPath) {
  if (rootPath === inboxRoot || rootPath.startsWith(`${inboxRoot}${path.sep}`)) {
    return 'inbox';
  }

  if (rootPath === canonicalRoot || rootPath.startsWith(`${canonicalRoot}${path.sep}`)) {
    return 'canonical';
  }

  return 'archive';
}

function resolveRunDirectory(rootPath, runId) {
  return path.join(rootPath, 'runs', runId);
}

export async function findRunPackage(runId) {
  for (const rootPath of [inboxRoot, canonicalRoot, archiveRoot]) {
    const runDirectory = resolveRunDirectory(rootPath, runId);

    if (await pathExists(runDirectory)) {
      return {
        runId,
        rootPath,
        rootKind: classifyRoot(rootPath),
        runDirectory
      };
    }
  }

  return null;
}

export async function loadRunPackage(runId) {
  const located = await findRunPackage(runId);

  if (!located) {
    throw new Error(`Run package "${runId}" was not found under captures/inbox, canonical, or archive.`);
  }

  const entries = await fs.readdir(located.runDirectory, { withFileTypes: true });
  let journal = null;
  let journalPath = null;
  let manifest = null;
  let manifestPath = null;
  const recommendationFiles = [];

  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.json') {
      continue;
    }

    const filePath = path.join(located.runDirectory, entry.name);
    const parsed = await readJson(filePath);
    const artifactType = parsed?.metadata?.artifactType;

    if (artifactType === 'run-journal') {
      journal = parsed;
      journalPath = filePath;
    } else if (artifactType === 'run-manifest') {
      manifest = parsed;
      manifestPath = filePath;
    } else if (artifactType === 'run-recommendations') {
      recommendationFiles.push({
        filePath,
        artifact: parsed
      });
    }
  }

  if (!journal || !manifest || !journalPath || !manifestPath) {
    throw new Error(`Run package "${runId}" is missing its journal or manifest artifact.`);
  }

  return {
    ...located,
    journal,
    journalPath,
    manifest,
    manifestPath,
    recommendationFiles
  };
}

export async function updateRunPackageArtifacts(runPackage) {
  await writeJson(runPackage.journalPath, runPackage.journal);
  await writeJson(runPackage.manifestPath, runPackage.manifest);
}

export function resolveLifecycleTargetRoot(lifecycleState) {
  if (lifecycleState === 'archive') {
    return archiveRoot;
  }

  return canonicalRoot;
}

export async function moveRunPackage(runPackage, lifecycleState) {
  const targetRoot = resolveLifecycleTargetRoot(lifecycleState);
  const targetDirectory = resolveRunDirectory(targetRoot, runPackage.runId);

  await fs.mkdir(path.dirname(targetDirectory), { recursive: true });

  if (runPackage.runDirectory !== targetDirectory) {
    if (await pathExists(targetDirectory)) {
      throw new Error(
        `Refusing to overwrite existing run package at ${targetDirectory}. Archive or rename the existing package first.`
      );
    }

    await fs.rename(runPackage.runDirectory, targetDirectory);
  }

  runPackage.rootPath = targetRoot;
  runPackage.rootKind = classifyRoot(targetRoot);
  runPackage.runDirectory = targetDirectory;
  runPackage.journalPath = path.join(targetDirectory, path.basename(runPackage.journalPath));
  runPackage.manifestPath = path.join(targetDirectory, path.basename(runPackage.manifestPath));

  return runPackage;
}

export function resolveRunClipPaths(runPackage) {
  return (runPackage.manifest.clipFiles ?? []).map((relativePath) =>
    path.join(runPackage.runDirectory, relativePath)
  );
}

export function resolveRunStillPaths(runPackage) {
  return (runPackage.manifest.stillFiles ?? []).map((relativePath) =>
    path.join(runPackage.runDirectory, relativePath)
  );
}

export async function copyFileIntoRunPackage(runPackage, sourcePath, destinationFileName) {
  const resolvedSourcePath = path.resolve(workspaceRoot, sourcePath);
  const targetPath = path.join(runPackage.runDirectory, destinationFileName);

  await fs.copyFile(resolvedSourcePath, targetPath);
  return targetPath;
}
