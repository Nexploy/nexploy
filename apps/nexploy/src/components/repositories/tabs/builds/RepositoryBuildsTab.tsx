import { BuildsHistoryList } from '@/components/repositories/tabs/builds/BuildsHistoryList';
import { getBuildsPage } from '@/services/repository/build.service';
import { BUILDS_PAGE_SIZE } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';

interface RepositoryBuildsTabProps {
    repositoryId: string;
    stageId: string;
}

export async function RepositoryBuildsTab({ repositoryId, stageId }: RepositoryBuildsTabProps) {
    const [initialBuilds, t] = await Promise.all([
        getBuildsPage(repositoryId, stageId, undefined, BUILDS_PAGE_SIZE),
        getTranslations('repository.builds'),
    ]);

    return (
        <div className="flex flex-col gap-2 px-5">
            <h2 className="text-xl font-semibold">{t('history')}</h2>
            <BuildsHistoryList
                key={stageId}
                repositoryId={repositoryId}
                stageId={stageId}
                initialBuilds={initialBuilds}
                initialHasMore={initialBuilds.length === BUILDS_PAGE_SIZE}
            />
        </div>
    );
}
