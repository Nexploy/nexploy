import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@workspace/ui/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm cursor-pointer text-[12px] font-bold tracking-[0.12em] transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default: 'bg-primary text-background hover:bg-primary/90',
                signal: 'bg-foreground  text-primary-foreground hover:bg-accent-10',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/85',
                destructiveGhost: 'text-destructive hover:bg-accent hover:text-destructive',
                outline:
                    'border border-input bg-transparent hover:bg-foreground hover:text-background',
                destructiveOutline:
                    'border border-input bg-transparent hover:border-destructive hover:text-destructive',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'font-sans text-sm font-medium normal-case tracking-normal text-foreground underline-offset-4 hover:underline hover:text-primary',
                white: 'bg-chalk text-base-12 border border-border hover:bg-base-2',
            },
            size: {
                default: 'h-9 px-4 py-2 has-[>svg]:px-3',
                sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
                xs: 'h-7 gap-1.5 px-2.5 text-[11px] has-[>svg]:px-2',
                lg: 'h-10 px-6 has-[>svg]:px-4',
                icon: 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    isLoading = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        isLoading?: boolean;
        icon?: React.ElementType;
    }) {
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        >
            {isLoading ? <Loader2 className="animate-spin" /> : props.icon ? <props.icon /> : null}
            <Slottable>{props.children}</Slottable>
        </Comp>
    );
}

export { Button, buttonVariants };
