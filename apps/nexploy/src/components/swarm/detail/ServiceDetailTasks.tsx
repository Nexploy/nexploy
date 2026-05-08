'use client';

import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { TaskRow } from './TaskRow';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';

export function ServiceDetailTasks() {
    const t = useTranslations('swarm');

    const tasks = useSwarmServiceStore((s) => s.tasks);
    const isConnecting = useSwarmServiceStore((s) => s.isConnecting);

    const sortedTasks = [...tasks].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

    if (isConnecting) {
        return <Skeleton className={'h-80 flex-1'} />;
    }

    return (
        <Card>
            <CardHeaderWithIcon icon={Activity} title={t('detail.tasksTitle')}>
                {tasks.length > 0 && <Badge variant="secondary">{tasks.length}</Badge>}
            </CardHeaderWithIcon>
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
