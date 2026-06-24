import { ReactNode } from 'react';
import { DockerEnvironmentGuard } from '@/components/docker/DockerEnvironmentGuard';

export default function DockerLayout({ children }: Readonly<{ children: ReactNode }>) {
    return <DockerEnvironmentGuard>{children}</DockerEnvironmentGuard>;
}
