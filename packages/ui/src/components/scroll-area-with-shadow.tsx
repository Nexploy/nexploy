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
}

export const ScrollAreaWithShadow = forwardRef<
    HTMLDivElement,
    PropsWithChildren<ScrollAreaWithShadowProps>
>(function ScrollAreaWithShadow(
    { children, bottomShadow = false, colorShadow = 'background', ...props },
    forwardedRef,
) {
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(forwardedRef, () => viewportRef.current as HTMLDivElement, []);

    useEffect(() => {
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
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            setShowTopShadow(scrollTop > 5);
            if (bottomShadow) setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 5);
        };

        handleScroll();
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [bottomShadow, forwardedRef]);

    return (
        <div className="relative flex-1 overflow-hidden">
            <div
                className={cn(
                    `from-background via-background/50 pointer-events-none absolute top-0 right-0 left-0 z-10 h-5 bg-gradient-to-b to-transparent transition-opacity duration-200`,
                    showTopShadow ? 'opacity-100' : 'opacity-0',
                    colorShadow,
                )}
            />

            {bottomShadow && (
                <div
                    className={cn(
                        `from-background via-background/50 pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-5 rotate-180 bg-gradient-to-b to-transparent transition-opacity duration-200`,
                        showBottomShadow ? 'opacity-100' : 'opacity-0',
                        colorShadow,
                    )}
                />
            )}

            <ScrollArea {...props} ref={scrollRef}>
                {children}
            </ScrollArea>
        </div>
    );
});
