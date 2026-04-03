import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { scanImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export class ScanImageExecutor implements INodeExecutor {
    readonly type = 'scan-image';
    readonly configSchema = scanImageConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const image = nodeConfig.image as string;
        const tag = nodeConfig.tag as string;
        const severity = nodeConfig.severity as string;
        const exitOnVulnerabilities = nodeConfig.exitOnVulnerabilities as boolean;

        const environmentId = getFromAllOutputs<string>(allOutputs, 'environmentId');
        const fullImage = `${image}:${tag}`;

        await logger.info(nodeId, `Scanning image ${fullImage} for ${severity}+ vulnerabilities using Trivy`);

        try {
            const result = await kyDocker
                .post('images/scan', {
                    json: {
                        image,
                        tag,
                        severity,
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 300000, // 5 min — pulling trivy can take time
                } as KyDockerOptions)
                .json<{ vulnerabilities: number; output: string; critical: number; high: number }>();

            if (result.output) {
                for (const line of result.output.split('\n')) {
                    if (line.trim()) await logger.info(nodeId, line);
                }
            }

            await logger.info(nodeId, `Scan complete: ${result.vulnerabilities} vulnerabilities found (CRITICAL: ${result.critical}, HIGH: ${result.high})`);

            if (result.vulnerabilities > 0 && exitOnVulnerabilities) {
                throw new Error(
                    `Image ${fullImage} has ${result.vulnerabilities} ${severity}+ vulnerabilities (CRITICAL: ${result.critical}, HIGH: ${result.high})`,
                );
            }

            return {
                success: true,
                output: {
                    image,
                    tag,
                    vulnerabilities: result.vulnerabilities,
                    critical: result.critical,
                    high: result.high,
                },
            };
        } catch (error) {
            throw new Error(`Image scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const scanImageExecutor = new ScanImageExecutor();
