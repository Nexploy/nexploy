import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (
    props?:
        | ({
              variant?:
                  | 'default'
                  | 'destructive'
                  | 'destructiveGhost'
                  | 'destructiveOutline'
                  | 'ghost'
                  | 'link'
                  | 'outline'
                  | 'secondary'
                  | 'white'
                  | null
                  | undefined;
              size?: 'default' | 'icon' | 'icon-sm' | 'lg' | 'sm' | 'xs' | null | undefined;
          } & import('class-variance-authority/types').ClassProp)
        | undefined,
) => string;
declare function Button({
    className,
    variant,
    size,
    asChild,
    isLoading,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
        isLoading?: boolean;
        icon?: React.ElementType;
    }): import('react/jsx-runtime').JSX.Element;
export { Button, buttonVariants };
