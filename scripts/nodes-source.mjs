// Switches @nexploy/nodes between the published package and the local checkout.
//
//   pnpm nodes:local   build + pack ../nodes, install the tarball
//   pnpm nodes:npm     go back to the published version
//
// The local mode packs a tarball rather than linking the directory on purpose. A
// `link:` makes the package resolve react, next-intl and zod from its own store,
// which gives two copies of each and breaks every React context and `instanceof`
// across the boundary. Extracting a tarball into this workspace resolves them
// here, exactly as the published package does.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(repoRoot, 'apps', 'nexploy', 'package.json');
const nodesRepo = join(repoRoot, '..', 'nodes');

const mode = process.argv[2];
if (mode !== 'local' && mode !== 'npm') {
    console.error('usage: node scripts/nodes-source.mjs <local|npm>');
    process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const current = manifest.dependencies['@nexploy/nodes'];

if (mode === 'local') {
    if (!existsSync(join(nodesRepo, 'package.json'))) {
        console.error(`nexploy-nodes not found at ${nodesRepo} — clone it next to this repository.`);
        process.exit(1);
    }
    execFileSync('pnpm', ['run', 'build'], { cwd: nodesRepo, stdio: 'inherit' });
    for (const stale of readdirSync(nodesRepo).filter((f) => f.endsWith('.tgz'))) {
        execFileSync('rm', ['-f', join(nodesRepo, stale)]);
    }
    execFileSync('npm', ['pack'], { cwd: nodesRepo, stdio: 'inherit' });

    const tarball = readdirSync(nodesRepo).find((f) => f.endsWith('.tgz'));
    if (!tarball) {
        console.error('npm pack produced no tarball.');
        process.exit(1);
    }
    if (!current.startsWith('file:')) manifest.nodesVersion = current;
    manifest.dependencies['@nexploy/nodes'] = `file:../../../nodes/${tarball}`;
} else {
    const pinned = manifest.nodesVersion;
    if (!pinned) {
        console.error('No recorded version to restore — set @nexploy/nodes by hand.');
        process.exit(1);
    }
    manifest.dependencies['@nexploy/nodes'] = pinned;
    delete manifest.nodesVersion;
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
console.log(`\n@nexploy/nodes → ${manifest.dependencies['@nexploy/nodes']}`);
console.log('run pnpm install to apply');
