import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import {
    PipelineContextData,
    StepExecutionContext,
    PipelineLogger,
    StatusReporter,
    StepId,
    StepResult,
} from './types';

/**
 * Pipeline Context - Manages shared state across all pipeline steps
 */
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
    private logger: PipelineLogger;
    private reporter: StatusReporter;

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

        // Initialize common values
        this.imageName = `${config.repositoryId}:${buildId}`;
        this.projectName = `nexploy-${config.repositoryId}`;
    }

    /**
     * Create execution context for a step
     */
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

    /**
     * Store result of a step execution
     */
    setStepResult(stepId: StepId, result: StepResult): void {
        this.stepResults.set(stepId, result);
    }

    /**
     * Get result of a previously executed step
     */
    getStepResult<T>(stepId: StepId): T | undefined {
        const result = this.stepResults.get(stepId);
        return result?.data as T | undefined;
    }

    /**
     * Check if a step has been completed
     */
    isStepCompleted(stepId: StepId): boolean {
        const result = this.stepResults.get(stepId);
        return result?.success === true;
    }

    /**
     * Set metadata value
     */
    setMetadata(key: string, value: unknown): void {
        this.metadata[key] = value;
    }

    /**
     * Get metadata value
     */
    getMetadata<T>(key: string): T | undefined {
        return this.metadata[key] as T | undefined;
    }

    /**
     * Get all completed step IDs
     */
    getCompletedSteps(): StepId[] {
        return Array.from(this.stepResults.entries())
            .filter(([_, result]) => result.success)
            .map(([stepId]) => stepId);
    }

    /**
     * Abort the pipeline
     */
    abort(): void {
        this.abortController.abort();
    }

    /**
     * Check if pipeline is aborted
     */
    isAborted(): boolean {
        return this.abortController.signal.aborted;
    }

    /**
     * Get abort signal for async operations
     */
    getSignal(): AbortSignal {
        return this.abortController.signal;
    }
}
