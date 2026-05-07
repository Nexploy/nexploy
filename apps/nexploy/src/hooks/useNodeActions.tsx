import { useRef } from 'react';
import { DropdownActionTool } from '@workspace/typescript-interface/commun';
import { AlertTriangle, Crown, Pause, Play, Trash2, Users } from 'lucide-react';
import { onSwarmNodeAction } from '@/actions/docker/swarm/nodeAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';
import type { SwarmNode } from '@workspace/typescript-interface/docker/swarm';
import { Label } from '@workspace/ui/components/label';
import { Switch } from '@workspace/ui/components/switch';

interface UseNodeActionsProps {
    node: SwarmNode;
}

export function useNodeActions({ node }: UseNodeActionsProps): DropdownActionTool[] {
    const t = useTranslations('swarm');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const forceRef = useRef(false);

    const handleAction = (action: 'promote' | 'demote' | 'drain' | 'activate' | 'pause') =>
        onSwarmNodeAction({ nodeId: node.id, action, force: false });

    const tools: DropdownActionTool[] = [
        node.role === 'worker'
            ? {
                  icon: Crown,
                  label: t('promoteToManager'),
                  onClick: () => handleAction('promote'),
              }
            : {
                  icon: Users,
                  label: t('demoteToWorker'),
                  onClick: () => handleAction('demote'),
              },
    ];

    tools.push(
        {
            icon: Play,
            label: t('activate'),
            disabled: node.availability === 'active',
            onClick: () => handleAction('activate'),
        },
        {
            icon: Pause,
            label: t('pause'),
            disabled: node.availability === 'pause',
            onClick: () => handleAction('pause'),
        },
        {
            icon: AlertTriangle,
            label: t('drain'),
            disabled: node.availability === 'drain',
            onClick: () => handleAction('drain'),
        },
    );

    tools.push({
        icon: Trash2,
        label: t('removeFromSwarm'),
        separator: true,
        onClick: () =>
            new Promise((resolve, reject) => {
                forceRef.current = false;
                openAlertDialog({
                    title: t('removeNodeConfirmTitle'),
                    cancelLabel: t('cancel'),
                    actionLabel: t('removeFromSwarm'),
                    description: (
                        <div className="space-y-4">
                            <p className="text-muted-foreground text-sm">
                                {t('removeNodeConfirmDescription', { hostname: node.hostname })}
                            </p>
                            <Label
                                htmlFor="force-remove-node"
                                className="bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3"
                            >
                                <div className="space-y-0.5">
                                    <p className="text-destructive text-sm font-medium">
                                        {t('forceRemoveNode')}
                                    </p>
                                    <p className="text-xs">{t('forceRemoveNodeDescription')}</p>
                                </div>
                                <Switch
                                    id="force-remove-node"
                                    defaultChecked={false}
                                    onCheckedChange={(checked) => (forceRef.current = checked)}
                                />
                            </Label>
                        </div>
                    ),
                    onAction: async () => {
                        try {
                            const result = await onSwarmNodeAction({
                                nodeId: node.id,
                                action: 'remove',
                                force: forceRef.current,
                            });
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
