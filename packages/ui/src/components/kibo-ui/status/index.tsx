import type { ComponentProps, HTMLAttributes } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';

export type StatusProps = ComponentProps<typeof Badge> & {
    status: 'online' | 'offline' | 'maintenance' | 'degraded' | 'waiting';
};

export const Status = ({ className, status, ...props }: StatusProps) => (
    <Badge
        className={cn('flex items-center gap-2', 'group', status, className)}
        variant="secondary"
        {...props}
    />
);

export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement>;

export const StatusIndicator = ({ className, ...props }: StatusIndicatorProps) => (
    <span className="relative flex h-2 w-2" {...props}>
        <span
            className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                'group-[.online]:bg-online',
                'group-[.offline]:bg-offline',
                'group-[.maintenance]:bg-maintenance',
                'group-[.degraded]:bg-degraded',
                'group-[.waiting]:bg-waiting',
            )}
        />
        <span
            className={cn(
                'relative inline-flex h-2 w-2 rounded-full',
                'group-[.online]:bg-online',
                'group-[.offline]:bg-offline',
                'group-[.maintenance]:bg-maintenance',
                'group-[.degraded]:bg-degraded',
                'group-[.waiting]:bg-waiting',
            )}
        />
    </span>
);

export type StatusLabelProps = HTMLAttributes<HTMLSpanElement>;

export const StatusLabel = ({ className, children, ...props }: StatusLabelProps) => (
    <span className={cn('text-muted-foreground', className)} {...props}>
        {children ?? (
            <>
                <span className="hidden group-[.online]:block">Online</span>
                <span className="hidden group-[.offline]:block">Offline</span>
                <span className="hidden group-[.maintenance]:block">Maintenance</span>
                <span className="hidden group-[.degraded]:block">Degraded</span>
                <span className="hidden group-[.waiting]:block">Waiting</span>
            </>
        )}
    </span>
);
