'use client';

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import {
    AlertTriangle,
    Crown,
    MoreHorizontal,
    Pause,
    Play,
    Tag,
    Trash2,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SwarmNode } from '@workspace/typescript-interface/docker/swarm';
import { onSwarmNodeAction } from '@/actions/docker/swarm/nodeAction.action';
import { useTranslations } from 'next-intl';

interface NodeActionsProps {
    node: SwarmNode;
    onEditLabels?: (node: SwarmNode) => void;
}

export function NodeActions({ node, onEditLabels }: NodeActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('swarm');

    const handleAction = async (
        action: 'promote' | 'demote' | 'drain' | 'activate' | 'pause' | 'remove',
    ) => {
        setIsLoading(true);
        try {
            await onSwarmNodeAction({ nodeId: node.id, action, force: false });
            toast.success(t('nodeActionSuccess', { hostname: node.hostname, action }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading}>
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('nodeActions')}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {node.role === 'worker' ? (
                    <DropdownMenuItem onClick={() => handleAction('promote')}>
                        <Crown className="mr-2 size-4" />
                        {t('promoteToManager')}
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleAction('demote')}>
                        <Users className="mr-2 size-4" />
                        {t('demoteToWorker')}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {node.availability !== 'active' && (
                    <DropdownMenuItem onClick={() => handleAction('activate')}>
                        <Play className="mr-2 size-4" />
                        {t('activate')}
                    </DropdownMenuItem>
                )}
                {node.availability !== 'pause' && (
                    <DropdownMenuItem onClick={() => handleAction('pause')}>
                        <Pause className="mr-2 size-4" />
                        {t('pause')}
                    </DropdownMenuItem>
                )}
                {node.availability !== 'drain' && (
                    <DropdownMenuItem onClick={() => handleAction('drain')}>
                        <AlertTriangle className="mr-2 size-4" />
                        {t('drain')}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {onEditLabels && (
                    <DropdownMenuItem onClick={() => onEditLabels(node)}>
                        <Tag className="mr-2 size-4" />
                        {t('editLabels')}
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleAction('remove')}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 size-4" />
                    {t('removeFromSwarm')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
