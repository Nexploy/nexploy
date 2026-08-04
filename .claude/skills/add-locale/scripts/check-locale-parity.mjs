#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const siblings = resolve(appRoot, '..');
const nodesRoot = join(siblings, 'nodes');
const docsRoot = join(siblings, 'docs');

const target = process.argv[2];
const repoArg = (process.argv.find((a) => a.startsWith('--repo=')) ?? '--repo=all').slice(7);

if (!target || target.startsWith('--')) {
    console.error('usage: check-locale-parity.mjs <locale-code> [--repo=app|nodes|docs|all]');
    process.exit(2);
}

const placeholderRe = /\{(\w+)\}/g;
const problems = [];
const notes = [];

function flatten(value, prefix, out) {
    for (const [key, child] of Object.entries(value)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
            flatten(child, path, out);
        } else {
            out.set(path, child);
        }
    }
    return out;
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function placeholders(value) {
    return typeof value === 'string' ? [...value.matchAll(placeholderRe)].map((m) => m[1]).sort() : [];
}

function comparePair(label, referencePath, targetPath, identical) {
    const ref = flatten(readJson(referencePath), '', new Map());
    const tgt = flatten(readJson(targetPath), '', new Map());

    for (const [key, refValue] of ref) {
        if (!tgt.has(key)) {
            problems.push(`missing key   ${label}:${key}`);
            continue;
        }
        const tgtValue = tgt.get(key);
        const refPlaceholders = placeholders(refValue).join(',');
        const tgtPlaceholders = placeholders(tgtValue).join(',');
        if (refPlaceholders !== tgtPlaceholders) {
            problems.push(`placeholders  ${label}:${key}  {${refPlaceholders}} -> {${tgtPlaceholders}}`);
        }
        if (typeof refValue === 'string' && refValue === tgtValue && refValue.trim() !== '') {
            identical.push(`${label}:${key}  "${refValue}"`);
        }
    }

    for (const key of tgt.keys()) {
        if (!ref.has(key)) problems.push(`extra key     ${label}:${key}`);
    }

    return ref.size;
}

function checkApp() {
    const localesDir = join(appRoot, 'packages/i18n/locales');
    const reference = 'en';
    console.log(`\n── nexploy app — packages/i18n/locales/${target} vs ${reference}`);

    if (!existsSync(join(localesDir, target))) {
        problems.push(`missing dir   packages/i18n/locales/${target}`);
        return;
    }

    const referenceFiles = readdirSync(join(localesDir, reference)).filter((f) => f.endsWith('.json'));
    const targetFiles = new Set(readdirSync(join(localesDir, target)).filter((f) => f.endsWith('.json')));
    const identical = [];
    let keys = 0;

    for (const file of referenceFiles) {
        if (!targetFiles.has(file)) {
            problems.push(`missing file  packages/i18n/locales/${target}/${file}`);
            continue;
        }
        keys += comparePair(file, join(localesDir, reference, file), join(localesDir, target, file), identical);
    }
    for (const file of targetFiles) {
        if (!referenceFiles.includes(file)) problems.push(`extra file    packages/i18n/locales/${target}/${file}`);
    }

    for (const locale of readdirSync(localesDir)) {
        const accountPath = join(localesDir, locale, 'account.json');
        if (!existsSync(accountPath)) continue;
        const account = readJson(accountPath);
        if (!account.language || account.language[target] === undefined) {
            problems.push(`missing label locales/${locale}/account.json → language.${target}`);
        }
    }

    const index = readFileSync(join(appRoot, 'packages/i18n/index.ts'), 'utf8');
    if (!index.includes(`./locales/${target}/`)) {
        problems.push(`not imported  packages/i18n/index.ts has no ${target} imports`);
    }
    if (!new RegExp(`appLocales\\s*=\\s*\\[[^\\]]*'${target}'`).test(index)) {
        problems.push(`not listed    packages/i18n/index.ts → appLocales missing '${target}'`);
    }
    if (!new RegExp(`^\\s{4}${target}:\\s*\\{`, 'm').test(index)) {
        problems.push(`not registered packages/i18n/index.ts → locales.${target} block missing`);
    }

    const clientPath = join(appRoot, 'apps/nexploy/src/lib/i18n/clientTranslations.ts');
    const client = readFileSync(clientPath, 'utf8');
    if (!client.includes(`locales/${target}/docker.json`)) {
        problems.push(`not wired     clientTranslations.ts does not import locales/${target}/docker.json`);
    }
    const localeTypeSection = client.split('export function clientT')[0].split('type Locale')[1] ?? '';
    if (!new RegExp(`['"]${target}['"]`).test(localeTypeSection)) {
        problems.push(
            `not wired     clientTranslations.ts → Locale type / translations map / getLocale missing '${target}'`,
        );
    }

    console.log(`   ${keys} reference keys, ${identical.length} values identical to English`);
    notes.push(...identical.map((i) => `app  ${i}`));
}

