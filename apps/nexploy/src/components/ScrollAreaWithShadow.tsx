'use client';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { ComponentPropsWithoutRef, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';

type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollArea>;

interface ScrollAreaWithShadowProps extends ScrollAreaProps {
    bottomShadow?: boolean;
    colorShadow?: string;
}

export function ScrollAreaWithShadow({
    children,
    bottomShadow = false,
    colorShadow = 'background',
    ...props
}: PropsWithChildren<ScrollAreaWithShadowProps>) {
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollRef.current?.querySelector(
            '[data-radix-scroll-area-viewport]',
        );

        if (!scrollContainer) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            setShowTopShadow(scrollTop > 10);
            if (bottomShadow) setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 10);
        };

        handleScroll();
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [bottomShadow]);

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
}
