import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class RunTestsExecutor implements INodeExecutor {
    readonly type = 'run-tests';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const command = nodeConfig.command as string;
        const image = nodeConfig.image as string;
        if (!command) throw new Error('Test command is required');
        if (!image) throw new Error('Image is required');

        const workdir = (nodeConfig.workdir as string | undefined) ?? '/workspace';
        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Running tests in ephemeral container (image: ${image})`);
        await logger.info(nodeId, `Command: ${command}`);

        try {
            const result = await kyDocker
                .post('containers/run-ephemeral', {
                    json: {
                        image,
                        command,
                        workdir,
                        ...(workDir && { mountPath: workDir }),
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 300000, // 5 minutes for tests
                } as KyDockerOptions)
                .json<{ exitCode: number; output?: string }>();

            if (result.output) {
                for (const line of result.output.split('\n')) {
                    if (line.trim()) await logger.info(nodeId, line);
                }
            }

            if (result.exitCode !== 0) {
                throw new Error(`Tests failed with exit code ${result.exitCode}`);
            }

            await logger.info(nodeId, 'Tests passed successfully');
            return { success: true, output: { exitCode: result.exitCode, testsPassed: true } };
        } catch (error) {
            throw new Error(`Test run failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const runTestsExecutor = new RunTestsExecutor();
