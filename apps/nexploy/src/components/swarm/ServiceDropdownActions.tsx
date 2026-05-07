import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { useTranslations } from 'next-intl';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';
import { useServiceActions } from '@/hooks/useServiceActions';

interface ServiceDropdownActionsProps {
    service: SwarmService;
}

export function ServiceDropdownActions({ service }: ServiceDropdownActionsProps) {
    const t = useTranslations('swarm');
    const tools = useServiceActions({ service });

    return (
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('serviceActions')}</DropdownMenuLabel>
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
