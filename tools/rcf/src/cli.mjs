import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COMMANDS = {
  init: 'commands/init.mjs',
  new: 'commands/new.mjs',
  status: 'commands/status.mjs',
  trace: 'commands/trace.mjs',
  coverage: 'commands/coverage.mjs',
  validate: 'commands/validate.mjs',
  dashboard: 'commands/dashboard.mjs',
};

function printUsage() {
  console.log(`
\x1b[1mrcf\x1b[0m -- RCF Lite CLI

\x1b[1mUsage:\x1b[0m
  rcf <command> [options]

\x1b[1mCommands:\x1b[0m
  init        Create rcf/ structure and project.json
  new <type>  Create a new document (requirement, story, build-spec, test-spec)
  status      Project health check
  trace [ID]  Show traceability chain
  coverage    Requirements coverage report
  validate    Schema validation and referential integrity check
  dashboard   Start web dashboard (coming soon)

\x1b[1mOptions:\x1b[0m
  --help, -h  Show this help message
`);
}

export async function run(argv) {
  const command = argv[0];

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  const modulePath = COMMANDS[command];
  if (!modulePath) {
    console.error(`\x1b[31mUnknown command: ${command}\x1b[0m\n`);
    printUsage();
    process.exit(1);
  }

  try {
    const fullPath = join(__dirname, modulePath);
    const mod = await import(pathToFileURL(fullPath).href);
    await mod.default(argv.slice(1));
  } catch (err) {
    console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
    if (process.env.RCF_DEBUG) {
      console.error(err.stack);
    }
    process.exit(2);
  }
}
