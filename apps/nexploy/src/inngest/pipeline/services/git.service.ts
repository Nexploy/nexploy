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

    matchesBranchFilter(branch: string, filter: string): boolean {
        const patterns = filter
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean);
        if (patterns.length === 0) return true;

        return patterns.some((pattern) => {
            if (pattern.endsWith('*')) {
                return branch.startsWith(pattern.slice(0, -1));
            }
            return branch === pattern;
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

            cloneArgs.push('--single-branch');
            if (buildConfig.gitBranch) {
                cloneArgs.push(`--branch=${buildConfig.gitBranch}`);
            }
            cloneArgs.push('--progress', buildConfig.gitUrl, workDir);

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
                    const forcedExpiredToken = {
                        ...token,
                        accessTokenExpiresAt: dayjs(0).toDate(),
                    };
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
                if (!/^[0-9a-f]{7,40}$/i.test(buildConfig.gitCommitHash)) {
                    throw new Error(`Invalid commit hash: ${buildConfig.gitCommitHash}`);
                }
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

        return workDir;
    }

    async getCommitInfo(workDir: string): Promise<{ hash: string; message: string } | null> {
        try {
            const hash = await this.exec('git', ['log', '-1', '--format=%H'], { cwd: workDir });
            const message = await this.exec('git', ['log', '-1', '--format=%s'], { cwd: workDir });
            return { hash: hash.substring(0, 8), message };
        } catch {
            return null;
        }
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

    async validateComposeFile(workDir: string, composePath: string): Promise<string> {
        const primaryPath = composePath;
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

    async createTag(
        workDir: string,
        tagName: string,
        message?: string,
    ): Promise<{ alreadyExists: boolean }> {
        const args = message ? ['tag', '-a', tagName, '-m', message] : ['tag', tagName];
        try {
            await this.exec('git', args, { cwd: workDir });
            return { alreadyExists: false };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('already exists')) return { alreadyExists: true };
            throw new Error(`git tag failed: ${msg}`);
        }
    }

    async pushTag(workDir: string, remote: string, tagName: string): Promise<void> {
        try {
            await this.exec('git', ['push', remote, tagName], { cwd: workDir });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`git push tag failed: ${msg}`);
        }
    }

    async cherryPick(
        workDir: string,
        commitHash: string,
        options?: { noCommit?: boolean; remote?: string; targetBranch?: string },
    ): Promise<void> {
        const remote = options?.remote ?? 'origin';
        try {
            await this.exec('git', ['fetch', remote], { cwd: workDir });
        } catch {
            /* empty */
        }
        if (options?.targetBranch) {
            await this.exec('git', ['checkout', options.targetBranch], { cwd: workDir });
        }
        const args = ['cherry-pick'];
        if (options?.noCommit) args.push('--no-commit');
        args.push(commitHash);
        try {
            await this.exec('git', args, { cwd: workDir });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`git cherry-pick failed: ${msg}`);
        }
    }

    async mergeBranch(
        workDir: string,
        sourceBranch: string,
        options?: {
            strategy?: 'merge' | 'squash';
            message?: string;
            remote?: string;
            push?: boolean;
            targetBranch?: string;
        },
    ): Promise<string> {
        const remote = options?.remote ?? 'origin';
        try {
            await this.exec('git', ['fetch', remote], { cwd: workDir });
        } catch {
            /* empty */
        }

        if (options?.targetBranch) {
            await this.exec('git', ['checkout', options.targetBranch], { cwd: workDir });
        }

        const currentBranch = (
            await this.exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: workDir })
        ).trim();

        const args = ['merge'];
        if (options?.strategy === 'squash') args.push('--squash');
        if (options?.message) args.push('-m', options.message);
        args.push(`${remote}/${sourceBranch}`);

        try {
            await this.exec('git', args, { cwd: workDir });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new Error(`git merge failed: ${msg}`);
        }

        if (options?.strategy === 'squash' && options?.message) {
            await this.exec('git', ['commit', '-m', options.message], { cwd: workDir });
        }

        if (options?.push) {
            await this.exec('git', ['push', remote, currentBranch], { cwd: workDir });
        }

        return currentBranch;
    }

    async getChangelogCommits(
        workDir: string,
        from: string,
        to: string,
    ): Promise<{ hash: string; subject: string; author: string; date: string }[]> {
        const range = from ? `${from}..${to}` : to;
        const output = await this.exec(
            'git',
            ['log', range, '--format=%H|%s|%an|%ai', '--no-merges'],
            { cwd: workDir },
        );
        if (!output.trim()) return [];
        return output
            .trim()
            .split('\n')
            .map((line) => {
                const [hash = '', subject = '', author = '', date = ''] = line.split('|');
                return { hash: hash.slice(0, 8), subject, author, date };
            });
    }

    async cloneExternal(
        repoUrl: string,
        branch: string,
        destDir: string,
        token?: string,
    ): Promise<void> {
        let cloneUrl = repoUrl;
        if (token) {
            try {
                const u = new URL(repoUrl);
                u.username = 'oauth2';
                u.password = token;
                cloneUrl = u.toString();
            } catch {
                /* empty */
            }
        }

        await this.exec('git', ['clone', '--branch', branch, '--depth', '1', cloneUrl, destDir], {
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
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
