import { type BuildHostService, type NodeHostServices } from '@workspace/typescript-interface/pipeline/nodeServices';
import { kyDocker } from '@/lib/api/kyDocker';
import { getAllEnvsBuild, startBuildRepository, updateBuildGitInfo } from '@/services/repository/build.service';

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

export const hostServices: NodeHostServices = {
    docker: kyDocker,
    build: buildHostService,
};
