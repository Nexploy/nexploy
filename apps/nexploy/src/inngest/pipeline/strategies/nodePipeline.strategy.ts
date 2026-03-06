import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { IBuildStrategy, IPipelineStep } from '@/types/pipeline.type';
import { topologicalSort } from '@/inngest/pipeline/utils/topologicalSort';
import { getNodeDefinition } from '@/components/pipeline/nodeRegistry';
import { cloneStep } from '@/inngest/pipeline/steps/clone.step';
import { envStep } from '@/inngest/pipeline/steps/env.step';
import { cleanupStep } from '@/inngest/pipeline/steps/cleanup.step';
import { finalizeStep } from '@/inngest/pipeline/steps/finalize.step';
import { RunScriptStep } from '@/inngest/pipeline/steps/run-script.step';
import { SendNotificationStep } from '@/inngest/pipeline/steps/send-notification.step';
import {
    RunScriptConfig,
    SendNotificationConfig,
    WriteEnvFileConfig,
} from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { dockerfileStrategy } from '@/inngest/pipeline/strategies/dockerfile.strategy';

export class NodePipelineStrategy implements IBuildStrategy {
    readonly buildType = 'NODE_PIPELINE' as const;
    readonly name = 'Node Pipeline';

    constructor(private readonly graph: PipelineGraph) {}

    validateConfig(config: BuildConfig): void {
        if (!config.repositoryId) throw new Error('Repository ID is required');
        if (!config.gitUrl) throw new Error('Git URL is required');
        if (!config.gitBranch) throw new Error('Git branch is required');

        const hasCloneNode = this.graph.nodes.some((n) => n.data.type === 'clone-repository');
        if (!hasCloneNode) {
            throw new Error('Pipeline must contain a Clone Repository node');
        }
    }

    getSteps(): IPipelineStep[] {
        const sorted = topologicalSort(this.graph.nodes, this.graph.edges);
        const nodeSteps: IPipelineStep[] = [];

        const dockerfileSteps = dockerfileStrategy.getSteps();

        for (const node of sorted) {
            const nodeType = node.data.type;
            const config = node.data.config;

            switch (nodeType) {
                case 'clone-repository':
                    nodeSteps.push(cloneStep);
                    break;

                case 'write-env-file': {
                    const envConfig = config as WriteEnvFileConfig;
                    if (envConfig.useRepositoryEnvVars) {
                        nodeSteps.push(envStep);
                    }
                    break;
                }

                case 'build-docker-image': {
                    const buildStep = dockerfileSteps.find(
                        (s) => s.metadata.id === 'build-docker-image',
                    );
                    if (buildStep) nodeSteps.push(buildStep);
                    break;
                }

                case 'deploy-container': {
                    const deployStep = dockerfileSteps.find(
                        (s) => s.metadata.id === 'deploy-container',
                    );
                    if (deployStep) nodeSteps.push(deployStep);
                    break;
                }

                case 'run-script': {
                    const scriptConfig = config as RunScriptConfig;
                    nodeSteps.push(
                        new RunScriptStep(
                            node.id,
                            scriptConfig.script ?? '',
                            scriptConfig.timeout ?? 60000,
                            scriptConfig.failOnError ?? true,
                        ),
                    );
                    break;
                }

                case 'send-notification': {
                    const notifConfig = config as SendNotificationConfig;
                    nodeSteps.push(
                        new SendNotificationStep(
                            node.id,
                            notifConfig.webhookUrl ?? '',
                            (notifConfig.triggerOn as Array<'success' | 'failure' | 'always'>) ?? [
                                'always',
                            ],
                            notifConfig.message,
                        ),
                    );
                    break;
                }

                default: {
                    const def = getNodeDefinition(nodeType);
                    if (!def) {
                        throw new Error(`Unknown node type: ${nodeType}`);
                    }
                    break;
                }
            }
        }

        return [...nodeSteps, cleanupStep, finalizeStep];
    }
}
