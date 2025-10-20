'use client';

import { PropsWithChildren } from 'react';
import { DockerSSEProvider } from '@/providers/sse/DockerSSEProvider';
import { ContainerSSEProvider } from '@/providers/sse/ContainerSSEProvider';

export function SSEProvider({ children }: PropsWithChildren) {
    return (
        <DockerSSEProvider>
            <ContainerSSEProvider>{children}</ContainerSSEProvider>
        </DockerSSEProvider>
    );
}
