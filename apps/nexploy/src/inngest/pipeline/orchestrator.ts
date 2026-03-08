import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import {
    PipelineEdge,
    PipelineGraph,
    PipelineNode,
} from '@workspace/typescript-interface/pipeline/node';
import {
    InngestStepRunner,
    LogLevel,
    NodeExecutionContext,
    NodeExecutionResult,
    NodeOutputData,
    NodeOutputStore,
    PipelineLogger,
    PipelineResult,
    PipelineStatus,
    StatusReporter,
} from '@/types/pipeline.type';
import { topologicalSort } from './utils/topologicalSort';
import { getNodeExecutor } from './nodes/registry';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { gitService } from './services/git.service';
import { prisma } from '../../../prisma/prisma';

function formatErrorDetails(error: unknown): string {
    if (error instanceof Error) {
        const details = [`Error: ${error.message}`, `Name: ${error.name}`];
        if (process.env.NODE_ENV !== 'production') {
            if (error.stack) details.push(`Stack trace:\n${error.stack}`);
            const extra = Object.entries(error)
                .filter(([k]) => !['message', 'name', 'stack'].includes(k))
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
            if (extra.length) details.push(`Additional info:\n${extra.join('\n')}`);
        }
        return details.join('\n');
    }
    return `Unknown error: ${JSON.stringify(error, null, 2)}`;
}

