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
    PipelineReporter,
    PipelineResult,
    PipelineStatus,
} from '@/types/pipeline.type';
import { getNodeExecutor } from './nodes/registry';
import { analyzeGraph } from './utils/graphQueries';
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

export class PipelineOrchestrator {
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

    private async runSkippedNode(
        node: PipelineNode,
        reason: string,
        inngestStep: InngestStepRunner,
        reporter: PipelineReporter,
        logger: PipelineLogger,
        allOutputs: NodeOutputStore,
        output: NodeOutputData = {},
    ): Promise<void> {
        await inngestStep.run(`node-${node.id}`, async () => {
            await reporter.markSkipped(node.id);
            await logger.info(node.id, `${node.data.type} : Node skipped (${reason})`);
        });
        allOutputs.set(node.id, output);
    }

    async execute(
        buildId: string,
        config: BuildConfig,
        graph: PipelineGraph,
        inngestStep: InngestStepRunner,
        logger: PipelineLogger,
        reporter: PipelineReporter,
        setStatus: (status: PipelineStatus) => Promise<void>,
    ): Promise<PipelineResult> {
        const abortController = new AbortController();
        const allOutputs: NodeOutputStore = new Map();

        let sorted: PipelineNode[];
        let reachableNodeIds: Set<string>;
        try {
            ({ sorted, reachableNodeIds } = analyzeGraph(graph, config.triggerSource));
        } catch (err) {
            throw new Error(`Invalid pipeline graph: ${err instanceof Error ? err.message : err}`);
        }

        const cancellationWatcher = this.startCancellationWatcher(buildId, abortController);
        const branchSkippedNodeIds = new Set<string>();

        try {
            await inngestStep.run('pipeline-init', async () => {
                await setStatus('BUILDING');
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
                const inputNodes = inputNodeIds.map((id) => {
                    const inputNode = graph.nodes.find((n) => n.id === id);
                    return { id, type: inputNode?.data.type ?? '' };
                });

                if (!reachableNodeIds.has(node.id)) {
                    await this.runSkippedNode(
                        node,
                        'not connected to a start node',
                        inngestStep,
                        reporter,
                        logger,
                        allOutputs,
                    );
                    continue;
                }

                // Propagate branch skip: if all inputs come from skipped branches, skip this node too
                if (!branchSkippedNodeIds.has(node.id)) {
                    const inputEdges = graph.edges.filter((e) => e.target === node.id);
                    if (
                        inputEdges.length > 0 &&
                        inputEdges.every((e) => branchSkippedNodeIds.has(e.source))
                    ) {
                        branchSkippedNodeIds.add(node.id);
                    }
                }

                if (branchSkippedNodeIds.has(node.id)) {
                    await this.runSkippedNode(
                        node,
                        'condition branch not taken',
                        inngestStep,
                        reporter,
                        logger,
                        allOutputs,
                    );
                    continue;
                }

                if (node.data.disabled) {
                    const mergedInputs = Object.assign({}, ...inputOutputs);
                    await this.runSkippedNode(
                        node,
                        'disabled',
                        inngestStep,
                        reporter,
                        logger,
                        allOutputs,
                        mergedInputs,
                    );
                    continue;
                }

                try {
                    const nodeResult = await inngestStep.run(`node-${node.id}`, async () => {
                        await setStatus('BUILDING');
                        await reporter.markRunning(node.id);

                        if (abortController.signal.aborted) {
                            throw new DOMException('Build cancelled', 'AbortError');
                        }

                        const ctx: NodeExecutionContext = {
                            buildId,
                            config,
                            nodeId: node.id,
                            nodeConfig: node.data.config ?? {},
                            inputNodes,
                            inputOutputs,
                            allOutputs,
                            edges: graph.edges,
                            logger,
                            reporter,
                            abortSignal: abortController.signal,
                        };

                        try {
                            const execResult = await executor.execute(ctx);
                            if (execResult.skipped) {
                                await reporter.markSkipped(node.id);
                            } else {
                                await reporter.markCompleted(node.id);
                            }
                            return execResult;
                        } catch (execError) {
                            if (execError instanceof Error && execError.name === 'AbortError') {
                                throw execError;
                            }
                            const message =
                                execError instanceof Error ? execError.message : String(execError);
                            await logger.error(node.id, message);
                            await reporter.markFailed(node.id);
                            throw execError;
                        }
                    });

                    const result = nodeResult as NodeExecutionResult;
                    allOutputs.set(node.id, result.output ?? {});

                    // For condition nodes, mark the losing branch targets as skipped
                    if (node.data.type === 'condition') {
                        const passed = !!result.output?.passed;
                        const losingHandle = passed ? 'false' : 'true';
                        for (const edge of graph.edges) {
                            if (edge.source === node.id && edge.sourceHandle === losingHandle) {
                                branchSkippedNodeIds.add(edge.target);
                            }
                        }
                    }
                } catch (nodeError) {
                    if (nodeError instanceof Error && nodeError.name === 'AbortError') {
                        throw nodeError;
                    }
                    await setStatus('FAILED');
                    throw nodeError;
                }
            }

            await inngestStep.run('pipeline-complete', async () => {
                await setStatus('COMPLETED');
            });

            return { success: true };
        } catch (error) {
            const errorDetails = formatErrorDetails(error);
            const workDir = findWorkDir(allOutputs);

            if (error instanceof Error && error.name === 'AbortError') {
                // Mark all nodes that did not reach a terminal state as cancelled.
                // cancelBuildInngest already did this in the DB, but we also publish
                // SSE events here so the UI updates in real time when the orchestrator
                // still runs (i.e. the watcher fired before Inngest's cancelOn).
                for (const node of sorted) {
                    if (!allOutputs.has(node.id)) {
                        await reporter.markCancelled(node.id);
                    }
                }
                await setStatus('CANCELLED');
                if (workDir) {
                    try {
                        await gitService.cleanup(workDir);
                    } catch (e) {
                        console.error('Cleanup failed after cancellation:', e);
                    }
                }
                return { success: false, error: 'Build cancelled' };
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await logger.error('error', `Build failed: ${errorMessage}`);
            await logger.error('error-details', errorDetails);
            try {
                await setStatus('FAILED');
            } catch {
                /* ignore */
            }

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

export const pipelineOrchestrator = new PipelineOrchestrator();
