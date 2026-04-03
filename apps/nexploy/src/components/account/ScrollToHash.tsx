'use client';

import { PropsWithChildren, useEffect } from 'react';

export function ScrollToHash({ children }: PropsWithChildren) {
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (!hash) return;

        const el = document.getElementById(hash);
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    return children;
}
