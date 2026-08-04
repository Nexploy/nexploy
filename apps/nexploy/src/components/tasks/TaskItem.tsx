'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleSlash, Loader2, X, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Task } from '@workspace/typescript-interface/task';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { cn } from '@workspace/ui/lib/utils';
import { onTaskCancelAction, onTaskDismissAction } from '@/actions/tasks/task.action';
import { useTaskElapsed } from '@/hooks/useTaskElapsed';

interface TaskItemProps {
    task: Task;
    onNavigate: () => void;
}

const STATUS_ICONS = {
    running: Loader2,
    succeeded: CheckCircle2,
    failed: XCircle,
    cancelled: CircleSlash,
} as const;

const STATUS_COLORS = {
    running: 'text-primary',
    succeeded: 'text-emerald-500',
    failed: 'text-destructive',
    cancelled: 'text-muted-foreground',
} as const;

export function TaskItem({ task, onNavigate }: TaskItemProps) {
    const t = useTranslations('docker.tasks');
    const [isPending, startTransition] = useTransition();
    const elapsed = useTaskElapsed(task);

    const StatusIcon = STATUS_ICONS[task.status];
    const isRunning = task.status === 'running';

    const handleCancel = () => {
        startTransition(async () => {
            await onTaskCancelAction({ taskId: task.id });
        });
    };

    const handleDismiss = () => {
        startTransition(async () => {
            await onTaskDismissAction({ taskId: task.id });
        });
    };

    return (
        <div className="flex flex-col gap-2 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
                <StatusIcon
                    className={cn('mt-0.5 size-4 shrink-0', STATUS_COLORS[task.status], isRunning && 'animate-spin')}
                />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                        {t(`kinds.${task.kind}`, { name: task.subjectName })}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                        {isRunning && task.currentStepKey
                            ? t(`steps.${task.currentStepKey}`)
                            : t(`status.${task.status}`)}
                        {' · '}
                        {elapsed}
                    </p>
                </div>
                {isRunning && task.cancellable ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        {t('cancel')}
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={handleDismiss}
                        disabled={isPending}
                        aria-label={t('dismiss')}
                    >
                        <X className="size-3.5" />
                    </Button>
                )}
            </div>

            {isRunning && <Progress value={task.progress} className="h-1" />}

            {task.error && <p className="text-destructive line-clamp-3 text-xs">{task.error}</p>}

            {task.warnings.length > 0 && (
                <ul className="text-muted-foreground space-y-0.5 text-xs">
                    {task.warnings.map((warning, index) => (
                        <li key={index} className="line-clamp-2">
                            {warning}
                        </li>
                    ))}
                </ul>
            )}

            {task.status === 'succeeded' && task.resultHref && (
                <Link
                    href={task.resultHref}
                    onClick={onNavigate}
                    className="text-primary text-xs font-medium hover:underline"
                >
                    {t('openResult')}
                </Link>
            )}
        </div>
    );
}
