import { spawn } from 'child_process';
import { access, copyFile, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { env } from '../../../env';
import { getValidToken } from '@/services/api/gitProvider.service';

type ProgressCallback = (progress: number, message: string) => void;

class PipelineService {
    private async exec(
        command: string,
        args: string[],
        options?: { cwd?: string },
        onProgress?: ProgressCallback,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, {
                cwd: options?.cwd,
                env: process.env,
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;

                if (onProgress) {
                    const receivingMatch = output.match(/Receiving objects:\s+(\d+)%/);
                    const resolvingMatch = output.match(/Resolving deltas:\s+(\d+)%/);

                    if (receivingMatch) {
                        const percent = parseInt(receivingMatch[1], 10);
                        onProgress(percent * 0.8, `Receiving objects: ${percent}%`);
                    } else if (resolvingMatch) {
                        const percent = parseInt(resolvingMatch[1], 10);
                        onProgress(80 + percent * 0.2, `Resolving deltas: ${percent}%`);
                    }
                }
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Command failed: ${stderr || stdout}`));
                }
            });

            proc.on('error', reject);
        });
    }

    private getAuthenticatedGitUrl(gitUrl: string, gitToken: string | null): string {
        if (!gitToken) {
            return gitUrl;
        }

        try {
            const url = new URL(gitUrl);
            url.username = 'oauth2';
            url.password = gitToken;
            return url.toString();
        } catch {
            return gitUrl;
        }
    }

    async cloneRepository(
        buildConfig: BuildConfig,
        onProgress?: ProgressCallback,
    ): Promise<string> {
        const workDir = join(
            env.DEPLOYER_WORK_DIR,
            buildConfig.repositoryId,
            Date.now().toString(),
        );

        await mkdir(workDir, { recursive: true });

        const token = await getValidToken(
            {
                accessToken: buildConfig.accessToken,
                accessTokenExpiresAt: buildConfig.accessTokenExpiresAt,
                refreshToken: buildConfig.refreshToken,
            },
            buildConfig.gitProvider,
            buildConfig.userId,
        );

        const authenticatedUrl = this.getAuthenticatedGitUrl(buildConfig.gitUrl, token.accessToken);

        try {
            await this.exec(
                'git',
                [
                    'clone',
                    '--depth=1',
                    '--single-branch',
                    `--branch=${buildConfig.gitBranch}`,
                    '--progress',
                    authenticatedUrl,
                    workDir,
                ],
                {},
                onProgress,
            );
        } catch (error) {
            await rm(workDir, { recursive: true, force: true }).catch(() => {});

            throw new Error(
                `Failed to clone repository from ${buildConfig.gitUrl} (branch: ${buildConfig.gitBranch})`,
            );
        }

        if (buildConfig.repositoryPath && buildConfig.repositoryPath !== '.') {
            return join(workDir, buildConfig.repositoryPath);
        }

        return workDir;
    }

    async prepareDockerfile(workDir: string, buildConfig: BuildConfig): Promise<void> {
        const dockerfilePath = join(workDir, 'Dockerfile');

        try {
            await access(dockerfilePath);
            return;
        } catch {
            /* empty */
        }

        if (buildConfig.dockerfile) {
            await writeFile(dockerfilePath, buildConfig.dockerfile);
            return;
        }

        if (buildConfig.dockerfilePath) {
            await copyFile(buildConfig.dockerfilePath, dockerfilePath);
        }
    }

    async writeEnvFile(workDir: string, envVariables: Record<string, string>): Promise<void> {
        if (!envVariables || Object.keys(envVariables).length === 0) {
            return;
        }

        const envContent = Object.entries(envVariables)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const envPath = join(workDir, '.env.production');
        await writeFile(envPath, envContent);
    }

    async cleanup(workDir: string): Promise<void> {
        try {
            await rm(workDir, { recursive: true, force: true });
        } catch (error: unknown) {
            /* empty */
        }
    }
}

export const pipelineService = new PipelineService();
