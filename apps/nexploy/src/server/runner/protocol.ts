import { z } from 'zod';

export const RUNNER_PROTOCOL_VERSION = 1;

export const RUNNER_WS_PATH = '/api/ws/runner';

export const RUNNER_PROTOCOL_HEADER = 'x-nexploy-runner-protocol';

export const gitCredentialsSchema = z.object({
    username: z.string().min(1),
    token: z.string().min(1),
});

export type RunnerGitCredentials = z.infer<typeof gitCredentialsSchema>;

const runnerCapabilitiesSchema = z.object({
    maxConcurrency: z.number().int().positive(),
    platforms: z.array(z.string()).default([]),
    labels: z.array(z.string()).default([]),
    dockerVersion: z.string().optional(),
    dockerApiVersion: z.string().optional(),
    operatingSystem: z.string().optional(),
    architecture: z.string().optional(),
});

export type RunnerCapabilities = z.infer<typeof runnerCapabilitiesSchema>;

const runnerLoadSchema = z.object({
    activeJobs: z.number().int().nonnegative(),
    maxConcurrency: z.number().int().nonnegative(),
    cpuLoad1m: z.number().optional(),
    memoryTotalBytes: z.number().optional(),
    memoryFreeBytes: z.number().optional(),
    diskFreeBytes: z.number().optional(),
});

export type RunnerLoad = z.infer<typeof runnerLoadSchema>;

export const runnerMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('hello'),
        protocolVersion: z.number().int().positive(),
        runnerVersion: z.string().optional(),
        name: z.string().optional(),
        capabilities: runnerCapabilitiesSchema,
    }),
    z.object({
        type: z.literal('heartbeat'),
        load: runnerLoadSchema,
        activeJobIds: z.array(z.string()).default([]),
    }),
    z.object({ type: z.literal('pong'), nonce: z.string().optional() }),
    z.object({ type: z.literal('job.accept'), jobId: z.string().min(1) }),
    z.object({ type: z.literal('job.reject'), jobId: z.string().min(1), reason: z.string().default('') }),
    z.object({
        type: z.literal('job.progress'),
        jobId: z.string().min(1),
        phase: z.enum(['queued', 'cloning', 'building', 'pushing', 'cleanup']),
        percent: z.number().optional(),
        message: z.string().optional(),
    }),
    z.object({
        type: z.literal('job.log'),
        jobId: z.string().min(1),
        nodeId: z.string().optional(),
        level: z.enum(['info', 'warn', 'error']).default('info'),
        message: z.string(),
        ts: z.string().optional(),
    }),
    z.object({
        type: z.literal('job.result'),
        jobId: z.string().min(1),
        status: z.enum(['succeeded', 'failed', 'cancelled']),
        durationMs: z.number().nonnegative().default(0),
        imageId: z.string().optional(),
        imageName: z.string().optional(),
        pushedImages: z.array(z.string()).default([]),
        digest: z.string().optional(),
        error: z.string().optional(),
    }),
    z.object({
        type: z.literal('credentials.request'),
        requestId: z.string().min(1),
        jobId: z.string().min(1),
        reason: z.literal('expired'),
    }),
]);

export type RunnerMessage = z.infer<typeof runnerMessageSchema>;

export interface RunnerJobSource {
    type: 'git';
    url: string;
    branch?: string;
    commitHash?: string;
    submodules?: boolean;
    depth?: number;
    credentials: RunnerGitCredentials | null;
}

export interface RunnerJobBuild {
    imageName: string;
    contextPath?: string;
    dockerfilePath?: string;
    buildArgs?: Record<string, string>;
    labels?: Record<string, string>;
    target?: string;
    platform?: string;
    noCache?: boolean;
    pull?: boolean;
    cacheFrom?: string[];
}

export interface RunnerJobPush {
    registry: { url: string; username: string; password: string };
    repository: string;
    tags: string[];
}

export interface RunnerJobSpec {
    jobId: string;
    buildId: string;
    repositoryId: string;
    nodeId?: string;
    source: RunnerJobSource;
    build: RunnerJobBuild;
    push: RunnerJobPush | null;
    timeoutMs?: number;
}

export type ServerMessage =
    | {
          type: 'hello.ack';
          runnerId: string;
          serverVersion?: string;
          heartbeatIntervalMs?: number;
          protocolVersion: number;
      }
    | { type: 'job.dispatch'; job: RunnerJobSpec }
    | { type: 'job.cancel'; jobId: string; reason?: string }
    | { type: 'credentials.response'; requestId: string; credentials: RunnerGitCredentials | null; error?: string }
    | { type: 'ping'; nonce?: string }
    | { type: 'error'; code: string; message: string; fatal?: boolean };

const MAX_FRAME_BYTES = 1_048_576;

export function decodeRunnerMessage(raw: Buffer | string): RunnerMessage | null {
    const text = typeof raw === 'string' ? raw : raw.toString('utf8');

    if (Buffer.byteLength(text, 'utf8') > MAX_FRAME_BYTES) return null;

    try {
        const parsed = runnerMessageSchema.safeParse(JSON.parse(text));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}
