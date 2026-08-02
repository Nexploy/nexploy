import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
interface ScrollAreaProps extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
    thumbColor?: string;
    trackColor?: string;
    viewportClassName?: string;
    viewportRef?: React.Ref<HTMLDivElement>;
    scrollbarX?: boolean;
}
declare function ScrollArea({
    className,
    children,
    thumbColor,
    trackColor,
    viewportClassName,
    viewportRef,
    scrollbarX,
    ...props
}: ScrollAreaProps): import('react/jsx-runtime').JSX.Element;
interface ScrollBarProps extends React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
    thumbColor?: string;
    trackColor?: string;
    thumbHoverColor?: string;
}
declare function ScrollBar({
    className,
    orientation,
    thumbColor,
    trackColor,
    ...props
}: ScrollBarProps): import('react/jsx-runtime').JSX.Element;
export { ScrollArea, ScrollBar };
