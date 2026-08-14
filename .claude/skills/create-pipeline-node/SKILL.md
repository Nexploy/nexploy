---
name: create-pipeline-node
description: Creates a complete new pipeline node in the Nexploy node-based pipeline system — descriptor, executor, config panel, registry wiring and i18n. Trigger when the user asks to "create a new node", "add a node to the pipeline", or "add a [name] node".
---

# Create Pipeline Node

Nodes live in the **`nexploy-nodes` repository**, next to this one on disk
(`Monorepo-Mixte/nexploy/nodes/`). It is published to npm as `@nexploy/nodes`; Nexploy installs it
like any dependency. All paths below are relative to that repository.

To see a change in Nexploy before publishing:

```bash
cd nexploy && pnpm nodes:local    # builds, packs and installs the local checkout
```

`pnpm nodes:npm` restores the published version. Re-run `nodes:local` after each change, and never
commit the `file:` line it writes.

Every node is a single folder: `src/nodes/<node-type>/`.

```
src/nodes/my-action/
├── node.ts            ← descriptor: the single source of truth (isomorphic)
├── executor.ts        ← server-side logic
├── Config.tsx         ← client-side config panel
├── locales/
│   ├── en.json        ← name, description, own config labels
│   └── fr.json
└── lifecycle.ts       ← optional, only if the node needs setup/teardown hooks
```

A node never imports from the nexploy app. Everything it needs from the host arrives through
`ctx.services.*` (executors) or the `@nexploy/nodes/ui` adapter hooks (panels).

The descriptor drives the UI definition, the theme (icon/colour/category), the AI catalogue and the
drag-and-drop outputs panel. **Never restate any of that anywhere else** — it is all derived.

## Files to create or touch

| # | File | Why |
|---|------|-----|
| 1 | `src/core/schemas/nodeConfigs.schema.ts` | add the Zod config schema |
| 2 | `src/nodes/my-action/node.ts` | the descriptor |
| 3 | `src/nodes/my-action/executor.ts` | the executor |
| 4 | `src/nodes/my-action/Config.tsx` | the config panel |
| 5 | `src/nodes/my-action/locales/{en,fr}.json` | node name, description, own config labels |
| 6 | `src/nodes/registry/descriptors.ts` | 1 import + 1 array entry |
| 7 | `src/nodes/registry/server.ts` | 1 import + 1 array entry |
| 8 | `src/nodes/registry/client.ts` | 1 import + 1 map entry |
| 9 | `src/nodes/registry/messages.ts` | 2 imports + 2 array entries |
| 10 | `src/nodes/registry/locales/{en,fr}.json` | shared config labels + output labels |

`NodeId` is an open `string` and `nodeTypeSchema` is `z.string()` — there is **no union or enum to update**.
A node type is valid because a descriptor is registered for it; `savePipelineConfig` rejects graphs that
reference an unregistered type.

If the icon you want is not yet in the `NodeIconName` union, also add it to
`src/core/nodeDescriptor.ts` **and** to `ICON_NAME_MAP` in
`src/ui/theme.ts` — TypeScript enforces that both stay in sync.

---

## Step 0 — Gather information

- **`type`**: kebab-case identifier (e.g. `send-slack-message`)
- **`category`**: `source` | `build` | `deploy` | `script` | `database` | `flow` | `config` | `files` | `integration` | `utility`
- **`icon`**: a name from the `NodeIconName` union
- **`nodeType`**: `base-node` (default, omit) | `large-node` | `attach-node`
- **`isStartNode`**: only if the node can begin a pipeline
- **`consumesFromUpstream`**: keys it reads from upstream nodes (e.g. `workDir`, `imageName`)
- **`outputs`**: keys the executor actually returns — see the rule below
- **`config`**: user-configurable fields, and which should be **refable**

Infer sensible defaults if unspecified and state your assumptions.

---

## Step 1 — Zod config schema

`src/core/schemas/nodeConfigs.schema.ts`

```typescript
import { refable } from './nodeFieldRef.schema.ts';

export const myActionConfigSchema = z.object({
    targetPath: refable(z.string().min(1, 'Path is required')).default(''),
    timeout: z.number().default(60),
});
```