function getInputNodeIds(nodeId: string, edges: PipelineEdge[]): string[] {
    return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

function findWorkDir(allOutputs: NodeOutputStore): string | undefined {
    for (const output of allOutputs.values()) {
        if (typeof output.workDir === 'string') return output.workDir;
    }
    return undefined;
}

export class NodePipelineOrchestrator {
    private startCancellationWatcher(
        buildId: string,
        abortController: AbortController,
        intervalMs = 2000,
    ): NodeJS.Timeout {
        return setInterval(async () => {
            if (abortController.signal.aborted) return;
            try {
                const build = await prisma.build.findUnique({
                    where: { id: buildId },
                    select: { status: true },
                });
                if (build?.status === 'CANCELLED') abortController.abort();
            } catch {
                /* ignore */
            }
        }, intervalMs);
    }

    async execute(
        buildId: string,
        config: BuildConfig,
        graph: PipelineGraph,
        inngestStep: InngestStepRunner,
        logger: PipelineLogger,
        reporter: StatusReporter,
    ): Promise<PipelineResult> {
        const abortController = new AbortController();
        const allOutputs: NodeOutputStore = new Map();
        const completedNodes: string[] = [];
        let currentNodeId: string | null = null;

        let sorted: PipelineNode[];
        try {
            sorted = topologicalSort(graph.nodes, graph.edges);
        } catch (err) {
            throw new Error(`Invalid pipeline graph: ${err instanceof Error ? err.message : err}`);
        }

        const cancellationWatcher = this.startCancellationWatcher(buildId, abortController);

        try {
            await inngestStep.run('pipeline-init', async () => {
                await reporter.setStatus('BUILDING');
            });

            for (const node of sorted) {
                const executor = getNodeExecutor(node.data.type);
                if (!executor) {
                    throw new Error(`Unknown node type: "${node.data.type}"`);
                }

                const inputNodeIds = getInputNodeIds(node.id, graph.edges);
                const inputOutputs: NodeOutputData[] = inputNodeIds
                    .map((id) => allOutputs.get(id))
                    .filter((o): o is NodeOutputData => o !== undefined);

                if (node.data.disabled) {
                    await inngestStep.run(`node-${node.id}`, async () => {
                        currentNodeId = node.id;
                        await reporter.markNodeSkipped(node.id);
                        await logger.info(node.id, `${node.data.label} : Node skipped (disabled)`);
                    });

                    const mergedInputs = Object.assign({}, ...inputOutputs);
                    allOutputs.set(node.id, mergedInputs);
                    continue;
                }

                const nodeDef = getNodeDefinition(node.data.type);
                const hasUnconnectedRequiredInput =
                    nodeDef?.handles.inputs.some((h) => h.required) &&
                    inputNodeIds.length === 0;

                if (hasUnconnectedRequiredInput) {
                    await inngestStep.run(`node-${node.id}`, async () => {
                        currentNodeId = node.id;
                        await reporter.markNodeSkipped(node.id);
                        await logger.info(
                            node.id,
                            `${node.data.label} : Node skipped (required input not connected)`,
                        );
                    });
                    allOutputs.set(node.id, {});
                    continue;
                }

                const nodeResult = await inngestStep.run(`node-${node.id}`, async () => {
                    currentNodeId = node.id;
                    await reporter.markNodeRunning(node.id);

                    if (abortController.signal.aborted) {
                        throw new DOMException('Build cancelled', 'AbortError');
                    }

                    const ctx: NodeExecutionContext = {
                        buildId,
                        config,
                        nodeId: node.id,
                        nodeConfig: node.data.config ?? {},
                        inputOutputs,
                        allOutputs,
                        logger,
                        reporter,
                        abortSignal: abortController.signal,
                    };

                    const execResult = await executor.execute(ctx);

                    if (!execResult.skipped) {
                        await reporter.markNodeCompleted(node.id);
                    }

                    return execResult;
                });

                const result = nodeResult as NodeExecutionResult;
                allOutputs.set(node.id, result.output ?? {});

                if (!result.skipped) {
                    completedNodes.push(node.id);
                }
            }

            await inngestStep.run('pipeline-complete', async () => {
                await reporter.setStatus('COMPLETED');
                await this.saveVersion(buildId, config, allOutputs, logger);
            });

            return { success: true, completedNodes };
        } catch (error) {
            const errorDetails = formatErrorDetails(error);
            const workDir = findWorkDir(allOutputs);

            if (error instanceof Error && error.name === 'AbortError') {
                await logger.info('cancel', 'Build cancelled by user');
                await reporter.setStatus('CANCELLED');
                if (workDir) {
                    try {
                        await gitService.cleanup(workDir);
                    } catch (e) {
                        console.error('Cleanup failed after cancellation:', e);
                    }
                }
                return { success: false, error: 'Build cancelled', completedNodes };
            }

            if (currentNodeId) await reporter.markNodeFailed(currentNodeId);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await logger.error('error', `Build failed: ${errorMessage}`);
            await logger.error('error-details', errorDetails);
            await reporter.setStatus('FAILED');

            if (workDir) {
                try {
                    await gitService.cleanup(workDir);
                } catch (e) {
                    await logger.error('cleanup-error', `Cleanup failed: ${formatErrorDetails(e)}`);
                }
            }

            throw error;
        } finally {
            clearInterval(cancellationWatcher);
        }
    }

    private async saveVersion(
        buildId: string,
        config: BuildConfig,
        allOutputs: NodeOutputStore,
        logger: PipelineLogger,
    ): Promise<void> {
        try {
            const lastVersion = await prisma.version.findFirst({
                where: {
                    repositoryId: config.repositoryId,
                    environmentId: config.environmentId ?? null,
                },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true },
            });
            const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

            await prisma.version.upsert({
                where: {
                    repositoryId_imageTag: {
                        repositoryId: config.repositoryId,
                        imageTag: config.imageTag,
                    },
                },
                update: {},
                create: {
                    repositoryId: config.repositoryId,
                    imageTag: config.imageTag,
                    versionNumber,
                    buildType: 'NODE_PIPELINE',
                    branch: config.gitBranch ?? null,
                    commitHash: config.gitCommitHash ?? null,
                    commitMessage: config.gitCommitMessage ?? null,
                    environmentId: config.environmentId ?? null,
                },
            });
        } catch (err) {
            await logger.warn(
                'finalize',
                `Failed to save version: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }
}

export function createPipelineLogger(
    publishLog: (step: string, message: string, level: LogLevel) => Promise<void>,
): PipelineLogger {
    return {
        log: publishLog,
        debug: (step, message) => publishLog(step, message, 'DEBUG'),
        info: (step, message) => publishLog(step, message, 'INFO'),
        warn: (step, message) => publishLog(step, message, 'WARN'),
        error: (step, message) => publishLog(step, message, 'ERROR'),
    };
}

export function createStatusReporter(
    setStatus: (status: PipelineStatus) => Promise<void>,
    markNodeCompleted: (nodeId: string) => Promise<void>,
    markNodeRunning: (nodeId: string) => Promise<void>,
    markNodeSkipped: (nodeId: string) => Promise<void>,
    markNodeFailed: (nodeId: string) => Promise<void>,
): StatusReporter {
    return { setStatus, markNodeCompleted, markNodeRunning, markNodeSkipped, markNodeFailed };
}

export const nodePipelineOrchestrator = new NodePipelineOrchestrator();
