'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Button } from '@workspace/ui/components/button';
import { X } from 'lucide-react';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import type { SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';

const TASK_STATES: SwarmTaskState[] = [
    'new',
    'pending',
    'assigned',
    'accepted',
    'preparing',
    'ready',
    'starting',
    'running',
    'complete',
    'shutdown',
    'failed',
    'rejected',
    'remove',
    'orphaned',
];

interface TasksFiltersProps {
    serviceFilter: string | null;
    nodeFilter: string | null;
    stateFilter: SwarmTaskState | null;
    onServiceFilterChange: (value: string | null) => void;
    onNodeFilterChange: (value: string | null) => void;
    onStateFilterChange: (value: SwarmTaskState | null) => void;
}

export function TasksFilters({
    serviceFilter,
    nodeFilter,
    stateFilter,
    onServiceFilterChange,
    onNodeFilterChange,
    onStateFilterChange,
}: TasksFiltersProps) {
    const { services, nodes } = useSwarmStore();

    const hasFilters = serviceFilter || nodeFilter || stateFilter;

    const clearFilters = () => {
        onServiceFilterChange(null);
        onNodeFilterChange(null);
        onStateFilterChange(null);
    };

    return (
        <div className="flex flex-wrap items-center gap-4 px-5">
            <Select
                value={serviceFilter || 'all'}
                onValueChange={(v) => onServiceFilterChange(v === 'all' ? null : v)}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={nodeFilter || 'all'}
                onValueChange={(v) => onNodeFilterChange(v === 'all' ? null : v)}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by node" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Nodes</SelectItem>
                    {nodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                            {node.hostname}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={stateFilter || 'all'}
                onValueChange={(v) => onStateFilterChange(v === 'all' ? null : (v as SwarmTaskState))}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {TASK_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                            {state}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 size-4" />
                    Clear Filters
                </Button>
            )}
        </div>
    );
}
