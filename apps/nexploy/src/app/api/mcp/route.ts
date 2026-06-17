import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createNexployMCPServer } from '@/lib/ai/nexploy-mcp-server';
import { getAISettings } from '@/services/aiSettings.service';
import { auth } from '@/lib/auth/auth';
import { prisma } from '../../../../prisma/prisma';
import { getDefaultEnvironment } from '@/services/environment/environment.service';

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

declare global {
    var mcpSessions: Map<string, McpSession> | undefined;
}

const mcpSessions: Map<string, McpSession> = globalThis.mcpSessions ?? new Map();
globalThis.mcpSessions = mcpSessions;

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
        if (existing) return existing.transport.handleRequest(request);
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

    const [user, defaultEnv] = await Promise.all([
        prisma.user.findUnique({
            where: { id: mcpAuthSession.userId },
            select: { role: true },
        }),
        getDefaultEnvironment(),
    ]);
    const role = user?.role ?? 'read';

    const server = createNexployMCPServer(mcpAuthSession.userId, role, aiSettings, defaultEnv?.id);

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
            mcpSessions.set(id, { server, transport, createdAt: Date.now() });
        },
        onsessionclosed: (id) => {
            const session = mcpSessions.get(id);
            if (session) {
                session.server.close();
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
