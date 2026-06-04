import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ok } from '../helpers';
import type { ToolContext, ToolGroup } from '../types';

export const confirmGroup: ToolGroup = {
    name: 'confirm',

    register(server: McpServer, ctx: ToolContext) {
        if (!ctx.requireDestructiveConfirmation) return;

        server.registerTool(
            'requestConfirmation',
            {
                description:
                    'Signal that a destructive action requires user confirmation before it can proceed. MUST be called before any delete, remove, stop, or prune operation. After calling this tool, present the action to the user and STOP — do not execute the destructive operation until the user explicitly confirms.',
                inputSchema: z.object({
                    action: z
                        .string()
                        .describe(
                            'Clear description of the destructive action you are about to perform',
                        ),
                    target: z
                        .string()
                        .describe('The resource name, ID, or identifier that will be affected'),
                }).shape,
            },
            async ({ action, target }) => {
                return ok(JSON.stringify({ __needsConfirmation: true, action, target }));
            },
        );
    },
};
