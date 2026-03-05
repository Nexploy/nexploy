import { cn } from '@workspace/ui/lib/utils';
import { ReactNode } from 'react';

export function InsetPanel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'bg-background border-sidebar-border border-t md:border',
                'overflow-hidden rounded-none shadow-none md:rounded-xl md:shadow-sm',
                className,
            )}
        >
            {children}
        </div>
    );
}
