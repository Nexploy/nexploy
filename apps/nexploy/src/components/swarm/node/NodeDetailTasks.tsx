'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell,
} from '@workspace/ui/components/table';
import type { SwarmTask, SwarmTaskState } from '@workspace/typescript-interface/docker/swarm';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

function taskStateToStatus(
    state: SwarmTaskState,
): 'online' | 'offline' | 'maintenance' | 'degraded' | 'waiting' {
    switch (state) {
        case 'running': return 'online';
        case 'failed':
        case 'rejected':
        case 'orphaned': return 'offline';
        case 'complete':
        case 'shutdown': return 'maintenance';
        case 'remove': return 'degraded';
        default: return 'waiting';
    }
}

interface NodeDetailTasksProps {
    tasks: SwarmTask[];
}

export function NodeDetailTasks({ tasks }: NodeDetailTasksProps) {
    const t = useTranslations('swarm');
    const sortedTasks = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as="div" icon={Activity} title={t('node.tasksTitle')}>
                        <Badge variant="secondary">{tasks.length}</Badge>
                    </CardHeaderWithIcon>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {sortedTasks.length === 0 ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('node.noTasks')}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('service')}</TableHead>
                                <TableHead className="w-20">{t('detail.taskSlot')}</TableHead>
                                <TableHead>{t('detail.taskState')}</TableHead>
                                <TableHead>{t('detail.taskDesiredState')}</TableHead>
                                <TableHead>{t('detail.taskContainer')}</TableHead>
                                <TableHead>{t('detail.taskError')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTasks.map((task) => (
                                <TableRow key={task.id} className="h-11">
                                    <TableCell className="text-sm font-medium">
                                        {task.serviceName}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {task.slot !== undefined ? `#${task.slot}` : task.id.slice(0, 12)}
                                    </TableCell>
                                    <TableCell>
                                        <Status className="border-0 text-sm" status={taskStateToStatus(task.state)} variant="outline">
                                            <StatusIndicator />
                                            <StatusLabel className="text-sm capitalize">{task.state}</StatusLabel>
                                        </Status>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {task.desiredState}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {task.containerStatus?.containerId
                                            ? task.containerStatus.containerId.slice(0, 12)
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-red-500">
                                        {task.error ?? '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
