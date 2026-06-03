import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolContext } from '@workspace/typescript-interface/ai/mcp';

export type { ToolContext };

export interface ToolGroup {
    name: string;
    register(server: McpServer, ctx: ToolContext): void;
}
