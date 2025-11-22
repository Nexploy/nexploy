import { Job, Worker } from 'bullmq';
import { prisma } from '../../prisma/prisma';
import { buildQueueName, connection } from '@/lib/queue';
import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface BuildJobData {
    deploymentId: string;
}

console.log('Starting Build Worker...');

const worker = new Worker<BuildJobData>(
    buildQueueName,
    async (job: Job<BuildJobData>) => {
        const { deploymentId } = job.data;
        console.log(`Processing job ${job.id} for deployment ${deploymentId}`);

        const deployment = await prisma.deployment.findUnique({
            where: { id: deploymentId },
            include: { project: true },
        });

        if (!deployment || !deployment.project) {
            throw new Error(`Deployment or Project not found for ID ${deploymentId}`);
        }

        const { project } = deployment;
        const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `nexploy-build-${deploymentId}-`));
        let logs = '';

        const appendLog = async (message: string) => {
            const timestamp = new Date().toISOString();
            const logLine = `[${timestamp}] ${message}\n`;
            console.log(logLine.trim());
            logs += logLine;
            // Optimization: In a real app, you might want to debounce this update or push to a separate logs table/store (Redis/S3)
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { buildLogs: logs },
            });
        };

        const runCommand = async (file: string, args: string[], cwd: string) => {
            const subprocess = execa(file, args, { cwd, all: true });
            subprocess.stdout?.on('data', (chunk) => appendLog(chunk.toString()));
            subprocess.stderr?.on('data', (chunk) => appendLog(chunk.toString()));
            return subprocess;
        };

        try {
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { status: 'BUILDING', updatedAt: new Date() },
            });

            await appendLog('Starting build process...');
            await appendLog(`Work directory: ${workDir}`);

            // 1. Clone Repository
            await appendLog(`Cloning repository: ${project.repositoryUrl}`);
            let repoUrl = project.repositoryUrl;

            if (project.gitToken && repoUrl.startsWith('https://')) {
                // Inject token into URL for auth: https://token@github.com/...
                repoUrl = repoUrl.replace('https://', `https://${project.gitToken}@`);
            }

            await runCommand('git', ['clone', '-b', project.branch, repoUrl, '.'], workDir);

            // Get commit info
            const { stdout: commitHash } = await execa('git', ['rev-parse', 'HEAD'], {
                cwd: workDir,
            });
            const { stdout: commitMessage } = await execa('git', ['log', '-1', '--pretty=%B'], {
                cwd: workDir,
            });

            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    commitHash: commitHash.trim(),
                    commitMessage: commitMessage.trim(),
                },
            });

            // 2. Build
            if (project.buildType === 'DOCKERFILE') {
                const dockerfilePath = project.dockerfilePath || 'Dockerfile';
                await appendLog(`Building Docker image using ${dockerfilePath}...`);

                const imageName = `nexploy-${project.name.toLowerCase()}:${commitHash.trim().substring(0, 7)}`;

                await runCommand(
                    'docker',
                    ['build', '-f', dockerfilePath, '-t', imageName, '.'],
                    workDir,
                );

                await appendLog(`Docker image ${imageName} built successfully.`);
                // In a real scenario, you would push this image to a registry here.
            } else {
                await appendLog(`Build type ${project.buildType} not implemented yet.`);
            }

            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { status: 'SUCCESS', updatedAt: new Date() },
            });

            await appendLog('Build completed successfully.');
        } catch (error: any) {
            console.error(`Build failed for deployment ${deploymentId}:`, error);
            await appendLog(`ERROR: ${error.message}`);
            if (error.all) {
                await appendLog(`Output: ${error.all}`);
            }

            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { status: 'FAILED', updatedAt: new Date() },
            });

            throw error; // Fail the job in BullMQ
        } finally {
            // Cleanup
            try {
                await fs.rm(workDir, { recursive: true, force: true });
                await appendLog('Cleaned up working directory.');
            } catch (cleanupError: any) {
                console.error('Failed to cleanup work dir:', cleanupError);
            }
        }
    },
    { connection },
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    await worker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await worker.close();
    process.exit(0);
});
