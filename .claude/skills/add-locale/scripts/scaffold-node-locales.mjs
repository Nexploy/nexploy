#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync, statSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const nodesRoot = resolve(appRoot, '../nodes');
const nodesDir = join(nodesRoot, 'src/nodes');

const target = process.argv[2];
if (!target || target.startsWith('--')) {
    console.error('usage: scaffold-node-locales.mjs <locale-code>');
    console.error('  copies every en.json to <code>.json (untranslated) and rewrites registry/messages.ts');
    process.exit(2);
}
if (!existsSync(nodesDir)) {
    console.error(`nodes repo not found at ${nodesRoot} — clone it next to this repository.`);
    process.exit(2);
}

const camel = (value) => value.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const suffix = camel(`-${target}`).replace(/^./, (c) => c.toUpperCase());

const nodeDirs = readdirSync(nodesDir)
    .filter((entry) => entry !== 'registry')
    .filter((entry) => existsSync(join(nodesDir, entry, 'locales', 'en.json')))
    .sort();

let created = 0;
let skipped = 0;

for (const entry of ['registry', ...nodeDirs]) {
    const localesDir = join(nodesDir, entry, 'locales');
    const source = join(localesDir, 'en.json');
    const destination = join(localesDir, `${target}.json`);
    if (!existsSync(source) || !statSync(localesDir).isDirectory()) continue;
    if (existsSync(destination)) {
        skipped += 1;
        continue;
    }
    copyFileSync(source, destination);
    created += 1;
}

const messagesPath = join(nodesDir, 'registry/messages.ts');
const messages = readFileSync(messagesPath, 'utf8');

const typeMarker = 'type MessageTree =';
const builtinMarker = 'export const builtinNodeMessages';
const tailMarker = 'export { mergeMessages };';

if (!messages.includes(typeMarker) || !messages.includes(builtinMarker) || !messages.includes(tailMarker)) {
    console.error('messages.ts no longer matches the expected shape — edit it by hand.');
    process.exit(1);
}

const middle = messages.slice(messages.indexOf(typeMarker), messages.indexOf(builtinMarker));
const tail = messages.slice(messages.indexOf(tailMarker));

const existingLocales = [...messages.matchAll(/^\s{4}([a-zA-Z0-9-]+):\s*mergeMessages\(\[/gm)].map((m) => m[1]);
const localeCodes = existingLocales.includes(target) ? existingLocales : [...existingLocales, target];

const identifierFor = (locale, entry) => {
    const base = entry === 'registry' ? 'shared' : camel(entry);
    const localeSuffix = camel(`-${locale}`).replace(/^./, (c) => c.toUpperCase());
    return `${base}${localeSuffix}`;
};

const importPathFor = (locale, entry) =>
    entry === 'registry' ? `./locales/${locale}.json` : `../${entry}/locales/${locale}.json`;

const entries = ['registry', ...nodeDirs];

const importBlocks = localeCodes
    .map((locale) =>
        entries
            .filter((entry) => existsSync(join(nodesDir, entry, 'locales', `${locale}.json`)))
            .map((entry) => `import ${identifierFor(locale, entry)} from '${importPathFor(locale, entry)}';`)
            .join('\n'),
    )
    .join('\n\n');

const builtinBlock = [
    'export const builtinNodeMessages: Record<string, MessageTree> = {',
    ...localeCodes.map((locale) => {
        const available = entries.filter((entry) => existsSync(join(nodesDir, entry, 'locales', `${locale}.json`)));
        const lines = available.map((entry) => `        ${identifierFor(locale, entry)},`).join('\n');
        return `    ${locale}: mergeMessages([\n${lines}\n    ]),`;
    }),
    '};',
].join('\n');

writeFileSync(messagesPath, `${importBlocks}\n\n${middle}${builtinBlock}\n\n${tail}`);

console.log(`locale files: ${created} created, ${skipped} already existed`);
console.log(`messages.ts rewritten for locales: ${localeCodes.join(', ')}`);
console.log(`\nEvery new file is still ENGLISH — translate the ${created} <code>.json files before shipping.`);
console.log(`Then: cd ${nodesRoot} && pnpm format && pnpm typecheck && pnpm build`);
console.log(`Suffix used for identifiers: ${suffix}`);
