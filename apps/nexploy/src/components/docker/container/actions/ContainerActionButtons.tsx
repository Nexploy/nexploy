'use client';

import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useContainerActions } from '@/hooks/useContainerActions';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/contexts/PermissionContext';

export function ContainerActionButtons() {
    const { canOnContainer } = usePermissions();
    const container = useContainerStore((state) => state.container);
    const router = useRouter();

    const containerActions = useContainerActions({
        containerId: container?.id ?? '',
        containerName: container?.name ?? '',
        isPaused: container?.state === 'paused',
    });

    const handleActionClick = async (action: (typeof containerActions)[0]) => {
        if (!action.onClick) return;

        try {
            const result = await action.onClick();

            if (action.id === 'destroy' && result !== null) {
                router.replace('/docker/containers');
            }

            return result;
        } catch (error) {
            console.error('Container action failed:', error);
        }
    };

    if (!canOnContainer(container?.labels, 'manage')) return null;

    const renderButton = (action: (typeof containerActions)[0], index: number) => {
        const isDisabled = !container || action.disabled || action.disabledStates.includes(container.state);

        return (
            <Tooltip key={index}>
                <TooltipTrigger asChild>
                    <Button
                        className={'sm:w-9 xl:w-fit'}
                        onClick={isDisabled ? undefined : () => handleActionClick(action)}
                        aria-disabled={isDisabled}
                        variant={action.variant}
                    >
                        <action.icon />
                        <span className={'sm:hidden xl:block'}>{action.label}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent className={action.tooltipContent ? undefined : 'hidden sm:block xl:hidden'}>
                    {action.tooltipContent ?? action.label}
                </TooltipContent>
            </Tooltip>
        );
    };

    const groups: ReactNode[] = [];
    let currentGroup: ReactNode[] = [];

    containerActions.forEach((action, index) => {
        if (action.separator) {
            if (currentGroup.length) {
                groups.push(<ButtonGroup key={`group-${index}`}>{currentGroup}</ButtonGroup>);
                currentGroup = [];
            }

            groups.push(<ButtonGroup key={`sep-${index}`}>{renderButton(action, index)}</ButtonGroup>);
        } else {
            currentGroup.push(renderButton(action, index));
        }
    });

    if (currentGroup.length) {
        groups.push(<ButtonGroup key="last-group">{currentGroup}</ButtonGroup>);
    }

    return <div className={'flex gap-2'}>{groups}</div>;
}
