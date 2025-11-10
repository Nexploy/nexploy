'use client';

import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Button } from '@workspace/ui/components/button';
import { useContainerActions } from '@/hooks/useContainerActions';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export function ContainerActionButtons() {
    const container = useContainerStore((state) => state.container);
    const router = useRouter();

    const containerActions = useContainerActions({
        containerId: container?.id ?? '',
        containerName: container?.name ?? '',
        isPaused: container?.state === 'paused',
    });

    const handleActionClick = async (action: (typeof containerActions)[0]) => {
        if (!action.onClick) return;
        const result = await action.onClick();

        if (action.id === 'destroy') {
            router.replace('/docker/containers');
        }

        return result;
    };

    const groups: ReactNode[] = [];
    let currentGroup: ReactNode[] = [];

    containerActions.forEach((action, index) => {
        if (action.separator) {
            if (currentGroup.length) {
                groups.push(<ButtonGroup key={`group-${index}`}>{currentGroup}</ButtonGroup>);
                currentGroup = [];
            }

            groups.push(
                <ButtonGroup key={`sep-${index}`}>
                    <Button
                        onClick={() => handleActionClick(action)}
                        disabled={action.disabledStates.includes(container!.state)}
                        variant={action.variant}
                    >
                        <action.icon className={'hidden lg:block'} />
                        {action.label}
                    </Button>
                </ButtonGroup>,
            );
        } else {
            currentGroup.push(
                <Button
                    key={index}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabledStates.includes(container!.state)}
                    variant={action.variant}
                >
                    <action.icon className={'hidden lg:block'} />
                    {action.label}
                </Button>,
            );
        }
    });

    if (currentGroup.length) {
        groups.push(<ButtonGroup key="last-group">{currentGroup}</ButtonGroup>);
    }

    return <div className={'flex gap-2'}>{groups}</div>;
}
