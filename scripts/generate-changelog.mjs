#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function git(args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gh(args) {
    try {
        return execFileSync('gh', args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
    } catch {
        return undefined;
    }
}

const currentTag = process.argv[2];
if (!currentTag) {
    console.error('Usage: generate-changelog.mjs <current-tag>');
    process.exit(1);
}

const allTags = git(['tag', '-l', '--sort=-v:refname'])
    .split('\n')
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));

const currentIndex = allTags.indexOf(currentTag);
const prevTag = currentIndex >= 0 ? allTags[currentIndex + 1] : allTags[0];

const range = prevTag ? `${prevTag}..${currentTag}` : currentTag;

const SECTIONS = [
    { key: 'breaking', title: '### Breaking Changes' },
    { key: 'feat', title: '### Features' },
    { key: 'fix', title: '### Bug Fixes' },
    { key: 'security', title: '### Security' },
    { key: 'perf', title: '### Performance' },
    { key: 'refactor', title: '### Refactoring' },
    { key: 'docs', title: '### Documentation' },
    { key: 'chore', title: '### Chores' },
    { key: 'other', title: '### Other Changes' },
];

const CONVENTIONAL =
    /^(?<type>feat|fix|perf|refactor|docs|style|build|ci|chore|security)(?<scope>\([^)]*\))?(?<breaking>!)?:\s*(?<title>.+)$/;
const PR_SUFFIX = /\s\(#(\d+)\)$/;

const TYPE_TO_SECTION = {
    feat: 'feat',
    fix: 'fix',
    security: 'security',
    perf: 'perf',
    refactor: 'refactor',
    docs: 'docs',
    style: 'chore',
    build: 'chore',
    ci: 'chore',
    chore: 'chore',
};

const rawLog = git(['log', '--pretty=format:%H%x1f%s%x1f%b%x1e', range]);
const commits = rawLog
    ? rawLog
          .split('\x1e')
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
              const [sha, subject, body] = entry.split('\x1f');
              return { sha, subject: subject ?? '', body: body ?? '' };
          })
    : [];

const buckets = new Map(SECTIONS.map((section) => [section.key, []]));

for (const commit of commits) {
    const match = commit.subject.match(CONVENTIONAL);
    const isBreaking = Boolean(match?.groups?.breaking) || /BREAKING[ -]CHANGE/.test(commit.body);

    let title = match?.groups?.title ?? commit.subject;
    const scope = match?.groups?.scope?.slice(1, -1);

    const prMatch = title.match(PR_SUFFIX);
    let suffix = '';
    if (prMatch) {
        title = title.slice(0, prMatch.index);
        suffix = ` (#${prMatch[1]})`;
    }

    const sectionKey = isBreaking ? 'breaking' : (TYPE_TO_SECTION[match?.groups?.type] ?? 'other');
    const label = scope ? `**${scope}**: ${title}` : title;

    buckets.get(sectionKey).push(`- ${label}${suffix}`);
}

const changelogParts = [];
for (const section of SECTIONS) {
    const entries = buckets.get(section.key);
    if (!entries.length) continue;
    changelogParts.push(section.title, '', ...entries, '');
}

const repo = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']);

const contributorLogins = new Set();
if (repo && prevTag) {
    const compare = gh([
        'api',
        `/repos/${repo}/compare/${prevTag}...${currentTag}`,
        '-q',
        '.commits[].author.login',
    ]);
    if (compare) {
        for (const login of compare
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)) {
            contributorLogins.add(login);
        }
    }
}

if (!contributorLogins.size) {
    const names = git(['log', '--pretty=format:%an', range]);
    if (names) {
        for (const name of names
            .split('\n')
            .map((n) => n.trim())
            .filter(Boolean)) {
            contributorLogins.add(name);
        }
    }
}

const contributors = [...contributorLogins].sort((a, b) => a.localeCompare(b));

const curatedPath = join(process.cwd(), '.github', 'release-notes', `${currentTag}.md`);
const curated = existsSync(curatedPath) ? readFileSync(curatedPath, 'utf8').trim() : '';

const output = [];

if (curated) {
    output.push(curated, '');
}

if (changelogParts.length) {
    if (curated) {
        output.push('<details>', '<summary><b>All commits in this release</b></summary>', '');
    }
    output.push(...changelogParts);
    if (curated) {
        output.push('</details>', '');
    }
} else if (!curated) {
    output.push('_No notable changes._', '');
}

const footer = [];

if (contributors.length) {
    footer.push('## Contributors', '');
    footer.push('Thanks to everyone who contributed to this release:', '');
    footer.push(contributors.map((c) => (repo ? `@${c}` : c)).join(', '), '');
}

if (repo && prevTag) {
    footer.push(
        `**Full changelog**: [\`${prevTag}...${currentTag}\`](https://github.com/${repo}/compare/${prevTag}...${currentTag})`,
        '',
    );
}

writeFileSync('/tmp/prev-tag.txt', prevTag ?? '');
writeFileSync('/tmp/changelog.md', output.join('\n').trim() + '\n');
writeFileSync('/tmp/changelog-footer.md', footer.length ? footer.join('\n').trim() + '\n' : '');
