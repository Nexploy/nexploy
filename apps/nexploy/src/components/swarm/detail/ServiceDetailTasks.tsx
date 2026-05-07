'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import type { SwarmTask, SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';

function taskStateToStatus(
    state: SwarmTaskState,
): 'online' | 'offline' | 'maintenance' | 'degraded' | 'waiting' {
    switch (state) {
        case 'running':
            return 'online';
        case 'failed':
        case 'rejected':
        case 'orphaned':
            return 'offline';
        case 'complete':
        case 'shutdown':
            return 'maintenance';
        case 'remove':
            return 'degraded';
        default:
            return 'waiting';
    }
}

function TaskRow({ task }: { task: SwarmTask }) {
    return (
        <TableRow className="h-11">
            <TableCell className="font-mono text-xs">
                {task.slot !== undefined ? `#${task.slot}` : task.id.slice(0, 12)}
            </TableCell>
            <TableCell>
                <Status
                    className="border-0 text-sm"
                    status={taskStateToStatus(task.state)}
                    variant="outline"
                >
                    <StatusIndicator />
                    <StatusLabel className="text-sm capitalize">{task.state}</StatusLabel>
                </Status>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="text-xs capitalize">
                    {task.desiredState}
                </Badge>
            </TableCell>
            <TableCell className="text-sm">{task.nodeHostname ?? '—'}</TableCell>
            <TableCell className="font-mono text-xs">
                {task.containerStatus?.containerId
                    ? task.containerStatus.containerId.slice(0, 12)
                    : '—'}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-xs text-red-500">
                {task.error ?? '—'}
            </TableCell>
        </TableRow>
    );
}

interface ServiceDetailTasksProps {
    tasks: SwarmTask[];
}

export function ServiceDetailTasks({ tasks }: ServiceDetailTasksProps) {
    const t = useTranslations('swarm');

    const sortedTasks = [...tasks].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="size-4" />
                    {t('detail.tasksTitle')}
                    <Badge variant="secondary" className="ml-1">
                        {tasks.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {sortedTasks.length === 0 ? (
                    <p className="text-muted-foreground px-6 pb-6 text-sm">
                        {t('detail.noTasks')}
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">{t('detail.taskSlot')}</TableHead>
                                <TableHead>{t('detail.taskState')}</TableHead>
                                <TableHead>{t('detail.taskDesiredState')}</TableHead>
                                <TableHead>{t('detail.taskNode')}</TableHead>
                                <TableHead>{t('detail.taskContainer')}</TableHead>
                                <TableHead>{t('detail.taskError')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map((task) => (
                                <TaskRow key={task.id} task={task} />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
