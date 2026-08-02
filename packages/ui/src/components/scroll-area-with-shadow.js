'use client';
import { jsx as _jsx } from 'react/jsx-runtime';
import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { cn } from '@workspace/ui/lib/utils';
const FADE_SIZE = 'scroll-fade-5';
export function ScrollAreaWithShadow({
    children,
    bottomShadow = false,
    orientation = 'vertical',
    className,
    viewportClassName,
    ref,
    ...props
}) {
    if (orientation === 'horizontal') {
        return _jsx('div', {
            className: 'relative min-w-0 overflow-hidden',
            children: _jsx('div', {
                ref: ref,
                className: cn('scroll-fade-x overflow-x-auto', FADE_SIZE, className),
                children: children,
            }),
        });
    }
    const fadeClassName =
        orientation === 'both' ? 'scroll-fade-xy' : cn('scroll-fade', !bottomShadow && 'scroll-fade-b-0');
    return _jsx('div', {
        className: 'relative flex-1 overflow-hidden',
        children: _jsx(ScrollArea, {
            className: className,
            viewportClassName: cn(fadeClassName, FADE_SIZE, viewportClassName),
            viewportRef: ref,
            scrollbarX: orientation === 'both',
            ...props,
            children: children,
        }),
    });
}
