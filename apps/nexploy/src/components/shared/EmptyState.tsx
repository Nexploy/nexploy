import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    bordered?: boolean;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, bordered = true, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center gap-3 p-8 text-center',
                bordered && 'rounded-md border',
                className,
            )}
        >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{title}</span>
                {description && <span className="text-muted-foreground text-sm">{description}</span>}
            </div>
            {action}
        </div>
    );
}
