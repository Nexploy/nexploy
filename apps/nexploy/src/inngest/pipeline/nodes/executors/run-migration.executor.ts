import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export class RunMigrationExecutor implements INodeExecutor {
    readonly type = 'run-migration';

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const image = nodeConfig.image as string;
        const command = nodeConfig.command as string;
        const databaseUrl = nodeConfig.databaseUrl as string;
        const workdir = (nodeConfig.workdir as string | undefined);

        if (!image) throw new Error('Image is required');
        if (!command) throw new Error('Migration command is required');
        if (!databaseUrl) throw new Error('Database URL is required');

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Running database migrations in ephemeral container (image: ${image})`);
        await logger.info(nodeId, `Command: ${command}`);

        try {
            const result = await kyDocker
                .post('containers/run-ephemeral', {
                    json: {
                        image,
                        command,
                        workdir: workdir ?? '/app',
                        ...(workDir && { mountPath: workDir }),
                        env: { DATABASE_URL: databaseUrl },
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 300000, // 5 minutes
                } as KyDockerOptions)
                .json<{ exitCode: number; output?: string }>();

            if (result.output) {
                for (const line of result.output.split('\n')) {
                    if (line.trim()) await logger.info(nodeId, line);
                }
            }

            if (result.exitCode !== 0) {
                throw new Error(`Migration command exited with code ${result.exitCode}`);
            }

            await logger.info(nodeId, 'Database migrations completed successfully');
            return { success: true, output: { exitCode: result.exitCode, migrated: true } };
        } catch (error) {
            throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const runMigrationExecutor = new RunMigrationExecutor();