**Use `refable()`** when the field holds a runtime value a previous node might produce (image name,
volume name, URL, path, container name…) so it can accept a dropped node output.
**Do not** use it for structural config (timeouts, booleans, enum selectors, static resource IDs).

`refable(z.string())` infers `string | NodeFieldRef`. The orchestrator resolves refs before calling the
executor — see Step 5.

When a field stores an ID referencing an external resource, store a display name alongside it so the UI
can label stale state:

```typescript
containerId: z.string().min(1, 'Container is required').default(''),
containerName: z.string().default(''),
```

---

## Step 2 — The descriptor

`src/nodes/my-action/node.ts`

```typescript
import { NodeDescriptor } from '@workspace/typescript-interface/pipeline/nodeDescriptor';
import { myActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

export const myActionDescriptor: NodeDescriptor = {
    type: 'my-action',
    category: 'utility',
    icon: 'Wrench',
    description: 'One sentence the AI uses to pick this node. Mention the main pre-condition.',
    consumesFromUpstream: ['workDir'],
    configSchema: myActionConfigSchema,
    outputs: [{ key: 'resultPath' }],
    handles: {
        inputs: [{ id: 'input', position: 'left' }],
        outputs: [{ id: 'output', position: 'right' }],
        attachments: [],
    },
};
```

### Rules

- `icon` is a **string** from `NodeIconName`, never a component. Colour and category styling are derived —
  never set a `color`.
- `handles.position` is `'top' | 'right' | 'bottom' | 'left'`, not the xyflow `Position` enum.
- The i18n keys `${type}.name` and `${type}.description` are derived — do **not** declare them here.
- Omit `configSchema` entirely for nodes with no config.
- Omit `nodeType` for `base-node`.

### `outputs` — the one rule that matters

**`outputs` must exactly match the keys the executor returns in `return { output: { … } }`.**
It feeds both the AI catalogue and the drag-and-drop outputs panel. When these drifted apart in the past,
the AI generated pipelines wired to keys that never existed.

Mark control-flow keys (`error`, `failed`, `skipped`, `reason`, `continued`) as `internal: true` — they stay
out of the AI catalogue and the UI panel:

```typescript
outputs: [{ key: 'resultPath' }, { key: 'error', internal: true }],
```

Each non-internal key needs i18n (Step 8). Override the derived keys only when reusing existing wording:

```typescript
{ key: 'status', labelKey: 'pipeline.inputs.httpStatus', descriptionKey: 'pipeline.inputs.desc_httpStatus' }
```

`type` defaults to `'input'`; use `'number'` or `'array'` when appropriate.

---

## Step 3 — The executor

`src/nodes/my-action/executor.ts`

```typescript
import { getFromInputs, getFromAllOutputs } from '@/helpers/pipeline.helpers';
import {
    INodeExecutor,
    NodeExecutionContext,
    NodeExecutionResult,
} from '@workspace/typescript-interface/pipeline/pipeline';
import { myActionConfigSchema } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';
import { ResolveRefs } from '@workspace/schemas-zod/pipeline/nodeFieldRef.schema';
import { z } from 'zod';

export class MyActionExecutor implements INodeExecutor {
    readonly type = 'my-action';
    readonly configSchema = myActionConfigSchema;

    async execute(
        ctx: NodeExecutionContext<ResolveRefs<z.infer<typeof myActionConfigSchema>>>,
    ): Promise<NodeExecutionResult> {
        const { nodeId, nodeConfig, inputOutputs, allOutputs, logger, abortSignal } = ctx;

        const workDir =
            getFromInputs<string>(inputOutputs, 'workDir') ??
            getFromAllOutputs<string>(allOutputs, 'workDir');

        if (!workDir) {
            throw new Error('No workDir found — connect this node after a Clone Repository node');
        }

        const targetPath = nodeConfig.targetPath.trim();
        await logger.info(nodeId, `Starting my-action on ${targetPath}`);
        if (abortSignal.aborted) throw new Error('Build cancelled');

        return { output: { resultPath: targetPath } };
    }
}

export const myActionExecutor = new MyActionExecutor();
```

### Rules

- Use `ResolveRefs<z.infer<typeof schema>>` whenever the schema has at least one `refable()` field — refs are
  already resolved to strings at this point. **Never cast with `as string`.**
