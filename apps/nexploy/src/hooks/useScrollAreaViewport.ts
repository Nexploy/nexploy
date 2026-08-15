'use client';

import { type RefObject, useLayoutEffect, useState } from 'react';

const VIEWPORT_SELECTOR = '[data-slot="scroll-area-viewport"]';

export function useScrollAreaViewport(ref: RefObject<HTMLElement | null>) {
    const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
    const [scrollMargin, setScrollMargin] = useState(0);

    useLayoutEffect(() => {
        const element = ref.current;
        const viewport = element?.closest<HTMLElement>(VIEWPORT_SELECTOR) ?? null;

        setScrollElement(viewport);

        if (!element || !viewport) return;

        setScrollMargin(
            element.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop,
        );
    }, [ref]);

    return { scrollElement, scrollMargin };
}
