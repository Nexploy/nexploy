import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { backupDatabaseConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class BackupDatabaseExecutor implements INodeExecutor {
    readonly type = 'backup-database';
    readonly configSchema = backupDatabaseConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const dbType = nodeConfig.dbType as string;
        const host = nodeConfig.host as string;
        const port = nodeConfig.port as number;
        const database = nodeConfig.database as string;
        const username = nodeConfig.username as string;
        const password = nodeConfig.password as string;
        const outputPath = nodeConfig.outputPath as string;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');

        await logger.info(nodeId, `Backing up ${dbType} database "${database}" from ${host}:${port} → ${outputPath}`);

        let image: string;
        let command: string;

        if (dbType === 'postgres') {
            image = 'postgres:16-alpine';
            command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f /backup/dump.sql`;
        } else if (dbType === 'mysql') {
            image = 'mysql:8';
            command = `mysqldump -h ${host} -P ${port} -u ${username} --password=${password} ${database} > /backup/dump.sql`;
        } else {
            throw new Error(`Unsupported database type: ${dbType}`);
        }

        try {
            const result = await kyDocker
                .post('containers/run-ephemeral', {
                    json: {
                        image,
                        command: dbType === 'mysql' ? `sh -c "${command}"` : command,
                        workdir: '/backup',
                        mountPath: outputPath,
                        env: {
                            ...(dbType === 'postgres' && { PGPASSWORD: password }),
                        },
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 600000, // 10 minutes for large databases
                } as KyDockerOptions)
                .json<{ exitCode: number; output?: string }>();

            if (result.output) {
                for (const line of result.output.split('\n')) {
                    if (line.trim()) await logger.info(nodeId, line);
                }
            }

            if (result.exitCode !== 0) {
                throw new Error(`Backup command exited with code ${result.exitCode}`);
            }

            await logger.info(nodeId, `Database backup completed successfully to ${outputPath}`);
            return { output: { dbType, database, outputPath, backed: true } };
        } catch (error) {
            throw new Error(`Database backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const backupDatabaseExecutor = new BackupDatabaseExecutor();
