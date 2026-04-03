import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult, getFromAllOutputs } from '@/types/pipeline.type';
import { templateFileConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

interface VarEntry {
    id: string;
    key: string;
    value: string;
}

export class TemplateFileExecutor implements INodeExecutor {
    readonly type = 'template-file';
    readonly configSchema = templateFileConfigSchema;

    async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId } = ctx;

        const inputPath = nodeConfig.inputPath as string;
        const outputPath = nodeConfig.outputPath as string;
        const variables = (nodeConfig.variables as VarEntry[] | undefined) ?? [];

        if (!inputPath) throw new Error('Input path is required');
        if (!outputPath) throw new Error('Output path is required');

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');
        const base = workDir ?? process.cwd();

        const resolvedInput = path.isAbsolute(inputPath) ? inputPath : path.join(base, inputPath);
        const resolvedOutput = path.isAbsolute(outputPath) ? outputPath : path.join(base, outputPath);

        await logger.info(nodeId, `Templating file: ${inputPath} → ${outputPath}`);

        let content: string;
        try {
            content = await fs.readFile(resolvedInput, 'utf-8');
        } catch (err) {
            throw new Error(`Failed to read input file "${inputPath}": ${err instanceof Error ? err.message : 'unknown error'}`);
        }

        // Build variable map: custom vars + pipeline outputs
        const varMap: Record<string, string> = {};

        // Add pipeline outputs as template vars
        for (const [, outputData] of allOutputs.entries()) {
            for (const [k, v] of Object.entries(outputData)) {
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    varMap[k.toUpperCase()] = String(v);
                }
            }
        }

        // Custom vars override pipeline outputs
        for (const v of variables) {
            if (v.key) varMap[v.key] = v.value;
        }

        // Replace {{VAR}} patterns
        let replaced = 0;
        const result = content.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, varName: string) => {
            const value = varMap[varName] ?? varMap[varName.toUpperCase()];
            if (value !== undefined) {
                replaced++;
                return value;
            }
            return match; // leave unreplaced
        });

        await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
        await fs.writeFile(resolvedOutput, result, 'utf-8');

        await logger.info(nodeId, `Template file written to ${outputPath} (${replaced} substitutions)`);
        return { success: true, output: { inputPath, outputPath, substitutions: replaced } };
    }
}

export const templateFileExecutor = new TemplateFileExecutor();
