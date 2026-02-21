import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { BaseStrategy } from './base.strategy';
import { BaseStep } from '../steps/base.step';
import { IPipelineStep, StepExecutionContext, StepMetadata, StepResult } from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { dockerService } from '@/inngest/pipeline/services/docker.service';
import { prisma } from '@/../prisma/prisma';

class PrepareComposeStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'prepare-compose',
        name: 'Prepare Docker Compose',
        description: 'Validate Docker Compose file',
        retryable: false,
        timeout: 60000,
    };

    protected readonly applicableBuildTypes = ['DOCKER_COMPOSE'] as const;

    async execute(ctx: StepExecutionContext): Promise<StepResult<{ composePath: string }>> {
        const { config, workDir } = ctx.context;

        if (!workDir) {
            throw new Error('Work directory not set');
        }

        await ctx.logger.info(this.metadata.id, 'Validating Docker Compose file');

        try {
            const composePath = await gitService.validateComposeFile(
                workDir,
                config.dockerComposePath,
            );

            await gitService.validateComposeSyntax(workDir, composePath);

            ctx.setMetadata('composePath', composePath);

            await ctx.logger.info(
                this.metadata.id,
                `Docker Compose file validated: ${composePath}`,
            );

            return this.success({ composePath });
        } catch (error) {
            throw new Error(
                `Docker Compose validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

class DeployComposeStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'deploy-compose',
        name: 'Deploy Docker Compose',
        description: 'Deploy Docker Compose stack',
        retryable: true,
        timeout: 600000,
    };

    protected readonly applicableBuildTypes = ['DOCKER_COMPOSE'] as const;

    async execute(
        ctx: StepExecutionContext,
    ): Promise<StepResult<{ success: boolean; containers?: string[] }>> {
        const { config, workDir, projectName } = ctx.context;

        if (!workDir || !projectName) {
            throw new Error('Work directory and project name are required');
        }

        await ctx.reporter.setStatus('DEPLOYING');
        await ctx.logger.info(this.metadata.id, 'Starting Docker Compose deployment');

        const composePath = ctx.getMetadata<string>('composePath') || config.dockerComposePath;

        const onLog = async (message: string) => {
            await ctx.logger.info(this.metadata.id, message);
        };

        const labels: Record<string, string> = {
            [NEXPLOY_LABELS.version]: 'true',
            [NEXPLOY_LABELS.repositoryId]: config.repositoryId,
            [NEXPLOY_LABELS.buildId]: ctx.context.buildId,
            [NEXPLOY_LABELS.buildType]: config.buildType,
            [NEXPLOY_LABELS.imageTag]: config.imageTag,
            [NEXPLOY_LABELS.branch]: config.gitBranch,
            ...(config.gitCommitHash && { [NEXPLOY_LABELS.commitHash]: config.gitCommitHash }),
            ...(config.gitCommitMessage && { [NEXPLOY_LABELS.commitMessage]: config.gitCommitMessage }),
        };

        try {
            const result = await dockerService.deployCompose(
                workDir,
                projectName,
                composePath,
                config.envVariables,
                ctx.context.abortController.signal,
                onLog,
                config.environmentId,
                ctx.context.buildId,
                config.repositoryId,
                labels,
            );

            if (result.versioned) {
                try {
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
                                imageTag: ctx.context.buildId,
                            },
                        },
                        update: { composeConfig: result.composeConfig ?? null },
                        create: {
                            repositoryId: config.repositoryId,
                            imageTag: ctx.context.buildId,
                            versionNumber,
                            buildType: config.buildType,
                            branch: config.gitBranch ?? null,
                            commitHash: config.gitCommitHash ?? null,
                            commitMessage: config.gitCommitMessage ?? null,
                            composeConfig: result.composeConfig ?? null,
                            environmentId: config.environmentId ?? null,
                        },
                    });
                } catch (err) {
                    await ctx.logger.warn(
                        this.metadata.id,
                        `Failed to save version to DB: ${err instanceof Error ? err.message : String(err)}`,
                    );
                }
            }

            await ctx.logger.info(
                this.metadata.id,
                `Docker Compose stack deployed: ${projectName}${
                    result.containers ? ` (${result.containers.length} containers)` : ''
                }`,
            );

            return this.success(result);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }
            throw new Error(
                `Docker Compose deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

const prepareComposeStep = new PrepareComposeStep();
const deployComposeStep = new DeployComposeStep();

export class DockerComposeStrategy extends BaseStrategy {
    readonly buildType = 'DOCKER_COMPOSE' as const;
    readonly name = 'Docker Compose';

    protected getStrategySteps(): IPipelineStep[] {
        return [prepareComposeStep, deployComposeStep];
    }

    validateConfig(config: BuildConfig): void {
        super.validateConfig(config);
    }
}

export const dockerComposeStrategy = new DockerComposeStrategy();
