import * as childProcess from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
    getFromAllOutputs,
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
    ResolvedConfig,
} from '@/types/pipeline.type';
import { runScriptConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { z } from 'zod';

export class RunScriptExecutor implements INodeExecutor {
    readonly type = 'run-script';
    readonly configSchema = runScriptConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolvedConfig<z.infer<typeof runScriptConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeConfig, allOutputs, logger, nodeId, abortSignal } = ctx;

        const script = nodeConfig.script;
        const shell = nodeConfig.shell;
        const continueOnError = nodeConfig.continueOnError;

        const workDir = getFromAllOutputs<string>(allOutputs, 'workDir');

        await logger.info(nodeId, `Running script with ${shell}${workDir ? ` in ${workDir}` : ''}`);

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexploy-script-'));
        const scriptFile = path.join(tmpDir, `script.${shell === 'bash' ? 'sh' : 'sh'}`);
        await fs.writeFile(scriptFile, script, { mode: 0o755 });

        try {
            const exitCode = await new Promise<number>((resolve, reject) => {
                const proc = childProcess.spawn(shell, [scriptFile], {
                    cwd: workDir ?? process.cwd(),
                    env: { ...process.env },
                    stdio: ['ignore', 'pipe', 'pipe'],
                });

                abortSignal.addEventListener('abort', () => {
                    proc.kill('SIGTERM');
                });

                let stdout = '';
                let stderr = '';

                proc.stdout?.on('data', (chunk: Buffer) => {
                    const line = chunk.toString();
                    stdout += line;
                    void logger.info(nodeId, line.trimEnd());
                });

                proc.stderr?.on('data', (chunk: Buffer) => {
                    const line = chunk.toString();
                    stderr += line;
                    void logger.warn(nodeId, line.trimEnd());
                });

                proc.on('error', reject);
                proc.on('close', (code) => resolve(code ?? 1));

                void stdout;
                void stderr;
            });

            if (exitCode !== 0) {
                const msg = `Script exited with code ${exitCode}`;
                if (continueOnError) {
                    await logger.warn(nodeId, `${msg} (continuing due to continueOnError)`);
                    return { output: { exitCode }, skipped: false };
                }
                throw new Error(msg);
            }

            await logger.info(nodeId, `Script completed successfully (exit code 0)`);
            return { output: { exitCode: 0 } };
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => void 0);
        }
    }
}

export const runScriptExecutor = new RunScriptExecutor();