- The exported const **must** be named `<camelCaseType>Executor`.
- Never write comments (project-wide rule).

### Live progress and result summary — `ctx.reporter`

While a build runs, the pipeline canvas expands each node into a card showing a live activity
line, a progress bar and a result summary. That card is driven entirely by two reporter calls.
A node that makes neither still works — the bar falls back to an indeterminate shimmer and the
finished card shows only its duration — but instrument every node you add.

```typescript
import { createProgressTracker } from '@nexploy/nodes/core/nodeProgress';

const tracker = createProgressTracker(reporter, nodeId, 3);

await tracker.step('clone', { branch });        // 1/3 · "Cloning main"
await tracker.detail('receiving objects 62%');  // refines the line, does not advance
await tracker.step('checkout', { commit });     // 2/3
await tracker.done();                           // fills the bar

await reporter.reportSummary(nodeId, {
    key: 'cloned',
    values: { branch, commit },
    tone: 'positive',
});
```

`createProgressTracker(reporter, nodeId, total)` — `total` is the number of `step()` calls you
will make. Call `step()` **before** the work, so the label describes what is happening now.

When the real step count comes from the data, skip the tracker and call `reporter.reportProgress`
directly — a Docker build parsing `Step 3/12`, a poll loop with a computed attempt budget:

```typescript
await reporter.reportProgress(nodeId, {
    current: attempt,
    total: maxAttempts,
    labelKey: 'probe',
    labelValues: { url },
    detail: 'HTTP 502',
});
```

#### Summary tones

| tone | Use for |
|---|---|
| `positive` | Normal success |
| `warning` | Succeeded with a caveat — already existed, fell back, skipped a step |
| `negative` | Failure |
| `neutral` | Plain fact, no judgement (default) |

Emit a summary on **every** exit path, including the degraded ones — the "already exists" branch,
the fallback branch. A terminal node with no summary shows nothing but its duration.

Failures are the exception: the orchestrator emits a `negative` summary from the caught error
itself, so `throw` is enough.

#### Translating the strings

`labelKey` and `key` are translation keys, resolved client-side against the node's own locale
files under `nodes.<type>.steps.*` and `nodes.<type>.summary.*` — see Step 6. `values` are
interpolated with next-intl syntax (`{branch}`), so keep them scalar.

For runtime text that cannot be translated — an error message, a command's output — use `text`
instead of `key`; it is rendered verbatim and bypasses lookup. `values` must be `string | number`,
so wrap possibly-refable config fields in `String(...)`.

### Talking to docker-api — use `ctx.services.docker`

Executors must **not** import `@/lib/api/kyDocker`; that would couple them to Next.js request internals.
The host injects the client:

```typescript
const result = await ctx.services.docker
    .post(`images/${encodeURIComponent(sourceImage)}/tag`, {
        json: { repo, tag: targetTag },
        signal: abortSignal,
        environmentId,
    })
    .json<{ id: string }>();
```

`DockerRequestOptions` accepts `json`, `searchParams`, `headers`, `timeout`, `signal`, `throwHttpErrors`
and `environmentId` — no cast needed. Methods: `get`, `post`, `put`, `patch`, `delete`.

Resolve `environmentId` from the graph:

```typescript
const environmentId = getFromClosestAncestor<string>(allOutputs, edges, nodeId, 'environmentId');
```

If the executor needs a helper outside `execute()`, pass `ctx.services.docker` down as a parameter typed
`DockerApiClient` rather than reaching for a module-level import.

### Other services

| Service | Import path |
|---------|-------------|
| Git | `@/inngest/pipeline/services/git.service` |
| Docker (high-level build/deploy) | `@/inngest/pipeline/services/docker.service` |
| Database-backed services | `@/services/**` |

### Data-flow helpers — `@/helpers/pipeline.helpers`

`getFromInputs` (directly connected nodes) · `getFromAllOutputs` (any ancestor) ·
`getFromClosestAncestor` (nearest ancestor by graph distance) · `findClosestEnabledNodes`

---

## Step 4 — The config panel

`src/nodes/my-action/Config.tsx`

Panels are React form fragments driven by `useFormContext()` — **no props**. The export **must** be named
`<PascalCaseType>Config`. Field names must match schema keys exactly.

