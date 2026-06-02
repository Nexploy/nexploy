import { Bot } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { MCPSection } from '@/components/admin/ai/MCPSection';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import type { McpApiKey } from '@workspace/typescript-interface/ai/mcpApiKey';

export const metadata: Metadata = {
    title: 'AI',
    description: 'Configure AI integrations and MCP server access',
};

export default async function AIPage() {
    const t = await getTranslations('ai.admin');

    const appUrl =
        process.env.BETTER_AUTH_URL ?? process.env.NEXPLOY_URL ?? 'http://localhost:3000';
    const mcpUrl = `${appUrl}/api/mcp`;

    const { apiKeys } = await auth.api.listApiKeys({ headers: await headers() });
    const keys: McpApiKey[] = (apiKeys ?? [])
        .filter((k) => (k.metadata as Record<string, unknown> | null)?.purpose === 'mcp')
        .map((k) => ({
            id: k.id,
            name: k.name,
            start: k.start,
            createdAt: k.createdAt,
            expiresAt: k.expiresAt,
        }));

    return (
        <div className="flex h-full flex-1 flex-col">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className="flex justify-between gap-2 px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Bot className="text-primary size-7" />
                        </div>
                        <div className="mt-3.5 flex flex-col">
                            <h1 className="text-3xl font-semibold tracking-tight break-all">
                                {t('title')}
                            </h1>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                        </div>
                    </div>
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-4 px-5 pb-5">
                        <MCPSection mcpUrl={mcpUrl} keys={keys} />
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
