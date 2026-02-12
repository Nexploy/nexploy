import { BuildConfig, BuildType } from '@workspace/typescript-interface/inngest/build';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type PipelineStatus =
    | 'QUEUED'
    | 'BUILDING'
    | 'DEPLOYING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

export type StepId = string;

export interface StepResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: Error;
    skipped?: boolean;
}

export interface StepMetadata {
    id: StepId;
    name: string;
    description?: string;
    retryable?: boolean;
    timeout?: number;
}

export interface PipelineLogger {
    log(step: string, message: string, level?: LogLevel): Promise<void>;
    debug(step: string, message: string): Promise<void>;
    info(step: string, message: string): Promise<void>;
    warn(step: string, message: string): Promise<void>;
    error(step: string, message: string): Promise<void>;
}

export interface StatusReporter {
    setStatus(status: PipelineStatus): Promise<void>;
    markStepCompleted(stepId: StepId): Promise<void>;
}

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

export interface StepExecutionContext {
    context: PipelineContextData;
    logger: PipelineLogger;
    reporter: StatusReporter;
    getStepResult<T>(stepId: StepId): T | undefined;
    setMetadata(key: string, value: unknown): void;
    getMetadata<T>(key: string): T | undefined;
}

export interface IPipelineStep {
    readonly metadata: StepMetadata;

    shouldRun(buildType: BuildType): boolean;

    execute(ctx: StepExecutionContext): Promise<StepResult>;

    onError?(ctx: StepExecutionContext, error: Error): Promise<void>;
}

export interface IBuildStrategy {
    readonly buildType: BuildType;
    readonly name: string;

    getSteps(): IPipelineStep[];

    validateConfig(config: BuildConfig): void;
}

export interface IPipelineOrchestrator {
    registerStrategy(strategy: IBuildStrategy): void;

    execute(
        buildId: string,
        config: BuildConfig,
        inngestStep: InngestStepRunner,
        logger: PipelineLogger,
        reporter: StatusReporter,
    ): Promise<PipelineResult>;
}

export interface InngestStepRunner {
    run<T>(id: string, fn: () => Promise<T>): Promise<unknown>;
}

export interface PipelineResult {
    success: boolean;
    imageId?: string;
    containerId?: string;
    projectName?: string;
    error?: string;
    completedSteps: StepId[];
    failedStep?: StepId;
}

export type ProgressCallback = (progress: number, message: string) => void | Promise<void>;

export interface SSEEvent {
    type: 'log' | 'error' | 'complete';
    message?: string;
    result?: unknown;
    timestamp?: string;
}
