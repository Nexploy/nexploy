import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';
import { internalApiAuth, route } from '@/lib/api/nextRoute';
import { getAISettings } from '@/services/aiSettings.service';
import { NextResponse } from 'next/server';

const handler = route.use(internalApiAuth({ purpose: 'mcp' })).handler(async (request, { ctx }) => {
    const aiSettings = await getAISettings();
    if (!aiSettings?.mcpEnabled) {
        return NextResponse.json(
            { error: 'MCP server is disabled by the administrator.' },
            { status: 403 },
        );
    }

    const server = createNexployMCPServer(ctx.userId, ctx.role, aiSettings);
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    await server.close();
    return response;
});

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
