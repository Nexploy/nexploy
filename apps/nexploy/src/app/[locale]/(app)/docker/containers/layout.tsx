'use client';

import { useContainerSSE } from '@/hooks/useContainerSSE';

export default async function ContainerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    useContainerSSE('http://localhost:3300');

    return children;
}
