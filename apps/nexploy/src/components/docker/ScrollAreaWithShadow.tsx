'use client';

import { ScrollArea } from '@workspace/ui/components/scroll-area';
import { ComponentPropsWithoutRef, PropsWithChildren, useEffect, useRef, useState } from 'react';

type ScrollAreaProps = ComponentPropsWithoutRef<typeof ScrollArea>;

export function ScrollAreaWithShadow({ children, ...props }: PropsWithChildren<ScrollAreaProps>) {
    const [showTopShadow, setShowTopShadow] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollRef.current?.querySelector(
            '[data-radix-scroll-area-viewport]',
        );

        if (!scrollContainer) return;

        const handleScroll = () => {
            setShowTopShadow(scrollContainer.scrollTop > 10);
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative flex-1 overflow-hidden">
            <div
                className={`from-background via-background/50 pointer-events-none absolute left-0 right-0 top-0 z-10 h-5 bg-gradient-to-b to-transparent transition-opacity duration-200 ${
                    showTopShadow ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <ScrollArea {...props} ref={scrollRef}>
                {children}
            </ScrollArea>
        </div>
    );
}
