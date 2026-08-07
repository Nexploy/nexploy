'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import type { EnvironmentProtectedAction } from '@workspace/schemas-zod/docker/environment/environmentProtection.schema';
import { useProtectionTooltip } from '@/hooks/useProtectionTooltip';

interface ProtectedActionProps {
    action: EnvironmentProtectedAction;
    children: ReactNode;
    environmentId?: string;
}

export function ProtectedAction({ action, children, environmentId }: ProtectedActionProps) {
    const { blocked, tooltip } = useProtectionTooltip(action, environmentId);

    if (!blocked || !isValidElement(children)) return <>{children}</>;

    const disabledChild = cloneElement(children as ReactElement<{ disabled?: boolean; onClick?: unknown }>, {
        disabled: true,
        onClick: undefined,
    });

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex cursor-not-allowed">{disabledChild}</span>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}
