import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
) as { version?: string };

function readGitOutput(command: string, fallback: string): string {
  try {
    const output = execSync(command, {
      cwd: workspaceRoot,
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim();
    return output || fallback;
  } catch {
    return fallback;
  }
}

const buildInfo = {
  version: packageJson.version ?? '0.0.0',
  commit: readGitOutput('git rev-parse --short HEAD', 'unknown'),
  branch: readGitOutput('git branch --show-current', 'unknown'),
  builtAt: new Date().toISOString(),
  lane:
    process.env.VISULIVE_RELEASE_LANE === 'stable' ||
    process.env.VISULIVE_RELEASE_LANE === 'frontier'
      ? process.env.VISULIVE_RELEASE_LANE
      : 'dev',
  proofStatus:
    process.env.VISULIVE_PROOF_STATUS === 'proof-pack' ||
    process.env.VISULIVE_PROOF_STATUS === 'promoted'
      ? process.env.VISULIVE_PROOF_STATUS
      : 'unverified',
  dirty: readGitOutput('git status --porcelain', '') !== ''
};

export default defineConfig({
  define: {
    __VISULIVE_BUILD__: JSON.stringify(buildInfo)
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }

          if (
            id.includes('/src/engine/') ||
            id.includes('/src/scene/')
          ) {
            return 'visual-runtime';
          }
        }
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  }
});
