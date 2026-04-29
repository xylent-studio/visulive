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

function isRecoverableMoveError(error) {
  return (
    error?.code === 'EPERM' ||
    error?.code === 'EXDEV' ||
    error?.code === 'EBUSY'
  );
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

  return loadRunPackageFromDirectory(located.runDirectory, located);
}

export async function loadRunPackageFromDirectory(runDirectory, located = null) {
  const resolvedRunDirectory = path.resolve(workspaceRoot, runDirectory);
  const runId = located?.runId ?? path.basename(resolvedRunDirectory);
  const rootPath = located?.rootPath ?? path.dirname(path.dirname(resolvedRunDirectory));
  const rootKind = located?.rootKind ?? classifyRoot(rootPath);

  const entries = await fs.readdir(resolvedRunDirectory, { withFileTypes: true });
  let journal = null;
  let journalPath = null;
  let manifest = null;
  let manifestPath = null;
  const recommendationFiles = [];

  for (const entry of entries) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.json') {
      continue;
    }

    const filePath = path.join(resolvedRunDirectory, entry.name);
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
    runId,
    rootPath,
    rootKind,
    runDirectory: resolvedRunDirectory,
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

  for (const recommendationFile of runPackage.recommendationFiles ?? []) {
    await writeJson(recommendationFile.filePath, recommendationFile.artifact);
  }
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

    try {
      await fs.rename(runPackage.runDirectory, targetDirectory);
    } catch (error) {
      if (!isRecoverableMoveError(error)) {
        throw error;
      }

      await fs.cp(runPackage.runDirectory, targetDirectory, {
        recursive: true,
        errorOnExist: true,
        force: false
      });
      await fs.rm(runPackage.runDirectory, {
        recursive: true,
        force: false,
        maxRetries: 3,
        retryDelay: 250
      });
    }
  }

  runPackage.rootPath = targetRoot;
  runPackage.rootKind = classifyRoot(targetRoot);
  runPackage.runDirectory = targetDirectory;
  runPackage.journalPath = path.join(targetDirectory, path.basename(runPackage.journalPath));
  runPackage.manifestPath = path.join(targetDirectory, path.basename(runPackage.manifestPath));
  runPackage.recommendationFiles = (runPackage.recommendationFiles ?? []).map(
    (recommendationFile) => ({
      ...recommendationFile,
      filePath: path.join(targetDirectory, path.basename(recommendationFile.filePath))
    })
  );

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

