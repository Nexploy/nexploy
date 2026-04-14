import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { runMigrationConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class RunMigrationExecutor implements INodeExecutor {
    readonly type = 'run-migration';
    readonly configSchema = runMigrationConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof runMigrationConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const image = nodeConfig.image;
        const command = nodeConfig.command;
        const databaseUrl = nodeConfig.databaseUrl;
        const workdir = nodeConfig.workdir;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(
            nodeId,
            `Running database migrations in ephemeral container (image: ${image})`,
        );
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
            return { output: { exitCode: result.exitCode, migrated: true } };
        } catch (error) {
            throw new Error(
                `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const runMigrationExecutor = new RunMigrationExecutor();
