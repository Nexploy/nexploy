import { createRequire } from 'node:module';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nodesRepo = join(repoRoot, '..', 'nodes');

if (!existsSync(nodesRepo)) {
    console.error(`nexploy-nodes not found at ${nodesRepo}`);
    process.exit(1);
}

const packages = ['node-core', 'node-ui', 'nodes'];

function externalImports(pkg) {
    const found = new Set();
    const walk = (dir) => {
        for (const entry of readFileSync ? readdirSafe(dir) : []) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.tsx?$/.test(entry.name)) {
                for (const [, spec] of readFileSync(full, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)) {
                    if (spec.startsWith('.') || spec.startsWith('node:') || spec.startsWith('@nexploy/')) continue;
                    found.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
                }
            }
        }
    };
    walk(join(nodesRepo, 'packages', pkg, 'src'));
    return found;
}

function readdirSafe(dir) {
    try {
        return require('node:fs').readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }
}

const require = createRequire(import.meta.url);
const fromApp = createRequire(join(repoRoot, 'apps', 'nexploy', 'index.js'));
const fromNodes = createRequire(join(nodesRepo, 'packages', 'nodes', 'index.js'));

function resolveReal(req, name) {
    for (const target of [`${name}/package.json`, name]) {
        try {
            return realpathSync(req.resolve(target)).replace(/\/node_modules\/(?!.*\/node_modules\/).*$/, '');
        } catch {}
    }
    return null;
}

const specs = new Set();
for (const pkg of packages) for (const s of externalImports(pkg)) specs.add(s);

const duplicated = [];
const unresolved = [];

for (const name of [...specs].sort()) {
    const a = resolveReal(fromApp, name);
    const b = resolveReal(fromNodes, name);
    if (!a || !b) {
        if (!b) unresolved.push(name);
        continue;
    }
    if (a !== b) duplicated.push({ name, app: a, nodes: b });
}

if (duplicated.length === 0) {
    console.log(`✓ ${specs.size} shared packages resolve to a single copy from both repositories`);
    if (unresolved.length)
        console.log(`  (not resolvable from nexploy, type-only or built-in: ${unresolved.join(', ')})`);
    process.exit(0);
}

console.error('\nThese packages exist twice — once per pnpm store:\n');
for (const { name, app, nodes } of duplicated) {
    console.error(`  ${name}\n    nexploy: ${app}\n    nodes:   ${nodes}`);
}
console.error(`
Two copies mean two module instances. Anything relying on identity breaks silently:
\`instanceof\` returns false (zod schemas, ky's HTTPError), and React contexts from
one copy are invisible to components resolved through the other.

Declare each of these as a peerDependency in the nexploy-nodes packages instead of a
dependency, so they resolve from nexploy. \`autoInstallPeers: false\` in that repo's
pnpm-workspace.yaml keeps pnpm from reinstalling them.
`);
process.exit(1);
