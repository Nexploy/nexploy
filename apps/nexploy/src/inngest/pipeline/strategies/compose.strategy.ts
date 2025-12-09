import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { BaseStrategy } from './base.strategy';
import { BaseStep } from '../steps/base.step';
import { IPipelineStep, StepMetadata, StepExecutionContext, StepResult } from '../types';
import { gitService, dockerService } from '../services';

// ============================================================================
// Docker Compose-specific Steps
// ============================================================================

/**
 * Prepare Compose Step
 * Validates the Docker Compose file exists and has valid syntax
 */
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
            // Find the compose file
            const composePath = await gitService.validateComposeFile(
                workDir,
                config.dockerComposePath,
            );

            // Validate syntax
            await gitService.validateComposeSyntax(workDir, composePath);

            // Store the found path for later use
            ctx.setMetadata('composePath', composePath);

            await ctx.logger.info(this.metadata.id, `Docker Compose file validated: ${composePath}`);

            return this.success({ composePath });
        } catch (error) {
            throw new Error(
                `Docker Compose validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

/**
 * Deploy Compose Step
 * Deploys the Docker Compose stack
 */
class DeployComposeStep extends BaseStep {
    readonly metadata: StepMetadata = {
        id: 'deploy-compose',
        name: 'Deploy Docker Compose',
        description: 'Deploy Docker Compose stack',
        retryable: true,
        timeout: 600000, // 10 minutes
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

        const composePath = ctx.getMetadata<string>('composePath');

        const onLog = async (message: string) => {
            await ctx.logger.info(this.metadata.id, message);
        };

        try {
            const result = await dockerService.deployCompose(
                workDir,
                projectName,
                composePath,
                config.envVariables,
                ctx.context.abortController.signal,
                onLog,
            );

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

// ============================================================================
// Docker Compose Strategy
// ============================================================================

const prepareComposeStep = new PrepareComposeStep();
const deployComposeStep = new DeployComposeStep();

/**
 * Docker Compose Build Strategy
 * Deploys applications using Docker Compose
 */
export class DockerComposeStrategy extends BaseStrategy {
    readonly buildType = 'DOCKER_COMPOSE' as const;
    readonly name = 'Docker Compose';

    protected getStrategySteps(): IPipelineStep[] {
        return [prepareComposeStep, deployComposeStep];
    }

    validateConfig(config: BuildConfig): void {
        super.validateConfig(config);
        // Docker Compose-specific validation can be added here
    }
}

export const dockerComposeStrategy = new DockerComposeStrategy();
