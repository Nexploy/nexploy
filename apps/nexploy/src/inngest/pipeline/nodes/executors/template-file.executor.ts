import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getFromAllOutputs, INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '@/types/pipeline.type';
import { templateFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class TemplateFileExecutor
    implements INodeExecutor
{
    readonly type = 'template-file';
    readonly configSchema = templateFileConfigSchema;

    async execute(
        ctx: NodeExecutionContext<z.infer<typeof templateFileConfigSchema>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, buildConfig, logger, nodeId } = ctx;

        const { inputPath, outputPath } = nodeConfig;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const base = workDir ?? process.cwd();

        const resolvedInput = path.isAbsolute(inputPath) ? inputPath : path.join(base, inputPath);
        const resolvedOutput = path.isAbsolute(outputPath)
            ? outputPath
            : path.join(base, outputPath);

        await logger.info(nodeId, `Templating file: ${inputPath} → ${outputPath}`);

        let content: string;
        try {
            content = await fs.readFile(resolvedInput, 'utf-8');
        } catch (err) {
            throw new Error(
                `Failed to read input file "${inputPath}": ${err instanceof Error ? err.message : 'unknown error'}`,
            );
        }

        const varMap: Record<string, string> = { ...buildConfig.envVariables };

        for (const [, outputData] of allOutputs.entries()) {
            for (const [k, v] of Object.entries(outputData)) {
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    varMap[k.toUpperCase()] = String(v);
                }
            }
        }

        const pipelineEnv = getFromAllOutputs<Record<string, string>>(allOutputs, 'envVariables');
        if (pipelineEnv) Object.assign(varMap, pipelineEnv);

        let replaced = 0;
        const result = content.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, varName: string) => {
            const value = varMap[varName] ?? varMap[varName.toUpperCase()];
            if (value !== undefined) {
                replaced++;
                return value;
            }
            return match;
        });

        await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
        await fs.writeFile(resolvedOutput, result, 'utf-8');

        await logger.info(
            nodeId,
            `Template file written to ${outputPath} (${replaced} substitutions)`,
        );
        return { output: { inputPath, outputPath, substitutions: replaced } };
    }
}

export const templateFileExecutor = new TemplateFileExecutor();
