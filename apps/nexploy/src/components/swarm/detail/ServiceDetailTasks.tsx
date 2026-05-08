'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/components/table';
import type { SwarmTask } from '@workspace/typescript-interface/docker/swarm';
import { TaskRow } from './TaskRow';

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
