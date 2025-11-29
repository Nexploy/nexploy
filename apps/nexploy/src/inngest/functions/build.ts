import { channel, topic } from '@inngest/realtime';
import { BuildLogEntry, BuildStatus } from '@workspace/typescript-interface/inngest/build';
import { inngest } from '@/inngest/client';
import { updateStatusBuild } from '@/services/inngest/build.service';

const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('status').type<{ status: string }>());
    return channelDef();
};

const saveLogs = async (buildId: string, logs: BuildLogEntry[]): Promise<void> => {
    try {
        // await drinoNext.post(`/builds/logs`, { buildId, logs }).consume();
    } catch (error) {
        console.error('Failed to persist logs:', error);
    }
};

export const buildFunction = inngest.createFunction(
    {
        id: 'build-pipeline',
        retries: 1,
        concurrency: {
            limit: 1,
        },
    },
    { event: 'build/start' },
    async ({ event, step, publish }) => {
        const { buildId, config } = event.data;

        const buildChannel = createBuildChannel(buildId);

        const publishLog = async (
            stepName: string,
            message: string,
            level: BuildLogEntry['level'] = 'INFO',
        ) => {
            const log: BuildLogEntry = {
                level,
                buildId,
                createdAt: new Date(),
                step: stepName,
                message,
            };

            await Promise.all([publish(buildChannel.log({ log })), saveLogs(buildId, [log])]);
        };

        const publishStatus = async (status: BuildStatus) => {
            await Promise.all([
                publish(buildChannel.status({ status })),
                await updateStatusBuild(buildId, status),
            ]);
        };

        let workDir: string | null = null;

        // try {
        workDir = await step.run('clone-repository', async () => {
            await publishStatus('BUILDING');
            await publishLog('clone', `Cloning repository ${config.gitUrl}`, 'INFO');

            // const dir = await pipelineService.cloneRepository(config);

            await publishLog('clone', 'Repository cloned!', 'INFO');
            // return dir;
        });

        // Flush logs at the end of build (success or failure)
        await step.run('finalize-logs', async () => {
            await publishLog('complete', 'Build completed successfully', 'INFO');
            await publishStatus('COMPLETED');
        });

        //     // Step 2: Prepare Dockerfile
        //     await step.run('prepare-dockerfile', async () => {
        //         // await addLog(buildJob, 'info', 'dockerfile', 'Preparing Dockerfile');
        //         await pipelineService.prepareDockerfile(workDir!, config);
        //         // await addLog(buildJob, 'info', 'dockerfile', 'Dockerfile ready');
        //     });
        //
        //     // Step 3: Write env file
        //     await step.run('write-env-file', async () => {
        //         if (Object.keys(config.envVariables).length > 0) {
        //             // await addLog(buildJob, 'info', 'env', 'Writing environment variables');
        //             await pipelineService.writeEnvFile(workDir!, config.envVariables);
        //             // await addLog(buildJob, 'info', 'env', 'Environment file written');
        //         }
        //     });
        //
        //     // Step 4: Build Docker image
        //     const buildResult = await step.run('build-docker-image', async () => {
        //         // await updateStatus(buildJob, 'building');
        //         const imageName = imagesStateManager.getLocalImageName(config);
        //         // await addLog(buildJob, 'info', 'build', `Building Docker image: ${imageName}`);
        //
        //         const result = await imagesStateManager.buildImage(workDir!, imageName, (log) => {
        //             // addLog(buildJob, 'debug', 'build', log);
        //         });
        //
        //         // buildJob.imageId = result.imageId;
        //         // await buildJobStore.set(jobId, buildJob);
        //         // await addLog(buildJob, 'info', 'build', 'Docker image built successfully');
        //
        //         return result;
        //     });
        //
        //     // Step 5: Deploy locally if autoDeploy is enabled
        //     await step.run('deploy-container', async () => {
        //         // await updateStatus(buildJob, 'deploying');
        //         // await addLog(buildJob, 'info', 'deploy', 'Starting local deployment');
        //
        //         const imageName = imagesStateManager.getLocalImageName(config);
        //         const deployResult = await containersStateManager.deploy(
        //             config.projectId,
        //             imageName,
        //             {
        //                 port: config.port || 3000,
        //                 envVars: config.envVariables,
        //             },
        //         );
        //
        //         // buildJob.deploymentId = deployResult.deploymentId;
        //         // buildJob.containerId = deployResult.containerId;
        //         // buildJob.port = deployResult.port;
        //         // await buildJobStore.set(jobId, buildJob);
        //
        //         // await addLog(
        //         //     buildJob,
        //         //     'info',
        //         //     'deploy',
        //         //     `Deployed on port ${deployResult.port} (container: ${deployResult.containerId.slice(0, 12)})`,
        //         // );
        //     });
        //
        //     // Cleanup work directory
        //     await step.run('cleanup', async () => {
        //         if (workDir) {
        //             await pipelineService.cleanup(workDir);
        //         }
        //
        //         // await updateStatus(buildJob, 'completed');
        //         // buildJob.completedAt = new Date();
        //         // await buildJobStore.set(jobId, buildJob);
        //         // await addLog(buildJob, 'info', 'complete', 'Build pipeline completed successfully');
        //     });
        //
        //     return {
        //         success: true,
        //         // imageId: buildJob.imageId,
        //         // deploymentId: buildJob.deploymentId,
        //         // port: buildJob.port,
        //     };
        // } catch (error) {
        //     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        //     // buildJob.error = errorMessage;
        //     // await updateStatus(buildJob, 'failed');
        //     // await addLog(buildJob, 'error', 'error', `Build failed: ${errorMessage}`);
        //
        //     if (workDir) {
        //         await pipelineService.cleanup(workDir).catch(() => {});
        //     }
        //
        //     throw error;
        // }
    },
);
