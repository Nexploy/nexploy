import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toolGroups } from './mcp';
import { ToolContext } from './mcp/types';

export function createNexployMCPServer(
    userId: string,
    role: string,
    requireConfirmation: boolean = false,
    allowExecInContainer: boolean = true,
    allowSwarmOperations: boolean = true,
): McpServer {
    const server = new McpServer({ name: 'nexploy-mcp', version: '1.0.0' });
    const ctx: ToolContext = { userId, role, requireConfirmation, allowExecInContainer, allowSwarmOperations };

    for (const group of toolGroups) {
        group.register(server, ctx);
    }

    return server;
}
