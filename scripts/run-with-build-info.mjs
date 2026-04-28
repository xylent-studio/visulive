import { spawn } from 'node:child_process';

function quoteWindowsArg(value) {
  if (!/[\s"]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

function parseArgs(argv) {
  let lane = 'dev';
  let proof = 'unverified';
  let separatorIndex = argv.indexOf('--');

  if (separatorIndex < 0) {
    separatorIndex = argv.length;
  }

  for (let index = 0; index < separatorIndex; index += 1) {
    const arg = argv[index];

    if (arg === '--lane') {
      lane = argv[index + 1] ?? lane;
      index += 1;
      continue;
    }

    if (arg === '--proof') {
      proof = argv[index + 1] ?? proof;
      index += 1;
    }
  }

  const command = argv.slice(separatorIndex + 1);

  if (command.length === 0) {
    throw new Error('Expected a command after "--".');
  }

  return {
    lane,
    proof,
    command
  };
}

async function main() {
  const { lane, proof, command } = parseArgs(process.argv.slice(2));
  const env = {
    ...process.env,
    VISULIVE_RELEASE_LANE: lane,
    VISULIVE_PROOF_STATUS: proof
  };
  const child =
    process.platform === 'win32'
      ? spawn(
          process.env.ComSpec ?? 'cmd.exe',
          ['/d', '/s', '/c', command.map(quoteWindowsArg).join(' ')],
          {
            stdio: 'inherit',
            shell: false,
            env
          }
        )
      : spawn(command[0], command.slice(1), {
          stdio: 'inherit',
          shell: false,
          env
        });

  await new Promise((resolve, reject) => {
    child.once('exit', (code) => {
      if ((code ?? 0) !== 0) {
        reject(new Error(`Command exited with code ${code ?? 1}.`));
        return;
      }

      resolve(undefined);
    });
    child.once('error', reject);
  });
}

await main();
