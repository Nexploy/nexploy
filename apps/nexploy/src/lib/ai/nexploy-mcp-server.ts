import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toolGroups } from './mcp';
import { ToolContext } from './mcp/types';

interface McpServerOptions {
    requireConfirmation?: boolean;
    allowExecInContainer?: boolean;
    allowSwarmOperations?: boolean;
    allowImagesGroup?: boolean;
    allowVolumesGroup?: boolean;
    allowNetworksGroup?: boolean;
    allowComposeGroup?: boolean;
    allowRepositoriesGroup?: boolean;
    allowRegistriesGroup?: boolean;
    allowSslGroup?: boolean;
    allowEnvironmentsGroup?: boolean;
}

export function createNexployMCPServer(
    userId: string,
    role: string,
    options: McpServerOptions = {},
): McpServer {
    const server = new McpServer({ name: 'nexploy-mcp', version: '1.0.0' });
    const ctx: ToolContext = { userId, role, ...options };

    for (const group of toolGroups) {
        group.register(server, ctx);
    }

    return server;
}
