import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { prisma } from '../../../../../prisma/prisma';

export class SaveVersionExecutor implements INodeExecutor {
    readonly type = 'save-version';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { config, logger, nodeId, inputNodes, allOutputs } = ctx;

        await logger.info(nodeId, 'Saving version...');

        // Retrieve composeConfig if a deploy-compose node is connected
        let composeConfig: string | null = null;
        for (const inputNode of inputNodes) {
            if (inputNode.type === 'deploy-compose') {
                const deployOutput = allOutputs.get(inputNode.id);
                if (deployOutput?.composeConfig && typeof deployOutput.composeConfig === 'string') {
                    composeConfig = deployOutput.composeConfig;
                    break;
                }
            }
        }

        const lastVersion = await prisma.version.findFirst({
            where: {
                repositoryId: config.repositoryId,
                environmentId: config.environmentId ?? null,
            },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
        });

        const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

        await prisma.version.upsert({
            where: {
                repositoryId_imageTag: {
                    repositoryId: config.repositoryId,
                    imageTag: config.imageTag,
                },
            },
            update: {},
            create: {
                repositoryId: config.repositoryId,
                imageTag: config.imageTag,
                versionNumber,
                buildType: 'NODE_PIPELINE',
                branch: config.gitBranch ?? null,
                commitHash: config.gitCommitHash ?? null,
                commitMessage: config.gitCommitMessage ?? null,
                environmentId: config.environmentId ?? null,
                composeConfig,
            },
        });

        await logger.info(nodeId, `Version v${versionNumber} saved (tag: ${config.imageTag})`);

        return {
            success: true,
            output: { versionNumber },
        };
    }
}

export const saveVersionExecutor = new SaveVersionExecutor();
