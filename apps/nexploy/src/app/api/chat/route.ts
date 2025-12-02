import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { getUserSession } from '@/services/auth/auth.service';
import { containerCreateFormSchema } from '@workspace/schemas-zod/container/containerCreate.schema';
import { networkCreateSchema } from '@workspace/schemas-zod/network/networkAction.schema';
import { volumeCreateSchema } from '@workspace/schemas-zod/volume/volumeAction.schema';
import { imagePullSchema } from '@workspace/schemas-zod/image/imagePullAction.schema';

export const maxDuration = 60;

export async function POST(req: Request) {
    const session = await getUserSession();

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

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
            createContainer: tool({
                description: 'Create a new Docker container',
                parameters: containerCreateFormSchema,
                execute: async (params) => {
                    try {
                        const response = await drinoDocker
                            .post<{ id: string }>(`/container/create`, params)
                            .consume();
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
            }),
            createNetwork: tool({
                description: 'Create a Docker network',
                parameters: networkCreateSchema,
                execute: async (params) => {
                    try {
                        await drinoDocker.post('/networks/create', params).consume();
                        return { success: true, message: `Network ${params.name} created` };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.message || 'Failed to create network',
                        };
                    }
                },
            }),
            createVolume: tool({
                description: 'Create a Docker volume',
                parameters: volumeCreateSchema,
                execute: async (params) => {
                    try {
                        await drinoDocker.post('/volumes/create', params).consume();
                        return { success: true, message: `Volume ${params.name} created` };
                    } catch (error: any) {
                        return {
                            success: false,
                            error: error.message || 'Failed to create volume',
                        };
                    }
                },
            }),
            pullImage: tool({
                description: 'Pull a Docker image from a registry',
                parameters: imagePullSchema,
                execute: async (params) => {
                    try {
                        await drinoDocker.post('/images/pull', params).consume();
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
            }),
        },
    });

    return result.toDataStreamResponse();
}
