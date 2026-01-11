import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Trash } from 'lucide-react';
import { onNetworkAction } from '@/actions/docker/network/networkAction.action';
import { Network } from '@workspace/typescript-interface/docker/docker.network';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface NetworkDropdownActionsProps {
    network: Network;
}

interface NetworkTool {
    icon: any;
    label: string;
    action: () => void;
    disabled?: boolean;
    variant?: 'destructive';
    separator?: boolean;
    tooltipContent?: string;
}

export function NetworkDropdownActions({ network }: NetworkDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('docker.dropdownActions');

    const networkName = network.name || '<none>';
    const isBuiltin = ['bridge', 'host', 'none'].includes(network.name);

    const handleAction = async (action: 'delete' | 'prune') => {
        await onNetworkAction({ networkIds: [network.id], action });
    };

    const networkTools: NetworkTool[] = [
        {
            icon: Trash,
            label: t('remove'),
            action: () =>
                openAlertDialog({
                    title: t('network.removeTitle'),
                    description: t('network.removeDescription', { name: networkName }),
                    cancelLabel: t('cancel'),
                    actionLabel: t('remove'),
                    onAction: () => handleAction('delete'),
                }),
            disabled: isBuiltin || (network.containers?.length || 0) > 0,
            variant: 'destructive',
            tooltipContent: isBuiltin
                ? t('network.cannotRemoveBuiltin')
                : (network.containers?.length || 0) > 0
                  ? t('network.disconnectContainersFirst')
                  : undefined,
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {networkTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    {tool.tooltipContent ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <DropdownMenuItem
                                        variant={tool.variant}
                                        onClick={tool.action}
                                        disabled={tool.disabled}
                                    >
                                        <tool.icon />
                                        {tool.label}
                                    </DropdownMenuItem>
                                </div>
                            </TooltipTrigger>
                            {tool.tooltipContent && (
                                <TooltipContent>
                                    <p>{tool.tooltipContent}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ) : (
                        <DropdownMenuItem
                            variant={tool.variant}
                            onClick={tool.action}
                            disabled={tool.disabled}
                        >
                            <tool.icon />
                            {tool.label}
                        </DropdownMenuItem>
                    )}
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
