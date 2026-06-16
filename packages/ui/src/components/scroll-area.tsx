'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@workspace/ui/lib/utils';

interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
    thumbColor?: string;
    trackColor?: string;
    viewportClassName?: string;
    scrollbarX?: boolean;
}

function ScrollArea({ className, children, thumbColor, trackColor, viewportClassName, scrollbarX, ...props }: ScrollAreaProps) {
    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn('relative', className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                className={cn('focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1', viewportClassName)}
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar thumbColor={thumbColor} trackColor={trackColor} />
            {scrollbarX && <ScrollBar orientation="horizontal" thumbColor={thumbColor} trackColor={trackColor} />}
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

interface ScrollBarProps
    extends React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
    thumbColor?: string;
    trackColor?: string;
    thumbHoverColor?: string;
}

function ScrollBar({
    className,
    orientation = 'vertical',
    thumbColor,
    trackColor,
    ...props
}: ScrollBarProps) {
    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                'flex touch-none p-px transition-colors select-none',
                orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
                orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
                trackColor,
                className,
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb
                data-slot="scroll-area-thumb"
                className={cn('bg-border hover:bg-accent relative flex-1 rounded-full', thumbColor)}
            />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
}

export { ScrollArea, ScrollBar };
