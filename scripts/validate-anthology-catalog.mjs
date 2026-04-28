import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const catalogPath = path.join(
  repoRoot,
  'src',
  'scene',
  'direction',
  'anthologyCatalog.ts'
);

const capabilityMapPath = path.join(
  repoRoot,
  'docs',
  'anthology-capability-map.md'
);

const requiredDocs = [
  'docs/anthology-mastery-charter.md',
  'docs/graduation-rubric.md',
  'docs/runtime-extraction-scoreboard.md',
  'docs/mastery-review-system.md',
  'docs/anthology-capability-map.md',
  'docs/flagship-reference-atlas.md',
  'docs/reference-principle-action-matrix.md',
  'docs/proof-pack-workflow.md',
  'docs/agent-workstreams.md',
  'docs/specialist-brief-template.md'
];

const markdownDocsToScan = [
  'README.md',
  'AGENTS.md',
  'docs/README.md',
  'docs/documentation-operations.md',
  'docs/current-program.md',
  'docs/project-status.md',
  'docs/preserved-editions.md',
  'docs/product-charter.md',
  'docs/anthology-mastery-charter.md',
  'docs/graduation-rubric.md',
  'docs/runtime-extraction-scoreboard.md',
  'docs/mastery-review-system.md',
  'docs/anthology-capability-map.md',
  'docs/flagship-reference-atlas.md',
  'docs/reference-principle-action-matrix.md',
  'docs/proof-pack-workflow.md',
  'docs/agent-workstreams.md',
  'docs/specialist-brief-template.md'
];

const requiredMentions = [
  {
    file: 'README.md',
    targets: [
      'docs/anthology-mastery-charter.md',
      'docs/graduation-rubric.md',
      'docs/runtime-extraction-scoreboard.md',
      'docs/mastery-review-system.md'
    ]
  },
  {
    file: 'docs/README.md',
    targets: [
      'docs/anthology-mastery-charter.md',
      'docs/graduation-rubric.md',
      'docs/runtime-extraction-scoreboard.md',
      'docs/mastery-review-system.md'
    ]
  },
  {
    file: 'docs/documentation-operations.md',
    targets: [
      'docs/anthology-mastery-charter.md',
      'docs/graduation-rubric.md',
      'docs/runtime-extraction-scoreboard.md',
      'docs/mastery-review-system.md'
    ]
  },
  {
    file: 'docs/current-program.md',
    targets: [
      'docs/anthology-mastery-charter.md',
      'docs/graduation-rubric.md',
      'docs/runtime-extraction-scoreboard.md'
    ]
  },
  {
    file: 'docs/project-status.md',
    targets: [
      'docs/anthology-mastery-charter.md',
      'docs/graduation-rubric.md',
      'docs/runtime-extraction-scoreboard.md',
      'docs/mastery-review-system.md'
    ]
  },
  {
    file: 'docs/product-charter.md',
    targets: ['docs/anthology-mastery-charter.md']
  },
  {
    file: 'AGENTS.md',
    targets: [
      'docs/anthology-mastery-charter.md',
      'docs/anthology-capability-map.md',
      'docs/runtime-extraction-scoreboard.md',
      'docs/graduation-rubric.md'
    ]
  }
];

const validCategories = new Set([
  'hero',
  'world',
  'consequence',
  'lighting',
  'particles',
  'compositor',
  'memory',
  'music-semantics'
]);

const validStatuses = new Set(['lab', 'frontier', 'flagship', 'retired']);
const validRuntimeOwnershipStatuses = new Set([
  'legacy-monolith',
  'partial-system',
  'owned-system'
]);
const validOwnerLanes = new Set([
  'Hero Ecology',
  'World Grammar / Mutation',
  'Consequence / Aftermath / Post',
  'Lighting / Cinematography',
  'Particles / Fields',
  'Mixed Media / Compositor / Content',
  'Motif / Memory',
  'Music Semantics / Conductor',
  'Evidence / Proof / Analyzer',
  'Operator UX / Trust',
  'Runtime / Ownership Extraction'
]);

