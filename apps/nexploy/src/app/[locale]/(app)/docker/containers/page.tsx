import type { Metadata } from 'next';
import ContainersStacksPage from '@/components/docker/containers/ContainersPage';

export const metadata: Metadata = {
    title: 'Docker Containers',
    description: 'Manage and monitor your Docker containers, stacks, and standalone instances.',
};

export default function DockerContainersPage() {
    return <ContainersStacksPage />;
}
