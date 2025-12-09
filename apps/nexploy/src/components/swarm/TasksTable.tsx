'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Badge } from '@workspace/ui/components/badge';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Layers } from 'lucide-react';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TasksFilters } from './TasksFilters';
import type { SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

function formatImage(image: string): string {
    const parts = image.split('@');
    const imageName = parts[0] || '';
    if (imageName.length > 40) {
        return imageName.substring(0, 37) + '...';
    }
    return imageName;
}

export function TasksTable() {
    const { tasks, isSwarmActive } = useSwarmStore();
    const [serviceFilter, setServiceFilter] = useState<string | null>(null);
    const [nodeFilter, setNodeFilter] = useState<string | null>(null);
    const [stateFilter, setStateFilter] = useState<SwarmTaskState | null>(null);

    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (serviceFilter && task.serviceId !== serviceFilter) return false;
            if (nodeFilter && task.nodeId !== nodeFilter) return false;
            if (stateFilter && task.state !== stateFilter) return false;
            return true;
        });
    }, [tasks, serviceFilter, nodeFilter, stateFilter]);

    if (!isSwarmActive) {
        return null;
    }

    return (
        <div className="space-y-4">
            <TasksFilters
                serviceFilter={serviceFilter}
                nodeFilter={nodeFilter}
                stateFilter={stateFilter}
                onServiceFilterChange={setServiceFilter}
                onNodeFilterChange={setNodeFilter}
                onStateFilterChange={setStateFilter}
            />

            <div className="px-5">
                {filteredTasks.length === 0 ? (
                    <div className="bg-muted/50 rounded-lg border p-8 text-center">
                        <Layers className="text-muted-foreground mx-auto mb-4 size-12" />
                        <h3 className="text-lg font-semibold">No tasks found</h3>
                        <p className="text-muted-foreground text-sm">
                            {tasks.length === 0
                                ? 'No tasks are currently running in the swarm.'
                                : 'No tasks match the current filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task ID</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Node</TableHead>
                                    <TableHead>Slot</TableHead>
                                    <TableHead>State</TableHead>
                                    <TableHead>Desired</TableHead>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Message</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-mono text-xs">
                                            {task.id.slice(0, 12)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {task.serviceName || task.serviceId.slice(0, 12)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {task.nodeHostname || task.nodeId?.slice(0, 12) || '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {task.slot !== undefined ? task.slot : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <TaskStatusBadge state={task.state} />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{task.desiredState}</Badge>
                                        </TableCell>
                                        <TableCell
                                            className="text-muted-foreground max-w-[200px] truncate text-sm"
                                            title={task.image}
                                        >
                                            {formatImage(task.image)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(task.createdAt)}
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            {task.error ? (
                                                <span
                                                    className="text-destructive truncate text-sm"
                                                    title={task.error}
                                                >
                                                    {task.error}
                                                </span>
                                            ) : task.message ? (
                                                <span
                                                    className="text-muted-foreground truncate text-sm"
                                                    title={task.message}
                                                >
                                                    {task.message}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <p className="text-muted-foreground mt-2 text-xs">
                    Showing {filteredTasks.length} of {tasks.length} tasks
                </p>
            </div>
        </div>
    );
}
