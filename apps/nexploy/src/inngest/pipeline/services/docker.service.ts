import { SSEEvent } from '@/types/pipeline.type';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

class DockerService {
    async buildImage(
        workDir: string,
        imageName: string,
        signal: AbortSignal,
        onLog: (message: string) => Promise<void>,
        environmentId?: string,
    ): Promise<{ imageId?: string }> {
        return this.streamSSERequest<{ imageId?: string }>(
            'pipeline/events/stream/build',
            { workDir, imageName },
            signal,
            onLog,
            environmentId,
        );
    }

    async deployContainer(
        repositoryId: string,
        imageName: string,
        envVars: Record<string, string>,
        signal: AbortSignal,
        environmentId?: string,
    ): Promise<{ containerId: string }> {
        try {
            return await kyDocker
                .post('pipeline/deploy', {
                    json: {
                        repositoryId,
                        imageName,
                        options: { envVars },
                    },
                    signal,
                    environmentId,
                } as KyDockerOptions)
                .json<{ containerId: string }>();
        } catch (error: unknown) {
            throw new Error(`Deployment failed : ${error}`);
        }
    }

    async deployCompose(
        workDir: string,
        projectName: string,
        composePath: string | undefined,
        envVars: Record<string, string>,
        signal: AbortSignal,
        onLog: (message: string) => Promise<void>,
        environmentId?: string,
        buildId?: string,
        repositoryId?: string,
    ): Promise<{ success: boolean; containers?: string[] }> {
        return this.streamSSERequest<{ success: boolean; containers?: string[] }>(
            'pipeline/events/stream/compose',
            { workDir, projectName, composePath, envVars, buildId, repositoryId },
            signal,
            onLog,
            environmentId,
        );
    }

    private async streamSSERequest<T>(
        endpoint: string,
        body: Record<string, unknown>,
        signal: AbortSignal,
        onLog: (message: string) => Promise<void>,
        environmentId?: string,
    ): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            const decoder = new TextDecoder();
            let buffer = '';
            let result: T | null = null;

            const abortHandler = () => {
                reject(new DOMException('Request aborted', 'AbortError'));
            };
            signal.addEventListener('abort', abortHandler);

            try {
                const response = await kyDocker.post(endpoint, {
                    json: body,
                    signal,
                    environmentId,
                } as KyDockerOptions);

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Response body is not readable');
                }

                while (true) {
                    const { done, value: chunk } = await reader.read();

                    if (done) break;

                    if (signal.aborted) {
                        await reader.cancel();
                        throw new DOMException('Request aborted', 'AbortError');
                    }

                    buffer += decoder.decode(chunk, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    let currentEvent: { event?: string; data?: string } = {};

                    for (const line of lines) {
                        if (line.trim() === '') {
                            if (currentEvent.data) {
                                try {
                                    const parsedData: SSEEvent = JSON.parse(currentEvent.data);

                                    if (parsedData.type === 'complete') {
                                        result = parsedData.result as T;
                                    } else if (parsedData.type === 'error') {
                                        throw new Error(parsedData.message || 'Unknown error');
                                    } else if (parsedData.type === 'log' && parsedData.message) {
                                        void onLog(parsedData.message);
                                    }
                                } catch (e) {
                                    if (e instanceof Error && e.message !== 'Unknown error') {
                                        await reader.cancel();
                                        signal.removeEventListener('abort', abortHandler);
                                        reject(e);
                                        return;
                                    }
                                }
                            }
                            currentEvent = {};
                        } else if (line.startsWith('event:')) {
                            currentEvent.event = line.slice(6).trim();
                        } else if (line.startsWith('data:')) {
                            currentEvent.data = line.slice(5).trim();
                        }
                    }
                }

                signal.removeEventListener('abort', abortHandler);
                if (result !== null) {
                    resolve(result);
                } else {
                    reject(new Error('No result received from stream'));
                }
            } catch (error) {
                signal.removeEventListener('abort', abortHandler);
                reject(error);
            }
        });
    }
}

export const dockerService = new DockerService();
