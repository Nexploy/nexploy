import { getFromClosestAncestor } from '@/helpers/pipeline.helpers';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import { scanImageConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class ScanImageExecutor implements INodeExecutor {
    readonly type = 'scan-image';
    readonly configSchema = scanImageConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof scanImageConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal, buildId, edges } = ctx;

        const image = nodeConfig.image;
        const severity = nodeConfig.severity;
        const trivyVersion = nodeConfig.trivyVersion;
        const exitOnVulnerabilities = nodeConfig.exitOnVulnerabilities;

        const environmentId = getFromClosestAncestor<string>(
            allOutputs,
            edges,
            nodeId,
            'environmentId',
        );

        await logger.info(
            nodeId,
            `Scanning image ${image} for ${severity}+ vulnerabilities using Trivy`,
        );

        try {
            const result = await kyDocker
                .post('images/scan', {
                    json: {
                        image,
                        severity,
                        trivyVersion,
                        buildId,
                    },
                    signal: abortSignal,
                    environmentId,
                    timeout: 300000,
                } as KyDockerOptions)
                .json<{
                    vulnerabilities: number;
                    output: string;
                    critical: number;
                    high: number;
                }>();

            if (result.output) {
                for (const line of result.output.split('\n')) {
                    if (line.trim()) await logger.info(nodeId, line);
                }
            }

            await logger.info(
                nodeId,
                `Scan complete: ${result.vulnerabilities} vulnerabilities found (CRITICAL: ${result.critical}, HIGH: ${result.high})`,
            );

            if (result.vulnerabilities > 0 && exitOnVulnerabilities) {
                throw new Error(
                    `Image ${image} has ${result.vulnerabilities} ${severity}+ vulnerabilities (CRITICAL: ${result.critical}, HIGH: ${result.high})`,
                );
            }

            return {
                output: {
                    image,
                    vulnerabilities: result.vulnerabilities,
                    critical: result.critical,
                    high: result.high,
                },
            };
        } catch (error) {
            throw new Error(
                `Image scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}

export const scanImageExecutor = new ScanImageExecutor();