export async function validateRunPackageIntegrity(runPackage) {
  const issues = [];
  const checkedAt = new Date().toISOString();
  const addIssue = (id, severity, reason, fileName = undefined) => {
    issues.push({
      id,
      severity,
      reason,
      ...(fileName ? { fileName } : {})
    });
  };
  const journalRunId = runPackage.journal?.metadata?.runId;
  const manifestRunId = runPackage.manifest?.metadata?.runId;

  if (journalRunId !== runPackage.runId) {
    addIssue(
      'journal-run-id-mismatch',
      'fail',
      `Journal run id "${journalRunId ?? 'missing'}" does not match package "${runPackage.runId}".`
    );
  }

  if (manifestRunId !== runPackage.runId) {
    addIssue(
      'manifest-run-id-mismatch',
      'fail',
      `Manifest run id "${manifestRunId ?? 'missing'}" does not match package "${runPackage.runId}".`
    );
  }

  if (
    runPackage.manifest?.journalFileName &&
    runPackage.manifest.journalFileName !== path.basename(runPackage.journalPath)
  ) {
    addIssue(
      'journal-file-mismatch',
      'fail',
      `Manifest journalFileName "${runPackage.manifest.journalFileName}" does not match ${path.basename(runPackage.journalPath)}.`
    );
  }

  const clipFiles = runPackage.manifest?.clipFiles ?? [];
  const stillFiles = runPackage.manifest?.stillFiles ?? [];
  const journalClips = runPackage.journal?.clips ?? [];
  const journalStills = runPackage.journal?.checkpointStills ?? [];
  const duplicateClipFiles = clipFiles.filter(
    (relativePath, index) => clipFiles.indexOf(relativePath) !== index
  );
  const duplicateStillFiles = stillFiles.filter(
    (relativePath, index) => stillFiles.indexOf(relativePath) !== index
  );

  for (const relativePath of new Set(duplicateClipFiles)) {
    addIssue(
      'duplicate-clip-file',
      'fail',
      `Referenced clip ${relativePath} appears more than once in the manifest.`,
      relativePath
    );
  }

  for (const relativePath of new Set(duplicateStillFiles)) {
    addIssue(
      'duplicate-still-file',
      'fail',
      `Referenced still ${relativePath} appears more than once in the manifest.`,
      relativePath
    );
  }

  if (clipFiles.length !== journalClips.length) {
    addIssue(
      'clip-count-mismatch',
      'fail',
      `Manifest has ${clipFiles.length} clip files but journal has ${journalClips.length} clip references.`
    );
  }

  if (stillFiles.length !== journalStills.length) {
    addIssue(
      'still-count-mismatch',
      'fail',
      `Manifest has ${stillFiles.length} still files but journal has ${journalStills.length} still references.`
    );
  }

  if (runPackage.manifest?.metadata?.clipCount !== clipFiles.length) {
    addIssue(
      'manifest-clip-count-mismatch',
      'fail',
      `Manifest metadata clipCount=${runPackage.manifest?.metadata?.clipCount ?? 'missing'} does not match ${clipFiles.length}.`
    );
  }

  if (runPackage.manifest?.metadata?.stillCount !== stillFiles.length) {
    addIssue(
      'manifest-still-count-mismatch',
      'fail',
      `Manifest metadata stillCount=${runPackage.manifest?.metadata?.stillCount ?? 'missing'} does not match ${stillFiles.length}.`
    );
  }

  for (const relativePath of clipFiles) {
    const filePath = path.join(runPackage.runDirectory, relativePath);

    if (!(await pathExists(filePath))) {
      addIssue(
        'missing-clip-file',
        'fail',
        `Referenced clip ${relativePath} does not exist in the run package.`,
        relativePath
      );
      continue;
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.size <= 0) {
        addIssue(
          'empty-clip-file',
          'fail',
          `Referenced clip ${relativePath} is empty.`,
          relativePath
        );
        continue;
      }

      const parsed = await readJson(filePath);
      if (!parsed?.metadata?.runId && parsed?.version >= 3) {
        addIssue(
          'clip-run-id-missing',
          'fail',
          `Referenced v3 clip ${relativePath} is missing metadata.runId.`,
          relativePath
        );
      } else if (parsed?.metadata?.runId && parsed.metadata.runId !== runPackage.runId) {
        addIssue(
          'clip-run-id-mismatch',
          'fail',
          `Referenced clip ${relativePath} belongs to run ${parsed.metadata.runId}, not ${runPackage.runId}.`,
          relativePath
        );
      }
    } catch (error) {
      addIssue(
        'unreadable-clip-file',
        'fail',
        `Referenced clip ${relativePath} could not be parsed: ${error instanceof Error ? error.message : 'unknown error'}.`,
        relativePath
      );
    }
  }

  for (const relativePath of stillFiles) {
    const filePath = path.join(runPackage.runDirectory, relativePath);

    if (!(await pathExists(filePath))) {
      addIssue(
        'missing-still-file',
        'fail',
        `Referenced still ${relativePath} does not exist in the run package.`,
        relativePath
      );
      continue;
    }

    try {
      const stat = await fs.stat(filePath);
      if (stat.size <= 0) {
        addIssue(
          'empty-still-file',
          'fail',
          `Referenced still ${relativePath} is empty.`,
          relativePath
        );
      }
    } catch (error) {
      addIssue(
        'unreadable-still-file',
        'fail',
        `Referenced still ${relativePath} could not be read: ${error instanceof Error ? error.message : 'unknown error'}.`,
        relativePath
      );
    }
  }

  const validity = runPackage.journal?.metadata?.proofValidity;
  const eligibility = runPackage.journal?.metadata?.proofMissionEligibility;

  if (validity?.currentProofEligible && eligibility?.currentProofEligible !== true) {
    addIssue(
      'eligibility-validity-disagree',
      'fail',
      'Run is marked currentProofEligible without an eligible Proof Mission verdict.'
    );
  }

  if ((validity?.invalidations ?? []).length > 0 && validity?.currentProofEligible) {
    addIssue(
      'invalidated-current-proof',
      'fail',
      'Run has invalidations but is marked currentProofEligible.'
    );
  }

  if (
    runPackage.journal?.metadata?.proofRunState === 'finalized' &&
    runPackage.manifest?.metadata?.proofRunState !== 'finalized'
  ) {
    addIssue(
      'lifecycle-state-disagreement',
      'fail',
      'Journal is finalized but manifest does not agree.'
    );
  }

  const hasFailures = issues.some((issue) => issue.severity === 'fail');
  const hasWarnings = issues.some((issue) => issue.severity === 'warn');

  return {
    verdict: hasFailures ? 'fail' : hasWarnings ? 'warn' : 'pass',
    checkedAt,
    clipReferenceCount: clipFiles.length,
    stillReferenceCount: stillFiles.length,
    manifestClipCount: clipFiles.length,
    manifestStillCount: stillFiles.length,
    issues
  };
}

export async function copyFileIntoRunPackage(runPackage, sourcePath, destinationFileName) {
  const resolvedSourcePath = path.resolve(workspaceRoot, sourcePath);
  const targetPath = path.join(runPackage.runDirectory, destinationFileName);

  await fs.copyFile(resolvedSourcePath, targetPath);
  return targetPath;
}
