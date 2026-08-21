import { GitProviderAdapter } from '@/services/git/core/GitProviderAdapter';
import { parseRepositoryUrl } from '@/services/git/core/repoUrl';
import { fetchRemoteRefs, normalizeRepositoryUrl } from '@/services/git/providers/custom/custom.client';

const UNSUPPORTED = 'CUSTOM_PROVIDER_UNSUPPORTED_OPERATION';

function unsupported(): never {
    throw new Error(UNSUPPORTED);
}

export const customAdapter: GitProviderAdapter = {
    type: 'CUSTOM',
    cloneCredentialUsername: '',
    webhookPath: '',
    webhookEventHeader: '',

    parseRepoUrl(url: string) {
        return parseRepositoryUrl(url, { providerLabel: 'Custom', nestedNamespace: true });
    },

    async listRepositories() {
        return [];
    },

    async getRepository({ repositoryUrl }) {
        const { owner, repo } = parseRepositoryUrl(repositoryUrl, { providerLabel: 'Custom', nestedNamespace: true });
        const { defaultBranch } = await fetchRemoteRefs(repositoryUrl);

        return {
            id: normalizeRepositoryUrl(repositoryUrl),
            name: repo,
            fullName: owner ? `${owner}/${repo}` : repo,
            url: normalizeRepositoryUrl(repositoryUrl),
            private: false,
            defaultBranch: defaultBranch ?? 'main',
        };
    },

    async listBranches({ repositoryUrl }) {
        if (!repositoryUrl) return [];

        const { branches, defaultBranch } = await fetchRemoteRefs(repositoryUrl);

        return branches.map((branch) => ({
            name: branch.name,
            protected: branch.name === defaultBranch,
        }));
    },

    async getCommit({ repositoryUrl, branch, commitHash }) {
        if (commitHash) return { hash: commitHash, message: '' };

        const { branches, defaultBranch } = await fetchRemoteRefs(repositoryUrl);
        const target = branches.find((candidate) => candidate.name === (branch || defaultBranch));

        return target ? { hash: target.sha, message: '' } : null;
    },

    async getAuthenticatedUser() {
        return unsupported();
    },

    async createWebhook() {
        return unsupported();
    },

    async deleteWebhook() {
        return unsupported();
    },

    parseWebhookPayload() {
        return null;
    },

    verifyWebhookSignature() {
        return false;
    },

    buildAuthorizeUrl() {
        return unsupported();
    },

    async exchangeCodeForToken() {
        return unsupported();
    },

    async refreshToken() {
        return unsupported();
    },

    async createRelease() {
        return unsupported();
    },

    async updateCommitStatus() {
        return unsupported();
    },
};
