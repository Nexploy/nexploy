import type { GitProviderType } from 'generated/client';

const CUSTOM_UNSUPPORTED_NODE_IDS = new Set<string>([
    'create-release',
    'update-commit-status',
    'git-tag',
    'webhook-clone',
]);

export function isNodeSupportedByGitProvider(nodeId: string, gitProvider: GitProviderType): boolean {
    if (gitProvider !== 'CUSTOM') return true;
    return !CUSTOM_UNSUPPORTED_NODE_IDS.has(nodeId);
}
