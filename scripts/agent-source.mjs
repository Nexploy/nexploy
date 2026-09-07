// Switches @nexploy/agent between the published package and the local checkout.
//
//   pnpm agent:local   build + pack ../agent, install the tarball
//   pnpm agent:npm     go back to the published version
//
// Only the tunnel protocol is imported here (@nexploy/agent/protocol), but both apps
// speak it — nexploy authenticates the tunnel, docker-api multiplexes it — so the two
// manifests always move together, otherwise the two sides could frame differently.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const agentRepo = process.env.NEXPLOY_AGENT_ROOT ?? resolve(repoRoot, '..', 'agent');
const manifestPaths = [
    join(repoRoot, 'apps', 'nexploy', 'package.json'),
    join(repoRoot, 'apps', 'docker-api', 'package.json'),
];
const PREFIX = 'nexploy-agent-';

const mode = process.argv[2];
if (mode !== 'local' && mode !== 'npm') {
    console.error('usage: node scripts/agent-source.mjs <local|npm>');
    process.exit(1);
}

const manifests = manifestPaths.map((path) => ({ path, json: JSON.parse(readFileSync(path, 'utf8')) }));

let specifier;
if (mode === 'local') {
    if (!existsSync(join(agentRepo, 'package.json'))) {
        console.error(`nexploy-agent not found at ${agentRepo} — clone it next to this repository.`);
        process.exit(1);
    }
    execFileSync('pnpm', ['run', 'build'], { cwd: agentRepo, stdio: 'inherit' });
    for (const stale of readdirSync(agentRepo).filter((f) => f.startsWith(PREFIX) && f.endsWith('.tgz'))) {
        rmSync(join(agentRepo, stale));
    }
    execFileSync('pnpm', ['pack'], { cwd: agentRepo, stdio: 'inherit' });

    const tarball = readdirSync(agentRepo).find((f) => f.startsWith(PREFIX) && f.endsWith('.tgz'));
    if (!tarball) {
        console.error('pnpm pack produced no tarball.');
        process.exit(1);
    }
    specifier = `file:../../../agent/${tarball}`;
} else {
    const pinned = manifests.map(({ json }) => json.agentVersion).find(Boolean);
    if (!pinned) {
        console.error('No recorded version to restore — set @nexploy/agent by hand.');
        process.exit(1);
    }
    specifier = pinned;
}

for (const { path, json } of manifests) {
    const current = json.dependencies['@nexploy/agent'];
    if (mode === 'local') {
        if (!current.startsWith('file:')) json.agentVersion = current;
    } else {
        delete json.agentVersion;
    }
    json.dependencies['@nexploy/agent'] = specifier;
    writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

console.log(`\n@nexploy/agent → ${specifier}`);
console.log('run pnpm install to apply');
