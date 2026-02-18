import { BaseStep } from './base.step';
import { StepExecutionContext, StepMetadata, StepResult } from '@/types/pipeline.type';
import { prisma } from '@/../prisma/prisma';

export class FinalizeStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'finalize-logs',
        name: 'Finalize',
        description: 'Mark build as completed and finalize logs',
        retryable: false,
        timeout: 30000,
    };

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        await ctx.logger.info(this.metadata.id, 'Build pipeline completed successfully');
        await ctx.reporter.setStatus('COMPLETED');

        const { config } = ctx.context;
        // DOCKER_COMPOSE versions are saved in DeployComposeStep (has composeConfig available).
        // Only create version here for non-compose builds.
        if (config.buildType !== 'DOCKER_COMPOSE') {
            // For Dockerfile builds, the image is tagged with the full buildId
            // (ctx.context.buildId), not config.imageTag (which is only the last 8 chars).
            // We must store the real Docker image tag so deployVersion can find it.
            const imageTag = ctx.context.buildId;
            try {
                await prisma.version.upsert({
                    where: {
                        repositoryId_imageTag: {
                            repositoryId: config.repositoryId,
                            imageTag,
                        },
                    },
                    update: {},
                    create: {
                        repositoryId: config.repositoryId,
                        imageTag,
                        buildType: config.buildType,
                        branch: config.gitBranch ?? null,
                        commitHash: config.gitCommitHash ?? null,
                        commitMessage: config.gitCommitMessage ?? null,
                    },
                });
            } catch (err) {
                await ctx.logger.warn(this.metadata.id, `Failed to save version to DB: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        return this.success({
            imageId: ctx.context.imageId,
            containerId: ctx.context.containerId,
            projectName: ctx.context.projectName,
        });
    }
}

export const finalizeStep = new FinalizeStep();