const errors = [];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensure(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeMarkdownTarget(sourceFile, rawTarget) {
  let target = rawTarget.trim().replace(/^<|>$/g, '');
  const hashIndex = target.indexOf('#');
  if (hashIndex >= 0) {
    target = target.slice(0, hashIndex);
  }
  const lineRefMatch = target.match(/^(.*\.[A-Za-z0-9]+):\d+$/);
  if (lineRefMatch) {
    target = lineRefMatch[1];
  }
  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:') ||
    target.startsWith('#')
  ) {
    return null;
  }
  if (/^[A-Za-z]:[\\/]/.test(target)) {
    return path.normalize(target);
  }
  return path.resolve(path.dirname(sourceFile), target);
}

async function loadCatalog() {
  const source = fs.readFileSync(catalogPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023
    },
    fileName: catalogPath
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(
    outputText,
    'utf8'
  ).toString('base64')}`;
  const imported = await import(moduleUrl);
  return imported.anthologyCatalog;
}

function validateCatalog(catalog) {
  ensure(Array.isArray(catalog), 'Anthology catalog must export an array.');
  if (!Array.isArray(catalog)) {
    return;
  }

  const ids = new Set();

  for (const family of catalog) {
    ensure(nonEmptyString(family.id), 'Each family must have a non-empty id.');
    ensure(
      !ids.has(family.id),
      `Anthology catalog contains a duplicate family id: ${family.id}`
    );
    ids.add(family.id);

    ensure(
      validCategories.has(family.category),
      `Family ${family.id} has an invalid category: ${family.category}`
    );
    ensure(
      validStatuses.has(family.status),
      `Family ${family.id} has an invalid status: ${family.status}`
    );
    ensure(
      validOwnerLanes.has(family.intendedOwnerLane),
      `Family ${family.id} has an invalid owner lane: ${family.intendedOwnerLane}`
    );
    ensure(
      validRuntimeOwnershipStatuses.has(family.runtimeOwnershipStatus),
      `Family ${family.id} has an invalid runtime ownership status: ${family.runtimeOwnershipStatus}`
    );
    ensure(
      nonEmptyString(family.label),
      `Family ${family.id} must have a non-empty label.`
    );
    ensure(
      nonEmptyString(family.runtimeOwner),
      `Family ${family.id} must name a runtime owner.`
    );
    ensure(
      nonEmptyString(family.cueRole),
      `Family ${family.id} must define a cue role.`
    );
    ensure(
      nonEmptyString(family.nextTarget),
      `Family ${family.id} must define a next target.`
    );
    ensure(
      nonEmptyString(family.nextDependency),
      `Family ${family.id} must define a next dependency.`
    );
    ensure(
      nonEmptyString(family.blockingDependency),
      `Family ${family.id} must define a blocking dependency.`
    );
    ensure(
      nonEmptyString(family.lastMeaningfulPass),
      `Family ${family.id} must record the last meaningful pass.`
    );
    ensure(
      nonEmptyString(family.currentBiggestFailureMode),
      `Family ${family.id} must record its current biggest failure mode.`
    );
    ensure(
      nonEmptyString(family.proofStatus),
      `Family ${family.id} must record its proof status.`
    );

    for (const [profileName, profile] of [
      ['quietBehavior', family.quietBehavior],
      ['impactBehavior', family.impactBehavior],
      ['aftermathBehavior', family.aftermathBehavior]
    ]) {
      ensure(
        profile && nonEmptyString(profile.summary),
        `Family ${family.id} is missing ${profileName}.summary`
      );
      ensure(
        profile && nonEmptyString(profile.authorityMode),
        `Family ${family.id} is missing ${profileName}.authorityMode`
      );
      ensure(
        profile && nonEmptyString(profile.roomRead),
        `Family ${family.id} is missing ${profileName}.roomRead`
      );
      ensure(
        profile &&
          Array.isArray(profile.proofSignals) &&
          profile.proofSignals.length > 0,
        `Family ${family.id} must define proof signals for ${profileName}`
      );
    }

    ensure(
      Array.isArray(family.absenceRules) && family.absenceRules.length > 0,
      `Family ${family.id} must define at least one absence rule.`
    );
    ensure(
      family.safeTierExpectation &&
        nonEmptyString(family.safeTierExpectation.requirement) &&
        Array.isArray(family.safeTierExpectation.budgetNotes) &&
        family.safeTierExpectation.budgetNotes.length > 0,
      `Family ${family.id} must define a safe-tier expectation with budget notes.`
    );
    ensure(
      Array.isArray(family.proofRequirements) &&
        family.proofRequirements.length > 0,
      `Family ${family.id} must define proof requirements.`
    );

    if (family.status === 'flagship') {
      ensure(
        family.safeTierExpectation?.targetTier === 'webgpu-safe',
        `Flagship family ${family.id} must target webgpu-safe explicitly.`
      );
      ensure(
        family.proofRequirements.some((requirement) =>
          ['safe-tier', 'no-touch'].includes(requirement.proofKind)
        ),
        `Flagship family ${family.id} must include safe-tier and/or no-touch proof requirements.`
      );
    }
  }
}

function validateRequiredDocs() {
  for (const relativePath of requiredDocs) {
    ensure(
      fs.existsSync(path.join(repoRoot, relativePath)),
      `Required mastery document is missing: ${relativePath}`
    );
  }
}

function validateMarkdownLinks() {
  const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const relativePath of markdownDocsToScan) {
    const absolutePath = path.join(repoRoot, relativePath);
    ensure(fs.existsSync(absolutePath), `Missing markdown file: ${relativePath}`);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    for (const match of content.matchAll(markdownLinkPattern)) {
      const resolved = normalizeMarkdownTarget(absolutePath, match[1]);
      if (!resolved) {
        continue;
      }
      ensure(
        fs.existsSync(resolved),
        `${relativePath} links to a missing local file: ${match[1]}`
      );
    }
  }
}

function validateRequiredMentions() {
  for (const requirement of requiredMentions) {
    const content = readFile(requirement.file);
    for (const target of requirement.targets) {
      ensure(
        content.includes(target),
        `${requirement.file} must reference ${target}`
      );
    }
  }
}

function validateCapabilityMapAgainstCatalog(catalog) {
  const capabilityMap = fs.readFileSync(capabilityMapPath, 'utf8');

  for (const family of catalog) {
    const sectionMatch = capabilityMap.match(
      new RegExp(
        `### ${escapeRegex(family.label)}([\\s\\S]*?)(?=\\n### |\\n## |$)`
      )
    );
    ensure(
      Boolean(sectionMatch),
      `Anthology capability map is missing a section for ${family.label}`
    );
    if (!sectionMatch) {
      continue;
    }

    const section = sectionMatch[1];
    const maturityMatch = section.match(/- current maturity: `([^`]+)`/);
    ensure(
      Boolean(maturityMatch),
      `Anthology capability map section for ${family.label} is missing a standardized current maturity field.`
    );
    if (maturityMatch) {
      ensure(
        maturityMatch[1] === family.status,
        `Anthology capability map status mismatch for ${family.label}: expected ${family.status}, found ${maturityMatch[1]}`
      );
    }
  }
}

async function main() {
  validateRequiredDocs();
  const catalog = await loadCatalog();
  validateCatalog(catalog);
  validateRequiredMentions();
  validateMarkdownLinks();
  validateCapabilityMapAgainstCatalog(catalog);

  if (errors.length > 0) {
    console.error('Anthology validation failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Anthology validation passed for ${catalog.length} family declarations and ${requiredDocs.length} mastery docs.`
  );
}

await main();
