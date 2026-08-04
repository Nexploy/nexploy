// Switches @nexploy/shared between the published package and the local checkout.
//
//   pnpm shared:local   build + pack ../shared, install the tarball
//   pnpm shared:npm     go back to the published version
//
// Both apps depend on the package, so the two manifests are always moved together —
// letting them drift would put two different copies of Actor and HttpError on the two
// sides of the nexploy/docker-api boundary.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sharedRepo = process.env.NEXPLOY_SHARED_ROOT ?? resolve(repoRoot, '..', 'shared');
const manifestPaths = [
    join(repoRoot, 'apps', 'nexploy', 'package.json'),
    join(repoRoot, 'apps', 'docker-api', 'package.json'),
];
const PREFIX = 'nexploy-shared-';

const mode = process.argv[2];
if (mode !== 'local' && mode !== 'npm') {
    console.error('usage: node scripts/shared-source.mjs <local|npm>');
    process.exit(1);
}

const manifests = manifestPaths.map((path) => ({ path, json: JSON.parse(readFileSync(path, 'utf8')) }));

let specifier;
if (mode === 'local') {
    if (!existsSync(join(sharedRepo, 'package.json'))) {
        console.error(`nexploy-shared not found at ${sharedRepo} — clone it next to this repository.`);
        process.exit(1);
    }
    execFileSync('pnpm', ['run', 'build'], { cwd: sharedRepo, stdio: 'inherit' });
    for (const stale of readdirSync(sharedRepo).filter((f) => f.startsWith(PREFIX) && f.endsWith('.tgz'))) {
        rmSync(join(sharedRepo, stale));
    }
    execFileSync('pnpm', ['pack'], { cwd: sharedRepo, stdio: 'inherit' });

    const tarball = readdirSync(sharedRepo).find((f) => f.startsWith(PREFIX) && f.endsWith('.tgz'));
    if (!tarball) {
        console.error('pnpm pack produced no tarball.');
        process.exit(1);
    }
    specifier = `file:../../../shared/${tarball}`;
} else {
    const pinned = manifests.map(({ json }) => json.sharedVersion).find(Boolean);
    if (!pinned) {
        console.error('No recorded version to restore — set @nexploy/shared by hand.');
        process.exit(1);
    }
    specifier = pinned;
}

for (const { path, json } of manifests) {
    const current = json.dependencies['@nexploy/shared'];
    if (mode === 'local') {
        if (!current.startsWith('file:')) json.sharedVersion = current;
    } else {
        delete json.sharedVersion;
    }
    json.dependencies['@nexploy/shared'] = specifier;
    writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

console.log(`\n@nexploy/shared → ${specifier}`);
console.log('run pnpm install to apply');