**Never add `className` to shadcn/ui components** (`Input`, `Select`, `Textarea`, `Checkbox`…) — they already
carry the right tokens for the panel context.

### No config — show an informational line

There is no generic "no config" string. Add a node-specific `<camelCaseType>Info` key under
`pipeline.config` (as `cleanWorkdirInfo` and `saveVersionInfo` do):

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyActionConfig() {
    const t = useTranslations('repository.pipeline.config');
    return <p className="text-muted-foreground text-xs">{t('myActionInfo')}</p>;
}
```

### Plain field

```tsx
<FormField
    control={form.control}
    name="timeout"
    render={({ field }) => (
        <FormItem>
            <FormLabel>{t('timeout')}</FormLabel>
            <FormControl>
                <Input {...field} type="number" />
            </FormControl>
            <FormMessage className="text-xs" />
        </FormItem>
    )}
/>
```

### Refable field — wrap in `<RefAware>`

```tsx
import { RefAware } from '@/components/pipeline/nodes/nodeConfigPanel/RefAware';

<FormControl>
    <RefAware value={field.value} onChange={field.onChange}>
        <Input {...field} placeholder="/app" />
    </RefAware>
</FormControl>
```

`RefAware` swaps the input for a ref badge when a node output is dropped on it, and restores it when cleared.
Props: `value`, `onChange`, optional `emptyValue` (default `''`), `children`.

### Live Docker resources

Resolve the environment with the hook — never re-implement the ancestor walk:

```typescript
import { usePipelineEnvironmentId } from '@/hooks/pipeline/usePipelineEnvironmentId.ts';

const environmentId = usePipelineEnvironmentId();
```

Then pick a hook:

```typescript
const { containers, isLoading } = useEnvironmentContainers(environmentId); // .id .name .image .state
const { images,     isLoading } = useEnvironmentImages(environmentId);     // .id .repoTags[]
const { volumes,    isLoading } = useEnvironmentVolumes(environmentId);    // .name
```

All three fall back to the global store when `environmentId` is undefined.

| Scenario | Widget | Refable |
|---|---|---|
| Accepts typed text **or** a node output (image tag, volume name, container name) | `InputAutoComplete` + `RefAware` | ✅ |
| Must match a known container by **ID** (start/stop/remove) | `Select` + `Status`/`StatusIndicator` + stale detection | ❌ |

`InputAutoComplete` (from `@workspace/ui/components/search-command`) suggests live values while still
allowing free text — preferred for refable resource fields. Props: `options` (`{value,label}[]`),
`isLoading`, `placeholder`, `heading`. No stale warning needed, since any value can be typed.

Build image options by flattening `repoTags`, filtering `<none>:<none>`, deduplicating with a `Set`.

For a non-refable Select bound to an ID, render a `Status` + `StatusIndicator` per item and detect stale
values (`!isLoading && field.value && !items.find(i => i.id === field.value)`), showing an amber warning.
Use `isNodeFieldRef(field.value)` from `@/lib/nodeFieldRef` to skip stale detection when a ref is bound.
`tag-image/Config.tsx` is a good reference implementation.

### REST resources

```typescript
import useSWR from 'swr';
import { fetcherApi } from '@/lib/api/fetcherApi';

