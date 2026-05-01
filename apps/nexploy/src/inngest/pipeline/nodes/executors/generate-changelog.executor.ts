import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@/types/pipeline.type';
import { generateChangelogConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const CONVENTIONAL_TYPES: Record<string, string> = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    perf: '⚡ Performance',
    refactor: '♻️ Refactoring',
    docs: '📚 Documentation',
    test: '🧪 Tests',
    chore: '🔧 Chores',
    ci: '👷 CI',
    build: '📦 Build',
    revert: '⏪ Reverts',
    style: '💅 Style',
};

function parseConventionalCommit(subject: string): { type: string; scope?: string; desc: string } {
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
    if (match) {
        return { type: match[1]!, scope: match[2], desc: match[3]! };
    }
    return { type: 'other', desc: subject };
}

function formatConventional(
    commits: { hash: string; subject: string }[],
    toRef: string,
): string {
    const grouped: Record<string, string[]> = {};

    for (const { hash, subject } of commits) {
        const { type, scope, desc } = parseConventionalCommit(subject);
        const key = CONVENTIONAL_TYPES[type] ?? '📝 Other';
        if (!grouped[key]) grouped[key] = [];
        const scopePart = scope ? `**${scope}:** ` : '';
        grouped[key].push(`- ${scopePart}${desc} (\`${hash}\`)`);
    }

    const date = new Date().toISOString().split('T')[0];
    const lines = [`## ${toRef === 'HEAD' ? 'Unreleased' : toRef} — ${date}`, ''];

    for (const [section, entries] of Object.entries(grouped)) {
        lines.push(`### ${section}`, '', ...entries, '');
    }

    return lines.join('\n');
}

function formatSimple(commits: { hash: string; subject: string; author: string }[]): string {
    const date = new Date().toISOString().split('T')[0];
    const lines = [`## ${date}`, ''];
    for (const { hash, subject, author } of commits) {
        lines.push(`- ${subject} (\`${hash}\`) — ${author}`);
    }
    lines.push('');
    return lines.join('\n');
}

export class GenerateChangelogExecutor implements INodeExecutor {
    readonly type = 'generate-changelog';
    readonly configSchema = generateChangelogConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof generateChangelogConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, allOutputs, logger, abortSignal, edges } = ctx;

        const { outputPath, format, append } = nodeConfig;

        const fromTag =
            nodeConfig.fromTag || getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'tagName') || '';
        const toRef = nodeConfig.toRef || 'HEAD';

        const workDir = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'workDir');
        if (!workDir) throw new Error('No workDir found — connect a clone node first');

        if (abortSignal.aborted) throw new Error('Build cancelled');

        const rangeDesc = fromTag ? `${fromTag}..${toRef}` : toRef;
        await logger.info(nodeId, `Generating changelog for range: ${rangeDesc}`);

        const commits = await gitService.getChangelogCommits(workDir, fromTag, toRef);
        await logger.info(nodeId, `Found ${commits.length} commits`);

        if (commits.length === 0) {
            await logger.warn(nodeId, 'No commits found in range — writing empty changelog section');
        }

        const content =
            format === 'conventional'
                ? formatConventional(commits, toRef)
                : formatSimple(commits);

        const absolutePath = join(workDir, outputPath);

        let existing = '';
        if (append) {
            try {
                await access(absolutePath);
                existing = await readFile(absolutePath, 'utf8');
            } catch {
                // file doesn't exist yet — start fresh
            }
        }

        await writeFile(absolutePath, content + existing, 'utf8');

        await logger.info(nodeId, `Changelog written to ${outputPath}`);

        return { output: { changelogPath: absolutePath, changelog: content, workDir } };
    }
}

export const generateChangelogExecutor = new GenerateChangelogExecutor();
