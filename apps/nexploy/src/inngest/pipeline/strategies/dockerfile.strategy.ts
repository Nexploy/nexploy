import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { NEXPLOY_LABELS } from '@/lib/nexployLabels';
import { BaseStrategy } from './base.strategy';
import { BaseStep } from '../steps/base.step';
import { IPipelineStep, StepExecutionContext, StepMetadata, StepResult } from '@/types/pipeline.type';
import { gitService } from '@/inngest/pipeline/services/git.service';
import { dockerService } from '@/inngest/pipeline/services/docker.service';

class PrepareDockerfileStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'prepare-dockerfile',
        name: 'Prepare Dockerfile',
        description: 'Validate Dockerfile exists',
        retryable: false,
        timeout: 30000,
    };

    protected readonly applicableBuildTypes = ['DOCKERFILE'] as const;

    async execute(ctx: StepExecutionContext): Promise<StepResult> {
        const { config, workDir } = ctx.context;

        if (!workDir) {
            throw new Error('Work directory not set');
        }

        await ctx.logger.info(this.metadata.id, 'Validating Dockerfile');

        try {
            await gitService.validateDockerfile(workDir, config.dockerfilePath);
            await ctx.logger.info(this.metadata.id, 'Dockerfile validated');
            return this.success();
        } catch (error) {
            throw new Error(
                `Dockerfile validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

class BuildDockerImageStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'build-docker-image',
        name: 'Build Docker Image',
        description: 'Build Docker image from Dockerfile',
        retryable: true,
        timeout: 600000,
    };

    protected readonly applicableBuildTypes = ['DOCKERFILE'] as const;

    async execute(ctx: StepExecutionContext): Promise<StepResult<{ imageId?: string }>> {
        const { workDir, imageName, config } = ctx.context;

        if (!workDir || !imageName) {
            throw new Error('Work directory and image name are required');
        }

        await ctx.logger.info(this.metadata.id, `Building Docker image: ${imageName}`);

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
            const result = await dockerService.buildImage(
                workDir,
                imageName,
                config.dockerfilePath,
                ctx.context.abortController.signal,
                onLog,
                config.environmentId,
                labels,
            );

            ctx.context.imageId = result.imageId || null;

            await ctx.logger.info(
                this.metadata.id,
                `Docker image built successfully: ${result.imageId ? `: ${result.imageId.slice(0, 12)}` : ''}`,
            );

            return this.success(result);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }
            throw new Error(
                `Docker build failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

class DeployContainerStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'deploy-container',
        name: 'Deploy Container',
        description: 'Deploy Docker container from built image',
        retryable: true,
        timeout: 120000,
    };

    protected readonly applicableBuildTypes = ['DOCKERFILE'] as const;

    async execute(ctx: StepExecutionContext): Promise<StepResult<{ containerId: string }>> {
        const { config, imageName } = ctx.context;

        if (!imageName) {
            throw new Error('Image name is required');
        }

        await ctx.reporter.setStatus('DEPLOYING');
        await ctx.logger.info(this.metadata.id, 'Starting container deployment');

        try {
            const result = await dockerService.deployContainer(
                config.repositoryId,
                imageName,
                config.envVariables,
                ctx.context.abortController.signal,
                config.environmentId,
            );

            ctx.context.containerId = result.containerId;

            await ctx.logger.info(
                this.metadata.id,
                `Container deployed: ${result.containerId.slice(0, 12)}`,
            );

            return this.success(result);
        } catch (error) {
            throw new Error(
                `Container deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

const prepareDockerfileStep = new PrepareDockerfileStep();
const buildDockerImageStep = new BuildDockerImageStep();
const deployContainerStep = new DeployContainerStep();

export class DockerfileStrategy extends BaseStrategy {
    readonly buildType = 'DOCKERFILE' as const;
    readonly name = 'Dockerfile';

    protected getStrategySteps(): IPipelineStep[] {
        return [prepareDockerfileStep, buildDockerImageStep, deployContainerStep];
    }

    validateConfig(config: BuildConfig): void {
        super.validateConfig(config);
    }
}

export const dockerfileStrategy = new DockerfileStrategy();