const { data: accounts, isLoading } = useSWR<Account[]>('/api/accounts', fetcherApi);
```

---

## Step 5 — Register in the four registries

Each registry keeps its entries alphabetically sorted.

**`registry/descriptors.ts`**
```typescript
import { myActionDescriptor } from '../my-action/node';
// …then add `myActionDescriptor,` to ALL_NODE_DESCRIPTORS
```

**`registry/server.ts`**
```typescript
import { myActionExecutor } from '../my-action/executor';
// …then add `myActionExecutor,` to the executors array
```

**`registry/client.ts`**
```typescript
import { MyActionConfig } from '../my-action/Config';
// …then add `'my-action': MyActionConfig,` to configPanels
```

**`registry/messages.ts`**
```typescript
import myActionEn from '../my-action/locales/en.json';
import myActionFr from '../my-action/locales/fr.json';
// …then add `myActionEn,` to the en array and `myActionFr,` to the fr array
```

### Optional lifecycle hooks

For setup/teardown on add/remove (as `webhook-clone` does), create `my-action/lifecycle.ts` exporting a
`NodeLifecycleCallbacks`, then add it to the `lifecycles` map in `registry/client.ts`.

---

## Step 6 — i18n (mandatory, both locales)

Everything a node says lives in the node library. Nexploy's `repository.json` no longer holds
node strings.

### Node-owned strings — `my-action/locales/{en,fr}.json`

Keys are relative to `repository.pipeline`; `registry/messages.ts` merges them into that
namespace at request time. Put here the node name, its description, and every config label
that only this node uses:

```json
{
  "nodes": {
    "my-action": {
      "name": "My Action",
      "description": "Short description of what this node does",
      "steps": {
        "prepare": "Preparing {targetPath}",
        "apply": "Applying changes"
      },
      "summary": {
        "done": "{count} files · {targetPath}",
        "alreadyApplied": "Already applied"
      }
    }
  },
  "config": {
    "targetPath": "Target path",
    "targetPathPlaceholder": "/app"
  }
}
```

`name` and `description` are required in **both** locales.

`steps` and `summary` back the `labelKey` and `key` passed to `ctx.reporter` (Step 3). Every key
the executor can emit needs an entry in **every** locale — a missing key falls back to the raw
key string, which is what the user then reads on the canvas. Keep them short: they render on one
truncated line inside a 280px card. Put the identifying value first (`{branch} · {commit}`, not
`Cloned repository on branch {branch}`).

### Shared vocabulary — `registry/locales/{en,fr}.json`

Labels used by more than one node, and every output-field label. Add here only when the wording
is genuinely shared:

```json
{
  "config": { "containerName": "Container name" },
  "inputs": {
    "resultPath": "Result path",
    "desc_resultPath": "Path produced by the action"
  }
}
```

Every non-internal output key needs a label **and** a `desc_` entry under `inputs`. Reuse an
existing key when the semantics match rather than adding a near-duplicate — that is what this
file is for.

---

## Verify

```bash
pnpm typecheck                   # in nexploy-nodes
pnpm build                       # vendor + tsc, must be clean
pnpm format
```

Then, from the `nexploy` repository, after `pnpm nodes:local`:

```bash
pnpm types
```

`pnpm lint` is a no-op — the Biome linter is disabled repo-wide; only the formatter runs.

## Checklist

- [ ] Config schema added; `refable()` on fields that accept dropped node outputs
- [ ] Display-name field stored alongside any external-resource ID
- [ ] Descriptor created: string `icon`, string handle positions, no `color`, no `name`/`description` i18n keys
- [ ] Icon present in both `NodeIconName` and `ICON_NAME_MAP` if new
- [ ] `outputs` match the executor's `return { output: … }` exactly; control keys marked `internal: true`
- [ ] Executor exported as `<camelCase>Executor`; uses `ResolveRefs<>` if the schema has refable fields
- [ ] Executor talks to the host only through `ctx.services.*` — zero `@/` imports
- [ ] Progress reported via `createProgressTracker` or `reporter.reportProgress`
- [ ] `reporter.reportSummary` on every non-throwing exit path, tone matching the outcome
- [ ] Every `labelKey` / summary `key` present under `nodes.<type>.steps` / `.summary` in **all** locales
- [ ] Config panel exported as `<PascalCase>Config`; uses `useFormContext()`; no props
- [ ] No `className` on shadcn/ui components
- [ ] Refable fields wrapped in `<RefAware>`; resource fields use `InputAutoComplete`
- [ ] `usePipelineEnvironmentId()` used — no hand-rolled `findAncestor`
- [ ] Registered in `descriptors.ts`, `server.ts`, `client.ts` and `messages.ts`
- [ ] `locales/{en,fr}.json` created in the node folder with `nodes.<type>.name` + `.description`
- [ ] Both locale files imported and listed in `registry/messages.ts`
- [ ] Own config labels in the node's `locales/{en,fr}.json`; shared ones in `registry/locales/{en,fr}.json`
- [ ] Output label + `desc_` per non-internal key under `inputs`, in **both** locales
- [ ] No comments written anywhere in the code
- [ ] `pnpm types` clean
