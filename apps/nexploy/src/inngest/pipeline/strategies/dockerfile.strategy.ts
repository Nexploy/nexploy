import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { BaseStrategy } from './base.strategy';
import { BaseStep } from '../steps/base.step';
import { IPipelineStep, StepMetadata, StepExecutionContext, StepResult } from '../types';
import { gitService, dockerService } from '../services';

// ============================================================================
// Dockerfile-specific Steps
// ============================================================================

/**
 * Prepare Dockerfile Step
 * Validates the Dockerfile exists in the work directory
 */
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

/**
 * Build Docker Image Step
 * Builds the Docker image using the Dockerfile
 */
class BuildDockerImageStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'build-docker-image',
        name: 'Build Docker Image',
        description: 'Build Docker image from Dockerfile',
        retryable: true,
        timeout: 600000, // 10 minutes
    };

    protected readonly applicableBuildTypes = ['DOCKERFILE'] as const;

    async execute(ctx: StepExecutionContext): Promise<StepResult<{ imageId?: string }>> {
        const { workDir, imageName } = ctx.context;

        if (!workDir || !imageName) {
            throw new Error('Work directory and image name are required');
        }

        await ctx.logger.info(this.metadata.id, `Building Docker image: ${imageName}`);

        const onLog = async (message: string) => {
            await ctx.logger.info(this.metadata.id, message);
        };

        try {
            const result = await dockerService.buildImage(
                workDir,
                imageName,
                ctx.context.abortController.signal,
                onLog,
            );

            ctx.context.imageId = result.imageId || null;

            await ctx.logger.info(
                this.metadata.id,
                `Docker image built successfully${result.imageId ? `: ${result.imageId.slice(0, 12)}` : ''}`,
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

/**
 * Deploy Container Step
 * Creates and starts a container from the built image
 */
class DeployContainerStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'deploy-container',
        name: 'Deploy Container',
        description: 'Deploy Docker container from built image',
        retryable: true,
        timeout: 120000, // 2 minutes
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

// ============================================================================
// Dockerfile Strategy
// ============================================================================

const prepareDockerfileStep = new PrepareDockerfileStep();
const buildDockerImageStep = new BuildDockerImageStep();
const deployContainerStep = new DeployContainerStep();

/**
 * Dockerfile Build Strategy
 * Builds applications using a Dockerfile and deploys as a single container
 */
export class DockerfileStrategy extends BaseStrategy {
    readonly buildType = 'DOCKERFILE' as const;
    readonly name = 'Dockerfile';

    protected getStrategySteps(): IPipelineStep[] {
        return [prepareDockerfileStep, buildDockerImageStep, deployContainerStep];
    }

    validateConfig(config: BuildConfig): void {
        super.validateConfig(config);
        // Dockerfile-specific validation can be added here
    }
}

export const dockerfileStrategy = new DockerfileStrategy();
