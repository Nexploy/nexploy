'use client';

import { Button } from '@workspace/ui/components/button';
import { useTranslations } from 'next-intl';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useAction } from 'next-safe-action/hooks';
import { clearCacheAction } from '@/actions/repository/settings/clearCache.action';
import { formatBytes } from '@/utils/formatBytes.ts';

interface ClearCacheButtonProps {
    repositoryId: string;
    cacheSize: number;
}

export function ClearCacheButton({ repositoryId, cacheSize }: ClearCacheButtonProps) {
    const t = useTranslations('repository.settings.dangerZone');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { executeAsync: clearCache, isPending: clearingCache } = useAction(clearCacheAction);
    const cacheSizeLabel = cacheSize === 0 ? t('noCacheFiles') : formatBytes(cacheSize);

    const handleClearCache = () => {
        openAlertDialog({
            title: t('clearCacheTitle'),
            description: t('clearCacheDescription'),
            cancelLabel: t('cancel'),
            actionLabel: t('clearCacheConfirm'),
            onAction: async () => {
                await clearCache({ repositoryId });
            },
        });
    };

    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium">{t('clearCacheButton')}</p>
                <p className="text-muted-foreground text-xs">
                    {t('cacheSize')}: {cacheSizeLabel}
                </p>
            </div>
            <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                isLoading={clearingCache}
                disabled={clearingCache || cacheSize === 0}
            >
                {t('clearCacheButton')}
            </Button>
        </div>
    );
}