function checkNodes() {
    if (!existsSync(nodesRoot)) {
        console.log('\n── nodes repo not found next to this one — skipped');
        return;
    }
    const nodesDir = join(nodesRoot, 'src/nodes');
    console.log(`\n── @nexploy/nodes — src/nodes/*/locales/${target}.json vs en.json`);

    const identical = [];
    let files = 0;
    let keys = 0;

    for (const entry of readdirSync(nodesDir)) {
        const localesDir = join(nodesDir, entry, 'locales');
        if (!existsSync(localesDir) || !statSync(localesDir).isDirectory()) continue;
        const referencePath = join(localesDir, 'en.json');
        const targetPath = join(localesDir, `${target}.json`);
        if (!existsSync(referencePath)) continue;
        if (!existsSync(targetPath)) {
            problems.push(`missing file  nodes/src/nodes/${entry}/locales/${target}.json`);
            continue;
        }
        files += 1;
        keys += comparePair(`${entry}/${target}.json`, referencePath, targetPath, identical);
    }

    const messages = readFileSync(join(nodesDir, 'registry/messages.ts'), 'utf8');
    if (!messages.includes(`/locales/${target}.json`)) {
        problems.push(`not imported  nodes/src/nodes/registry/messages.ts has no ${target} imports`);
    }
    if (!new RegExp(`^\\s{4}${target}:\\s*mergeMessages`, 'm').test(messages)) {
        problems.push(`not registered nodes/registry/messages.ts → builtinNodeMessages.${target} missing`);
    }

    console.log(`   ${files} locale files, ${keys} reference keys, ${identical.length} identical to English`);
    notes.push(...identical.map((i) => `nodes  ${i}`));
}

function checkDocs() {
    if (!existsSync(docsRoot)) {
        console.log('\n── docs repo not found next to this one — skipped');
        return;
    }
    const contentRoot = join(docsRoot, 'content/docs');
    const i18nFile = readFileSync(join(docsRoot, 'lib/i18n.ts'), 'utf8');
    const defaultLanguage = i18nFile.match(/defaultLanguage:\s*'([\w-]+)'/)?.[1] ?? 'fr';

    if (target === defaultLanguage) {
        console.log(`\n── docs — '${target}' is the default language (unsuffixed files) — nothing to check`);
        return;
    }

    console.log(`\n── docs — content/docs/**.${target}.mdx vs default (${defaultLanguage})`);

    const defaultPages = [];
    const walk = (dir) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            if (statSync(full).isDirectory()) {
                walk(full);
            } else if (entry.endsWith('.mdx') && !/\.[a-z]{2}(-[a-z]{2})?\.mdx$/.test(entry)) {
                defaultPages.push(full);
            } else if (entry === 'meta.json' && dir !== contentRoot) {
                defaultPages.push(full);
            }
        }
    };
    walk(contentRoot);

    let translated = 0;
    for (const page of defaultPages) {
        const localized = page.replace(/\.(mdx|json)$/, `.${target}.$1`);
        if (!existsSync(localized)) {
            problems.push(`missing page  docs/${relative(docsRoot, localized)}`);
            continue;
        }
        translated += 1;
        if (localized.endsWith('.mdx')) {
            const body = readFileSync(localized, 'utf8');
            if (!body.startsWith('---')) {
                problems.push(`no frontmatter docs/${relative(docsRoot, localized)}`);
            } else {
                const frontmatter = body.slice(3, body.indexOf('\n---', 3));
                if (!/^title:/m.test(frontmatter)) problems.push(`no title      docs/${relative(docsRoot, localized)}`);
                if (!/^description:/m.test(frontmatter)) {
                    problems.push(`no description docs/${relative(docsRoot, localized)}`);
                }
            }
        }
    }

    if (!new RegExp(`languages:\\s*\\[[^\\]]*'${target}'`).test(i18nFile)) {
        problems.push(`not listed    docs/lib/i18n.ts → languages missing '${target}'`);
    }

    const shared = readFileSync(join(docsRoot, 'lib/layout.shared.tsx'), 'utf8');
    if (!new RegExp(`^\\s{8}${target}:\\s*\\{`, 'm').test(shared)) {
        problems.push(`not translated docs/lib/layout.shared.tsx → no '${target}' UI translations block`);
    }

    const search = readFileSync(join(docsRoot, 'app/api/search/route.ts'), 'utf8');
    if (!new RegExp(`^\\s+${target}:\\s*\\{`, 'm').test(search)) {
        notes.push(
            `docs  app/api/search/route.ts has no localeMap entry for '${target}' (fine if Orama has no stemmer for it)`,
        );
    }

    console.log(`   ${translated}/${defaultPages.length} localized files`);
}

if (repoArg === 'app' || repoArg === 'all') checkApp();
if (repoArg === 'nodes' || repoArg === 'all') checkNodes();
if (repoArg === 'docs' || repoArg === 'all') checkDocs();

if (problems.length > 0) {
    console.log(`\nPROBLEMS (${problems.length})`);
    for (const p of problems.slice(0, 80)) console.log(`  ${p}`);
    if (problems.length > 80) console.log(`  … and ${problems.length - 80} more`);
}

if (notes.length > 0) {
    console.log(`\nINFORMATIONAL — identical to English / optional (${notes.length}, showing 40)`);
    for (const n of notes.slice(0, 40)) console.log(`  ${n}`);
}

if (problems.length === 0) {
    console.log(`\nOK — '${target}' is structurally complete across the checked repos.`);
    process.exit(0);
}

console.log(`\nFAILED — ${problems.length} problem(s) to fix.`);
process.exit(1);
