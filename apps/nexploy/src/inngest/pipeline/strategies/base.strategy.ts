import { BuildConfig, BuildType } from '@workspace/typescript-interface/inngest/build';
import { IBuildStrategy, IPipelineStep } from '../types';
import { cloneStep, envStep, cleanupStep, finalizeStep } from '../steps';

/**
 * Base Strategy
 * Provides common functionality for all build strategies
 */
export abstract class BaseStrategy implements IBuildStrategy {
    abstract readonly buildType: BuildType;
    abstract readonly name: string;

    /**
     * Get common steps that run for all strategies
     */
    protected getCommonPreSteps(): IPipelineStep[] {
        return [cloneStep];
    }

    /**
     * Get strategy-specific steps (to be implemented by subclasses)
     */
    protected abstract getStrategySteps(): IPipelineStep[];

    /**
     * Get common post-steps that run for all strategies
     */
    protected getCommonPostSteps(): IPipelineStep[] {
        return [envStep, cleanupStep, finalizeStep];
    }

    /**
     * Get the full ordered list of steps
     * Order: common pre-steps -> strategy steps -> common post-steps
     */
    getSteps(): IPipelineStep[] {
        const preSteps = this.getCommonPreSteps();
        const strategySteps = this.getStrategySteps();
        const postSteps = this.getCommonPostSteps();

        // Insert strategy steps after clone but include env before deploy steps
        // Final order: clone -> strategy-prepare -> env -> strategy-deploy -> cleanup -> finalize
        return [
            ...preSteps,                                    // clone
            ...strategySteps.filter(s => s.metadata.id.includes('prepare')),  // prepare steps
            envStep,                                        // env
            ...strategySteps.filter(s => !s.metadata.id.includes('prepare')), // build/deploy steps
            cleanupStep,                                    // cleanup
            finalizeStep,                                   // finalize
        ];
    }

    /**
     * Validate the build configuration
     * Can be overridden by subclasses for specific validation
     */
    validateConfig(config: BuildConfig): void {
        if (!config.repositoryId) {
            throw new Error('Repository ID is required');
        }
        if (!config.gitUrl) {
            throw new Error('Git URL is required');
        }
        if (!config.gitBranch) {
            throw new Error('Git branch is required');
        }
    }
}
