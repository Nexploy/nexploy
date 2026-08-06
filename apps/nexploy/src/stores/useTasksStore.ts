import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TasksEvent } from '@workspace/typescript-interface/task';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { toast } from 'sonner';
import { clientT } from '@/lib/i18n/clientTranslations';

export interface TasksState {
    tasks: Task[];
    dismissedTaskIds: string[];
    isConnected: boolean;
    unsubscribers: (() => void)[];

    connect: () => void;
    disconnect: () => void;
    upsertTask: (task: Task) => void;
    applyTask: (task: Task) => void;
    replaceTasksOfKind: (kind: Task['kind'], tasks: Task[]) => void;
    removeTask: (taskId: string) => void;
    dismissTask: (taskId: string) => void;
    dismissTasks: (taskIds: string[]) => void;
    getVisibleTasks: () => Task[];
    getRunningTasks: () => Task[];
}

const notifyFinished = (task: Task) => {
    if (task.silent) return;

    const name = task.subjectName;

    if (task.status === 'succeeded') {
        toast.success(clientT('tasks.toasts.succeeded', { name }));
        task.warnings.forEach((warning) => toast.warning(warning));
        return;
    }

    if (task.status === 'failed') {
        toast.error(task.error ?? clientT('tasks.toasts.failed', { name }));
        return;
    }

    if (task.status === 'cancelled') {
        toast.warning(clientT('tasks.toasts.cancelled', { name }));
    }
};

export const useTasksStore = create<TasksState>()(
    persist(
        (set, get) => ({
            tasks: [],
            dismissedTaskIds: [],
            isConnected: false,
            unsubscribers: [],

            upsertTask: (task) =>
                set((state) => {
                    const exists = state.tasks.some((candidate) => candidate.id === task.id);

                    return {
                        tasks: exists
                            ? state.tasks.map((candidate) => (candidate.id === task.id ? task : candidate))
                            : [task, ...state.tasks],
                    };
                }),

            applyTask: (task) => {
                const previous = get().tasks.find((candidate) => candidate.id === task.id);

                get().upsertTask(task);

                if (previous && previous.status === 'running' && task.status !== 'running') {
                    notifyFinished(task);
                }
            },

            replaceTasksOfKind: (kind, tasks) =>
                set((state) => {
                    const liveIds = new Set(tasks.map((task) => task.id));

                    return {
                        tasks: [...tasks, ...state.tasks.filter((task) => task.kind !== kind)],
                        dismissedTaskIds: state.dismissedTaskIds.filter(
                            (taskId) =>
                                liveIds.has(taskId) ||
                                state.tasks.some((task) => task.id === taskId && task.kind !== kind),
                        ),
                    };
                }),

            removeTask: (taskId) =>
                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== taskId),
                    dismissedTaskIds: state.dismissedTaskIds.filter((id) => id !== taskId),
                })),

            dismissTask: (taskId) => get().dismissTasks([taskId]),

            dismissTasks: (taskIds) =>
                set((state) => ({
                    dismissedTaskIds: Array.from(new Set([...state.dismissedTaskIds, ...taskIds])),
                })),

            getVisibleTasks: () => {
                const { tasks, dismissedTaskIds } = get();

                return tasks.filter((task) => !dismissedTaskIds.includes(task.id));
            },

            getRunningTasks: () => get().tasks.filter((task) => task.status === 'running'),

            connect: () => {
                if (get().isConnected) return;

                const unsubscribers: (() => void)[] = [];

                unsubscribers.push(
                    sseMultiplexer.subscribe('tasks', 'initial-state', (event) => {
                        const data: TasksEvent = JSON.parse(event.data);
                        const tasks = data.tasks ?? [];
                        const liveIds = new Set(tasks.map((task) => task.id));

                        set((state) => {
                            const keptTasks = state.tasks.filter((task) => task.kind === 'build-pipeline');
                            keptTasks.forEach((task) => liveIds.add(task.id));

                            return {
                                tasks: [...tasks, ...keptTasks],
                                dismissedTaskIds: state.dismissedTaskIds.filter((taskId) => liveIds.has(taskId)),
                            };
                        });
                    }),
                );

                unsubscribers.push(
                    sseMultiplexer.subscribe('tasks', 'task-created', (event) => {
                        const data: TasksEvent = JSON.parse(event.data);
                        if (data.task) get().upsertTask(data.task);
                    }),
                );

                unsubscribers.push(
                    sseMultiplexer.subscribe('tasks', 'task-updated', (event) => {
                        const data: TasksEvent = JSON.parse(event.data);
                        if (data.task) get().applyTask(data.task);
                    }),
                );

                unsubscribers.push(
                    sseMultiplexer.subscribe('tasks', 'task-removed', (event) => {
                        const data: TasksEvent = JSON.parse(event.data);
                        if (data.taskId) get().removeTask(data.taskId);
                    }),
                );

                set({ unsubscribers, isConnected: true });
            },

            disconnect: () => {
                get().unsubscribers.forEach((unsubscribe) => unsubscribe());
                set({ unsubscribers: [], isConnected: false });
            },
        }),
        {
            name: 'tasks-storage',
            partialize: (state) => ({ dismissedTaskIds: state.dismissedTaskIds }),
        },
    ),
);
