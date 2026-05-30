'use client';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteMcpApiKeyAction } from '@/actions/admin/ai/deleteMcpApiKey.action.ts';
import { MCPKeyCard } from '@/components/admin/ai/MCPKeyCard.tsx';
import type { McpApiKey } from '@workspace/typescript-interface/ai/mcpApiKey';

interface MCPSectionProps {
    mcpUrl: string;
    keys: McpApiKey[];
}

export function MCPSection({ mcpUrl, keys }: MCPSectionProps) {
    const t = useTranslations('ai.admin.mcp');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { executeAsync: deleteKey } = useAction(deleteMcpApiKeyAction, {
        onError: () => toast.error(t('keyRevokedFailed')),
    });

    function handleRevoke(keyId: string) {
        openAlertDialog({
            title: t('revokeKey'),
            description: t('confirmRevoke'),
            onAction: async () => {
                await deleteKey({ keyId });
                toast.success(t('keyRevokedSuccess'));
                router.refresh();
            },
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-card rounded-xl border shadow-sm">
                <div className="flex flex-col gap-1 p-4">
                    <span className="text-sm font-medium">{t('endpoint')}</span>
                    <span className="text-muted-foreground text-xs">
                        {t('endpointDescription')}
                    </span>
                </div>
                <Separator />
                <div className="flex gap-2 p-4">
                    <Input readOnly value={mcpUrl} className="font-mono text-sm" />
                    <Button
                        variant="outline"
                        size="icon"
                        icon={Copy}
                        title={t('copyKey')}
                        onClick={() => navigator.clipboard.writeText(mcpUrl)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <span className="text-muted-foreground px-1 text-sm font-medium">
                    {t('keyName')}
                </span>
                {keys.length === 0 ? (
                    <div className="text-muted-foreground rounded-md border p-8 text-center text-sm">
                        {t('noKeys')}
                    </div>
                ) : (
                    keys.map((k) => <MCPKeyCard key={k.id} k={k} onRevoke={handleRevoke} />)
                )}
            </div>
        </div>
    );
}
