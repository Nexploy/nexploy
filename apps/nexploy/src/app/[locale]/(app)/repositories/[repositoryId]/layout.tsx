import { ReactNode } from 'react';
import { requireRepositoryAccess } from '@/lib/auth/requireRepositoryAccess';

interface RepositoryLayoutProps {
    children: ReactNode;
    params: Promise<{ repositoryId: string }>;
}

export default async function RepositoryLayout({ children, params }: RepositoryLayoutProps) {
    const { repositoryId } = await params;
    await requireRepositoryAccess(repositoryId);

    return children;
}
