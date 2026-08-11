import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import {
    type RunnerCapabilities,
    type RunnerGitCredentials,
    type RunnerJobSpec,
    type RunnerLoad,
    type RunnerMessage,
    type ServerMessage,
} from '@/server/runner/protocol';

const ACCEPT_TIMEOUT_MS = 30_000;
const DEFAULT_JOB_TIMEOUT_MS = 3_600_000;
const HEARTBEAT_GRACE_MS = 90_000;

export interface ConnectedRunner {
    runnerId: string;
    name: string;
    socket: WebSocket;
    capabilities: RunnerCapabilities;
    load: RunnerLoad | null;
    activeJobs: Set<string>;
    connectedAt: number;
    lastSeenAt: number;
}

export interface RunnerJobHandlers {
    onLog: (message: string, level: 'info' | 'warn' | 'error') => void;
    onProgress?: (phase: string, message?: string) => void;
    refreshCredentials?: () => Promise<RunnerGitCredentials | null>;
}

export interface RunnerJobResult {
    imageId?: string;
    imageName?: string;
    pushedImages: string[];
    digest?: string;
}

interface PendingJob {
    jobId: string;
    runnerId: string;
    handlers: RunnerJobHandlers;
    resolve: (result: RunnerJobResult) => void;
    reject: (error: Error) => void;
    acceptTimer: NodeJS.Timeout | null;
    jobTimer: NodeJS.Timeout | null;
    settled: boolean;
}

interface RunnerHubState {
    runners: Map<string, ConnectedRunner>;
    jobs: Map<string, PendingJob>;
}

const globalForRunnerHub = globalThis as unknown as { nexployRunnerHub?: RunnerHubState };

const state: RunnerHubState = (globalForRunnerHub.nexployRunnerHub ??= {
    runners: new Map(),
    jobs: new Map(),
});

export class RunnerUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RunnerUnavailableError';
    }
}

function send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify(message));
}

function settle(job: PendingJob, outcome: { result?: RunnerJobResult; error?: Error }): void {
    if (job.settled) return;
    job.settled = true;

    if (job.acceptTimer) clearTimeout(job.acceptTimer);
    if (job.jobTimer) clearTimeout(job.jobTimer);

    state.jobs.delete(job.jobId);
    state.runners.get(job.runnerId)?.activeJobs.delete(job.jobId);

    if (outcome.error) job.reject(outcome.error);
    else job.resolve(outcome.result ?? { pushedImages: [] });
}

export function attachRunner(input: {
    runnerId: string;
    name: string;
    socket: WebSocket;
    capabilities: RunnerCapabilities;
}): ConnectedRunner {
    const existing = state.runners.get(input.runnerId);

    if (existing && existing.socket !== input.socket) {
        console.warn(`⚠️ Build runner ${input.name} opened a second connection, closing the previous one`);
        send(existing.socket, {
            type: 'error',
            code: 'replaced',
            message: 'Runner reconnected elsewhere',
            fatal: true,
        });
        existing.socket.close(4009, 'replaced');
        failJobsOfRunner(input.runnerId, 'Runner reconnected while the build was running');
    }

    const runner: ConnectedRunner = {
        runnerId: input.runnerId,
        name: input.name,
        socket: input.socket,
        capabilities: input.capabilities,
        load: null,
        activeJobs: new Set(),
        connectedAt: Date.now(),
        lastSeenAt: Date.now(),
    };

    state.runners.set(input.runnerId, runner);

    return runner;
}

export function detachRunner(runnerId: string, socket: WebSocket): void {
    const runner = state.runners.get(runnerId);
    if (!runner || runner.socket !== socket) return;

    state.runners.delete(runnerId);
    failJobsOfRunner(runnerId, 'Runner disconnected while the build was running');
}

function failJobsOfRunner(runnerId: string, reason: string): void {
    for (const job of [...state.jobs.values()]) {
        if (job.runnerId === runnerId) settle(job, { error: new RunnerUnavailableError(reason) });
    }
}

export function isRunnerOnline(runnerId: string): boolean {
    const runner = state.runners.get(runnerId);
    if (!runner) return false;

    if (Date.now() - runner.lastSeenAt > HEARTBEAT_GRACE_MS) return false;

    return runner.socket.readyState === runner.socket.OPEN;
}

export function getConnectedRunner(runnerId: string): ConnectedRunner | undefined {
    return state.runners.get(runnerId);
}

export function listConnectedRunners(): ConnectedRunner[] {
    return [...state.runners.values()];
}

