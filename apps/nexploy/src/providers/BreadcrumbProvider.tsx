'use client';

import { ReactNode, useEffect } from 'react';
import { useBreadcrumbStore } from '@/stores/useBreadcrumbStore';

export function BreadcrumbProvider({
    segments,
    children,
}: {
    segments: Record<string, string>;
    children: ReactNode;
}) {
    const setOverrides = useBreadcrumbStore((state) => state.setOverrides);
    const clearOverrides = useBreadcrumbStore((state) => state.clearOverrides);

    useEffect(() => {
        setOverrides(segments);
        return () => clearOverrides(Object.keys(segments));
    }, [JSON.stringify(segments)]);

    return <>{children}</>;
}
