import { spawn } from 'child_process';
import dayjs from 'dayjs';
import { access, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { kyDocker } from '@/lib/api/kyDocker';
import { BuildConfig } from '@workspace/typescript-interface/repository/build';
import { GitProviderToken } from '@workspace/typescript-interface/git/git';
import { getValidToken } from '@/services/api/gitProvider.service';
import { getGitProviderToken } from '@/services/git/git.service';
import { ProgressCallback } from '@workspace/typescript-interface/pipeline/pipeline';

const ALLOWED_GIT_PROTOCOLS = ['http:', 'https:'];

class GitService {
    private assertSafeGitUrl(gitUrl: string): void {
        let parsed: URL;
        try {
            parsed = new URL(gitUrl);
        } catch {
            throw new Error(`Invalid repository URL: ${gitUrl}`);
        }
        if (!ALLOWED_GIT_PROTOCOLS.includes(parsed.protocol)) {
            throw new Error(
                `Unsupported repository URL protocol "${parsed.protocol}". Only http(s) is allowed.`,
            );
        }
    }

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
        options?: { submodules?: boolean; destDir?: string; manualToken?: string },
    ): Promise<string> {
        this.assertSafeGitUrl(buildConfig.gitUrl);

        const workDir =
            options?.destDir ??
            join(
                process.env.DEPLOYER_WORK_DIR as string,
                buildConfig.repositoryId,
                Date.now().toString(),
            );
        await mkdir(workDir, { recursive: true });

        const token = await this.resolveToken(buildConfig, options?.manualToken);

        try {
            await this.execCloneWithRetry(
                token,
                buildConfig,
                workDir,
                options?.submodules ?? false,
                onProgress,
            );
        } catch (error: unknown) {
            await rm(workDir, { recursive: true, force: true }).catch(() => {});
            const message = error instanceof Error ? error.message : String(error);
            if (this.isAuthenticationError(message)) {
                throw new Error(
                    `Failed to clone repository: Authentication failed for ${buildConfig.gitUrl}. Your Git provider token may be expired or revoked. Please reconnect your account from the integrations settings.`,
                );
            }
            throw new Error(
                `Failed to clone repository from ${buildConfig.gitUrl} (branch: ${buildConfig.gitBranch}): ${message}`,
            );
        }

        return workDir;
    }

    private async resolveToken(
        buildConfig: BuildConfig,
        manualToken?: string,
    ): Promise<GitProviderToken> {
        if (manualToken !== undefined) {
            return {
                accessToken: manualToken || null,
                refreshToken: null,
                accessTokenExpiresAt: null,
            };
        }
        const stored = await getGitProviderToken(buildConfig.gitProvider, {
            gitAccountId: buildConfig.gitAccountId,
            requestedUserId: buildConfig.userId,
        });
        return getValidToken(
            stored,
            buildConfig.gitProvider,
            buildConfig.userId,
            buildConfig.gitAccountId,
        );
    }

    private baseGitEnv(): NodeJS.ProcessEnv {
        return { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: 'echo' };
    }

    private gitCredentialUsername(provider: BuildConfig['gitProvider']): string {
        return provider === 'GITHUB' ? 'x-access-token' : 'oauth2';
    }

    private buildAuthedUrl(
        gitUrl: string,
        accessToken: string | null,
        provider: BuildConfig['gitProvider'],
    ): string {
        if (!accessToken) return gitUrl;
        const url = new URL(gitUrl);
        url.username = this.gitCredentialUsername(provider);
        url.password = accessToken;
        return url.toString();
    }

    private redactToken(message: string, accessToken: string | null): string {
        return accessToken ? message.split(accessToken).join('***') : message;
    }

    private buildCloneArgs(
        gitUrl: string,
        gitBranch: string | undefined,
        workDir: string,
        submodules: boolean,
    ): string[] {
        const args = ['-c', 'credential.helper=', 'clone', '--depth=1', '--single-branch'];
        if (submodules) args.push('--recurse-submodules', '--shallow-submodules');
        if (gitBranch) args.push(`--branch=${gitBranch}`);
        args.push('--progress', '--', gitUrl, workDir);
        return args;
    }

    private isAuthenticationError(message: string): boolean {
        return (
            message.includes('Authentication failed') ||
            message.includes('Invalid username or token') ||
            message.includes('could not read Username')
        );
    }

    private async execCloneWithRetry(
        token: GitProviderToken,
        buildConfig: BuildConfig,
        workDir: string,
        submodules: boolean,
        onProgress?: ProgressCallback,
    ): Promise<void> {
        const gitEnv = this.baseGitEnv();

        const runClone = async (accessToken: string | null) => {
            const authedUrl = this.buildAuthedUrl(
                buildConfig.gitUrl,
                accessToken,
                buildConfig.gitProvider,
            );
            const cloneArgs = this.buildCloneArgs(
                authedUrl,
                buildConfig.gitBranch,
                workDir,
                submodules,
            );
            try {
                await this.exec('git', cloneArgs, { env: gitEnv }, onProgress);
            } catch (err: unknown) {
                const raw = err instanceof Error ? err.message : String(err);
                throw new Error(this.redactToken(raw, accessToken));
            }
        };

        try {
            await runClone(token.accessToken);
        } catch (cloneError: unknown) {
            const message = cloneError instanceof Error ? cloneError.message : String(cloneError);
            if (!this.isAuthenticationError(message) || !token.accessToken) throw cloneError;

            const refreshedToken = await getValidToken(
                { ...token, accessTokenExpiresAt: dayjs(0).toDate() },
                buildConfig.gitProvider,
                buildConfig.userId,
                buildConfig.gitAccountId,
            );

            await rm(workDir, { recursive: true, force: true }).catch(() => {});
            await mkdir(workDir, { recursive: true });
            await runClone(refreshedToken.accessToken);
        }
    }

    async getCommitInfo(workDir: string): Promise<{ hash: string; message: string } | null> {
        try {
            const hash = await this.exec('git', ['log', '-1', '--format=%H'], { cwd: workDir });
            const message = await this.exec('git', ['log', '-1', '--format=%s'], { cwd: workDir });
            return { hash: hash.trim(), message: message.trim() };
        } catch {
            return null;
        }
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
        const content = await readFile(join(workDir, composePath), 'utf-8');
        await kyDocker.post('composes/validate-syntax', { json: { content } });
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

    async cleanup(workDir: string): Promise<void> {
        try {
            await rm(workDir, { recursive: true, force: true });
        } catch {
            /* empty */
        }
    }
}

export const gitService = new GitService();
