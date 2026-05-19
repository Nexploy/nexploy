import { NonRetriableError } from 'inngest';
import { type BuildConfig } from '@workspace/typescript-interface/repository/build';
import {
    type PipelineGraph,
    type PipelineNode,
} from '@workspace/typescript-interface/pipeline/node';
import {
    type InngestStepRunner,
    type InputNodeInfo,
    type NodeExecutionContext,
    type NodeOutputData,
    type NodeOutputStore,
    type PipelineLogger,
    type PipelineReporter,
    type PipelineResult,
    type PipelineStatus,
} from '@/types/pipeline.type';
import { formatErrorDetails, getParentNodeIds, resolveNodeConfig } from './utils';
import { analyzeGraph } from '@/inngest/pipeline/utils/graphQueries';
import { getNodeExecutor } from '@/inngest/pipeline/nodes/registry';
import { getBuildStatus, getNodeStatus } from '@/services/repository/build.service';

export { createPipelineLogger } from './utils';

export class PipelineOrchestrator {
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
        setStatusBuild: (status: PipelineStatus) => Promise<void>,
    ): Promise<PipelineResult> {
        const abortController = new AbortController();
        const allOutputs: NodeOutputStore = new Map();
        const nodeTypeMap = new Map(graph.nodes.map((n) => [n.id, n.data.type]));

        let sorted: PipelineNode[];
        let reachableNodeIds: Set<string>;
        try {
            ({ sorted, reachableNodeIds } = analyzeGraph(graph, config.triggerSource));
        } catch (err) {
            throw new Error(`Invalid pipeline graph: ${err instanceof Error ? err.message : err}`);
        }

        const endNodes = sorted.filter((n) => n.data.isEndNode === true);
        const regularNodes = sorted.filter((n) => n.data.isEndNode !== true);
        const executionOrder = [...regularNodes, ...endNodes];

        const branchSkippedNodeIds = new Set<string>();

        let pipelineHasFailed = false;
        let pipelineFailureError: Error | undefined;

        try {
            await inngestStep.run('pipeline-init', async () => {
                await setStatusBuild('BUILDING');
            });

            for (const node of executionOrder) {
                const executor = getNodeExecutor(node.data.type);
                if (!executor) {
                    throw new Error(`Unknown node type: "${node.data.type}"`);
                }

                if (pipelineHasFailed && !executor.runsOnPipelineFailure) {
                    await this.runSkippedNode(
                        node,
                        'pipeline failed',
                        inngestStep,
                        reporter,
                        logger,
                        allOutputs,
                    );
                    continue;
                }

                const inputNodeIds = getParentNodeIds(node.id, graph.edges);
                const inputOutputs: NodeOutputData[] = inputNodeIds
                    .map((id) => allOutputs.get(id))
                    .filter((o): o is NodeOutputData => o !== undefined);
                const inputNodes: InputNodeInfo[] = inputNodeIds
                    .map((id) => {
                        const inputNode = graph.nodes.find((n) => n.id === id);
                        if (!inputNode?.data.type) return null;
                        return { id, type: inputNode.data.type as string };
                    })
                    .filter((n): n is InputNodeInfo => n !== null);

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

                const { resolved: resolvedConfig, warnings: refWarnings } = resolveNodeConfig(
                    node.data.config ?? {},
                    allOutputs,
                    nodeTypeMap,
                );

                if (refWarnings.length > 0) {
                    await inngestStep.run(`node-${node.id}`, async () => {
                        await reporter.markFailed(node.id);
                        for (const msg of refWarnings) {
                            await logger.error(node.id, msg);
                        }
                    });
                    pipelineHasFailed = true;
                    pipelineFailureError = new Error(refWarnings.join('\n'));
                    continue;
                }

                if (executor.configSchema) {
                    const validation = executor.configSchema.safeParse(resolvedConfig);
                    if (!validation.success) {
                        await inngestStep.run(`node-${node.id}`, async () => {
                            await reporter.markNotConfigured(node.id);
                            await logger.warn(
                                node.id,
                                `${node.data.type}: Node is not configured — ${validation.error.issues.map((i) => i.message).join(', ')}`,
                            );
                        });
                        pipelineHasFailed = true;
                        pipelineFailureError = new Error(
                            `Node ${node.data.type} is not configured`,
                        );
                        continue;
                    }
                }

                try {
                    const stepResult = await inngestStep.run(`node-${node.id}`, async () => {
                        const cancellationWatcher = setInterval(async () => {
                            if (abortController.signal.aborted) return;
                            const status = await getBuildStatus(buildId);
                            if (status === 'CANCELLED') {
                                abortController.abort();
                            }
                        }, 2000);

                        try {
                            if (!pipelineHasFailed) {
                                await setStatusBuild('BUILDING');
                            }
                            await reporter.markRunning(node.id);

                            if (abortController.signal.aborted) {
                                throw new DOMException('Build cancelled', 'AbortError');
                            }

                            const ctx: NodeExecutionContext = {
                                buildId,
                                buildConfig: config,
                                nodeId: node.id,
                                nodeConfig: resolvedConfig,
                                inputNodes,
                                inputOutputs,
                                allOutputs,
                                nodes: graph.nodes,
                                edges: graph.edges,
                                logger,
                                reporter,
                                abortSignal: abortController.signal,
                                pipelineHasFailed,
                            };

                            try {
                                const execResult = await executor.execute(ctx);
                                if (execResult.skipped) {
                                    await reporter.markSkipped(node.id);
                                    return {
                                        ok: true,
                                        output: {},
                                        skipped: true,
                                        skippedBranchTargets: execResult.skippedBranchTargets,
                                    };
                                }
                                await reporter.markCompleted(node.id);
                                return {
                                    ok: true,
                                    output: execResult.output ?? {},
                                    skipped: false,
                                    skippedBranchTargets: execResult.skippedBranchTargets,
                                };
                            } catch (execError) {
                                if (execError instanceof Error && execError.name === 'AbortError') {
                                    throw execError;
                                }
                                const message =
                                    execError instanceof Error
                                        ? execError.message
                                        : String(execError);
                                await logger.error(node.id, message);
                                await reporter.markFailed(node.id);
                                return { ok: false, error: message };
                            }
                        } finally {
                            clearInterval(cancellationWatcher);
                        }
                    });

                    const result = stepResult as {
                        ok: boolean;
                        output?: NodeOutputData;
                        error?: string;
                        skipped?: boolean;
                        skippedBranchTargets?: string[];
                    };

                    if (!result.ok) {
                        pipelineHasFailed = true;
                        pipelineFailureError = new Error(result.error ?? 'Node failed');
                        continue;
                    }

                    allOutputs.set(node.id, result.output ?? {});

                    for (const targetId of result.skippedBranchTargets ?? []) {
                        branchSkippedNodeIds.add(targetId);
                    }
                } catch (nodeError) {
                    if (nodeError instanceof Error && nodeError.name === 'AbortError') {
                        throw nodeError;
                    }
                    pipelineHasFailed = true;
                    pipelineFailureError =
                        nodeError instanceof Error ? nodeError : new Error(String(nodeError));
                }
            }

            if (pipelineHasFailed) {
                throw new NonRetriableError(pipelineFailureError?.message ?? 'Pipeline failed', {
                    cause: pipelineFailureError,
                });
            }

            await inngestStep.run('pipeline-complete', async () => {
                await setStatusBuild('COMPLETED');
            });

            return { success: true };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                for (const node of sorted) {
                    if (!allOutputs.has(node.id)) {
                        await reporter.markCancelled(node.id);
                    }
                }
                await setStatusBuild('CANCELLED');
                return { success: false, error: 'Build cancelled' };
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await logger.error('error', `Build failed: ${errorMessage}`);

            if (process.env.NODE_ENV !== 'production') {
                const errorDetails = formatErrorDetails(error);
                await logger.error('error-details', errorDetails);
            }
            try {
                await setStatusBuild('FAILED');
            } catch {
                /* ignore */
            }

            throw error;
        }
    }
}

export const pipelineOrchestrator = new PipelineOrchestrator();
