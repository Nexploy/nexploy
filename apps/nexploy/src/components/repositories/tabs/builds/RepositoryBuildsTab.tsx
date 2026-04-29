import { RepositoryBuild } from '@/components/repositories/tabs/builds/RepositoryBuild';
import { getAllBuilds } from '@/services/inngest/build.inngest.service';
import { getTranslations } from 'next-intl/server';

interface RepositoryOverviewTabProps {
    repositoryId: string;
}

export async function RepositoryBuildsTab({ repositoryId }: RepositoryOverviewTabProps) {
    const [builds, t] = await Promise.all([
        getAllBuilds(repositoryId),
        getTranslations('repository.builds'),
    ]);

    return (
        <div className="flex flex-col gap-2 px-5">
            <h2 className="text-xl font-semibold">{t('history')}</h2>
            {builds.length === 0 ? (
                <div className="rounded-md border">
                    <div className="text-muted-foreground p-8 text-center text-sm">
                        {t('noBuilds')}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col divide-y rounded-md border">
                    {builds.map((build) => (
                        <RepositoryBuild key={build.id} repositoryId={repositoryId} build={build} />
                    ))}
                </div>
            )}
        </div>
    );
}
