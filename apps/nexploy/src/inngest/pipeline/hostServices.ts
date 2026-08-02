import dayjs from 'dayjs';
import {
    type BucketStorageHostService,
    type BuildHostService,
    type DomainHostService,
    type EnvironmentHostService,
    type GitHostService,
    type NodeHostServices,
    type RegistryHostService,
    type SslHostService,
    type VersionHostService,
} from '@nexploy/nodes/core/nodeServices';
import type { BuildConfig } from '@workspace/typescript-interface/repository/build';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { getAllEnvsBuild, startBuildRepository, updateBuildGitInfo } from '@/services/repository/build.service';
import { getFirstStage } from '@/services/repository/deploymentStage.service';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';
import { getGitAdapter } from '@/services/git/core/registry';
import { getRegistryWithPassword } from '@/services/registry.service';
import { generateTraefikConfig, getDomainKey, getDomains } from '@/services/traefik.service';
import { provisionDomainDns } from '@/services/domainCloudflare.service';
import { createCustomCertificate, createLetsEncryptCertificate } from '@/services/sslCertificate.service';
import { getBucketStorageCredentials } from '@/services/bucketStorage.service';
import { createBucketStorageClient, putBucketStorageObject } from '@/lib/bucket-storage/bucketStorage';
import { getNextVersionNumber, upsertVersion } from '@/services/repository/version.service';
import { getDefaultEnvironment } from '@/services/environment/environment.service';

const buildHostService: BuildHostService = {
    async getStageEnvVariables(stageId) {
        const envs = await getAllEnvsBuild(stageId);
        return envs.map((env) => ({ key: env.key, value: env.value }));
    },

    updateGitInfo(buildId, branch, commitHash, commitMessage) {
        return updateBuildGitInfo(buildId, branch, commitHash, commitMessage);
    },

    async startStageBuild({ repositoryId, branch, stageId, userId, triggeredByStageId }) {
        const started = await startBuildRepository(
            { repositoryId, branch, stageId },
            userId,
            'manual',
            triggeredByStageId,
        );
        return started ? { id: started.id, numberBuild: started.numberBuild } : null;
    },

    async findStage(repositoryId, stageId) {
        const stage = await getFirstStage(repositoryId, stageId);
        return stage ? { id: stage.id, name: stage.name } : null;
    },
};

async function requireAccessToken(buildConfig: BuildConfig): Promise<string> {
    const stored = await getGitProviderToken(buildConfig.gitProvider, {
        gitAccountId: buildConfig.gitAccountId,
        requestedUserId: buildConfig.userId,
    });
    const { accessToken } = await getValidToken(
        stored,
        buildConfig.gitProvider,
        buildConfig.userId,
        buildConfig.gitAccountId,
    );
    if (!accessToken) throw new Error('No access token available for Git provider');
    return accessToken;
}

const gitHostService: GitHostService = {
    get workDirRoot() {
        return process.env.DEPLOYER_WORK_DIR as string;
    },

    async resolveToken(buildConfig, manualToken) {
        if (manualToken !== undefined) {
            return {
                accessToken: manualToken || null,
                refreshToken: null,
                accessTokenExpiresAt: null,
            };
        }
        const stored = await getGitProviderToken(buildConfig.gitProvider, {
            gitAccountId: buildConfig.gitAccountId,
            requestedUserId: buildConfig.userId,
        });
        return getValidToken(stored, buildConfig.gitProvider, buildConfig.userId, buildConfig.gitAccountId);
    },

    refreshToken(buildConfig, expiredToken) {
        return getValidToken(
            { ...expiredToken, accessTokenExpiresAt: dayjs(0).toDate() },
            buildConfig.gitProvider,
            buildConfig.userId,
            buildConfig.gitAccountId,
        );
    },

    getCloneCredentialUsername(provider) {
        return getGitAdapter(provider).cloneCredentialUsername;
    },

    parseRepoUrl(provider, gitUrl) {
        const { baseUrl, owner, repo } = getGitAdapter(provider).parseRepoUrl(gitUrl);
        return { baseUrl, owner, repo };
    },

    async createRelease(buildConfig, input) {
        const adapter = getGitAdapter(buildConfig.gitProvider);
        const token = await requireAccessToken(buildConfig);
        const { baseUrl, owner, repo } = adapter.parseRepoUrl(buildConfig.gitUrl);
        return adapter.createRelease({ token, baseUrl, owner, repo, ...input });
    },

    async updateCommitStatus(buildConfig, input) {
        const adapter = getGitAdapter(buildConfig.gitProvider);
        const token = await requireAccessToken(buildConfig);
        const { baseUrl, owner, repo } = adapter.parseRepoUrl(buildConfig.gitUrl);
        await adapter.updateCommitStatus({ token, baseUrl, owner, repo, ...input });
    },
};

const registryHostService: RegistryHostService = {
    getCredentials(registryId) {
        return getRegistryWithPassword(registryId);
    },
};

const domainHostService: DomainHostService = {
    listDomains() {
        return getDomains();
    },

    getDomainKey(host) {
        return getDomainKey({ host });
    },

    applyDomains(domains) {
        return generateTraefikConfig(domains as Domain[]);
    },

    provisionDns(domain, host) {
        return provisionDomainDns(domain as Domain, host);
    },
};

const sslHostService: SslHostService = {
    createLetsEncryptCertificate(name, domain, email) {
        return createLetsEncryptCertificate(name, domain, email);
    },

    createCustomCertificate(name, domain, certificate, privateKey) {
        return createCustomCertificate(name, domain, certificate, privateKey);
    },
};

const bucketStorageHostService: BucketStorageHostService = {
    async putObject(accountId, bucket, key, body, contentType) {
        const credentials = await getBucketStorageCredentials(accountId);
        const client = createBucketStorageClient(credentials);
        await putBucketStorageObject(client, bucket, key, body, contentType);
    },
};

const versionHostService: VersionHostService = {
    getNextVersionNumber(repositoryId, environmentId) {
        return getNextVersionNumber(repositoryId, environmentId);
    },

    saveVersion(input) {
        return upsertVersion(input);
    },
};

const environmentHostService: EnvironmentHostService = {
    async getDefaultEnvironmentId() {
        const environment = await getDefaultEnvironment();
        return environment?.id;
    },
};

export const hostServices: NodeHostServices = {
    docker: kyDocker,
    build: buildHostService,
    git: gitHostService,
    registry: registryHostService,
    domain: domainHostService,
    ssl: sslHostService,
    bucketStorage: bucketStorageHostService,
    version: versionHostService,
    environment: environmentHostService,
};
