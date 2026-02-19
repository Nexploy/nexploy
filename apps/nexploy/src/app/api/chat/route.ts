import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { getUserSession } from '@/services/auth/auth.service';
import { containerCreateFormSchema } from '@workspace/schemas-zod/docker/container/containerCreate.schema';
import { networkCreateSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { volumeCreateSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { imagePullSchema } from '@workspace/schemas-zod/docker/image/imagePullAction.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { route } from '@/lib/api/nextRoute';

export const maxDuration = 60;

export const POST = route.handler(async (request: Request) => {
    const session = await getUserSession();

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await request.json();

    const result = streamText({
        model: openai('gpt-4o'),
        messages,
        system: `You are a helpful DevOps assistant integrated into the Nexploy application.
    You help users manage Docker resources (containers, images, volumes, networks).

    Guidelines:
    - Be concise and helpful.
    - When creating a container, if the user doesn't specify details (like image), ask for them.
    - Assume the user is technical but appreciates valid defaults.
    - If a tool execution fails, explain why.
    - You can support commands like "Create a postgres container with env test=test".
    `,
        tools: {
            createContainer: {
                description: 'Create a new Docker container',
                inputSchema: containerCreateFormSchema,
                execute: async (params) => {
                    try {
                        const response = await kyDocker
                            .post('container/create', { json: params })
                            .json<{ id: string }>();
                        return {
                            success: true,
                            data: response,
                            message: `Container created successfully (ID: ${response.id})`,
                        };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.message || 'Failed to create container',
                        };
                    }
                },
            },
            createNetwork: {
                description: 'Create a Docker network',
                inputSchema: networkCreateSchema,
                execute: async (params) => {
                    try {
                        await kyDocker.post('networks/create', { json: params }).json();
                        return { success: true, message: `Network ${params.name} created` };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.message || 'Failed to create network',
                        };
                    }
                },
            },
            createVolume: {
                description: 'Create a Docker volume',
                inputSchema: volumeCreateSchema,
                execute: async (params) => {
                    try {
                        await kyDocker.post('volumes/create', { json: params }).json();
                        return { success: true, message: `Volume ${params.name} created` };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.message || 'Failed to create volume',
                        };
                    }
                },
            },
            pullImage: {
                description: 'Pull a Docker image from a registry',
                inputSchema: imagePullSchema,
                execute: async (params) => {
                    try {
                        await kyDocker.post('images/pull', { json: params }).json();
                        return {
                            success: true,
                            message: `Started pulling image ${params.imageName}. This may take a while.`,
                        };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.message || 'Failed to pull image',
                        };
                    }
                },
            },
        },
    });

    return result.toTextStreamResponse();
});
