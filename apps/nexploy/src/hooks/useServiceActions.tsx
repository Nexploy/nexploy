import { DropdownActionTool } from '@workspace/typescript-interface/commun';
import { Scaling, Trash2 } from 'lucide-react';
import { onRemoveServiceAction } from '@/actions/docker/swarm/removeService.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { ScaleServiceForm } from '@/components/swarm/ScaleServiceForm';

interface UseServiceActionsProps {
    service: SwarmService;
}

export function useServiceActions({ service }: UseServiceActionsProps): DropdownActionTool[] {
    const t = useTranslations('swarm');
    const openDialog = useConfirmationDialogStore((state) => state.openDialog);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const tools: DropdownActionTool[] = [];

    if (service.mode === 'replicated') {
        tools.push({
            icon: Scaling,
            label: t('scaleService'),
            onClick: () => {
                openDialog({
                    title: t('scaleServiceTitle'),
                    description: t('scaleServiceDescription'),
                    props: { className: 'sm:max-w-[400px]' },
                    content: <ScaleServiceForm service={service} />,
                });
            },
        });
    }

    tools.push({
        icon: Trash2,
        label: t('removeService'),
        separator: true,
        onClick: () =>
            new Promise((resolve, reject) => {
                openAlertDialog({
                    title: t('removeServiceConfirmTitle'),
                    cancelLabel: t('cancel'),
                    actionLabel: t('removeService'),
                    description: t('removeServiceConfirmDescription', { name: service.name }),
                    onAction: async () => {
                        try {
                            const result = await onRemoveServiceAction({ id: service.id });
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    },
                });
            }),
    });

    return tools;
}
