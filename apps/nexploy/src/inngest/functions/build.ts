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
import { env } from '../../../env';

const createBuildChannel = (buildId: string) => {
    const channelDef = channel(`build:${buildId}`)
        .addTopic(topic('log').type<{ log: BuildLogEntry }>())
        .addTopic(topic('status').type<{ status: string }>());
    return channelDef();
};

export const buildFunction = inngest.createFunction(
    {
        id: 'build-pipeline',
        cancelOn: [{ event: 'build/cancel', if: 'event.data.buildId == async.data.buildId' }],
        retries: 0,
    },
    { event: 'build/start' },
    async ({ event, step, publish }) => {
        const { buildId, config } = event.data as { buildId: string; config: BuildConfig };

        const buildChannel = createBuildChannel(buildId);
        const abortController = new AbortController();

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

                const onProgress = async (progress: number, message: string) => {
                    await publishLog('clone', `${message} (${Math.round(progress)}%)`, 'INFO');
                };

                const dir = await pipelineService.cloneRepository(config, onProgress);

                await publishLog('clone', 'Repository cloned!', 'INFO');
                return dir;
            });

            await step.run('prepare-dockerfile', async () => {
                await publishLog('dockerfile', 'Preparing Dockerfile', 'INFO');
                await pipelineService.prepareDockerfile(workDir!, config);
                await publishLog('dockerfile', 'Dockerfile ready', 'INFO');
            });

            await step.run('write-env-file', async () => {
                if (Object.keys(config.envVariables).length > 0) {
                    await publishLog('env', 'Writing environment variables', 'INFO');
                    await pipelineService.writeEnvFile(workDir!, config.envVariables);
                    await publishLog('env', 'Environment file written', 'INFO');
                }
            });

            const buildResult = await step.run('build-docker-image', async () => {
                const imageName = `${config.repositoryId}:${buildId}`;
                await publishLog('build', `Building Docker image: ${imageName}`, 'INFO');

                const response = await fetch(
                    `${env.DOCKER_API_URL}/api/pipeline/events/stream/build`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            workDir,
                            imageName,
                        }),
                        signal: abortController.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(`Build failed with status ${response.status}`);
                }

                return await parseSSEStream(response, abortController.signal, async (event) => {
                    if (event.type === 'log') {
                        await publishLog('build', event.message, 'INFO');
                    } else if (event.type === 'error') {
                        throw new Error(event.message);
                    }
                });
            });

            await step.run('deploy-container', async () => {
                await publishStatus('DEPLOYING');
                await publishLog('deploy', 'Starting deployment', 'INFO');

                const imageName = `${config.repositoryId}:${buildId}`;

                const response = await fetch(`${env.DOCKER_API_URL}/api/pipeline/deploy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        repositoryId: config.repositoryId,
                        imageName,
                        options: {
                            port: config.port,
                            envVars: config.envVariables,
                            traefik: config.traefik,
                        },
                    }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`Deployment failed with status ${response.status}`);
                }

                const deployResult = await response.json();

                const deployMessage = config.traefik?.enabled
                    ? `Deployed via Traefik at ${config.traefik.domain || `deploy-${config.repositoryId}.localhost`}`
                    : `Deployed on port ${deployResult.port}`;

                await publishLog(
                    'deploy',
                    `${deployMessage} (container: ${deployResult.containerId.slice(0, 12)})`,
                    'INFO',
                );
            });

            await step.run('cleanup', async () => {
                if (workDir) {
                    await pipelineService.cleanup(workDir);
                }
            });

            await step.run('finalize-logs', async () => {
                await publishLog('complete', 'Build pipeline completed successfully', 'INFO');
                await publishStatus('COMPLETED');
            });

            return {
                success: true,
                imageId: buildResult?.imageId,
            };
        } catch (error) {
            abortController.abort();

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            if (error instanceof Error && error.name === 'AbortError') {
                await publishLog('cancel', 'Build cancelled by user', 'INFO');
                await publishStatus('CANCELLED');
            } else {
                await publishLog('error', `Build failed: ${errorMessage}`, 'ERROR');
                await publishStatus('FAILED');
            }

            if (workDir) {
                await pipelineService.cleanup(workDir);
            }

            throw error;
        }
    },
);

async function parseSSEStream(
    response: Response,
    signal: AbortSignal,
    onEvent: (event: any) => Promise<void>,
): Promise<any> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
        throw new Error('No response body');
    }

    let buffer = '';
    let result: any = null;

    const abortHandler = () => {
        reader.cancel();
    };
    signal.addEventListener('abort', abortHandler);

    try {
        while (true) {
            if (signal.aborted) {
                throw new DOMException('Request aborted', 'AbortError');
            }

            const { done, value } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            buffer = lines.pop() || '';

            let currentEvent: any = {};

            for (const line of lines) {
                if (line.trim() === '') {
                    if (currentEvent.data) {
                        try {
                            const parsedData = JSON.parse(currentEvent.data);

                            if (parsedData.type === 'complete') {
                                result = parsedData.result;
                            } else {
                                await onEvent(parsedData);
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE data:', currentEvent.data);
                        }
                    }
                    currentEvent = {};
                } else if (line.startsWith('event:')) {
                    currentEvent.event = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                    currentEvent.data = line.slice(5).trim();
                } else if (line.startsWith('id:')) {
                    currentEvent.id = line.slice(3).trim();
                }
            }
        }
    } finally {
        signal.removeEventListener('abort', abortHandler);
        reader.releaseLock();
    }

    return result;
}
