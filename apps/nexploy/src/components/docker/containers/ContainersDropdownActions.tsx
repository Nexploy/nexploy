import { Fragment } from 'react';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@workspace/ui/components/dropdown-menu';
import { ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContainerActions } from '@/hooks/useContainerActions';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { MoveContainerForm } from '@/components/docker/container/forms/MoveContainerForm';
import { useProtectionTooltip } from '@/hooks/useProtectionTooltip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface ContainerDropdownActionsProps {
    container: {
        id: string;
        name: string;
        state?: ContainerState;
    };
}

export function ContainersDropdownActions({ container: { id, name, state } }: ContainerDropdownActionsProps) {
    const isPaused = state === 'paused';
    const containerTools = useContainerActions({ containerId: id, containerName: name, isPaused });
    const t = useTranslations('docker.containerDetail');
    const openDialog = useConfirmationDialogStore((store) => store.openDialog);
    const migrateOut = useProtectionTooltip('container.migrateOut');

    const handleMoveEnvironment = () => {
        openDialog({
            title: t('moveEnvironmentTitle'),
            description: t('moveEnvironmentDescription'),
            content: <MoveContainerForm containerId={id} containerName={name} />,
        });
    };

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => {
                const item = (
                    <DropdownMenuItem
                        variant={tool.variant}
                        onClick={(event) => {
                            event.stopPropagation();
                            tool.onClick?.();
                        }}
                        disabled={tool.disabled || (state && tool.disabledStates.includes(state))}
                    >
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                );

                return (
                    <Fragment key={index}>
                        {tool.separator && <DropdownMenuSeparator />}
                        {tool.tooltipContent ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>{item}</div>
                                </TooltipTrigger>
                                <TooltipContent>{tool.tooltipContent}</TooltipContent>
                            </Tooltip>
                        ) : (
                            item
                        )}
                    </Fragment>
                );
            })}
            <DropdownMenuSeparator />
            {migrateOut.blocked ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <DropdownMenuItem disabled>
                                <ArrowRightLeft />
                                {t('moveEnvironment')}
                            </DropdownMenuItem>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>{migrateOut.tooltip}</TooltipContent>
                </Tooltip>
            ) : (
                <DropdownMenuItem
                    onClick={(event) => {
                        event.stopPropagation();
                        handleMoveEnvironment();
                    }}
                >
                    <ArrowRightLeft />
                    {t('moveEnvironment')}
                </DropdownMenuItem>
            )}
        </DropdownMenuContent>
    );
}
