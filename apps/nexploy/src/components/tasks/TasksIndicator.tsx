'use client';

import { useMemo, useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { cn } from '@workspace/ui/lib/utils';
import { useTasksStore } from '@/stores/useTasksStore';
import { TaskItem } from '@/components/tasks/TaskItem';

export function TasksIndicator() {
    const t = useTranslations('docker.tasks');
    const [open, setOpen] = useState(false);

    const tasks = useTasksStore((state) => state.tasks);
    const dismissedTaskIds = useTasksStore((state) => state.dismissedTaskIds);
    const dismissTasks = useTasksStore((state) => state.dismissTasks);

    const visibleTasks = useMemo(
        () => tasks.filter((task) => !dismissedTaskIds.includes(task.id)),
        [tasks, dismissedTaskIds],
    );

    const runningCount = visibleTasks.filter((task) => task.status === 'running').length;
    const finishedTaskIds = visibleTasks.filter((task) => task.status !== 'running').map((task) => task.id);

    if (visibleTasks.length === 0) return null;

    const handleClear = () => {
        dismissTasks(finishedTaskIds);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-8 gap-1.5 px-2.5 text-muted-foreground shadow-none hover:text-foreground"
                        >
                            {runningCount > 0 ? (
                                <Loader2 className="size-4 animate-spin text-primary" />
                            ) : (
                                <Activity className="size-4" />
                            )}
                            <span className={cn('font-medium text-xs', runningCount > 0 && 'text-foreground')}>
                                {runningCount > 0 ? runningCount : visibleTasks.length}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    {runningCount > 0 ? t('runningCount', { count: runningCount }) : t('title')}
                </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="mx-2 w-96 p-0">
                <div className="flex items-center justify-between px-3 py-2">
                    <p className="font-medium text-sm">{t('title')}</p>
                    {finishedTaskIds.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleClear}>
                            {t('clearFinished')}
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <ScrollAreaWithShadow viewportClassName="max-h-[60vh]" bottomShadow>
                    <div className="divide-y">
                        {visibleTasks.map((task) => (
                            <TaskItem key={task.id} task={task} onNavigate={() => setOpen(false)} />
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
