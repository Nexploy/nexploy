import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toolGroups } from './mcp';
import { ToolContext } from './mcp/types';
import { McpServerOptions } from '@workspace/typescript-interface/ai/mcp';

export function createNexployMCPServer(
    userId: string,
    role: string,
    options: McpServerOptions = {},
    defaultEnvironmentId?: string,
): McpServer {
    const server = new McpServer({ name: 'nexploy-mcp', version: '1.0.0' });
    const ctx: ToolContext = {
        userId,
        role,
        environmentId: defaultEnvironmentId,
        ...options,
        confirmedTargets: new Set<string>(),
    };

    for (const group of toolGroups) {
        group.register(server, ctx);
    }

    return server;
}
