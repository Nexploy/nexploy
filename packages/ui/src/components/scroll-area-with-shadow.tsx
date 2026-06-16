'use client';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import {
    ComponentPropsWithoutRef,
    forwardRef,
    PropsWithChildren,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { cn } from '@workspace/ui/lib/utils';

type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollArea>;

interface ScrollAreaWithShadowProps extends ScrollAreaProps {
    bottomShadow?: boolean;
    colorShadow?: string;
    thumbColor?: string;
    trackColor?: string;
    orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollAreaWithShadow = forwardRef<
    HTMLDivElement,
    PropsWithChildren<ScrollAreaWithShadowProps>
>(function ScrollAreaWithShadow(
    {
        children,
        bottomShadow = false,
        colorShadow = 'from-background via-background/50',
        orientation = 'vertical',
        className,
        ...props
    },
    forwardedRef,
) {
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const hScrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => viewportRef.current as HTMLDivElement, []);

    useEffect(() => {
        if (orientation === 'horizontal') {
            const el = hScrollRef.current;
            if (!el) return;

            const handleScroll = () => {
                const { scrollLeft, scrollWidth, clientWidth } = el;
                setShowLeftShadow(scrollLeft > 5);
                setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 5);
            };

            handleScroll();
            el.addEventListener('scroll', handleScroll);
            const ro = new ResizeObserver(handleScroll);
            ro.observe(el);
            return () => {
                el.removeEventListener('scroll', handleScroll);
                ro.disconnect();
            };
        }

        const scrollContainer = scrollRef.current?.querySelector(
            '[data-radix-scroll-area-viewport]',
        ) as HTMLDivElement;

        if (!scrollContainer) return;

        viewportRef.current = scrollContainer;

        if (typeof forwardedRef === 'function') {
            forwardedRef(scrollContainer);
        } else if (forwardedRef) {
            forwardedRef.current = scrollContainer;
        }

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } =
                scrollContainer;

            setShowTopShadow(scrollTop > 5);

            const wantsBottomShadow = orientation === 'both' || bottomShadow;
            if (wantsBottomShadow) setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);

            if (orientation === 'both') {
                setShowLeftShadow(scrollLeft > 5);
                setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 5);
            }
        };

        handleScroll();
        scrollContainer.addEventListener('scroll', handleScroll);
        const ro = new ResizeObserver(handleScroll);
        ro.observe(scrollContainer);
        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
            ro.disconnect();
        };
    }, [bottomShadow, forwardedRef, orientation]);

    if (orientation === 'horizontal') {
        return (
            <div className="relative min-w-0 overflow-hidden">
                <div
                    className={cn(
                        'pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 bg-gradient-to-r to-transparent transition-opacity duration-200',
                        colorShadow,
                        showLeftShadow ? 'opacity-100' : 'opacity-0',
                    )}
                />
                <div
                    className={cn(
                        'pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-gradient-to-l to-transparent transition-opacity duration-200',
                        colorShadow,
                        showRightShadow ? 'opacity-100' : 'opacity-0',
                    )}
                />
                <div ref={hScrollRef} className={cn('overflow-x-auto', className)}>
                    {children}
                </div>
            </div>
        );
    }

    const showBottom = orientation === 'both' || bottomShadow;

    return (
        <div className="relative flex-1 overflow-hidden">
            <div
                className={cn(
                    'pointer-events-none absolute top-0 right-0 left-0 z-10 h-5 bg-gradient-to-b to-transparent transition-opacity duration-200',
                    colorShadow,
                    showTopShadow ? 'opacity-100' : 'opacity-0',
                )}
            />
            {showBottom && (
                <div
                    className={cn(
                        'pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-5 rotate-180 bg-gradient-to-b to-transparent transition-opacity duration-200',
                        colorShadow,
                        showBottomShadow ? 'opacity-100' : 'opacity-0',
                    )}
                />
            )}
            {orientation === 'both' && (
                <div
                    className={cn(
                        'pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-5 bg-gradient-to-r to-transparent transition-opacity duration-200',
                        colorShadow,
                        showLeftShadow ? 'opacity-100' : 'opacity-0',
                    )}
                />
            )}
            {orientation === 'both' && (
                <div
                    className={cn(
                        'pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-5 bg-gradient-to-l to-transparent transition-opacity duration-200',
                        colorShadow,
                        showRightShadow ? 'opacity-100' : 'opacity-0',
                    )}
                />
            )}

            <ScrollArea
                className={className}
                scrollbarX={orientation === 'both'}
                {...props}
                ref={scrollRef}
            >
                {children}
            </ScrollArea>
        </div>
    );
});
