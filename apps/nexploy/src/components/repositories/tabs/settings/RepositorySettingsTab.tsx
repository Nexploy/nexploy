import { getRepositorieById } from '@/services/repository.service';
import { SwitchGitAccountSection } from '@/components/repositories/tabs/settings/SwitchGitAccountSection';
import { ClearCacheButton } from '@/components/repositories/tabs/settings/ClearCacheButton';
import { DeleteRepositoryButton } from '@/components/repositories/tabs/settings/DeleteRepositoryButton';
import { notFound } from 'next/navigation';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon.tsx';
import { OctagonAlert } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card.tsx';
import { getTranslations } from 'next-intl/server';
import { getRepositoryCacheSize } from '@/services/repository/cache.service';

interface RepositorySettingsTabProps {
    repositoryId: string;
}

export async function RepositorySettingsTab({ repositoryId }: RepositorySettingsTabProps) {
    const [repository, cacheSize] = await Promise.all([
        getRepositorieById(repositoryId),
        getRepositoryCacheSize(repositoryId),
    ]);
    if (!repository) return notFound();

    const t = await getTranslations('repository.settings.dangerZone');

    return (
        <div className="mx-5 space-y-6">
            <SwitchGitAccountSection
                repositoryId={repository.id}
                currentGitAccountId={repository.gitAccountId}
            />
            <Card className="border-destructive">
                <CardHeaderWithIcon
                    isDestructive
                    icon={OctagonAlert}
                    title={t('title')}
                    description={t('description')}
                />
                <CardContent className="flex flex-col gap-4">
                    <ClearCacheButton repositoryId={repository.id} cacheSize={cacheSize} />
                    <DeleteRepositoryButton
                        repositoryId={repository.id}
                        repositoryName={repository.name}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
