import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const toAbsolute = (relativePath) => path.join(repoRoot, relativePath);

async function exists(relativePath) {
  try {
    await fs.access(toAbsolute(relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readText(relativePath) {
  return fs.readFile(toAbsolute(relativePath), 'utf8');
}

async function listFiles(directory) {
  const root = toAbsolute(directory);
  const files = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else {
        files.push(path.relative(repoRoot, absolute).replaceAll(path.sep, '/'));
      }
    }
  }

  await walk(root);
  return files;
}

const failures = [];

const retiredFiles = [
  'src/ui/ActivationOverlay.tsx',
  'src/ui/SettingsPanel.tsx'
];

for (const file of retiredFiles) {
  if (await exists(file)) {
    failures.push(`${file} still exists. The current shell must use ShowLaunchSurface, ShowHud, BackstagePanel, and DiagnosticsOverlay.`);
  }
}

const canonicalFiles = [
  'src/ui/ShowLaunchSurface.tsx',
  'src/ui/ShowHud.tsx',
  'src/ui/BackstagePanel.tsx',
  'src/debug/DiagnosticsOverlay.tsx'
];

for (const file of canonicalFiles) {
  if (!(await exists(file))) {
    failures.push(`${file} is missing. It is part of the current operator surface contract.`);
  }
}

const css = await readText('src/styles/index.css');
const forbiddenCssPatterns = [
  /\.activation-/,
  /\.settings-(panel|preset|chip|action|field|select|meta|health|segmented|eyebrow|list|section|note|actions)\b/,
  /\.setting-row\b/,
  /\.quick-dock\b/,
  /\.quick-preset\b/,
  /\.top-chrome\b/,
  /\.status-pill\b/,
  /\.fullscreen-button\b/,
  /\.settings-button\b/
];

for (const pattern of forbiddenCssPatterns) {
  if (pattern.test(css)) {
    failures.push(`Retired CSS selector matched ${pattern}. Remove dead launch/settings/top-chrome styling.`);
  }
}

const sourceFiles = (await listFiles('src')).filter((file) => /\.(ts|tsx|css)$/.test(file));
const forbiddenSourcePatterns = [
  /\bActivationOverlay\b/,
  /\bSettingsPanel\b/,
  /activation-/,
  /settings-panel/,
  /quick-dock/,
  /quick-preset/,
  /top-chrome/,
  /status-pill/
];

for (const file of sourceFiles) {
  const text = await readText(file);
  for (const pattern of forbiddenSourcePatterns) {
    if (pattern.test(text)) {
      failures.push(`${file} still references retired surface pattern ${pattern}.`);
    }
  }
}

const app = await readText('src/app/App.tsx');
for (const token of ['ShowLaunchSurface', 'ShowHud', 'BackstagePanel', 'DiagnosticsOverlay']) {
  if (!app.includes(token)) {
    failures.push(`src/app/App.tsx does not reference canonical surface ${token}.`);
  }
}

const backstage = await readText('src/ui/BackstagePanel.tsx');
if (!backstage.includes('Autonomous Director Console')) {
  failures.push('BackstagePanel is missing the read-only Autonomous Director Console surface.');
}
if (backstage.includes('Semantic Steering') || backstage.includes('director-slider')) {
  failures.push('BackstagePanel still exposes the retired normal-use steering slider surface.');
}

const launch = await readText('src/ui/ShowLaunchSurface.tsx');
if (!launch.includes('Proof Mission locks Advanced controls')) {
  failures.push('ShowLaunchSurface is missing the Proof Mission lock contract copy.');
}

if (failures.length > 0) {
  console.error('Legacy surface audit failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Legacy surface audit passed.');
