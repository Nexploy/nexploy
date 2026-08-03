#!/usr/bin/env node
import { readdirSync, existsSync, statSync, copyFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const docsRoot = resolve(appRoot, '../docs');
const contentRoot = join(docsRoot, 'content/docs');

const target = process.argv[2];
if (!target || target.startsWith('--')) {
    console.error('usage: scaffold-docs-locale.mjs <locale-code>');
    console.error('  copies every default-language (fr) page to *.<code>.mdx / meta.<code>.json, untranslated');
    process.exit(2);
}
if (!existsSync(contentRoot)) {
    console.error(`docs repo not found at ${docsRoot} — clone it next to this repository.`);
    process.exit(2);
}

const i18nFile = readFileSync(join(docsRoot, 'lib/i18n.ts'), 'utf8');
const defaultLanguage = i18nFile.match(/defaultLanguage:\s*'([\w-]+)'/)?.[1] ?? 'fr';
if (target === defaultLanguage) {
    console.error(`'${target}' is the docs default language — its pages are the unsuffixed ones. Nothing to scaffold.`);
    process.exit(2);
}

const localeSuffixRe = /\.[a-z]{2}(-[a-z]{2})?\.(mdx|json)$/;
const sources = [];

const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full);
        } else if (entry.endsWith('.mdx') && !localeSuffixRe.test(entry)) {
            sources.push(full);
        } else if (entry === 'meta.json' && dir !== contentRoot) {
            sources.push(full);
        }
    }
};
walk(contentRoot);

let created = 0;
let skipped = 0;
const todo = [];

for (const source of sources) {
    const destination = source.replace(/\.(mdx|json)$/, `.${target}.$1`);
    if (existsSync(destination)) {
        skipped += 1;
        continue;
    }
    copyFileSync(source, destination);
    created += 1;
    const lines = readFileSync(source, 'utf8').split('\n').length;
    todo.push({ path: relative(docsRoot, destination), lines });
}

todo.sort((a, b) => b.lines - a.lines);

console.log(`docs: ${created} files created, ${skipped} already existed`);
console.log(
    `\nAll copies are still ${defaultLanguage.toUpperCase()} (the default language) — translate them into '${target}':`,
);
for (const item of todo) console.log(`  ${String(item.lines).padStart(5)} lines  ${item.path}`);

console.log(`\nStill to wire by hand:`);
console.log(`  lib/i18n.ts            → add '${target}' to languages`);
console.log(`  lib/layout.shared.tsx  → add a '${target}' block with displayName + the ~45 fumadocs UI strings`);
console.log(`  app/api/search/route.ts → add ${target}: { language: '<orama-stemmer>' } only if Orama supports it`);
console.log(`\ncontent/docs/meta.json (root) has no per-locale variant — leave it alone.`);
