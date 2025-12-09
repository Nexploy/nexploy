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
    MoreHorizontal,
    Scale,
    RotateCcw,
    RefreshCw,
    Trash2,
    FileText,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SwarmService } from '@workspace/typescript-interface/docker/swarm';

const DOCKER_API_URL = process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://localhost:3300';

interface ServiceActionsProps {
    service: SwarmService;
    onViewDetails?: (service: SwarmService) => void;
    onViewLogs?: (service: SwarmService) => void;
    onScale?: (service: SwarmService) => void;
}

export function ServiceActions({ service, onViewDetails, onViewLogs, onScale }: ServiceActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (action: 'rollback' | 'force-update' | 'delete') => {
        setIsLoading(true);
        try {
            let endpoint = '';
            let method = 'POST';

            switch (action) {
                case 'rollback':
                    endpoint = `/api/swarm/services/${service.id}/rollback`;
                    break;
                case 'force-update':
                    endpoint = `/api/swarm/services/${service.id}/force-update`;
                    break;
                case 'delete':
                    endpoint = `/api/swarm/services/${service.id}`;
                    method = 'DELETE';
                    break;
            }

            const res = await fetch(`${DOCKER_API_URL}${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || error.error || `Failed to ${action} service`);
            }

            const actionLabel = action === 'force-update' ? 'force updated' : `${action}ed`;
            toast.success(`Service ${service.name} ${actionLabel} successfully`);
        } catch (err: any) {
            toast.error(err.message);
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
                <DropdownMenuLabel>Service Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(service)}>
                        <Eye className="mr-2 size-4" />
                        View Details
                    </DropdownMenuItem>
                )}

                {onScale && service.mode === 'replicated' && (
                    <DropdownMenuItem onClick={() => onScale(service)}>
                        <Scale className="mr-2 size-4" />
                        Scale
                    </DropdownMenuItem>
                )}

                {onViewLogs && (
                    <DropdownMenuItem onClick={() => onViewLogs(service)}>
                        <FileText className="mr-2 size-4" />
                        View Logs
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleAction('force-update')}>
                    <RefreshCw className="mr-2 size-4" />
                    Force Update
                </DropdownMenuItem>

                {service.previousSpec && (
                    <DropdownMenuItem onClick={() => handleAction('rollback')}>
                        <RotateCcw className="mr-2 size-4" />
                        Rollback
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleAction('delete')}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 size-4" />
                    Delete Service
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
