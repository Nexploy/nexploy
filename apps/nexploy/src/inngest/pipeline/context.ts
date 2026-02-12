import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import {
    PipelineContextData,
    PipelineLogger,
    StatusReporter,
    StepExecutionContext,
    StepId,
    StepResult,
} from '@/types/pipeline.type';

export class PipelineContext implements PipelineContextData {
    public buildId: string;
    public config: BuildConfig;
    public workDir: string | null = null;
    public imageName: string | null = null;
    public imageId: string | null = null;
    public containerId: string | null = null;
    public projectName: string | null = null;
    public abortController: AbortController;
    public startFromStep?: StepId;
    public metadata: Record<string, unknown> = {};

    private stepResults: Map<StepId, StepResult> = new Map();
    private readonly logger: PipelineLogger;
    private readonly reporter: StatusReporter;

    constructor(
        buildId: string,
        config: BuildConfig,
        logger: PipelineLogger,
        reporter: StatusReporter,
    ) {
        this.buildId = buildId;
        this.config = config;
        this.abortController = new AbortController();
        this.startFromStep = config.startFromStep;
        this.logger = logger;
        this.reporter = reporter;

        this.imageName = `${config.repositoryId}:${buildId}`;
        this.projectName = `nexploy-${config.repositoryId}`;
    }

    createStepContext(): StepExecutionContext {
        return {
            context: this,
            logger: this.logger,
            reporter: this.reporter,
            getStepResult: <T>(stepId: StepId) => this.getStepResult<T>(stepId),
            setMetadata: (key: string, value: unknown) => this.setMetadata(key, value),
            getMetadata: <T>(key: string) => this.getMetadata<T>(key),
        };
    }

    setStepResult(stepId: StepId, result: StepResult): void {
        this.stepResults.set(stepId, result);
    }

    getStepResult<T>(stepId: StepId): T | undefined {
        const result = this.stepResults.get(stepId);
        return result?.data as T | undefined;
    }

    isStepCompleted(stepId: StepId): boolean {
        const result = this.stepResults.get(stepId);
        return result?.success === true;
    }

    setMetadata(key: string, value: unknown): void {
        this.metadata[key] = value;
    }

    getMetadata<T>(key: string): T | undefined {
        return this.metadata[key] as T | undefined;
    }

    getCompletedSteps(): StepId[] {
        return Array.from(this.stepResults.entries())
            .filter(([_, result]) => result.success)
            .map(([stepId]) => stepId);
    }

    abort(): void {
        this.abortController.abort();
    }

    isAborted(): boolean {
        return this.abortController.signal.aborted;
    }

    getSignal(): AbortSignal {
        return this.abortController.signal;
    }
}
