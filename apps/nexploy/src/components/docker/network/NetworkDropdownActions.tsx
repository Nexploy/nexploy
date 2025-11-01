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

    const networkName = network.name || '<none>';
    const isBuiltin = ['bridge', 'host', 'none'].includes(network.name);

    const handleAction = async (action: 'delete' | 'prune') => {
        await onNetworkAction({ networkIds: [network.id], action });
    };

    const networkTools: NetworkTool[] = [
        {
            icon: Trash,
            label: 'Remove',
            action: () =>
                openAlertDialog({
                    title: 'Remove Network',
                    description: `Are you sure you want to remove ${networkName} network?`,
                    cancelLabel: 'Cancel',
                    actionLabel: 'Remove',
                    onAction: () => handleAction('delete'),
                }),
            disabled: isBuiltin || (network.containers?.length || 0) > 0,
            variant: 'destructive',
            tooltipContent: isBuiltin
                ? 'Cannot remove built-in network'
                : (network.containers?.length || 0) > 0
                  ? 'Disconnect all containers first'
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
