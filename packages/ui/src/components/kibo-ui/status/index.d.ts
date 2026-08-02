import type { ComponentProps, HTMLAttributes } from 'react';
import { Badge } from '@workspace/ui/components/badge';
export type StatusProps = ComponentProps<typeof Badge> & {
    status: 'online' | 'offline' | 'maintenance' | 'degraded' | 'waiting';
};
export declare const Status: ({ className, status, ...props }: StatusProps) => import('react/jsx-runtime').JSX.Element;
export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement>;
export declare const StatusIndicator: ({
    className,
    ...props
}: StatusIndicatorProps) => import('react/jsx-runtime').JSX.Element;
export type StatusLabelProps = HTMLAttributes<HTMLSpanElement>;
export declare const StatusLabel: ({
    className,
    children,
    ...props
}: StatusLabelProps) => import('react/jsx-runtime').JSX.Element;
