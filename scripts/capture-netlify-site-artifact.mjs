import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    siteId: '',
    deployId: '',
    outputDir: '',
    publicUrl: '',
    deployUrl: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case '--site-id':
        args.siteId = next ?? args.siteId;
        index += 1;
        break;
      case '--deploy-id':
        args.deployId = next ?? args.deployId;
        index += 1;
        break;
      case '--output-dir':
        args.outputDir = next ?? args.outputDir;
        index += 1;
        break;
      case '--public-url':
        args.publicUrl = next ?? args.publicUrl;
        index += 1;
        break;
      case '--deploy-url':
        args.deployUrl = next ?? args.deployUrl;
        index += 1;
        break;
      default:
        break;
    }
  }

  if (!args.siteId) {
    throw new Error('Expected --site-id <value>.');
  }

  if (!args.outputDir) {
    throw new Error('Expected --output-dir <value>.');
  }

  return args;
}

function resolveRepoPath(relativePath) {
  return path.resolve(repoRoot, relativePath);
}

async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

function relativeToRepo(targetPath) {
  return path.relative(repoRoot, targetPath).replace(/\\/g, '/');
}

async function readNetlifyToken() {
  if (process.env.NETLIFY_AUTH_TOKEN) {
    return process.env.NETLIFY_AUTH_TOKEN;
  }

  const configPath = path.join(
    process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
    'Netlify',
    'Config',
    'config.json'
  );
  const raw = await fs.readFile(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  const users = Object.values(parsed.users ?? {});
  const token = users.find((user) => user?.auth?.token)?.auth?.token;

  if (!token) {
    throw new Error(`Could not find a Netlify auth token in ${configPath}.`);
  }

  return token;
}

async function apiRequest(token, requestPath) {
  const response = await fetch(`https://api.netlify.com/api/v1${requestPath}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(
      `Netlify API request failed for ${requestPath} with ${response.status} ${response.statusText}.`
    );
  }

  return response.json();
}

async function shaForBuffer(buffer, algorithm) {
  const hash = crypto.createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
}

function extractReferencedPaths(indexHtml) {
  const matches = new Set(['/index.html']);
  const pattern =
    /(?:src|href)=["'](\/[^"']+)["']|url\((\/[^)]+)\)|new URL\(["'](\/[^"']+)["']/g;
  for (const match of indexHtml.matchAll(pattern)) {
    const requestPath = match[1] ?? match[2] ?? match[3];
    if (requestPath) {
      matches.add(requestPath);
    }
  }
  return [...matches];
}

async function downloadFile(baseUrl, requestPath) {
  const response = await fetch(new URL(requestPath, baseUrl));
  if (!response.ok) {
    const error = new Error(
      `Failed to download ${requestPath} from ${baseUrl}: ${response.status} ${response.statusText}.`
    );
    error.status = response.status;
    throw error;
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = await readNetlifyToken();
  const outputRoot = resolveRepoPath(args.outputDir);
  const distRoot = path.join(outputRoot, 'site-dist');
  const metadataRoot = path.join(outputRoot, 'metadata');

  const site = await apiRequest(token, `/sites/${args.siteId}`);
  const deploy = site.published_deploy ?? site.published_branch ?? null;
  const activeDeployId = deploy?.id ?? site.deploy_id ?? null;

  if (!activeDeployId) {
    throw new Error(`Site ${args.siteId} does not have a published deploy id.`);
  }

  if (args.deployId && args.deployId !== activeDeployId) {
    throw new Error(
      `Requested deploy ${args.deployId} does not match the published deploy ${activeDeployId}.`
    );
  }

  const files = await apiRequest(token, `/sites/${args.siteId}/files`);
  const publicUrl = args.publicUrl || site.ssl_url || site.url;
  const deployUrl =
    args.deployUrl ||
    deploy?.deploy_ssl_url ||
    deploy?.deploy_url ||
    site.deploy_ssl_url ||
    site.deploy_url ||
    publicUrl;

  await ensureDir(distRoot);
  await ensureDir(metadataRoot);

  const fileByLowerPath = new Map(
    files.map((entry) => [String(entry.path).toLowerCase(), entry])
  );

  const downloadedEntries = [];
  const downloadedPaths = new Set();

  async function capturePath(requestPath, options = {}) {
    const { required = true } = options;
    const normalizedRequestPath = requestPath.startsWith('/')
      ? requestPath
      : `/${requestPath}`;
    const metadata =
      fileByLowerPath.get(normalizedRequestPath.toLowerCase()) ?? null;
    let buffer;
    try {
      buffer = await downloadFile(deployUrl, normalizedRequestPath);
    } catch (error) {
      if (!required && error?.status === 404) {
        downloadedEntries.push({
          requestPath: normalizedRequestPath,
          apiPath: metadata?.path ?? null,
          size: metadata?.size ?? null,
          netlifySha1: metadata?.sha ?? null,
          downloadedSha1: null,
          downloadedSha256: null,
          sha1MatchesNetlify: null,
          repoPath: null,
          unavailableFromDeployUrl: true
        });
        downloadedPaths.add(normalizedRequestPath.toLowerCase());
        return null;
      }

      throw error;
    }
    const outputPath = path.join(
      distRoot,
      normalizedRequestPath.replace(/^\//, '').replace(/\//g, path.sep)
    );

    await ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, buffer);

    const sha1 = await shaForBuffer(buffer, 'sha1');
    const sha256 = await shaForBuffer(buffer, 'sha256');

    downloadedEntries.push({
      requestPath: normalizedRequestPath,
      apiPath: metadata?.path ?? null,
      size: buffer.length,
      netlifySha1: metadata?.sha ?? null,
      downloadedSha1: sha1,
      downloadedSha256: sha256,
      sha1MatchesNetlify: metadata?.sha ? metadata.sha === sha1 : null,
      repoPath: relativeToRepo(outputPath)
    });
    downloadedPaths.add(normalizedRequestPath.toLowerCase());

    return buffer;
  }

  const indexBuffer = await capturePath('/index.html');
  const indexHtml = indexBuffer.toString('utf8');

  for (const requestPath of extractReferencedPaths(indexHtml)) {
    if (requestPath === '/index.html') {
      continue;
    }
    if (downloadedPaths.has(requestPath.toLowerCase())) {
      continue;
    }
    await capturePath(requestPath);
  }

  for (const entry of files) {
    if (downloadedPaths.has(String(entry.path).toLowerCase())) {
      continue;
    }
    await capturePath(entry.path, { required: false });
  }

  const siteMetadata = {
    capturedAt: new Date().toISOString(),
    site: {
      id: site.id,
      name: site.name,
      url: publicUrl,
      sslUrl: site.ssl_url ?? null,
      customDomain: site.custom_domain ?? null,
      deployId: activeDeployId
    },
    deploy: {
      id: activeDeployId,
      createdAt: deploy?.created_at ?? null,
      publishedAt: deploy?.published_at ?? null,
      deploySslUrl: deploy?.deploy_ssl_url ?? deployUrl,
      context: deploy?.context ?? null,
      framework: deploy?.framework ?? null,
      manualDeploy: deploy?.manual_deploy ?? null
    }
  };

  await fs.writeFile(
    path.join(metadataRoot, 'site-metadata.json'),
    `${JSON.stringify(siteMetadata, null, 2)}\n`,
    'utf8'
  );
  await fs.writeFile(
    path.join(metadataRoot, 'site-files.json'),
    `${JSON.stringify(downloadedEntries, null, 2)}\n`,
    'utf8'
  );

  const badEntries = downloadedEntries.filter(
    (entry) => entry.sha1MatchesNetlify === false
  );
  if (badEntries.length > 0) {
    throw new Error(
      `Downloaded files failed Netlify SHA verification: ${badEntries
        .map((entry) => entry.requestPath)
        .join(', ')}`
    );
  }

  console.log(
    `Captured ${downloadedEntries.length} files from ${site.name} (${activeDeployId}) into ${relativeToRepo(outputRoot)}.`
  );
}

await main();
