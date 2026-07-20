#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

function git(args) {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
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
const prevTag = currentIndex >= 0 ? allTags[currentIndex + 1] : undefined;

const range = prevTag ? `${prevTag}..${currentTag}` : currentTag;
const log = git(['log', '--pretty=format:%s', range]);
const subjects = log ? log.split('\n') : [];

const CONVENTIONAL_TYPE = /^(feat|fix|perf|refactor|docs|style|build|ci)(\([^)]*\))?!?:\s.+/;
const PR_SUFFIX = /\s\(#(\d+)\)$/;

const bullets = [];
for (const subject of subjects) {
    if (!CONVENTIONAL_TYPE.test(subject)) continue;

    const prMatch = subject.match(PR_SUFFIX);
    if (!prMatch) {
        bullets.push(`- ${subject}`);
        continue;
    }

    const prNumber = prMatch[1];
    const title = subject.slice(0, prMatch.index);

    let author;
    try {
        author = execFileSync(
            'gh',
            ['pr', 'view', prNumber, '--json', 'author', '-q', '.author.login'],
            { encoding: 'utf8' },
        ).trim();
    } catch {
        author = undefined;
    }

    bullets.push(
        author ? `- ${title} (PR #${prNumber}, @${author})` : `- ${title} (PR #${prNumber})`,
    );
}

writeFileSync('/tmp/prev-tag.txt', prevTag ?? '');
writeFileSync('/tmp/changelog.md', bullets.length ? bullets.join('\n') : '_No notable changes._');
