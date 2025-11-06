import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import { useContainerActions } from '@/hooks/useContainerActions';

interface ContainerDropdownActionsProps {
    containerId: string;
    containerName: string;
    containerState: ContainerState;
}

export function ContainersDropdownActions({
    containerId,
    containerName,
    containerState,
}: ContainerDropdownActionsProps) {
    const isPaused = containerState === 'paused';
    const containerTools = useContainerActions({ containerId, containerName, isPaused });

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
                        disabled={tool.disabledStates.includes(containerState)}
                    >
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
