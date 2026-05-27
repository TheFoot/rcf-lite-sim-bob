import { createServer } from 'node:net';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => { srv.close(); resolve(true); });
    srv.listen(port, '127.0.0.1');
  });
}

export async function findFreePort(preferred, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferred + i;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found starting from ${preferred}`);
}

export async function resolveProjectPorts(projectRoot, { appDefault = 3000, dashboardDefault = 3001 } = {}) {
  const projectPath = join(projectRoot, 'rcf', 'project.json');
  let project;
  try {
    project = JSON.parse(await readFile(projectPath, 'utf8'));
  } catch {
    return { app: appDefault, dashboard: dashboardDefault };
  }

  const ports = project.ports || {};
  let changed = false;

  if (!ports.app || !(await isPortFree(ports.app))) {
    ports.app = await findFreePort(ports.app || appDefault);
    changed = true;
  }

  if (!ports.dashboard || !(await isPortFree(ports.dashboard))) {
    const dashStart = ports.dashboard || (ports.app >= dashboardDefault ? ports.app + 1 : dashboardDefault);
    ports.dashboard = await findFreePort(dashStart);
    changed = true;
  }

  if (changed) {
    project.ports = ports;
    await writeFile(projectPath, JSON.stringify(project, null, 2) + '\n');
  }

  return ports;
}
