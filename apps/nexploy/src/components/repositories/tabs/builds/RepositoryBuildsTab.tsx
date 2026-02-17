import { RepositoryBuild } from '@/components/repositories/tabs/builds/RepositoryBuild';
import { getAllBuildsInngest } from '@/services/inngest/build.inngest.service';
import { getTranslations } from 'next-intl/server';

interface RepositoryOverviewTabProps {
    repositoryId: string;
}

export async function RepositoryBuildsTab({ repositoryId }: RepositoryOverviewTabProps) {
    const builds = await getAllBuildsInngest(repositoryId);
    const t = await getTranslations('repository.builds');

    return (
        <div className="flex flex-col gap-2 px-5">
            <h2 className="text-xl font-semibold">{t('history')}</h2>
            <div className="rounded-md border">
                {builds.length === 0 ? (
                    <div className="text-muted-foreground p-8 text-center text-sm">
                        {t('noBuilds')}
                    </div>
                ) : (
                    <div className="divide-y">
                        {builds.map((build, index) => (
                            <RepositoryBuild
                                key={build.id}
                                index={builds.length - index}
                                repositoryId={repositoryId}
                                build={build}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
