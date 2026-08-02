import type { SSEEvent } from '@workspace/typescript-interface/pipeline/pipeline';
import type { DockerApiClient } from '@workspace/typescript-interface/pipeline/nodeServices';

type LogWriter = (message: string) => Promise<void>;

async function streamSSERequest<T>(
    docker: DockerApiClient,
    endpoint: string,
    body: Record<string, unknown>,
    signal: AbortSignal,
    onLog: LogWriter,
    environmentId?: string,
): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
        const decoder = new TextDecoder();
        let buffer = '';
        let result: T | null = null;
        const logPromises: Promise<void>[] = [];

        const abortHandler = () => {
            reject(new DOMException('Operation aborted by user', 'AbortError'));
        };
        signal.addEventListener('abort', abortHandler);

        try {
            const response = await docker.post(endpoint, { json: body, signal, environmentId });

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
                                    logPromises.push(onLog(parsedData.message).catch(() => {}));
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

            await Promise.allSettled(logPromises);

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

export interface DockerBuildService {
    buildImage(
        workDir: string,
        imageName: string,
        dockerfilePath: string | undefined,
        signal: AbortSignal,
        onLog: LogWriter,
        environmentId?: string,
        labels?: Record<string, string>,
    ): Promise<{ imageId?: string }>;

    pushToRegistry(
        imageName: string,
        targetName: string,
        auth: { serveraddress: string; username: string; password: string },
        signal: AbortSignal,
        onLog: LogWriter,
        environmentId?: string,
    ): Promise<{ targetName: string }>;

    deployCompose(
        workDir: string,
        projectName: string,
        composePath: string | undefined,
        envVars: Record<string, string>,
        signal: AbortSignal,
        onLog: LogWriter,
        environmentId?: string,
        buildId?: string,
        repositoryId?: string,
        labels?: Record<string, string>,
        noCache?: boolean,
    ): Promise<{ success: boolean; containers?: string[]; composeConfig?: string }>;

    composeBuild(
        workDir: string,
        projectName: string,
        composePath: string,
        envVars: Record<string, string>,
        signal: AbortSignal,
        onLog: LogWriter,
        environmentId?: string,
        labels?: Record<string, string>,
        noCache?: boolean,
    ): Promise<{
        success: boolean;
        projectName: string;
        composeFile: string;
        services: string[];
        builtServices: string[];
        composeConfig: string;
    }>;

    composeRun(
        workDir: string,
        projectName: string,
        composeFile: string,
        service: string,
        command: string | undefined,
        envVars: Record<string, string>,
        signal: AbortSignal,
        onLog: LogWriter,
        environmentId?: string,
        options?: { noDeps?: boolean; user?: string; workingDir?: string },
    ): Promise<{ success: boolean; exitCode: number; service: string }>;

    composeUp(
        workDir: string,
        projectName: string,
        composeFile: string,
        envVars: Record<string, string>,
        signal: AbortSignal,
        onLog: LogWriter,
        environmentId?: string,
        options?: { recreate?: boolean; removeOrphans?: boolean; keepComposeFile?: boolean },
    ): Promise<{
        success: boolean;
        projectName: string;
        containers: string[];
        composeConfig: string;
    }>;
}

export function createDockerService(docker: DockerApiClient): DockerBuildService {
    return {
        buildImage(workDir, imageName, dockerfilePath, signal, onLog, environmentId, labels) {
            return streamSSERequest(
                docker,
                'pipeline/events/stream/build',
                { workDir, imageName, dockerfilePath, labels },
                signal,
                onLog,
                environmentId,
            );
        },

        pushToRegistry(imageName, targetName, auth, signal, onLog, environmentId) {
            return streamSSERequest(
                docker,
                'pipeline/events/stream/push',
                { imageName, targetName, auth },
                signal,
                onLog,
                environmentId,
            );
        },

        deployCompose(
            workDir,
            projectName,
            composePath,
            envVars,
            signal,
            onLog,
            environmentId,
            buildId,
            repositoryId,
            labels,
            noCache,
        ) {
            return streamSSERequest(
                docker,
                'pipeline/events/stream/compose',
                { workDir, projectName, composePath, envVars, buildId, repositoryId, labels, noCache },
                signal,
                onLog,
                environmentId,
            );
        },

        composeBuild(workDir, projectName, composePath, envVars, signal, onLog, environmentId, labels, noCache) {
            return streamSSERequest(
                docker,
                'pipeline/events/stream/compose-build',
                { workDir, projectName, composePath, envVars, labels, noCache },
                signal,
                onLog,
                environmentId,
            );
        },

        composeRun(
            workDir,
            projectName,
            composeFile,
            service,
            command,
            envVars,
            signal,
            onLog,
            environmentId,
            options,
        ) {
            return streamSSERequest(
                docker,
                'pipeline/events/stream/compose-run',
                {
                    workDir,
                    projectName,
                    composeFile,
                    service,
                    command,
                    envVars,
                    noDeps: options?.noDeps,
                    user: options?.user,
                    workingDir: options?.workingDir,
                },
                signal,
                onLog,
                environmentId,
            );
        },

        composeUp(workDir, projectName, composeFile, envVars, signal, onLog, environmentId, options) {
            return streamSSERequest(
                docker,
                'pipeline/events/stream/compose-up',
                {
                    workDir,
                    projectName,
                    composeFile,
                    envVars,
                    recreate: options?.recreate,
                    removeOrphans: options?.removeOrphans,
                    keepComposeFile: options?.keepComposeFile,
                },
                signal,
                onLog,
                environmentId,
            );
        },
    };
}
