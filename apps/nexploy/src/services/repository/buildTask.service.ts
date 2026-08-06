import { prisma } from '../../../prisma/prisma';
import type { Task } from '@workspace/typescript-interface/task';
import { inngest } from '@/inngest/client';
import { createBuildTasksChannel } from '@/inngest/channels/buildTasks.channel';
import { type BuildTaskSource, extractPipelineNodes, toBuildTask } from '@/lib/tasks/buildTask';

const FINISHED_RETENTION_MS = 30 * 60 * 1000;
const MAX_TASKS = 50;

const BUILD_TASK_SELECT = {
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    nodeStatuses: true,
    pipelineSnapshot: true,
    repositoryId: true,
    repository: { select: { name: true, organizationId: true } },
} as const;

type BuildTaskRow = {
    id: string;
    status: BuildTaskSource['buildStatus'];
    createdAt: Date;
    updatedAt: Date;
    nodeStatuses: unknown;
    pipelineSnapshot: unknown;
    repositoryId: string;
    repository: { name: string; organizationId: string };
};

function rowToSource(build: BuildTaskRow): BuildTaskSource {
    return {
        buildId: build.id,
        buildStatus: build.status,
        nodes: extractPipelineNodes(build.pipelineSnapshot),
        nodeStatuses: (build.nodeStatuses as Record<string, string>) ?? {},
        repositoryId: build.repositoryId,
        repositoryName: build.repository.name,
        organizationId: build.repository.organizationId,
        startedAt: build.createdAt.getTime(),
        finishedAt: build.updatedAt.getTime(),
    };
}

const rowToTask = (build: BuildTaskRow): Task => toBuildTask(rowToSource(build));

export async function getBuildTask(buildId: string): Promise<Task | null> {
    const build = await prisma.build.findUnique({ where: { id: buildId }, select: BUILD_TASK_SELECT });

    return build ? rowToTask(build as BuildTaskRow) : null;
}

export async function listBuildTasks(organizationId: string): Promise<Task[]> {
    const builds = await prisma.build.findMany({
        where: {
            repository: { organizationId },
            OR: [
                { status: { in: ['QUEUED', 'BUILDING'] } },
                { updatedAt: { gt: new Date(Date.now() - FINISHED_RETENTION_MS) } },
            ],
        },
        orderBy: { updatedAt: 'desc' },
        take: MAX_TASKS,
        select: BUILD_TASK_SELECT,
    });

    return builds.map((build) => rowToTask(build as BuildTaskRow));
}

export async function publishBuildTask(source: BuildTaskSource): Promise<void> {
    try {
        const channel = createBuildTasksChannel(source.organizationId);
        await inngest.realtime.publish(channel.task, toBuildTask(source));
    } catch {
        /* ignore */
    }
}

export async function publishBuildTaskFromDatabase(buildId: string): Promise<void> {
    const build = await prisma.build.findUnique({ where: { id: buildId }, select: BUILD_TASK_SELECT });
    if (!build) return;

    await publishBuildTask(rowToSource(build as BuildTaskRow));
}