export function handleRunnerMessage(runnerId: string, message: RunnerMessage): void {
    const runner = state.runners.get(runnerId);
    if (!runner) return;

    runner.lastSeenAt = Date.now();

    switch (message.type) {
        case 'heartbeat':
            runner.load = message.load;
            return;

        case 'job.accept': {
            const job = ownedJob(runnerId, message.jobId);
            if (!job) return;
            if (job.acceptTimer) clearTimeout(job.acceptTimer);
            job.acceptTimer = null;
            runner.activeJobs.add(job.jobId);
            return;
        }

        case 'job.reject': {
            const job = ownedJob(runnerId, message.jobId);
            if (!job) return;
            settle(job, { error: new RunnerUnavailableError(message.reason || 'Runner rejected the job') });
            return;
        }

        case 'job.log': {
            const job = ownedJob(runnerId, message.jobId);
            if (!job) return;
            job.handlers.onLog(message.message, message.level);
            return;
        }

        case 'job.progress': {
            const job = ownedJob(runnerId, message.jobId);
            if (!job) return;
            job.handlers.onProgress?.(message.phase, message.message);
            return;
        }

        case 'job.result': {
            const job = ownedJob(runnerId, message.jobId);
            if (!job) return;

            if (message.status === 'succeeded') {
                settle(job, {
                    result: {
                        imageId: message.imageId,
                        imageName: message.imageName,
                        pushedImages: message.pushedImages,
                        digest: message.digest,
                    },
                });
                return;
            }

            const error = new Error(message.error || `Runner build ${message.status}`);
            if (message.status === 'cancelled') error.name = 'AbortError';
            settle(job, { error });
            return;
        }

        case 'credentials.request': {
            const job = ownedJob(runnerId, message.jobId);
            if (!job) {
                send(runner.socket, {
                    type: 'credentials.response',
                    requestId: message.requestId,
                    credentials: null,
                    error: 'Unknown job',
                });
                return;
            }

            void resolveCredentials(runner, job, message.requestId);
            return;
        }

        default:
            return;
    }
}

async function resolveCredentials(runner: ConnectedRunner, job: PendingJob, requestId: string): Promise<void> {
    if (!job.handlers.refreshCredentials) {
        send(runner.socket, {
            type: 'credentials.response',
            requestId,
            credentials: null,
            error: 'Credential refresh is not available for this job',
        });
        return;
    }

    try {
        const credentials = await job.handlers.refreshCredentials();
        send(runner.socket, { type: 'credentials.response', requestId, credentials });
    } catch (error) {
        send(runner.socket, {
            type: 'credentials.response',
            requestId,
            credentials: null,
            error: error instanceof Error ? error.message : 'Credential refresh failed',
        });
    }
}

function ownedJob(runnerId: string, jobId: string): PendingJob | undefined {
    const job = state.jobs.get(jobId);
    return job && job.runnerId === runnerId ? job : undefined;
}

export function dispatchJob(
    runnerId: string,
    spec: Omit<RunnerJobSpec, 'jobId'>,
    handlers: RunnerJobHandlers,
    signal: AbortSignal,
): Promise<RunnerJobResult> {
    const runner = state.runners.get(runnerId);

    if (!runner || !isRunnerOnline(runnerId)) {
        return Promise.reject(new RunnerUnavailableError('Runner is not connected'));
    }

    if (runner.activeJobs.size >= runner.capabilities.maxConcurrency) {
        return Promise.reject(new RunnerUnavailableError('Runner is at capacity'));
    }

    const jobId = `job_${randomUUID()}`;
    const timeoutMs = spec.timeoutMs ?? DEFAULT_JOB_TIMEOUT_MS;

    return new Promise<RunnerJobResult>((resolve, reject) => {
        const job: PendingJob = {
            jobId,
            runnerId,
            handlers,
            resolve,
            reject,
            acceptTimer: null,
            jobTimer: null,
            settled: false,
        };

        state.jobs.set(jobId, job);

        job.acceptTimer = setTimeout(() => {
            settle(job, { error: new RunnerUnavailableError('Runner did not accept the job in time') });
        }, ACCEPT_TIMEOUT_MS);

        job.jobTimer = setTimeout(() => {
            send(runner.socket, { type: 'job.cancel', jobId, reason: 'timeout' });
            settle(job, { error: new Error(`Runner build exceeded ${Math.round(timeoutMs / 1000)}s`) });
        }, timeoutMs);

        const onAbort = () => {
            send(runner.socket, { type: 'job.cancel', jobId, reason: 'cancelled by Nexploy' });
            const abortError = new Error('Build cancelled');
            abortError.name = 'AbortError';
            settle(job, { error: abortError });
        };

        if (signal.aborted) {
            onAbort();
            return;
        }

        signal.addEventListener('abort', onAbort, { once: true });

        send(runner.socket, { type: 'job.dispatch', job: { ...spec, jobId } });
    });
}
