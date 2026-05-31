import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';
import { getUserSession } from '@/services/auth/auth.service';

function unauthorized() {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function handle(request: Request): Promise<Response> {
    const session = await getUserSession(request.headers);
    if (!session) return unauthorized();

    const server = createNexployMCPServer(session.user.id);
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    await server.close();
    return response;
}

export async function POST(request: Request) {
    return handle(request);
}

export async function GET(request: Request) {
    return handle(request);
}

export async function DELETE(request: Request) {
    return handle(request);
}
