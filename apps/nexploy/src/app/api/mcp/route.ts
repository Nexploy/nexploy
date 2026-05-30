import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';
import { INTERNAL_API_KEY } from '@/lib/ai/internal-api-key';
import { getUserSession } from '@/services/auth/auth.service';

function unauthorized() {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}

async function processRequest(request: Request, userId: string): Promise<Response> {
    const server = createNexployMCPServer(userId);
    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    await server.close();
    return response;
}

async function handle(request: Request): Promise<Response> {
    // Better Auth session (cookie) or Better Auth API key (enableSessionForAPIKeys: true)
    const session = await getUserSession(request.headers);
    if (session) {
        return processRequest(request, session.user.id);
    }

    // Internal server-to-server fallback (chat route → MCP)
    if (request.headers.get('x-api-key') === INTERNAL_API_KEY) {
        const userId = request.headers.get('x-user-id') ?? '';
        return processRequest(request, userId);
    }

    return unauthorized();
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
