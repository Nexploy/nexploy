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

        if (config.buildType !== 'DOCKER_COMPOSE') {
            const imageTag = ctx.context.buildId;
            try {
                const lastVersion = await prisma.version.findFirst({
                    where: { repositoryId: config.repositoryId },
                    orderBy: { versionNumber: 'desc' },
                    select: { versionNumber: true },
                });
                const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

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
                        versionNumber,
                        buildType: config.buildType,
                        branch: config.gitBranch ?? null,
                        commitHash: config.gitCommitHash ?? null,
                        commitMessage: config.gitCommitMessage ?? null,
                    },
                });
            } catch (err) {
                await ctx.logger.warn(
                    this.metadata.id,
                    `Failed to save version to DB: ${err instanceof Error ? err.message : String(err)}`,
                );
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
