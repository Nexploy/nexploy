'use client';

import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useLocalStorage } from 'usehooks-ts';
import { BuildLogEntry } from '@workspace/typescript-interface/inngest/build';

interface UseLogsToolbarOptions {
    logs: BuildLogEntry[];
    downloadFileName: string;
    localStorageKey?: string;
}

export function useLogsToolbar({
    logs,
    downloadFileName,
    localStorageKey = 'timestamp-build-log',
}: UseLogsToolbarOptions) {
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const lastScrollTop = useRef<number>(0);

    const [autoScroll, setAutoScroll] = useState(true);
    const [showTimestamp, setShowTimestamp] = useLocalStorage(localStorageKey, false);

    useEffect(() => {
        const logsContainer = logsContainerRef.current;
        if (!logsContainer) return;

        const handleScroll = () => {
            const scrollHeight = logsContainer.scrollHeight;
            const scrollTop = logsContainer.scrollTop;
            const clientHeight = logsContainer.clientHeight;
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

            if (distanceFromBottom <= 5) {
                setAutoScroll(true);
            } else if (scrollTop < lastScrollTop.current) {
                setAutoScroll(false);
            }

            lastScrollTop.current = scrollTop;
        };

        logsContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => logsContainer.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!autoScroll || !logsEndRef.current) return;

        const rafId = requestAnimationFrame(() => {
            logsEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        });

        return () => cancelAnimationFrame(rafId);
    }, [logs.length, autoScroll]);

    const downloadLogs = () => {
        const logsText = logs
            .map(
                (log) =>
                    `[${dayjs(log.createdAt).toISOString()}] [${log.step}] [${log.level}] ${log.message}`,
            )
            .join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        logsContainerRef,
        logsEndRef,
        showTimestamp,
        setShowTimestamp,
        autoScroll,
        setAutoScroll,
        downloadLogs,
    };
}
