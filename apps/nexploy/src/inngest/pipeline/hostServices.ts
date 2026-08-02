import dayjs from 'dayjs';
import {
    type BuildHostService,
    type GitHostService,
    type NodeHostServices,
} from '@workspace/typescript-interface/pipeline/nodeServices';
import { kyDocker } from '@/lib/api/kyDocker';
import { getAllEnvsBuild, startBuildRepository, updateBuildGitInfo } from '@/services/repository/build.service';
import { getGitProviderToken, getValidToken } from '@/services/git/core/token.service';
import { getGitAdapter } from '@/services/git/core/registry';

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
};

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
};

export const hostServices: NodeHostServices = {
    docker: kyDocker,
    build: buildHostService,
    git: gitHostService,
};
