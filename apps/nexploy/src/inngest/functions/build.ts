import { channel, topic } from '@inngest/realtime';
import {
    BuildConfig,
    BuildLogEntry,
    BuildStatus,
} from '@workspace/typescript-interface/inngest/build';
import { inngest } from '@/inngest/client';
import { updateStatusBuildInngest } from '@/services/inngest/build.inngest.service';
import { createLogInngest } from '@/services/inngest/log.inngest.service';
import { pipelineService } from '@/inngest/pipeline/pipelineService';

const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('status').type<{ status: string }>());
    return channelDef();
};

export const buildFunction = inngest.createFunction(
    {
        id: 'build-pipeline',
        retries: 0,
    },
    { event: 'build/start' },
    async ({ event, step, publish }) => {
        const { buildId, config } = event.data as { buildId: string; config: BuildConfig };

        const buildChannel = createBuildChannel(buildId);

        const publishLog = async (
            stepName: string,
            message: string,
            level: BuildLogEntry['level'],
        ) => {
            const log: BuildLogEntry = {
                level,
                buildId,
                createdAt: new Date(),
                step: stepName,
                message,
            };

            await Promise.all([publish(buildChannel.log({ log })), createLogInngest(log)]);
        };

        const publishStatus = async (status: BuildStatus) => {
            await Promise.all([
                publish(buildChannel.status({ status })),
                updateStatusBuildInngest(buildId, status),
            ]);
        };

        let workDir: string | null = null;

        try {
            workDir = await step.run('clone-repository', async () => {
                await publishStatus('BUILDING');
                await publishLog('clone', `Cloning repository ${config.gitUrl}`, 'INFO');

                const dir = await pipelineService.cloneRepository(config);

                await publishLog('clone', 'Repository cloned!', 'INFO');
                return dir;
            });

            await step.run('prepare-dockerfile', async () => {
                await publishLog('dockerfile', 'Preparing Dockerfile', 'INFO');
                await pipelineService.prepareDockerfile(workDir!, config);
                await publishLog('dockerfile', 'Dockerfile ready', 'INFO');
            });

            // Step 3: Write env file
            await step.run('write-env-file', async () => {
                if (Object.keys(config.envVariables).length > 0) {
                    await publishLog('env', 'Writing environment variables', 'INFO');
                    await pipelineService.writeEnvFile(workDir!, config.envVariables);
                    await publishLog('env', 'Environment file written', 'INFO');
                    await publishStatus('COMPLETED');
                }
            });

            // Step 4: Build Docker image
            // const buildResult = await step.run('build-docker-image', async () => {
            //     const imageName = await pipelineApi.getLocalImageName(config);
            //     await publishLog('build', `Building Docker image: ${imageName}`, 'INFO');
            //
            //     const result = await pipelineApi.buildImage(workDir!, imageName);
            //
            //     await publishLog('build', 'Docker image built successfully', 'INFO');
            //
            //     return result;
            // });

            // // Step 5: Deploy locally if autoDeploy is enabled
            // await step.run('deploy-container', async () => {
            //     await publishStatus('DEPLOYING');
            //     await publishLog('deploy', 'Starting local deployment', 'INFO');
            //
            //     const imageName = await pipelineApi.getLocalImageName(config);
            //     const deployResult = await pipelineApi.deploy(config.projectId, imageName, {
            //         port: config.port || 3000,
            //         envVars: config.envVariables,
            //     });
            //
            //     await publishLog(
            //         'deploy',
            //         `Deployed on port ${deployResult.port} (container: ${deployResult.containerId.slice(0, 12)})`,
            //         'INFO',
            //     );
            // });
            //
            // // Cleanup work directory
            // await step.run('cleanup', async () => {
            //     if (workDir) {
            //         await pipelineService.cleanup(workDir);
            //     }
            // });
            //
            // // Flush logs at the end of build (success)
            // await step.run('finalize-logs', async () => {
            //     await publishLog('complete', 'Build pipeline completed successfully', 'INFO');
            //     await publishStatus('COMPLETED');
            // });

            return {
                success: true,
                // imageId: buildResult.imageId,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await publishLog('error', `Build failed: ${errorMessage}`, 'ERROR');
            await publishStatus('FAILED');

            if (workDir) {
                await pipelineService.cleanup(workDir).catch(() => {});
            }

            throw error;
        }
    },
);
