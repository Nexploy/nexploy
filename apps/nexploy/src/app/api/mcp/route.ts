import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';
import { internalApiAuth, route } from '@/lib/api/nextRoute';

const handler = route.use(internalApiAuth({ purpose: 'mcp' })).handler(async (request, { ctx }) => {
    const server = createNexployMCPServer(ctx.userId, ctx.role);
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
