import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import { useContainerActions } from '@/hooks/useContainerActions';

interface ContainerDropdownActionsProps {
    container: {
        id: string;
        name: string;
        state?: ContainerState;
    };
}

export function ContainersDropdownActions({
    container: { id, name, state },
}: ContainerDropdownActionsProps) {
    const isPaused = state === 'paused';
    const containerTools = useContainerActions({ containerId: id, containerName: name, isPaused });

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
        </DropdownMenuContent>
    );
}
