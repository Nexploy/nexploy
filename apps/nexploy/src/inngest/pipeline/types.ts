import { BuildConfig, BuildType } from '@workspace/typescript-interface/inngest/build';

/**
 * Log levels for pipeline messages
 */
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Step execution status
 */
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * Build status for the entire pipeline
 */
export type PipelineStatus = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/**
 * Step identifier - unique name for each step
 */
export type StepId = string;

/**
 * Result of a step execution
 */
export interface StepResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: Error;
    skipped?: boolean;
}

/**
 * Step metadata for registration
 */
export interface StepMetadata {
    id: StepId;
    name: string;
    description?: string;
    retryable?: boolean;
    timeout?: number;
}

/**
 * Logger interface for pipeline steps
 */
export interface PipelineLogger {
    log(step: string, message: string, level?: LogLevel): Promise<void>;
    debug(step: string, message: string): Promise<void>;
    info(step: string, message: string): Promise<void>;
    warn(step: string, message: string): Promise<void>;
    error(step: string, message: string): Promise<void>;
}

/**
 * Status reporter interface
 */
export interface StatusReporter {
    setStatus(status: PipelineStatus): Promise<void>;
    markStepCompleted(stepId: StepId): Promise<void>;
}

/**
 * Pipeline execution context - shared state between steps
 */
export interface PipelineContextData {
    buildId: string;
    config: BuildConfig;
    workDir: string | null;
    imageName: string | null;
    imageId: string | null;
    containerId: string | null;
    projectName: string | null;
    abortController: AbortController;
    startFromStep?: StepId;
    metadata: Record<string, unknown>;
}

/**
 * Step execution context passed to each step
 */
export interface StepExecutionContext {
    context: PipelineContextData;
    logger: PipelineLogger;
    reporter: StatusReporter;
    getStepResult<T>(stepId: StepId): T | undefined;
    setMetadata(key: string, value: unknown): void;
    getMetadata<T>(key: string): T | undefined;
}

/**
 * Abstract step interface
 */
export interface IPipelineStep {
    readonly metadata: StepMetadata;

    /**
     * Check if this step should run for the given build type
     */
    shouldRun(buildType: BuildType): boolean;

    /**
     * Execute the step
     */
    execute(ctx: StepExecutionContext): Promise<StepResult>;

    /**
     * Optional cleanup on failure
     */
    onError?(ctx: StepExecutionContext, error: Error): Promise<void>;
}

/**
 * Strategy interface for different build types
 */
export interface IBuildStrategy {
    readonly buildType: BuildType;
    readonly name: string;

    /**
     * Get the ordered list of steps for this strategy
     */
    getSteps(): IPipelineStep[];

    /**
     * Validate the build configuration for this strategy
     */
    validateConfig(config: BuildConfig): void;
}

/**
 * Pipeline orchestrator interface
 */
export interface IPipelineOrchestrator {
    /**
     * Register a strategy for a build type
     */
    registerStrategy(strategy: IBuildStrategy): void;

    /**
     * Execute the pipeline for a given configuration
     */
    execute(
        buildId: string,
        config: BuildConfig,
        inngestStep: InngestStepRunner,
        logger: PipelineLogger,
        reporter: StatusReporter,
    ): Promise<PipelineResult>;
}

/**
 * Inngest step runner interface (abstraction over Inngest's step API)
 */
export interface InngestStepRunner {
    run<T>(id: string, fn: () => Promise<T>): Promise<unknown>;
}

/**
 * Final result of pipeline execution
 */
export interface PipelineResult {
    success: boolean;
    imageId?: string;
    containerId?: string;
    projectName?: string;
    error?: string;
    completedSteps: StepId[];
    failedStep?: StepId;
}

/**
 * Progress callback for long-running operations
 */
export type ProgressCallback = (progress: number, message: string) => void | Promise<void>;

/**
 * SSE event from docker-api
 */
export interface SSEEvent {
    type: 'log' | 'error' | 'complete';
    message?: string;
    result?: unknown;
    timestamp?: string;
}
