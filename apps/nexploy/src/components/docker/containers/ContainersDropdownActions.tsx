import { Fragment } from 'react';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@workspace/ui/components/dropdown-menu';
import { ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContainerActions } from '@/hooks/useContainerActions';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { MoveContainerForm } from '@/components/docker/container/forms/MoveContainerForm';

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

    const handleMoveEnvironment = () => {
        openDialog({
            title: t('moveEnvironmentTitle'),
            description: t('moveEnvironmentDescription'),
            content: <MoveContainerForm containerId={id} containerName={name} />,
        });
    };

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                        variant={tool.variant}
                        onClick={(event) => {
                            event.stopPropagation();
                            tool.onClick && tool.onClick();
                        }}
                        disabled={state && tool.disabledStates.includes(state)}
                    >
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={(event) => {
                    event.stopPropagation();
                    handleMoveEnvironment();
                }}
            >
                <ArrowRightLeft />
                {t('moveEnvironment')}
            </DropdownMenuItem>
        </DropdownMenuContent>
    );
}
