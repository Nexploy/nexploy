import { cn } from '@workspace/ui/lib/utils';
import { ReactNode } from 'react';

export function InsetPanel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'rounded-xl',
                'bg-background border-sidebar-border border-t md:border',
                'rounded-none shadow-none md:rounded-xl md:shadow-sm',
                className,
            )}
        >
            {children}
        </div>
    );
}
