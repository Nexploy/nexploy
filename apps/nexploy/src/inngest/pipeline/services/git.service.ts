import { spawn } from 'child_process';
import { access, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { env } from '../../../../env';
import { getValidToken } from '@/services/api/gitProvider.service';
import { ProgressCallback } from '../types';

class GitService {
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
            const cloneArgs = ['clone'];

            if (!buildConfig.gitCommitHash) {
                cloneArgs.push('--depth=1');
            }

            cloneArgs.push(
                '--single-branch',
                `--branch=${buildConfig.gitBranch}`,
                '--progress',
                authenticatedUrl,
                workDir,
            );

            await this.exec('git', cloneArgs, {}, onProgress);

            if (buildConfig.gitCommitHash) {
                await this.exec('git', ['checkout', buildConfig.gitCommitHash], {
                    cwd: workDir,
                });
            }
        } catch (error: unknown) {
            await rm(workDir, { recursive: true, force: true }).catch(() => {});
            const commitInfo = buildConfig.gitCommitHash
                ? `, commit: ${buildConfig.gitCommitHash}`
                : '';
            throw new Error(
                `Failed to clone repository from ${buildConfig.gitUrl} (branch: ${buildConfig.gitBranch}${commitInfo})`,
            );
        }

        if (buildConfig.repositoryPath && buildConfig.repositoryPath !== '.') {
            return join(workDir, buildConfig.repositoryPath);
        }

        return workDir;
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

    async validateComposeFile(workDir: string, composePath?: string): Promise<string> {
        const primaryPath = composePath || 'docker-compose.yml';
        const composeFilePath = join(workDir, primaryPath);

        try {
            await access(composeFilePath);
            return primaryPath;
        } catch {
            const alternativePaths = ['docker-compose.yaml', 'compose.yml', 'compose.yaml'];

            for (const altPath of alternativePaths) {
                try {
                    await access(join(workDir, altPath));
                    return altPath;
                } catch {
                    continue;
                }
            }

            throw new Error(
                `Docker Compose file not found. Tried: ${primaryPath}, ${alternativePaths.join(', ')}`,
            );
        }
    }

    async validateComposeSyntax(workDir: string, composePath: string): Promise<void> {
        await this.exec('docker', ['compose', '-f', composePath, 'config', '--quiet'], {
            cwd: workDir,
        });
    }

    async validateDockerfile(workDir: string, dockerfilePath?: string): Promise<void> {
        const path = join(workDir, dockerfilePath || 'Dockerfile');

        try {
            await access(path);
        } catch {
            throw new Error(`Dockerfile not found at: ${dockerfilePath || 'Dockerfile'}`);
        }
    }

    async cleanup(workDir: string): Promise<void> {
        try {
            await rm(workDir, { recursive: true, force: true });
        } catch {
            /* empty */
        }
    }
}

export const gitService = new GitService();
