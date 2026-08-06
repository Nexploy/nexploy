import type { Task, TaskStatus, TaskStep, TaskStepStatus } from '@workspace/typescript-interface/task';
import type { BuildStatus } from 'generated/client';

const BUILD_TASK_ID_PREFIX = 'build:';

export const toBuildTaskId = (buildId: string) => `${BUILD_TASK_ID_PREFIX}${buildId}`;

export const isBuildTaskId = (taskId: string) => taskId.startsWith(BUILD_TASK_ID_PREFIX);

export const toBuildIdFromTaskId = (taskId: string) => taskId.slice(BUILD_TASK_ID_PREFIX.length);

const TASK_STATUSES: Record<BuildStatus, TaskStatus> = {
    QUEUED: 'running',
    BUILDING: 'running',
    COMPLETED: 'succeeded',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};

const STEP_STATUSES: Record<string, TaskStepStatus> = {
    running: 'running',
    completed: 'done',
    skipped: 'skipped',
    'not-configured': 'skipped',
    cancelled: 'skipped',
    failed: 'failed',
};

export interface BuildTaskSource {
    buildId: string;
    buildStatus: BuildStatus;
    nodes: { id: string; type: string }[];
    nodeStatuses: Record<string, string>;
    repositoryId: string;
    repositoryName: string;
    organizationId: string;
    startedAt: number;
    finishedAt?: number;
    error?: string;
}

export function toBuildTask(source: BuildTaskSource): Task {
    const status = TASK_STATUSES[source.buildStatus];
    const isRunning = status === 'running';

    const steps: TaskStep[] = source.nodes.map((node) => ({
        key: node.id,
        label: node.type,
        status: STEP_STATUSES[source.nodeStatuses[node.id] ?? ''] ?? 'pending',
    }));

    const settled = steps.filter((step) => step.status !== 'pending' && step.status !== 'running').length;
    const progress = status === 'succeeded' ? 100 : steps.length === 0 ? 0 : Math.round((settled / steps.length) * 100);

    return {
        id: toBuildTaskId(source.buildId),
        kind: 'build-pipeline',
        status,
        subjectName: source.repositoryName,
        subjectId: source.buildId,
        ownerOrganizationId: source.organizationId,
        steps,
        currentStepKey: isRunning ? (steps.find((step) => step.status === 'running')?.key ?? null) : null,
        progress,
        warnings: [],
        error: source.error,
        cancellable: isRunning,
        silent: false,
        resultHref: `/repositories/${source.repositoryId}/${source.buildId}`,
        startedAt: source.startedAt,
        finishedAt: isRunning ? undefined : source.finishedAt,
    };
}

export function extractPipelineNodes(pipelineSnapshot: unknown): { id: string; type: string }[] {
    const nodes = (pipelineSnapshot as { nodes?: unknown })?.nodes;
    if (!Array.isArray(nodes)) return [];

    return nodes
        .filter((node): node is { id: string; data?: { type?: string } } => typeof node?.id === 'string')
        .map((node) => ({ id: node.id, type: node.data?.type ?? '' }));
}
