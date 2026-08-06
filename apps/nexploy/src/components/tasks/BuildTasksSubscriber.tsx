'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRealtime } from 'inngest/react';
import type { Task } from '@workspace/typescript-interface/task';
import { onGetTokenBuildTasksAction } from '@/actions/inngest/tokenBuildTasks.action';
import { useTasksStore } from '@/stores/useTasksStore';

export function BuildTasksSubscriber() {
    const applyTask = useTasksStore((state) => state.applyTask);
    const replaceTasksOfKind = useTasksStore((state) => state.replaceTasksOfKind);
    const [hasScope, setHasScope] = useState(true);

    useEffect(() => {
        const abortController = new AbortController();

        fetch('/api/tasks/builds', { signal: abortController.signal })
            .then((response) => (response.ok ? response.json() : { tasks: [] }))
            .then((data: { tasks?: Task[] }) => replaceTasksOfKind('build-pipeline', data.tasks ?? []))
            .catch(() => {});

        return () => abortController.abort();
    }, [replaceTasksOfKind]);

    const refreshToken = useCallback(async () => {
        const result = await onGetTokenBuildTasksAction();

        if (!result?.data) {
            setHasScope(false);
            throw new Error('Missing build tasks subscription token');
        }

        return result.data;
    }, []);

    const { messages } = useRealtime({
        enabled: hasScope,
        token: refreshToken,
        autoCloseOnTerminal: false,
    });

    useEffect(() => {
        messages.delta.forEach((message) => {
            const task = (message as { data?: Task }).data;
            if (task) applyTask(task);
        });
    }, [messages.delta, applyTask]);

    return null;
}
