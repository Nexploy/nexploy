---
name: create-mcp-tool-group
description: Creates a complete new MCP tool group in the Nexploy AI assistant — from the group file and Zod schemas to registration in the index. Trigger when the user asks to "add an MCP tool", "add a tool group", or "expose X to the AI assistant".
---

# Create MCP Tool Group

This skill creates every file and registration needed to add a new group of tools to the Nexploy MCP server.

## Architecture overview

```
apps/nexploy/src/lib/ai/
├── nexploy-mcp-server.ts   ← slim wiring (do not modify unless adding a new mechanism)
└── mcp/
    ├── types.ts            ← ToolContext, ToolGroup interfaces
    ├── helpers.ts          ← ok() / fail() response helpers
    ├── index.ts            ← toolGroups array (register your group here)
    └── groups/
        ├── containers.group.ts
        ├── images.group.ts
        ├── volumes.group.ts
        ├── networks.group.ts
        └── repositories.group.ts  ← add your new file here
```

Each tool group is an object implementing `ToolGroup`:

```typescript
export interface ToolGroup {
    name: string;
    register(server: McpServer, ctx: ToolContext): void;
}
```

`ToolContext` currently carries `userId: string`. If a tool needs more context (e.g., a tenant ID), add it to `types.ts` and thread it through `nexploy-mcp-server.ts`.

---

## Step 0 — Gather information

Before writing any code, determine:

- **`name`**: kebab-case group identifier (e.g. `ssl-certificates`)
- **Tools**: list each tool with its name, description, and expected input/output
- **Input schemas**: do the tools already have Zod schemas in `@workspace/schemas-zod`? If not, create them
- **Auth**: does the tool need `ctx.userId`? (repository actions do; pure Docker reads don't)
- **Backend**: does the tool call `kyDocker` (docker-api), a service function, or a Next.js API route?

If the user hasn't specified these, infer sensible defaults and state your assumptions.

---

## Step 1 — Create or locate Zod input schemas

All tool inputs must be validated with Zod. Check `packages/schemas-zod/src/` first.

If a schema doesn't exist, create it in the appropriate location:

```typescript
// packages/schemas-zod/src/domain/myAction.schema.ts
import { z } from 'zod';

export const myToolInputSchema = z.object({
    name: z.string().min(1),
    option: z.enum(['a', 'b']).optional(),
});
```

Tools with **no inputs** omit `inputSchema` entirely from `registerTool`.

---

## Step 2 — Create the group file

File: `apps/nexploy/src/lib/ai/mcp/groups/my-feature.group.ts`

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { myToolInputSchema } from '@workspace/schemas-zod/domain/myAction.schema';
import { kyDocker } from '@/lib/api/kyDocker';          // docker-api calls
// import { myService } from '@/services/my.service';   // or a Next.js service
import { ok, fail } from '../helpers';
import { ToolContext, ToolGroup } from '../types';

export const myFeatureGroup: ToolGroup = {
    name: 'my-feature',

    register(server: McpServer, ctx: ToolContext) {
        server.registerTool(
            'myToolName',
            {
                description: 'One-sentence description of what this tool does.',
                inputSchema: myToolInputSchema.shape,   // omit if no inputs
            },
            async (params) => {
                try {
                    const result = await kyDocker.get('my-endpoint').json<any>();
                    return ok(JSON.stringify(result));
                } catch (e: any) {
                    return fail(e.message);
                }
            },
        );

        // Register additional tools below…
    },
};
```

### Rules for tool handlers

- **Always** wrap the entire handler in `try/catch` and return `fail(e.message)` on error
- Return `ok(text)` on success — `text` can be plain text or `JSON.stringify(data)`
- Use `ctx.userId` only when the tool needs to act on behalf of the user (e.g., triggering a build)
- Keep handlers thin: call a service or `kyDocker`, format the result, return it

### Backend call patterns

| Scenario | Pattern |
|---|---|
| Read Docker resource | `kyDocker.get('resource').json<T[]>()` |
| Mutate Docker resource | `kyDocker.post/delete('resource/action', { json: params })` |
| Nexploy data (Prisma) | `await myService()` — service lives in `apps/nexploy/src/services/` |
| Trigger background job | `inngest.send({ name: 'event/name', data: { ... } })` |

---

## Step 3 — Register the group

File: `apps/nexploy/src/lib/ai/mcp/index.ts`

Add the import and push the group into the array under the right category comment:

```typescript
import { myFeatureGroup } from './groups/my-feature.group';

export const toolGroups: ToolGroup[] = [
    // Docker
    containersGroup,
    imagesGroup,
    volumesGroup,
    networksGroup,
    // Nexploy
    repositoriesGroup,
    myFeatureGroup,   // ← add here, under the right category comment
];
```

---

## Step 4 — Verify types compile

Run:

```bash
pnpm --filter=nexploy check-types
```

Fix any type errors before finishing.

---

## Checklist

- [ ] Input schemas exist in `@workspace/schemas-zod` (created or located)
- [ ] Group file created at `apps/nexploy/src/lib/ai/mcp/groups/my-feature.group.ts`
- [ ] Group implements `ToolGroup` from `../types`
- [ ] Every handler is wrapped in `try/catch` → `ok()` / `fail()`
- [ ] Tools with no inputs omit `inputSchema`
- [ ] `ctx.userId` used only where the action is user-scoped
- [ ] Group registered in `apps/nexploy/src/lib/ai/mcp/index.ts`
- [ ] `pnpm --filter=nexploy check-types` passes
