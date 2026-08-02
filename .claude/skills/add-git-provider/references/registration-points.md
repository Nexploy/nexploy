# Registration points checklist

Placeholders: `PROVIDER` = `BITBUCKET`, `Provider` = `Bitbucket`, `provider` = `bitbucket`.

Tick every row. Rows marked **typed** are caught by `pnpm types` once the Prisma client is
regenerated; the rest are silent if forgotten.

| # | File | Change | typed |
| --- | --- | --- | --- |
| 1 | `apps/nexploy/prisma/models/oauthGit.prisma` | `GitProviderType` enum member | — |
| 2 | `apps/nexploy/src/services/git/providers/<provider>/<provider>.client.ts` | new file | — |
| 3 | `apps/nexploy/src/services/git/providers/<provider>/<provider>.adapter.ts` | new file | ✅ |
| 4 | `apps/nexploy/src/services/git/core/registry.ts` | `gitAdapters` entry | ✅ |
| 5 | `apps/nexploy/src/services/git/gitAccounts.service.ts` | `DEFAULT_BASE_URL` entry | ✅ |
| 6 | `apps/nexploy/src/services/git/gitProviders.service.ts` | `save<Provider>Provider()` | — |
| 7 | `apps/nexploy/src/app/api/webhooks/<provider>/route.ts` | new file | — |
| 8 | `packages/schemas-zod/src/git/<provider>Setup.schema.ts` | new file | — |
| 9 | `packages/schemas-zod/src/git/git.schema.ts` | widen 2 × `z.enum` | — |
| 10 | `packages/schemas-zod/src/repository/repositoryCreate.schema.ts` | widen `gitProvider` enum | — |
| 11 | `packages/typescript-interface/src/git/git.ts` | widen `provider` union | — |
| 12 | `packages/typescript-interface/src/repository/build.ts` | widen `gitProvider` union | — |
| 13 | `apps/nexploy/src/actions/git/save<Provider>Provider.action.ts` | new file | — |
| 14 | `apps/nexploy/src/components/git/providerIcons.tsx` | `PROVIDER_ICONS` entry | ✅ |
| 15 | `apps/nexploy/src/components/admin/integrations/<Provider>AppSetupForm.tsx` | new file | — |
| 16 | `apps/nexploy/src/components/admin/integrations/IntegrationsAddButtons.tsx` | prop union + case + `ADD_LABELS` | — |
| 17 | `apps/nexploy/src/components/admin/integrations/GitProviderAccordionItem.tsx` | `value` prop union | — |
| 18 | `apps/nexploy/src/components/admin/integrations/GitProvidersSection.tsx` | accordion item + `defaultValue` | — |
| 19 | `apps/nexploy/src/components/repositories/RepositoriesGrid.tsx` | icon import + `SelectItem` | — |
| 20 | `apps/nexploy/src/lib/ai/mcp/groups/pipeline.group.ts` | file-analysis branch + `fetch<Provider>Files` | — |
| 21 | `packages/i18n/locales/{en,fr}/integrations.json` | title, description, add label, guide steps | — |
| 22 | `packages/i18n/locales/{en,fr}/repository.json` | `providers.<provider>` | — |
| 23 | `packages/i18n/locales/{en,fr}/errors.json` | `oauthProvider.save<Provider>Failed` | — |
| 24 | `packages/i18n/locales/{en,fr}/common.json` | onboarding tour provider list | — |

## Already generic — do not modify

These consume the adapter and need no per-provider change:

- `apps/nexploy/src/app/api/git/oauth/connect/route.ts` and `callback/route.ts` — the whole OAuth
  flow is driven by `getGitAdapter(gitProvider.provider)` and `isSupportedGitProvider`.
- `apps/nexploy/src/services/git/core/token.service.ts` — token storage, expiry, refresh.
- `apps/nexploy/src/services/webhook/repoWebhook.service.ts` — webhook create/delete via
  `adapter.webhookPath`.
- `apps/nexploy/src/inngest/pipeline/services/git.service.ts` — clone URL via
  `adapter.cloneCredentialUsername`.
- `apps/nexploy/src/inngest/pipeline/nodes/executors/{create-release,update-commit-status}.executor.ts`
- `apps/nexploy/src/services/repository.service.ts`, `services/repository/build.service.ts`
- `components/git/{GitAccountFormField,IntegrationCard}.tsx`,
  `components/account/AccountIntegrations.tsx`,
  `components/repositories/steps/GitSourceStep.tsx`, all pipeline node config panels.

## Snippets

### Registry (step 4)

```typescript
import { bitbucketAdapter } from '@/services/git/providers/bitbucket/bitbucket.adapter';

const gitAdapters: Record<GitProviderType, GitProviderAdapter> = {
    GITHUB: githubAdapter,
    GITLAB: gitlabAdapter,
    GITEA: giteaAdapter,
    BITBUCKET: bitbucketAdapter,
};
```

### Setup schema (step 8)

```typescript
import { z } from 'zod';

export const bitbucketSetupSchema = z.object({
    provider: z.literal('bitbucket'),
    displayName: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    baseUrl: z.url(),
});
```

Drop `baseUrl` to `z.url().optional()` for SaaS-only forges, and default it in
`save<Provider>Provider`.

### Server action (step 13)

```typescript
'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { saveBitbucketProvider } from '@/services/git/gitProviders.service';
import { revalidatePath } from 'next/cache';
import { bitbucketSetupSchema } from '@workspace/schemas-zod/git/bitbucketSetup.schema';
import { setToastServer } from '@/lib/toastServer.ts';

export const saveBitbucketProviderAction = authActionServer
    .use(requirePermission('gitProvider', 'create'))
    .inputSchema(bitbucketSetupSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { displayName, clientId, clientSecret, baseUrl } = parsedInput;
            await saveBitbucketProvider(displayName, clientId, clientSecret, baseUrl);
            revalidatePath('/admin/integrations');
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
```

### Persistence (step 6)

```typescript
export async function saveBitbucketProvider(
    displayName: string,
    clientId: string,
    clientSecret: string,
    baseUrl: string,
): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.gitProvider.create({
            data: {
                provider: 'BITBUCKET',
                displayName,
                clientId: encrypt(clientId),
                clientSecret: encrypt(clientSecret),
                baseUrl,
            },
        });
    } catch (error: unknown) {
        throw new Error(t('oauthProvider.saveBitbucketFailed'));
    }
}
```

### Webhook route (step 7)

Copy `apps/nexploy/src/app/api/webhooks/gitea/route.ts` and change two lines: the event header
(`request.headers.get('x-event-key')` for Bitbucket) and `getGitAdapter('BITBUCKET')`. Keep the rest
identical — the order matters: read `request.text()` first, parse the payload with the adapter,
resolve the repository, **then** verify the signature, then check `repo.userId`, then
`startBuildRepository(..., 'webhook')`.

### i18n keys (steps 21–24)

`integrations.json`:

```json
"bitbucket": {
    "title": "Bitbucket",
    "description": "Connect your Bitbucket workspace to deploy repositories"
},
"oauth": {
    "addBitbucket": "Add Bitbucket",
    "guide": {
        "bitbucket": {
            "step1": "…",
            "step2": "Set the callback URL to {url}/api/git/oauth/callback",
            "step3": "…",
            "baseUrlLabel": "Bitbucket Instance URL",
            "baseUrlPlaceholder": "https://bitbucket.mycompany.com",
            "createApp": "Create Bitbucket App"
        }
    }
}
```

`repository.json` → `providers.bitbucket`; `errors.json` →
`oauthProvider.saveBitbucketFailed`. Mirror every key into `fr/`.
