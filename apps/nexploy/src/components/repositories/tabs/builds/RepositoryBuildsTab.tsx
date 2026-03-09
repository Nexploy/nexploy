import { RepositoryBuild } from '@/components/repositories/tabs/builds/RepositoryBuild';
import { getAllBuildsInngest } from '@/services/inngest/build.inngest.service';
import { getTranslations } from 'next-intl/server';

interface RepositoryOverviewTabProps {
    repositoryId: string;
}

export async function RepositoryBuildsTab({ repositoryId }: RepositoryOverviewTabProps) {
    const [builds, t] = await Promise.all([
        getAllBuildsInngest(repositoryId),
        getTranslations('repository.builds'),
    ]);

    const groups = builds.reduce<Map<string | null, { name: string; builds: typeof builds }>>(
        (acc, build) => {
            const key = build.environmentId ?? null;
            if (!acc.has(key)) {
                acc.set(key, {
                    name: build.environment?.name ?? t('noEnvironment'),
                    builds: [],
                });
            }
            acc.get(key)!.builds.push(build);
            return acc;
        },
        new Map(),
    );

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
                <div className="flex flex-col gap-4">
                    {Array.from(groups.entries()).map(([key, group]) => (
                        <div key={key ?? 'none'} className="flex flex-col gap-1">
                            <h3 className="text-muted-foreground px-1 text-sm font-medium">
                                {group.name}
                            </h3>
                            <div className="rounded-md border">
                                <div className="divide-y">
                                    {group.builds.map((build, index) => (
                                        <RepositoryBuild
                                            key={build.id}
                                            index={group.builds.length - index}
                                            repositoryId={repositoryId}
                                            build={build}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
