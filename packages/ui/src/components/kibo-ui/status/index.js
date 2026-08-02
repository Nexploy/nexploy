import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/components/badge';
export const Status = ({ className, status, ...props }) =>
    _jsx(Badge, {
        className: cn('flex items-center gap-2', 'group', status, className),
        variant: 'secondary',
        ...props,
    });
export const StatusIndicator = ({ className, ...props }) =>
    _jsxs('span', {
        className: 'relative flex h-2 w-2',
        ...props,
        children: [
            _jsx('span', {
                className: cn(
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                    'group-[.online]:bg-online',
                    'group-[.offline]:bg-offline',
                    'group-[.maintenance]:bg-maintenance',
                    'group-[.degraded]:bg-degraded',
                    'group-[.waiting]:bg-waiting',
                ),
            }),
            _jsx('span', {
                className: cn(
                    'relative inline-flex h-2 w-2 rounded-full',
                    'group-[.online]:bg-online',
                    'group-[.offline]:bg-offline',
                    'group-[.maintenance]:bg-maintenance',
                    'group-[.degraded]:bg-degraded',
                    'group-[.waiting]:bg-waiting',
                ),
            }),
        ],
    });
export const StatusLabel = ({ className, children, ...props }) =>
    _jsx('span', {
        className: cn('text-muted-foreground', className),
        ...props,
        children:
            children ??
            _jsxs(_Fragment, {
                children: [
                    _jsx('span', { className: 'hidden group-[.online]:block', children: 'Online' }),
                    _jsx('span', { className: 'hidden group-[.offline]:block', children: 'Offline' }),
                    _jsx('span', { className: 'hidden group-[.maintenance]:block', children: 'Maintenance' }),
                    _jsx('span', { className: 'hidden group-[.degraded]:block', children: 'Degraded' }),
                    _jsx('span', { className: 'hidden group-[.waiting]:block', children: 'Waiting' }),
                ],
            }),
    });
