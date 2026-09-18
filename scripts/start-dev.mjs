import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const port = 3000;
const host = '127.0.0.1';
const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));

function isPortOpen() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

if (await isPortOpen()) {
  console.log(`NeuroPathshala is already running at http://localhost:${port}/`);
  process.exit(0);
}

const vite = spawn(process.execPath, [viteBin, '--port=3000', '--strictPort', '--host=0.0.0.0'], {
  cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  stdio: 'inherit'
});

vite.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
