import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { Task, TaskKind, TaskStatus, TaskStep, TaskStepStatus, TasksStats } from '@workspace/typescript-interface/task';
import { logger } from '@/utils/logger';

interface CreateTaskInput {
    kind: TaskKind;
    subjectName: string;
    stepKeys: string[];
    environmentId?: string;
    targetEnvironmentId?: string;
    cancellable?: boolean;
}

const MAX_FINISHED_TASKS = 50;
const FINISHED_RETENTION_MS = 30 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;

export class TaskCancelledError extends Error {
    constructor() {
        super('Task cancelled');
        this.name = 'TaskCancelledError';
    }
}

class TasksManager extends EventEmitter {
    private tasks = new Map<string, Task>();
    private controllers = new Map<string, AbortController>();
    private manualProgress = new Set<string>();
    private sweepInterval: NodeJS.Timeout | null = null;

    constructor() {
        super();
        this.setMaxListeners(200);
    }

    create({ kind, subjectName, stepKeys, environmentId, targetEnvironmentId, cancellable = false }: CreateTaskInput): {
        task: Task;
        signal: AbortSignal;
    } {
        const task: Task = {
            id: randomUUID(),
            kind,
            status: 'running',
            subjectName,
            environmentId,
            targetEnvironmentId,
            steps: stepKeys.map((key): TaskStep => ({ key, status: 'pending' })),
            currentStepKey: null,
            progress: 0,
            warnings: [],
            cancellable,
            startedAt: Date.now(),
        };

        const controller = new AbortController();
        this.tasks.set(task.id, task);
        this.controllers.set(task.id, controller);
        this.ensureSweep();

        logger.info({ taskId: task.id, kind, subjectName }, 'Task created');
        this.emit('task-created', task);

        return { task, signal: controller.signal };
    }

    startStep(taskId: string, stepKey: string): void {
        this.patchStep(taskId, stepKey, 'running');
    }

    completeStep(taskId: string, stepKey: string, status: Exclude<TaskStepStatus, 'pending' | 'running'>): void {
        this.patchStep(taskId, stepKey, status);
    }

    setProgress(taskId: string, progress: number): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        const clamped = Math.min(100, Math.max(0, Math.round(progress)));
        this.manualProgress.add(taskId);

        if (task.progress === clamped) return;

        task.progress = clamped;
        this.emit('task-updated', task);
    }

    lockCancellation(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task || !task.cancellable) return;

        task.cancellable = false;
        this.emit('task-updated', task);
    }

    addWarning(taskId: string, warning: string): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.warnings.push(warning);
        this.emit('task-updated', task);
    }

    finish(taskId: string, status: TaskStatus, patch?: { error?: string; resultHref?: string }): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        task.status = status;
        task.currentStepKey = null;
        task.finishedAt = Date.now();
        task.error = patch?.error;
        task.resultHref = patch?.resultHref;

        if (status === 'succeeded') {
            task.progress = 100;
        }

        for (const step of task.steps) {
            if (step.status === 'running' || step.status === 'pending') {
                step.status = status === 'succeeded' ? 'done' : 'skipped';
            }
        }

        this.controllers.delete(taskId);

        logger.info({ taskId, status, error: patch?.error }, 'Task finished');
        this.emit('task-updated', task);
        this.trimFinished();
    }

    cancel(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        const controller = this.controllers.get(taskId);

        if (!task || !controller || task.status !== 'running' || !task.cancellable) {
            return false;
        }

        logger.info({ taskId }, 'Task cancellation requested');
        controller.abort();

        return true;
    }

    remove(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task || task.status === 'running') return false;

        this.tasks.delete(taskId);
        this.manualProgress.delete(taskId);
        this.emit('task-removed', taskId);

        return true;
    }

    clearFinished(): number {
        const finished = this.list().filter((task) => task.status !== 'running');
        finished.forEach((task) => this.remove(task.id));

        return finished.length;
    }

    get(taskId: string): Task | undefined {
        return this.tasks.get(taskId);
    }

    list(): Task[] {
        return Array.from(this.tasks.values()).sort((a, b) => b.startedAt - a.startedAt);
    }

    getStats(): TasksStats {
        const tasks = this.list();

        return {
            total: tasks.length,
            running: tasks.filter((task) => task.status === 'running').length,
        };
    }

    private patchStep(taskId: string, stepKey: string, status: TaskStepStatus): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        const step = task.steps.find((candidate) => candidate.key === stepKey);
        if (!step) return;

        step.status = status;
        task.currentStepKey = status === 'running' ? stepKey : null;

        if (!this.manualProgress.has(taskId)) {
            const settled = task.steps.filter(
                (candidate) => candidate.status === 'done' || candidate.status === 'skipped',
            ).length;
            task.progress = Math.round((settled / task.steps.length) * 100);
        }

        this.emit('task-updated', task);
    }

    private trimFinished(): void {
        const finished = this.list().filter((task) => task.status !== 'running');

        finished.slice(MAX_FINISHED_TASKS).forEach((task) => this.remove(task.id));
    }

    private ensureSweep(): void {
        if (this.sweepInterval) return;

        this.sweepInterval = setInterval(() => {
            const expiry = Date.now() - FINISHED_RETENTION_MS;

            for (const task of this.list()) {
                if (task.status !== 'running' && (task.finishedAt ?? 0) < expiry) {
                    this.remove(task.id);
                }
            }

            if (this.tasks.size === 0 && this.sweepInterval) {
                clearInterval(this.sweepInterval);
                this.sweepInterval = null;
            }
        }, SWEEP_INTERVAL_MS);

        this.sweepInterval.unref?.();
    }
}

export const tasksManager = new TasksManager();
