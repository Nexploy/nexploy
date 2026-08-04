'use client';

import { useEffect, useState } from 'react';
import { Task } from '@workspace/typescript-interface/task';

const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) return `${seconds}s`;

    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
};

export function useTaskElapsed(task: Task): string {
    const [now, setNow] = useState(() => Date.now());
    const isRunning = task.status === 'running';

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    return formatDuration((task.finishedAt ?? now) - task.startedAt);
}
