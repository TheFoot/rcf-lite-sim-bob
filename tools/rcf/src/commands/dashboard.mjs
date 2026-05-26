import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function dashboard(args) {
  const port = args.includes('--port') ? args[args.indexOf('--port') + 1] : '3001';
  const root = process.cwd();
  const serverPath = join(__dirname, '..', '..', '..', 'dashboard', 'server.mjs');

  const child = spawn('node', [serverPath, '--root', root, '--port', port], {
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(`Failed to start dashboard: ${err.message}`);
    process.exit(2);
  });
}
