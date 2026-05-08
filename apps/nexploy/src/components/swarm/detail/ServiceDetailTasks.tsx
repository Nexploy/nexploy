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
} from '@workspace/ui/components/table';
import type { SwarmTask } from '@workspace/typescript-interface/docker/swarm';
import { TaskRow } from './TaskRow';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';

interface ServiceDetailTasksProps {
    tasks: SwarmTask[];
}

export function ServiceDetailTasks({ tasks }: ServiceDetailTasksProps) {
    const t = useTranslations('swarm');

    const sortedTasks = [...tasks].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as="div" icon={Activity} title={t('detail.tasksTitle')}>
                        <Badge variant="secondary">{tasks.length}</Badge>
                    </CardHeaderWithIcon>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {sortedTasks.length === 0 ? (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('detail.noTasks')}
                    </div>
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
