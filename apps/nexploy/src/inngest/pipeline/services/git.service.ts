import { spawn } from 'child_process';
import dayjs from 'dayjs';
import { access, mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import { BuildConfig } from '@workspace/typescript-interface/inngest/build';
import { getValidToken } from '@/services/api/gitProvider.service';
import { getGitProviderToken } from '@/services/git/git.service';
import { ProgressCallback } from '@/types/pipeline.type';

class GitService {
    private async exec(
        command: string,
        args: string[],
        options?: { cwd?: string; env?: NodeJS.ProcessEnv },
        onProgress?: ProgressCallback,
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, {
                cwd: options?.cwd,
                env: options?.env ?? process.env,
                stdio: ['ignore', 'pipe', 'pipe'],
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

    async cloneRepository(
        buildConfig: BuildConfig,
        onProgress?: ProgressCallback,
    ): Promise<string> {
        const workDir = join(
            process.env.DEPLOYER_WORK_DIR as string,
            buildConfig.repositoryId,
            Date.now().toString(),
        );

        await mkdir(workDir, { recursive: true });

        const latestToken = await getGitProviderToken(buildConfig.gitProvider, {
            gitAccountId: buildConfig.gitAccountId,
            requestedUserId: buildConfig.userId,
        });
        const token = await getValidToken(
            latestToken,
            buildConfig.gitProvider,
            buildConfig.userId,
            buildConfig.gitAccountId,
        );

        const credsTmpDir = token.accessToken
            ? await mkdtemp(join(os.tmpdir(), 'nexploy-git-'))
            : null;

        try {
            let gitEnv: NodeJS.ProcessEnv = {
                ...process.env,
                GIT_TERMINAL_PROMPT: '0',
                GIT_ASKPASS: 'echo',
            };

            if (credsTmpDir && token.accessToken) {
                const parsedUrl = new URL(buildConfig.gitUrl);
                const credsEntry = `${parsedUrl.protocol}//oauth2:${token.accessToken}@${parsedUrl.host}\n`;
                const credsFile = join(credsTmpDir, 'credentials');
                const configFile = join(credsTmpDir, 'config');

                await writeFile(credsFile, credsEntry, { mode: 0o600 });
                await writeFile(
                    configFile,
                    `[credential]\n\thelper = store --file ${credsFile}\n`,
                    { mode: 0o600 },
                );

                gitEnv = {
                    ...process.env,
                    GIT_TERMINAL_PROMPT: '0',
                    GIT_ASKPASS: 'echo',
                    GIT_CONFIG_GLOBAL: configFile,
                };
            }

            const cloneArgs = ['clone'];

            if (!buildConfig.gitCommitHash) {
                cloneArgs.push('--depth=1');
            }

            cloneArgs.push(
                '--single-branch',
                `--branch=${buildConfig.gitBranch}`,
                '--progress',
                buildConfig.gitUrl,
                workDir,
            );

            try {
                await this.exec('git', cloneArgs, { env: gitEnv }, onProgress);
            } catch (cloneError: unknown) {
                const errorMessage =
                    cloneError instanceof Error ? cloneError.message : String(cloneError);
                const isAuthError =
                    errorMessage.includes('Authentication failed') ||
                    errorMessage.includes('Invalid username or token') ||
                    errorMessage.includes('could not read Username');

                if (isAuthError && token.accessToken) {
                    // Force-refresh the token and retry with new credentials
                    const forcedExpiredToken = { ...token, accessTokenExpiresAt: dayjs(0).toDate() };
                    const refreshedToken = await getValidToken(
                        forcedExpiredToken,
                        buildConfig.gitProvider,
                        buildConfig.userId,
                        buildConfig.gitAccountId,
                    );

                    if (credsTmpDir && refreshedToken.accessToken) {
                        const parsedUrl = new URL(buildConfig.gitUrl);
                        const newCredsEntry = `${parsedUrl.protocol}//oauth2:${refreshedToken.accessToken}@${parsedUrl.host}\n`;
                        const credsFile = join(credsTmpDir, 'credentials');
                        await writeFile(credsFile, newCredsEntry, { mode: 0o600 });
                    }

                    await rm(workDir, { recursive: true, force: true }).catch(() => {});
                    await mkdir(workDir, { recursive: true });
                    await this.exec('git', cloneArgs, { env: gitEnv }, onProgress);
                } else {
                    throw cloneError;
                }
            }

            if (buildConfig.gitCommitHash) {
                await this.exec('git', ['checkout', buildConfig.gitCommitHash], {
                    cwd: workDir,
                    env: gitEnv,
                });
            }
        } catch (error: unknown) {
            await rm(workDir, { recursive: true, force: true }).catch(() => {});
            const commitInfo = buildConfig.gitCommitHash
                ? `, commit: ${buildConfig.gitCommitHash}`
                : '';
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isAuthError =
                errorMessage.includes('Authentication failed') ||
                errorMessage.includes('Invalid username or token') ||
                errorMessage.includes('could not read Username');

            if (isAuthError) {
                throw new Error(
                    `Failed to clone repository: Authentication failed for ${buildConfig.gitUrl}. Your Git provider token may be expired or revoked. Please reconnect your account from the integrations settings.`,
                );
            }

            throw new Error(
                `Failed to clone repository from ${buildConfig.gitUrl} (branch: ${buildConfig.gitBranch}${commitInfo}): ${errorMessage}`,
            );
        } finally {
            if (credsTmpDir) {
                await rm(credsTmpDir, { recursive: true, force: true }).catch(() => {});
            }
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
            .map(([key, value]) => {
                const needsQuotes =
                    value.includes('\n') ||
                    value.includes('"') ||
                    value.includes("'") ||
                    value.includes(' ') ||
                    value.includes('=');
                const escaped = needsQuotes
                    ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
                    : value;
                return `${key}=${escaped}`;
            })
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
