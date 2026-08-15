'use client';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { deleteMcpApiKeyAction } from '@/actions/admin/ai/deleteMcpApiKey.action.ts';
import { MCPKeyCard } from '@/components/admin/ai/MCPKeyCard.tsx';
import type { McpApiKey } from '@workspace/typescript-interface/ai/mcpApiKey';
import CopyButton from '@/components/shared/CopyButton.tsx';
import { GenerateMcpKeyButton } from '@/components/admin/ai/GenerateMcpKeyButton.tsx';

interface MCPSectionProps {
    mcpUrl: string;
    keys: McpApiKey[];
}

export function MCPSection({ mcpUrl, keys }: MCPSectionProps) {
    const t = useTranslations('ai.admin.mcp');
    const router = useRouter();
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { executeAsync: deleteKey } = useAction(deleteMcpApiKeyAction, {
        onSuccess: () => {
            toast.success(t('keyRevokedSuccess'));
            router.refresh();
        },
    });

    function handleRevoke(keyId: string) {
        openAlertDialog({
            title: t('revokeKey'),
            description: t('confirmRevoke'),
            onAction: async () => await deleteKey({ keyId }),
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-card shadow-sm">
                <div className="flex flex-col gap-1 p-4">
                    <span className="font-medium text-sm">{t('endpoint')}</span>
                    <span className="text-muted-foreground text-xs">{t('endpointDescription')}</span>
                </div>
                <Separator />
                <div className="flex gap-2 bg-muted/40 p-4">
                    <Input readOnly value={mcpUrl} className="font-mono" />
                    <CopyButton variant="outline" size="icon" text={mcpUrl} />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <span className="flex items-end justify-between px-1 font-medium text-muted-foreground text-sm">
                    {t('keyName')}
                    <GenerateMcpKeyButton />
                </span>
                {keys.length === 0 ? (
                    <div className="rounded-md border p-8 text-center text-muted-foreground text-sm">{t('noKeys')}</div>
                ) : (
                    keys.map((k) => <MCPKeyCard key={k.id} k={k} onRevoke={handleRevoke} />)
                )}
            </div>
        </div>
    );
}
