import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createMistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { createPerplexity } from '@ai-sdk/perplexity';
import { createXai } from '@ai-sdk/xai';
import { convertToModelMessages, generateId, type LanguageModel, stepCountIs, streamText, type ToolSet, } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { NextResponse } from 'next/server';
import { authRouteServer, route } from '@/lib/api/nextRoute';
import { chatBodySchema } from '@workspace/schemas-zod/ai/chat.schema';
import type { Provider } from '@workspace/typescript-interface/ai/aiConfig';
import { getProviderApiKey } from '@/services/aiConfig.service';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';

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

async function buildModel(provider: Provider, model: string): Promise<LanguageModel> {
    const apiKey = await getProviderApiKey(provider);
    if (!apiKey) throw new Error(`No API key configured for provider: ${provider}`);

    switch (provider) {
        case 'OPENAI':
            return createOpenAI({ apiKey })(model);
        case 'ANTHROPIC':
            return createAnthropic({ apiKey })(model);
        case 'GOOGLE':
            return createGoogleGenerativeAI({ apiKey })(model);
        case 'OPENROUTER':
            return createOpenRouter({ apiKey })(model);
        case 'MISTRAL':
            return createMistral({ apiKey })(model);
        case 'GROQ':
            return createGroq({ apiKey })(model);
        case 'PERPLEXITY':
            return createPerplexity({ apiKey })(model);
        case 'GROK':
            return createXai({ apiKey })(model);
    }
}

export const POST = route
    .use(authRouteServer)
    .body(chatBodySchema)
    .handler(async (_req, { ctx, body }) => {
        const { messages, model, provider } = body;

        let languageModel: LanguageModel;
        try {
            languageModel = await buildModel(provider, model);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        try {
            const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
            const mcpServer = createNexployMCPServer(
                ctx.session.user.id,
                (ctx.session.user.role as string) ?? 'readWrite',
            );

            const [mcpClient] = await Promise.all([
                createMCPClient({ transport: clientTransport }),
                mcpServer.connect(serverTransport),
            ]);

            const tools = (await mcpClient.tools()) as ToolSet;

            const result = streamText({
                model: languageModel,
                messages: await convertToModelMessages(messages),
                system: SYSTEM_PROMPT,
                tools,
                stopWhen: stepCountIs(10),
                onFinish: async () => {
                    await mcpClient.close();
                    await mcpServer.close();
                },
                onError: async () => {
                    await mcpClient.close();
                    await mcpServer.close();
                },
            });

            return result.toUIMessageStreamResponse({
                originalMessages: messages,
                generateMessageId: generateId,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            return NextResponse.json({ error: message }, { status: 502 });
        }
    });
