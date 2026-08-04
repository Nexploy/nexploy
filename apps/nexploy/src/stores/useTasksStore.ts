import { create } from 'zustand';
import { Task, TasksEvent } from '@workspace/typescript-interface/task';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { toast } from 'sonner';
import { clientT } from '@/lib/i18n/clientTranslations';

export interface TasksState {
    tasks: Task[];
    isConnected: boolean;
    unsubscribers: (() => void)[];

    connect: () => void;
    disconnect: () => void;
    upsertTask: (task: Task) => void;
    removeTask: (taskId: string) => void;
    getRunningTasks: () => Task[];
}

const notifyFinished = (task: Task) => {
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

export const useTasksStore = create<TasksState>((set, get) => ({
    tasks: [],
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

    removeTask: (taskId) =>
        set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== taskId),
        })),

    getRunningTasks: () => get().tasks.filter((task) => task.status === 'running'),

    connect: () => {
        if (get().isConnected) return;

        const unsubscribers: (() => void)[] = [];

        unsubscribers.push(
            sseMultiplexer.subscribe('tasks', 'initial-state', (event) => {
                const data: TasksEvent = JSON.parse(event.data);
                set({ tasks: data.tasks ?? [] });
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
                if (!data.task) return;

                const previous = get().tasks.find((candidate) => candidate.id === data.task!.id);
                get().upsertTask(data.task);

                if (previous?.status === 'running' && data.task.status !== 'running') {
                    notifyFinished(data.task);
                }
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
}));
