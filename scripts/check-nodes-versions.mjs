import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nodesRepo = join(repoRoot, '..', 'nodes');
const workspaceFile = join(nodesRepo, 'pnpm-workspace.yaml');

if (!existsSync(workspaceFile)) {
    console.error(`nexploy-nodes not found at ${nodesRepo} — run pnpm install first.`);
    process.exit(1);
}

function readOverrides(file) {
    const lines = readFileSync(file, 'utf8').split('\n');
    const start = lines.findIndex((line) => line.trim() === 'overrides:');
    if (start === -1) return {};

    const pinned = {};
    for (const line of lines.slice(start + 1)) {
        if (!line.startsWith('  ') || !line.trim()) break;
        const match = line.trim().match(/^'?([^':]+)'?:\s*(.+)$/);
        if (match) pinned[match[1]] = match[2].trim();
    }
    return pinned;
}

const require = createRequire(join(repoRoot, 'apps', 'nexploy', 'package.json'));

function resolvedVersion(name) {
    try {
        return require(`${name}/package.json`).version;
    } catch {
        return null;
    }
}

const pinned = readOverrides(workspaceFile);
const drifted = [];
const unresolved = [];

for (const [name, version] of Object.entries(pinned)) {
    const actual = resolvedVersion(name);
    if (actual === null) unresolved.push(name);
    else if (actual !== version) drifted.push({ name, pinned: version, actual });
}

if (drifted.length === 0 && unresolved.length === 0) {
    console.log(`✓ ${Object.keys(pinned).length} shared dependencies match between nexploy and nexploy-nodes`);
    process.exit(0);
}

if (drifted.length > 0) {
    console.error('\nShared dependency versions have drifted between nexploy and nexploy-nodes.\n');
    for (const { name, pinned: want, actual } of drifted) {
        console.error(`  ${name}\n    nexploy resolves ${actual}\n    nodes pins       ${want}`);
    }
    console.error(`
TypeScript treats two copies of a type-bearing package as unrelated types, so this
produces errors of the form "Two different types with this name exist, but they are
unrelated" — or, for zod, "Type instantiation is excessively deep".

Update the overrides block in ${workspaceFile}
to the versions nexploy resolves, then run pnpm install in both repositories.
`);
}

if (unresolved.length > 0) {
    console.error(`\nNot resolvable from apps/nexploy: ${unresolved.join(', ')}`);
    console.error('Either the dependency was dropped from nexploy, or pnpm install has not run.\n');
}

process.exit(1);
