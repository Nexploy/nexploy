import { memo } from 'react';
import { LogEntry } from '@workspace/typescript-interface/docker/docker.container.logs';

interface LogLineProps {
    log: LogEntry;
    showTimestamp?: boolean;
}

export const LogLine = memo(
    ({ log, showTimestamp = true }: LogLineProps) => {
        const formatTimestamp = (timestamp: string) => {
            try {
                const date = new Date(timestamp);
                return date.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
            } catch {
                return timestamp;
            }
        };

        return (
            <div className="py-0.5 break-all whitespace-pre-wrap transition-colors duration-75 hover:bg-neutral-900">
                {showTimestamp && (
                    <>
                        <span className="text-neutral-500">
                            [{formatTimestamp(log.timestamp)}]
                        </span>{' '}
                    </>
                )}
                <span className={log.stream === 'stderr' ? 'text-destructive' : 'text-green-400'}>
                    [{log.stream}]
                </span>{' '}
                <span className="text-white">{log.message}</span>
            </div>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.log === nextProps.log && prevProps.showTimestamp === nextProps.showTimestamp
        );
    },
);
