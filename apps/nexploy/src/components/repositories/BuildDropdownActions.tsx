'use client';

import { Fragment } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useBuildActions } from '@/hooks/useBuildActions';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';

interface BuildDropdownActionsProps {
    buildId: string;
    status: BuildStatus;
    lastCompletedStep?: string | null;
}

export function BuildDropdownActions({ buildId, status, lastCompletedStep }: BuildDropdownActionsProps) {
    const actions = useBuildActions({ buildId, status, lastCompletedStep, mode: 'dropdown' });

    if (actions.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(e) => e.preventDefault()}
                >
                    <MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {actions.map((action) => (
                    <Fragment key={action.id}>
                        {action.separator && <DropdownMenuSeparator />}
                        {action.type === 'component' ? (
                            action.component
                        ) : (
                            <DropdownMenuItem
                                variant={action.variant}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    action.onClick();
                                }}
                                disabled={action.disabled}
                            >
                                <action.icon className="size-4" />
                                {action.label}
                            </DropdownMenuItem>
                        )}
                    </Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
