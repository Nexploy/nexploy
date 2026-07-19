import { readFileSync, writeFileSync } from 'fs';

const version = process.argv[2];

if (!version) {
    console.error('Usage: node scripts/sync-version.mjs <version>');
    process.exit(1);
}

const targets = ['package.json', 'apps/nexploy/package.json', 'apps/docker-api/package.json'];

for (const path of targets) {
    const pkg = JSON.parse(readFileSync(path, 'utf-8'));
    pkg.version = version;
    writeFileSync(path, `${JSON.stringify(pkg, null, 4)}\n`);
    console.log(`${path} -> ${version}`);
}
