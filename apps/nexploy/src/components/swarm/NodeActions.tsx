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

interface NodeActionsProps {
    node: SwarmNode;
    onEditLabels?: (node: SwarmNode) => void;
}

export function NodeActions({ node, onEditLabels }: NodeActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (
        action: 'promote' | 'demote' | 'drain' | 'activate' | 'pause' | 'remove',
    ) => {
        setIsLoading(true);
        try {
            await onSwarmNodeAction({ nodeId: node.id, action, force: false });
            toast.success(`Node ${node.hostname} ${action}d successfully`);
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
                <DropdownMenuLabel>Node Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {node.role === 'worker' ? (
                    <DropdownMenuItem onClick={() => handleAction('promote')}>
                        <Crown className="mr-2 size-4" />
                        Promote to Manager
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => handleAction('demote')}>
                        <Users className="mr-2 size-4" />
                        Demote to Worker
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {node.availability !== 'active' && (
                    <DropdownMenuItem onClick={() => handleAction('activate')}>
                        <Play className="mr-2 size-4" />
                        Activate
                    </DropdownMenuItem>
                )}
                {node.availability !== 'pause' && (
                    <DropdownMenuItem onClick={() => handleAction('pause')}>
                        <Pause className="mr-2 size-4" />
                        Pause
                    </DropdownMenuItem>
                )}
                {node.availability !== 'drain' && (
                    <DropdownMenuItem onClick={() => handleAction('drain')}>
                        <AlertTriangle className="mr-2 size-4" />
                        Drain
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {onEditLabels && (
                    <DropdownMenuItem onClick={() => onEditLabels(node)}>
                        <Tag className="mr-2 size-4" />
                        Edit Labels
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleAction('remove')}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 size-4" />
                    Remove from Swarm
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
