'use client';

import { ReactNode, useEffect } from 'react';
import { useBreadcrumbStore } from '@/stores/useBreadcrumbStore';

export function BreadcrumbProvider({
    segments,
    children,
}: {
    segments: Record<string, string | undefined>;
    children: ReactNode;
}) {
    const setOverrides = useBreadcrumbStore((state) => state.setOverrides);
    const clearOverrides = useBreadcrumbStore((state) => state.clearOverrides);

    useEffect(() => {
        const definedSegments = Object.fromEntries(
            Object.entries(segments).filter(([, value]) => value !== undefined),
        ) as Record<string, string>;

        setOverrides(definedSegments);

        return () => clearOverrides(Object.keys(definedSegments));
    }, [segments, setOverrides, clearOverrides]);

    return <>{children}</>;
}
