'use client';

import { useContainerSSE } from '@/hooks/useContainerSSE';

export default function ContainerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useContainerSSE('/api/containers/events');

    return children;
}
