import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const serverPath = fileURLToPath(new URL('./server.js', import.meta.url));
let child;
let retry;
let stopping = false;
let retryDelay = 2_000;

function start() {
  const started = Date.now();
  child = spawn(process.execPath, [serverPath], { stdio: 'inherit' });
  console.log(`Starting counter worker ${child.pid}`);
  child.once('error', error => console.error('Could not start counter:', error.message));
  child.once('close', (code, signal) => {
    child = undefined;
    if (stopping) return;

    if (Date.now() - started >= 60_000) retryDelay = 2_000;
    console.error(`Counter exited (${signal || code}); restarting in ${retryDelay / 1000}s`);
    retry = setTimeout(start, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30_000);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    clearTimeout(retry);
    if (child) child.kill(signal);
  });
}

start();
