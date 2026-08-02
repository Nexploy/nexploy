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

const sharedStore = join(nodesRepo, '..', 'node_modules');
if (!existsSync(sharedStore)) {
    console.error(`
The shared module store link is missing.

  expected at: ${sharedStore}
  should point to: nexploy/apps/nexploy/node_modules

nexploy-nodes deliberately does not install react, react-dom, next-intl,
react-hook-form, @xyflow/react or next — they are peer dependencies. Two physical
copies of a package that carries React context break that context at runtime
("Failed to call useTranslations because the context was not found").

Turbopack resolves linked packages through their real path, so the node sources
find these packages by walking up from the nodes repository. This link is what
lets that walk reach nexploy's copies.

Create it with:

  ln -s nexploy/apps/nexploy/node_modules "${sharedStore}"
`);
    process.exit(1);
}
