import { spawn } from 'child_process';
import { access, copyFile, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { deployerConfig } from '@/deployer/config';
import { logger } from '@/utils/logger';
import type { BuildConfig } from '@/deployer/types';

class PipelineService {
    private async exec(
        command: string,
        args: string[],
        options?: { cwd?: string },
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
                stderr += data.toString();
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

    private getAuthenticatedGitUrl(gitUrl: string, gitToken?: string): string {
        if (!gitToken) {
            return gitUrl;
        }

        try {
            const url = new URL(gitUrl);

            url.username = 'oauth2';
            url.password = gitToken;

            return url.toString();
        } catch (error) {
            logger.warn({ gitUrl, error }, 'Failed to parse Git URL, using original URL');
            return gitUrl;
        }
    }

    async cloneRepository(buildConfig: BuildConfig): Promise<string> {
        const workDir = join(deployerConfig.workDir, buildConfig.projectId, Date.now().toString());

        await mkdir(workDir, { recursive: true });

        logger.info(
            { gitUrl: buildConfig.gitUrl, branch: buildConfig.gitBranch, workDir },
            'Cloning repository',
        );

        console.log({ buildConfig });

        const authenticatedUrl = this.getAuthenticatedGitUrl(
            buildConfig.gitUrl,
            buildConfig.gitToken,
        );

        console.log({ authenticatedUrl });

        await this.exec('git', [
            'clone',
            '--depth=1',
            '--single-branch',
            `--branch=${buildConfig.gitBranch}`,
            authenticatedUrl,
            workDir,
        ]);

        if (buildConfig.projectPath && buildConfig.projectPath !== '.') {
            return join(workDir, buildConfig.projectPath);
        }

        return workDir;
    }

    async prepareDockerfile(workDir: string, buildConfig: BuildConfig): Promise<void> {
        const dockerfilePath = join(workDir, 'Dockerfile');

        try {
            await access(dockerfilePath);
            logger.info('Using existing Dockerfile');
            return;
        } catch {}

        if (buildConfig.dockerfile) {
            logger.info('Using provided Dockerfile content');
            await writeFile(dockerfilePath, buildConfig.dockerfile);
            return;
        }

        if (buildConfig.dockerfilePath) {
            logger.info({ path: buildConfig.dockerfilePath }, 'Copying Dockerfile from path');
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

        logger.info(
            { path: envPath, count: Object.keys(envVariables).length },
            'Environment file written',
        );
    }

    async cleanup(workDir: string): Promise<void> {
        try {
            await rm(workDir, { recursive: true, force: true });
            logger.info({ workDir }, 'Cleaned up work directory');
        } catch (error) {
            logger.warn({ workDir, error }, 'Failed to cleanup work directory');
        }
    }
}

export const pipelineService = new PipelineService();
