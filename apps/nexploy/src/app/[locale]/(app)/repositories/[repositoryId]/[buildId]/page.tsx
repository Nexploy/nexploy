import { notFound } from 'next/navigation';
import { getRepositorieBuildLogs } from '@/services/repository.service';
import { BuildLogs } from '@/components/repositories/tabs/builds/logs/BuildLogs';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';

interface BuildPageProps {
    params: Promise<{
        repositoryId: string;
        buildId: string;
    }>;
}

export default async function BuildPage({ params }: BuildPageProps) {
    const { repositoryId, buildId } = await params;
    const build = await getRepositorieBuildLogs(repositoryId, buildId);
    if (!build) notFound();

    return (
        <BreadcrumbProvider
            segments={{
                repositoryId: build.repository.name,
                buildId: build.commitMessage ?? build.id,
            }}
        >
            <BuildLogs build={build} />
        </BreadcrumbProvider>
    );
}
