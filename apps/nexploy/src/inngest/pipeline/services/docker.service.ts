import { env } from '../../../../env';
import { SSEEvent } from '../types';

/**
 * Docker Service
 * Handles communication with docker-api for build and deploy operations
 */
class DockerService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = env.DOCKER_API_URL;
    }

    /**
     * Build a Docker image from a Dockerfile
     */
    async buildImage(
        workDir: string,
        imageName: string,
        signal: AbortSignal,
        onLog: (message: string) => Promise<void>,
    ): Promise<{ imageId?: string }> {
        const response = await fetch(`${this.baseUrl}/api/pipeline/events/stream/build`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workDir, imageName }),
            signal,
        });

        if (!response.ok) {
            throw new Error(`Build failed with status ${response.status}`);
        }

        return this.parseSSEStream(response, signal, onLog);
    }

    /**
     * Deploy a Docker container from an image
     */
    async deployContainer(
        repositoryId: string,
        imageName: string,
        envVars: Record<string, string>,
        signal: AbortSignal,
    ): Promise<{ containerId: string }> {
        const response = await fetch(`${this.baseUrl}/api/pipeline/deploy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repositoryId,
                imageName,
                options: { envVars },
            }),
            signal,
        });

        if (!response.ok) {
            throw new Error(`Deployment failed with status ${response.status}`);
        }

        return response.json();
    }

    /**
     * Deploy a Docker Compose stack
     */
    async deployCompose(
        workDir: string,
        projectName: string,
        composePath: string | undefined,
        envVars: Record<string, string>,
        signal: AbortSignal,
        onLog: (message: string) => Promise<void>,
    ): Promise<{ success: boolean; containers?: string[] }> {
        const response = await fetch(`${this.baseUrl}/api/pipeline/events/stream/compose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workDir,
                projectName,
                composePath,
                envVars,
            }),
            signal,
        });

        if (!response.ok) {
            throw new Error(`Docker Compose deployment failed with status ${response.status}`);
        }

        return this.parseSSEStream(response, signal, onLog);
    }

    /**
     * Parse SSE stream from docker-api
     */
    private async parseSSEStream<T>(
        response: Response,
        signal: AbortSignal,
        onLog: (message: string) => Promise<void>,
    ): Promise<T> {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body');
        }

        let buffer = '';
        let result: T | null = null;

        const abortHandler = () => reader.cancel();
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
                                    await onLog(parsedData.message);
                                }
                            } catch (e) {
                                if (e instanceof Error && e.message !== 'Unknown error') {
                                    throw e;
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
        } finally {
            signal.removeEventListener('abort', abortHandler);
            reader.releaseLock();
        }

        return result as T;
    }
}

export const dockerService = new DockerService();
