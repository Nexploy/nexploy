'use client';

import type { NotificationBadgeNode } from '@workspace/typescript-interface/stores/notificationStore';
import { Badge } from '@workspace/ui/components/badge';
import { cn } from '@workspace/ui/lib/utils';
import { useNotificationBadgeCount } from '@/hooks/useNotificationBadge';

interface NotificationBadgeProps {
    node: NotificationBadgeNode;
    variant?: 'count' | 'dot';
    className?: string;
}

export function NotificationBadge({ node, variant = 'count', className }: NotificationBadgeProps) {
    const count = useNotificationBadgeCount(node);

    if (count === 0) return null;

    if (variant === 'dot')
        return (
            <span
                className={cn('bg-destructive size-2 shrink-0 rounded-full', className)}
                aria-hidden
            />
        );

    return (
        <Badge
            variant="destructive"
            className={cn('h-5 min-w-5 shrink-0 rounded-full px-1.5', className)}
        >
            {count > 99 ? '99+' : count}
        </Badge>
    );
}
