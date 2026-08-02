'use client';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@workspace/ui/lib/utils';
function ScrollArea({
    className,
    children,
    thumbColor,
    trackColor,
    viewportClassName,
    viewportRef,
    scrollbarX,
    ...props
}) {
    return _jsxs(ScrollAreaPrimitive.Root, {
        'data-slot': 'scroll-area',
        className: cn('relative', className),
        ...props,
        children: [
            _jsx(ScrollAreaPrimitive.Viewport, {
                ref: viewportRef,
                'data-slot': 'scroll-area-viewport',
                className: cn(
                    'focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
                    viewportClassName,
                ),
                children: children,
            }),
            _jsx(ScrollBar, { thumbColor: thumbColor, trackColor: trackColor }),
            scrollbarX &&
                _jsx(ScrollBar, { orientation: 'horizontal', thumbColor: thumbColor, trackColor: trackColor }),
            _jsx(ScrollAreaPrimitive.Corner, {}),
        ],
    });
}
function ScrollBar({ className, orientation = 'vertical', thumbColor, trackColor, ...props }) {
    return _jsx(ScrollAreaPrimitive.ScrollAreaScrollbar, {
        'data-slot': 'scroll-area-scrollbar',
        orientation: orientation,
        className: cn(
            'flex touch-none p-px transition-colors select-none',
            orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
            orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
            trackColor,
            className,
        ),
        ...props,
        children: _jsx(ScrollAreaPrimitive.ScrollAreaThumb, {
            'data-slot': 'scroll-area-thumb',
            className: cn('bg-border hover:bg-accent relative flex-1 rounded-full', thumbColor),
        }),
    });
}
export { ScrollArea, ScrollBar };
