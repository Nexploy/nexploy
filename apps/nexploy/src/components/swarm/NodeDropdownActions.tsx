import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { useTranslations } from 'next-intl';
import type { SwarmNode } from '@workspace/typescript-interface/docker/swarm';
import { useNodeActions } from '@/hooks/useNodeActions';

interface NodeDropdownActionsProps {
    node: SwarmNode;
}

export function NodeDropdownActions({ node }: NodeDropdownActionsProps) {
    const t = useTranslations('swarm');
    const tools = useNodeActions({ node });

    return (
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('nodeActions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                        variant={tool === tools[tools.length - 1] ? 'destructive' : undefined}
                        disabled={tool.disabled}
                        onClick={(event) => {
                            event.stopPropagation();
                            tool.onClick?.();
                        }}
                    >
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
