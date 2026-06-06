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
import { getAISettings } from '@/services/aiSettings.service';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a DevOps assistant integrated into Nexploy, a self-hosted Docker deployment platform.
Your ONLY purpose is to help users manage their Docker infrastructure and Nexploy repository deployments.

## Language
Always respond in the same language the user wrote in. Apply this to every message including refusals and confirmations.

## Strict scope
You assist exclusively with topics directly related to Nexploy and the infrastructure it manages.
If a request has no connection to the user's Docker infrastructure, deployments, or Nexploy platform, refuse it in the user's language by explaining you are a Nexploy DevOps assistant and can only help with their infrastructure.

Do not partially answer off-topic requests. Redirect immediately without over-apologizing.

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

## Pipeline generation
When a user asks you to generate, create, or set up a pipeline for a repository:
1. Call \`listRepositories\` to find the repository ID if not already known.
2. Call \`listPipelineNodes\` to get the full catalog of available node types (category, description, config fields, I/O).
3. Call \`analyzeRepository\` with the repository ID to read its file structure and key config files (Dockerfile, package.json, docker-compose.yml, etc.).
4. Based on the analysis AND the available node types from the catalog, design a complete pipeline:
   - Always start with a \`clone-repository\` node (id: "clone-1", isStartNode: true).
   - Choose nodes that match what was detected in the repo (see **Deployment patterns** below).
   - If the user asked for specific features (health checks, notifications, registry push…), include the matching nodes.
   - Use \`getPipelineNodeDetail\` to get the exact config field names for any node you are unsure about.
   - Position nodes left-to-right: x starts at 100, increments by 300 per step. y=300 as baseline.
5. Call \`savePipeline\` with the repository ID, nodes array, and edges array.
6. Confirm to the user that the pipeline was saved and offer to trigger a first build.

### Deployment patterns (pick exactly one)
- **docker-compose.yml detected** → \`clone-repository → [env-vars] → deploy-compose → clean-workdir\`. Do NOT add \`build-docker-image\` — compose builds images internally.
- **Dockerfile only (no compose)** → \`clone-repository → [env-vars] → build-docker-image → create-container → clean-workdir\`.
- **Pre-built image** → \`pull-from-registry → create-container → start-container\`.

### End-node rule
Always place \`clean-workdir\` as the **last node** of any pipeline that started with \`clone-repository\` or \`webhook-clone\`. It deletes the temporary working directory and must receive the workDir (directly or from an ancestor). The only exception is if the user explicitly says they do not want it.

### Edge connection rules (CRITICAL)
Every edge must have **sourceHandle** and **targetHandle**. There are two types:

**Regular edges** (left→right flow between normal nodes):
\`\`\`json
{ "source": "nodeA-id", "sourceHandle": "output", "target": "nodeB-id", "targetHandle": "input" }
\`\`\`

**Attachment edges** (special attach-nodes that hang below their parent):
The \`save-version\` node is an **attach-node** — it attaches to the **bottom** of \`deploy-compose\` or \`create-container\`, not to the right output. Use:
\`\`\`json
{ "source": "deploy-1", "sourceHandle": "save-version", "target": "save-version-1", "targetHandle": "input" }
\`\`\`
Position the save-version node below its parent: same x ± 50, y = parent.y + 260.

### Node ID rules
Node IDs must be unique strings (e.g. "clone-1", "build-1", "deploy-1"). The \`data.type\` field must match the node's \`type\` field exactly.

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
            const aiSettings = await getAISettings();

            if (!aiSettings?.aiEnabled) {
                return NextResponse.json(
                    { error: 'AI assistant is disabled by the administrator.' },
                    { status: 403 },
                );
            }

            const requireConfirmation = aiSettings?.requireDestructiveConfirmation ?? false;
            const maxSteps = aiSettings?.maxSteps ?? 10;

            const confirmationInstruction = requireConfirmation
                ? `\n\n## Destructive action confirmation\nBefore executing any operation that removes, deletes, stops, or destroys resources, you MUST call the \`requestConfirmation\` tool first. Then clearly describe what you are about to do and ask the user to confirm or cancel — in their language. Accept any affirmative word (yes, oui, ja, sí, да, …) as confirmation and any negative word (no, non, nein, нет, …) as cancellation. Do NOT proceed until the user explicitly responds.`
                : '';

            const systemPrompt = aiSettings?.customSystemPrompt
                ? `${SYSTEM_PROMPT}\n\n## Additional instructions from administrator\n${aiSettings.customSystemPrompt}`
                : SYSTEM_PROMPT;

            const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
            const mcpServer = createNexployMCPServer(
                ctx.session.user.id,
                ctx.session.user.role ?? 'read',
                aiSettings,
            );

            const [mcpClient] = await Promise.all([
                createMCPClient({ transport: clientTransport }),
                mcpServer.connect(serverTransport),
            ]);

            const tools = (await mcpClient.tools()) as ToolSet;

            const result = streamText({
                model: languageModel,
                messages: await convertToModelMessages(messages),
                system: systemPrompt + confirmationInstruction,
                tools,
                stopWhen: stepCountIs(maxSteps),
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
