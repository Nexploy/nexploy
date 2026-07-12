import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@workspace/ui/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-[11px] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-ring focus-visible:ring-2 aria-invalid:border-destructive transition-colors overflow-hidden',
    {
        variants: {
            variant: {
                default: 'border-border bg-muted text-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
                outline: 'border-border text-foreground [a&]:hover:bg-accent',
                ghost: 'border-none rounded-none',
                warning: 'border-degraded/30 bg-degraded/10 text-degraded',
                online: 'border-online/30 bg-online/10 text-online',
                running: 'border-maintenance/30 bg-maintenance/10 text-maintenance',
                offline: 'border-offline/30 bg-offline/10 text-offline',
                waiting: 'border-border bg-muted text-muted-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'span';

    return (
        <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
