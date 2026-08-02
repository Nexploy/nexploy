import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nodesRepo = join(repoRoot, '..', 'nodes');

if (!existsSync(join(nodesRepo, 'packages', 'node-core', 'package.json'))) {
    console.error(`
The nexploy-nodes repository is missing.

  expected at: ${nodesRepo}

nexploy links @nexploy/node-core, @nexploy/node-ui and @nexploy/nodes by relative
path, so both repositories must sit side by side:

  Monorepo-Mixte/nexploy/
  ├── nexploy/   <- you are here
  └── nodes/     <- missing

Clone it next to this one, then run pnpm install again.
`);
    process.exit(1);
}
