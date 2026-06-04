import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';
import { getAISettings } from '@/services/aiSettings.service';
import { auth } from '@/lib/auth/auth';
import { prisma } from '../../../../prisma/prisma';

interface McpSession {
    server: McpServer;
    transport: WebStandardStreamableHTTPServerTransport;
    createdAt: number;
}

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;

const WWW_AUTH_CHALLENGE = [
    `Bearer realm="${BETTER_AUTH_URL}/api/auth"`,
    `resource_metadata="${BETTER_AUTH_URL}/.well-known/oauth-protected-resource"`,
].join(', ');

const mcpSessions = new Map<string, McpSession>();

setInterval(
    () => {
        const cutoff = Date.now() - 30 * 60 * 1000;
        for (const [id, session] of mcpSessions) {
            if (session.createdAt < cutoff) {
                session.server.close();
                mcpSessions.delete(id);
            }
        }
    },
    5 * 60 * 1000,
);

async function mcpRouteHandler(request: Request): Promise<Response> {
    const mcpAuthSession = await auth.api.getMcpSession({ headers: request.headers });

    if (!mcpAuthSession) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
                'WWW-Authenticate': WWW_AUTH_CHALLENGE,
                'Content-Type': 'application/json',
            },
        });
    }

    const sessionId = request.headers.get('mcp-session-id');

    if (sessionId) {
        const existing = mcpSessions.get(sessionId);
        if (existing) {
            return existing.transport.handleRequest(request);
        }
        return new Response(JSON.stringify({ error: 'Session not found, please reinitialize' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const aiSettings = await getAISettings();
    if (!aiSettings?.mcpEnabled) {
        return new Response(
            JSON.stringify({ error: 'MCP server is disabled by the administrator.' }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: mcpAuthSession.userId },
        select: { role: true },
    });
    const role = user?.role ?? 'read';

    const server = createNexployMCPServer(mcpAuthSession.userId, role, aiSettings);

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
            mcpSessions.set(id, { server, transport, createdAt: Date.now() });
        },
        onsessionclosed: (id) => {
            const s = mcpSessions.get(id);
            if (s) {
                s.server.close();
                mcpSessions.delete(id);
            }
        },
    });

    await server.connect(transport);
    return transport.handleRequest(request);
}

export const GET = mcpRouteHandler;
export const POST = mcpRouteHandler;
export const DELETE = mcpRouteHandler;
