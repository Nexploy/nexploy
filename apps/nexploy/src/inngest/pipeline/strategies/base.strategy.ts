import { BuildConfig, BuildType } from '@workspace/typescript-interface/inngest/build';
import { IBuildStrategy, IPipelineStep } from '../types';
import { finalizeStep } from '@/inngest/pipeline/steps/finalize.step';
import { cleanupStep } from '@/inngest/pipeline/steps/cleanup.step';
import { envStep } from '@/inngest/pipeline/steps/env.step';
import { cloneStep } from '@/inngest/pipeline/steps/clone.step';

export abstract class BaseStrategy implements IBuildStrategy {
    abstract readonly buildType: BuildType;
    abstract readonly name: string;

    protected getCommonPreSteps(): IPipelineStep[] {
        return [cloneStep];
    }

    protected abstract getStrategySteps(): IPipelineStep[];

    getSteps(): IPipelineStep[] {
        const preSteps = this.getCommonPreSteps();
        const strategySteps = this.getStrategySteps();

        return [
            ...preSteps,
            ...strategySteps.filter((s) => s.metadata.id.includes('prepare')),
            envStep,
            ...strategySteps.filter((s) => !s.metadata.id.includes('prepare')),
            cleanupStep,
            finalizeStep,
        ];
    }

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
