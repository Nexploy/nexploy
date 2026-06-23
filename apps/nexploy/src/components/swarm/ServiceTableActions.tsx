'use client';

import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useAction } from 'next-safe-action/hooks';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { onRemoveServicesAction } from '@/actions/docker/swarm/removeServices.action';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { Badge } from '@workspace/ui/components/badge';
import { usePermissions } from '@/contexts/PermissionContext';

interface ServiceTableActionsProps {
    selectedServices: SwarmService[];
    onResetSelection: () => void;
}

export function ServiceTableActions({
    selectedServices,
    onResetSelection,
}: ServiceTableActionsProps) {
    const { can } = usePermissions();
    const t = useTranslations('swarm');
    if (!can('swarm', 'manage')) return null;
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { executeAsync: removeAsync, isPending: isRemoving } = useAction(onRemoveServicesAction);

    const numberOfSelected = selectedServices.length;

    const handleRemove = () => {
        openAlertDialog({
            title: t('removeServices'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            description: t('confirmRemoveServices', { count: numberOfSelected }),
            onAction: async () => {
                const serviceIds = selectedServices.map((s) => s.id);
                if (serviceIds.length) await removeAsync({ serviceIds });
                onResetSelection();
            },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="destructive"
                icon={Trash2}
                onClick={handleRemove}
                disabled={numberOfSelected === 0 || isRemoving}
                isLoading={isRemoving}
            >
                {tCommon('remove')}
                {numberOfSelected > 1 && (
                    <Badge variant="secondary" className="rounded-full">
                        {numberOfSelected}
                    </Badge>
                )}
            </Button>
        </div>
    );
}
