import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@workspace/ui/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 aria-disabled:hover:bg-primary',
                destructive:
                    'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 aria-disabled:hover:bg-destructive dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 dark:aria-disabled:hover:bg-destructive/60',
                destructiveGhost:
                    'text-destructive hover:bg-accent hover:text-destructive aria-disabled:hover:bg-transparent dark:hover:bg-accent/50 dark:aria-disabled:hover:bg-transparent',
                outline:
                    'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground aria-disabled:hover:bg-background aria-disabled:hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:aria-disabled:hover:bg-input/30',
                destructiveOutline:
                    'border bg-background shadow-xs hover:bg-accent hover:text-destructive aria-disabled:hover:bg-background aria-disabled:hover:text-destructive dark:border-input dark:bg-input/30 dark:hover:bg-input/50 dark:aria-disabled:hover:bg-input/30',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 aria-disabled:hover:bg-secondary',
                ghost: 'hover:bg-accent hover:text-accent-foreground aria-disabled:hover:bg-transparent dark:hover:bg-accent/50 dark:aria-disabled:hover:bg-transparent',
                link: 'text-primary underline-offset-4 hover:underline aria-disabled:hover:no-underline',
                white: 'border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:bg-gray-100 aria-disabled:active:bg-white aria-disabled:hover:bg-white dark:bg-white/90 dark:text-gray-900 dark:hover:bg-white',
            },
            size: {
                default: 'h-9 px-4 py-2 has-[>svg]:px-3',
                sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
                xs: 'h-7 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
                lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
                icon: 'size-9',
                'icon-sm': 'size-8',
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
        <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
            {isLoading ? <Loader2 className="animate-spin" /> : props.icon ? <props.icon /> : null}
            <Slottable>{props.children}</Slottable>
        </Comp>
    );
}

export { Button, buttonVariants };
