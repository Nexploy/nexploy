import { memo } from 'react';
import dayjs from 'dayjs';
import { LogEntry } from '@workspace/typescript-interface/docker/docker.container.logs';
import { parseAnsiColors } from '@/utils/color';

interface LogLineProps {
    log: LogEntry;
    showTimestamp?: boolean;
}

export const LogLine = memo(
    ({ log, showTimestamp = true }: LogLineProps) => {
        const formatTimestamp = (timestamp: string) => {
            try {
                return dayjs(timestamp).format('HH:mm:ss');
            } catch {
                return timestamp;
            }
        };

        return (
            <div className="py-0.5 break-all whitespace-pre-wrap transition-colors duration-75 hover:bg-neutral-900">
                {showTimestamp && (
                    <>
                        <span className="text-neutral-500">[{formatTimestamp(log.timestamp)}]</span>
                    </>
                )}
                <span className={log.stream === 'stderr' ? 'text-destructive' : 'text-green-400'}>[{log.stream}]</span>
                {parseAnsiColors(log.message).map((part, index) => (
                    <span key={index} className={part.color ?? 'text-white'} style={part.style}>
                        {part.text}
                    </span>
                ))}
            </div>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.log === nextProps.log && prevProps.showTimestamp === nextProps.showTimestamp;
    },
);
