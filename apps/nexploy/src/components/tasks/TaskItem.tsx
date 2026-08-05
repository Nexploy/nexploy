'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, CircleSlash, Loader2, X, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Task } from '@workspace/typescript-interface/task';
import { usePermissions } from '@/contexts/PermissionContext';
import { canManageTask, getTaskResource } from '@/lib/tasks/taskPermissions';
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { cn } from '@workspace/ui/lib/utils';
import { onTaskCancelAction } from '@/actions/tasks/cancelTask.action';
import { useTasksStore } from '@/stores/useTasksStore';
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

    const { role, orgRole, organizationId } = usePermissions();
    const dismissTask = useTasksStore((state) => state.dismissTask);
    const environments = useEnvironmentStore((state) => state.environments);
    const selectedEnvironmentId = useEnvironmentStore((state) => state.selectedEnvironmentId);
    const selectEnvironment = useEnvironmentStore((state) => state.selectEnvironment);

    const StatusIcon = STATUS_ICONS[task.status];
    const isRunning = task.status === 'running';
    const canCancel =
        isRunning && task.cancellable && canManageTask({ role: role ?? '', orgRole, organizationId }, task);

    const resultResource = getTaskResource(task.kind);
    const resultEnvironmentId = task.targetEnvironmentId ?? task.environmentId ?? null;
    const needsEnvironmentSwitch = Boolean(resultEnvironmentId && resultEnvironmentId !== selectedEnvironmentId);
    const resultEnvironmentName = environments.find((environment) => environment.id === resultEnvironmentId)?.name;

    const handleCancel = () => {
        startTransition(async () => {
            await onTaskCancelAction({ taskId: task.id });
        });
    };

    const handleDismiss = () => {
        dismissTask(task.id);
    };

    const handleOpenResult = () => {
        if (resultEnvironmentId && resultEnvironmentId !== selectedEnvironmentId) {
            selectEnvironment(resultEnvironmentId);
        }

        onNavigate();
    };

    return (
        <div className="flex flex-col gap-2 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
                <StatusIcon
                    className={cn('mt-0.5 size-4 shrink-0', STATUS_COLORS[task.status], isRunning && 'animate-spin')}
                />
                <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-medium">
                        {t(`kinds.${task.kind}`, { name: task.subjectName })}
                    </p>
                    <p className="text-muted-foreground break-all text-xs">
                        {isRunning && task.currentStepKey
                            ? t(`steps.${task.currentStepKey}`)
                            : t(`status.${task.status}`)}
                        {' · '}
                        {elapsed}
                    </p>
                </div>
                {canCancel && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleCancel}
                        disabled={isPending}
                    >
                        {t('cancel')}
                    </Button>
                )}

                {!isRunning && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={handleDismiss}
                        aria-label={t('dismiss')}
                    >
                        <X className="size-3.5" />
                    </Button>
                )}
            </div>

            {isRunning && <Progress value={task.progress} className="h-1" />}

            {task.error && (
                <p style={{ wordBreak: 'break-word' }} className="text-destructive text-xs">
                    {task.error}
                </p>
            )}

            {task.warnings.length > 0 && (
                <ul className="text-muted-foreground space-y-0.5 text-xs">
                    {task.warnings.map((warning, index) => (
                        <li key={index} style={{ wordBreak: 'break-word' }}>
                            {warning}
                        </li>
                    ))}
                </ul>
            )}

            {task.status === 'succeeded' && task.resultHref && (
                <Link
                    href={task.resultHref}
                    onClick={handleOpenResult}
                    className="text-primary text-xs font-medium hover:underline"
                >
                    {needsEnvironmentSwitch && resultEnvironmentName
                        ? t(`openResultIn.${resultResource}`, { environment: resultEnvironmentName })
                        : t(`openResult.${resultResource}`)}
                </Link>
            )}
        </div>
    );
}
