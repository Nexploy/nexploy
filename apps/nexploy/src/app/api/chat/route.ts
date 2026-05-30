import { createOpenAI } from '@ai-sdk/openai';
import { type LanguageModel, stepCountIs, streamText, type ToolSet } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { authRouteServer, requirePermission, route } from '@/lib/api/nextRoute';
import { chatBodySchema } from '@workspace/schemas-zod/ai/chat.schema';
import { INTERNAL_API_KEY } from '@/lib/ai/internal-api-key';
import { getProviderApiKey } from '@/services/aiConfig.service';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a DevOps assistant integrated into Nexploy, a self-hosted Docker deployment platform.
Your role is to help users manage their Docker infrastructure and Nexploy repository deployments through natural conversation.

## How to use your tools
- Always call the appropriate tool to fetch live data — never guess or invent resource names, IDs, or statuses.
- When a user refers to a container or repository by name, call listContainers or listRepositories first to resolve the exact ID before acting.
- For destructive operations (remove, stop), confirm the target with the user if it wasn't explicitly named.
- Chain tools when needed: list first, then act.

## Response style
- Be concise. Use markdown: **bold**, \`inline code\`, fenced code blocks, and bullet lists.
- Present lists of resources as markdown tables (Name | Status | Image).
- Wrap logs and command output in fenced code blocks with the appropriate language tag.
- After completing an action, briefly suggest a relevant next step.

## Security
- Never display or repeat environment variable values, secrets, or credentials from tool results.
- Treat \`execInContainer\` as a privileged operation — only run it when the user explicitly asks to execute a command.
`;

async function buildModel(provider?: string, modelId?: string): Promise<LanguageModel> {
    if (provider && modelId) {
        switch (provider) {
            case 'openai': {
                const apiKey = (await getProviderApiKey('OPENAI')) ?? process.env.OPENAI_API_KEY;
                return createOpenAI({ apiKey })(modelId);
            }
            case 'anthropic': {
                const apiKey = (await getProviderApiKey('ANTHROPIC')) ?? process.env.ANTHROPIC_API_KEY;
                if (apiKey) {
                    const { createAnthropic } = await import('@ai-sdk/anthropic');
                    return createAnthropic({ apiKey })(modelId);
                }
                break;
            }
            case 'google': {
                const apiKey = (await getProviderApiKey('GOOGLE')) ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
                if (apiKey) {
                    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
                    return createGoogleGenerativeAI({ apiKey })(modelId);
                }
                break;
            }
            case 'openrouter': {
                const apiKey = (await getProviderApiKey('OPENROUTER')) ?? process.env.OPENROUTER_API_KEY;
                if (apiKey) {
                    const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
                    return createOpenRouter({ apiKey })(modelId);
                }
                break;
            }
        }
    }

    // Fallback: first available key
    const anthropicKey = await getProviderApiKey('ANTHROPIC');
    if (anthropicKey) {
        const { createAnthropic } = await import('@ai-sdk/anthropic');
        return createAnthropic({ apiKey: anthropicKey })('claude-sonnet-4-6');
    }
    const googleKey = await getProviderApiKey('GOOGLE');
    if (googleKey) {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        return createGoogleGenerativeAI({ apiKey: googleKey })('gemini-2.5-flash');
    }
    const openrouterKey = await getProviderApiKey('OPENROUTER');
    if (openrouterKey) {
        const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
        return createOpenRouter({ apiKey: openrouterKey })('openai/gpt-4o');
    }

    const apiKey = (await getProviderApiKey('OPENAI')) ?? process.env.OPENAI_API_KEY;
    return createOpenAI({ apiKey })('gpt-4o');
}

export const POST = route
    .use(authRouteServer)
    .use(requirePermission('docker', 'manage'))
    .body(chatBodySchema)
    .handler(async (_, { ctx, body }) => {
        const { messages, modelId, provider } = body;

        const appUrl =
            process.env.BETTER_AUTH_URL ?? process.env.NEXPLOY_URL ?? 'http://localhost:3000';
        const mcpUrl = `${appUrl}/api/mcp`;

        const [model, mcpClient] = await Promise.all([
            buildModel(provider, modelId),
            createMCPClient({
                transport: {
                    type: 'http',
                    url: mcpUrl,
                    headers: {
                        'x-api-key': INTERNAL_API_KEY,
                        'x-user-id': ctx.session.user.id,
                    },
                },
            }),
        ]);

        const tools = (await mcpClient.tools()) as ToolSet;

        const result = streamText({
            model,
            messages,
            system: SYSTEM_PROMPT,
            tools,
            stopWhen: stepCountIs(10),
            onFinish: async () => { await mcpClient.close(); },
            onError: async () => { await mcpClient.close(); },
        });

        return result.toTextStreamResponse();
    });
